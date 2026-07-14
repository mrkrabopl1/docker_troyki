package db

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/mrkrabopl1/go_db/db/query"
	"github.com/mrkrabopl1/go_db/types"
)

// ==================== СТРУКТУРЫ ОТВЕТОВ ====================

type ProductsPageAndFilters struct {
	ProductsPageInfo []types.ProductsSearch
	PageSize         int
	Filter           GetFiltersByNameCategoryAndTypeRow
}

type RespSearchProductsByString struct {
	Products   []ProductsResponseD `json:"products"`
	TotalCount int                 `json:"totalCount"`
}

type RespProductsByStringStruct struct {
	Merch      []ProductsResponseD `json:"products"`
	TotalCount int                 `json:"totalCount"`
}

type ProductsInfoResponse struct {
	Name           string                 `json:"name"`
	Info           map[string]interface{} `json:"info"`
	Discount       map[string]interface{} `json:"discount"`
	ProductType    int32                  `json:"type_id"`
	Category       int32                  `json:"category_id"`
	Article        string                 `json:"article"`
	Store          interface{}            `json:"store"`
	Firm           string                 `json:"firm"`
	Line           string                 `json:"line"`
	LineProducts   []LineProductResponse  `json:"line_products"`
	ImageCount     int32                  `json:"image_count"`
	ImagePath      string                 `json:"image_path"`
	Id             int32                  `json:"id"`
	ImageExtansion string                 `json:"image_extansion"`
}

type ProductsResponseD struct {
	Name            string      `json:"name"`
	Id              int32       `json:"id"`
	Image           []string    `json:"imgs"`
	Discount        interface{} `json:"discount"`
	Price           int         `json:"price"`
	Status          string      `json:"status"`
	DiscountPercent int32       `json:"discount_percent"`
}

type FiltersSearchResponse struct {
	FirmsCount interface{} `json:"firmsCount"`
	LinesData  interface{} `json:"linesData"`
	Price      [2]int32    `json:"price"`
	Sizes      interface{} `json:"sizes"`
	Types      interface{} `json:"types"`
	Discounts  interface{} `json:"discounts"`
}

type RespSearchProductsAndFiltersByString struct {
	Products   []ProductsResponseD   `json:"products"`
	TotalCount float64               `json:"totalCount"`
	Filters    FiltersSearchResponse `json:"filters"`
}

type CategoryData struct {
	Category   int32             `json:"category"`
	TotalCount int64             `json:"total_count"`
	Products   []ProductMainInfo `json:"products"`
}

type ProductMainInfo struct {
	Name     string      `json:"name"`
	Id       int32       `json:"id"`
	Image    string      `json:"image_path"`
	Discount interface{} `json:"discount"`
	Price    int32       `json:"price"`
}

type ProductInfo struct {
	GlobalID    int32                  `json:"global_id"`
	Producttype string                 `json:"producttype"`
	Minprice    int32                  `json:"minprice"`
	Maxprice    int32                  `json:"maxprice"`
	Name        string                 `json:"name"`
	Image       []string               `json:"imgs"`
	Discount    interface{}            `json:"discount"`
	Sizes       map[string]interface{} `json:"sizes"`
	Article     string                 `json:"article"`
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С ИЗОБРАЖЕНИЯМИ ====================

// getProductImages возвращает массив из count изображений для продукта
func (store *SQLStore) getProductImages(imagePath string, count int) []string {
	if count <= 0 {
		return []string{}
	}

	imageBasePath := store.ImagePathBuilder.GetProductMainImage(imagePath)
	images := make([]string, 0, count)
	for i := 1; i <= count; i++ {
		images = append(images, imageBasePath)
	}
	return images
}

// getProductMainImage возвращает главное изображение продукта
func (store *SQLStore) getProductMainImage(imagePath string) string {
	return store.ImagePathBuilder.GetProductMainImage(imagePath)
}

// getDiscountValue возвращает значение скидки или nil
func getDiscountValue(maxDiscPrice pgtype.Int4) interface{} {
	if maxDiscPrice.Valid && maxDiscPrice.Int32 != 0 {
		return maxDiscPrice.Int32
	}
	return nil
}

// getDiscountValueInt32 возвращает значение скидки или 0
func getDiscountValueInt32(maxDiscPrice int32) interface{} {
	if maxDiscPrice != 0 {
		return maxDiscPrice
	}
	return nil
}

// ==================== ОСНОВНЫЕ МЕТОДЫ ====================

func (store *SQLStore) GetProductsInfoByIdComplex(ctx context.Context, id int32) (ProductsInfoResponse, error) {
	snickers, err := store.Queries.GetProductsInfoById(ctx, id)
	fmt.Println(snickers, "test")
	if err != nil {
		return ProductsInfoResponse{}, err
	}

	lineMerch, err := store.Queries.GetSoloCollectionWithCount(ctx, GetSoloCollectionWithCountParams{
		Line:      snickers.Line.String,
		Firm:      snickers.Firm,
		Limitval:  10,
		Offsetval: 0,
	})
	if err != nil {
		return ProductsInfoResponse{}, err
	}

	ProductsInfoResp := store.buildProductsInfoResponse(snickers)
	ProductsInfoResp.LineProducts = store.buildLineProductsResponse(lineMerch)
	fmt.Print(ProductsInfoResp.LineProducts)
	return ProductsInfoResp, nil
}

type LineProductResponse struct {
	Minprice     int32       `json:"minprice"`
	ID           int32       `json:"id"`
	ImagePath    string      `json:"image_path"` // Полный путь к изображению
	Name         string      `json:"name"`
	Firm         string      `json:"firm"`
	Maxdiscprice interface{} `json:"maxdiscprice"`
	TotalCount   int64       `json:"total_count"`
}

func (store *SQLStore) buildLineProductsResponse(products []GetSoloCollectionWithCountRow) []LineProductResponse {
	result := make([]LineProductResponse, 0, len(products))
	for _, p := range products {
		fullImagePath := store.ImagePathBuilder.GetProductMainImage(p.ImagePath)

		var discount interface{}
		if p.DiscountedPrice.Valid && p.DiscountedPrice.Int32 != 0 {
			discount = p.DiscountedPrice.Int32
		} else {
			discount = nil
		}

		result = append(result, LineProductResponse{
			Minprice:     p.Minprice,
			ID:           p.ID,
			ImagePath:    fullImagePath,
			Name:         p.Name,
			Firm:         p.Firm,
			Maxdiscprice: discount,
			TotalCount:   p.TotalCount,
		})
	}
	return result
}

func (store *SQLStore) buildProductsInfoResponse(snInfo GetProductsInfoByIdRow) ProductsInfoResponse {
	var jsonData map[string]interface{}
	json.Unmarshal(snInfo.Sizes, &jsonData)

	var discount map[string]interface{}
	if snInfo.Value != nil {
		json.Unmarshal(snInfo.Value, &discount)
	}

	fmt.Println(snInfo, "teaaaaaaaaaaast")
	return ProductsInfoResponse{
		Name:           snInfo.Name,
		ImageCount:     snInfo.ImageCount,
		Firm:           snInfo.Firm,
		Line:           snInfo.Line.String,
		Info:           jsonData,
		Discount:       discount,
		ProductType:    snInfo.Type,
		Category:       snInfo.Category,
		Article:        snInfo.Article,
		Store:          snInfo.StoreInfo,
		ImagePath:      store.ImagePathBuilder.GetImageURLFromPath(snInfo.ImagePath),
		Id:             snInfo.ID,
		ImageExtansion: "webp",
	}
}

func (store *SQLStore) GetProductsByString(ctx context.Context, name string, page int, size int, filters types.ProductsFilterStruct, orderedType int) (RespSearchProductsByString, error) {
	data, err := store.getProductsByFilters(ctx, GetFiltersByNameCategoryAndTypeParamsNew{Name: pgtype.Text{String: name, Valid: true}}, filters, page, size, orderedType, false)
	if err != nil {
		return RespSearchProductsByString{}, err
	}

	return RespSearchProductsByString{
		Products:   store.buildProductsResponseD(data.Products),
		TotalCount: int(math.Ceil(float64(data.TotalCount))),
	}, nil
}

func (store *SQLStore) GetProductsByFiltersComplex(ctx context.Context, name string, page int, size int, filters types.ProductsFilterStruct, orderedType int32) (RespProductsByStringStruct, error) {
	data, err := store.getProductsByFilters(ctx, GetFiltersByNameCategoryAndTypeParamsNew{Name: pgtype.Text{String: name, Valid: true}}, filters, page, size, int(orderedType), true)
	if err != nil {
		return RespProductsByStringStruct{}, err
	}

	return RespProductsByStringStruct{
		Merch:      store.buildProductsResponseD(data.Products),
		TotalCount: int(math.Ceil(float64(data.TotalCount))),
	}, nil
}

type FilterParams struct {
	Type     *int32  // id типа товара (может быть nil)
	Category *int32  // id категории (может быть nil)
	Name     *string // поисковая строка (может быть nil)
	BrandID  *int32  // id бренда (может быть nil)
}

// FiltersResult – результат агрегации фильтров (JSON-поля как сырой JSON)
type FiltersResult struct {
	Sizes         json.RawMessage `json:"sizes"`
	Bodytypes     json.RawMessage `json:"bodytypes"`
	MinPrice      int32           `json:"min_price"`
	MaxPrice      int32           `json:"max_price"`
	Firms         json.RawMessage `json:"firms"`
	ProductTypes  json.RawMessage `json:"product_types"`
	DiscountRules json.RawMessage `json:"discount_rules"`
}

func (s *SQLStore) GetFiltersOptimized(ctx context.Context, params FilterParams) (*FiltersResult, error) {
	// Начинаем транзакцию
	tx, err := s.BeginTx(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// ---- 1. Создаём временную таблицу ----
	if _, err = tx.Exec(ctx, query.CreateTempTableSQL,
		params.Type,
		params.Category,
		params.Name,
		params.BrandID,
	); err != nil {
		return nil, fmt.Errorf("create temp table: %w", err)
	}

	// ---- 2. Создаём индексы ----
	for _, idxSQL := range []string{
		query.CreateIndexIDSQL,
		query.CreateIndexBrandSQL,
		query.CreateIndexLineSQL,
	} {
		if _, err = tx.Exec(ctx, idxSQL); err != nil {
			return nil, fmt.Errorf("create index: %w", err)
		}
	}

	// ---- 3. Выполняем агрегацию ----
	row, err := tx.GetAggregatedFilters(ctx)
	if err != nil {
		return nil, fmt.Errorf("query filters: %w", err)
	}

	// ---- 4. Коммитим транзакцию ----
	if err = tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	// ---- 5. Преобразуем результат с приведением типов ----
	res := &FiltersResult{
		Sizes:        json.RawMessage(row.Sizes),
		Bodytypes:    json.RawMessage(row.Bodytypes),
		Firms:        json.RawMessage(row.Firms),
		ProductTypes: json.RawMessage(row.ProductTypes),
	}

	// min_price
	if row.MinPrice != nil {
		switch v := row.MinPrice.(type) {
		case int64:
			res.MinPrice = int32(v)
		case int32:
			res.MinPrice = v
		case float64:
			res.MinPrice = int32(v)
		default:
			res.MinPrice = 0
		}
	}

	// max_price
	if row.MaxPrice != nil {
		switch v := row.MaxPrice.(type) {
		case int64:
			res.MaxPrice = int32(v)
		case int32:
			res.MaxPrice = v
		case float64:
			res.MaxPrice = int32(v)
		default:
			res.MaxPrice = 0
		}
	}

	// discount_rules
	if dr, ok := row.DiscountRules.([]byte); ok {
		res.DiscountRules = json.RawMessage(dr)
	} else {
		// Если NULL или другой тип – возвращаем пустой массив
		res.DiscountRules = json.RawMessage([]byte("[]"))
	}

	return res, nil
}
func (s *SQLStore) GetFiltersOptimizedMemo(ctx context.Context, params FilterParams) (*FiltersResult, error) {
	// Используй указатели, а не значения
	var typePtr, categoryPtr, brandPtr interface{}
	var namePtr interface{}

	if params.Type != nil {
		typePtr = int(*params.Type) // 👈 ПРИВЕДИ К INT
	}
	if params.Category != nil {
		categoryPtr = int(*params.Category) // 👈 ПРИВЕДИ К INT
	}
	if params.Name != nil {
		namePtr = *params.Name
	}
	if params.BrandID != nil {
		brandPtr = int(*params.BrandID) // 👈 ПРИВЕДИ К INT
	}

	query := `
    WITH product_data AS MATERIALIZED (
        SELECT 
            p.id, p.brand_id, p.line_id, p.type, p.bodytype, 
            p.minprice, p.maxprice,
            b.name as firm
        FROM products p
        JOIN brands b ON p.brand_id = b.id AND b.is_active = true
        WHERE p.status = 'active'
          AND ($1::int IS NULL OR p.type = $1)
          AND ($2::int IS NULL OR p.category = $2)
          AND ($3::text IS NULL OR p.name ILIKE '%' || $3 || '%')
          AND ($4::int IS NULL OR p.brand_id = $4)
    )
    SELECT 
        COALESCE(
            (SELECT jsonb_object_agg(bodytype, cnt)::text 
             FROM (SELECT bodytype, COUNT(*) cnt FROM product_data GROUP BY bodytype) s),
            '{}'::text
        ) AS bodytypes,
        
        COALESCE(
            (SELECT jsonb_object_agg(firm, cnt)::text 
             FROM (SELECT firm, COUNT(*) cnt FROM product_data GROUP BY firm) s),
            '{}'::text
        ) AS firms,
        
        COALESCE(
            (SELECT jsonb_agg(type)::text 
             FROM (SELECT type FROM product_data GROUP BY type) s),
            '[]'::text
        ) AS product_types,
        
        COALESCE((SELECT MIN(minprice) FROM product_data), 0) AS min_price,
        COALESCE((SELECT MAX(maxprice) FROM product_data), 0) AS max_price,
        
        COALESCE(
            (SELECT jsonb_object_agg(size_key, cnt)::text
             FROM (SELECT size_key, COUNT(*) cnt
                   FROM product_sizes ps
                   WHERE ps.product_id IN (SELECT id FROM product_data)
                     AND ps.price > 0
                   GROUP BY size_key) s),
            '{}'::text
        ) AS sizes,
        
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', dr.id,
                    'name', dr.name,
                    'discount_type', dr.discount_type,
                    'discount_value', dr.discount_value,
                    'priority', dr.priority
                )
             )::text
             FROM discount_rules dr
             WHERE dr.id IN (
                 SELECT DISTINCT d.rule_id
                 FROM discount d
                 WHERE d.productid IN (SELECT id FROM product_data)
                   AND d.discount_percent > 0
             )
             AND dr.is_active
             AND dr.starts_at <= NOW()
             AND (dr.ends_at IS NULL OR dr.ends_at > NOW())
            ),
            '[]'::text
        ) AS discount_rules
    `

	var bodytypes, firms, productTypes, sizes, discountRules string
	var minPrice, maxPrice int32

	err := s.connPool.QueryRow(ctx, query,
		typePtr,     // $1
		categoryPtr, // $2
		namePtr,     // $3
		brandPtr,    // $4
	).Scan(
		&bodytypes,
		&firms,
		&productTypes,
		&minPrice,
		&maxPrice,
		&sizes,
		&discountRules,
	)
	if err != nil {
		return nil, fmt.Errorf("query filters: %w", err)
	}

	return &FiltersResult{
		Bodytypes:     json.RawMessage(bodytypes),
		Firms:         json.RawMessage(firms),
		ProductTypes:  json.RawMessage(productTypes),
		MinPrice:      minPrice,
		MaxPrice:      maxPrice,
		Sizes:         json.RawMessage(sizes),
		DiscountRules: json.RawMessage(discountRules),
	}, nil
}

type GetFiltersByNameCategoryAndTypeParamsNew struct {
	Type     pgtype.Int4 `json:"type"`
	Category pgtype.Int4 `json:"category"`
	Name     pgtype.Text `json:"name"`
	BrandID  pgtype.Int4 `json:"brand_id"` // 👈 ДОБАВЛЯЕМ
}

func (store *SQLStore) GetProductsAndFiltersByNameCategoryAndType(
	ctx context.Context,
	filtersParams GetFiltersByNameCategoryAndTypeParamsNew,
	page int, size int,
	filters types.ProductsFilterStruct,
	orderedType int,
) (RespSearchProductsAndFiltersByString, error) {

	startTotal := time.Now()
	log.Printf("  📦 [GetProductsAndFiltersByNameCategoryAndType] START")

	// ---- 1. Получение продуктов ----
	startProducts := time.Now()
	data, err := store.getProductsByFilters(ctx, filtersParams, filters, page, size, orderedType, false)
	productsDuration := time.Since(startProducts)
	log.Printf("  ⏱️ [1] getProductsByFilters: %v, найдено %d товаров, всего %d",
		productsDuration, len(data.Products), data.TotalCount)

	if err != nil {
		log.Printf("  ❌ [ERROR] getProductsByFilters: %v", err)
		return RespSearchProductsAndFiltersByString{}, err
	}

	// ---- 2. Получение фильтров ----
	startFilters := time.Now()

	// Конвертируем параметры
	var typeID, categoryID, brandID int32
	var name string

	if filtersParams.Type.Valid {
		typeID = filtersParams.Type.Int32
	}
	if filtersParams.Category.Valid {
		categoryID = filtersParams.Category.Int32
	}
	if filtersParams.Name.Valid {
		name = filtersParams.Name.String
	}
	if filtersParams.BrandID.Valid {
		brandID = filtersParams.BrandID.Int32
	}
	fmt.Println("BrandId", brandID)
	// Определяем, что показывать: бренды или линии
	// Если BrandID передан и > 0 — показываем линии
	useLines := brandID > 0

	var minPrice, maxPrice int32
	var sizes, filtersData, types, discounts, linesData json.RawMessage

	if useLines {
		fmt.Println("useLines")
		row, err := store.GetFiltersByNameCategoryAndTypeNewWithLine(ctx, GetFiltersByNameCategoryAndTypeNewWithLineParams{
			Column1: typeID,
			Column2: categoryID,
			Column3: name,
			Column4: brandID,
		})
		if err != nil {
			log.Printf("  ❌ [ERROR] GetFiltersByNameCategoryAndTypeNewWithLine: %v", err)
			return RespSearchProductsAndFiltersByString{}, err
		}
		minPrice = toInt32(row.MinPrice)
		maxPrice = toInt32(row.MaxPrice)
		sizes = toJSONRawMessage(row.Sizes, "{}")
		linesData = toJSONRawMessage(row.Lines, "{}")
		types = toJSONRawMessage(row.ProductTypes, "[]")
		discounts = toJSONRawMessage(row.DiscountRules, "[]")
		filtersData = json.RawMessage("[]")
	} else {
		row, err := store.GetFiltersByNameCategoryAndTypeNew(ctx, GetFiltersByNameCategoryAndTypeNewParams{
			Column1: typeID,
			Column2: categoryID,
			Column3: name,
		})
		if err != nil {
			log.Printf("  ❌ [ERROR] GetFiltersByNameCategoryAndTypeNew: %v", err)
			return RespSearchProductsAndFiltersByString{}, err
		}
		minPrice = toInt32(row.MinPrice)
		maxPrice = toInt32(row.MaxPrice)
		sizes = toJSONRawMessage(row.Sizes, "{}")
		filtersData = toJSONRawMessage(row.Firms, "{}")
		types = toJSONRawMessage(row.ProductTypes, "[]")
		discounts = toJSONRawMessage(row.DiscountRules, "[]")
	}

	filtersDuration := time.Since(startFilters)
	log.Printf("  ⏱️ [2] GetFilters (новый метод): %v", filtersDuration)

	// ---- 3. Сборка ответа ----
	startBuild := time.Now()
	products := store.buildProductsResponseD(data.Products)
	buildDuration := time.Since(startBuild)
	log.Printf("  ⏱️ [3] buildProductsResponseD: %v, %d товаров", buildDuration, len(products))

	// ---- 4. Формирование результата ----
	var totalCount float64
	if len(data.Products) > 0 {
		totalCount = float64(data.TotalCount)
	}

	result := RespSearchProductsAndFiltersByString{
		Products:   products,
		TotalCount: totalCount,
		Filters: FiltersSearchResponse{
			Price:      [2]int32{minPrice, maxPrice},
			Sizes:      sizes,
			FirmsCount: filtersData,
			LinesData:  linesData,
			Types:      types,
			Discounts:  discounts,
		},
	}

	totalDuration := time.Since(startTotal)
	log.Printf("  ⏱️ [TOTAL] GetProductsAndFiltersByNameCategoryAndType: %v", totalDuration)
	log.Printf("  📦 [GetProductsAndFiltersByNameCategoryAndType] END")

	return result, nil
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ КОНВЕРТАЦИИ
// ============================================================

// toInt32 конвертирует interface{} в int32
func toInt32(v interface{}) int32 {
	if v == nil {
		return 0
	}
	switch val := v.(type) {
	case int32:
		return val
	case int64:
		return int32(val)
	case float64:
		return int32(val)
	case int:
		return int32(val)
	default:
		return 0
	}
}

// toJSONRawMessage конвертирует interface{} в json.RawMessage
func toJSONRawMessage(v interface{}, defaultVal string) json.RawMessage {
	if v == nil {
		return json.RawMessage(defaultVal)
	}

	switch val := v.(type) {
	case []byte:
		return json.RawMessage(val)
	case string:
		return json.RawMessage(val)
	case json.RawMessage:
		return val
	default:
		// Пробуем сериализовать
		data, err := json.Marshal(v)
		if err != nil {
			return json.RawMessage(defaultVal)
		}
		return json.RawMessage(data)
	}
}

// getProductsByFilters - обобщенная функция для получения продуктов с фильтрами
// func (store *SQLStore) getProductsByFilters(ctx context.Context, mainFilter GetFiltersByNameCategoryAndTypeParams, filters types.ProductsFilterStruct, page, size, orderedType int, usePriceFilter bool) ([]GetProductsByFiltersRow, error) {
// 	offset := (page - 1) * size

// 	params := GetProductsByFiltersParams{
// 		Limitval:     int32(size),
// 		Offsetval:    int32(offset),
// 		Sizes:        filters.Sizes,
// 		Firms:        filters.Firms,
// 		Bodytypes:    filters.Bodytypes,
// 		ProductTypes: filters.Types,
// 		SortType:     int32(orderedType),
// 		HasDiscount:  filters.HasDiscount,
// 		InStore:      filters.InStore,
// 		WithPrice:    filters.WithPrice,
// 		Lines:        filters.Lines,
// 		Status:       filters.Status,
// 	}

// 	// Используем указатели для nullable полей
// 	if mainFilter.Name.Valid {
// 		params.Name = mainFilter.Name.String
// 	} else {
// 		params.Name = "" // или оставляем как есть, если в SQL есть проверка на NULL
// 	}

// 	// Категории: передаем nil если не валидно
// 	if mainFilter.Category.Valid {
// 		params.Categories = []int32{mainFilter.Category.Int32}
// 	} else {
// 		params.Categories = nil // или []int32{}
// 	}

// 	// Аналогично для Type, если нужно
// 	if mainFilter.Type.Valid {
// 		params.ProductTypes = append(params.ProductTypes, mainFilter.Type.Int32)
// 	}

// 	if usePriceFilter && filters.Price != nil && len(filters.Price) == 2 {
// 		params.Minprice = pgtype.Int4{Int32: int32(filters.Price[0]), Valid: true}
// 		params.Maxprice = pgtype.Int4{Int32: int32(filters.Price[1]), Valid: true}
// 	}

// 	// Отладка
// 	log.Printf("Query params: sizes=%v, firms=%v, categories=%v, name=%q",
// 		params.Sizes, params.Firms, params.Categories, params.Name)

// 	return store.GetProductsByFilters(ctx, params)
// }

func (store *SQLStore) buildProductsResponseD(data []ProductRow) []ProductsResponseD {
	if len(data) == 0 {
		return []ProductsResponseD{}
	}

	result := make([]ProductsResponseD, 0, len(data))
	for _, row := range data {
		result = append(result, ProductsResponseD{
			Name:            row.Name,
			Id:              row.ID,
			Image:           store.getProductImages(row.ImagePath, 2), // 2 изображения
			Price:           int(row.MinPrice),
			Discount:        getDiscountValue(pgtype.Int4{Valid: row.MaxDiscPrice != 0, Int32: getInt32Value(row.MaxDiscPrice)}),
			DiscountPercent: int32(row.DiscountPercent),
		})
	}
	return result
}

func (store *SQLStore) GetMainPageInfoComplex(ctx context.Context, limit int32) (map[int32]CategoryData, error) {
	info, err := store.Queries.GetMainPageInfo(ctx, limit)
	if err != nil {
		return nil, err
	}
	return store.groupProducts(info), nil
}

func (store *SQLStore) groupProducts(rows []GetMainPageInfoRow) map[int32]CategoryData {
	categories := make(map[int32]CategoryData)

	for _, row := range rows {
		if _, exists := categories[row.Category]; !exists {
			categories[row.Category] = CategoryData{
				Category:   row.Category,
				TotalCount: row.CategoryProductCount,
				Products:   []ProductMainInfo{},
			}
		}

		cat := categories[row.Category]
		cat.Products = append(cat.Products, ProductMainInfo{
			Id:    row.ID,
			Name:  row.Name,
			Price: row.Minprice,
			Image: store.ImagePathBuilder.GetProductMainImage(row.ImagePath),
		})
		categories[row.Category] = cat
	}

	return categories
}

func (store *SQLStore) GetProductsByNameComplex(ctx context.Context, name string, limit int32) ([]types.ProductsSearchResponse, error) {
	products, err := store.Queries.GetProductsByName(ctx, GetProductsByNameParams{
		Column1: name,
		Limit:   limit,
	})
	if err != nil {
		return []types.ProductsSearchResponse{}, err
	}

	return store.buildProductsSearchResponse(products), nil
}

func (store *SQLStore) buildProductsSearchResponse(products []GetProductsByNameRow) []types.ProductsSearchResponse {
	result := make([]types.ProductsSearchResponse, 0, len(products))
	for _, p := range products {
		result = append(result, types.ProductsSearchResponse{
			Image: store.getProductMainImage(p.ImagePath),
			Price: int(p.MinPrice),
			Id:    int(p.GlobalID),
			Name:  p.Name,
			Firm:  p.Firm,
		})
	}
	return result
}

func (store *SQLStore) GetSoloCollectionComplex(ctx context.Context, arg GetSoloCollectionParams) ([]types.ProductsSearchResponse1, error) {
	products, err := store.Queries.GetSoloCollection(ctx, arg)
	if err != nil {
		return []types.ProductsSearchResponse1{}, err
	}

	return store.buildProductsSearchResponse1(products), nil
}

func (store *SQLStore) buildProductsSearchResponse1(products []GetSoloCollectionRow) []types.ProductsSearchResponse1 {
	result := make([]types.ProductsSearchResponse1, 0, len(products))
	for _, p := range products {
		result = append(result, types.ProductsSearchResponse1{
			Image:           store.getProductImages(p.ImagePath, 2),
			Price:           int(p.Minprice),
			Id:              int(p.ID),
			Name:            p.Name,
			Firm:            p.Firm,
			Discount:        getDiscountValueInt32(p.DiscountedPrice.Int32),
			DiscountPercent: p.DiscountPercent.Int32,
		})
	}
	return result
}

func (store *SQLStore) GetMerchCollectionComplex(ctx context.Context, arg GetMerchCollectionParams) ([]types.MerchSearchResponse, error) {
	products, err := store.Queries.GetMerchCollection(ctx, arg)
	if err != nil {
		return []types.MerchSearchResponse{}, err
	}

	return store.buildMerchSearchResponse(products), nil
}

func (store *SQLStore) buildMerchSearchResponse(products []GetMerchCollectionRow) []types.MerchSearchResponse {
	result := make([]types.MerchSearchResponse, 0, len(products))
	for _, p := range products {
		result = append(result, types.MerchSearchResponse{
			Image:      store.getProductImages(p.ImagePath, 2),
			Price:      int(p.Minprice),
			Id:         int(p.GlobalID),
			Name:       p.Name,
			Firm:       p.Firm,
			Discount:   getDiscountValueInt32(p.DiscountedPrice.Int32),
			Type:       p.Type,
			TotalCount: p.TotalCount,
		})
	}
	return result
}

func (store *SQLStore) GetProductsWithDiscountComplex(ctx context.Context) ([]types.ProductsSearchResponse1, error) {
	products, err := store.Queries.GetProductsWithDiscount(ctx)
	if err != nil {
		return []types.ProductsSearchResponse1{}, err
	}

	return store.buildDiscountProductsResponse(products), nil
}

func (store *SQLStore) buildDiscountProductsResponse(products []GetProductsWithDiscountRow) []types.ProductsSearchResponse1 {
	result := make([]types.ProductsSearchResponse1, 0, len(products))
	for _, p := range products {
		result = append(result, types.ProductsSearchResponse1{
			Image:    store.getProductImages(p.ImagePath, 2),
			Price:    int(p.MinPrice),
			Id:       int(p.ID),
			Name:     p.Name,
			Firm:     p.Firm,
			Discount: getDiscountValueInt32(p.DiscountedPrice),
		})
	}
	return result
}

// ==================== DISCOUNTS ====================
type DiscountData struct {
	Value        []byte `json:"value"`
	MinPrice     int32  `json:"min_price"`
	MaxDiscPrice int32  `json:"max_disc_price"`
	// Новые поля (опционально, для оптимизации)
	DiscountPercent int32 `json:"discount_percent,omitempty"`
	OriginalPrice   int32 `json:"original_price,omitempty"`
	DiscountedPrice int32 `json:"discounted_price,omitempty"`
	MaxPrice        int32 `json:"max_price,omitempty"`
}

func (store *SQLStore) CreateDiscounts(ctx context.Context, discountData map[int32]DiscountData) error {
	if len(discountData) == 0 {
		return nil
	}

	var productIDsBatch []int32
	var values [][]byte
	var discountPercents []int32
	var originalPrices []int32
	var discountedPrices []int32
	var minPrices []int32
	var maxPrices []int32

	for productID, discount := range discountData {
		// Проверяем, что Value не пустой
		if len(discount.Value) == 0 {
			fmt.Printf("Skipping product %d: no discount value\n", productID)
			continue
		}

		// Если DiscountData уже содержит все поля
		productIDsBatch = append(productIDsBatch, productID)
		values = append(values, discount.Value)

		// Если в DiscountData уже есть все поля - используем их
		// Иначе вычисляем из Value
		if discount.DiscountPercent > 0 || discount.OriginalPrice > 0 || discount.DiscountedPrice > 0 {
			discountPercents = append(discountPercents, discount.DiscountPercent)
			originalPrices = append(originalPrices, discount.OriginalPrice)
			discountedPrices = append(discountedPrices, discount.DiscountedPrice)
			minPrices = append(minPrices, discount.MinPrice)
			maxPrices = append(maxPrices, discount.MaxPrice)
		} else {
			// Вычисляем из Value
			percent, original, discounted, minP, maxP := calculateDiscountFields(discount.Value)
			discountPercents = append(discountPercents, percent)
			originalPrices = append(originalPrices, original)
			discountedPrices = append(discountedPrices, discounted)
			minPrices = append(minPrices, minP)
			maxPrices = append(maxPrices, maxP)
		}
	}

	if len(productIDsBatch) > 0 {
		err := store.BulkUpsertDiscount(ctx, BulkUpsertDiscountParams{
			ProductIds:       productIDsBatch,
			Values:           values,
			DiscountPercents: discountPercents,
			OriginalPrices:   originalPrices,
			DiscountedPrices: discountedPrices,
			MinPrices:        minPrices,
			MaxPrices:        maxPrices,
		})
		if err != nil {
			return fmt.Errorf("error bulk upserting discounts: %w", err)
		}
	}

	return nil
}

// calculateDiscountFields вычисляет поля из JSONB value
func calculateDiscountFields(value []byte) (discountPercent, originalPrice, discountedPrice, minPrice, maxPrice int32) {
	var sizeDiscounts map[string]map[string]interface{}
	if err := json.Unmarshal(value, &sizeDiscounts); err != nil {
		return 0, 0, 0, 0, 0
	}

	var maxPercent int32 = 0
	var minDiscounted int32 = 0
	var maxOriginal int32 = 0
	var displayOriginal int32 = 0
	var displayDiscounted int32 = 0

	for _, sizeData := range sizeDiscounts {
		original := getInt32Value(sizeData["original_price"])
		discounted := getInt32Value(sizeData["discounted_price"])
		percent := getInt32Value(sizeData["percent"])

		if original <= 0 || discounted <= 0 {
			continue
		}

		// Максимальный процент
		if percent > maxPercent {
			maxPercent = percent
			displayOriginal = original
			displayDiscounted = discounted
		}

		// Минимальная цена со скидкой
		if minDiscounted == 0 || discounted < minDiscounted {
			minDiscounted = discounted
		}

		// Максимальная оригинальная цена
		if original > maxOriginal {
			maxOriginal = original
		}
	}

	return maxPercent, displayOriginal, displayDiscounted, minDiscounted, maxOriginal
}

type productsWithCount struct {
	Products   []ProductRow // замени ProductRow на тип, который у тебя используется для построения ответа
	TotalCount int
}

type ProductRow struct {
	ID              int32
	Name            string
	ImagePath       string
	Firm            string
	MinPrice        int32
	MaxPrice        int32
	MaxDiscPrice    float64
	DiscountPercent float64
	InStore         bool
}

// Конвертеры из специфичных sqlc-строк в общую ProductRow
func baseRowToProductRow(r GetProductsByFiltersPaginateBaseRow) ProductRow {
	return ProductRow{
		ID:        r.ID,
		Name:      r.Name,
		ImagePath: r.ImagePath,
		Firm:      r.Firm,
		MinPrice:  r.Minprice,
		MaxPrice:  r.Maxprice,
	}
}

func discountRowToProductRow(r GetProductsByFiltersPaginateWithDiscountRow) ProductRow {
	return ProductRow{
		ID:              r.ID,
		Name:            r.Name,
		ImagePath:       r.ImagePath,
		Firm:            r.Firm,
		MinPrice:        r.MinPrice,
		MaxPrice:        r.MaxPrice,
		MaxDiscPrice:    float64(r.DiscountedPrice),
		DiscountPercent: float64(r.DiscountPercent),
	}
}

func storeRowToProductRow(r GetProductsByFiltersPaginateWithStoreRow) ProductRow {
	return ProductRow{
		ID:        r.ID,
		Name:      r.Name,
		ImagePath: r.ImagePath,
		Firm:      r.Firm,
		MinPrice:  r.Minprice,
		MaxPrice:  r.Maxprice,
		InStore:   r.InStore.Bool,
	}
}

func fullRowToProductRow(r GetProductsByFiltersPaginateFullRow) ProductRow {
	return ProductRow{
		ID:              r.ID,
		Name:            r.Name,
		ImagePath:       r.ImagePath,
		Firm:            r.Firm,
		MinPrice:        r.MinPrice,
		MaxPrice:        r.MaxPrice,
		MaxDiscPrice:    float64(r.DiscountedPrice),
		DiscountPercent: float64(r.DiscountPercent),
		InStore:         r.InStore.Bool,
	}
}

// Основная функция getProductsByFilters – теперь выбирает лёгкий запрос
func (store *SQLStore) getProductsByFilters(
	ctx context.Context,
	mainFilter GetFiltersByNameCategoryAndTypeParamsNew,
	filters types.ProductsFilterStruct,
	page, size, orderedType int,
	usePriceFilter bool,
) (productsWithCount, error) {
	offset := (page - 1) * size

	// Определяем необходимость фильтров
	needDiscount := filters.HasDiscount || len(filters.RuleIDs) > 0
	needStore := filters.InStore

	var total int64
	var err error
	var products []ProductRow

	switch {
	case !needDiscount && !needStore:
		// Базовая пагинация и count
		params := GetProductsByFiltersPaginateBaseParams{
			Limitval:     int32(size),
			Offsetval:    int32(offset),
			Sizes:        filters.Sizes,
			Firms:        filters.Firms,
			Bodytypes:    filters.Bodytypes,
			ProductTypes: nil,
			SortType:     int32(orderedType),
			Lines:        filters.Lines,

			WithPrice: filters.WithPrice,
			// Название и категории
			Name:       mainFilter.Name.String,
			Categories: nil,
		}
		if mainFilter.Category.Valid {
			filters.Categories = []int32{mainFilter.Category.Int32}
		}
		if mainFilter.Type.Valid {
			filters.Types = []int32{mainFilter.Type.Int32}
		}
		if mainFilter.Name.Valid {
			params.Name = mainFilter.Name.String
		} else {
			params.Name = ""
		}
		if usePriceFilter && len(filters.Price) == 2 {
			params.Minprice = pgtype.Int4{Int32: int32(filters.Price[0]), Valid: true}
			params.Maxprice = pgtype.Int4{Int32: int32(filters.Price[1]), Valid: true}
		}
		// fmt.Println("%v", params.Categories, "ddddddddddddddddddddddddddddddaaaaaaaaaaa", params.ProductTypes)
		// fmt.Println("%v", mainFilter.Category, "ddddddddddddddddddddddddddddddaaaaaaaaaaa", mainFilter.Type)
		rows, err := store.GetProductsByFiltersPaginateBase(ctx, params)
		if err != nil {
			return productsWithCount{}, err
		}
		for _, r := range rows {
			products = append(products, baseRowToProductRow(r))
		}

		countParams := CountProductsByFiltersBaseParams{
			Sizes:        filters.Sizes,
			Firms:        filters.Firms,
			Bodytypes:    filters.Bodytypes,
			ProductTypes: filters.Types,
			Lines:        filters.Lines,

			WithPrice:  filters.WithPrice,
			Name:       params.Name,
			Categories: filters.Categories,
		}
		if usePriceFilter && len(filters.Price) == 2 {
			countParams.Minprice = pgtype.Int4{Int32: int32(filters.Price[0]), Valid: true}
			countParams.Maxprice = pgtype.Int4{Int32: int32(filters.Price[1]), Valid: true}
		}
		total, err = store.CountProductsByFiltersBase(ctx, countParams)

	case needDiscount && !needStore:
		params := GetProductsByFiltersPaginateWithDiscountParams{
			Limitval:     int32(size),
			Offsetval:    int32(offset),
			Sizes:        filters.Sizes,
			Firms:        filters.Firms,
			Bodytypes:    filters.Bodytypes,
			ProductTypes: nil,
			SortType:     int32(orderedType),
			Lines:        filters.Lines,

			WithPrice:  filters.WithPrice,
			Name:       "",
			Categories: nil,
			RuleIds:    filters.RuleIDs,
		}
		if mainFilter.Category.Valid {
			params.Categories = []int32{mainFilter.Category.Int32}
		}
		if mainFilter.Name.Valid {
			params.Name = mainFilter.Name.String
		}
		if mainFilter.Type.Valid {
			filters.Types = []int32{mainFilter.Type.Int32}
		}
		if usePriceFilter && len(filters.Price) == 2 {
			params.Minprice = pgtype.Int4{Int32: int32(filters.Price[0]), Valid: true}
			params.Maxprice = pgtype.Int4{Int32: int32(filters.Price[1]), Valid: true}
		}

		rows, err := store.GetProductsByFiltersPaginateWithDiscount(ctx, params)
		if err != nil {
			return productsWithCount{}, err
		}
		for _, r := range rows {
			products = append(products, discountRowToProductRow(r))
		}

		countParams := CountProductsByFiltersWithDiscountParams{
			Sizes:        filters.Sizes,
			Firms:        filters.Firms,
			Bodytypes:    filters.Bodytypes,
			ProductTypes: filters.Types,
			Lines:        filters.Lines,

			WithPrice:  filters.WithPrice,
			Name:       params.Name,
			Categories: filters.Categories,
			RuleIds:    filters.RuleIDs,
		}
		if usePriceFilter && len(filters.Price) == 2 {
			countParams.Minprice = pgtype.Int4{Int32: int32(filters.Price[0]), Valid: true}
			countParams.Maxprice = pgtype.Int4{Int32: int32(filters.Price[1]), Valid: true}
		}
		total, err = store.CountProductsByFiltersWithDiscount(ctx, countParams)

	case !needDiscount && needStore:
		params := GetProductsByFiltersPaginateWithStoreParams{
			Limitval:     int32(size),
			Offsetval:    int32(offset),
			Sizes:        filters.Sizes,
			Firms:        filters.Firms,
			Bodytypes:    filters.Bodytypes,
			ProductTypes: nil,
			SortType:     int32(orderedType),
			Lines:        filters.Lines,

			WithPrice:  filters.WithPrice,
			Name:       "",
			Categories: nil,
		}
		if mainFilter.Category.Valid {
			filters.Categories = []int32{mainFilter.Category.Int32}
		}
		if mainFilter.Name.Valid {
			params.Name = mainFilter.Name.String
		}
		if mainFilter.Type.Valid {
			filters.Types = []int32{mainFilter.Type.Int32}
		}
		if usePriceFilter && len(filters.Price) == 2 {
			params.Minprice = pgtype.Int4{Int32: int32(filters.Price[0]), Valid: true}
			params.Maxprice = pgtype.Int4{Int32: int32(filters.Price[1]), Valid: true}
		}

		rows, err := store.GetProductsByFiltersPaginateWithStore(ctx, params)
		if err != nil {
			return productsWithCount{}, err
		}
		for _, r := range rows {
			products = append(products, storeRowToProductRow(r))
		}

		countParams := CountProductsByFiltersWithStoreParams{
			Sizes:        filters.Sizes,
			Firms:        filters.Firms,
			Bodytypes:    filters.Bodytypes,
			ProductTypes: filters.Types,
			Lines:        filters.Lines,

			WithPrice:  filters.WithPrice,
			Name:       params.Name,
			Categories: filters.Categories,
		}
		if usePriceFilter && len(filters.Price) == 2 {
			countParams.Minprice = pgtype.Int4{Int32: int32(filters.Price[0]), Valid: true}
			countParams.Maxprice = pgtype.Int4{Int32: int32(filters.Price[1]), Valid: true}
		}
		total, err = store.CountProductsByFiltersWithStore(ctx, countParams)

	case needDiscount && needStore:
		params := GetProductsByFiltersPaginateFullParams{
			Limitval:     int32(size),
			Offsetval:    int32(offset),
			Sizes:        filters.Sizes,
			Firms:        filters.Firms,
			Bodytypes:    filters.Bodytypes,
			ProductTypes: nil,
			SortType:     int32(orderedType),
			Lines:        filters.Lines,

			WithPrice:  filters.WithPrice,
			Name:       "",
			Categories: nil,
			RuleIds:    filters.RuleIDs,
		}
		if mainFilter.Category.Valid {
			filters.Categories = []int32{mainFilter.Category.Int32}
		}
		if mainFilter.Name.Valid {
			params.Name = mainFilter.Name.String
		}
		if mainFilter.Type.Valid {
			filters.Types = []int32{mainFilter.Type.Int32}
		}
		if usePriceFilter && len(filters.Price) == 2 {
			params.Minprice = pgtype.Int4{Int32: int32(filters.Price[0]), Valid: true}
			params.Maxprice = pgtype.Int4{Int32: int32(filters.Price[1]), Valid: true}
		}
		// fmt.Println("%v", params, "ddddddddddddddddddddddddddddddaaaaaaaaaaa")
		rows, err := store.GetProductsByFiltersPaginateFull(ctx, params)
		if err != nil {
			return productsWithCount{}, err
		}
		for _, r := range rows {
			products = append(products, fullRowToProductRow(r))
		}

		countParams := CountProductsByFiltersFullParams{
			Sizes:        filters.Sizes,
			Firms:        filters.Firms,
			Bodytypes:    filters.Bodytypes,
			ProductTypes: filters.Types,
			Lines:        filters.Lines,
			Status:       filters.Status,
			WithPrice:    filters.WithPrice,
			Name:         params.Name,
			Categories:   filters.Categories,
			RuleIds:      filters.RuleIDs,
		}
		if usePriceFilter && len(filters.Price) == 2 {
			countParams.Minprice = pgtype.Int4{Int32: int32(filters.Price[0]), Valid: true}
			countParams.Maxprice = pgtype.Int4{Int32: int32(filters.Price[1]), Valid: true}
		}
		total, err = store.CountProductsByFiltersFull(ctx, countParams)
	}

	if err != nil {
		return productsWithCount{}, err
	}

	return productsWithCount{
		Products:   products,
		TotalCount: int(total),
	}, nil
}

func (store *SQLStore) GetPageWidgetsFromDB(ctx context.Context) ([]types.CachedWidget, error) {
	widgets, err := store.GetActivePageWidgets(ctx)
	if err != nil {
		return nil, err
	}

	cachedWidgets := make([]types.CachedWidget, 0, len(widgets))
	for _, w := range widgets {
		cached := types.CachedWidget{
			ID:        w.ID,
			Name:      w.Name,
			Type:      w.Type,
			SortOrder: w.SortOrder,
			Settings:  w.Settings,
			LinkUrl:   w.LinkUrl,
		}

		if w.Type == "products_slider" {
			products, err := store.GetProductsForWidgetFromDB(ctx, w)
			if err == nil {
				cached.Products = products
			}
		}

		cachedWidgets = append(cachedWidgets, cached)
	}

	return cachedWidgets, nil
}

// getProductsForWidgetFromDB - получение товаров для виджета напрямую из БД
func (store *SQLStore) GetProductsForWidgetFromDB(ctx context.Context, widget PageWidget) ([]types.CachedProduct, error) {
	var settings types.ProductsFilterStruct
	if err := json.Unmarshal(widget.Settings, &settings); err != nil {
		return nil, fmt.Errorf("failed to parse settings: %w", err)
	}

	limit := 20

	settings.WithPrice = true
	fmt.Println("Settttttttttttttings", settings)
	result, err := store.GetProductsByFiltersComplex(
		ctx,
		"",
		1,
		limit,
		settings,
		0,
	)
	fmt.Println("result", result)
	if err != nil {
		return nil, err
	}

	cachedProducts := make([]types.CachedProduct, 0, len(result.Merch))
	for _, p := range result.Merch {
		imagePath := ""
		if len(p.Image) > 0 {
			imagePath = p.Image[0]
		}
		cachedProducts = append(cachedProducts, types.CachedProduct{
			ID:              p.Id,
			Name:            p.Name,
			ImagePath:       imagePath,
			Price:           int32(p.Price),
			Discount:        p.Discount,
			DiscountPercent: p.DiscountPercent,
		})
	}

	return cachedProducts, nil
}
