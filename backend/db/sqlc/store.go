package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mrkrabopl1/go_db/types"
)

// Store defines all functions to execute db queries and transactions
type Store interface {
	Querier

	//InsertIntoOrderItems(ctx context.Context, products []types.ProductsInsert, orderID int) error
	SetSnickersHistory(ctx context.Context, idSnickers int32, idCustomer int32) error
	CreatePreorder(ctx context.Context, id int32, size string, price int32, name string, image_path string) (string, error)
	GetProductsByNameComplex(ctx context.Context, name string, limit int32) ([]types.ProductsSearchResponse, error)
	UpdatePreorder(ctx context.Context, id int32, size string, price int32, name string, image_path string, hash string) (int32, error)
	GetSoloCollectionComplex(ctx context.Context, arg GetSoloCollectionParams) ([]types.ProductsSearchResponse1, error)
	GetMerchCollectionComplex(ctx context.Context, arg GetMerchCollectionParams) ([]types.MerchSearchResponse, error)
	GetCartCount(ctx context.Context, hash string) (int32, error)
	SelectHistoryFromUniqueCustomer(ctx context.Context, id int32) ([]int32, error)
	InsertVerification(ctx context.Context, arg InsertVerificationParams) error
	RegisterUser(ctx context.Context, pass string, mail string) (int32, error)
	CreateOrder(ctx context.Context, orderData *CreateOrderType) (int32, int32, string, error)
	GetCartData(ctx context.Context, hash string) ([]GetPreorderDataByIdRow, error)
	GetProductsInfoByIdComplex(ctx context.Context, id int32) (ProductsInfoResponse, error)
	GetMainPageInfoComplex(ctx context.Context, limit int32) (map[int32]CategoryData, error)
	VerifyUser(ctx context.Context, token string) (int32, error)
	GetCartDataFromOrderByHash(ctx context.Context, hash string) ([]GetOrderDataByIdRow, error)
	SetUnregisterCustomer(ctx context.Context, arg SetUnregisterCustomerParams) (int32, error)
	UpdateCustomerPass(ctx context.Context, arg UpdateCustomerPassParams) error
	CreateCustomer(ctx context.Context, arg CreateCustomerParams) (int32, error)
	GetOrderData(ctx context.Context, hash string) (GetOrderData, error)
	ChangePass(ctx context.Context, newPass string, oldPass string, id int32) error
	GetOrderDataByMail(ctx context.Context, mail string, id int32) (OrderDataResp, string, error)
	UpdateForgetPass(ctx context.Context, mail string) error
	GetProductsWithDiscountComplex(ctx context.Context) ([]types.ProductsSearchResponse1, error)
	GetSnickersHistoryComplex(ctx context.Context, idCustomer int32) ([]types.ProductsSearchResponse1, error)
	GetProductsAndFiltersByNameCategoryAndType(ctx context.Context, filterParams GetFiltersByNameCategoryAndTypeParams, page int, size int, filters types.ProductsFilterStruct, orderedType int) (RespSearchProductsAndFiltersByString, error)
	GetProductsByString(ctx context.Context, name string, page int, size int, filters types.ProductsFilterStruct, orderedType int) (RespSearchProductsByString, error)
	CreateDiscounts(ctx context.Context, discountData map[int32]types.DiscountData) error
	GetProductsByFiltersComplex(ctx context.Context, name string, page int, size int, filters types.ProductsFilterStruct, orderedType int32) (RespProductsByStringStruct, error)
}

// SQLStore provides all functions to execute SQL queries and transactions
type SQLStore struct {
	connPool *pgxpool.Pool
	*Queries
}

// NewStore creates a new store
func NewStore(connPool *pgxpool.Pool) Store {
	return &SQLStore{
		connPool: connPool,
		Queries:  New(connPool),
	}
}
