package db

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/mrkrabopl1/go_db/services"
	"github.com/mrkrabopl1/go_db/types"
)

type RespSearchProductsAndFiltersByStringForAdmin struct {
	Products    []ProductsInfoAdminResponse `json:"products"`
	TotalCount  float64                     `json:"totalCount"`
	ActiveCount int32                       `json:"activeCount"`
	Filters     FiltersSearchResponse       `json:"filters"`
}

func (store *SQLStore) GetAllProductsAndFilters(ctx context.Context, page int, size int, orderedType int) (RespSearchProductsAndFiltersByStringForAdmin, error) {
	offset := (page - 1) * size

	params := GetProductsForAdminByFiltersParams{
		Offsetval: int32(offset),
		Limitval:  int32(size),
		SortType:  int32(orderedType),
		// Все фильтры пустые
		Sizes:        []string{},
		Firms:        []int32{},
		Bodytypes:    []string{},
		ProductTypes: []int32{},
		Lines:        []int32{},
		Categories:   []int32{},
		Status:       "", // пустая строка = нет фильтра
		Name:         "", // пустая строка = нет фильтра
		Minprice:     pgtype.Int4{Valid: false},
		Maxprice:     pgtype.Int4{Valid: false},
		HasDiscount:  false,
		InStore:      false,
		WithPrice:    false,
	}

	// Получаем товары
	data, err := store.GetProductsForAdminByFilters(ctx, params)
	if err != nil {
		return RespSearchProductsAndFiltersByStringForAdmin{}, err
	}

	filters, err := store.GetAllFiltersForAdmin(ctx)
	if err != nil {
		return RespSearchProductsAndFiltersByStringForAdmin{}, err
	}

	var totalCount float64
	var activeCount int32
	if len(data) > 0 {
		totalCount = float64(data[0].TotalCount)
		activeCount = int32(data[0].ActiveCount)
	} else {
		totalCount = 0
		activeCount = 0
	}

	return RespSearchProductsAndFiltersByStringForAdmin{
		Products:    store.buildAdminProductsResponse(data),
		TotalCount:  totalCount,
		ActiveCount: activeCount,
		Filters: FiltersSearchResponse{
			Price:      [2]int32{filters.MinPrice.(int32), filters.MaxPrice.(int32)},
			Sizes:      filters.Sizes,
			FirmsCount: filters.Firms,
			Types:      filters.ProductTypes,
			Discounts:  filters.DiscountRules,
		},
	}, nil
}

type ProductsAdminResponse struct {
	Name     string      `json:"name"`
	Id       int32       `json:"id"`
	Image    string      `json:"image_path"`
	Discount interface{} `json:"discount"`
	Price    int         `json:"price"`
	Status   string      `json:"status"`
}
type ProductsInfoAdminResponse struct {
	ProductsAdminResponse
	Status    string             `json:"status"`
	Firm      string             `json:"firm"`
	Type      int32              `json:"type"`
	Category  int32              `json:"category"`
	UpdatedAt pgtype.Timestamptz `json:"updated_at"`
}

func (store *SQLStore) buildAdminProductsResponse(rows []GetProductsForAdminByFiltersRow) []ProductsInfoAdminResponse {
	products := make([]ProductsInfoAdminResponse, 0, len(rows))

	for _, row := range rows {
		products = append(products, ProductsInfoAdminResponse{
			ProductsAdminResponse: ProductsAdminResponse{
				Id:       row.ID,
				Name:     row.Name,
				Discount: row.DiscountPercent,
				Price:    int(row.Minprice),
				Image:    store.getProductMainImage(row.ImagePath),
			},
			Status:    row.Status,
			Firm:      row.Firm,
			Type:      row.Type,
			Category:  row.Category,
			UpdatedAt: row.UpdatedAt,
		})
	}

	return products
}

func (store *SQLStore) GetAdminProductsInfoByIdComplex(ctx context.Context, id int32) (ProductsAdminInfoResponse, error) {
	snickers, err := store.Queries.GetAdminProductsInfoById(ctx, id)
	fmt.Println(snickers, "test")
	if err != nil {
		return ProductsAdminInfoResponse{}, err
	}

	ProductsAdminInfoResp := store.buildAdminProductsInfoResponse(snickers)
	return ProductsAdminInfoResp, nil
}

type ProductsAdminInfoResponse struct {
	ProductsInfoResponse
	Status string `json:"status"`
}

type RespProductsForAdminByStringStruct struct {
	Products    []ProductsInfoAdminResponse `json:"products"`
	TotalCount  int32                       `json:"totalCount"`
	ActiveCount int32                       `json:"activeCount"`
}

func (store *SQLStore) GetProductsForAdminByFiltersComplex(ctx context.Context, name string, page int, size int, filters types.ProductsForAdminFilterStruct, orderedType int32) (RespProductsForAdminByStringStruct, error) {
	data, err := store.getProductsForAdminByFilters(ctx, GetFiltersByNameCategoryAndTypeParams{Name: pgtype.Text{String: name, Valid: true}}, filters, page, size, int(orderedType), true)
	if err != nil {
		return RespProductsForAdminByStringStruct{}, err
	}
	var totalCount int32
	var activeCount int32
	if len(data) > 0 {
		totalCount = int32(data[0].TotalCount)
		activeCount = int32(data[0].ActiveCount)
	} else {
		totalCount = 0
		activeCount = 0
	}

	return RespProductsForAdminByStringStruct{
		ActiveCount: activeCount,
		Products:    store.buildAdminProductsResponse(data),
		TotalCount:  totalCount,
	}, nil
}

func (store *SQLStore) getProductsForAdminByFilters(ctx context.Context, mainFilter GetFiltersByNameCategoryAndTypeParams, filters types.ProductsForAdminFilterStruct, page, size, orderedType int, usePriceFilter bool) ([]GetProductsForAdminByFiltersRow, error) {
	offset := (page - 1) * size

	params := GetProductsForAdminByFiltersParams{
		Limitval:     int32(size),
		Offsetval:    int32(offset),
		Sizes:        filters.Sizes,
		Firms:        filters.Firms,
		Bodytypes:    filters.Bodytypes,
		ProductTypes: filters.Types,
		SortType:     int32(orderedType),
		HasDiscount:  filters.HasDiscount,
		InStore:      filters.InStore,
		WithPrice:    filters.WithPrice,
		Lines:        filters.Lines,
		Status:       filters.Status,
		CreatedFrom: pgtype.Timestamptz{
			Time:  filters.CreatedFrom,
			Valid: !filters.CreatedFrom.IsZero(), // если время не нулевое
		},
		UpdatedFrom: pgtype.Timestamptz{
			Time:  filters.UpdatedFrom,
			Valid: !filters.UpdatedFrom.IsZero(),
		},
	}

	// Используем указатели для nullable полей
	if mainFilter.Name.Valid {
		params.Name = mainFilter.Name.String
	} else {
		params.Name = "" // или оставляем как есть, если в SQL есть проверка на NULL
	}

	// Категории: передаем nil если не валидно
	if mainFilter.Category.Valid {
		params.Categories = []int32{mainFilter.Category.Int32}
	} else {
		params.Categories = nil // или []int32{}
	}

	// Аналогично для Type, если нужно
	if mainFilter.Type.Valid {
		params.ProductTypes = append(params.ProductTypes, mainFilter.Type.Int32)
	}

	if usePriceFilter && filters.Price != nil && len(filters.Price) == 2 {
		params.Minprice = pgtype.Int4{Int32: int32(filters.Price[0]), Valid: true}
		params.Maxprice = pgtype.Int4{Int32: int32(filters.Price[1]), Valid: true}
	}

	// Отладка
	log.Printf("Query params: sizes=%v, firms=%v, categories=%v, name=%q",
		params.Sizes, params.Firms, params.Categories, params.Name)

	return store.GetProductsForAdminByFilters(ctx, params)
}
func (store *SQLStore) buildAdminProductsInfoResponse(snInfo GetAdminProductsInfoByIdRow) ProductsAdminInfoResponse {
	var jsonData map[string]interface{}
	json.Unmarshal(snInfo.Sizes, &jsonData)

	var discount map[string]interface{}
	if snInfo.Value != nil {
		json.Unmarshal(snInfo.Value, &discount)
	}
	fmt.Println(snInfo.ImagePath, "sssssssssssssssssssssssssssssssssssssssss")
	return ProductsAdminInfoResponse{
		ProductsInfoResponse: ProductsInfoResponse{
			Name:        snInfo.Name,
			ImageCount:  snInfo.ImageCount,
			Firm:        snInfo.Firm,
			Line:        snInfo.Line.String,
			Info:        jsonData,
			Discount:    discount,
			ProductType: snInfo.Type,
			Category:    snInfo.Category,
			Article:     snInfo.Article,
			Store:       snInfo.StoreInfo,
			ImagePath:   store.ImagePathBuilder.GetProductMainImage(snInfo.ImagePath), // ✅ главное фото
			Id:          snInfo.ID,
		},
		Status: snInfo.Status,
	}
}

type DiscountInfo struct {
	ProductID     int32  `json:"product_id"`
	DiscountValue int32  `json:"discount_value"`
	DiscountType  string `json:"discount_type"`
	Priority      int32  `json:"priority"`
	RuleID        int32  `json:"rule_id"`
}

// RecalculateAllDiscounts – полный пересчёт всех скидок
func (s *SQLStore) RecalculateAllDiscounts(ctx context.Context) error {
	// 1. Все активные скидки (прямые, бренд, линия)
	discounts, err := s.GetAllActiveDiscounts(ctx)
	if err != nil {
		return err
	}

	// 2. Группируем лучшую скидку по продукту (по приоритету)
	best := make(map[int32]GetAllActiveDiscountsRow)
	for _, d := range discounts {
		cur, exists := best[d.ProductID]
		if !exists || d.Priority > cur.Priority {
			best[d.ProductID] = d
		}
	}

	// 3. ВСЕГДА удаляем старые rule-based скидки (до вставки новых)
	err = s.DeleteAllRuleBasedDiscounts(ctx)
	if err != nil {
		return err
	}

	// Если скидок нет — выходим (старые уже удалены)
	if len(best) == 0 {
		log.Printf("No active discounts, all rule-based discounts removed")
		return nil
	}

	// 4. ID продуктов, у которых есть скидка
	ids := make([]int32, 0, len(best))
	for pid := range best {
		ids = append(ids, pid)
	}

	// 5. Получаем продукты с sizes
	products, err := s.GetProductsWithSizesByIDs(ctx, ids)
	if err != nil {
		return err
	}

	// 6. Батчами обновляем discount
	batchSize := 1000
	totalBatches := (len(products) + batchSize - 1) / batchSize

	for i := 0; i < len(products); i += batchSize {
		end := i + batchSize
		if end > len(products) {
			end = len(products)
		}

		// Передаём nil, потому что у товаров могут быть разные rule_id
		if err := s.processBatch(ctx, products[i:end], best, nil); err != nil {
			log.Printf("Batch %d/%d failed: %v", i/batchSize+1, totalBatches, err)
			continue
		}
		log.Printf("Recalculate discounts: batch %d/%d (%d products)",
			i/batchSize+1, totalBatches, end-i)
	}

	return nil
}

// RecalculateAffectedProducts – пересчёт скидок для товаров, затронутых правилом
func (s *SQLStore) RecalculateAffectedProducts(ctx context.Context, ruleID int32) error {
	// 1. Получаем элементы правила
	items, err := s.GetRuleItems(ctx, ruleID)
	if err != nil {
		return err
	}

	// 2. Собираем ID продуктов, затронутых этим правилом
	productIDs := make(map[int32]bool)

	for _, item := range items {
		switch item.ItemType {
		case "product":
			productIDs[item.ItemID] = true
		case "brand":
			products, err := s.GetProductIDsByBrandForAdmin(ctx, item.ItemID)
			if err != nil {
				log.Printf("Failed to get products for brand %d: %v", item.ItemID, err)
				continue
			}
			for _, id := range products {
				productIDs[id] = true
			}
		case "line":
			products, err := s.GetProductIDsByLineForAdmin(ctx, pgtype.Int4{Int32: item.ItemID})
			if err != nil {
				log.Printf("Failed to get products for line %d: %v", item.ItemID, err)
				continue
			}
			for _, id := range products {
				productIDs[id] = true
			}
		}
	}

	if len(productIDs) == 0 {
		return nil
	}

	// 3. ID продуктов в слайс
	ids := make([]int32, 0, len(productIDs))
	for id := range productIDs {
		ids = append(ids, id)
	}

	// 4. Получаем продукты с размерами
	products, err := s.GetProductsWithSizesByIDs(ctx, ids)
	if err != nil {
		return err
	}

	// 5. Получаем лучшие скидки для этих продуктов
	discounts, err := s.GetBestDiscountsForProducts(ctx, ids)
	if err != nil {
		return err
	}

	// Собираем map для быстрого доступа
	best := make(map[int32]GetAllActiveDiscountsRow)
	for _, d := range discounts {
		best[d.ProductID] = GetAllActiveDiscountsRow{
			ProductID:     d.ProductID,
			DiscountValue: d.DiscountValue,
			DiscountType:  d.DiscountType,
			RuleID:        d.RuleID,
			Priority:      d.Priority,
		}
	}

	// 6. Батчами обновляем discount
	batchSize := 1000
	for i := 0; i < len(products); i += batchSize {
		end := i + batchSize
		if end > len(products) {
			end = len(products)
		}

		// Передаём ruleID, чтобы все скидки получили этот rule_id
		if err := s.processBatch(ctx, products[i:end], best, &ruleID); err != nil {
			log.Printf("Batch failed: %v", err)
			continue
		}
	}

	return nil
}

// processBatch – обработка пачки товаров
func (s *SQLStore) processBatch(
	ctx context.Context,
	batch []GetProductsWithSizesByIDsRow,
	best map[int32]GetAllActiveDiscountsRow,
	ruleID *int32,
) error {
	if len(batch) == 0 {
		return nil
	}

	var params BulkUpsertDiscountParams
	params.ProductIds = make([]int32, 0, len(batch))
	params.Values = make([][]byte, 0, len(batch))
	params.DiscountPercents = make([]int32, 0, len(batch))
	params.OriginalPrices = make([]int32, 0, len(batch))
	params.DiscountedPrices = make([]int32, 0, len(batch))
	params.MinPrices = make([]int32, 0, len(batch))
	params.MaxPrices = make([]int32, 0, len(batch))
	params.RuleIds = make([]int32, 0, len(batch))

	for _, product := range batch {
		discount, ok := best[product.ID]
		if !ok {
			continue
		}

		// Если скидка 0% - пропускаем
		if discount.DiscountValue == 0 {
			continue
		}

		// Парсим sizes
		var sizesMap map[string]map[string]interface{}
		if err := json.Unmarshal(product.Sizes, &sizesMap); err != nil {
			log.Printf("Skip product %d: invalid sizes: %v", product.ID, err)
			continue
		}

		if len(sizesMap) == 0 {
			continue
		}

		// Переменные для вычислений
		var maxPercent int32 = 0
		var minPrice int32 = math.MaxInt32
		var maxPrice int32 = 0
		var displayOriginal int32 = 0
		var displayDiscounted int32 = 0

		sizeDiscounts := make(map[string]interface{})

		for size, sizeData := range sizesMap {
			basePrice := getInt32Value(sizeData["price"])

			if basePrice <= 0 {
				continue
			}

			// Вычисляем цену со скидкой
			var discountedPrice int32
			var percent int32

			switch discount.DiscountType {
			case "percentage":
				percent = discount.DiscountValue
				discountedPrice = basePrice * (100 - discount.DiscountValue) / 100
			case "fixed_amount":
				discountedPrice = basePrice - discount.DiscountValue
				if discountedPrice > 0 && basePrice > 0 {
					percent = (discount.DiscountValue * 100) / basePrice
				} else {
					percent = 0
				}
			default:
				discountedPrice = basePrice
				percent = 0
			}

			if discountedPrice < 0 {
				discountedPrice = 0
			}

			// Если скидка не применяется - пропускаем размер
			if discountedPrice >= basePrice || percent == 0 {
				continue
			}

			// Записываем данные для размера
			sizeDiscounts[size] = map[string]interface{}{
				"original_price":   basePrice,
				"discounted_price": discountedPrice,
				"percent":          percent,
			}

			// Обновляем максимумы/минимумы
			if percent > maxPercent {
				maxPercent = percent
				displayOriginal = basePrice
				displayDiscounted = discountedPrice
			}

			if discountedPrice < minPrice {
				minPrice = discountedPrice
			}
			if basePrice > maxPrice {
				maxPrice = basePrice
			}
		}

		// Если ни один размер не получил скидку - пропускаем
		if len(sizeDiscounts) == 0 || maxPercent == 0 {
			continue
		}

		// Формируем JSON
		valueJSON, err := json.Marshal(sizeDiscounts)
		if err != nil {
			log.Printf("Failed to marshal discounts for product %d: %v", product.ID, err)
			continue
		}

		// Определяем rule_id
		var ruleIDValue int32 = 0 // 0 = NULL
		if ruleID != nil {
			// Если передан ruleID (из RecalculateAffectedProducts)
			ruleIDValue = *ruleID
		} else if discount.RuleID != 0 {
			// Если не передан, но у скидки есть RuleID (из RecalculateAllDiscounts)
			ruleIDValue = discount.RuleID
		}
		// Если ruleID == nil и discount.RuleID == 0 → rule_id = 0 (NULL в БД)

		params.ProductIds = append(params.ProductIds, product.ID)
		params.Values = append(params.Values, valueJSON)
		params.DiscountPercents = append(params.DiscountPercents, maxPercent)
		params.OriginalPrices = append(params.OriginalPrices, displayOriginal)
		params.DiscountedPrices = append(params.DiscountedPrices, displayDiscounted)
		params.MinPrices = append(params.MinPrices, minPrice)
		params.MaxPrices = append(params.MaxPrices, maxPrice)
		params.RuleIds = append(params.RuleIds, ruleIDValue)
	}

	if len(params.ProductIds) == 0 {
		return nil
	}

	return s.BulkUpsertDiscount(ctx, params)
}

func getInt32Value(v interface{}) int32 {
	switch val := v.(type) {
	case float64:
		return int32(val)
	case int32:
		return val
	case json.Number:
		i, _ := val.Int64()
		return int32(i)
	default:
		return 0
	}
}

// store/admin_products.go

// MissingImageInfo - информация о продукте без изображений
type MissingImageInfo struct {
	ID         int32  `json:"id"`
	Name       string `json:"name"`
	Article    string `json:"article"`
	ImagePath  string `json:"image_path"`
	Status     string `json:"status"`
	ImageCount int32  `json:"image_count"`
	Firm       string `json:"firm"`
	Reason     string `json:"reason"` // причина отсутствия
}

// FindProductsWithMissingImages находит продукты без физических файлов
func (store *SQLStore) FindProductsWithMissingImages(
	ctx context.Context,
	imageService *services.ImageService,
) ([]MissingImageInfo, error) {

	// 1. Получаем все продукты с image_path
	products, err := store.GetProductsWithoutImages(ctx)
	if err != nil {
		return nil, fmt.Errorf("ошибка получения продуктов: %w", err)
	}

	var missingProducts []MissingImageInfo

	for _, product := range products {
		physicalPath := store.ImagePathBuilder.GetPhysicalPath(product.ImagePath)

		// Проверяем существование директории
		dirInfo, err := os.Stat(physicalPath)
		if err != nil {
			if os.IsNotExist(err) {
				// Папка не существует - нет ни одного изображения
				missingProducts = append(missingProducts, MissingImageInfo{
					ID:         product.ID,
					Name:       product.Name,
					Article:    product.Article,
					ImagePath:  product.ImagePath,
					Status:     product.Status,
					ImageCount: product.ImageCount,
					Firm:       product.Firm.String,
					Reason:     "папка не существует",
				})
				continue
			}
			return nil, fmt.Errorf("ошибка проверки папки %s: %w", physicalPath, err)
		}

		if !dirInfo.IsDir() {
			missingProducts = append(missingProducts, MissingImageInfo{
				ID:         product.ID,
				Name:       product.Name,
				Article:    product.Article,
				ImagePath:  product.ImagePath,
				Status:     product.Status,
				ImageCount: product.ImageCount,
				Firm:       product.Firm.String,
				Reason:     "путь не является директорией",
			})
			continue
		}

		// Проверяем наличие файлов изображений
		entries, err := os.ReadDir(physicalPath)
		if err != nil {
			return nil, fmt.Errorf("ошибка чтения директории %s: %w", physicalPath, err)
		}

		hasImages := false
		webpCount := 0
		for _, entry := range entries {
			if !entry.IsDir() {
				name := strings.ToLower(entry.Name())
				// Считаем только WebP оригиналы (не _thumb)
				if strings.HasSuffix(name, ".webp") && !strings.Contains(name, "_thumb") {
					hasImages = true
					webpCount++
				}
			}
		}

		if !hasImages {
			missingProducts = append(missingProducts, MissingImageInfo{
				ID:         product.ID,
				Name:       product.Name,
				Article:    product.Article,
				ImagePath:  product.ImagePath,
				Status:     product.Status,
				ImageCount: product.ImageCount,
				Firm:       product.Firm.String,
				Reason:     fmt.Sprintf("директория существует, но нет WebP файлов (файлов в папке: %d)", len(entries)),
			})
		} else if int32(webpCount) != product.ImageCount {
			// Частично не хватает изображений
			missingProducts = append(missingProducts, MissingImageInfo{
				ID:         product.ID,
				Name:       product.Name,
				Article:    product.Article,
				ImagePath:  product.ImagePath,
				Status:     product.Status,
				ImageCount: product.ImageCount,
				Firm:       product.Firm.String,
				Reason:     fmt.Sprintf("неполные изображения: ожидалось %d, найдено %d", product.ImageCount, webpCount),
			})
		}
	}

	return missingProducts, nil
}

// CleanProductsWithoutImages удаляет/архивирует продукты без изображений
func (store *SQLStore) CleanProductsWithoutImages(
	ctx context.Context,
	imageService *services.ImageService,
	dryRun bool, // если true - только возвращает список, не удаляет
) (*CleanProductsResult, error) {

	missingProducts, err := store.FindProductsWithMissingImages(ctx, imageService)
	if err != nil {
		return nil, err
	}

	result := &CleanProductsResult{
		TotalMissing: len(missingProducts),
		Products:     missingProducts,
		DeletedIDs:   []int32{},
		ArchivedIDs:  []int32{},
		EmptyDirs:    []string{},
	}

	if dryRun {
		return result, nil
	}

	// Разделяем на полностью отсутствующие и частичные
	var deleteIDs []int32
	var archiveIDs []int32

	for _, p := range missingProducts {
		if strings.Contains(p.Reason, "папка не существует") ||
			strings.Contains(p.Reason, "нет WebP файлов") {
			// Полностью отсутствуют - можно удалять
			deleteIDs = append(deleteIDs, p.ID)
		} else {
			// Частичные - архивируем
			archiveIDs = append(archiveIDs, p.ID)
		}
	}

	// Помечаем как удалённые (полностью без картинок)
	if len(deleteIDs) > 0 {
		err = store.MarkProductsAsDeleted(ctx, deleteIDs)
		if err != nil {
			return nil, fmt.Errorf("ошибка удаления продуктов: %w", err)
		}
		result.DeletedIDs = deleteIDs

		// Удаляем пустые директории
		for _, p := range missingProducts {
			physicalPath := store.ImagePathBuilder.GetPhysicalPath(p.ImagePath)
			// Пробуем удалить папку если она пустая
			if err := os.Remove(physicalPath); err == nil {
				result.EmptyDirs = append(result.EmptyDirs, p.ImagePath)
			}
		}
	}

	// Архивируем частичные (если нужно)
	if len(archiveIDs) > 0 {
		// Можно добавить статус 'archived' или просто пометить
		result.ArchivedIDs = archiveIDs
	}

	return result, nil
}

// CleanProductsResult - результат очистки
type CleanProductsResult struct {
	TotalMissing int                `json:"total_missing"`
	Products     []MissingImageInfo `json:"products"`
	DeletedIDs   []int32            `json:"deleted_ids"`
	ArchivedIDs  []int32            `json:"archived_ids"`
	EmptyDirs    []string           `json:"empty_dirs"`
}
