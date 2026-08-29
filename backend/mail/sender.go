package mail

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
	"strings"
	"time"

	"github.com/jordan-wright/email"
)

type EmailSender interface {
	SendEmail(
		subject string,
		content string,
		to []string,
		cc []string,
		bcc []string,
		attachFiles []string,
	) error
}

type GmailSender struct {
	name              string
	fromEmailAddress  string
	fromEmailPassword string
	smtpAuthAddress   string
	smtpServerAddress string
}

func NewGmailSender(
	name string,
	fromEmailAddress string,
	fromEmailPassword string,
	smtpAuthAddress string,
	smtpServerAddress string,
) EmailSender {
	return &GmailSender{
		name:              name,
		fromEmailAddress:  fromEmailAddress,
		fromEmailPassword: fromEmailPassword,
		smtpAuthAddress:   smtpAuthAddress,
		smtpServerAddress: smtpServerAddress,
	}
}

func (sender *GmailSender) SendEmail(
	subject string,
	content string,
	to []string,
	cc []string,
	bcc []string,
	attachFiles []string,
) error {
	fmt.Println("========================================")
	fmt.Println("📧 НАЧАЛО ОТПРАВКИ ПИСЬМА")
	fmt.Println("========================================")
	fmt.Printf("Отправитель: %s\n", sender.fromEmailAddress)
	fmt.Printf("SMTP сервер: %s\n", sender.smtpServerAddress)
	fmt.Printf("SMTP auth: %s\n", sender.smtpAuthAddress)
	fmt.Printf("Получатели: %v\n", to)
	fmt.Printf("Тема: %s\n", subject)
	fmt.Println("========================================")

	// Проверка подключения к SMTP серверу
	fmt.Println("🔍 Проверка подключения к серверу...")
	conn, err := net.DialTimeout("tcp", sender.smtpServerAddress, 10*time.Second)
	if err != nil {
		fmt.Printf("❌ Ошибка подключения: %v\n", err)
		return fmt.Errorf("failed to connect to SMTP server: %w", err)
	}
	fmt.Println("✅ Подключение установлено")
	conn.Close()

	// Создаем письмо
	e := email.NewEmail()
	e.From = fmt.Sprintf("%s <%s>", sender.name, sender.fromEmailAddress)
	e.Subject = subject
	e.HTML = []byte(content)
	e.To = to
	e.Cc = cc
	e.Bcc = bcc

	// Вложения
	for _, f := range attachFiles {
		fmt.Printf("📎 Прикрепляем файл: %s\n", f)
		_, err := e.AttachFile(f)
		if err != nil {
			return fmt.Errorf("failed to attach file %s: %w", f, err)
		}
	}

	fmt.Println("🔐 Аутентификация...")
	smtpAuth := smtp.PlainAuth("", sender.fromEmailAddress, sender.fromEmailPassword, sender.smtpAuthAddress)
	fmt.Println("✅ Аутентификация настроена")

	fmt.Printf("📤 Отправка через: %s\n", sender.smtpServerAddress)

	// Пробуем отправить
	addr := sender.smtpServerAddress

	// Проверяем порт
	if strings.Contains(addr, ":587") {
		fmt.Println("🔄 Используем STARTTLS (порт 587)")
		fmt.Println("📤 Вызов e.Send()...")

		// Добавляем лог перед отправкой
		fmt.Printf("Параметры Send: addr=%s, auth=%v\n", addr, smtpAuth != nil)

		err := e.Send(addr, smtpAuth)
		if err != nil {
			fmt.Printf("❌ Ошибка e.Send(): %v\n", err)
			fmt.Printf("Тип ошибки: %T\n", err)

			// Пробуем альтернативный способ
			fmt.Println("🔄 Пробуем альтернативный способ...")
			err2 := sendWithNetSMTP(sender, subject, content, to, cc, bcc, attachFiles)
			if err2 != nil {
				return fmt.Errorf("both methods failed: Send error: %v, net/smtp error: %v", err, err2)
			}
			fmt.Println("✅ Альтернативный способ сработал!")
			return nil
		}

		fmt.Println("✅ Письмо отправлено через e.Send()!")
		return nil
	}

	if strings.Contains(addr, ":465") {
		fmt.Println("🔒 Используем SSL/TLS (порт 465)")
		tlsConfig := &tls.Config{
			ServerName:         sender.smtpAuthAddress,
			InsecureSkipVerify: true,
		}
		fmt.Println("📤 Вызов e.SendWithTLS()...")
		err := e.SendWithTLS(addr, smtpAuth, tlsConfig)
		if err != nil {
			fmt.Printf("❌ Ошибка e.SendWithTLS(): %v\n", err)
			return err
		}
		fmt.Println("✅ Письмо отправлено через e.SendWithTLS()!")
		return nil
	}

	fmt.Printf("⚠️ Неизвестный порт в адресе: %s\n", addr)
	return fmt.Errorf("unknown port in address: %s", addr)
}

// Альтернативный способ через net/smtp
func sendWithNetSMTP(sender *GmailSender, subject string, content string, to []string, cc []string, bcc []string, attachFiles []string) error {
	fmt.Println("🔄 Используем net/smtp для отправки...")

	// Разделяем хост и порт
	parts := strings.Split(sender.smtpServerAddress, ":")
	host := parts[0]
	port := parts[1]

	fmt.Printf("Хост: %s, Порт: %s\n", host, port)

	// Формируем сообщение
	msg := fmt.Sprintf("From: %s <%s>\r\n", sender.name, sender.fromEmailAddress)
	msg += fmt.Sprintf("To: %s\r\n", strings.Join(to, ", "))
	if len(cc) > 0 {
		msg += fmt.Sprintf("Cc: %s\r\n", strings.Join(cc, ", "))
	}
	if len(bcc) > 0 {
		msg += fmt.Sprintf("Bcc: %s\r\n", strings.Join(bcc, ", "))
	}
	msg += fmt.Sprintf("Subject: %s\r\n", subject)
	msg += "MIME-Version: 1.0\r\n"
	msg += "Content-Type: text/html; charset=UTF-8\r\n"
	msg += "\r\n" + content

	// Аутентификация
	auth := smtp.PlainAuth("", sender.fromEmailAddress, sender.fromEmailPassword, host)

	// Отправка
	fmt.Printf("📤 Отправка через smtp.SendMail(%s, auth, %s, %v, msg)\n", sender.smtpServerAddress, sender.fromEmailAddress, to)

	err := smtp.SendMail(sender.smtpServerAddress, auth, sender.fromEmailAddress, to, []byte(msg))
	if err != nil {
		fmt.Printf("❌ Ошибка smtp.SendMail: %v\n", err)
		return err
	}

	fmt.Println("✅ Письмо отправлено через net/smtp!")
	return nil
}
