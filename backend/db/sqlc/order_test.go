package db

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

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
	textValue := pgtype.Text{
		String: "10",
		Valid:  true, // Mark as valid (not NULL)
	}
	preorder, err := testStore.GetSnickersOrderData(context.Background(), []GetOrderDataByIdRow{
		GetOrderDataByIdRow{
			Size: textValue,
			Quantity: pgtype.Int4{
				Int32: 10,
			},
			ID: 2,
			Prid: pgtype.Int4{
				Int32: 35,
			},
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

	preorder, err := testStore.InsertPreorder(context.Background(), InsertPreorderParams{
		Hashurl: "fdslkfjdslfmlsdnfsd",
		Updatetime: pgtype.Date{
			Time: time.Now(),
		},
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
	preorder, err := testStore.SelectQuantityFromPreorderItems(context.Background(), SelectQuantityFromPreorderItemsParams{
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
	err := testStore.DeleteCartData(context.Background(), 30)
	require.NoError(t, err)
}
func TestGetOrder(t *testing.T) {
	orderRow, err := testStore.GetOrder(context.Background(), "fsldkfnsdlflskdmf;sdl")
	require.NoError(t, err)
	require.NotEmpty(t, orderRow)
}
