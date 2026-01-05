package db

import (
	"fmt"
)

type Products struct {
	Size      string `db:"size"`
	Quantity  int    `db:"quantity"`
	Productid int    `db:"productid"`
}

func getSnickersOrderDataQuery(snickersPreorder []GetOrderDataByIdRow) string {
	var conditionStr string
	for _, sn := range snickersPreorder {
		if conditionStr == "" {
			conditionStr += fmt.Sprintf(`SELECT id, %d AS prid, name ,firm, image_path,'%s' AS size, "%s" AS price, %d AS quantity FROM snickers WHERE id = %d `, sn.ID, sn.Size.String, sn.Size.String, sn.Quantity, sn.ID)
		} else {
			conditionStr += fmt.Sprintf(`UNION ALL SELECT id, %d AS prid, name , firm, image_path,'%s' AS size, "%s" AS price, %d AS quantity FROM snickers  WHERE id = %d `, sn.ID, sn.Size.String, sn.Size.String, sn.Quantity, sn.ID)
		}
	}
	return conditionStr
}
