// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.26.0

package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type Querier interface {
	CheckCustomerExistence(ctx context.Context, arg CheckCustomerExistenceParams) (bool, error)
	CheckMail(ctx context.Context, mail string) (bool, error)
	CreateCustomer(ctx context.Context, arg CreateCustomerParams) (int32, error)
	CreateUniqueCustomer(ctx context.Context, creationtime pgtype.Date) (int32, error)
	DeleteCartData(ctx context.Context, id int32) error
	DeleteFromVerifivation(ctx context.Context, id int32) error
	DeleteVerification(ctx context.Context, id int32) error
	GetBaseCustomerData(ctx context.Context, mail string) (GetBaseCustomerDataRow, error)
	GetCointIdByName(ctx context.Context, dollar_1 string) ([]GetCointIdByNameRow, error)
	GetCountOfCollectionsOrFirms(ctx context.Context, arg GetCountOfCollectionsOrFirmsParams) (int64, error)
	GetCustomerData(ctx context.Context, id int32) (GetCustomerDataRow, error)
	GetCustomerId(ctx context.Context, mail string) (int32, error)
	GetFiltersByString(ctx context.Context, dollar_1 string) (GetFiltersByStringRow, error)
	GetFirms(ctx context.Context) ([]GetFirmsRow, error)
	GetFullPreorderCount(ctx context.Context, orderid int32) (interface{}, error)
	GetOrder(ctx context.Context, hash string) (GetOrderRow, error)
	GetOrderById(ctx context.Context, id int32) (GetOrderByIdRow, error)
	GetOrderDataById(ctx context.Context, orderid int32) ([]GetOrderDataByIdRow, error)
	GetOrderIdByHashUrl(ctx context.Context, hash string) (int32, error)
	GetPassword(ctx context.Context, id int32) ([]byte, error)
	GetPreorderDataById(ctx context.Context, orderid int32) ([]GetPreorderDataByIdRow, error)
	GetPreorderIdByHashUrl(ctx context.Context, hashurl string) (int32, error)
	GetSnickersByFirmName(ctx context.Context, firm string) ([]GetSnickersByFirmNameRow, error)
	GetSnickersByIds(ctx context.Context, dollar_1 []interface{}) ([]GetSnickersByIdsRow, error)
	GetSnickersByLineName(ctx context.Context, line string) ([]GetSnickersByLineNameRow, error)
	GetSnickersByName(ctx context.Context, arg GetSnickersByNameParams) ([]GetSnickersByNameRow, error)
	GetSnickersInfoById(ctx context.Context, id int32) (GetSnickersInfoByIdRow, error)
	GetSnickersWithDiscount(ctx context.Context) ([]GetSnickersWithDiscountRow, error)
	GetSoloCollection(ctx context.Context, arg GetSoloCollectionParams) ([]GetSoloCollectionRow, error)
	GetSoloCollectionWithCount(ctx context.Context, arg GetSoloCollectionWithCountParams) ([]GetSoloCollectionWithCountRow, error)
	GetUnregisterCustomer(ctx context.Context, id int32) (GetUnregisterCustomerRow, error)
	GetVerification(ctx context.Context, token string) (GetVerificationRow, error)
	InsertOrder(ctx context.Context, arg InsertOrderParams) (int32, error)
	InsertOrderItems(ctx context.Context, arg InsertOrderItemsParams) error
	InsertPreorder(ctx context.Context, arg InsertPreorderParams) (int32, error)
	InsertPreorderItems(ctx context.Context, arg InsertPreorderItemsParams) (int32, error)
	InsertVerification(ctx context.Context, arg InsertVerificationParams) error
	SelectHistoryFromUniqueCustomer(ctx context.Context, id int32) ([]int32, error)
	SelectQuantityFromPreorderItems(ctx context.Context, arg SelectQuantityFromPreorderItemsParams) (int32, error)
	SetUnregisterCustomer(ctx context.Context, arg SetUnregisterCustomerParams) (int32, error)
	UpdateCustomerPass(ctx context.Context, arg UpdateCustomerPassParams) error
	UpdatePreorderItems(ctx context.Context, arg UpdatePreorderItemsParams) error
	UpdateUniqueCustomerHistry(ctx context.Context, arg UpdateUniqueCustomerHistryParams) error
}

var _ Querier = (*Queries)(nil)
