package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
	"reflect"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/mrkrabopl1/go_db/types"
)

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
	Name         string                          `json:"name"`
	Info         map[string]interface{}          `json:"info"`
	Discount     map[string]interface{}          `json:"discount"`
	ProductType  string                          `json:"producttype"`
	Article      string                          `json:"article"`
	Store        interface{}                     `json:"store"`
	Firm         string                          `json:"firm"`
	Line         string                          `json:"line"`
	LineProducts []GetSoloCollectionWithCountRow `json:"line_products"`
	ImageCount   int32                           `json:"image_count"`
	ImagePath    string                          `json:"image_path"`
	Id           int32                           `json:"id"`
}

type ClothesInfoResponse struct {
	Name        string                 `json:"name"`
	Image       []string               `json:"imgs"`
	Info        map[string]interface{} `json:"info"`
	Discount    map[string]interface{} `json:"discount"`
	ProductType string                 `json:"producttype"`
	Minprice    int32                  `json:"minprice"`
}

type SoloMerchInfoResponse struct {
	Name        string                 `json:"name"`
	Image       []string               `json:"imgs"`
	Discount    map[string]interface{} `json:"discount"`
	Minprice    int32                  `json:"minprice"`
	ProductType string                 `json:"producttype"`
}

func (store *SQLStore) GetProductsInfoByIdComplex(ctx context.Context, id int32) (ProductsInfoResponse, error) {
	snickers, err := store.Queries.GetProductsInfoById(ctx, id)
	if err != nil {
		return ProductsInfoResponse{}, err
	}
	fmt.Println(snickers.Line, snickers.Firm, "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
	lineMerch, err := store.Queries.GetSoloCollectionWithCount(ctx, GetSoloCollectionWithCountParams{
		Line:   snickers.Line,
		Firm:   snickers.Firm,
		Limit:  10,
		Offset: 0,
	})
	ProductsInfoResp := NewProductsInfoResponse(snickers)
	ProductsInfoResp.LineProducts = lineMerch
	return ProductsInfoResp, nil
}

func NewProductsInfoResponse(snInfo GetProductsInfoByIdRow) ProductsInfoResponse {
	var inf map[string]float64
	// Use json.Unmarshal to parse the JSON string into the map
	err2 := json.Unmarshal([]byte(snInfo.Sizes), &inf)
	if err2 != nil {
		fmt.Println(err2)
	}

	fmt.Println(inf, "inf")

	var discount map[string]interface{}

	if snInfo.Value != nil {
		json.Unmarshal(snInfo.Value, &discount)
	}
	var jsonData map[string]interface{}
	json.Unmarshal(snInfo.Sizes, &jsonData)
	return ProductsInfoResponse{
		Name:        snInfo.Name,
		ImageCount:  snInfo.ImageCount,
		Firm:        snInfo.Firm,
		Line:        snInfo.Line.String,
		Info:        jsonData,
		Discount:    discount,
		ProductType: "snickers",
		Article:     snInfo.Article,
		Store:       snInfo.StoreInfo,
		ImagePath:   snInfo.ImagePath,
		Id:          snInfo.ID,
	}
}

type ProductInfo struct {
	GlobalID    int32  `json:"global_id"`
	Producttype string `json:"producttype"`
	Minprice    int32  `json:"minprice"`
	Maxprice    int32  `json:"maxprice"`

	Name     string                 `json:"name"`
	Image    []string               `json:"imgs"`
	Discount interface{}            `json:"discount"`
	Sizes    map[string]interface{} `json:"sizes"`
	Article  string                 `json:"article"`
}

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

func (store *SQLStore) CreateDiscounts(ctx context.Context, discountData map[int32]types.DiscountData) error {
	if len(discountData) == 0 {
		return nil
	}

	// Собираем ID товаров
	productIDs := make([]int32, 0, len(discountData))
	for productID := range discountData {
		productIDs = append(productIDs, productID)
	}

	// Получаем базовую информацию о товарах
	products, err := store.GetProductsBasicInfo(ctx, productIDs)
	if err != nil {
		return fmt.Errorf("error getting products info: %w", err)
	}

	// Подготавливаем данные для вставки
	var (
		productIDsBatch []int32
		discountValues  []json.RawMessage
		minPrices       []int32
		maxDiscPrices   []int32
	)

	for _, product := range products {
		discount, exists := discountData[product.ID]
		if !exists {
			continue
		}

		// Для каждого товара создаем скидку на основе его sizes
		value := make(map[string]interface{})
		minPrice := int32(math.MaxInt32)
		maxDiscPrice := int32(0)

		var sizesMap map[string]interface{}
		if err := json.Unmarshal(product.Sizes, &sizesMap); err != nil {
			return fmt.Errorf("error decoding sizes for product %d: %w", product.ID, err)
		}
		for sizeKey := range sizesMap {
			originalPrice, err := getSizePrice(product.Sizes, sizeKey)
			if err != nil {
				continue
			}

			// Применяем скидку
			discountPrice := originalPrice - (originalPrice*discount.Percent)/100
			value[sizeKey] = discountPrice

			// Обновляем min/max цены
			if discountPrice < minPrice {
				minPrice = discountPrice
			}
			if discountPrice > maxDiscPrice {
				maxDiscPrice = discountPrice
			}
		}

		// Если не нашли цен для размеров, используем общую цену товара
		if len(value) == 0 && product.Minprice > 0 {
			discountPrice := product.Minprice - (product.Minprice*discount.Percent)/100
			value["default"] = discountPrice
			minPrice = discountPrice
			maxDiscPrice = discountPrice
		}

		// Пропускаем если не смогли рассчитать скидку
		if len(value) == 0 {
			continue
		}

		// Сериализуем value в JSON
		jsonData, err := json.Marshal(value)
		if err != nil {
			return fmt.Errorf("error marshaling discount value: %w", err)
		}

		productIDsBatch = append(productIDsBatch, product.ID)
		discountValues = append(discountValues, json.RawMessage(jsonData))
		minPrices = append(minPrices, minPrice)
		maxDiscPrices = append(maxDiscPrices, maxDiscPrice)
	}
	bytesSlice := make([][]byte, len(discountValues))
	for i, rawMsg := range discountValues {
		bytesSlice[i] = rawMsg // This works because json.RawMessage is an alias for []byte
	}
	// Вставляем/обновляем скидки одним запросом
	if len(productIDsBatch) > 0 {
		err = store.BulkInsertDiscounts(ctx, BulkInsertDiscountsParams{
			ProductIds:     productIDsBatch,
			DiscountValues: bytesSlice,
			MinPrices:      minPrices,
			MaxDiscPrices:  maxDiscPrices,
		})
		if err != nil {
			return fmt.Errorf("error bulk inserting discounts: %w", err)
		}
	}

	return nil
}

func (store *SQLStore) GetProductsByString(ctx context.Context, name string, page int, size int, filters types.ProductsFilterStruct, orderedType int) (RespSearchProductsByString, error) {
	var result RespSearchProductsByString

	var offset = (page - 1) * size

	var limit = size
	params := GetProductsByFiltersParams{
		Limitval:    int32(limit),
		Offsetval:   int32(offset),
		Sizes:       filters.Sizes,
		Firms:       filters.Firms,
		Bodytypes:   filters.Bodytypes,
		InStore:     filters.InStore,
		WithPrice:   filters.WithPrice,
		HasDiscount: filters.HasDiscount,
	}
	data, err1 := store.GetProductsByFilters(ctx, params)
	if err1 != nil {
		return result, err1
	}

	products := filtredDataResponse(data)
	result = RespSearchProductsByString{
		Products:   products,
		TotalCount: int(math.Ceil(float64(data[0].TotalCount))),
	}
	return result, nil
}

func (store *SQLStore) GetProductsByFiltersComplex(ctx context.Context, name string, page int, size int, filters types.ProductsFilterStruct, orderedType int32) (RespProductsByStringStruct, error) {
	var result RespProductsByStringStruct

	var offset = (page - 1) * size

	var limit = size
	params := GetProductsByFiltersParams{
		Limitval:     int32(limit),
		Offsetval:    int32(offset),
		Sizes:        filters.Sizes,
		Firms:        filters.Firms,
		Bodytypes:    filters.Bodytypes,
		ProductTypes: filters.Types,
		SortType:     orderedType,
		HasDiscount:  filters.HasDiscount,
		InStore:      filters.InStore,
		WithPrice:    filters.WithPrice,
	}
	if filters.Price != nil && len(filters.Price) == 2 {
		params.Minprice = pgtype.Int4{Int32: int32(filters.Price[0]), Valid: true}
		params.Maxprice = pgtype.Int4{Int32: int32(filters.Price[1]), Valid: true}
	}
	data, err1 := store.GetProductsByFilters(ctx, params)
	if err1 != nil {
		return result, err1
	}

	merch := filtredDataResponse(data)
	result = RespProductsByStringStruct{
		Merch:      merch,
		TotalCount: int(math.Ceil(float64(data[0].TotalCount))),
	}
	return result, nil
}

type RespSearchProductsAndFiltersByString struct {
	Products   []ProductsResponseD   `json:"products"`
	TotalCount float64               `json:"totalCount"`
	Filters    FiltersSearchResponse `json:"filters"`
}

type Clothes struct {
	S   int64 `json:"s"`
	M   int64 `json:"m"`
	L   int64 `json:"l"`
	XL  int64 `json:"xl"`
	XXL int64 `json:"xxl"`
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

func (store *SQLStore) GetProductsAndFiltersByNameCategoryAndType(ctx context.Context, filtersParams GetFiltersByNameCategoryAndTypeParams, page int, size int, filters types.ProductsFilterStruct, orderedType int) (RespSearchProductsAndFiltersByString, error) {
	var result RespSearchProductsAndFiltersByString
	var offset = (page - 1) * size

	var limit = size
	params := GetProductsByFiltersParams{
		Limitval:    int32(limit),
		Offsetval:   int32(offset),
		Sizes:       filters.Sizes,
		Firms:       filters.Firms,
		Bodytypes:   filters.Bodytypes,
		Name:        filtersParams.Name.String,
		HasDiscount: filters.HasDiscount,
		WithPrice:   filters.WithPrice,
	}
	if filtersParams.Category.Valid { // Проверяйте Valid для sql.NullInt32
		params.Categories = []int32{filtersParams.Category.Int32}
	}
	if filtersParams.Type.Valid { // Проверяйте Valid для sql.NullInt32
		fmt.Println("dddddddddddddddddddddddddddddddd", filtersParams.Type.Int32)
		params.ProductTypes = []int32{filtersParams.Type.Int32}
	}

	fmt.Println(params, "tesrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrewt2")
	data, err := store.GetProductsByFilters(ctx, params)
	fmt.Println(data, "test")
	if err != nil {
		fmt.Println(err, "error in GetOrderedProductsByFilters")
		return result, err
	}
	filter, err := store.GetFiltersByNameCategoryAndType(ctx, filtersParams)
	if err != nil {
		fmt.Println(filter, "f,dslfsdf")
		return result, err
	}

	fmt.Println(filter, "fmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm")
	// var firmsCount map[string]int
	// err = json.Unmarshal(ProductsInfo.Filter.Firms, &firmsCount)
	if err != nil {
		fmt.Println(err, "wweeerwerwer")
		return result, err
	}
	// var sizesz map[string]interface{}
	// err = json.Unmarshal(ProductsInfo.Filter.Sizes, &sizesz)
	if err != nil {
		fmt.Println(err, "wweeerwerwer")
		return result, err
	}
	var resp = RespSearchProductsAndFiltersByString{
		Products:   filtredDataResponse(data),
		TotalCount: float64(data[0].TotalCount),
		Filters: FiltersSearchResponse{
			Price: [2]int32{filter.MinPrice.(int32), filter.MaxPrice.(int32)},
			Sizes: filter.Sizes,
			//Bodytypes:filter.Bodytypes,
			FirmsCount: filter.Firms,
			Types:      filter.ProductTypes,
			//FirmsCount: firmsCount,
		},
	}
	fmt.Println(resp, "test4")
	return resp, nil
}

type CategoryData struct {
	Category   int32             `json:"category"`
	TotalCount int64             `json:"total_count"`
	Products   []ProductMainInfo `json:"products"`
}

func (store *SQLStore) GetMainPageInfoComplex(ctx context.Context, limit int32) (map[int32]CategoryData, error) {
	info, err := store.Queries.GetMainPageInfo(ctx, limit)
	if err != nil {
		return nil, err
	}
	return groupProducts(info), nil
}

type ProductMainInfo struct {
	Name     string      `json:"name"`
	Id       int32       `json:"id"`
	Image    string      `json:"image_path"`
	Discount interface{} `json:"discount"`
	Price    int32       `json:"price"`
}

func groupProducts(rows []GetMainPageInfoRow) map[int32]CategoryData {
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
			Image: row.ImagePath,
		})
		categories[row.Category] = cat
	}

	return categories
}

type ProductsFilterStruct struct {
	Firms       map[string]int32       `json:"firmsCount"`
	Sizes       map[string]interface{} `json:"sizes"`
	Price       []float32              `json:"price"`
	Types       []int32                `json:"types"`
	InStock     bool                   `json:"in_stock"`
	HasDiscount bool                   `json:"has_discount"`
}

type ProductsResp struct {
	Filters    ProductsFilterStruct            `json:"filters"`
	Products   []types.ProductsSearchResponse1 `json:"products"`
	TotalCount int                             `json:"totalCount"`
}

func filtredDataResponse(data []GetProductsByFiltersRow) []ProductsResponseD {
	snPageResp := make([]ProductsResponseD, 0)

	start1 := time.Now()

	for _, line := range data {
		var imgArr []string
		for i := 1; i < 3; i++ {
			str := "images/" + fmt.Sprintf(line.ImagePath+"/img%d.png", i)
			imgArr = append(imgArr, str)
		}

		var discount interface{}

		if line.Maxdiscprice.Valid {
			discount = line.Maxdiscprice.Int32
		} else {
			discount = nil
		}

		fmt.Println(line.ID, "line.Id")

		snPageResp = append(snPageResp, ProductsResponseD{
			Name:     line.Name,
			Image:    imgArr,
			Price:    int(line.Minprice),
			Discount: discount,
			Id:       int32(line.ID),
		})

	}
	end1 := time.Now()
	elapsed1 := end1.Sub(start1)

	fmt.Println(elapsed1, "f,sdlf,sdl,fsdl,fsld,fsdl,f")

	return snPageResp
}

func NewProductsByStringResponse(snLines []types.ProductsSearch) []ProductsResponseD {
	snPageResp := make([]ProductsResponseD, 0)

	start1 := time.Now()

	for _, line := range snLines {
		var imgArr []string
		for i := 1; i < 3; i++ {
			str := "images/" + fmt.Sprintf(line.Image_path+"/img%d.png", i)
			imgArr = append(imgArr, str)
		}

		var discount interface{}

		if line.Discount != nil {
			discount = *line.Discount
		} else {
			discount = nil
		}

		fmt.Println(line.Id, "line.Id")

		snPageResp = append(snPageResp, ProductsResponseD{
			Name:     line.Name,
			Image:    imgArr,
			Price:    line.Price,
			Discount: discount,
			Id:       int32(line.Id),
		})

	}
	end1 := time.Now()
	elapsed1 := end1.Sub(start1)

	fmt.Println(elapsed1, "f,sdlf,sdl,fsdl,fsld,fsdl,f")

	return snPageResp
}
func (store *SQLStore) GetProductsByNameComplex(ctx context.Context, name string, limit int32) ([]types.ProductsSearchResponse, error) {
	snickers, err := store.Queries.GetProductsByName(ctx, GetProductsByNameParams{
		Column1: name,
		Limit:   limit,
	})
	if err != nil {
		return []types.ProductsSearchResponse{}, err
	}

	return NewProductsSearchResponse(snickers), nil

}

func NewProductsSearchResponse(ProductsSearch []GetProductsByNameRow) []types.ProductsSearchResponse {

	list := []types.ProductsSearchResponse{}
	for _, info := range ProductsSearch {
		img_path := "images/" + info.ImagePath + "/img1.png"
		list = append(list, types.ProductsSearchResponse{
			Image: img_path,
			Price: int(info.Minprice),
			Id:    int(info.GlobalID),
			Name:  info.Name,
			Firm:  info.Firm,
		})
	}

	return list
}
func NewMerchSearchResponse(ProductsSearch []GetProductsByNameRow) []types.ProductsSearchResponse {

	list := []types.ProductsSearchResponse{}
	for _, info := range ProductsSearch {
		img_path := "images/" + info.ImagePath + "/img1.png"
		list = append(list, types.ProductsSearchResponse{
			Image: img_path,
			Price: int(info.Minprice),
			Id:    int(info.GlobalID),
			Name:  info.Name,
			Firm:  info.Firm,
		})
	}

	return list
}
func (store *SQLStore) GetSoloCollectionComplex(ctx context.Context, arg GetSoloCollectionParams) ([]types.ProductsSearchResponse1, error) {
	snickers, err := store.Queries.GetSoloCollection(ctx, arg)
	if err != nil {
		return []types.ProductsSearchResponse1{}, err
	}

	return NewProductsSearchResponse1(snickers), nil
}

func (store *SQLStore) GetMerchCollectionComplex(ctx context.Context, arg GetMerchCollectionParams) ([]types.MerchSearchResponse, error) {
	snickers, err := store.Queries.GetMerchCollection(ctx, arg)
	if err != nil {
		return []types.MerchSearchResponse{}, err
	}

	return NewMerchCollectionResponse(snickers), nil
}

func NewMerchCollectionResponse(ProductsSearch []GetMerchCollectionRow) []types.MerchSearchResponse {

	list := []types.MerchSearchResponse{}
	for _, info := range ProductsSearch {
		var imgArr []string
		for i := 1; i < 3; i++ {
			str := "images/" + fmt.Sprintf(info.ImagePath+"/img%d.png", i)
			imgArr = append(imgArr, str)
		}
		var discount interface{}
		if info.Maxdiscprice.Int32 != 0 {
			discount = info.Maxdiscprice.Int32
		} else {
			discount = nil
		}
		list = append(list, types.MerchSearchResponse{
			Image:      imgArr,
			Price:      int(info.Minprice),
			Id:         int(info.GlobalID),
			Name:       info.Name,
			Firm:       info.Firm,
			Discount:   discount,
			Type:       info.Type,
			TotalCount: info.TotalCount,
		})

	}

	return list
}

func NewProductsSearchResponse1(ProductsSearch []GetSoloCollectionRow) []types.ProductsSearchResponse1 {

	list := []types.ProductsSearchResponse1{}
	for _, info := range ProductsSearch {
		var imgArr []string
		for i := 1; i < 3; i++ {
			str := "images/" + fmt.Sprintf(info.ImagePath+"/img%d.png", i)
			imgArr = append(imgArr, str)
		}
		var discount interface{}
		if info.Maxdiscprice.Int32 != 0 {
			discount = info.Maxdiscprice.Int32
		} else {
			discount = nil
		}
		list = append(list, types.ProductsSearchResponse1{
			Image:    imgArr,
			Price:    int(info.Minprice),
			Id:       int(info.ID),
			Name:     info.Name,
			Firm:     info.Firm,
			Discount: discount,
		})

	}

	return list
}

func (store *SQLStore) GetProductsWithDiscountComplex(ctx context.Context) ([]types.ProductsSearchResponse1, error) {
	searchData, err := store.Queries.GetProductsWithDiscount(ctx)
	if err != nil {
		return []types.ProductsSearchResponse1{}, err
	}

	return NewProductsSearchResponse3(searchData), nil
}
func (store *SQLStore) GetMerchWithDiscountComplex(ctx context.Context) ([]types.ProductsSearchResponse1, error) {
	searchData, err := store.Queries.GetMerchWithDiscount(ctx)
	if err != nil {
		return []types.ProductsSearchResponse1{}, err
	}

	return NewMerchDiscountResponse(searchData), nil
}
func NewMerchDiscountResponse(ProductsSearch []GetMerchWithDiscountRow) []types.ProductsSearchResponse1 {

	list := []types.ProductsSearchResponse1{}
	for _, info := range ProductsSearch {
		var imgArr []string
		for i := 1; i < 3; i++ {
			str := "images/" + fmt.Sprintf(info.ImagePath+"/img%d.png", i)
			imgArr = append(imgArr, str)
		}
		var discount interface{}
		if info.Maxdiscprice.Int32 != 0 {
			discount = info.Maxdiscprice.Int32
		} else {
			discount = nil
		}
		list = append(list, types.ProductsSearchResponse1{
			Image:    imgArr,
			Price:    int(info.Minprice),
			Id:       int(info.ID),
			Name:     info.Name,
			Firm:     info.Firm,
			Discount: discount,
		})

	}

	return list
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
