package db

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/require"
)

func TestDeleteVerification(t *testing.T) {
	err := testStore.DeleteVerification(context.Background(), 30)
	require.NoError(t, err)
}
func TestInsertVerification(t *testing.T) {
	expireDate := pgtype.Timestamp{
		Time:  time.Now(),
		Valid: true, // Mark as valid (not NULL)
	}
	deleteDate := pgtype.Timestamp{
		Time:  time.Now(),
		Valid: true, // Mark as valid (not NULL)
	}
	data := InsertVerificationParams{
		Token:      "ssssssssss",
		Expire:     expireDate,
		Customerid: 30,
		Deletetime: deleteDate,
	}
	err := testStore.InsertVerification(context.Background(), data)
	require.NoError(t, err)
}
func TestCheckMail(t *testing.T) {
	data, err := testStore.CheckMail(context.Background(), "fjdsnfdspfds")
	fmt.Println(data)
	require.NoError(t, err)
	require.NotEmpty(t, data)
}

func TestGetCustomerData(t *testing.T) {
	data, err := testStore.GetCustomerData(context.Background(), 30)
	fmt.Println(data)
	require.NoError(t, err)
	require.NotEmpty(t, data)
}
func TestGetVerification(t *testing.T) {
	data, err := testStore.GetVerification(context.Background(), "dnlsjdljasn")
	fmt.Println(data)
	require.NoError(t, err)
	require.NotEmpty(t, data)
}
func TestDeleteFromVerifivation(t *testing.T) {
	err := testStore.DeleteFromVerifivation(context.Background(), 30)
	require.NoError(t, err)
}
func TestGetBaseCustomerData(t *testing.T) {
	data, err := testStore.GetBaseCustomerData(context.Background(), "mr.krabopl12@gmail.com")
	fmt.Println(data)
	require.NoError(t, err)
	require.NotEmpty(t, data)
}
func TestSetUnregisterCustomer(t *testing.T) {
	secondname := pgtype.Text{
		String: "fhsdlf",
		Valid:  true, // Mark as valid (not NULL)
	}
	house := pgtype.Text{
		String: "house",
		Valid:  true, // Mark as valid (not NULL)
	}
	flat := pgtype.Text{
		String: "flat",
		Valid:  true, // Mark as valid (not NULL)
	}
	params := SetUnregisterCustomerParams{
		Name:       "fdsf",
		Secondname: secondname,
		Mail:       "mr.krabopl12@gmail.com",
		Phone:      "89653181498",
		Town:       "test",
		Street:     "test",
		Region:     "yyi",
		Index:      "gkjkjhkjhk",
		House:      house,
		Flat:       flat,
	}
	data, err := testStore.SetUnregisterCustomer(context.Background(), params)
	fmt.Println(data)
	require.NoError(t, err)
	require.NotEmpty(t, data)
}
func TestGetPassword(t *testing.T) {
	data, err := testStore.GetPassword(context.Background(), 30)
	fmt.Println(data)
	require.NoError(t, err)
	require.NotEmpty(t, data)
}
func TestUpdateCustomerPass(t *testing.T) {
	pass, _ := json.Marshal("dmsa;ldas")
	params := UpdateCustomerPassParams{
		Pass: pass,
		ID:   30,
	}
	err := testStore.UpdateCustomerPass(context.Background(), params)
	require.NoError(t, err)
}

func TestGetCustomerId(t *testing.T) {
	data, err := testStore.GetCustomerId(context.Background(), "mr.krabopl12@gmail.com")
	fmt.Println(data)
	require.NoError(t, err)
	require.NotEmpty(t, data)
}
func GetUnregisterCustomer(t *testing.T) {
	data, err := testStore.GetUnregisterCustomer(context.Background(), 30)
	fmt.Println(data)
	require.NoError(t, err)
	require.NotEmpty(t, data)
}
func TestCheckCustomerExistence(t *testing.T) {
	params := CheckCustomerExistenceParams{
		ID:   30,
		Mail: "mr.krabopl12@gmail.com",
	}
	data, err := testStore.CheckCustomerExistence(context.Background(), params)
	fmt.Println(data)
	require.NoError(t, err)
	require.NotEmpty(t, data)
}
