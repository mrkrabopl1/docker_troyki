package db

import (
	"context"
	"fmt"

	"github.com/mrkrabopl1/go_db/db/query"
	"github.com/mrkrabopl1/go_db/types"
)

func GetSnickersOrderDataQuery(snickersPreorder []GetPreorderDataByIdRow) string {
	var conditionStr string
	for _, sn := range snickersPreorder {
		if conditionStr == "" {
			conditionStr += fmt.Sprintf(`SELECT id, %d AS prid, name ,firm, image_path,'%s' AS size, "%s" AS price, %d AS quantity FROM snickers WHERE id = %d `, sn.ID, sn.Size, sn.Size, sn.Quantity, sn.Prid)
		} else {
			conditionStr += fmt.Sprintf(`UNION ALL SELECT id, %d AS prid, name , firm, image_path,'%s' AS size, "%s" AS price, %d AS quantity FROM snickers  WHERE id = %d `, sn.ID, sn.Size, sn.Size, sn.Quantity, sn.Prid)
		}
	}
	return conditionStr
}

type Products struct {
	Size      string `db:"size"`
	Quantity  int    `db:"quantity"`
	Productid int    `db:"productid"`
}

func InsertIntoOrderItemsQuery(products []types.ProductsInsert, orderID int) string {
	queryString := "INSERT INTO orderItems (productid, quantity, size, orderid) VALUES "
	count := 0
	for _, product := range products {
		orderItemStr := fmt.Sprintf(`('%d', '%d', '%s', '%d')`,
			product.Productid,
			product.Quantity,
			product.Size,
			orderID,
		)
		if count > 0 {
			queryString += ","
		}
		count++
		queryString += orderItemStr

	}
	return queryString
}
func (q *Queries) GetSnickersOrderData(ctx context.Context, snickersPreorder []GetPreorderDataByIdRow) ([]types.SnickersCart, error) {
	orderQuery := query.GetSnickersOrderDataQuery(snickersPreorder)
	rows, err := q.db.Query(ctx, orderQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []types.SnickersCart
	for rows.Next() {
		var i types.SnickersCart
		if err := rows.Scan(
			&i.Id,
			&i.PrId,
			&i.Name,
			&i.Firm,
			&i.Image,
			&i.Size,
			&i.Price,
			&i.Quantity,
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

func (q *Queries) InsertIntoOrderItems(ctx context.Context, products []types.ProductsInsert, orderID int) error {
	orderQuery := query.InsertIntoOrderItemsQuery(products, orderID)
	_, err := q.db.Exec(ctx, orderQuery)
	if err != nil {
		return err
	}
	return nil
}
