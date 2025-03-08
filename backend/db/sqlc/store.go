package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mrkrabopl1/go_db/types"
)

// Store defines all functions to execute db queries and transactions
type Store interface {
	Querier
	GetCountIdByFiltersAndFirm(ctx context.Context, name string, filters types.SnickersFilterStruct) (int64, error)
	GetOrderedSnickersByFilters(ctx context.Context, name string, filters types.SnickersFilterStruct, orderType int, limit int, offset int) ([]types.SnickersSearch, error)
	GetSnickersOrderData(ctx context.Context, snickersPreorder []GetOrderDataByIdRow) ([]types.SnickersCart, error)
	//InsertIntoOrderItems(ctx context.Context, products []types.ProductsInsert, orderID int) error
	SetSnickersHistory(ctx context.Context, idSnickers int32, idCustomer int32) error
	CreatePreorder(ctx context.Context, id int32, size string) (string, error)
	GetSnickersByNameComplex(ctx context.Context, name string, limit int32) ([]types.SnickersSearchResponse, error)
	UpdatePreorder(ctx context.Context, id int32, size string, hash string) (int32, error)
	GetSoloCollectionComplex(ctx context.Context, arg GetSoloCollectionParams) ([]types.SnickersSearchResponse1, error)
	GetCartCount(ctx context.Context, hash string) (int32, error)
	SelectHistoryFromUniqueCustomer(ctx context.Context, id int32) ([]int32, error)
	InsertVerification(ctx context.Context, arg InsertVerificationParams) error
	RegisterUser(ctx context.Context, pass string, mail string) (int32, error)
	CreateOrder(ctx context.Context, orderData *types.CreateOrderType) (int32, int32, string, error)
	GetCartData(ctx context.Context, hash string) ([]types.SnickersCart, error)
	GetSnickersInfoByIdComplex(ctx context.Context, id int32) (SnickersInfoResponse, error)
	VerifyUser(ctx context.Context, token string) (int32, error)
	GetCartDataFromOrderByHash(ctx context.Context, hash string) ([]types.SnickersCart, error)
	GetCartDataFromOrderById(ctx context.Context, id int32) ([]types.SnickersCart, error)
	SetUnregisterCustomer(ctx context.Context, arg SetUnregisterCustomerParams) (int32, error)
	UpdateCustomerPass(ctx context.Context, arg UpdateCustomerPassParams) error
	CreateCustomer(ctx context.Context, arg CreateCustomerParams) (int32, error)
	GetOrderData(ctx context.Context, hash string) (GetOrderData, error)
	ChangePass(ctx context.Context, newPass string, oldPass string, id int32) error
	GetOrderDataByMail(ctx context.Context, mail string, id int32) (OrderDataResp, string, error)
	UpdateForgetPass(ctx context.Context, mail string) error
	GetSnickersWithDiscountComplex(ctx context.Context) ([]types.SnickersSearchResponse1, error)
	GetSnickersHistoryComplex(ctx context.Context, idCustomer int32) ([]types.SnickersSearchResponse1, error)
	GetCollections1(ctx context.Context, names []string, limit int, offset int) (map[string][]types.SnickersSearchResponse1, error)
	GetSnickersAndFiltersByString(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (RespSearchSnickersAndFiltersByString, error)
	GetSnickersByString(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (RespSearchSnickersByString, error)
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
