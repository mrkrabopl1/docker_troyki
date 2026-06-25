// worker/widget_processor.go
package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/types"
)

type CachedProduct struct {
	ID        int32  // ID товара
	Name      string // Название
	ImagePath string // Путь к изображению (первое фото)
	MinPrice  int32  // Минимальная цена
	MaxPrice  int32  // Максимальная цена
	BrandName string // Название бренда
}

type CachedWidget struct {
	ID        int32           `json:"id"`
	Name      string          `json:"name"`
	Type      string          `json:"type"` // "products_slider", "banner_slider", "brands_scroller"
	SortOrder int32           `json:"sort_order"`
	LinkURL   string          `json:"link_url"` // ✅ человеко-понятный URL
	Settings  json.RawMessage `json:"settings"` // настройки (для информации)
	Products  []CachedProduct `json:"products"` // ✅ уже готовые товары
}

func (processor *RedisTaskProcessor) generateWidgetLink(ctx context.Context, widgetID int32) error {
	// 1. Получаем виджет из БД
	widget, err := processor.store.GetPageWidget(ctx, widgetID)
	if err != nil {
		return fmt.Errorf("failed to get widget: %w", err)
	}

	// 2. Парсим фильтры из settings
	var filters types.ProductsFilterStruct
	if err := json.Unmarshal(widget.Settings, &filters); err != nil {
		return fmt.Errorf("failed to parse filters: %w", err)
	}

	// 3. Генерируем link_url
	linkURL, err := processor.buildLinkURL(ctx, filters)
	if err != nil {
		return fmt.Errorf("failed to build link URL: %w", err)
	}

	// 4. ✅ Обновляем ТОЛЬКО link_url (остальные поля = NULL → не обновляются)
	_, err = processor.store.UpdatePageWidget(ctx, db.UpdatePageWidgetParams{
		ID:        widgetID,
		Name:      pgtype.Text{Valid: false},
		Type:      pgtype.Text{Valid: false},
		SortOrder: pgtype.Int4{Valid: false},
		IsActive:  pgtype.Bool{Valid: false},
		Settings:  nil,
		LinkUrl:   pgtype.Text{String: linkURL, Valid: true},
	})
	if err != nil {
		return fmt.Errorf("failed to update widget: %w", err)
	}

	// 5. Обновляем Redis кэш
	if err := processor.refreshWidgetCache(ctx, widgetID); err != nil {
		fmt.Printf("[Asynq] Failed to refresh cache: %v\n", err)
	}

	fmt.Printf("[Asynq] Widget %d link generated: %s\n", widgetID, linkURL)
	return nil
}

func (processor *RedisTaskProcessor) buildLinkURL(ctx context.Context, filters types.ProductsFilterStruct) (string, error) {
	params := url.Values{}

	// ============================================
	// 1. ТИПЫ → slug
	// ============================================
	for _, typeID := range filters.Types {
		slug, err := processor.getTypeSlug(ctx, typeID)
		if err != nil {
			return "", fmt.Errorf("failed to get type slug for %d: %w", typeID, err)
		}
		if slug != "" {
			params.Add("type", slug)
		}
	}

	// ============================================
	// 2. БРЕНДЫ → slug
	// ============================================
	for _, brandID := range filters.Firms {
		slug, err := processor.getBrandSlug(ctx, brandID)
		if err != nil {
			return "", fmt.Errorf("failed to get brand slug for %d: %w", brandID, err)
		}
		if slug != "" {
			params.Add("brand", slug)
		}
	}

	// ============================================
	// 3. РАЗМЕРЫ
	// ============================================
	for _, size := range filters.Sizes {
		if size != "" {
			params.Add("size", size)
		}
	}

	// ============================================
	// 4. ЦЕНА
	// ============================================
	if len(filters.Price) == 2 {
		if filters.Price[0] > 0 {
			params.Set("min_price", fmt.Sprintf("%d", int(filters.Price[0])))
		}
		if filters.Price[1] < 100000 {
			params.Set("max_price", fmt.Sprintf("%d", int(filters.Price[1])))
		}
	}

	// ============================================
	// 5. СКИДКИ
	// ============================================
	if filters.HasDiscount {
		params.Set("discount", "true")
	}

	// ============================================
	// 6. НАЛИЧИЕ
	// ============================================
	if filters.InStore {
		params.Set("in_store", "true")
	}

	// ============================================
	// 7. СОБИРАЕМ URL
	// ============================================
	query := params.Encode()
	if query == "" {
		return "/search", nil
	}
	return "/search?" + query, nil
}

// worker/widget_processor.go

// getTypeSlug - получает slug типа из Redis или БД
func (processor *RedisTaskProcessor) getTypeSlug(ctx context.Context, typeID int32) (string, error) {
	// 1. Пытаемся получить из Redis
	key := fmt.Sprintf("slug:type:%d", typeID)
	slug, err := processor.redisClient.Get(ctx, key).Result()
	if err == nil {
		return slug, nil
	}

	// 2. Если нет - идём в БД
	typeInfo, err := processor.store.GetTypeByID(ctx, typeID)
	if err != nil {
		return "", err
	}

	// 3. Сохраняем в Redis (TTL 24 часа)
	processor.redisClient.Set(ctx, key, typeInfo.TypeKey, 24*time.Hour)

	return typeInfo.TypeKey, nil
}

// getBrandSlug - получает slug бренда из Redis или БД
func (processor *RedisTaskProcessor) getBrandSlug(ctx context.Context, brandID int32) (string, error) {
	// 1. Пытаемся получить из Redis
	key := fmt.Sprintf("slug:brand:%d", brandID)
	slug, err := processor.redisClient.Get(ctx, key).Result()
	if err == nil {
		return slug, nil
	}

	// 2. Если нет - идём в БД
	brand, err := processor.store.GetBrandByID(ctx, brandID)
	if err != nil {
		return "", err
	}

	// 3. Сохраняем в Redis (TTL 24 часа)
	processor.redisClient.Set(ctx, key, brand.Slug, 24*time.Hour)

	return brand.Slug, nil
}

// worker/widget_processor.go

func (processor *RedisTaskProcessor) getProductsForWidget(ctx context.Context, widget db.PageWidget) ([]CachedProduct, error) {
	// 1. Парсим настройки виджета
	var settings struct {
		Filters types.ProductsFilterStruct `json:"filters"`
		Limit   int                        `json:"limit"`
		Sort    int                        `json:"sort"`
	}
	if err := json.Unmarshal(widget.Settings, &settings); err != nil {
		return nil, fmt.Errorf("failed to parse settings: %w", err)
	}

	limit := 20
	if settings.Limit > 0 && settings.Limit <= 50 {
		limit = settings.Limit
	}
	settings.Filters.WithPrice = true
	// 2. Используем существующий метод Store для получения товаров по фильтрам
	result, err := processor.store.GetProductsByFiltersComplex(
		ctx,
		"",                   // name - пустая строка
		1,                    // page - первая страница
		limit,                // size - лимит из настроек
		settings.Filters,     // фильтры из виджета
		int32(settings.Sort), // сортировка
	)
	if err != nil {
		return nil, err
	}

	// 3. Конвертируем в CachedProduct
	cachedProducts := make([]CachedProduct, 0, len(result.Merch))
	for _, p := range result.Merch {
		cachedProducts = append(cachedProducts, CachedProduct{
			ID:        p.Id,
			Name:      p.Name,
			ImagePath: p.Image[0], // первое изображение
			MinPrice:  int32(p.Price),
			MaxPrice:  int32(p.Price),
			BrandName: "", // если нет в ответе
		})
	}

	return cachedProducts, nil
}

func (processor *RedisTaskProcessor) refreshWidgetCache(ctx context.Context, widgetID int32) error {
	// 1. Получаем виджет из БД
	widget, err := processor.store.GetPageWidget(ctx, widgetID)
	if err != nil {
		return err
	}

	// 2. Получаем товары для этого виджета
	products, err := processor.getProductsForWidget(ctx, widget)
	if err != nil {
		return err
	}

	// 3. Получаем все виджеты из Redis (теперь возвращаем слайс)
	allWidgets, err := processor.GetPageWidgetsStruct(ctx) // ✅ новый метод
	if err != nil {
		allWidgets = []CachedWidget{}
	}

	// 4. Обновляем нужный виджет
	found := false
	for i, w := range allWidgets {
		if w.ID == widgetID {
			allWidgets[i].Products = products
			found = true
			break
		}
	}

	if !found {
		allWidgets = append(allWidgets, CachedWidget{
			ID:        widget.ID,
			Name:      widget.Name,
			Type:      widget.Type,
			SortOrder: widget.SortOrder,
			LinkURL:   widget.LinkUrl,
			Settings:  widget.Settings,
			Products:  products,
		})
	}

	// 5. ✅ Маршалим в JSON и сохраняем
	data, err := json.Marshal(allWidgets)
	if err != nil {
		return fmt.Errorf("failed to marshal widgets: %w", err)
	}

	return processor.SetPageWidgets(ctx, data)
}
