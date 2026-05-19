package worker

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/rs/zerolog/log"
)

// Существующие константы
const TaskSendVerifyEmail = "task:send_verify_email"
const TaskSendOrderEmail = "task:send_order_email"

// Новые константы для новостной рассылки
const TaskSendNewsletterVerification = "task:send_newsletter_verification"
const TaskSendNewsletterWelcome = "task:send_newsletter_welcome"
const TaskSendNewsletterBroadcast = "task:send_newsletter_broadcast"

const TaskSendAdminWelcome = "task:send_admin_welcome"
const TaskSendAdminPasswordReset = "task:send_admin_password_reset"
const TaskSendAdminPasswordChanged = "task:send_admin_password_changed"
const TaskSendAdminInvite = "task:send_admin_invite"

// Добавь структуру для приглашения админа
type PayloadSendAdminInvite struct {
	Email       string `json:"email"`
	InviteLink  string `json:"invite_link"`
	Role        string `json:"role"`
	InviterName string `json:"inviter_name"`
}

// Структуры для административных email
type PayloadSendAdminWelcome struct {
	Email string `json:"email"`
	Name  string `json:"name"`
}

type PayloadSendAdminPasswordReset struct {
	Email     string `json:"email"`
	Name      string `json:"name"`
	ResetLink string `json:"reset_link"`
}

type PayloadSendAdminPasswordChanged struct {
	Email string `json:"email"`
	Name  string `json:"name"`
}

// Существующие структуры
type PayloadSendVerifyEmail struct {
	Username string `json:"username"`
}

type PayloadSendOrderEmail struct {
	Name         string          `json:"name"`
	SecondName   string          `json:"second_name"`
	Id           int32           `json:"id"`
	Town         string          `json:"town"`
	Street       string          `json:"street"`
	House        string          `json:"house"`
	Flat         string          `json:"flat"`
	Index        string          `json:"index"`
	Phone        string          `json:"phone"`
	DeliveryType db.DeliveryEnum `json:"delivery_type"`
	Email        string          `json:"email"`
	OrderPrice   int             `json:"order_price"`
}

// Новые структуры для новостной рассылки
type PayloadSendNewsletterVerification struct {
	Email    string `json:"email"`
	Token    string `json:"token"`
	Username string `json:"username,omitempty"` // опционально, если есть имя
}

type PayloadSendNewsletterWelcome struct {
	Email    string `json:"email"`
	Username string `json:"username,omitempty"`
}

type PayloadSendNewsletterBroadcast struct {
	Subject string   `json:"subject"`
	Content string   `json:"content"`
	Emails  []string `json:"emails"`
}

// ============ DISTRIBUTORS ============

// Существующие методы
func (distributor *RedisTaskDistributor) DistributeTaskSendVerifyEmail(
	ctx context.Context,
	payload *PayloadSendVerifyEmail,
	opts ...asynq.Option,
) error {
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal task payload: %w", err)
	}

	task := asynq.NewTask(TaskSendVerifyEmail, jsonPayload, opts...)
	info, err := distributor.client.EnqueueContext(ctx, task)
	if err != nil {
		return fmt.Errorf("failed to enqueue task: %w", err)
	}

	log.Info().Str("type", task.Type()).Bytes("payload", task.Payload()).
		Str("queue", info.Queue).Int("max_retry", info.MaxRetry).Msg("enqueued task")
	return nil
}

func (distributor *RedisTaskDistributor) DistributeTaskSendOrderEmail(
	ctx context.Context,
	payload *PayloadSendOrderEmail,
	opts ...asynq.Option,
) error {
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal task payload: %w", err)
	}

	task := asynq.NewTask(TaskSendOrderEmail, jsonPayload, opts...)
	info, err := distributor.client.EnqueueContext(ctx, task)
	if err != nil {
		return fmt.Errorf("failed to enqueue task: %w", err)
	}

	log.Info().Str("type", task.Type()).Bytes("payload", task.Payload()).
		Str("queue", info.Queue).Int("max_retry", info.MaxRetry).Msg("enqueued task")
	return nil
}

// Новые методы для новостной рассылки
func (distributor *RedisTaskDistributor) DistributeTaskSendNewsletterVerification(
	ctx context.Context,
	payload *PayloadSendNewsletterVerification,
	opts ...asynq.Option,
) error {
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal task payload: %w", err)
	}

	task := asynq.NewTask(TaskSendNewsletterVerification, jsonPayload, opts...)
	info, err := distributor.client.EnqueueContext(ctx, task)
	if err != nil {
		return fmt.Errorf("failed to enqueue task: %w", err)
	}

	log.Info().Str("type", task.Type()).Str("email", payload.Email).
		Str("queue", info.Queue).Int("max_retry", info.MaxRetry).Msg("enqueued newsletter verification task")
	return nil
}

func (distributor *RedisTaskDistributor) DistributeTaskSendNewsletterWelcome(
	ctx context.Context,
	payload *PayloadSendNewsletterWelcome,
	opts ...asynq.Option,
) error {
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal task payload: %w", err)
	}

	task := asynq.NewTask(TaskSendNewsletterWelcome, jsonPayload, opts...)
	info, err := distributor.client.EnqueueContext(ctx, task)
	if err != nil {
		return fmt.Errorf("failed to enqueue task: %w", err)
	}

	log.Info().Str("type", task.Type()).Str("email", payload.Email).
		Str("queue", info.Queue).Int("max_retry", info.MaxRetry).Msg("enqueued newsletter welcome task")
	return nil
}
func (distributor *RedisTaskDistributor) DistributeTaskSendAdminInvite(
	ctx context.Context,
	payload *PayloadSendAdminInvite,
	opts ...asynq.Option,
) error {
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal task payload: %w", err)
	}

	task := asynq.NewTask(TaskSendAdminInvite, jsonPayload, opts...)
	info, err := distributor.client.EnqueueContext(ctx, task)
	if err != nil {
		return fmt.Errorf("failed to enqueue task: %w", err)
	}

	log.Info().Str("type", task.Type()).Str("email", payload.Email).
		Str("queue", info.Queue).Int("max_retry", info.MaxRetry).Msg("enqueued admin invite task")
	return nil
}
func (distributor *RedisTaskDistributor) DistributeTaskSendNewsletterBroadcast(
	ctx context.Context,
	payload *PayloadSendNewsletterBroadcast,
	opts ...asynq.Option,
) error {
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal task payload: %w", err)
	}

	task := asynq.NewTask(TaskSendNewsletterBroadcast, jsonPayload, opts...)
	info, err := distributor.client.EnqueueContext(ctx, task)
	if err != nil {
		return fmt.Errorf("failed to enqueue task: %w", err)
	}

	log.Info().Str("type", task.Type()).Int("recipients", len(payload.Emails)).
		Str("queue", info.Queue).Int("max_retry", info.MaxRetry).Msg("enqueued newsletter broadcast task")
	return nil
}

// worker/distributor.go

func (distributor *RedisTaskDistributor) DistributeTaskSendAdminWelcome(
	ctx context.Context,
	payload *PayloadSendAdminWelcome,
	opts ...asynq.Option,
) error {
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal task payload: %w", err)
	}

	task := asynq.NewTask(TaskSendAdminWelcome, jsonPayload, opts...)
	info, err := distributor.client.EnqueueContext(ctx, task)
	if err != nil {
		return fmt.Errorf("failed to enqueue task: %w", err)
	}

	log.Info().Str("type", task.Type()).Str("email", payload.Email).
		Str("queue", info.Queue).Int("max_retry", info.MaxRetry).Msg("enqueued admin welcome task")
	return nil
}

func (distributor *RedisTaskDistributor) DistributeTaskSendAdminPasswordReset(
	ctx context.Context,
	payload *PayloadSendAdminPasswordReset,
	opts ...asynq.Option,
) error {
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal task payload: %w", err)
	}

	task := asynq.NewTask(TaskSendAdminPasswordReset, jsonPayload, opts...)
	info, err := distributor.client.EnqueueContext(ctx, task)
	if err != nil {
		return fmt.Errorf("failed to enqueue task: %w", err)
	}

	log.Info().Str("type", task.Type()).Str("email", payload.Email).
		Str("queue", info.Queue).Int("max_retry", info.MaxRetry).Msg("enqueued admin password reset task")
	return nil
}

func (distributor *RedisTaskDistributor) DistributeTaskSendAdminPasswordChanged(
	ctx context.Context,
	payload *PayloadSendAdminPasswordChanged,
	opts ...asynq.Option,
) error {
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal task payload: %w", err)
	}

	task := asynq.NewTask(TaskSendAdminPasswordChanged, jsonPayload, opts...)
	info, err := distributor.client.EnqueueContext(ctx, task)
	if err != nil {
		return fmt.Errorf("failed to enqueue task: %w", err)
	}

	log.Info().Str("type", task.Type()).Str("email", payload.Email).
		Str("queue", info.Queue).Int("max_retry", info.MaxRetry).Msg("enqueued admin password changed task")
	return nil
}

// ============ PROCESSORS ============

// Существующие методы
func (processor *RedisTaskProcessor) ProcessTaskSendVerifyEmail(ctx context.Context, task *asynq.Task) error {
	// var payload PayloadSendVerifyEmail
	// if err := json.Unmarshal(task.Payload(), &payload); err != nil {
	// 	return fmt.Errorf("failed to unmarshal payload: %w", asynq.SkipRetry)
	// }

	// user, err := processor.store.GetUser(ctx, payload.Username)
	// if err != nil {
	// 	return fmt.Errorf("failed to get user: %w", err)
	// }

	// verifyEmail, err := processor.store.CreateVerifyEmail(ctx, db.CreateVerifyEmailParams{
	// 	Username:   user.Username,
	// 	Email:      user.Email,
	// 	SecretCode: generateRandomString(32), // используйте вашу функцию util.RandomString
	// })
	// if err != nil {
	// 	return fmt.Errorf("failed to create verify email: %w", err)
	// }

	// subject := "Welcome to Troyki Sail - Verify Your Email"
	// verifyUrl := fmt.Sprintf("http://localhost:3000/verify-email/%d/%s", verifyEmail.ID, verifyEmail.SecretCode)

	// content := fmt.Sprintf(`
	// 	<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
	// 		<h2>Welcome to Troyki Sail!</h2>
	// 		<p>Hello %s,</p>
	// 		<p>Thank you for registering with us! Please verify your email address by clicking the button below:</p>
	// 		<div style="text-align: center; margin: 30px 0;">
	// 			<a href="%s" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
	// 				Verify Email
	// 			</a>
	// 		</div>
	// 		<p>This link will expire in 24 hours.</p>
	// 		<p>If you didn't create an account, please ignore this email.</p>
	// 	</div>
	// `, user.FullName, verifyUrl)

	// to := []string{user.Email}
	// err = processor.mailer.SendEmail(subject, content, to, nil, nil, nil)
	// if err != nil {
	// 	return fmt.Errorf("failed to send verify email: %w", err)
	// }

	// log.Info().Str("type", task.Type()).Str("email", user.Email).Msg("processed task")
	return nil
}

func (processor *RedisTaskProcessor) ProcessTaskSendOrderEmail(ctx context.Context, task *asynq.Task) error {
	var payload PayloadSendOrderEmail
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", asynq.SkipRetry)
	}

	subject := "Your Order Confirmation - Troyki Sail"
	content := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2>Thank you for your order!</h2>
			<p>Hello %s %s,</p>
			<p>Your order #%d has been confirmed.</p>
			
			<h3>Order Details:</h3>
			<table style="width: 100%%; border-collapse: collapse;">
				<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">%s %s</td></tr>
				<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Delivery Address:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">%s, %s %s, apt %s</td></tr>
				<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Postal Code:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">%s</td></tr>
				<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Delivery Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">%s</td></tr>
				<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">%s</td></tr>
				<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Order Total:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>$%d</strong></td></tr>
			</table>
			
			<p>We'll notify you when your order is shipped.</p>
			<p>If you have any questions, please contact us at support@troikisail.com</p>
			<hr />
			<p style="font-size: 12px; color: #666;">Troyki Sail - Your trusted partner</p>
		</div>
	`,
		payload.Name,
		payload.SecondName,
		payload.Id,
		payload.Name,
		payload.SecondName,
		payload.Town,
		payload.Street,
		payload.House,
		payload.Flat,
		payload.Index,
		payload.DeliveryType,
		payload.Phone,
		payload.OrderPrice,
	)

	to := []string{payload.Email}
	err := processor.mailer.SendEmail(subject, content, to, nil, nil, nil)
	if err != nil {
		return fmt.Errorf("failed to send order email: %w", err)
	}

	log.Info().Str("type", task.Type()).Int("order_id", int(payload.Id)).
		Str("email", payload.Email).Msg("processed task")
	return nil
}

// Новые методы для новостной рассылки
func (processor *RedisTaskProcessor) ProcessTaskSendNewsletterVerification(ctx context.Context, task *asynq.Task) error {
	var payload PayloadSendNewsletterVerification
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", asynq.SkipRetry)
	}

	subject := "Confirm Your Newsletter Subscription - Troyki Sail"

	// URL для подтверждения (фронтенд)
	verifyUrl := fmt.Sprintf("http://localhost:3000/newsletter/verify/%s", payload.Token)

	var greeting string
	if payload.Username != "" {
		greeting = fmt.Sprintf("Hello %s,", payload.Username)
	} else {
		greeting = "Hello,"
	}

	content := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2>Confirm Your Subscription</h2>
			<p>%s</p>
			<p>You're receiving this email because someone (hopefully you) subscribed to receive news and updates from Troyki Sail.</p>
			<p>If this was you, please click the button below to confirm your subscription:</p>
			<div style="text-align: center; margin: 30px 0;">
				<a href="%s" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
					Confirm Subscription
				</a>
			</div>
			<p><strong>Important:</strong> This link will expire in 24 hours.</p>
			<p>If you didn't request this, please ignore this email. You won't receive any newsletters from us unless you confirm.</p>
			<hr />
			<p style="font-size: 12px; color: #666;">Troyki Sail - Quality products, fast delivery</p>
		</div>
	`, greeting, verifyUrl)

	to := []string{payload.Email}
	err := processor.mailer.SendEmail(subject, content, to, nil, nil, nil)
	if err != nil {
		return fmt.Errorf("failed to send newsletter verification email: %w", err)
	}

	log.Info().Str("type", task.Type()).Str("email", payload.Email).
		Str("token", payload.Token).Msg("sent newsletter verification email")
	return nil
}

func (processor *RedisTaskProcessor) ProcessTaskSendNewsletterWelcome(ctx context.Context, task *asynq.Task) error {
	var payload PayloadSendNewsletterWelcome
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", asynq.SkipRetry)
	}

	subject := "Welcome to Troyki Sail Newsletter!"

	var greeting string
	if payload.Username != "" {
		greeting = fmt.Sprintf("Hello %s,", payload.Username)
	} else {
		greeting = "Hello,"
	}

	content := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2>Welcome to our Newsletter Community! 🎉</h2>
			<p>%s</p>
			<p>Thank you for confirming your subscription! You're now officially part of the Troyki Sail community.</p>
			
			<h3>What to expect:</h3>
			<ul>
				<li>✨ Exclusive promotions and discounts</li>
				<li>📦 New product announcements</li>
				<li>🎁 Special birthday offers</li>
				<li>📰 Company news and updates</li>
			</ul>
			
			<p>We promise to send only high-quality content and won't spam your inbox.</p>
			
			<p>To ensure you don't miss any updates, please add our email to your address book.</p>
			
			<p>You can unsubscribe at any time by clicking the "Unsubscribe" link at the bottom of any email.</p>
			
			<p>Best regards,<br/>The Troyki Sail Team</p>
			
			<hr />
			<p style="font-size: 12px; color: #666;">
				You received this email because you confirmed your subscription to Troyki Sail newsletter.<br/>
				<a href="http://localhost:3000/newsletter/unsubscribe?email=%s" style="color: #666;">Unsubscribe</a>
			</p>
		</div>
	`, greeting, payload.Email)

	to := []string{payload.Email}
	err := processor.mailer.SendEmail(subject, content, to, nil, nil, nil)
	if err != nil {
		return fmt.Errorf("failed to send welcome email: %w", err)
	}

	log.Info().Str("type", task.Type()).Str("email", payload.Email).Msg("sent welcome email")
	return nil
}

func (processor *RedisTaskProcessor) ProcessTaskSendNewsletterBroadcast(ctx context.Context, task *asynq.Task) error {
	var payload PayloadSendNewsletterBroadcast
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", asynq.SkipRetry)
	}

	// Отправляем письма всем подписчикам
	successCount := 0
	failCount := 0

	for _, email := range payload.Emails {
		contentWithUnsubscribe := fmt.Sprintf(`
			%s
			<hr />
			<p style="font-size: 12px; color: #666;">
				You received this email because you're subscribed to Troyki Sail newsletter.<br/>
				<a href="http://localhost:3000/newsletter/unsubscribe?email=%s" style="color: #666;">Unsubscribe</a>
			</p>
		`, payload.Content, email)

		to := []string{email}
		err := processor.mailer.SendEmail(payload.Subject, contentWithUnsubscribe, to, nil, nil, nil)
		if err != nil {
			log.Error().Err(err).Str("email", email).Msg("failed to send broadcast email")
			failCount++
		} else {
			successCount++
		}
	}

	log.Info().Str("type", task.Type()).
		Int("success", successCount).
		Int("failed", failCount).
		Int("total", len(payload.Emails)).
		Msg("completed newsletter broadcast")

	if failCount > 0 {
		return fmt.Errorf("failed to send %d out of %d emails", failCount, len(payload.Emails))
	}
	return nil
}

// worker/processor.go

func (processor *RedisTaskProcessor) ProcessTaskSendAdminWelcome(ctx context.Context, task *asynq.Task) error {
	var payload PayloadSendAdminWelcome
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", asynq.SkipRetry)
	}

	subject := "Welcome to Troyki Sail Admin Panel"

	content := fmt.Sprintf(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to the Admin Panel!</h2>
            <p>Hello <strong>%s</strong>,</p>
            <p>Your administrator account has been created successfully.</p>
            
            <h3>Account Details:</h3>
            <table style="width: 100%%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">%s</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Role:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Administrator</td>
                </tr>
            </table>
            
            <p>You can now log in to the admin panel and start managing the store.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/admin/login" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    Go to Admin Panel
                </a>
            </div>
            
            <p>For security reasons, please change your password after your first login.</p>
            
            <p>Best regards,<br/>The Troyki Sail Team</p>
        </div>
    `, payload.Name, payload.Email)

	to := []string{payload.Email}
	err := processor.mailer.SendEmail(subject, content, to, nil, nil, nil)
	if err != nil {
		return fmt.Errorf("failed to send admin welcome email: %w", err)
	}

	log.Info().Str("type", task.Type()).Str("email", payload.Email).Msg("sent admin welcome email")
	return nil
}

func (processor *RedisTaskProcessor) ProcessTaskSendAdminPasswordReset(ctx context.Context, task *asynq.Task) error {
	var payload PayloadSendAdminPasswordReset
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", asynq.SkipRetry)
	}

	subject := "Password Reset Request - Troyki Sail Admin Panel"

	content := fmt.Sprintf(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Hello <strong>%s</strong>,</p>
            <p>We received a request to reset your password for the admin panel.</p>
            
            <p>If you made this request, please click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="%s" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    Reset Password
                </a>
            </div>
            
            <p><strong>Important:</strong> This link will expire in 1 hour.</p>
            
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            
            <p>For security reasons, never share this link with anyone.</p>
            
            <p>Best regards,<br/>The Troyki Sail Team</p>
            
            <hr />
            <p style="font-size: 12px; color: #666;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                %s
            </p>
        </div>
    `, payload.Name, payload.ResetLink, payload.ResetLink)

	to := []string{payload.Email}
	err := processor.mailer.SendEmail(subject, content, to, nil, nil, nil)
	if err != nil {
		return fmt.Errorf("failed to send admin password reset email: %w", err)
	}

	log.Info().Str("type", task.Type()).Str("email", payload.Email).Msg("sent admin password reset email")
	return nil
}

func (processor *RedisTaskProcessor) ProcessTaskSendAdminPasswordChanged(ctx context.Context, task *asynq.Task) error {
	var payload PayloadSendAdminPasswordChanged
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", asynq.SkipRetry)
	}

	subject := "Password Changed - Troyki Sail Admin Panel"

	content := fmt.Sprintf(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Changed</h2>
            <p>Hello <strong>%s</strong>,</p>
            <p>Your admin panel password has been successfully changed.</p>
            
            <p>If you made this change, no further action is needed.</p>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;">
                    <strong>⚠️ Security Notice:</strong> If you did not change your password, please contact support immediately.
                </p>
            </div>
            
            <p>Best regards,<br/>The Troyki Sail Team</p>
        </div>
    `, payload.Name)

	to := []string{payload.Email}
	err := processor.mailer.SendEmail(subject, content, to, nil, nil, nil)
	if err != nil {
		return fmt.Errorf("failed to send admin password changed email: %w", err)
	}

	log.Info().Str("type", task.Type()).Str("email", payload.Email).Msg("sent admin password changed email")
	return nil
}
func (processor *RedisTaskProcessor) ProcessTaskSendAdminInvite(ctx context.Context, task *asynq.Task) error {
	var payload PayloadSendAdminInvite
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", asynq.SkipRetry)
	}

	subject := "You've been invited to join Troyki Sail Admin Panel"

	var roleText string
	switch payload.Role {
	case "superadmin":
		roleText = "Super Administrator"
	default:
		roleText = "Administrator"
	}

	content := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<div style="background-color: #4CAF50; padding: 20px; text-align: center;">
				<h1 style="color: white; margin: 0;">You're Invited!</h1>
			</div>
			
			<div style="padding: 20px; background-color: #f9f9f9;">
				<p>Hello,</p>
				
				<p><strong>%s</strong> has invited you to join the <strong>Troyki Sail</strong> admin panel as a <strong>%s</strong>.</p>
				
				<div style="background-color: white; border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin: 20px 0;">
					<h3 style="margin-top: 0;">Your Invitation Details:</h3>
					<table style="width: 100%%; border-collapse: collapse;">
						<tr>
							<td style="padding: 8px 0;"><strong>Email:</strong></td>
							<td style="padding: 8px 0;">%s</td>
						</tr>
						<tr>
							<td style="padding: 8px 0;"><strong>Role:</strong></td>
							<td style="padding: 8px 0;">%s</td>
						</tr>
						<tr>
							<td style="padding: 8px 0;"><strong>Invited by:</strong></td>
							<td style="padding: 8px 0;">%s</td>
						</tr>
					</table>
				</div>
				
				<p>To accept this invitation and set up your account, please click the button below:</p>
				
				<div style="text-align: center; margin: 30px 0;">
					<a href="%s" style="background-color: #4CAF50; color: white; padding: 16px 32px; text-decoration: none; border-radius: 4px; font-size: 16px; display: inline-block;">
						Accept Invitation
					</a>
				</div>
				
				<div style="background-color: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 4px; margin: 20px 0;">
					<p style="margin: 0; color: #856404;">
						<strong>⚠️ Important:</strong> This invitation link will expire in 48 hours for security reasons.
					</p>
				</div>
				
				<p>If you weren't expecting this invitation or believe it was sent by mistake, you can safely ignore this email.</p>
				
				<p>Best regards,<br/>The Troyki Sail Team</p>
			</div>
			
			<hr />
			<p style="font-size: 12px; color: #666; text-align: center;">
				If the button doesn't work, copy and paste this link into your browser:<br/>
				<small>%s</small>
			</p>
		</div>
	`,
		payload.InviterName,
		roleText,
		payload.Email,
		roleText,
		payload.InviterName,
		payload.InviteLink,
		payload.InviteLink,
	)

	to := []string{payload.Email}
	err := processor.mailer.SendEmail(subject, content, to, nil, nil, nil)
	if err != nil {
		return fmt.Errorf("failed to send admin invite email: %w", err)
	}

	log.Info().Str("type", task.Type()).Str("email", payload.Email).
		Str("role", payload.Role).Str("inviter", payload.InviterName).
		Msg("sent admin invite email")
	return nil
}
