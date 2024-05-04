package db

import (
	"context"
	"encoding/json"
	"fmt"
	"reflect"
)

type SizeStruct1 struct {
	Size35  *int `db:"3.5"`
	Size4   *int `db:"4"`
	Size45  *int `db:"4.5"`
	Size5   *int `db:"5"`
	Size55  *int `db:"5.5"`
	Size6   *int `db:"6"`
	Size65  *int `db:"6.5"`
	Size7   *int `db:"7"`
	Size75  *int `db:"7.5"`
	Size8   *int `db:"8"`
	Size85  *int `db:"8.5"`
	Size9   *int `db:"9"`
	Size95  *int `db:"9.5"`
	Size10  *int `db:"10"`
	Size105 *int `db:"10.5"`
	Size11  *int `db:"11"`
	Size115 *int `db:"11.5"`
	Size12  *int `db:"12"`
	Size125 *int `db:"12.5"`
	Size13  *int `db:"13"`
}

type SizeStruct struct {
	Id      int  `db:"id"`
	Size35  *int `db:"3.5"`
	Size4   *int `db:"4"`
	Size45  *int `db:"4.5"`
	Size5   *int `db:"5"`
	Size55  *int `db:"5.5"`
	Size6   *int `db:"6"`
	Size65  *int `db:"6.5"`
	Size7   *int `db:"7"`
	Size75  *int `db:"7.5"`
	Size8   *int `db:"8"`
	Size85  *int `db:"8.5"`
	Size9   *int `db:"9"`
	Size95  *int `db:"9.5"`
	Size10  *int `db:"10"`
	Size105 *int `db:"10.5"`
	Size11  *int `db:"11"`
	Size115 *int `db:"11.5"`
	Size12  *int `db:"12"`
	Size125 *int `db:"12.5"`
	Size13  *int `db:"13"`
}

type DiscountStruct struct {
	Value     string `db:"value"`
	ProductId int    `db:"productid"`
	Id        int    `db:"id"`
}
type DiscountStructC struct {
	Value     map[string]int
	ProductId int
	Id        int `db:"id"`
}

func (s *PostgresStore) UpdateTable(ctx context.Context) {
	convertMap := map[string]string{
		"Size35":  "3.5",
		"Size4":   "4",
		"Size45":  "4.5",
		"Size5":   "5",
		"Size55":  "5.5",
		"Size6":   "6",
		"Size65":  "6.5",
		"Size7":   "7",
		"Size75":  "7.5",
		"Size8":   "8",
		"Size85":  "8.5",
		"Size9":   "9",
		"Size95":  "9.5",
		"Size10":  "10",
		"Size105": "10.5",
		"Size11":  "11",
		"Size115": "11.5",
		"Size12":  "12",
		"Size125": "12.5",
		"Size13":  "13",
	}
	db, _ := s.connect(ctx)
	defer db.Close()

	var data []DiscountStruct

	var dataC []DiscountStructC

	query := "SELECT id, productid, value  FROM discount"

	err := db.SelectContext(ctx, &data, query)

	if err != nil {
		fmt.Println(err)
	}

	for _, value := range data {

		var val map[string]int

		json.Unmarshal([]byte(value.Value), &val)
		dataC = append(dataC, DiscountStructC{
			ProductId: value.ProductId,
			Value:     val,
			Id:        value.Id,
		})
	}

	//fmt.Println(dataC)

	for key, value := range data {
		fmt.Printf("Key: %s, Value: %d\n", key, value)
	}

	filterString := ""

	for _, val := range data {
		if filterString == "" {
			filterString += fmt.Sprintf("WHERE id = %d", val.ProductId)
		} else {
			filterString += fmt.Sprintf("OR id = %d", val.ProductId)
		}
	}

	var data1 []SizeStruct
	query1 := fmt.Sprintf(`SELECT id, "3.5",
	"4",
	"4.5" ,
	"5",
	"5.5",
	"6",
	"6.5",
	"7",
	"7.5",
	"8" ,
	"8.5",
	"9" ,
	"9.5",
	"10",
	"10.5",
	"11",
	"11.5",
	"12",
	"12.5",
	"13"   FROM snickers %s`, filterString)

	//fmt.Println(query1)

	err1 := db.SelectContext(ctx, &data1, query1)
	if err1 != nil {
		fmt.Println(err1)
	}

	fmt.Println("ffs", data1)

	for _, row := range data1 {
		val := reflect.ValueOf(row)

		var discount map[string]int
		var disId int

		for _, dis := range dataC {
			if dis.ProductId == row.Id {
				discount = dis.Value
				disId = dis.Id
			}
		}

		//fmt.Println(discount)
		min := 10000000000000000
		maxDiscountPrice := 0
		for i := 0; i < val.NumField(); i++ {
			field := val.Field(i)

			//fmt.Println(field)

			if field.Kind() == reflect.Ptr {
				if field.IsNil() {

				} else {
					discNum := discount[convertMap[val.Type().Field(i).Name]]
					fmt.Println(discNum)
					realPr := int(field.Elem().Int())
					num := realPr - discNum
					if min > num {
						min = num
					}
					if discNum != 0 {
						if maxDiscountPrice < realPr {
							maxDiscountPrice = realPr
						}
					}
				}
			}
		}
		fmt.Println(min)
		fmt.Println(maxDiscountPrice)
		updStr := fmt.Sprintf("UPDATE discount SET minprice = %d, maxdiscprice = %d WHERE  id = %d", min, maxDiscountPrice, disId)

		_, err := db.Exec(updStr)
		if err != nil {
			fmt.Println(err)
		}
	}

}
