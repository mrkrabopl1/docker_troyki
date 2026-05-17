package db

import (
	"context"
	"fmt"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestGetStats(t *testing.T) {
	stats, err := testStore.GetAdminDashboardStats(context.Background())
	fmt.Println(stats)
	require.NoError(t, err)
	require.NotEmpty(t, stats)
}
func TestGetProductsAndFilters(t *testing.T) {
	products, err := testStore.GetAllProductsAndFilters(context.Background(), 1, 10, 1)
	fmt.Println(products)
	require.NoError(t, err)
	require.NotEmpty(t, products)
}
func TestGetBrandById(t *testing.T) {
	brand, err := testStore.GetBrandByID(context.Background(), 1132)
	fmt.Println(brand)
	require.NoError(t, err)
	require.NotEmpty(t, brand)
}
func TestGetBrandImagePath(t *testing.T) {
	brand := testImagePathBuilder.GetBrandImagePath("")
	fmt.Println(brand)
	require.NotEmpty(t, brand)
}

func TestGetBanners(t *testing.T) {
	banners, err := testStore.GetAdminBanners(context.Background())
	fmt.Println(banners)
	require.NoError(t, err)
}
