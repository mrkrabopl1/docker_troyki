package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/hibiken/asynq"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/mail"
	"github.com/rs/zerolog/log"
)

const (
	QueueCritical = "critical"
	QueueDefault  = "default"
)

type TaskProcessor interface {
	Start() error
	Shutdown()
	ProcessTaskSendVerifyEmail(ctx context.Context, task *asynq.Task) error
	ProcessTaskSendOrderEmail(ctx context.Context, task *asynq.Task) error
	SetSnickersInfo(ctx context.Context, ID string, merchant db.SnickersInfoResponse) error
	GetSnickersInfo(ctx context.Context, ID string) (db.SnickersInfoResponse, error)
}

type RedisTaskProcessor struct {
	server      *asynq.Server
	store       db.Store
	mailer      mail.EmailSender
	redisClient *redis.Client
}

func NewRedisTaskProcessor(redisOpt asynq.RedisClientOpt, store db.Store, mailer mail.EmailSender) TaskProcessor {
	logger := NewLogger()
	redis.SetLogger(logger)

	server := asynq.NewServer(
		redisOpt,
		asynq.Config{
			Queues: map[string]int{
				QueueCritical: 10,
				QueueDefault:  5,
			},
			ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
				log.Error().Err(err).Str("type", task.Type()).
					Bytes("payload", task.Payload()).Msg("process task failed")
			}),
			Logger: logger,
		},
	)

	redisClient := redis.NewClient(&redis.Options{
		Addr: redisOpt.Addr,
	})

	return &RedisTaskProcessor{
		server:      server,
		store:       store,
		mailer:      mailer,
		redisClient: redisClient,
	}
}

func (p *RedisTaskProcessor) SetSnickersInfo(ctx context.Context, ID string, merchant db.SnickersInfoResponse) error {
	// Convert merchant struct to JSON
	data, err := json.Marshal(merchant)
	if err != nil {
		return err
	}

	// Generate unique key for Redis
	key := "snickers:" + ID
	fmt.Println("222222222222222222222222222222222222222222222222222222", key)
	// Save data with expiration (e.g., 24 hours)
	return p.redisClient.Set(ctx, key, data, 24*time.Hour).Err()
}

func (p *RedisTaskProcessor) GetSnickersInfo(ctx context.Context, ID string) (db.SnickersInfoResponse, error) {
	// Generate unique key
	key := "snickers:" + ID

	// Fetch data from Redis
	data, err := p.redisClient.Get(ctx, key).Result()
	if err == redis.Nil {
		return db.SnickersInfoResponse{}, fmt.Errorf("merchant not found")
	} else if err != nil {
		return db.SnickersInfoResponse{}, err
	}

	// Convert JSON to struct
	var snickers db.SnickersInfoResponse
	err = json.Unmarshal([]byte(data), &snickers)
	if err != nil {
		return db.SnickersInfoResponse{}, err
	}

	return snickers, nil
}

func (processor *RedisTaskProcessor) Start() error {
	mux := asynq.NewServeMux()

	mux.HandleFunc(TaskSendVerifyEmail, processor.ProcessTaskSendVerifyEmail)
	mux.HandleFunc(TaskSendOrderEmail, processor.ProcessTaskSendOrderEmail)

	return processor.server.Start(mux)
}

func (processor *RedisTaskProcessor) Shutdown() {
	processor.server.Shutdown()
}
