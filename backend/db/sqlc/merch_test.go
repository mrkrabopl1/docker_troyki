package db

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"

	"github.com/mrkrabopl1/go_db/types"
	"github.com/stretchr/testify/require"
)

func TestGetFirms(t *testing.T) {
	firms, err := testStore.GetFirms(context.Background())
	fmt.Println(firms)
	require.NoError(t, err)
	require.NotEmpty(t, firms)
}

func TestGetMerchFirms(t *testing.T) {
	firms, err := testStore.GetMerchFirms(context.Background())
	fmt.Println(firms)
	require.NoError(t, err)
	require.NotEmpty(t, firms)
}

func TestGetSnickersByFirmName(t *testing.T) {
	snickers, err := testStore.GetSnickersByFirmName(context.Background(), "soloMerch")
	fmt.Println(snickers)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetMerchByFirmName(t *testing.T) {
	snickers, err := testStore.GetMerchProductsByFirmName(context.Background(), "solomerch")
	fmt.Println(snickers)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetFiltersByString(t *testing.T) {
	snickers, err := testStore.GetFiltersByString(context.Background(), "POP MART")
	fmt.Println(snickers)
	var result map[string]interface{}
	json.Unmarshal(snickers.FirmCountMap, &result)
	fmt.Println(result)
	require.NoError(t, err)
}
func TestGetCombFiltersByString(t *testing.T) {
	snickers, err := testStore.GetCombinedFiltersByString(context.Background(), "POP MART")
	fmt.Println(snickers)
	var result map[string]interface{}
	json.Unmarshal(snickers.FirmCountMap, &result)
	fmt.Println(result)
	require.NoError(t, err)
}
func TestGetFiltersByString1(t *testing.T) {
	snickers, err := testStore.GetMerchFiltersByString(context.Background(), "POP MART")
	fmt.Println(snickers)
	var result map[string]interface{}
	json.Unmarshal(snickers.FirmCountMap, &result)
	fmt.Println(result)
	require.NoError(t, err)
}

func TestGetCountIdByFiltersAndFirm(t *testing.T) {
	snickers, err := testStore.GetCountIdByFiltersAndFirm(context.Background(), "Labubu", types.SnickersFilterStruct{
		Sizes: types.SizesT{
			Snickers: []string{},
			Clothes:  []string{},
		},
		Firms: []string{},
		Price: []float32{},
	})
	fmt.Println(snickers, "fldkfjlskdjflsd")
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetOrderedSnickersIByFilters(t *testing.T) {
	snickers, err := testStore.GetOrderedProductsByFilters(context.Background(), "POP MART", types.SnickersFilterStruct{
		Firms: []string{"solomerch"},
		Price: []float32{10.0, 2500000.0},
	}, 0, 10, 0)
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetProductsInfoById(t *testing.T) {
	snickers, err := testStore.GetProductsInfoByIdComplex(context.Background(), 2011)
	fmt.Println(snickers.ProductType, "fdsfds", err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}
func TestGetMerchInfoById(t *testing.T) {
	snickers, err := testStore.GetSoloMerchInfoById(context.Background(), 4679)
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetClothesInfoByIdComplex(t *testing.T) {
	snickers, err := testStore.GetClothesInfoByIdComplex(context.Background(), 2011)
	fmt.Println(snickers.ProductType, "fdsfds", err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetProductsInfoByIdComplex(t *testing.T) {
	snickers, err := testStore.GetProductsInfoByIdComplex(context.Background(), 2011)
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}
func TestGetSoloCollection(t *testing.T) {
	snickers, err := testStore.GetMerchCollection(context.Background(), GetMerchCollectionParams{
		Firm:   "nike",
		Line:   "",
		Limit:  40,
		Offset: 36,
	})
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetSoloCollectionWithCount(t *testing.T) {
	snickers, err := testStore.GetSoloCollectionWithCount(context.Background(), GetSoloCollectionWithCountParams{
		Firm:   "nike",
		Line:   "air_jordan_1",
		Limit:  20,
		Offset: 10,
	})
	fmt.Println(len(snickers), err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetMerchCollectionWithCount(t *testing.T) {
	snickers, err := testStore.GetMerchCollectionWithCount(context.Background(), GetMerchCollectionWithCountParams{
		Firm:   "solomerch",
		Line:   "labubu monster",
		Limit:  20,
		Offset: 10,
	})
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetCollectionCount(t *testing.T) {
	snickers, err := testStore.GetCountOfCollectionsOrFirms(context.Background(), GetCountOfCollectionsOrFirmsParams{
		Firm: "nike",
		Line: "air_jordan_1",
	})
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetMerchCollectionCount(t *testing.T) {
	snickers, err := testStore.GetMerchCountOfCollectionsOrFirms(context.Background(), GetMerchCountOfCollectionsOrFirmsParams{
		Firm: "solomerch",
		Line: "",
	})
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetCollections(t *testing.T) {
	// names := []string{"nike", "balanciaga"}
	// placeholders := make([]string, len(names))
	// args := make([]interface{}, len(names))

	// // Build placeholders for the IN clause
	// for i, name := range names {
	// 	placeholders[i] = fmt.Sprintf("$%d", i+1)
	// 	args[i] = name
	// }

	//fmt.Println(strings.Join(placeholders, ","))
	fmt.Println("start", testStore)
	snickers, err := testStore.GetCollections1(context.Background(), []string{"balanciaga", "nike"}, 12, 0)

	fmt.Println(snickers, err)
	//fmt.Println(data, err)
	require.NoError(t, err)
	//require.NotEmpty(t, snickers)
}

func TestGetSnickersByName(t *testing.T) {
	snickers, err := testStore.GetSnickersByName(context.Background(), GetSnickersByNameParams{
		Column1: "A",
		Limit:   1,
	})
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetProductsByName(t *testing.T) {
	snickers, err := testStore.GetProductsByName(context.Background(), GetProductsByNameParams{
		Column1: "A",
		Limit:   1,
	})
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetProductsAndFiltersByString(t *testing.T) {
	filters := types.SnickersFilterStruct{
		Firms: []string{},
		Sizes: types.SizesT{Clothes: []string{"s"}, Snickers: []string{}},
		Price: []float32{},
	}
	snickers, err := testStore.GetProductsAndFiltersByString(context.Background(), "ж", 1, 8, filters, 0)
	fmt.Println(snickers.Filters.Sizes, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestCreateDiscounts(t *testing.T) {
	filters := map[int32]types.DiscountData{
		17: types.DiscountData{
			Sizes:   []string{"6", "7", "8"},
			Percent: 10,
		},
		2660: types.DiscountData{
			Sizes:   []string{},
			Percent: 10,
		},
		2717: types.DiscountData{
			Sizes:   []string{"S", "M", "L"},
			Percent: 20,
		},
	}
	err := testStore.CreateDiscounts(context.Background(), filters)
	fmt.Println(err)
	require.NoError(t, err)
}

func TestCGetDiscounts(t *testing.T) {

	val, err := testStore.GetProductsWithDiscountComplex(context.Background())
	fmt.Println(err)
	require.NoError(t, err)
	require.NotEmpty(t, val)
}

func TestGetSnickersFiltersByType(t *testing.T) {
	snickers, err := testStore.GetFiltersFromSnickers(context.Background(), GetFiltersFromSnickersParams{
		Name: "",
	})
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}
func TestGetClothesFiltersByType(t *testing.T) {
	snickers, err := testStore.GetFiltersFromClothes(context.Background(), GetFiltersFromClothesParams{
		Name: "",
	})
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetMerchFiltersByType(t *testing.T) {
	filter, err := testStore.GetFiltersFromMerchByType(context.Background(), GetFiltersFromMerchByTypeParams{
		Name: "",
	})
	fmt.Println(filter, err)
	fmt.Println(filter.Max, "filter.FirmCountMap", filter.Min)
	require.NoError(t, err)
	require.NotEmpty(t, filter)
}

func TestGetMerchByFilters(t *testing.T) {
	merch, err := testStore.GetMerchByFilters(context.Background(), "", types.SnickersFilterStruct{}, 0, 10, 0)
	fmt.Println(merch, err)
	require.NoError(t, err)
	require.NotEmpty(t, merch)
}

func TestGetSnickersByFilters(t *testing.T) {
	merch, err := testStore.GetSnickersByFilters(context.Background(), "", types.SnickersFilterStruct{
		Price: []float32{0, 32},
	}, 0, 10, 0)
	fmt.Println(merch, err)
	require.NoError(t, err)
	require.NotEmpty(t, merch)
}

func TestGetClothesByFilters(t *testing.T) {
	merch, err := testStore.GetClothesByFilters(context.Background(), "", types.SnickersFilterStruct{
		Price: make([]float32, 0, 32000),
	}, 0, 10, 0)
	fmt.Println(merch, err)
	require.NoError(t, err)
	require.NotEmpty(t, merch)
}

func TestGetTypeIdByCategoryAndName(t *testing.T) {
	merch, err := testStore.GetTypeIDByCategoryAndName(context.Background(), GetTypeIDByCategoryAndNameParams{
		Category: "solomerch",
		TypeName: "toys",
	})
	fmt.Println(merch, err)
	require.NoError(t, err)
	require.NotEmpty(t, merch)
}

func TestGetSnickersAndFilters(t *testing.T) {
	merch, err := testStore.GetSnickersAndFilters(context.Background(), []int32{}, types.PostDataAndFiltersByCategoryAndType{
		Name:        "",
		Size:        10,
		Page:        1,
		OrderedType: 0,
	},
	)
	fmt.Println(merch.Products, err)
	require.NoError(t, err)
	require.NotEmpty(t, merch)
}

func TestGetClothesAndFilters(t *testing.T) {
	merch, err := testStore.GetClothesAndFilters(context.Background(), []int32{}, types.PostDataAndFiltersByCategoryAndType{
		Name:        "",
		Size:        10,
		Page:        1,
		OrderedType: 0,
	},
	)
	fmt.Println(merch.Products, err)
	require.NoError(t, err)
	require.NotEmpty(t, merch)
}

func TestGetMerchAndFilters(t *testing.T) {
	merch, err := testStore.GetMerchAndFilters(context.Background(), []int32{}, types.PostDataAndFiltersByCategoryAndType{
		Name:        "",
		Size:        10,
		Page:        1,
		OrderedType: 0,
	},
	)
	fmt.Println(merch.Products, err)
	require.NoError(t, err)
	require.NotEmpty(t, merch)
}
