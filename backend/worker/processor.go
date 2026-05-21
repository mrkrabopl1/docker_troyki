package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/hibiken/asynq"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/mail"
	"github.com/redis/go-redis/v9"
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
	// Новые методы для новостной рассылки
	ProcessTaskSendNewsletterVerification(ctx context.Context, task *asynq.Task) error
	ProcessTaskSendNewsletterWelcome(ctx context.Context, task *asynq.Task) error
	ProcessTaskSendNewsletterBroadcast(ctx context.Context, task *asynq.Task) error
	// Существующие методы
	SetProductsInfo(ctx context.Context, ID string, merchant db.ProductsInfoResponse) error
	GetProductsInfo(ctx context.Context, ID string) (db.ProductsInfoResponse, error)
	SetBanners(ctx context.Context, banners []db.CreateBannerParams) error
	ClearBannersCache(ctx context.Context) error
	GetBanners(ctx context.Context) ([]db.CreateBannerParams, error)
}

type RedisTaskProcessor struct {
	server      *asynq.Server
	store       db.Store
	mailer      mail.EmailSender
	redisClient *redis.Client
}

func NewRedisTaskProcessor(redisOpt asynq.RedisClientOpt, store db.Store, mailer mail.EmailSender) TaskProcessor {
	logger := NewLogger()

	// Для asynq Server используй DB 0
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

	// Для кэша используй ДРУГОЙ DB (например, DB 1)
	redisClient := redis.NewClient(&redis.Options{
		Addr: redisOpt.Addr,
		DB:   1, // <-- ОТЛИЧНЫЙ от asynq!
	})

	return &RedisTaskProcessor{
		server:      server,
		store:       store,
		mailer:      mailer,
		redisClient: redisClient,
	}
}

// ============ СУЩЕСТВУЮЩИЕ МЕТОДЫ ============

func (p *RedisTaskProcessor) SetProductsInfo(ctx context.Context, ID string, merchant db.ProductsInfoResponse) error {
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

func (p *RedisTaskProcessor) GetProductsInfo(ctx context.Context, ID string) (db.ProductsInfoResponse, error) {
	// Generate unique key
	key := "snickers:" + ID

	// Fetch data from Redis
	data, err := p.redisClient.Get(ctx, key).Result()
	if err == redis.Nil {
		return db.ProductsInfoResponse{}, fmt.Errorf("merchant not found")
	} else if err != nil {
		return db.ProductsInfoResponse{}, err
	}

	// Convert JSON to struct
	var snickers db.ProductsInfoResponse
	err = json.Unmarshal([]byte(data), &snickers)
	if err != nil {
		return db.ProductsInfoResponse{}, err
	}

	return snickers, nil
}

func (p *RedisTaskProcessor) SetBanners(ctx context.Context, banners []db.CreateBannerParams) error {
	// Конвертируем слайс баннеров в JSON
	data, err := json.Marshal(banners)
	if err != nil {
		return fmt.Errorf("failed to marshal banners: %w", err)
	}
	key := "mainpage:banners:v1"
	fmt.Printf("[Redis] Сохранение баннеров в Redis, ключ: %s\n", key)

	// Сохраняем с TTL 1 час
	return p.redisClient.Set(ctx, key, data, 1*time.Hour).Err()
}

// GetBanners - получает баннеры из Redis
func (p *RedisTaskProcessor) GetBanners(ctx context.Context) ([]db.CreateBannerParams, error) {
	// Ключ для баннеров
	key := "mainpage:banners:v1"

	// Получаем данные из Redis
	data, err := p.redisClient.Get(ctx, key).Result()
	if err == redis.Nil {
		// Ключ не найден
		return nil, fmt.Errorf("banners not found in cache")
	} else if err != nil {
		// Ошибка Redis
		return nil, fmt.Errorf("redis error: %w", err)
	}

	// Конвертируем JSON в слайс баннеров
	var banners []db.CreateBannerParams
	if err := json.Unmarshal([]byte(data), &banners); err != nil {
		return nil, fmt.Errorf("failed to unmarshal banners: %w", err)
	}

	fmt.Printf("[Redis] Получено %d баннеров из кэша\n", len(banners))
	return banners, nil
}

func (p *RedisTaskProcessor) ClearBannersCache(ctx context.Context) error {
	key := "mainpage:banners:v1"
	err := p.redisClient.Del(ctx, key).Err()
	if err != nil {
		return fmt.Errorf("failed to clear banners cache: %w", err)
	}
	fmt.Printf("[Redis] Кэш баннеров очищен, ключ: %s\n", key)
	return nil
}

func (processor *RedisTaskProcessor) Start() error {
	mux := asynq.NewServeMux()

	// Регистрируем существующие обработчики
	mux.HandleFunc(TaskSendVerifyEmail, processor.ProcessTaskSendVerifyEmail)
	mux.HandleFunc(TaskSendOrderEmail, processor.ProcessTaskSendOrderEmail)

	// Регистрируем новые обработчики для новостной рассылки
	mux.HandleFunc(TaskSendNewsletterVerification, processor.ProcessTaskSendNewsletterVerification)
	mux.HandleFunc(TaskSendNewsletterWelcome, processor.ProcessTaskSendNewsletterWelcome)
	mux.HandleFunc(TaskSendNewsletterBroadcast, processor.ProcessTaskSendNewsletterBroadcast)
	// Регистрируем обработчики для админских email
	mux.HandleFunc(TaskSendAdminWelcome, processor.ProcessTaskSendAdminWelcome)
	mux.HandleFunc(TaskSendAdminPasswordReset, processor.ProcessTaskSendAdminPasswordReset)
	mux.HandleFunc(TaskSendAdminPasswordChanged, processor.ProcessTaskSendAdminPasswordChanged)
	mux.HandleFunc(TaskSendAdminInvite, processor.ProcessTaskSendAdminInvite)
	return processor.server.Start(mux)
}

func (processor *RedisTaskProcessor) Shutdown() {
	processor.server.Shutdown()
}
