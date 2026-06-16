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
	DiscountValue int32  `json:"discount_value"` // 3000 = 30.00%
	DiscountType  string `json:"discount_type"`  // "percentage" или "fixed"
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
	fmt.Println(discounts, "sssssssss")
	// 2. Группируем лучшую скидку по продукту
	best := make(map[int32]GetAllActiveDiscountsRow)
	for _, d := range discounts {
		cur, exists := best[d.ProductID]
		if !exists || d.Priority > cur.Priority {
			best[d.ProductID] = d
		}
	}

	// Если скидок нет — очищаем таблицу discount (удаляем только rule-based)
	if len(best) == 0 {
		return s.DeleteAllRuleBasedDiscounts(ctx)
	}

	// 3. ID продуктов, у которых есть скидка
	ids := make([]int32, 0, len(best))
	for pid := range best {
		ids = append(ids, pid)
	}
	fmt.Println(ids, "sssssaqqqqqqqqqq")
	// 4. Получаем продукты с sizes
	products, err := s.GetProductsWithSizesByIDs(ctx, ids)
	if err != nil {
		return err
	}

	// 5. Батчами обновляем discount
	batchSize := 1000
	for i := 0; i < len(products); i += batchSize {
		end := i + batchSize
		if end > len(products) {
			end = len(products)
		}
		if err := s.processBatch(ctx, products[i:end], best); err != nil {
			return err
		}
		log.Printf("Recalculate discounts: %d/%d", end, len(products))
	}

	return nil
}

// processBatch – обработка пачки товаров
func (s *SQLStore) processBatch(ctx context.Context, batch []GetProductsWithSizesByIDsRow, best map[int32]GetAllActiveDiscountsRow) error {
	var params BulkUpsertDiscountParams
	params.ProductIds = make([]int32, 0, len(batch))
	params.Values = make([][]byte, 0, len(batch))
	params.MinPrices = make([]int32, 0, len(batch))
	params.MaxDiscPrices = make([]int32, 0, len(batch))

	for _, product := range batch {
		discount, ok := best[product.ID]
		if !ok {
			continue
		}

		// Парсим sizes
		var sizesMap map[string]map[string]interface{}
		if err := json.Unmarshal(product.Sizes, &sizesMap); err != nil {
			log.Printf("Skip product %d: invalid sizes", product.ID)
			continue
		}

		// Строим скидки для каждого размера
		sizeDiscounts := make(map[string]interface{})
		minPrice := int32(math.MaxInt32)
		maxDiscPrice := int32(0)

		for size, sizeData := range sizesMap {
			basePrice := getInt32Value(sizeData["price"])
			if basePrice == 0 {
				continue
			}

			// Вычисляем цену со скидкой
			var discountedPrice int32
			if discount.DiscountType == "percentage" {
				// discount_value = 3000 => 30.00%
				discountedPrice = basePrice * (10000 - discount.DiscountValue) / 10000
			} else {
				discountedPrice = basePrice - discount.DiscountValue
			}
			if discountedPrice < 0 {
				discountedPrice = 0
			}

			// Записываем данные для размера
			sizeDiscounts[size] = map[string]interface{}{
				"value":   discount.DiscountValue,
				"type":    discount.DiscountType,
				"rule_id": discount.RuleID,
			}

			// Обновляем min/max
			if discountedPrice < minPrice {
				minPrice = discountedPrice
			}
			if discountedPrice > maxDiscPrice {
				maxDiscPrice = discountedPrice
			}
		}

		if len(sizeDiscounts) == 0 {
			continue
		}

		valueJSON, _ := json.Marshal(sizeDiscounts)

		params.ProductIds = append(params.ProductIds, product.ID)
		params.Values = append(params.Values, valueJSON)
		params.MinPrices = append(params.MinPrices, minPrice)
		params.MaxDiscPrices = append(params.MaxDiscPrices, maxDiscPrice)
	}

	if len(params.ProductIds) == 0 {
		return nil
	}
	fmt.Println("discounts update")
	// Вызываем sqlc-метод массового вставки/обновления
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
