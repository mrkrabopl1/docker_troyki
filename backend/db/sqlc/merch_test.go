package db

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
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
func TestGetCategoriesWithTypes(t *testing.T) {
	snickers, err := testStore.GetCategoriesWithTypes(context.Background())
	fmt.Println(snickers[0].TypeName)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetFiltersByNameCategoryAndType(t *testing.T) {
	params := GetFiltersByNameCategoryAndTypeParams{
		Name:     pgtype.Text{String: "", Valid: false},
		Category: pgtype.Int4{Int32: 2, Valid: true},
		//Type:     pgtype.Int4{Int32: 1, Valid: true},
	}
	snickers, err := testStore.GetFiltersByNameCategoryAndType(context.Background(), params)
	fmt.Println(snickers)
	var result map[string]interface{}
	fmt.Println(result, "test")
	require.NoError(t, err)
}

func TestGetProductsByNameCategoryAndType(t *testing.T) {
	snickers, err := testStore.GetProductsByNameCategoryAndType(context.Background(), GetProductsByNameCategoryAndTypeParams{
		Name:     pgtype.Text{String: "", Valid: false},
		Category: pgtype.Int4{Int32: 1, Valid: true},
		Type:     pgtype.Int4{Int32: 1, Valid: true},
	})
	fmt.Println(len(snickers))
	var result map[string]interface{}
	fmt.Println(result, err)
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

// func TestGetCountIdByFiltersAndFirm(t *testing.T) {
// 	snickers, err := testStore.GetCountIdByFiltersAndFirm(context.Background(), "Labubu", types.ProductsFilterStruct{
// 		Sizes: []string{},
// 		Firms: []string{},
// 		Price: []float32{},
// 	})
// 	fmt.Println(snickers, "fldkfjlskdjflsd")
// 	require.NoError(t, err)
// 	require.NotEmpty(t, snickers)
// }

//	func TestGetOrderedSnickersIByFilters(t *testing.T) {
//		snickers, err := testStore.GetProductsByFiltersComplex(context.Background(), "POP MART", []string{"solomerch"}, 0, 10, 0)
//		fmt.Println(snickers, err)
//		require.NoError(t, err)
//		require.NotEmpty(t, snickers)
//	}
func TestGetProductsByFilters(t *testing.T) {
	params := GetProductsByFiltersParams{
		Limitval:     int32(10000),
		Offsetval:    int32(8),
		Sizes:        []string{},
		Firms:        []string{},
		Bodytypes:    []string{},
		Categories:   []int32{1},
		ProductTypes: []int32{},
		SortType:     1,
		Name:         "",
		//WithPrice:    true,
	}
	fmt.Println(params, "test1")
	snickers, err := testStore.GetProductsByFilters(context.Background(), params)
	fmt.Println(len(snickers), err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}
func TestGetProductsByFiltersNew(t *testing.T) {
	params := GetProductsByFiltersNewTestParams{}
	snickers, err := testStore.GetProductsByFiltersNewTest(context.Background(), params)
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetMainPageInfo(t *testing.T) {
	snickers, err := testStore.GetMainPageInfo(context.Background(), 2)
	fmt.Println(snickers[0].ImagePath, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers[0])
}
func TestGetProductsInfoById(t *testing.T) {
	snickers, err := testStore.GetProductsInfoByIdComplex(context.Background(), 3)
	fmt.Println(snickers.Article, "fdsfds", err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestCreateDiscounts(t *testing.T) {
	// Подготавливаем тестовые данные
	discountData := map[int32]types.DiscountData{
		1: {Percent: 20}, // 20% скидка на товар ID 1
		2: {Percent: 15}, // 15% скидка на товар ID 2
	}
	err := testStore.CreateDiscounts(context.Background(), discountData)
	require.NoError(t, err)
}

func TestGetProductsInfoByIdComplex(t *testing.T) {
	snickers, err := testStore.GetProductsInfoByIdComplex(context.Background(), 1)
	fmt.Println(snickers.Store, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}
func TestGetSoloCollection(t *testing.T) {
	snickers, err := testStore.GetMerchCollection(context.Background(), GetMerchCollectionParams{
		Firm:   "nike",
		Line:   pgtype.Text{String: ""},
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
		Line:   pgtype.Text{String: "air_jordan_1"},
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
		Line:   pgtype.Text{String: "air_jordan_1"},
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
		Line: pgtype.Text{String: "air_jordan_1"},
	})
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetMerchCollectionCount(t *testing.T) {
	snickers, err := testStore.GetMerchCountOfCollectionsOrFirms(context.Background(), GetMerchCountOfCollectionsOrFirmsParams{
		Firm: "solomerch",
		Line: pgtype.Text{String: ""},
	})
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

// func TestGetCollections(t *testing.T) {
// 	// names := []string{"nike", "balanciaga"}
// 	// placeholders := make([]string, len(names))
// 	// args := make([]interface{}, len(names))

// 	// // Build placeholders for the IN clause
// 	// for i, name := range names {
// 	// 	placeholders[i] = fmt.Sprintf("$%d", i+1)
// 	// 	args[i] = name
// 	// }

// 	//fmt.Println(strings.Join(placeholders, ","))
// 	fmt.Println("start", testStore)
// 	snickers, err := testStore.GetCollections1(context.Background(), []string{"balanciaga", "nike"}, 12, 0)

// 	fmt.Println(snickers, err)
// 	//fmt.Println(data, err)
// 	require.NoError(t, err)
// 	//require.NotEmpty(t, snickers)
// }

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
	filters := types.ProductsFilterStruct{}
	params := GetFiltersByNameCategoryAndTypeParams{
		Name:     pgtype.Text{String: "a", Valid: true},
		Category: pgtype.Int4{Int32: 0, Valid: 0 != 0},
		Type:     pgtype.Int4{Int32: 0, Valid: 0 != 0},
	}
	snickers, err := testStore.GetProductsAndFiltersByNameCategoryAndType(context.Background(), params, 1, 8, filters, 0)
	fmt.Println(snickers.Filters, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestCGetDiscounts(t *testing.T) {

	val, err := testStore.GetProductsWithDiscountComplex(context.Background())
	fmt.Println(err)
	require.NoError(t, err)
	require.NotEmpty(t, val)
}

// func TestGetTypeIdByCategoryAndName(t *testing.T) {
// 	merch, err := testStore.GetTypeIDByCategoryAndName(context.Background(), GetTypeIDByCategoryAndNameParams{
// 		Category: "solomerch",
// 		TypeName: "toys",
// 	})
// 	fmt.Println(merch, err)
// 	require.NoError(t, err)
// 	require.NotEmpty(t, merch)
// }
