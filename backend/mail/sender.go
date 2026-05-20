package mail

import (
	"crypto/tls"
	"fmt"
	"net/smtp"
	"strings"

	"github.com/jordan-wright/email"
)

// const (
// 	smtpAuthAddress   = "smtp.gmail.com"
// 	smtpServerAddress = "smtp.gmail.com:587"
// )

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
	smtpAuthAddress   string // добавить
	smtpServerAddress string // добавить
}

func NewGmailSender(
	name string,
	fromEmailAddress string,
	fromEmailPassword string,
	smtpAuthAddress string, // новый параметр
	smtpServerAddress string, // новый параметр
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
	e := email.NewEmail()
	fmt.Println("Sender name:", sender.fromEmailAddress)
	e.From = fmt.Sprintf("%s <%s>", sender.name, sender.fromEmailAddress)
	e.Subject = subject
	e.HTML = []byte(content)

	e.To = to
	e.Cc = cc
	e.Bcc = bcc

	fmt.Println("test")

	for _, f := range attachFiles {
		_, err := e.AttachFile(f)
		if err != nil {
			return fmt.Errorf("failed to attach file %s: %w", f, err)
		}
	}
	fmt.Println("test1")
	smtpAuth := smtp.PlainAuth("", sender.fromEmailAddress, sender.fromEmailPassword, sender.smtpAuthAddress)
	fmt.Println("test2")
	fmt.Println("Sending email to:", sender.smtpServerAddress)

	// Определяем порт из адреса
	addr := sender.smtpServerAddress

	// Для порта 465 используем SendWithTLS
	if strings.Contains(addr, ":465") {
		fmt.Println("Using SSL/TLS for port 465")
		return e.SendWithTLS(addr, smtpAuth, &tls.Config{
			ServerName: sender.smtpAuthAddress, // используем из конфига
		})
	}

	// Для порта 587 используем обычный Send
	fmt.Println("Using STARTTLS for port 587")
	return e.Send(addr, smtpAuth)
}
