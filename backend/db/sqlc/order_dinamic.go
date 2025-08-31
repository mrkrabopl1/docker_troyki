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
	queryString := "INSERT INTO orderItems (productid, quantity, size, orderid, source_table) VALUES "
	count := 0
	for _, product := range products {
		orderItemStr := fmt.Sprintf(`('%d', '%d', '%s', '%d', '%s')`,
			product.Productid,
			product.Quantity,
			product.Size.String,
			orderID,
			product.SourceTable,
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
	queryString := "INSERT INTO orderItems (productid, quantity, size, orderid, source_table) VALUES "
	count := 0
	for _, product := range products {
		orderItemStr := fmt.Sprintf(`('%d', '%d', '%s', '%d', '%s')`,
			product.Productid,
			product.Quantity,
			product.Size.String,
			orderID,
			product.SourceTable,
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
	fmt.Println("Executing query:", orderQuery)
	rows, err := q.db.Query(ctx, orderQuery)
	if err != nil {
		fmt.Println("Error executing query:", err)
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
			&i.SourceTable,
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
	fmt.Println("Inserting preorder items for order ID:", orderID, products)
	orderQuery := insertIntoPreorderItemsQuery(products, orderID)
	fmt.Println(orderQuery)
	_, err := q.db.Exec(ctx, orderQuery)
	if err != nil {
		fmt.Println("Error executing insert query:", err)
		return err
	}
	return nil
}

func getSnickersPreorderDataQuery(snickersPreorder []GetPreorderDataByIdRow) string {
	var conditionStr string

	fmt.Println("Generating Snickers preorder data query", snickersPreorder)

	for i, sn := range snickersPreorder {
		// Определяем таблицу источника и параметры
		tableName := "snickers"
		fmt.Println("Processing snickers:", sn.Size)
		sizeField := fmt.Sprintf("'%s'", sn.Size.String)  // Для snickers берем размер
		priceField := fmt.Sprintf(`'%s'`, sn.Size.String) // Для snickers цена из размера

		if sn.SourceTable == "solomerch" {
			tableName = "solomerch"
			sizeField = "''"        // Для solomerch размер пустой
			priceField = "minprice" // Для solomerch берем minprice
		}

		if sn.SourceTable == "clothes" {
			tableName = "clothes"
			priceField = "minprice" // Для solomerch берем minprice
		}

		if i == 0 {
			conditionStr += fmt.Sprintf(`
					SELECT 
						pr.global_id as id, 
						%d AS prid, 
						p.name, 
						p.firm, 
						p.image_path, 
						%s AS size, 
						%s AS price, 
						%d AS quantity, 
						'%s' AS source_table 
					FROM 
						product_registry pr
					JOIN 
						%s p ON pr.internal_id = p.id AND pr.source_table = '%s'
					WHERE 
						pr.global_id = %d`,
				sn.ID, sizeField, priceField, sn.Quantity, tableName, tableName, tableName, sn.Productid)
		} else {
			conditionStr += fmt.Sprintf(`
					UNION ALL 
					SELECT 
						pr.global_id as id, 
						%d AS prid, 
						p.name, 
						p.firm, 
						p.image_path, 
						%s AS size, 
						%s AS price, 
						%d AS quantity, 
						'%s' AS  source_table 
					FROM 
						product_registry pr
					JOIN 
						%s p ON pr.internal_id = p.id AND pr.source_table = '%s'
					WHERE 
						pr.global_id = %d`,
				sn.ID, sizeField, priceField, sn.Quantity, tableName, tableName, tableName, sn.Productid)
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
			conditionStr += fmt.Sprintf(`SELECT id, %d AS prid, name ,firm, image_path,'%s' AS size, "%s" AS price, %d AS quantity FROM snickers WHERE id = %d `, sn.ID, sn.Size.String, sn.Size.String, sn.Quantity, sn.Productid)
		} else {
			conditionStr += fmt.Sprintf(`UNION ALL SELECT id, %d AS prid, name , firm, image_path,'%s' AS size, "%s" AS price, %d AS quantity FROM snickers  WHERE id = %d `, sn.ID, sn.Size.String, sn.Size.String, sn.Quantity, sn.Productid)
		}
	}
	return conditionStr
}
