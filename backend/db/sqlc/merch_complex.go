package db

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"os"
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
	snickersInfoResp := NewSnickersInfoResponse(snickers)
	return snickersInfoResp, nil
}
func NewSnickersInfoResponse(snInfo GetSnickersInfoByIdRow) SnickersInfoResponse {
	var inf map[string]float64
	var imgArr []string
	files, _ := os.ReadDir(snInfo.ImagePath)
	for index, _ := range files {
		str := fmt.Sprintf(snInfo.ImagePath+"/%d.jpg", index+1)
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
	Size35  int64 `json:"size_35"`
	Size4   int64 `json:"size_4"`
	Size45  int64 `json:"size_45"`
	Size5   int64 `json:"size_5"`
	Size55  int64 `json:"size_55"`
	Size6   int64 `json:"size_6"`
	Size65  int64 `json:"size_65"`
	Size7   int64 `json:"size_7"`
	Size75  int64 `json:"size_75"`
	Size8   int64 `json:"size_8"`
	Size85  int64 `json:"size_85"`
	Size9   int64 `json:"size_9"`
	Size95  int64 `json:"size_95"`
	Size10  int64 `json:"size_10"`
	Size105 int64 `json:"size_105"`
	Size11  int64 `json:"size_11"`
	Size115 int64 `json:"size_115"`
	Size12  int64 `json:"size_12"`
	Size125 int64 `json:"size_125"`
	Size13  int64 `json:"size_13"`
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
	Price      [2]int         `json:"price"`
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
	data, err := store.GetOrderedSnickersByFilters(ctx, name, filters, orderedType, limit, offset)
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
	json.Unmarshal(snickersInfo.Filter.FirmCountMap, &firmsCount)

	sizeData := SizeData{
		Size35:  snickersInfo.Filter.Size35,
		Size4:   snickersInfo.Filter.Size4,
		Size45:  snickersInfo.Filter.Size45,
		Size5:   snickersInfo.Filter.Size5,
		Size55:  snickersInfo.Filter.Size55,
		Size6:   snickersInfo.Filter.Size6,
		Size65:  snickersInfo.Filter.Size65,
		Size7:   snickersInfo.Filter.Size7,
		Size75:  snickersInfo.Filter.Size75,
		Size8:   snickersInfo.Filter.Size8,
		Size85:  snickersInfo.Filter.Size85,
		Size9:   snickersInfo.Filter.Size9,
		Size95:  snickersInfo.Filter.Size95,
		Size10:  snickersInfo.Filter.Size10,
		Size105: snickersInfo.Filter.Size105,
		Size11:  snickersInfo.Filter.Size11,
		Size115: snickersInfo.Filter.Size115,
		Size12:  snickersInfo.Filter.Size12,
		Size125: snickersInfo.Filter.Size125,
		Size13:  snickersInfo.Filter.Size13,
	}

	var resp = RespSearchSnickersAndFiltersByString{
		Snickers: NewSnickersByStringResponse(data),
		Pages:    snickersInfo.PageSize,
		Filters: FiltersSearchResponse{
			Price:      [2]int{snickersInfo.Filter.Min.(int), snickersInfo.Filter.Max.(int)},
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
			str := fmt.Sprintf(line.Image_path+"/%d.jpg", i)
			imgArr = append(imgArr, str)
		}

		var discount interface{}

		if line.Discount != nil {
			discount = *line.Discount
		} else {
			discount = nil
		}

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
		img_path := info.ImagePath + "/1.jpg"
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
			str := fmt.Sprintf(info.ImagePath+"/%d.jpg", i)
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
