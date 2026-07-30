package worker

import (
	"context"
	"fmt"
	"net/url"
	"time"

	"github.com/mrkrabopl1/go_db/types"
)

// ============================================
// ГЕНЕРАЦИЯ LINK_URL
// ============================================

func (processor *RedisTaskProcessor) buildLinkURL(ctx context.Context, filters types.ProductsFilterStruct) (string, error) {
	params := url.Values{}

	// 1. ТИПЫ → slug
	for _, typeID := range filters.Types {
		slug, err := processor.getTypeSlug(ctx, typeID)
		if err != nil {
			return "", fmt.Errorf("failed to get type slug for %d: %w", typeID, err)
		}
		if slug != "" {
			params.Add("type", slug)
		}
	}

	// 2. БРЕНДЫ → slug
	for _, brandID := range filters.Firms {
		slug, err := processor.getBrandSlug(ctx, brandID)
		if err != nil {
			return "", fmt.Errorf("failed to get brand slug for %d: %w", brandID, err)
		}
		if slug != "" {
			params.Add("brand", slug)
		}
	}

	// 3. РАЗМЕРЫ
	for _, size := range filters.Sizes {
		if size != "" {
			params.Add("size", size)
		}
	}

	// 4. ЦЕНА
	if len(filters.Price) == 2 {
		if filters.Price[0] > 0 {
			params.Set("min_price", fmt.Sprintf("%d", int(filters.Price[0])))
		}
		if filters.Price[1] < 100000 {
			params.Set("max_price", fmt.Sprintf("%d", int(filters.Price[1])))
		}
	}

	// 5. СКИДКИ
	if filters.HasDiscount {
		params.Set("discount", "true")
	}

	// 6. НАЛИЧИЕ
	if filters.InStore {
		params.Set("in_store", "true")
	}

	query := params.Encode()
	if query == "" {
		return "/search", nil
	}
	return "/search?" + query, nil
}

// ============================================
// ПОЛУЧЕНИЕ SLUG-ОВ (с кэшированием)
// ============================================

func (processor *RedisTaskProcessor) getTypeSlug(ctx context.Context, typeID int32) (string, error) {
	key := fmt.Sprintf("slug:type:%d", typeID)
	slug, err := processor.redisClient.Get(ctx, key).Result()
	if err == nil {
		return slug, nil
	}

	typeInfo, err := processor.store.GetTypeByID(ctx, typeID)
	if err != nil {
		return "", err
	}

	processor.redisClient.Set(ctx, key, typeInfo.TypeKey, 24*time.Hour)
	return typeInfo.TypeKey, nil
}

func (processor *RedisTaskProcessor) getBrandSlug(ctx context.Context, brandID int32) (string, error) {
	key := fmt.Sprintf("slug:brand:%d", brandID)
	slug, err := processor.redisClient.Get(ctx, key).Result()
	if err == nil {
		return slug, nil
	}

	brand, err := processor.store.GetBrandByID(ctx, brandID)
	if err != nil {
		return "", err
	}

	processor.redisClient.Set(ctx, key, brand.Slug, 24*time.Hour)
	return brand.Slug, nil
}
