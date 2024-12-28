package db

import (
	"context"
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
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetCountIdByFiltersAndFirm(t *testing.T) {
	snickers, err := testStore.GetCountIdByFiltersAndFirm(context.Background(), "Air", types.SnickersFilterStruct{
		Sizes: []string{"5"},
		Firms: []string{"nike"},
		Price: []float32{10000.0, 25000.0},
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

func TestGetCollections(t *testing.T) {
	snickers, err := testStore.GetCollections(context.Background(), GetCollectionsParams{
		Column1: []string{"nike", "balanciaga"},
		Line:    "air_jordan_1",
		Limit:   10,
		Offset:  0,
	})
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
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
