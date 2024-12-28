package db

import (
	"context"
	"math"

	"github.com/mrkrabopl1/go_db/types"
)

type SnickersPageAndFilters struct {
	SnickersPageInfo []types.SnickersSearch
	PageSize         int
	Filter           []GetFiltersByStringRow
}

func (store *SQLStore) GetSnickersAndFiltersByString(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (SnickersPageAndFilters, error) {
	var result SnickersPageAndFilters
	count, err := store.GetCountIdByFiltersAndFirm(ctx, name, filters)
	if err != nil {
		return result, err
	}
	var pageSize = math.Ceil(float64(count) / float64(size))

	var offset = (page - 1) * size

	var limit = size * page
	data, err1 := store.GetOrderedSnickersByFilters(ctx, name, filters, orderedType, limit, offset)
	if err1 != nil {
		return result, err
	}
	filter, err2 := store.GetFiltersByString(ctx, name)

	if err2 != nil {
		return result, err2
	}

	result = SnickersPageAndFilters{
		SnickersPageInfo: data,
		PageSize:         int(pageSize),
		Filter:           filter,
	}
	return result, nil
}
func (store *SQLStore) GetCartData(ctx context.Context, hash string) ([]types.SnickersCart, error) {
	var dataQuery []types.SnickersCart
	prId, err := store.GetPreorderIdByHashUrl(ctx, hash)
	if err != nil {
		return dataQuery, err
	} else {
		prData, err := store.GetPreorderDataById(ctx, prId)
		if err != nil {
			return dataQuery, err
		} else {
			data, err := store.GetSnickersOrderData(ctx, prData)
			if err != nil {
				return dataQuery, err
			}
			return data, nil
		}

	}
	return dataQuery, nil
}
