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
	Filter           GetFiltersByStringRow
}

type RespSearchProductsByString struct {
	Products []ProductsResponseD `json:"products"`
	Pages    int                 `json:"pages"`
}
type RespProductsByStringStruct struct {
	Merch []ProductsResponseD `json:"snickers"`
	Pages int                 `json:"pages"`
}
type ProductsInfoResponse struct {
	Name        string                 `json:"name"`
	Image       []string               `json:"imgs"`
	Info        map[string]interface{} `json:"info"`
	Discount    map[string]interface{} `json:"discount"`
	ProductType string                 `json:"producttype"`
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
	fmt.Println(snickers, "mfpdkmsfksmfkdsmfksmdpfm")
	ProductsInfoResp := NewProductsInfoResponse(snickers)
	return ProductsInfoResp, nil
}
func (store *SQLStore) GetSoloMerchInfoByIdComplex(ctx context.Context, id int32) (SoloMerchInfoResponse, error) {

	snickers, err := store.Queries.GetSoloMerchInfoById(ctx, id)
	if err != nil {
		return SoloMerchInfoResponse{}, err
	}
	fmt.Println(snickers)
	ProductsInfoResp := NewSoloMerchInfoResponse(snickers)
	return ProductsInfoResp, nil
}

func (store *SQLStore) GetClothesInfoByIdComplex(ctx context.Context, id int32) (ClothesInfoResponse, error) {
	clothes, err := store.Queries.GetClothesInfoById(ctx, id)
	if err != nil {
		return ClothesInfoResponse{}, err
	}
	fmt.Println(clothes)
	ProductsInfoResp := NewClothesInfoResponse(clothes)
	return ProductsInfoResp, nil
}
func NewProductsInfoResponse(snInfo GetProductsInfoByIdRow) ProductsInfoResponse {
	var inf map[string]float64
	var imgArr []string
	for index := range snInfo.ImageCount {
		str := "images/" + fmt.Sprintf(snInfo.ImagePath+"/img%d.png", index+1)
		imgArr = append(imgArr, str)
	}

	// Use json.Unmarshal to parse the JSON string into the map
	err2 := json.Unmarshal([]byte(snInfo.Info), &inf)
	if err2 != nil {
		fmt.Println(err2)
	}

	fmt.Println(inf, "inf")

	var discount map[string]interface{}

	if snInfo.Value != nil {
		json.Unmarshal(snInfo.Value, &discount)
	}
	var jsonData map[string]interface{}
	json.Unmarshal(snInfo.Info, &jsonData)
	fmt.Println(jsonData, "lfkdmsmf", snInfo.Info)
	return ProductsInfoResponse{
		Name:        snInfo.Name,
		Image:       imgArr,
		Info:        jsonData,
		Discount:    discount,
		ProductType: "snickers",
	}
}

func NewSoloMerchInfoResponse(snInfo GetSoloMerchInfoByIdRow) SoloMerchInfoResponse {
	var imgArr []string
	for index := range snInfo.ImageCount {
		str := "images/" + fmt.Sprintf(snInfo.ImagePath+"/img%d.png", index+1)
		imgArr = append(imgArr, str)
	}
	var discount map[string]interface{}

	var jsonData map[string]interface{}
	fmt.Println(jsonData)
	return SoloMerchInfoResponse{
		Name:        snInfo.Name,
		Image:       imgArr,
		Minprice:    snInfo.Minprice,
		Discount:    discount,
		ProductType: "solomerch",
	}
}

type ProductInfo struct {
	GlobalID    int32  `json:"global_id"`
	Producttype string `json:"producttype"`
	Minprice    int32  `json:"minprice"`
	Maxprice    int32  `json:"maxprice"`

	// Размеры обуви
	Size3_5  int32 `json:"3.5"`
	Size4    int32 `json:"4"`
	Size4_5  int32 `json:"4.5"`
	Size5    int32 `json:"5"`
	Size5_5  int32 `json:"5.5"`
	Size6    int32 `json:"6"`
	Size6_5  int32 `json:"6.5"`
	Size7    int32 `json:"7"`
	Size7_5  int32 `json:"7.5"`
	Size8    int32 `json:"8"`
	Size8_5  int32 `json:"8.5"`
	Size9    int32 `json:"9"`
	Size9_5  int32 `json:"9.5"`
	Size10   int32 `json:"10"`
	Size10_5 int32 `json:"10.5"`
	Size11   int32 `json:"11"`
	Size11_5 int32 `json:"11.5"`
	Size12   int32 `json:"12"`
	Size12_5 int32 `json:"12.5"`
	Size13   int32 `json:"13"`

	// Размеры одежды
	XS  int32 `json:"XS"`
	S   int32 `json:"S"`
	M   int32 `json:"M"`
	L   int32 `json:"L"`
	XL  int32 `json:"XL"`
	XXL int32 `json:"XXL"`
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
func getSizePrice(pr GetFullProductsInfoByIdsRow, size string, category string) (int32, error) {
	switch category {
	case "snickers":
		// Обработка размеров обуви (pgtype.Int4)
		var sizeValue pgtype.Int4
		switch size {
		case "3.5":
			sizeValue = pr._35
		case "4":
			sizeValue = pr._4
		case "4.5":
			sizeValue = pr._45
		case "5":
			sizeValue = pr._5
		case "5.5":
			sizeValue = pr._55
		case "6":
			sizeValue = pr._6
		case "6.5":
			sizeValue = pr._65
		case "7":
			sizeValue = pr._7
		case "7.5":
			sizeValue = pr._75
		case "8":
			sizeValue = pr._8
		case "8.5":
			sizeValue = pr._85
		case "9":
			sizeValue = pr._9
		case "9.5":
			sizeValue = pr._95
		case "10":
			sizeValue = pr._10
		case "10.5":
			sizeValue = pr._105
		case "11":
			sizeValue = pr._11
		case "11.5":
			sizeValue = pr._115
		case "12":
			sizeValue = pr._12
		case "12.5":
			sizeValue = pr._125
		case "13":
			sizeValue = pr._13
		default:
			return 0, fmt.Errorf("invalid shoe size: %s", size)
		}

		if sizeValue.Valid {
			return sizeValue.Int32, nil
		}
		return 0, fmt.Errorf("shoe size %s not available for product %d", size, pr.GlobalID)

	case "clothes":
		// Обработка размеров одежды (interface{})
		var sizeValue pgtype.Int4
		fmt.Println(size, "size")
		switch size {
		case "XS":
			sizeValue = pr.XS
		case "S":
			fmt.Println("size S", pr.S)
			sizeValue = pr.S
		case "M":
			sizeValue = pr.M
		case "L":
			sizeValue = pr.L
		case "XL":
			sizeValue = pr.XL
		case "XXL":
			sizeValue = pr.XXL
		default:
			return 0, fmt.Errorf("invalid clothing size: %s", size)
		}

		if sizeValue.Valid {
			return sizeValue.Int32, nil
		}
		return 0, fmt.Errorf("shoe size %s not available for product %d", size, pr.GlobalID)

	case "solomerch":
		return pr.Minprice, nil

	default:
		return 0, fmt.Errorf("unsupported product type: %s", category)
	}
}

func (store *SQLStore) CreateDiscounts(ctx context.Context, discountData map[int32]types.DiscountData) error {
	// Собираем productIDs из ключей мапы

	productIDs := make([]int32, 0, len(discountData))
	for key := range discountData {
		productIDs = append(productIDs, key)
	}

	fmt.Println("productIDs", productIDs)

	// Получаем информацию о продуктах
	products, err := store.GetFullProductsInfoByIds(ctx, productIDs)
	if err != nil {
		return fmt.Errorf("error in GetProductsByIds: %w", err)
	}

	// Подготавливаем данные для вставки
	var (
		discountValues = make([][]byte, 0, len(products)) // Изменено на [][]byte
		minPrices      = make([]int32, 0, len(products))
		maxDiscPrices  = make([]int32, 0, len(products))
	)

	for _, pr := range products {
		discount, exists := discountData[pr.GlobalID]
		if !exists {
			continue
		}
		typeInfo, err := store.GetCategoryByTypeId(ctx, pr.Type)
		var value map[string]interface{}

		if typeInfo.ProductCategory == "solomerch" {
			// Для solomerch просто применяем скидку к minprice
			discountedPrice := pr.Minprice - (pr.Minprice*discount.Percent)/100
			minPrices = append(minPrices, discountedPrice)
			maxDiscPrices = append(maxDiscPrices, discountedPrice)
			value = map[string]interface{}{}
		} else if typeInfo.ProductCategory == "snickers" || typeInfo.ProductCategory == "clothes" {
			// Для товаров с размерами обрабатываем каждый размер
			minPrice := int32(math.MaxInt32)
			var maxDiscPrice int32 = 0
			value = make(map[string]interface{})
			fmt.Println(pr.S, "pr")
			for _, size := range discount.Sizes {
				sizeStr := fmt.Sprintf("%v", size)
				fmt.Println(sizeStr, "sizeStr")
				originalPrice, err := getSizePrice(pr, sizeStr, string(typeInfo.ProductCategory))
				if err != nil {
					continue
				}

				fmt.Println(originalPrice, "originalPrice")

				sizeDiscountPrice := originalPrice - (originalPrice*discount.Percent)/100
				fmt.Println(originalPrice, "originalPrice")
				value[sizeStr] = sizeDiscountPrice

				if sizeDiscountPrice < minPrice {
					minPrice = sizeDiscountPrice
				}
				if sizeDiscountPrice > maxDiscPrice {
					maxDiscPrice = sizeDiscountPrice
				}
			}

			fmt.Println(minPrice, "minPrice")

			minPrices = append(minPrices, minPrice)
			maxDiscPrices = append(maxDiscPrices, maxDiscPrice)
		}

		// Сериализуем value в JSON (как []byte)
		jsonData, err := json.Marshal(value)
		if err != nil {
			return fmt.Errorf("error marshaling discount value: %w", err)
		}
		discountValues = append(discountValues, jsonData)
	}

	err2 := store.ClearDiscounts(ctx)
	if err2 != nil {
		return fmt.Errorf("error in ClearDiscounts: %w", err)
	}

	// Вставляем скидки
	_, err = store.InsertDiscounts(ctx, InsertDiscountsParams{
		ProductIds:     productIDs,
		DiscountValues: discountValues, // Теперь это [][]byte
		MinPrices:      minPrices,
		MaxDiscPrices:  maxDiscPrices,
	})
	if err != nil {
		return fmt.Errorf("error inserting discounts: %w", err)
	}

	return nil
}

func NewClothesInfoResponse(snInfo GetClothesInfoByIdRow) ClothesInfoResponse {
	var imgArr []string
	for index := range snInfo.ImageCount {
		str := "images/" + fmt.Sprintf(snInfo.ImagePath+"/img%d.png", index+1)
		imgArr = append(imgArr, str)
	}
	var discount map[string]interface{}

	var jsonData map[string]interface{}
	json.Unmarshal(snInfo.Info, &jsonData)
	return ClothesInfoResponse{
		Name:        snInfo.Name,
		Image:       imgArr,
		Minprice:    snInfo.Minprice,
		Discount:    discount,
		ProductType: "clothes",
		Info:        jsonData,
	}
}

func (store *SQLStore) GetProductsByString(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (RespSearchProductsByString, error) {
	var result RespSearchProductsByString
	count, err := store.GetCountIdByFiltersAndFirm(ctx, name, filters)
	if err != nil {
		return result, err
	}
	var pageSize = math.Ceil(float64(count) / float64(size))

	var offset = (page - 1) * size

	var limit = size
	data, err1 := store.GetOrderedProductsByFilters(ctx, name, filters, orderedType, limit, offset)
	if err1 != nil {
		return result, err
	}

	ProductsInfo := types.ProductsPage{
		ProductsPageInfo: data,
		PageSize:         int(pageSize),
	}

	products := NewProductsByStringResponse(ProductsInfo.ProductsPageInfo)
	result = RespSearchProductsByString{
		Products: products,
		Pages:    ProductsInfo.PageSize,
	}
	return result, nil
}

func (store *SQLStore) GetProductsByFilters(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (RespProductsByStringStruct, error) {
	var result RespProductsByStringStruct
	pageSize := 0

	var offset = (page - 1) * size

	var limit = size * page
	data, err1 := store.GetOrderedProductsByFilters(ctx, name, filters, orderedType, limit, offset)
	if err1 != nil {
		return result, err1
	}

	merchInfo := types.ProductsPage{
		ProductsPageInfo: data,
		PageSize:         int(pageSize),
	}
	if len(data) != 0 {
		pageSize = int(math.Ceil(float64(data[0].TotalCount) / float64(size)))
	}

	merch := NewProductsByStringResponse(merchInfo.ProductsPageInfo)
	result = RespProductsByStringStruct{
		Merch: merch,
		Pages: merchInfo.PageSize,
	}
	return result, nil
}

type RespSearchProductsAndFiltersByString struct {
	Products []ProductsResponseD   `json:"products"`
	Pages    int                   `json:"pages"`
	Filters  FiltersSearchResponse `json:"filters"`
}

type Clothes struct {
	S   int64 `json:"s"`
	M   int64 `json:"m"`
	L   int64 `json:"l"`
	XL  int64 `json:"xl"`
	XXL int64 `json:"xxl"`
}

type Snickers struct {
	Size35  int64 `json:"3.5"`
	Size4   int64 `json:"4"`
	Size45  int64 `json:"4.5"`
	Size5   int64 `json:"5"`
	Size55  int64 `json:"5.5"`
	Size6   int64 `json:"6"`
	Size65  int64 `json:"6.5"`
	Size7   int64 `json:"7"`
	Size75  int64 `json:"7.5"`
	Size8   int64 `json:"8"`
	Size85  int64 `json:"8.5"`
	Size9   int64 `json:"9"`
	Size95  int64 `json:"9.5"`
	Size10  int64 `json:"10"`
	Size105 int64 `json:"10.5"`
	Size11  int64 `json:"11"`
	Size115 int64 `json:"11.5"`
	Size12  int64 `json:"12"`
	Size125 int64 `json:"12.5"`
	Size13  int64 `json:"13"`
}
type SizeData struct {
	Snickers Snickers `json:"snickers"`
	Clothes  Clothes  `json:"clothes"`
}

type ProductsResponseD struct {
	Name     string      `json:"name"`
	Id       int32       `json:"id"`
	Image    []string    `json:"imgs"`
	Discount interface{} `json:"discount"`
	Price    int         `json:"price"`
}

type FiltersSearchResponse struct {
	FirmsCount map[string]int `json:"firmsCount"`
	Price      [2]int32       `json:"price"`
	Sizes      SizeData       `json:"sizes"`
}

func (store *SQLStore) GetProductsAndFiltersByString(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (RespSearchProductsAndFiltersByString, error) {
	var result RespSearchProductsAndFiltersByString
	count, err := store.GetCountIdByFiltersAndFirm(ctx, name, filters)
	if err != nil {
		return result, err
	}
	var pageSize = math.Ceil(float64(count) / float64(size))

	var offset = (page - 1) * size

	var limit = size
	fmt.Println(limit, "test")
	data, err := store.GetOrderedProductsByFilters(ctx, name, filters, orderedType, limit, offset)
	fmt.Println(data, "test")
	if err != nil {
		fmt.Println(err, "error in GetOrderedProductsByFilters")
		return result, err
	}
	filter, err := store.GetFiltersByString(ctx, name)

	if err != nil {
		fmt.Println(filter, "f,dslfsdf")
		return result, err
	}

	ProductsInfo := ProductsPageAndFilters{
		ProductsPageInfo: data,
		PageSize:         int(pageSize),
		Filter:           filter,
	}
	var firmsCount map[string]int
	fmt.Println(ProductsInfo.Filter.FirmCountMap, "test1")
	err = json.Unmarshal(ProductsInfo.Filter.FirmCountMap, &firmsCount)
	if err != nil {
		fmt.Println(err, "wweeerwerwer")
		return result, err
	}

	fmt.Println(ProductsInfo.Filter, "test2")

	sizeData := SizeData{
		Snickers: Snickers{
			Size35:  ProductsInfo.Filter._35,
			Size4:   ProductsInfo.Filter._4,
			Size45:  ProductsInfo.Filter._45,
			Size5:   ProductsInfo.Filter._5,
			Size55:  ProductsInfo.Filter._55,
			Size6:   ProductsInfo.Filter._6,
			Size65:  ProductsInfo.Filter._65,
			Size7:   ProductsInfo.Filter._7,
			Size75:  ProductsInfo.Filter._75,
			Size8:   ProductsInfo.Filter._8,
			Size85:  ProductsInfo.Filter._85,
			Size9:   ProductsInfo.Filter._9,
			Size95:  ProductsInfo.Filter._95,
			Size10:  ProductsInfo.Filter._10,
			Size105: ProductsInfo.Filter._105,
			Size11:  ProductsInfo.Filter._11,
			Size115: ProductsInfo.Filter._115,
			Size12:  ProductsInfo.Filter._12,
			Size125: ProductsInfo.Filter._125,
			Size13:  ProductsInfo.Filter._13,
		},
		Clothes: Clothes{
			S:   ProductsInfo.Filter.S,
			M:   ProductsInfo.Filter.M,
			L:   ProductsInfo.Filter.L,
			XL:  ProductsInfo.Filter.XL,
			XXL: ProductsInfo.Filter.XXL,
		},
	}
	fmt.Println(ProductsInfo.Filter.Min, "test3")
	a := ProductsInfo.Filter.Min.(int32)
	fmt.Println(a, "test3")

	var resp = RespSearchProductsAndFiltersByString{
		Products: NewProductsByStringResponse(data),
		Pages:    ProductsInfo.PageSize,
		Filters: FiltersSearchResponse{
			Price:      [2]int32{ProductsInfo.Filter.Min.(int32), ProductsInfo.Filter.Max.(int32)},
			Sizes:      sizeData,
			FirmsCount: firmsCount,
		},
	}
	fmt.Println(resp, "test4")
	return resp, nil
}

type SnickersFilterStruct struct {
	Firms map[string]int32 `json:"firmsCount"`
	Sizes SizeData         `json:"sizes"`
	Price []float32        `json:"price"`
	Types []int32          `json:"types"`
}

type SnickersResp struct {
	Filters  SnickersFilterStruct            `json:"filters"`
	Products []types.ProductsSearchResponse1 `json:"products"`
	Pages    int64                           `json:"pages"`
}

func getActiveSizesSneakers(filters GetFiltersFromSnickersRow) []string {
	sizeMap := map[int64]string{
		filters._35:  "3.5",
		filters._4:   "4",
		filters._45:  "4.5",
		filters._5:   "5",
		filters._55:  "5.5",
		filters._6:   "6",
		filters._65:  "6.5",
		filters._7:   "7",
		filters._75:  "7.5",
		filters._8:   "8",
		filters._85:  "8.5",
		filters._9:   "9",
		filters._95:  "9.5",
		filters._10:  "10",
		filters._105: "10.5",
		filters._11:  "11",
		filters._115: "11.5",
		filters._12:  "12",
		filters._125: "12.5",
		filters._13:  "13",
	}

	var sizes []string
	for value, sizeStr := range sizeMap {
		if value != 0 {
			sizes = append(sizes, sizeStr)
		}
	}
	return sizes
}
func getActiveSizesClothes(filters GetFiltersFromClothesRow) []string {
	sizeMap := map[int64]string{
		filters.S:   "S",
		filters.M:   "M",
		filters.L:   "L",
		filters.XL:  "XL",
		filters.XXL: "XXL",
	}

	var sizes []string
	for value, sizeName := range sizeMap {
		if value != 0 {
			sizes = append(sizes, sizeName)
		}
	}
	return sizes
}

func (store *SQLStore) GetSnickersAndFilters(ctx context.Context, typeIds []int32, postData types.PostDataAndFiltersByCategoryAndType) (SnickersResp, error) {
	var realFilter SnickersFilterStruct
	var productsInfo SnickersResp

	filters, err := store.GetFiltersFromSnickers(ctx, GetFiltersFromSnickersParams{
		Name: "",
	})
	if err != nil {
		return productsInfo, err
	}

	var firms map[string]int32
	fmt.Println(filters.FirmCountMap, "uhjvjhvjh")
	json.Unmarshal(filters.FirmCountMap, &firms)
	fmt.Println(firms, "ppppppppppppppppppppppppppp")
	firmsArr := map[string]int32{}
	keys := make([]string, 0, len(firmsArr))
	for key := range firmsArr {
		keys = append(keys, key)
	}
	fmt.Println(firmsArr, "4444444444444444444")
	realFilter = SnickersFilterStruct{
		Firms: firms,
		Price: []float32{float32(filters.Min), float32(filters.Max)},
		Types: typeIds,
		Sizes: SizeData{
			Snickers: Snickers{
				Size35:  filters._35,
				Size4:   filters._4,
				Size45:  filters._45,
				Size5:   filters._5,
				Size55:  filters._55,
				Size6:   filters._6,
				Size65:  filters._65,
				Size7:   filters._7,
				Size75:  filters._75,
				Size8:   filters._8,
				Size85:  filters._85,
				Size9:   filters._9,
				Size95:  filters._95,
				Size10:  filters._10,
				Size105: filters._105,
				Size11:  filters._11,
				Size115: filters._115,
				Size12:  filters._12,
				Size125: filters._125,
				Size13:  filters._13,
			},
		},
	}

	filterForRequest := types.SnickersFilterStruct{
		Firms: keys,
		Price: []float32{float32(filters.Min), float32(filters.Max)},
		Types: []int32{},
		Sizes: types.SizesT{
			Snickers: getActiveSizesSneakers(filters),
		},
	}

	data, err := store.GetSnickersByFilters(ctx, postData.Name, filterForRequest, postData.Page, postData.Size, postData.OrderedType)
	if err != nil {
		return productsInfo, err
	}
	if len(data) != 0 {
		productsInfo.Pages = data[0].TotalCount / int64(postData.Size)
	} else {
		productsInfo.Pages = 0
	}
	productsInfo.Products = data
	productsInfo.Filters = realFilter
	return productsInfo, nil
}

func (store *SQLStore) GetMerchAndFilters(ctx context.Context, typeIds []int32, postData types.PostDataAndFiltersByCategoryAndType) (SnickersResp, error) {
	var realFilter SnickersFilterStruct
	var productsInfo SnickersResp
	filters, err := store.GetFiltersFromMerchByType(ctx, GetFiltersFromMerchByTypeParams{
		Name: "",
	})
	if err != nil {
		return productsInfo, err
	}
	var firms map[string]int32
	json.Unmarshal(filters.FirmCountMap, &firms)
	firmsArr := make([]string, 0, len(firms))
	for key, _ := range firms {
		firmsArr = append(firmsArr, key)
	}
	realFilter = SnickersFilterStruct{
		Firms: firms,
		Price: []float32{float32(filters.Min), float32(filters.Max)},
		Types: typeIds,
	}

	reqFilter := types.SnickersFilterStruct{
		Firms: firmsArr,
		Price: []float32{float32(filters.Min), float32(filters.Max)},
		Types: []int32{},
	}

	data, err := store.GetMerchByFilters(ctx, postData.Name, reqFilter, postData.Page, postData.Size, postData.OrderedType)
	if err != nil {
		fmt.Println(err, "error in GetMerchByFilters")
		return productsInfo, err
	}
	if len(data) != 0 {
		productsInfo.Pages = data[0].TotalCount / int64(postData.Size)
	} else {
		productsInfo.Pages = 0
	}
	productsInfo.Products = data
	productsInfo.Filters = realFilter
	return productsInfo, nil
}

func (store *SQLStore) GetClothesAndFilters(ctx context.Context, typeIds []int32, postData types.PostDataAndFiltersByCategoryAndType) (SnickersResp, error) {
	var realFilter SnickersFilterStruct
	var productsInfo SnickersResp
	filters, err := store.GetFiltersFromClothes(ctx, GetFiltersFromClothesParams{
		Name: "",
	})
	if err != nil {
		return productsInfo, err
	}
	var firms map[string]int32
	json.Unmarshal(filters.FirmCountMap, &firms)
	firmsArr := make([]string, 0, len(firms))
	for key, _ := range firms {
		firmsArr = append(firmsArr, key)
	}
	realFilter = SnickersFilterStruct{
		Firms: firms,
		Price: []float32{float32(filters.Min), float32(filters.Max)},
		Types: typeIds,
		Sizes: SizeData{
			Clothes: Clothes{
				S:   filters.S,
				M:   filters.M,
				L:   filters.L,
				XL:  filters.XL,
				XXL: filters.XXL,
			},
		},
	}

	filterForRequest := types.SnickersFilterStruct{
		Firms: firmsArr,
		Price: []float32{float32(filters.Min), float32(filters.Max)},
		Types: []int32{},
		Sizes: types.SizesT{
			Clothes: getActiveSizesClothes(filters),
		},
	}

	data, err := store.GetClothesByFilters(ctx, postData.Name, filterForRequest, postData.Page, postData.Size, postData.OrderedType)
	if err != nil {
		return productsInfo, err
	}
	if len(data) != 0 {
		productsInfo.Pages = data[0].TotalCount / int64(postData.Size)
	} else {
		productsInfo.Pages = 0
	}
	productsInfo.Products = data
	productsInfo.Filters = realFilter
	return productsInfo, nil
}

func (store *SQLStore) GetMercgAndFiltersByString(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (RespSearchProductsAndFiltersByString, error) {
	var result RespSearchProductsAndFiltersByString
	count, err := store.GetCountIdByFiltersAndFirm(ctx, name, filters)
	if err != nil {
		return result, err
	}
	var pageSize = math.Ceil(float64(count) / float64(size))

	var offset = (page - 1) * size

	var limit = size
	fmt.Println(limit, "test")
	data, err := store.GetOrderedProductsByFilters(ctx, name, filters, orderedType, limit, offset)
	fmt.Println(data, "test")
	if err != nil {
		return result, err
	}
	filter, err := store.GetFiltersByString(ctx, name)

	if err != nil {
		return result, err
	}

	ProductsInfo := ProductsPageAndFilters{
		ProductsPageInfo: data,
		PageSize:         int(pageSize),
		Filter:           filter,
	}
	var firmsCount map[string]int
	fmt.Println(ProductsInfo.Filter.FirmCountMap, "test1")
	err = json.Unmarshal(ProductsInfo.Filter.FirmCountMap, &firmsCount)
	if err != nil {
		fmt.Println(err, "wweeerwerwer")
		return result, err
	}

	fmt.Println(ProductsInfo.Filter, "test2")

	sizeData := SizeData{
		Snickers: Snickers{
			Size35:  ProductsInfo.Filter._35,
			Size4:   ProductsInfo.Filter._4,
			Size45:  ProductsInfo.Filter._45,
			Size5:   ProductsInfo.Filter._5,
			Size55:  ProductsInfo.Filter._55,
			Size6:   ProductsInfo.Filter._6,
			Size65:  ProductsInfo.Filter._65,
			Size7:   ProductsInfo.Filter._7,
			Size75:  ProductsInfo.Filter._75,
			Size8:   ProductsInfo.Filter._8,
			Size85:  ProductsInfo.Filter._85,
			Size9:   ProductsInfo.Filter._9,
			Size95:  ProductsInfo.Filter._95,
			Size10:  ProductsInfo.Filter._10,
			Size105: ProductsInfo.Filter._105,
			Size11:  ProductsInfo.Filter._11,
			Size115: ProductsInfo.Filter._115,
			Size12:  ProductsInfo.Filter._12,
			Size125: ProductsInfo.Filter._125,
			Size13:  ProductsInfo.Filter._13,
		},
		Clothes: Clothes{
			S:   ProductsInfo.Filter.S,
			M:   ProductsInfo.Filter.M,
			L:   ProductsInfo.Filter.L,
			XL:  ProductsInfo.Filter.XL,
			XXL: ProductsInfo.Filter.XXL,
		},
	}
	fmt.Println(ProductsInfo.Filter.Min, "test3")
	a := ProductsInfo.Filter.Min.(int32)
	fmt.Println(a, "test3")

	var resp = RespSearchProductsAndFiltersByString{
		Products: NewProductsByStringResponse(data),
		Pages:    ProductsInfo.PageSize,
		Filters: FiltersSearchResponse{
			Price:      [2]int32{ProductsInfo.Filter.Min.(int32), ProductsInfo.Filter.Max.(int32)},
			Sizes:      sizeData,
			FirmsCount: firmsCount,
		},
	}
	return resp, nil
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
func (store *SQLStore) GetSnickersByNameComplex(ctx context.Context, name string, limit int32) ([]types.ProductsSearchResponse, error) {
	snickers, err := store.Queries.GetSnickersByName(ctx, GetSnickersByNameParams{
		Column1: name,
		Limit:   limit,
	})
	if err != nil {
		return []types.ProductsSearchResponse{}, err
	}

	return NewProductsSearchResponse(snickers), nil

}

func (store *SQLStore) GetProductsByNameComplex(ctx context.Context, name string, limit int32) ([]types.ProductsSearchResponse, error) {
	snickers, err := store.Queries.GetProductsByName(ctx, GetProductsByNameParams{
		Column1: name,
		Limit:   limit,
	})
	if err != nil {
		return []types.ProductsSearchResponse{}, err
	}

	return NewMerchSearchResponse(snickers), nil

}

func NewProductsSearchResponse(ProductsSearch []GetSnickersByNameRow) []types.ProductsSearchResponse {

	list := []types.ProductsSearchResponse{}
	for _, info := range ProductsSearch {
		img_path := "images/" + info.ImagePath + "/img1.png"
		list = append(list, types.ProductsSearchResponse{
			Image: img_path,
			Price: int(info.Minprice),
			Id:    int(info.ID),
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
