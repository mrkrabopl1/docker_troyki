package worker

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/rs/zerolog/log"
)

const TaskSendVerifyEmail = "task:send_verify_email"
const TaskSendOrderEmail = "task:send_order_email"

type PayloadSendVerifyEmail struct {
	Username string `json:"username"`
}

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
	// 	SecretCode: util.RandomString(32),
	// })
	// if err != nil {
	// 	return fmt.Errorf("failed to create verify email: %w", err)
	// }

	// subject := "Welcome to Simple Bank"
	// // TODO: replace this URL with an environment variable that points to a front-end page
	// verifyUrl := fmt.Sprintf("http://localhost:8080/v1/verify_email?email_id=%d&secret_code=%s",
	// 	verifyEmail.ID, verifyEmail.SecretCode)
	// content := fmt.Sprintf(`Hello %s,<br/>
	// Thank you for registering with us!<br/>
	// Please <a href="%s">click here</a> to verify your email address.<br/>
	// `, user.FullName, verifyUrl)
	// to := []string{user.Email}

	// err = processor.mailer.SendEmail(subject, content, to, nil, nil, nil)
	// if err != nil {
	// 	return fmt.Errorf("failed to send verify email: %w", err)
	// }

	// log.Info().Str("type", task.Type()).Bytes("payload", task.Payload()).
	// 	Str("email", user.Email).Msg("processed task")
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

func (processor *RedisTaskProcessor) ProcessTaskSendOrderEmail(ctx context.Context, task *asynq.Task) error {
	var payload PayloadSendOrderEmail
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", asynq.SkipRetry)
	}

	subject := "Welcome to Troyki Sail"
	content := fmt.Sprintf(`Hello %s,<br/>
	Thank you for youre order!<br/>
	Your order number is <a href="%d">.<br/>
	Your order info is <br/>
	First name: %s<br/>
	Second name: %s<br/>
	Town: %s<br/>
	Street: %s<br/>
	House: %s<br/>
	Index: %s<br/>
	Delivery type: %d<br/>	
	Phone: %s<br/>
	OrderPrice: %d<br/>	
	If all some info is incorrect please contact us by this number 899999999999!<br/>
	Otherwise please wait for the delivery!<br/>`, payload.Name, payload.Id, payload.Name, payload.SecondName,
		payload.Town, payload.Street, payload.House, payload.Index, payload.DeliveryType, payload.Phone, payload.OrderPrice)
	to := []string{payload.Email}

	err := processor.mailer.SendEmail(subject, content, to, nil, nil, nil)
	if err != nil {
		return fmt.Errorf("failed to send verify email: %w", err)
	}

	log.Info().Str("type", task.Type()).Bytes("payload", task.Payload()).
		Str("email", payload.Email).Msg("processed task")
	return nil
}
