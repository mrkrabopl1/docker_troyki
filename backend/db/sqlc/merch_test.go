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

func TestGetSnickersByFirmName(t *testing.T) {
	snickers, err := testStore.GetSnickersByFirmName(context.Background(), "nike")
	fmt.Println(snickers)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetFiltersByString(t *testing.T) {
	snickers, err := testStore.GetFiltersByString(context.Background(), "Air")
	fmt.Println(snickers)
	var result map[string]interface{}
	json.Unmarshal(snickers.FirmCountMap, &result)
	fmt.Println(result)
	require.NoError(t, err)
}

func TestGetCountIdByFiltersAndFirm(t *testing.T) {
	snickers, err := testStore.GetCountIdByFiltersAndFirm(context.Background(), "Air", types.SnickersFilterStruct{
		Sizes: []string{},
		Firms: []string{},
		Price: []float32{},
	})
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetOrderedSnickersIByFilters(t *testing.T) {
	snickers, err := testStore.GetOrderedSnickersByFilters(context.Background(), "Air", types.SnickersFilterStruct{
		Sizes: []string{"5"},
		Firms: []string{"nike"},
		Price: []float32{10000.0, 25000.0},
	}, 0, 10, 0)
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetSnickersInfoById(t *testing.T) {
	snickers, err := testStore.GetSnickersInfoById(context.Background(), 1)
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetSnickersInfoByIdComplex(t *testing.T) {
	snickers, err := testStore.GetSnickersInfoByIdComplex(context.Background(), 1)
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}
func TestGetSoloCollection(t *testing.T) {
	snickers, err := testStore.GetSoloCollection(context.Background(), GetSoloCollectionParams{
		Firm:   "nike",
		Line:   "air_jordan_1",
		Limit:  10,
		Offset: 0,
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

func TestGetCollectionCount(t *testing.T) {
	snickers, err := testStore.GetCountOfCollectionsOrFirms(context.Background(), GetCountOfCollectionsOrFirmsParams{
		Firm: "nike",
		Line: "air_jordan_1",
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
