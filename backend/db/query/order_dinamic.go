package query

import (
	"fmt"

	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/types"
)

func GetSnickersOrderDataQuery(snickersPreorder []db.GetPreorderDataByIdRow) string {
	var conditionStr string
	for _, sn := range snickersPreorder {
		if conditionStr == "" {
			conditionStr += fmt.Sprintf(`SELECT id, %d AS prid, name ,firm, image_path,'%s' AS size, "%s" AS price, %d AS quantity FROM snickers WHERE id = %d `, sn.Id, sn.Size, sn.Size, sn.Quantity, sn.PrId)
		} else {
			conditionStr += fmt.Sprintf(`UNION ALL SELECT id, %d AS prid, name , firm, image_path,'%s' AS size, "%s" AS price, %d AS quantity FROM snickers  WHERE id = %d `, sn.Id, sn.Size, sn.Size, sn.Quantity, sn.PrId)
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