package db

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/mrkrabopl1/go_db/types"

	"github.com/stretchr/testify/require"
)

func TestGetPreorderDataById(t *testing.T) {
	preorder, err := testStore.GetPreorderDataById(context.Background(), 3)
	fmt.Println(preorder, err)
	require.NoError(t, err)
	require.NotEmpty(t, preorder)
}
func TestGetPreorderIdByHashUrl(t *testing.T) {
	preorder, err := testStore.GetPreorderIdByHashUrl(context.Background(), "4813640782846292612")
	fmt.Println(preorder, err)
	require.NoError(t, err)
	require.NotEmpty(t, preorder)
}
func TestGetSnickersOrderData(t *testing.T) {
	preorder, err := testStore.GetSnickersOrderData(context.Background(), []types.SnickersPreorder{
		types.SnickersPreorder{
			Size:     "10",
			Quantity: 10,
			Id:       2,
			PrId:     35,
		},
	})
	fmt.Println(preorder, err)
	require.NoError(t, err)
	require.NotEmpty(t, preorder)
}
func TestGetOrderIdByHashUrl(t *testing.T) {
	preorder, err := testStore.GetOrderIdByHashUrl(context.Background(), "4813640782846292612")
	fmt.Println(preorder, err)
	require.NoError(t, err)
	require.NotEmpty(t, preorder)
}
func TestInsertPreorder(t *testing.T) {
	textValue := pgtype.Text{
		String: "10",
		Valid:  true, // Mark as valid (not NULL)
	}
	preorder, err := testStore.InsertPreorder(context.Background(), InsertPreorderParams{
		Orderid:   42,
		Productid: 1,
		Size:      textValue,
	})
	fmt.Println(preorder)
	require.NoError(t, err)
	require.NotEmpty(t, preorder)
}

func TestGetQuantityFromPreorderItems(t *testing.T) {
	textValue := pgtype.Text{
		String: "10",
		Valid:  true, // Mark as valid (not NULL)
	}
	preorder, err := testStore.GetQuantityFromPreorderItems(context.Background(), GetQuantityFromPreorderItemsParams{
		Orderid:   42,
		Productid: 1,
		Size:      textValue,
	})
	fmt.Println(preorder)
	require.NoError(t, err)
	require.NotEmpty(t, preorder)
}
func TestGetFullPreorderCount(t *testing.T) {
	preorder, err := testStore.GetFullPreorderCount(context.Background(), 42)
	fmt.Println(preorder)
	require.NoError(t, err)
	require.NotEmpty(t, preorder)
}

func TestInsertOrder(t *testing.T) {
	orderDate := pgtype.Date{
		Time:  time.Now(),
		Valid: true, // Mark as valid (not NULL)
	}
	customerid := pgtype.Int4{
		Int32: 4,
		Valid: true, // Mark as valid (not NULL)
	}
	preorder, err := testStore.InsertOrder(context.Background(), InsertOrderParams{
		Orderdate:            orderDate,
		Status:               StatusEnumPending,
		Deliveryprice:        10000,
		Deliverytype:         DeliveryEnumOwn,
		Unregistercustomerid: customerid,
		Hash:                 "fsdofpsdfmpsdomfpsd",
	})
	fmt.Println(preorder)
	require.NoError(t, err)
	require.NotEmpty(t, preorder)
}
func TestDeleteFromPreorderItems(t *testing.T) {
	err := testStore.DeleteFromPreorderItems(context.Background(), 30)
	require.NoError(t, err)
}
func TestGetOrder(t *testing.T) {
	orderRow, err := testStore.GetOrder(context.Background(), 30)
	require.NoError(t, err)
	require.NotEmpty(t, orderRow)
}
