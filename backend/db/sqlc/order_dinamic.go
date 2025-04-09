package db

import (
	"context"
	"fmt"

	"github.com/mrkrabopl1/go_db/types"
)

type Products struct {
	Size      string `db:"size"`
	Quantity  int    `db:"quantity"`
	Productid int    `db:"productid"`
}

func insertIntoPreorderItemsQuery(products []GetPreorderDataByIdRow, orderID int) string {
	queryString := "INSERT INTO orderItems (productid, quantity, size, orderid) VALUES "
	count := 0
	for _, product := range products {
		orderItemStr := fmt.Sprintf(`('%d', '%d', '%s', '%d')`,
			product.Prid,
			product.Quantity,
			product.Size.String,
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

func insertIntoOrderItemsQuery(products []GetOrderDataByIdRow, orderID int) string {
	queryString := "INSERT INTO orderItems (productid, quantity, size, orderid) VALUES "
	count := 0
	for _, product := range products {
		orderItemStr := fmt.Sprintf(`('%d', '%d', '%s', '%d')`,
			product.Prid,
			product.Quantity,
			product.Size.String,
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

func (q *Queries) GetSnickersPreorderData(ctx context.Context, snickersPreorder []GetPreorderDataByIdRow) ([]types.SnickersCart, error) {
	orderQuery := getSnickersPreorderDataQuery(snickersPreorder)
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

func (q *Queries) InsertManyPreorderItems(ctx context.Context, products []GetPreorderDataByIdRow, orderID int) error {
	orderQuery := insertIntoPreorderItemsQuery(products, orderID)
	_, err := q.db.Exec(ctx, orderQuery)
	if err != nil {
		return err
	}
	return nil
}

func getSnickersPreorderDataQuery(snickersPreorder []GetPreorderDataByIdRow) string {
	var conditionStr string
	for _, sn := range snickersPreorder {
		if conditionStr == "" {
			conditionStr += fmt.Sprintf(`SELECT id, %d AS prid, name ,firm, image_path,'%s' AS size, "%s" AS price, %d AS quantity FROM snickers WHERE id = %d `, sn.ID, sn.Size.String, sn.Size.String, sn.Quantity, sn.Prid)
		} else {
			conditionStr += fmt.Sprintf(`UNION ALL SELECT id, %d AS prid, name , firm, image_path,'%s' AS size, "%s" AS price, %d AS quantity FROM snickers  WHERE id = %d `, sn.ID, sn.Size.String, sn.Size.String, sn.Quantity, sn.Prid)
		}
	}
	return conditionStr
}

func (q *Queries) GetSnickersOrderData(ctx context.Context, snickersPreorder []GetOrderDataByIdRow) ([]types.SnickersCart, error) {
	orderQuery := getSnickersOrderDataQuery(snickersPreorder)
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

func (q *Queries) InsertManyOrderItems(ctx context.Context, products []GetOrderDataByIdRow, orderID int) error {
	orderQuery := insertIntoOrderItemsQuery(products, orderID)
	_, err := q.db.Exec(ctx, orderQuery)
	if err != nil {
		return err
	}
	return nil
}

func getSnickersOrderDataQuery(snickersPreorder []GetOrderDataByIdRow) string {
	var conditionStr string
	for _, sn := range snickersPreorder {
		if conditionStr == "" {
			conditionStr += fmt.Sprintf(`SELECT id, %d AS prid, name ,firm, image_path,'%s' AS size, "%s" AS price, %d AS quantity FROM snickers WHERE id = %d `, sn.ID, sn.Size.String, sn.Size.String, sn.Quantity, sn.Prid)
		} else {
			conditionStr += fmt.Sprintf(`UNION ALL SELECT id, %d AS prid, name , firm, image_path,'%s' AS size, "%s" AS price, %d AS quantity FROM snickers  WHERE id = %d `, sn.ID, sn.Size.String, sn.Size.String, sn.Quantity, sn.Prid)
		}
	}
	return conditionStr
}
