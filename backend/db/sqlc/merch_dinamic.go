package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/mrkrabopl1/go_db/db/query"
	"github.com/mrkrabopl1/go_db/types"
)

func (q *Queries) GetCountIdByFiltersAndFirm(ctx context.Context, name string, filters types.SnickersFilterStruct) (int64, error) {
	queryString := query.GetCountIdByFiltersAndFirmQuery(name, filters)
	fmt.Println(queryString, "djsakdalksf")
	row := q.db.QueryRow(ctx, queryString)
	var count int64
	err := row.Scan(&count)
	return count, err
}

func (q *Queries) GetOrderedProductsByFilters(ctx context.Context, name string, filters types.SnickersFilterStruct, orderType int, limit int, offset int) ([]types.SnickersSearch, error) {
	queryString := query.GetOrderedProductsByFiltersQuery(name, filters, orderType, limit, offset)
	fmt.Println(queryString, ";cdmcdslmds;fs")
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
			&i.Image_path,
			&i.Name,
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

type GetCollectionsRow struct {
	Minprice     int32       `db:"minprice"`
	ID           int32       `db:"id"`
	ImagePath    string      `db:"image_path"`
	Name         string      `db:"name"`
	Firm         string      `db:"firm"`
	Maxdiscprice pgtype.Int4 `db:"maxdiscprice"`
	Line         string      `db:"line"`
}

func (q *Queries) GetCollections1(ctx context.Context, names []string, limit int, offset int) (map[string][]types.SnickersSearchResponse1, error) {
	fmt.Println("lfdma;fmsdlfds;lm,f")
	queryString := query.GetCollections(names, limit, offset)
	fmt.Println(queryString)
	rows, err := q.db.Query(ctx, queryString)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetCollectionsRow
	for rows.Next() {
		var i GetCollectionsRow
		if err := rows.Scan(
			&i.Minprice,
			&i.ID,
			&i.ImagePath,
			&i.Name,
			&i.Firm,
			&i.Maxdiscprice,
			&i.Line,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return NewSnickersSearchResponse2(items), nil
}
func NewSnickersSearchResponse2(snickersSearch []GetCollectionsRow) map[string][]types.SnickersSearchResponse1 {

	var data = map[string][]types.SnickersSearchResponse1{}
	for _, info := range snickersSearch {
		var imgArr []string
		for i := 1; i < 3; i++ {
			str := "images/" + fmt.Sprintf(info.ImagePath+"/img%d.png", i)
			imgArr = append(imgArr, str)
		}
		var discount interface{}
		if info.Maxdiscprice.Int32 != 0 {
			discount = info.Maxdiscprice.Int32
		} else {
			discount = nil
		}
		if value, exists := data[info.Line]; exists {
			data[info.Line] = append(value, types.SnickersSearchResponse1{
				Image:    imgArr,
				Price:    int(info.Minprice),
				Id:       int(info.ID),
				Name:     info.Name,
				Firm:     info.Firm,
				Discount: discount,
			})
		} else {
			data[info.Line] = []types.SnickersSearchResponse1{{
				Image:    imgArr,
				Price:    int(info.Minprice),
				Id:       int(info.ID),
				Name:     info.Name,
				Firm:     info.Firm,
				Discount: discount,
			}}
		}

	}

	return data
}
