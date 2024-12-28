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
	GetSnickersOrderData(ctx context.Context, snickersPreorder []types.SnickersPreorder) ([]types.SnickersCart, error)
	InsertIntoOrderItems(ctx context.Context, products []types.ProductsInsert, orderID int) error
	SetSnickersHistory(ctx context.Context, idSnickers int32, idCustomer int32) error
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
