package db

import (
	"context"
	"encoding/json"
	"fmt"
	"math"

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
	ProductType  int32                  `json:"type_id"`
	Category     int32                  `json:"category_id"`
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
	Status   string      `json:"status"`
}

type FiltersSearchResponse struct {
	FirmsCount interface{} `json:"firmsCount"`
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
		images = append(images, fmt.Sprintf("%s%d.png", imageBasePath, i))
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
		ImagePath:   store.ImagePathBuilder.GetProductMainImage(snInfo.ImagePath),
		Id:          snInfo.ID,
	}
}

func (store *SQLStore) GetProductsByString(ctx context.Context, name string, page int, size int, filters types.ProductsFilterStruct, orderedType int) (RespSearchProductsByString, error) {
	data, err := store.getProductsByFilters(ctx, GetFiltersByNameCategoryAndTypeParams{Name: pgtype.Text{String: name, Valid: true}}, filters, page, size, orderedType, false)
	if err != nil {
		return RespSearchProductsByString{}, err
	}

	return RespSearchProductsByString{
		Products:   store.buildProductsResponseD(data.Products),
		TotalCount: int(math.Ceil(float64(data.TotalCount))),
	}, nil
}

func (store *SQLStore) GetProductsByFiltersComplex(ctx context.Context, name string, page int, size int, filters types.ProductsFilterStruct, orderedType int32) (RespProductsByStringStruct, error) {
	data, err := store.getProductsByFilters(ctx, GetFiltersByNameCategoryAndTypeParams{Name: pgtype.Text{String: name, Valid: true}}, filters, page, size, int(orderedType), true)
	if err != nil {
		return RespProductsByStringStruct{}, err
	}

	return RespProductsByStringStruct{
		Merch:      store.buildProductsResponseD(data.Products),
		TotalCount: int(math.Ceil(float64(data.TotalCount))),
	}, nil
}

func (store *SQLStore) GetProductsAndFiltersByNameCategoryAndType(ctx context.Context, filtersParams GetFiltersByNameCategoryAndTypeParams, page int, size int, filters types.ProductsFilterStruct, orderedType int) (RespSearchProductsAndFiltersByString, error) {
	fmt.Printf("%+v\n", filtersParams)
	data, err := store.getProductsByFilters(ctx, filtersParams, filters, page, size, orderedType, false)
	if err != nil {
		fmt.Println(err, "2222222")
		return RespSearchProductsAndFiltersByString{}, err
	}

	filter, err := store.GetFiltersByNameCategoryAndType(ctx, filtersParams)
	if err != nil {
		fmt.Println(err, "333333333333333")
		return RespSearchProductsAndFiltersByString{}, err
	}

	// Проверяем, есть ли данные
	var totalCount float64
	if len(data.Products) > 0 {
		totalCount = float64(data.TotalCount)
	} else {
		totalCount = 0
	}

	return RespSearchProductsAndFiltersByString{
		Products:   store.buildProductsResponseD(data.Products),
		TotalCount: totalCount,
		Filters: FiltersSearchResponse{
			Price:      [2]int32{filter.MinPrice.(int32), filter.MaxPrice.(int32)},
			Sizes:      filter.Sizes,
			FirmsCount: filter.Firms,
			Types:      filter.ProductTypes,
			Discounts:  filter.DiscountRules,
		},
	}, nil
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
			Name:     row.Name,
			Id:       row.ID,
			Status:   row.Status,
			Image:    store.getProductImages(row.ImagePath, 2), // 2 изображения
			Price:    int(row.MinPrice),
			Discount: getDiscountValue(pgtype.Int4{Valid: row.MaxDiscPrice != 0, Int32: getInt32Value(row.MaxDiscPrice)}),
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
type DiscountData struct {
	Value        json.RawMessage `json:"value"`          // JSONB с ценами со скидкой для каждого размера
	MinPrice     int32           `json:"min_price"`      // Минимальная цена со скидкой
	MaxDiscPrice int32           `json:"max_disc_price"` // Максимальная цена со скидкой
}

func (store *SQLStore) CreateDiscounts(ctx context.Context, discountData map[int32]DiscountData) error {
	if len(discountData) == 0 {
		return nil
	}

	productIDs := make([]int32, 0, len(discountData))
	for productID := range discountData {
		productIDs = append(productIDs, productID)
	}

	var productIDsBatch []int32
	var discountValues [][]byte
	var minPrices []int32
	var maxDiscPrices []int32

	for _, productID := range productIDs {
		discount, exists := discountData[productID]
		if !exists {
			continue
		}

		// Проверяем, что Value не пустой
		if len(discount.Value) == 0 {
			fmt.Printf("Skipping product %d: no discount value\n", productID)
			continue
		}

		productIDsBatch = append(productIDsBatch, productID)
		discountValues = append(discountValues, discount.Value)
		minPrices = append(minPrices, discount.MinPrice)
		maxDiscPrices = append(maxDiscPrices, discount.MaxDiscPrice)
	}

	if len(productIDsBatch) > 0 {
		err := store.BulkInsertDiscounts(ctx, BulkInsertDiscountsParams{
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
	Status          string
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
		Status:    r.Status,
	}
}

func discountRowToProductRow(r GetProductsByFiltersPaginateWithDiscountRow) ProductRow {
	return ProductRow{
		ID:              r.ID,
		Name:            r.Name,
		ImagePath:       r.ImagePath,
		Firm:            r.Firm,
		MinPrice:        r.Minprice,
		MaxPrice:        r.Maxprice,
		Status:          r.Status,
		MaxDiscPrice:    float64(r.Maxdiscprice),
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
		Status:    r.Status,
		InStore:   r.InStore.Bool,
	}
}

func fullRowToProductRow(r GetProductsByFiltersPaginateFullRow) ProductRow {
	return ProductRow{
		ID:              r.ID,
		Name:            r.Name,
		ImagePath:       r.ImagePath,
		Firm:            r.Firm,
		MinPrice:        r.Minprice,
		MaxPrice:        r.Maxprice,
		Status:          r.Status,
		MaxDiscPrice:    float64(r.Maxdiscprice),
		DiscountPercent: float64(r.DiscountPercent),
		InStore:         r.InStore.Bool,
	}
}

// Основная функция getProductsByFilters – теперь выбирает лёгкий запрос
func (store *SQLStore) getProductsByFilters(
	ctx context.Context,
	mainFilter GetFiltersByNameCategoryAndTypeParams,
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
			params.Categories = []int32{mainFilter.Category.Int32}
		}
		if mainFilter.Type.Valid {
			params.ProductTypes = []int32{mainFilter.Type.Int32}
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
		fmt.Println("%v", params.Categories, "ddddddddddddddddddddddddddddddaaaaaaaaaaa", params.ProductTypes)
		fmt.Println("%v", mainFilter.Category, "ddddddddddddddddddddddddddddddaaaaaaaaaaa", mainFilter.Type)
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
			ProductTypes: params.ProductTypes,
			Lines:        filters.Lines,

			WithPrice:  filters.WithPrice,
			Name:       params.Name,
			Categories: params.Categories,
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
			params.ProductTypes = []int32{mainFilter.Type.Int32}
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
			ProductTypes: params.ProductTypes,
			Lines:        filters.Lines,

			WithPrice:  filters.WithPrice,
			Name:       params.Name,
			Categories: params.Categories,
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
			params.Categories = []int32{mainFilter.Category.Int32}
		}
		if mainFilter.Name.Valid {
			params.Name = mainFilter.Name.String
		}
		if mainFilter.Type.Valid {
			params.ProductTypes = []int32{mainFilter.Type.Int32}
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
			ProductTypes: params.ProductTypes,
			Lines:        filters.Lines,

			WithPrice:  filters.WithPrice,
			Name:       params.Name,
			Categories: params.Categories,
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
			params.Categories = []int32{mainFilter.Category.Int32}
		}
		if mainFilter.Name.Valid {
			params.Name = mainFilter.Name.String
		}
		if mainFilter.Type.Valid {
			params.ProductTypes = []int32{mainFilter.Type.Int32}
		}
		if usePriceFilter && len(filters.Price) == 2 {
			params.Minprice = pgtype.Int4{Int32: int32(filters.Price[0]), Valid: true}
			params.Maxprice = pgtype.Int4{Int32: int32(filters.Price[1]), Valid: true}
		}
		fmt.Println("%v", params, "ddddddddddddddddddddddddddddddaaaaaaaaaaa")
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
			ProductTypes: params.ProductTypes,
			Lines:        filters.Lines,
			Status:       filters.Status,
			WithPrice:    filters.WithPrice,
			Name:         params.Name,
			Categories:   params.Categories,
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
			ID:        p.Id,
			Name:      p.Name,
			ImagePath: imagePath,
			Price:     int32(p.Price),
			Discount:  p.Discount,
		})
	}

	return cachedProducts, nil
}
