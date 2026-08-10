// worker/collection_cache.go - новый файл
package worker

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

// SetCollection - сохраняет коллекцию в кэш
func (p *RedisTaskProcessor) SetCollection(ctx context.Context, id int32, data []byte) error {
	key := fmt.Sprintf("collection:slug:%d", id)
	return p.redisClient.Set(ctx, key, data, 10*time.Minute).Err()
}

// GetCollection - получает коллекцию из кэша
func (p *RedisTaskProcessor) GetCollection(ctx context.Context, slug string) ([]byte, error) {
	key := fmt.Sprintf("collection:slug:%s", slug)
	return p.redisClient.Get(ctx, key).Bytes()
}

// ClearCollectionCache - очищает кэш одной коллекции
func (p *RedisTaskProcessor) ClearCollectionCache(ctx context.Context, slug string) error {
	key := fmt.Sprintf("collection:slug:%s", slug)
	return p.redisClient.Del(ctx, key).Err()
}

// ClearAllCollectionsCache - очищает кэш всех коллекций
func (p *RedisTaskProcessor) ClearAllCollectionsCache(ctx context.Context) error {
	// Удаляем все ключи коллекций
	pattern := "collection:slug:*"
	iter := p.redisClient.Scan(ctx, 0, pattern, 0).Iterator()

	var keys []string
	for iter.Next(ctx) {
		keys = append(keys, iter.Val())
	}

	if err := iter.Err(); err != nil {
		return fmt.Errorf("failed to scan keys: %w", err)
	}

	if len(keys) > 0 {
		if err := p.redisClient.Del(ctx, keys...).Err(); err != nil {
			return fmt.Errorf("failed to delete keys: %w", err)
		}
		log.Info().Int("count", len(keys)).Msg("collection cache cleared")
	}

	// Также очищаем список активных коллекций
	if err := p.redisClient.Del(ctx, "collections:active:list").Err(); err != nil && err != redis.Nil {
		return fmt.Errorf("failed to delete collections list: %w", err)
	}

	return nil
}

// RefreshCollectionsCache - обновляет кэш всех коллекций (если нужно)
func (p *RedisTaskProcessor) RefreshCollectionsCache(ctx context.Context) error {
	log.Info().Msg("Refreshing collections cache")

	// Получаем все активные коллекции из БД
	collections, err := p.store.GetActiveCollections(ctx)
	if err != nil {
		return fmt.Errorf("failed to get collections: %w", err)
	}

	// Для каждой коллекции обновляем кэш
	for _, col := range collections {
		// Здесь можно предварительно загрузить данные
		// Но лучше это делать по требованию (при первом запросе)
		// Просто инвалидируем старый кэш
		if err := p.ClearCollectionCache(ctx, col.Slug); err != nil {
			log.Error().Err(err).Str("slug", col.Slug).Msg("failed to clear collection cache")
		}
	}

	log.Info().Int("count", len(collections)).Msg("collections cache refreshed")
	return nil
}
