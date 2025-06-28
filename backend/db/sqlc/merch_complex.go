package db

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"time"

	"github.com/mrkrabopl1/go_db/types"
)

type SnickersPageAndFilters struct {
	SnickersPageInfo []types.SnickersSearch
	PageSize         int
	Filter           GetFiltersByStringRow
}

type RespSearchSnickersByString struct {
	Snickers []SnickersResponseD `json:"snickers"`
	Pages    int                 `json:"pages"`
}
type RespMerchSnickersByStringtruct struct {
	Merch []SnickersResponseD `json:"snickers"`
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
	fmt.Println(snickers)
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

	var discount map[string]interface{}

	if snInfo.Value != nil {
		json.Unmarshal(snInfo.Value, &discount)
	}
	var jsonData map[string]interface{}
	json.Unmarshal(snInfo.Info, &jsonData)
	fmt.Println(jsonData)
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

func NewClothesInfoResponse(snInfo GetClothesInfoByIdRow) ClothesInfoResponse {
	var imgArr []string
	for index := range snInfo.ImageCount {
		str := "images/" + fmt.Sprintf(snInfo.ImagePath+"/img%d.png", index+1)
		imgArr = append(imgArr, str)
	}
	var discount map[string]interface{}

	var jsonData map[string]interface{}
	fmt.Println(jsonData)
	return ClothesInfoResponse{
		Name:        snInfo.Name,
		Image:       imgArr,
		Minprice:    snInfo.Minprice,
		Discount:    discount,
		ProductType: "solomerch",
	}
}

func (store *SQLStore) GetSnickersByString(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (RespSearchSnickersByString, error) {
	var result RespSearchSnickersByString
	count, err := store.GetCountIdByFiltersAndFirm(ctx, name, filters)
	if err != nil {
		return result, err
	}
	var pageSize = math.Ceil(float64(count) / float64(size))

	var offset = (page - 1) * size

	var limit = size * page
	data, err1 := store.GetOrderedProductsByFilters(ctx, name, filters, orderedType, limit, offset)
	if err1 != nil {
		return result, err
	}

	ProductsInfo := types.ProductsPage{
		SnickersPageInfo: data,
		PageSize:         int(pageSize),
	}

	snickers := NewSnickersByStringResponse(ProductsInfo.SnickersPageInfo)
	result = RespSearchSnickersByString{
		Snickers: snickers,
		Pages:    ProductsInfo.PageSize,
	}
	return result, nil
}

func (store *SQLStore) GetMerchByFilters(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (RespMerchSnickersByStringtruct, error) {
	var result RespMerchSnickersByStringtruct
	count, err := store.GetCountIdByFiltersAndFirm(ctx, name, filters)
	if err != nil {
		return result, err
	}
	var pageSize = math.Ceil(float64(count) / float64(size))

	var offset = (page - 1) * size

	var limit = size * page
	data, err1 := store.GetOrderedProductsByFilters(ctx, name, filters, orderedType, limit, offset)
	if err1 != nil {
		return result, err
	}

	merchInfo := types.ProductsPage{
		SnickersPageInfo: data,
		PageSize:         int(pageSize),
	}

	merch := NewSnickersByStringResponse(merchInfo.SnickersPageInfo)
	result = RespMerchSnickersByStringtruct{
		Merch: merch,
		Pages: merchInfo.PageSize,
	}
	return result, nil
}

type RespSearchSnickersAndFiltersByString struct {
	Snickers []SnickersResponseD   `json:"snickers"`
	Pages    int                   `json:"pages"`
	Filters  FiltersSearchResponse `json:"filters"`
}

type SizeData struct {
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

type SnickersResponseD struct {
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

func (store *SQLStore) GetSnickersAndFiltersByString(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (RespSearchSnickersAndFiltersByString, error) {
	var result RespSearchSnickersAndFiltersByString
	count, err := store.GetCountIdByFiltersAndFirm(ctx, name, filters)
	if err != nil {
		return result, err
	}
	var pageSize = math.Ceil(float64(count) / float64(size))

	var offset = (page - 1) * size

	var limit = size * page
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

	ProductsInfo := SnickersPageAndFilters{
		SnickersPageInfo: data,
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
	}
	fmt.Println(ProductsInfo.Filter.Min, "test3")
	a := ProductsInfo.Filter.Min.(int32)
	fmt.Println(a, "test3")

	var resp = RespSearchSnickersAndFiltersByString{
		Snickers: NewSnickersByStringResponse(data),
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

func (store *SQLStore) GetMercgAndFiltersByString(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (RespSearchSnickersAndFiltersByString, error) {
	var result RespSearchSnickersAndFiltersByString
	count, err := store.GetCountIdByFiltersAndFirm(ctx, name, filters)
	if err != nil {
		return result, err
	}
	var pageSize = math.Ceil(float64(count) / float64(size))

	var offset = (page - 1) * size

	var limit = size * page
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

	ProductsInfo := SnickersPageAndFilters{
		SnickersPageInfo: data,
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
	}
	fmt.Println(ProductsInfo.Filter.Min, "test3")
	a := ProductsInfo.Filter.Min.(int32)
	fmt.Println(a, "test3")

	var resp = RespSearchSnickersAndFiltersByString{
		Snickers: NewSnickersByStringResponse(data),
		Pages:    ProductsInfo.PageSize,
		Filters: FiltersSearchResponse{
			Price:      [2]int32{ProductsInfo.Filter.Min.(int32), ProductsInfo.Filter.Max.(int32)},
			Sizes:      sizeData,
			FirmsCount: firmsCount,
		},
	}
	return resp, nil
}

func NewSnickersByStringResponse(snLines []types.SnickersSearch) []SnickersResponseD {
	snPageResp := make([]SnickersResponseD, 0)

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

		snPageResp = append(snPageResp, SnickersResponseD{
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
func (store *SQLStore) GetSnickersByNameComplex(ctx context.Context, name string, limit int32) ([]types.SnickersSearchResponse, error) {
	snickers, err := store.Queries.GetSnickersByName(ctx, GetSnickersByNameParams{
		Column1: name,
		Limit:   limit,
	})
	if err != nil {
		return []types.SnickersSearchResponse{}, err
	}

	return NewSnickersSearchResponse(snickers), nil

}

func (store *SQLStore) GetMerchByNameComplex(ctx context.Context, name string, limit int32) ([]types.SnickersSearchResponse, error) {
	snickers, err := store.Queries.GetMerchByName(ctx, GetMerchByNameParams{
		Column1: name,
		Limit:   limit,
	})
	if err != nil {
		return []types.SnickersSearchResponse{}, err
	}

	return NewMerchSearchResponse(snickers), nil

}
func NewSnickersSearchResponse(snickersSearch []GetSnickersByNameRow) []types.SnickersSearchResponse {

	list := []types.SnickersSearchResponse{}
	for _, info := range snickersSearch {
		img_path := "images/" + info.ImagePath + "/img1.png"
		list = append(list, types.SnickersSearchResponse{
			Image: img_path,
			Price: int(info.Minprice),
			Id:    int(info.ID),
			Name:  info.Name,
			Firm:  info.Firm,
		})
	}

	return list
}
func NewMerchSearchResponse(snickersSearch []GetMerchByNameRow) []types.SnickersSearchResponse {

	list := []types.SnickersSearchResponse{}
	for _, info := range snickersSearch {
		img_path := "images/" + info.ImagePath + "/img1.png"
		list = append(list, types.SnickersSearchResponse{
			Image: img_path,
			Price: int(info.Minprice),
			Id:    int(info.GlobalID),
			Name:  info.Name,
			Firm:  info.Firm,
		})
	}

	return list
}
func (store *SQLStore) GetSoloCollectionComplex(ctx context.Context, arg GetSoloCollectionParams) ([]types.SnickersSearchResponse1, error) {
	snickers, err := store.Queries.GetSoloCollection(ctx, arg)
	if err != nil {
		return []types.SnickersSearchResponse1{}, err
	}

	return NewSnickersSearchResponse1(snickers), nil
}

func (store *SQLStore) GetMerchCollectionComplex(ctx context.Context, arg GetMerchCollectionParams) ([]types.MerchSearchResponse, error) {
	snickers, err := store.Queries.GetMerchCollection(ctx, arg)
	if err != nil {
		return []types.MerchSearchResponse{}, err
	}

	return NewMerchCollectionResponse(snickers), nil
}

func NewMerchCollectionResponse(snickersSearch []GetMerchCollectionRow) []types.MerchSearchResponse {

	list := []types.MerchSearchResponse{}
	for _, info := range snickersSearch {
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
			Image:       imgArr,
			Price:       int(info.Minprice),
			Id:          int(info.GlobalID),
			Name:        info.Name,
			Firm:        info.Firm,
			Discount:    discount,
			ProductType: info.Producttype,
		})

	}

	return list
}

func NewSnickersSearchResponse1(snickersSearch []GetSoloCollectionRow) []types.SnickersSearchResponse1 {

	list := []types.SnickersSearchResponse1{}
	for _, info := range snickersSearch {
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
		list = append(list, types.SnickersSearchResponse1{
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

func (store *SQLStore) GetSnickersWithDiscountComplex(ctx context.Context) ([]types.SnickersSearchResponse1, error) {
	searchData, err := store.Queries.GetSnickersWithDiscount(ctx)
	if err != nil {
		return []types.SnickersSearchResponse1{}, err
	}

	return NewSnickersSearchResponse3(searchData), nil
}
func (store *SQLStore) GetMerchWithDiscountComplex(ctx context.Context) ([]types.SnickersSearchResponse1, error) {
	searchData, err := store.Queries.GetMerchWithDiscount(ctx)
	if err != nil {
		return []types.SnickersSearchResponse1{}, err
	}

	return NewMerchDiscountResponse(searchData), nil
}
func NewMerchDiscountResponse(snickersSearch []GetMerchWithDiscountRow) []types.SnickersSearchResponse1 {

	list := []types.SnickersSearchResponse1{}
	for _, info := range snickersSearch {
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
		list = append(list, types.SnickersSearchResponse1{
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
