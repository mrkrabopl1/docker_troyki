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
type SnickersInfoResponse struct {
	Name     string                 `json:"name"`
	Image    []string               `json:"imgs"`
	Info     map[string]interface{} `json:"info"`
	Discount map[string]interface{} `json:"discount"`
}

func (store *SQLStore) GetSnickersInfoByIdComplex(ctx context.Context, id int32) (SnickersInfoResponse, error) {

	snickers, err := store.Queries.GetSnickersInfoById(ctx, id)
	if err != nil {
		return SnickersInfoResponse{}, err
	}
	fmt.Println(snickers)
	snickersInfoResp := NewSnickersInfoResponse(snickers)
	return snickersInfoResp, nil
}
func NewSnickersInfoResponse(snInfo GetSnickersInfoByIdRow) SnickersInfoResponse {
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
	return SnickersInfoResponse{
		Name:     snInfo.Name,
		Image:    imgArr,
		Info:     jsonData,
		Discount: discount,
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
	data, err1 := store.GetOrderedSnickersByFilters(ctx, name, filters, orderedType, limit, offset)
	if err1 != nil {
		return result, err
	}

	snickersInfo := types.SnickersPage{
		SnickersPageInfo: data,
		PageSize:         int(pageSize),
	}

	snickers := NewSnickersByStringResponse(snickersInfo.SnickersPageInfo)
	result = RespSearchSnickersByString{
		Snickers: snickers,
		Pages:    snickersInfo.PageSize,
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
	data, err := store.GetOrderedSnickersByFilters(ctx, name, filters, orderedType, limit, offset)
	fmt.Println(data, "test")
	if err != nil {
		return result, err
	}
	filter, err := store.GetFiltersByString(ctx, name)

	if err != nil {
		return result, err
	}

	snickersInfo := SnickersPageAndFilters{
		SnickersPageInfo: data,
		PageSize:         int(pageSize),
		Filter:           filter,
	}
	var firmsCount map[string]int
	fmt.Println(snickersInfo.Filter.FirmCountMap, "test1")
	err = json.Unmarshal(snickersInfo.Filter.FirmCountMap, &firmsCount)
	if err != nil {
		fmt.Println(err, "wweeerwerwer")
		return result, err
	}

	fmt.Println(snickersInfo.Filter, "test2")

	sizeData := SizeData{
		Size35:  snickersInfo.Filter._35,
		Size4:   snickersInfo.Filter._4,
		Size45:  snickersInfo.Filter._45,
		Size5:   snickersInfo.Filter._5,
		Size55:  snickersInfo.Filter._55,
		Size6:   snickersInfo.Filter._6,
		Size65:  snickersInfo.Filter._65,
		Size7:   snickersInfo.Filter._7,
		Size75:  snickersInfo.Filter._75,
		Size8:   snickersInfo.Filter._8,
		Size85:  snickersInfo.Filter._85,
		Size9:   snickersInfo.Filter._9,
		Size95:  snickersInfo.Filter._95,
		Size10:  snickersInfo.Filter._10,
		Size105: snickersInfo.Filter._105,
		Size11:  snickersInfo.Filter._11,
		Size115: snickersInfo.Filter._115,
		Size12:  snickersInfo.Filter._12,
		Size125: snickersInfo.Filter._125,
		Size13:  snickersInfo.Filter._13,
	}
	fmt.Println(snickersInfo.Filter.Min, "test3")
	a := snickersInfo.Filter.Min.(int32)
	fmt.Println(a, "test3")

	var resp = RespSearchSnickersAndFiltersByString{
		Snickers: NewSnickersByStringResponse(data),
		Pages:    snickersInfo.PageSize,
		Filters: FiltersSearchResponse{
			Price:      [2]int32{snickersInfo.Filter.Min.(int32), snickersInfo.Filter.Max.(int32)},
			Sizes:      sizeData,
			FirmsCount: firmsCount,
		},
	}
	fmt.Println(resp, "test4")
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
func (store *SQLStore) GetSoloCollectionComplex(ctx context.Context, arg GetSoloCollectionParams) ([]types.SnickersSearchResponse1, error) {
	snickers, err := store.Queries.GetSoloCollection(ctx, arg)
	if err != nil {
		return []types.SnickersSearchResponse1{}, err
	}

	return NewSnickersSearchResponse1(snickers), nil
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
