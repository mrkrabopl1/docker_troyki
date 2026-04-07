package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"reflect"

	"github.com/jackc/pgx/v5/pgtype"
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
	Name         string                 `json:"name"`
	Info         map[string]interface{} `json:"info"`
	Discount     map[string]interface{} `json:"discount"`
	ProductType  int32                  `json:"producttype"`
	Category     int32                  `json:"category"`
	Article      string                 `json:"article"`
	Store        interface{}            `json:"store"`
	Firm         string                 `json:"firm"`
	Line         string                 `json:"line"`
	LineProducts []LineProductResponse  `json:"line_products"`
	ImageCount   int32                  `json:"image_count"`
	ImagePath    string                 `json:"image_path"`
	Id           int32                  `json:"id"`
}

type ProductsResponseD struct {
	Name     string      `json:"name"`
	Id       int32       `json:"id"`
	Image    []string    `json:"imgs"`
	Discount interface{} `json:"discount"`
	Price    int         `json:"price"`
}

type FiltersSearchResponse struct {
	FirmsCount interface{} `json:"firmsCount"`
	Price      [2]int32    `json:"price"`
	Sizes      interface{} `json:"sizes"`
	Types      interface{} `json:"types"`
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

	imageBasePath := store.imagePathBuilder.GetProductImageBasePath(imagePath)
	images := make([]string, 0, count)
	for i := 1; i <= count; i++ {
		images = append(images, fmt.Sprintf("%s%d.png", imageBasePath, i))
	}
	return images
}

// getProductMainImage возвращает главное изображение продукта
func (store *SQLStore) getProductMainImage(imagePath string) string {
	return store.imagePathBuilder.GetProductMainImage(imagePath)
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
		Line:   snickers.Line,
		Firm:   snickers.Firm,
		Limit:  10,
		Offset: 0,
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
		fullImagePath := store.imagePathBuilder.GetProductMainImage(p.ImagePath)

		var discount interface{}
		if p.Maxdiscprice.Valid && p.Maxdiscprice.Int32 != 0 {
			discount = p.Maxdiscprice.Int32
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
		ImagePath:   store.imagePathBuilder.GetProductImageBasePath(snInfo.ImagePath),
		Id:          snInfo.ID,
	}
}

func (store *SQLStore) GetProductsByString(ctx context.Context, name string, page int, size int, filters types.ProductsFilterStruct, orderedType int) (RespSearchProductsByString, error) {
	data, err := store.getProductsByFilters(ctx, GetFiltersByNameCategoryAndTypeParams{Name: pgtype.Text{String: name, Valid: true}}, filters, page, size, orderedType, false)
	if err != nil {
		return RespSearchProductsByString{}, err
	}

	return RespSearchProductsByString{
		Products:   store.buildProductsResponseD(data),
		TotalCount: int(math.Ceil(float64(data[0].TotalCount))),
	}, nil
}

func (store *SQLStore) GetProductsByFiltersComplex(ctx context.Context, name string, page int, size int, filters types.ProductsFilterStruct, orderedType int32) (RespProductsByStringStruct, error) {
	data, err := store.getProductsByFilters(ctx, GetFiltersByNameCategoryAndTypeParams{Name: pgtype.Text{String: name, Valid: true}}, filters, page, size, int(orderedType), true)
	if err != nil {
		return RespProductsByStringStruct{}, err
	}

	return RespProductsByStringStruct{
		Merch:      store.buildProductsResponseD(data),
		TotalCount: int(math.Ceil(float64(data[0].TotalCount))),
	}, nil
}

func (store *SQLStore) GetProductsAndFiltersByNameCategoryAndType(ctx context.Context, filtersParams GetFiltersByNameCategoryAndTypeParams, page int, size int, filters types.ProductsFilterStruct, orderedType int) (RespSearchProductsAndFiltersByString, error) {
	fmt.Printf("%+v\n", filtersParams)
	data, err := store.getProductsByFilters(ctx, filtersParams, filters, page, size, orderedType, false)
	if err != nil {
		return RespSearchProductsAndFiltersByString{}, err
	}

	filter, err := store.GetFiltersByNameCategoryAndType(ctx, filtersParams)
	if err != nil {
		return RespSearchProductsAndFiltersByString{}, err
	}

	// Проверяем, есть ли данные
	var totalCount float64
	if len(data) > 0 {
		totalCount = float64(data[0].TotalCount)
	} else {
		totalCount = 0
	}

	return RespSearchProductsAndFiltersByString{
		Products:   store.buildProductsResponseD(data),
		TotalCount: totalCount,
		Filters: FiltersSearchResponse{
			Price:      [2]int32{filter.MinPrice.(int32), filter.MaxPrice.(int32)},
			Sizes:      filter.Sizes,
			FirmsCount: filter.Firms,
			Types:      filter.ProductTypes,
		},
	}, nil
}

// getProductsByFilters - обобщенная функция для получения продуктов с фильтрами
func (store *SQLStore) getProductsByFilters(ctx context.Context, mainFilter GetFiltersByNameCategoryAndTypeParams, filters types.ProductsFilterStruct, page, size, orderedType int, usePriceFilter bool) ([]GetProductsByFiltersRow, error) {
	offset := (page - 1) * size

	params := GetProductsByFiltersParams{
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

	return store.GetProductsByFilters(ctx, params)
}

func (store *SQLStore) buildProductsResponseD(data []GetProductsByFiltersRow) []ProductsResponseD {
	if len(data) == 0 {
		return []ProductsResponseD{}
	}

	result := make([]ProductsResponseD, 0, len(data))
	for _, row := range data {
		result = append(result, ProductsResponseD{
			Name:     row.Name,
			Id:       row.ID,
			Image:    store.getProductImages(row.ImagePath, 2), // 2 изображения
			Price:    int(row.Minprice),
			Discount: getDiscountValue(row.Maxdiscprice),
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
			Image: store.getProductMainImage(row.ImagePath),
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
			Price: int(p.Minprice),
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
			Image:    store.getProductImages(p.ImagePath, 2),
			Price:    int(p.Minprice),
			Id:       int(p.ID),
			Name:     p.Name,
			Firm:     p.Firm,
			Discount: getDiscountValueInt32(p.Maxdiscprice.Int32),
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
			Discount:   getDiscountValueInt32(p.Maxdiscprice.Int32),
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

func (store *SQLStore) GetMerchWithDiscountComplex(ctx context.Context) ([]types.ProductsSearchResponse1, error) {
	products, err := store.Queries.GetMerchWithDiscount(ctx)
	if err != nil {
		return []types.ProductsSearchResponse1{}, err
	}

	return store.buildDiscountMerchResponse(products), nil
}

func (store *SQLStore) buildDiscountProductsResponse(products []GetProductsWithDiscountRow) []types.ProductsSearchResponse1 {
	result := make([]types.ProductsSearchResponse1, 0, len(products))
	for _, p := range products {
		result = append(result, types.ProductsSearchResponse1{
			Image:    store.getProductImages(p.ImagePath, 2),
			Price:    int(p.Minprice),
			Id:       int(p.ID),
			Name:     p.Name,
			Firm:     p.Firm,
			Discount: getDiscountValueInt32(p.Maxdiscprice.Int32),
		})
	}
	return result
}

func (store *SQLStore) buildDiscountMerchResponse(products []GetMerchWithDiscountRow) []types.ProductsSearchResponse1 {
	result := make([]types.ProductsSearchResponse1, 0, len(products))
	for _, p := range products {
		result = append(result, types.ProductsSearchResponse1{
			Image:    store.getProductImages(p.ImagePath, 2),
			Price:    int(p.Minprice),
			Id:       int(p.ID),
			Name:     p.Name,
			Firm:     p.Firm,
			Discount: getDiscountValueInt32(p.Maxdiscprice.Int32),
		})
	}
	return result
}

// ==================== DISCOUNTS ====================

func (store *SQLStore) CreateDiscounts(ctx context.Context, discountData map[int32]types.DiscountData) error {
	if len(discountData) == 0 {
		return nil
	}

	productIDs := make([]int32, 0, len(discountData))
	for productID := range discountData {
		productIDs = append(productIDs, productID)
	}

	products, err := store.GetProductsBasicInfo(ctx, productIDs)
	if err != nil {
		return fmt.Errorf("error getting products info: %w", err)
	}

	var productIDsBatch []int32
	var discountValues [][]byte
	var minPrices []int32
	var maxDiscPrices []int32

	for _, product := range products {
		discount, exists := discountData[product.ID]
		if !exists {
			continue
		}

		value := make(map[string]interface{})
		minPrice := int32(math.MaxInt32)
		maxDiscPrice := int32(0)

		// Проверяем, есть ли данные о размерах
		if len(product.Sizes) > 0 {
			// Парсим JSON
			var sizesMap map[string]map[string]interface{}
			if err := json.Unmarshal(product.Sizes, &sizesMap); err != nil {
				// Пробуем другой формат
				var simpleMap map[string]interface{}
				if err2 := json.Unmarshal(product.Sizes, &simpleMap); err2 != nil {
					fmt.Printf("Error unmarshaling sizes for product %d: %v\n", product.ID, err)
					continue
				}
				// Обрабатываем простой формат
				for sizeKey, sizeValue := range simpleMap {
					var originalPrice int32

					// Если значение - число
					if price, ok := sizeValue.(float64); ok {
						originalPrice = int32(price)
					} else {
						continue
					}

					discountPrice := originalPrice - (originalPrice*discount.Percent)/100
					value[sizeKey] = discountPrice

					if discountPrice < minPrice {
						minPrice = discountPrice
					}
					if discountPrice > maxDiscPrice {
						maxDiscPrice = discountPrice
					}
				}
				goto afterSizes
			}

			// Обрабатываем вложенный формат (с price, in_stock, quantity)
			for sizeKey, sizeData := range sizesMap {
				// Извлекаем цену из вложенного объекта
				var originalPrice int32
				if price, ok := sizeData["price"]; ok {
					switch p := price.(type) {
					case float64:
						originalPrice = int32(p)
					case int:
						originalPrice = int32(p)
					case int32:
						originalPrice = p
					default:
						continue
					}
				} else {
					continue
				}

				discountPrice := originalPrice - (originalPrice*discount.Percent)/100
				value[sizeKey] = discountPrice

				if discountPrice < minPrice {
					minPrice = discountPrice
				}
				if discountPrice > maxDiscPrice {
					maxDiscPrice = discountPrice
				}
			}
		}

	afterSizes:
		// Если нет размеров, но есть минимальная цена
		if len(value) == 0 && product.Minprice > 0 {
			discountPrice := product.Minprice - (product.Minprice*discount.Percent)/100
			value["default"] = discountPrice
			minPrice = discountPrice
			maxDiscPrice = discountPrice
		}

		if len(value) == 0 {
			fmt.Printf("Skipping product %d: no valid size data\n", product.ID)
			continue
		}

		jsonData, err := json.Marshal(value)
		if err != nil {
			return fmt.Errorf("error marshaling discount value: %w", err)
		}

		productIDsBatch = append(productIDsBatch, product.ID)
		discountValues = append(discountValues, jsonData)
		minPrices = append(minPrices, minPrice)
		maxDiscPrices = append(maxDiscPrices, maxDiscPrice)
	}

	if len(productIDsBatch) > 0 {
		err = store.BulkInsertDiscounts(ctx, BulkInsertDiscountsParams{
			ProductIds:     productIDsBatch,
			DiscountValues: discountValues,
			MinPrices:      minPrices,
			MaxDiscPrices:  maxDiscPrices,
		})
		if err != nil {
			return fmt.Errorf("error bulk inserting discounts: %w", err)
		}
	}

	return nil
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

func getFieldInt32(obj interface{}, fieldName string) (int32, error) {
	val := reflect.ValueOf(obj)
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}

	field := val.FieldByName(fieldName)
	if !field.IsValid() {
		return 0, fmt.Errorf("field %s not found", fieldName)
	}

	switch v := field.Interface().(type) {
	case int32:
		return v, nil
	case sql.NullInt32:
		if v.Valid {
			return v.Int32, nil
		}
		return 0, fmt.Errorf("field %s is null", fieldName)
	case *int32:
		if v != nil {
			return *v, nil
		}
		return 0, fmt.Errorf("field %s is nil", fieldName)
	default:
		return 0, fmt.Errorf("unsupported type for field %s", fieldName)
	}
}

func getSizePrice(sizes json.RawMessage, sizeKey string) (int32, error) {
	var sizesMap map[string]interface{}
	if err := json.Unmarshal(sizes, &sizesMap); err != nil {
		return 0, err
	}

	sizeData, exists := sizesMap[sizeKey]
	if !exists {
		return 0, fmt.Errorf("size not found")
	}

	sizeMap, ok := sizeData.(map[string]interface{})
	if !ok {
		return 0, fmt.Errorf("invalid size data structure")
	}

	price, ok := sizeMap["price"].(float64)
	if !ok {
		return 0, fmt.Errorf("price not found or invalid")
	}

	return int32(price), nil
}
