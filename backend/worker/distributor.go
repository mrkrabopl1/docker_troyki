package worker

import (
	"context"

	"github.com/hibiken/asynq"
)

type TaskDistributor interface {
	DistributeTaskSendVerifyEmail(
		ctx context.Context,
		payload *PayloadSendVerifyEmail,
		opts ...asynq.Option,
	) error
	DistributeTaskSendOrderEmail(
		ctx context.Context,
		payload *PayloadSendOrderEmail,
		opts ...asynq.Option,
	) error
	// Новые методы для новостной рассылки
	DistributeTaskSendNewsletterVerification(
		ctx context.Context,
		payload *PayloadSendNewsletterVerification,
		opts ...asynq.Option,
	) error
	DistributeTaskSendNewsletterWelcome(
		ctx context.Context,
		payload *PayloadSendNewsletterWelcome,
		opts ...asynq.Option,
	) error
	DistributeTaskSendNewsletterBroadcast(
		ctx context.Context,
		payload *PayloadSendNewsletterBroadcast,
		opts ...asynq.Option,
	) error
}

type RedisTaskDistributor struct {
	client *asynq.Client
}

func NewRedisTaskDistributor(redisOpt asynq.RedisClientOpt) TaskDistributor {
	client := asynq.NewClient(redisOpt)
	return &RedisTaskDistributor{
		client: client,
	}
}
