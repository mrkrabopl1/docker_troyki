package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

// SetSearchCache - сохраняет результат поиска в кэш
func (p *RedisTaskProcessor) SetSearchCache(
	ctx context.Context,
	cacheKey string,
	data interface{},
	ttl time.Duration,
) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal search data: %w", err)
	}

	key := fmt.Sprintf("search:%s", cacheKey)
	return p.redisClient.Set(ctx, key, jsonData, ttl).Err()
}

// GetSearchCache - получает результат поиска из кэша
func (p *RedisTaskProcessor) GetSearchCache(
	ctx context.Context,
	cacheKey string,
) ([]byte, error) {
	key := fmt.Sprintf("search:%s", cacheKey)

	data, err := p.redisClient.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, fmt.Errorf("search cache not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get search cache: %w", err)
	}

	return []byte(data), nil
}

// ClearSearchCache - очищает кэш поиска
func (p *RedisTaskProcessor) ClearSearchCache(ctx context.Context) error {
	pattern := "search:*"

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
		log.Info().Int("count", len(keys)).Msg("search cache cleared")
	}

	return nil
}

// ClearSearchCacheByPrefix - очищает кэш поиска по префиксу
func (p *RedisTaskProcessor) ClearSearchCacheByPrefix(ctx context.Context, prefix string) error {
	pattern := fmt.Sprintf("search:%s:*", prefix)

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
		log.Info().Int("count", len(keys)).Str("prefix", prefix).Msg("search cache cleared by prefix")
	}

	return nil
}
