package db

import (
	"context"
	"fmt"

	"github.com/mrkrabopl1/go_db/db/query"
	"github.com/mrkrabopl1/go_db/types"
)

func (q *Queries) GetCountIdByFiltersAndFirm(ctx context.Context, name string, filters types.SnickersFilterStruct) (int64, error) {
	queryString := query.GetCountIdByFiltersAndFirmQuery(name, filters)
	row := q.db.QueryRow(ctx, queryString)
	var count int64
	err := row.Scan(&count)
	return count, err
}

func (q *Queries) GetOrderedSnickersByFilters(ctx context.Context, name string, filters types.SnickersFilterStruct, orderType int, limit int, offset int) ([]types.SnickersSearch, error) {
	queryString := query.GetOrderedSnickersByFiltersQuery(name, filters, orderType, limit, offset)
	fmt.Println(queryString)
	rows, err := q.db.Query(ctx, queryString)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []types.SnickersSearch
	for rows.Next() {
		var i types.SnickersSearch
		if err := rows.Scan(
			&i.Id,
			&i.Name,
			&i.Image_path,
			&i.Firm,
			&i.Price,
			&i.Discount,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}
