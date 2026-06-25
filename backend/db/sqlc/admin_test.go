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
	brand := testImagePathBuilder.GetBrandImageURL("")
	fmt.Println(brand)
	require.NotEmpty(t, brand)
}

func TestCountProductImages(t *testing.T) {
	count := testImagePathBuilder.CountExistingProductImages("newFirms/361/clothes/other/551949354_4_c0e728")
	fmt.Println(count)
	require.NotEmpty(t, count)
}
func TestGetBanners(t *testing.T) {
	banners, err := testStore.GetAdminBanners(context.Background())
	fmt.Println(banners)
	require.NoError(t, err)
}
func TestListAdmins(t *testing.T) {
	banners, err := testStore.ListAdmins(context.Background(), ListAdminsParams{
		Offset: int32(0),
		Limit:  int32(20),
	})
	fmt.Println(banners)
	require.NoError(t, err)
}
func TestGetOrdersWithFilters(t *testing.T) {
	brand, err := testStore.GetOrdersWithFilters(context.Background(), GetOrdersWithFiltersParams{})
	fmt.Println(brand)
	require.NotEmpty(t, brand)
	fmt.Println(err)
	require.NoError(t, err)
}
