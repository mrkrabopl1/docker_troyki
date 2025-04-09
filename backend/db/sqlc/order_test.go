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
	textValue := pgtype.Text{
		String: "10",
		Valid:  true, // Mark as valid (not NULL)
	}
	preorder, err := testStore.GetSnickersOrderData(context.Background(), []GetOrderDataByIdRow{
		GetOrderDataByIdRow{
			Size:     textValue,
			Quantity: 10,
			ID:       2,
			Prid:     35,
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

func TestUpdatePreorder(t *testing.T) {
	preorder, err := testStore.UpdatePreorder(context.Background(), 2582, "8", "1465553591858304793")
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

func TestCreatePreorder(t *testing.T) {

	preorder, err := testStore.CreatePreorder(context.Background(), 1, "11")

	fmt.Println(preorder)
	require.NoError(t, err)
	require.NotEmpty(t, preorder)
}

func TestGetCartData(t *testing.T) {

	preorder, err := testStore.GetCartData(context.Background(), "2636255529132076831")

	fmt.Println(preorder)
	require.NoError(t, err)
	require.NotEmpty(t, preorder)
}

func TestGetCartCount(t *testing.T) {

	preorder, err := testStore.GetCartCount(context.Background(), "2636255529132076831")

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
	customerid := pgtype.Int4{
		Int32: 4,
		Valid: true, // Mark as valid (not NULL)
	}
	preorder, err := testStore.InsertOrder(context.Background(), InsertOrderParams{
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

func TestCreateOrder(t *testing.T) {
	orderData := types.CreateOrderType{
		PreorderHash: "9382055249276853426",
		PersonalData: types.PersonalData{
			Name:       "name",
			SecondName: "secondName",
			Mail:       "mail",
			Phone:      "phone",
		},
		Address: types.Address{
			Town:   "town",
			Street: "street",
			Region: "region",
			Index:  "index",
			House:  "house",
			Flat:   "flat",
		},
		Delivery: types.Delivery{
			DeliveryPrice: 10000,
			Type:          1,
		},
		Save: true,
	}
	orderId, userId, hashedStr, err := testStore.CreateOrder(context.Background(), &orderData)
	require.NoError(t, err)
	fmt.Println(orderId, userId, hashedStr)
}

func TestGetOrderData(t *testing.T) {
	hashedStr, err := testStore.GetOrderData(context.Background(), "15569311506897919054")
	require.NoError(t, err)
	fmt.Println(hashedStr)
}

func TestGetOrder(t *testing.T) {
	hashedStr, err := testStore.GetOrder(context.Background(), "15569311506897919054")
	require.NoError(t, err)
	fmt.Println(hashedStr.Unregistercustomerid)
}

func TestGetCartDataFromOrderById(t *testing.T) {
	hashedStr, err := testStore.GetCartDataFromOrderById(context.Background(), 13)
	require.NoError(t, err)
	fmt.Println(hashedStr)
}
