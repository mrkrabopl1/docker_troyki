// api/cache_helpers.go

package api

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/types"
)

// Структуры для кэша
type CachedWidget struct {
	ID        int32           `json:"id"`
	Name      string          `json:"name"`
	Type      string          `json:"type"`
	SortOrder int32           `json:"sort_order"`
	Settings  json.RawMessage `json:"settings"`
	Products  []CachedProduct `json:"products,omitempty"`
	LinkUrl   string          `json:"link_url"`
}

type CachedProduct struct {
	ID        int32  `json:"id"`
	Name      string `json:"name"`
	ImagePath string `json:"image_path"`
	Price     int32  `json:"price"`
	BrandName string `json:"brand_name"`
}

// Получение товаров для виджета через существующий метод
// api/cache_helpers.go

func (s *Server) getProductsForWidget(ctx context.Context, widget db.PageWidget) ([]CachedProduct, error) {

	fmt.Println(widget)

	// 1. Парсим настройки виджета
	var settings types.ProductsFilterStruct
	if len(widget.Settings) > 0 {
		if err := json.Unmarshal(widget.Settings, &settings); err != nil {
			return nil, fmt.Errorf("failed to parse widget settings: %w", err)
		}
	}
	fmt.Println(widget.Settings, "ssssssqqqqqqqqqqqqq")
	fmt.Println(settings, "ssswwwwwwwwwwwsssqqqqqqqqqqqqq")
	limit := 20
	settings.WithPrice = true
	// 2. Используем существующий публичный метод
	fmt.Println("ssssssssssssssssssssssssssaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", settings)
	result, err := s.store.GetProductsByFiltersComplex(
		ctx,
		"",       // name - пустая строка
		1,        // page - первая страница
		limit,    // size
		settings, // фильтры из виджета
		0,        // сортировка
	)
	if err != nil {
		return nil, err
	}

	// 3. Конвертируем результат в CachedProduct
	cachedProducts := make([]CachedProduct, 0, len(result.Merch))
	for _, p := range result.Merch {
		fmt.Println(p.Price, "price")
		fmt.Println(p.Name, "Name")
		cachedProducts = append(cachedProducts, CachedProduct{
			ID:        p.Id,
			Name:      p.Name,
			ImagePath: p.Image[0], // первое изображение
			Price:     int32(p.Price),
			BrandName: "", // если нет в ответе
		})
	}

	return cachedProducts, nil
}

// Обновление кэша всех виджетов
func (s *Server) refreshPageWidgetsCache(ctx context.Context) {
	fmt.Println("111111111111111111111")
	widgets, err := s.store.GetActivePageWidgets(ctx)
	if err != nil {
		fmt.Printf("[Redis] Failed to get widgets: %v\n", err)
		return
	}

	cachedWidgets := make([]CachedWidget, 0, len(widgets))

	for _, w := range widgets {
		cached := CachedWidget{
			ID:        w.ID,
			Name:      w.Name,
			Type:      w.Type,
			SortOrder: w.SortOrder,
			Settings:  w.Settings,
			LinkUrl:   w.LinkUrl,
		}

		if w.Type == "products_slider" {
			products, err := s.getProductsForWidget(ctx, w)
			if err == nil {
				cached.Products = products
			} else {
				fmt.Printf("[Redis] Failed to get products for widget %d: %v\n", w.ID, err)
			}
		}

		cachedWidgets = append(cachedWidgets, cached)
	}

	// ✅ Маршалим в JSON перед отправкой в Redis
	data, err := json.Marshal(cachedWidgets)
	if err != nil {
		fmt.Printf("[Redis] Failed to marshal widgets: %v\n", err)
		return
	}

	if err := s.taskProcessor.SetPageWidgets(ctx, data); err != nil {
		fmt.Printf("[Redis] Failed to set cache: %v\n", err)
		return
	}

	fmt.Printf("[Redis] Widgets cached, count: %d\n", len(cachedWidgets))
}

// Обновление одного виджета
func (s *Server) refreshSingleWidgetCache(ctx context.Context, widgetID int32) {
	widget, err := s.store.GetPageWidget(ctx, widgetID)
	if err != nil {
		fmt.Printf("[Redis] Failed to get widget %d: %v\n", widgetID, err)
		return
	}

	cached := CachedWidget{
		ID:        widget.ID,
		Name:      widget.Name,
		Type:      widget.Type,
		SortOrder: widget.SortOrder,
		Settings:  widget.Settings,
	}

	if widget.Type == "products_slider" {
		products, _ := s.getProductsForWidget(ctx, widget)
		cached.Products = products
	}

	// Получаем текущий кэш (уже []byte)
	existingData, err := s.taskProcessor.GetPageWidgets(ctx)
	if err != nil || len(existingData) == 0 {
		s.refreshPageWidgetsCache(ctx)
		return
	}

	// ✅ Анмаршалим существующий кэш
	var existingWidgets []CachedWidget
	if err := json.Unmarshal(existingData, &existingWidgets); err != nil {
		fmt.Printf("[Redis] Failed to unmarshal existing widgets: %v\n", err)
		s.refreshPageWidgetsCache(ctx)
		return
	}

	// Обновляем виджет
	for i, w := range existingWidgets {
		if w.ID == widgetID {
			existingWidgets[i] = cached
			break
		}
	}

	// ✅ Маршалим обратно
	data, err := json.Marshal(existingWidgets)
	if err != nil {
		fmt.Printf("[Redis] Failed to marshal updated widgets: %v\n", err)
		return
	}

	s.taskProcessor.SetPageWidgets(ctx, data)
	fmt.Printf("[Redis] Single widget %d updated\n", widgetID)
}

// Получение виджетов из кэша
func (s *Server) getPageWidgetsFromCache(ctx context.Context) ([]CachedWidget, error) {
	fmt.Println("ddddddddddddddddddddddddddddddddddddddddddd")
	data, err := s.taskProcessor.GetPageWidgets(ctx)
	if err != nil {
		return nil, err
	}

	var widgets []CachedWidget
	if err := json.Unmarshal(data, &widgets); err != nil {
		return nil, err
	}

	return widgets, nil
}

// Очистка кэша
func (s *Server) clearPageWidgetsCache(ctx context.Context) {
	if err := s.taskProcessor.ClearPageWidgetsCache(ctx); err != nil {
		fmt.Printf("[Redis] Failed to clear cache: %v\n", err)
	}
	fmt.Println("[Redis] Widgets cache cleared")
}

// Вармап при запуске
func (s *Server) warmupCache() {
	ctx := context.Background()
	time.Sleep(3 * time.Second)
	fmt.Println("[Redis] Warming up widgets cache...")
	s.refreshPageWidgetsCache(ctx)
}

// Автообновление
func (s *Server) startAutoRefreshCache() {
	ticker := time.NewTicker(10 * time.Minute)
	go func() {
		for range ticker.C {
			ctx := context.Background()
			fmt.Println("[Redis] Auto-refresh widgets cache...")
			s.refreshPageWidgetsCache(ctx)
		}
	}()
}
