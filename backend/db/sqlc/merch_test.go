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
		Sizes: []string{},
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
	snickers, err := testStore.GetProductsInfoById(context.Background(), 1)
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}
func TestGetMerchInfoById(t *testing.T) {
	snickers, err := testStore.GetSoloMerchInfoById(context.Background(), 1)
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}
func TestGetProductsInfoByIdComplex(t *testing.T) {
	snickers, err := testStore.GetProductsInfoByIdComplex(context.Background(), 1)
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}
func TestGetSoloCollection(t *testing.T) {
	snickers, err := testStore.GetMerchCollection(context.Background(), GetMerchCollectionParams{
		Firm:   "solomerch",
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

func TestGetMerchByName(t *testing.T) {
	snickers, err := testStore.GetMerchByName(context.Background(), GetMerchByNameParams{
		Column1: "A",
		Limit:   1,
	})
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetSnickersAndFiltersByString(t *testing.T) {
	filters := types.SnickersFilterStruct{
		Firms: []string{},
		Sizes: []string{},
		Price: []float32{},
	}
	snickers, err := testStore.GetSnickersAndFiltersByString(context.Background(), "bal", 1, 8, filters, 0)
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}
