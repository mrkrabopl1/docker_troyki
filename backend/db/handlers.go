package db

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math"
	"net/smtp"
	"time"

	"github.com/cespare/xxhash"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"github.com/mrkrabopl1/go_db/errorsType"
	"github.com/mrkrabopl1/go_db/logger"
	"github.com/mrkrabopl1/go_db/server/contextKeys"
	"github.com/mrkrabopl1/go_db/types"
	"golang.org/x/crypto/bcrypt"
)

type Snickers2 struct {
	Data []types.Snickers `db:"data"`
	Line string           `db:"line"`
}

var log = logger.InitLogger()

// type SnickersLine struct {
// 	Line string `db:"firm"`
// 	Line []Snickers `db:"line"`
// }

func (s *PostgresStore) GetFirms(ctx context.Context) ([]types.FirmsResult, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	var results []types.FirmsResult
	query := `
	SELECT firm, array_agg(DISTINCT line) AS array_of_data
	FROM "snickers"
	GROUP BY firm`

	err := db.SelectContext(
		ctx,
		&results,
		query)
	if err != nil {
		return results, err
	}
	return results, nil
}

func (s *PostgresStore) GetSnickersByFirmName(ctx context.Context) ([]types.Snickers, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	firm := ctx.Value(contextKeys.QueryKey)

	query := fmt.Sprintf("SELECT name, image_path, snickers.id, value  FROM snickers LEFT JOIN discount ON snickers.id = productid WHERE firm = '%s'", firm)

	defer db.Close()

	var results []types.Snickers

	err1 := db.SelectContext(
		ctx,
		&results,
		query,
	)

	if err1 != nil {
		return results, err1
	}

	return results, nil
}

func (s *PostgresStore) selectContextAgregation(ctx context.Context, query string) ([]types.SnickersLine, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	start := time.Now()
	var results []types.SnickersLine

	err1 := db.SelectContext(
		ctx,
		&results,
		query,
	)

	if err1 != nil {
		return results, err1
	}
	end := time.Now()
	elapsed := end.Sub(start)
	fmt.Printf("YourFunction took %s\n", elapsed)
	return results, nil
}

func (s *PostgresStore) jsonAgregation(ctx context.Context, query string) ([]Snickers2, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	start := time.Now()
	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		log.Fatal("err")
	}
	defer rows.Close()

	// Define a slice to store sales aggregations
	var salesAggregations []Snickers2

	// Iterate over the rows
	for rows.Next() {
		var sa Snickers2
		var salesData string // To hold JSON data as string

		// Scan values into struct fields
		if err := rows.Scan(&sa.Line, &salesData); err != nil {
			log.Fatal("err")
		}

		// Unmarshal JSON data into slice of Sale structs
		if err := json.Unmarshal([]byte(salesData), &sa.Data); err != nil {
			log.Fatal("err")
		}

		// Append the struct to the slice
		salesAggregations = append(salesAggregations, sa)
	}
	if err != nil {
		log.Fatal("err")
	}

	// Print the JSON data
	fmt.Println(salesAggregations)
	end := time.Now()
	elapsed := end.Sub(start)
	fmt.Printf("YourFunction took %s\n", elapsed)
	return nil, nil
}

func (s *PostgresStore) GetSnickersByLineName(ctx context.Context) ([]types.SnickersLine, error) {
	line := ctx.Value(contextKeys.QueryKey)
	query := fmt.Sprintf("SELECT line,array_agg(id) AS id, array_agg(image_path) AS image_path, array_agg(name) AS name_data  FROM snickers WHERE line = '%s'	GROUP BY  line", line)
	//query1 := fmt.Sprintf("SELECT line, json_agg(json_build_object('name', name, 'image_path', image_path, 'id',id)) AS data  FROM snickers WHERE line = '%s'	GROUP BY  line", line)

	//s.JsonAgregation(ctx, query1)
	result, err := s.selectContextAgregation(ctx, query)

	return result, err
}

func (s *PostgresStore) GetFiltersByString(ctx context.Context, name string) (types.Filter, error) {
	db, _ := s.connect(ctx)
	defer db.Close()

	var filter types.Filter

	query := fmt.Sprintf(`SELECT
	MIN(minprice) min,
	MAX(maxprice) max,
	COUNT("3.5")   name_data2  ,
	COUNT("4")  name_data3  ,
	COUNT("4.5")   name_data4 ,
	COUNT("5") name_data5  ,
	COUNT("5.5")  name_data6  ,
	COUNT("6") name_data7  ,
	COUNT("6.5")   name_data8  ,
	COUNT("7")   name_data9  ,
	COUNT("7.5")  name_data10  ,
	COUNT("8")  name_data11  ,
	COUNT("8.5")  name_data12  ,
	COUNT("9")  name_data13  ,
	COUNT("9.5")  name_data163  ,
	COUNT("10")  name_data14  ,
	COUNT("10.5")   name_data15  ,
	COUNT("11")   name_data16  ,
	COUNT("11.5")  name_data17  ,
	COUNT("12")   name_data18  ,
	COUNT("12.5")   name_data19  ,
	COUNT("13")   name_data20
	
	FROM snickers WHERE name ILIKE '%%%s%%'`, name)

	//var firmFilter []FirmFilter
	query2 := fmt.Sprintf(`SELECT firm,
	COUNT(id)  count
	FROM snickers WHERE name ILIKE '%%%s%%'	GROUP BY  firm`, name)

	var spFilter types.SizePriceFilter

	err1 := db.GetContext(ctx, &spFilter, query)
	if err1 != nil {
		return filter, err1
	}

	filter.SizePriceFilter = spFilter

	rows, err2 := db.QueryContext(ctx, query2)

	if err2 != nil {
		return filter, err1
	}
	firmFilter2 := make(map[string]int)

	for rows.Next() {
		var firm string
		var count int

		if err := rows.Scan(&firm, &count); err != nil {
			log.Fatal("err")
		}

		firmFilter2[firm] = count
	}

	defer rows.Close()
	filter.FirmFilter = firmFilter2

	return filter, nil
}

func (s *PostgresStore) UpdateFiltersByFilter(ctx context.Context, filterType int, name string, filters types.SnickersFilterStruct) (types.Filter, error) {
	db, _ := s.connect(ctx)
	defer db.Close()

	var filter types.Filter
	if filterType == 0 {
		firmString := ""
		for index, firm := range filters.Firms {
			var firmStr string
			if index > 0 {
				firmStr = fmt.Sprintf(`OR firm = '%s'`, firm)
			} else {
				firmStr = fmt.Sprintf(`(firm = '%s'`, firm)
			}
			firmString += firmStr + " "
		}
		query := fmt.Sprintf(`SELECT
			MIN(minprice) min,
			MAX(maxprice) max,
			COUNT("3.5")   name_data2  ,
			COUNT("4")  name_data3  ,
			COUNT("4.5")   name_data4 ,
			COUNT("5") name_data5  ,
			COUNT("5.5")  name_data6  ,
			COUNT("6") name_data7  ,
			COUNT("6.5")   name_data8  ,
			COUNT("7")   name_data9  ,
			COUNT("7.5")  name_data10  ,
			COUNT("8")  name_data11  ,
			COUNT("8.5")  name_data12  ,
			COUNT("9")  name_data13  ,
			COUNT("9")  name_data163  ,
			COUNT("10")  name_data14  ,
			COUNT("10.5")   name_data15  ,
			COUNT("11")   name_data16  ,
			COUNT("11.5")  name_data17  ,
			COUNT("12")   name_data18  ,
			COUNT("12.5")   name_data19  ,
			COUNT("13")   name_data20
			
			FROM snickers WHERE name ILIKE '%%%s%%' AND %s`, name, firmString)

		var spFilter types.SizePriceFilter

		err1 := db.GetContext(ctx, &spFilter, query)
		if err1 != nil {
			return filter, err1
		}
	}

	//var firmFilter []FirmFilter
	query2 := fmt.Sprintf(`SELECT firm,
	COUNT(id)  count
	FROM snickers WHERE name ILIKE '%%%s%%'	GROUP BY  firm`, name)

	var spFilter types.SizePriceFilter
	filter.SizePriceFilter = spFilter

	rows, err := db.QueryContext(ctx, query2)
	if err != nil {
		return filter, err
	}
	defer rows.Close()
	firmFilter2 := make(map[string]int)

	for rows.Next() {
		var firm string
		var count int // To hold JSON data as string

		// Scan values into struct fields
		if err := rows.Scan(&firm, &count); err != nil {
			log.Fatal("err")
		}

		firmFilter2[firm] = count
	}

	//err2 := s.dbx.SelectContext(ctx, &firmFilter, query2)

	filter.FirmFilter = firmFilter2

	return filter, nil
}

func createFilterQuery(filters types.SnickersFilterStruct) string {
	filterStr := ""
	sizeString := ""
	firmString := ""
	for index, size := range filters.Sizes {
		var sizeStr string
		if index > 0 {
			sizeStr = fmt.Sprintf(`OR "%s" IS NOT NULL`, size)
		} else {
			sizeStr = fmt.Sprintf(`AND ( "%s" IS NOT NULL`, size)
		}
		sizeString += sizeStr + " "
	}

	if sizeString != "" {
		filterStr += sizeString + ") "
	}

	for index, firm := range filters.Firms {
		var firmStr string
		if index > 0 {
			firmStr = fmt.Sprintf(`OR firm = '%s'`, firm)
		} else {
			firmStr = fmt.Sprintf(`AND (firm = '%s'`, firm)
		}
		firmString += firmStr + " "
	}
	if firmString != "" {
		filterStr += firmString + ") "
	}

	priceStr := ""
	if len(filters.Price) != 0 {
		minPriceStr := fmt.Sprintf(`AND minprice <= %d`, int(filters.Price[1]))
		priceStr += minPriceStr + " "
		maxPriceStr := fmt.Sprintf(`AND maxprice >= %d`, int(filters.Price[0]))
		priceStr += maxPriceStr + " "
		filterStr += priceStr
	}
	return filterStr
}

func (s *PostgresStore) GetTest(ctx context.Context) {
	db, _ := s.connect(ctx)
	defer db.Close()
	var data []SizeStruct
	query := `SELECT id, "3.5",
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
	"13"   FROM snickers`
	start := time.Now()

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return
	}
	defer rows.Close()
	sizes := make(map[string]interface{})
	for rows.Next() {
		var data SizeStruct
		err := rows.Scan(&data.Id, &data.Size35, &data.Size10, &data.Size105, &data.Size11, &data.Size115, &data.Size12, &data.Size13, &data.Size125, &data.Size4, &data.Size45, &data.Size5, &data.Size55, &data.Size6, &data.Size65, &data.Size7, &data.Size75, &data.Size8, &data.Size85, &data.Size9, &data.Size95)
		if err != nil {
			panic(err)
		}

		if data.Size35 != nil {
			sizes["3.5"] = *data.Size35
		}
		if data.Size4 != nil {
			sizes["4"] = *data.Size4
		}
		if data.Size45 != nil {
			sizes["4.5"] = *data.Size45
		}
		if data.Size5 != nil {
			sizes["5"] = *data.Size5
		}
		if data.Size55 != nil {
			sizes["5.5"] = *data.Size55
		}
		if data.Size6 != nil {
			sizes["6"] = *data.Size6
		}
		if data.Size65 != nil {
			sizes["6.5"] = *data.Size65
		}
		if data.Size7 != nil {
			sizes["7"] = *data.Size7
		}
		if data.Size75 != nil {
			sizes["7.5"] = *data.Size75
		}
		if data.Size8 != nil {
			sizes["8"] = *data.Size8
		}
		if data.Size85 != nil {
			sizes["8.5"] = *data.Size85
		}
		if data.Size9 != nil {
			sizes["9"] = *data.Size9
		}
		if data.Size95 != nil {
			sizes["9.5"] = *data.Size95
		}
		if data.Size10 != nil {
			sizes["10"] = *data.Size10
		}
		if data.Size105 != nil {
			sizes["10.5"] = *data.Size105
		}
		if data.Size11 != nil {
			sizes["11"] = *data.Size11
		}
		if data.Size115 != nil {
			sizes["11.5"] = *data.Size115
		}

		if data.Size12 != nil {
			sizes["12"] = *data.Size12
		}
		if data.Size125 != nil {
			sizes["12.5"] = *data.Size125
		}
		if data.Size13 != nil {
			sizes["13"] = *data.Size13
		}

		fmt.Println(sizes)

	}

	end := time.Now()
	elapsed := end.Sub(start)
	fmt.Printf("YourFunction took %s\n", elapsed)

	var data1 types.SnickersInfo
	start1 := time.Now()
	query1 := "SELECT info,image_path, name FROM snickers"
	//query := "SELECT image_path, name FROM snickers WHERE id =1"
	err1 := db.GetContext(ctx, &data1, query1)
	fmt.Println(data)
	if err1 != nil {
		fmt.Println(err1)
	}
	if err != nil {
		fmt.Println(err)
	}

	end1 := time.Now()
	elapsed1 := end1.Sub(start1)
	fmt.Printf("YourFunction took %s\n", elapsed1)

	// var discount int
	// json.Unmarshal([]byte(*data[0].Discount), &discount)
	// //firmFilter2 := make(map[string]int)
	// fmt.Println(discount)
	fmt.Println(data1)
}

func (s *PostgresStore) GetSnickersByString(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (types.SnickersPage, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	var count int
	var data []types.SnickersSearch
	var finalData types.SnickersPage
	filterString := createFilterQuery(filters)
	fmt.Println(filterString, "filterString", name)
	query1 := fmt.Sprintf(`SELECT COUNT(id) FROM snickers  WHERE name ILIKE '%%%s%%' %s`, name, filterString)
	err1 := db.GetContext(ctx, &count, query1)
	fmt.Println(count, "fkglggkgkjgkg")
	if err1 != nil {
		return finalData, err1
	}
	var orderedString = ""
	if orderedType == 1 {
		orderedString = "ORDER BY snickers.minprice ASC"
	} else {
		orderedString = "ORDER BY snickers.minprice DESC"
	}

	var pageSize = math.Ceil(float64(count) / float64(size))

	var offset = (page - 1) * size

	var limit = size * page

	query := fmt.Sprintf("SELECT snickers.id, image_path, name, firm, snickers.minprice , maxdiscprice FROM snickers  LEFT JOIN discount ON snickers.id = productid WHERE name ILIKE '%%%s%%' %s  %s LIMIT %d OFFSET %d", name, filterString, orderedString, limit, offset)

	err := db.SelectContext(ctx, &data, query)
	fmt.Println(data, "data fdsfdsfsd")
	if err != nil {
		return finalData, err1
	}
	finalData = types.SnickersPage{
		SnickersPageInfo: data,
		PageSize:         int(pageSize),
	}

	return finalData, nil
}
func (s *PostgresStore) GetSnickersAndFiltersByString(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (types.SnickersPageAndFilters, error) {

	db, _ := s.connect(ctx)
	defer db.Close()
	var finalData types.SnickersPageAndFilters
	var count int
	var orderedString = ""
	if orderedType == 1 {
		orderedString = "ORDER BY snickers.minprice ASC"
	} else {
		orderedString = "ORDER BY snickers.minprice DESC"
	}
	filterString := createFilterQuery(filters)
	query1 := fmt.Sprintf(`SELECT COUNT(id) FROM snickers  WHERE name ILIKE '%%%s%%' %s`, name, filterString)
	fmt.Println(query1)
	err1 := db.GetContext(ctx, &count, query1)
	if err1 != nil {
		return finalData, err1
	}

	var pageSize = math.Ceil(float64(count) / float64(size))

	var offset = (page - 1) * size

	var limit = size * page

	query := fmt.Sprintf("SELECT snickers.id, image_path, name, firm, snickers.minprice , maxdiscprice FROM snickers  LEFT JOIN discount ON snickers.id = productid WHERE name ILIKE '%%%s%%' %s  %s LIMIT %d OFFSET %d", name, filterString, orderedString, limit, offset)
	var data []types.SnickersSearch

	err := db.SelectContext(ctx, &data, query)
	if err != nil {
		return finalData, err
	}

	fmt.Println(data)

	filter, fError := s.GetFiltersByString(ctx, name)

	if fError != nil {
		return finalData, fError
	}

	finalData = types.SnickersPageAndFilters{
		SnickersPageInfo: data,
		PageSize:         int(pageSize),
		Filter:           filter,
	}
	return finalData, nil
}

func (s *PostgresStore) GetMainPage(ctx context.Context) ([]types.MainPage, error) {

	var data []types.MainPage
	db, _ := s.connect(ctx)
	defer db.Close()
	query := "SELECT imagepath, maintext, subtext FROM main_page LIMIT 1"
	err := db.SelectContext(ctx, &data, query)
	if err != nil {
		return data, err
	}

	return data, nil
}

func (s *PostgresStore) GetSnickersInfoById(ctx context.Context, id string) (types.SnickersInfo, error) {
	var data types.SnickersInfo
	db, _ := s.connect(ctx)

	defer db.Close()

	query := fmt.Sprintf("SELECT info,image_path, name , value FROM snickers  LEFT JOIN discount ON snickers.id = productid WHERE snickers.id =%s", id)
	//query := "SELECT image_path, name FROM snickers WHERE id =1"
	err := db.GetContext(ctx, &data, query)
	if err != nil {
		log.Log.Err(err)
	}

	return data, nil
}

func (s *PostgresStore) GetSoloCollection(ctx context.Context, name string, size int, page int) ([]types.SnickersSearch, error) {

	end := page * size
	offset := (page - 1) * size
	db, _ := s.connect(ctx)
	var data []types.SnickersSearch
	query := fmt.Sprintf("SELECT   COALESCE(discount.minprice, snickers.minprice) AS minprice, snickers.id,image_path, name, firm , maxdiscprice  FROM snickers LEFT JOIN discount ON snickers.id = productid WHERE firm = '%s' OR line = '%s' LIMIT %d  OFFSET %d ", name, name, end, offset)
	defer db.Close()

	err := db.SelectContext(
		ctx,
		&data,
		query)
	if err != nil {
		return data, err
	}

	return data, nil
}

func (s *PostgresStore) GetCollection(ctx context.Context, names []string, size int, page int) (map[string][]types.SnickersSearch, error) {

	end := page * size
	offset := (page - 1) * size
	db, _ := s.connect(ctx)
	data := make(map[string][]types.SnickersSearch)
	for _, value := range names {
		var colectionInfo []types.SnickersSearch
		query := fmt.Sprintf("SELECT COALESCE(discount.minprice, snickers.minprice) AS minprice, snickers.id,image_path, name, firm , maxdiscprice  FROM snickers LEFT JOIN discount ON snickers.id = productid WHERE firm = '%s' OR line = '%s' LIMIT %d  OFFSET %d ", value, value, end, offset)
		defer db.Close()

		err := db.SelectContext(
			ctx,
			&colectionInfo,
			query)
		if err != nil {
			return data, err
		} else {
			data[value] = colectionInfo
		}
	}

	return data, nil
}

func (s *PostgresStore) GetSnickersByName(ctx context.Context, name string, max int) ([]types.SnickersSearch, error) {
	db, _ := s.connect(ctx)
	var data []types.SnickersSearch
	query := fmt.Sprintf("SELECT snickers.minPrice, snickers.id,image_path, name, firm ,maxdiscprice FROM snickers LEFT JOIN discount ON snickers.id = productid WHERE name ILIKE '%%%s%%' LIMIT %d", name, max)
	defer db.Close()

	err := db.SelectContext(
		ctx,
		&data,
		query)
	if err != nil {
		return data, err
	}
	return data, nil
}

func (s *PostgresStore) GetCartData(ctx context.Context, hash string) ([]types.SnickersCart, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	var snickersPreorder []types.SnickersPreorder
	var dataQuery []types.SnickersCart

	query := fmt.Sprintf(`SELECT id FROM preorder WHERE hashUrl = '%s'`, hash)
	var idData int
	err := db.GetContext(ctx, &idData, query)
	if err != nil {
		return dataQuery, err
	} else {
		query := fmt.Sprintf("SELECT id, productid AS prid, size, quantity FROM  preorderItems WHERE  orderid=%d", idData)
		err := db.SelectContext(ctx, &snickersPreorder, query)
		if err != nil {
			return dataQuery, err
		} else {
			conditionStr := ""
			for _, sn := range snickersPreorder {
				if conditionStr == "" {
					conditionStr += fmt.Sprintf(`SELECT id, %d AS prid, name ,firm, image_path,'%s' AS size, "%s" AS price, %d AS quantity FROM snickers WHERE id = %d `, sn.Id, sn.Size, sn.Size, sn.Quantity, sn.PrId)
				} else {
					conditionStr += fmt.Sprintf(`UNION ALL SELECT id, %d AS prid, name , firm, image_path,'%s' AS size, "%s" AS price, %d AS quantity FROM snickers  WHERE id = %d `, sn.Id, sn.Size, sn.Size, sn.Quantity, sn.PrId)
				}
			}
			err := db.SelectContext(
				ctx,
				&dataQuery,
				conditionStr,
			)
			if err != nil {
				return dataQuery, err
			}
		}

	}
	return dataQuery, nil
}
func (s *PostgresStore) GetCartDataFromOrderByHash(ctx context.Context, hash string) ([]types.SnickersCart, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	var cartInfo []types.SnickersCart
	var orderId int
	//queryExStr := fmt.Sprintf(`SELECT EXISTS (SELECT 1 FROM orders WHERE hash = '%s' )`, hash)
	query := fmt.Sprintf(`SELECT id FROM orders WHERE hash = '%s'`, hash)

	err := db.GetContext(ctx, &orderId, query)
	if err != nil {
		return cartInfo, err
	} else {
		snickers, err := s.GetCartDataFromOrderById(ctx, orderId)
		if err != nil {
			return cartInfo, err
		} else {
			return snickers, err
		}
	}
}
func (s *PostgresStore) GetCartDataFromOrderById(ctx context.Context, id int) ([]types.SnickersCart, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	var snickersPreorder []types.SnickersPreorder
	var dataQuery []types.SnickersCart

	query := fmt.Sprintf("SELECT id, productid AS prid, size, quantity FROM  orderItems WHERE  orderid=%d", id)
	err := db.SelectContext(ctx, &snickersPreorder, query)
	if err != nil {
		return dataQuery, err
	} else {
		conditionStr := ""
		for _, sn := range snickersPreorder {
			if conditionStr == "" {
				conditionStr += fmt.Sprintf(`SELECT id, %d AS prid, name ,firm, image_path,'%s' AS size, "%s" AS price, %d AS quantity FROM snickers WHERE id = %d `, sn.Id, sn.Size, sn.Size, sn.Quantity, sn.PrId)
			} else {
				conditionStr += fmt.Sprintf(`UNION ALL SELECT id, %d AS prid,firm, name , image_path,'%s' AS size, "%s" AS price, %d AS quantity FROM snickers  WHERE id = %d `, sn.Id, sn.Size, sn.Size, sn.Quantity, sn.PrId)
			}
		}
		err := db.SelectContext(
			ctx,
			&dataQuery,
			conditionStr,
		)
		if err != nil {
			return dataQuery, err
		}
	}
	return dataQuery, nil
}

// type Count struct {
// 	Data  int `db:"name_data"`
// 	Data1 int `db:"name_data1"`
// }

// type Count struct {
// 	Name string `db:"name"`
// }

type Count struct {
	//Name   string      `db:"name"`
	types.FirmsResult `db:"result"`
}

func (s *PostgresStore) CreatePreorder(ctx context.Context, id int, info map[string]string) (string, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	currentTime := time.Now()

	hashedStr := xxhash.Sum64([]byte((currentTime.String() + fmt.Sprint(id))))
	dataStr := fmt.Sprintf(`INSERT INTO preorder (hashurl, updatetime) VALUES ('%s', '%s') RETURNING id`, fmt.Sprint(hashedStr), currentTime.Format("2006-01-02"))
	var authorID int

	var size string

	if val, ok := info["size"]; ok {
		size = val
	}

	err := db.QueryRow(dataStr).Scan(&authorID)
	if err != nil {
		return fmt.Sprint(hashedStr), err
	}

	prItStr := fmt.Sprintf(`INSERT INTO preorderItems (orderid, productid, size, quantity) VALUES (%d, %d, '%s', 1) RETURNING id`, authorID, id, size)

	_, err1 := db.Exec(prItStr)
	if err1 != nil {
		return fmt.Sprint(hashedStr), err1
	}

	return fmt.Sprint(hashedStr), nil
}
func (s *PostgresStore) UpdatePreorder(ctx context.Context, id int, info map[string]string, hash string) (int, error) {

	db, _ := s.connect(ctx)
	defer db.Close()
	var size string

	if val, ok := info["size"]; ok {
		size = val
	}
	var idData int

	query := fmt.Sprintf(`SELECT id FROM preorder WHERE hashUrl = '%s'`, hash)

	err := db.GetContext(ctx, &idData, query)
	if err != nil {
		return 0, err
	} else {
		connStr := fmt.Sprintf("orderid=%d AND size='%s' AND productid='%d'", idData, size, id)
		qStr := fmt.Sprintf("SELECT quantity FROM preorderitems WHERE %s", connStr)
		// Check if the row exists
		var existingValue int
		err = db.QueryRow(qStr).Scan(&existingValue)
		if err == sql.ErrNoRows {
			prItStr := fmt.Sprintf(`INSERT INTO preorderItems (orderid, productid, size, quantity) VALUES (%d, %d, '%s', 1) RETURNING id`, idData, id, size)

			_, err2 := db.Exec(prItStr)
			if err2 != nil {
				fmt.Println(err2)
			}
			return 1, nil
		} else if err != nil {
			panic(err)
		} else {

			_, err = db.Exec(fmt.Sprintf("UPDATE preorderItems SET quantity = %d WHERE  %s", existingValue+1, connStr))
			if err != nil {
				panic(err)
			}

			return existingValue + 1, nil
		}
	}
}

func (s *PostgresStore) DeleteCartData(ctx context.Context, preorderid int) error {
	db, _ := s.connect(ctx)
	defer db.Close()
	query := fmt.Sprintf(`DELETE FROM preorderitems WHERE id = %d`, preorderid)
	_, err := db.ExecContext(ctx, query)
	if err != nil {
		return err
	}
	return nil
}

func (s *PostgresStore) GetCartCount(ctx context.Context, hash string) (int, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	query := fmt.Sprintf(`SELECT id FROM preorder WHERE hashUrl = '%s'`, hash)
	var idData int
	err := db.GetContext(ctx, &idData, query)
	if err != nil {
		return 0, err
	} else {
		query := fmt.Sprintf("SELECT  coalesce(SUM(quantity),0) FROM  preorderItems WHERE  orderid=%d", idData)
		var quantity int
		err := db.GetContext(ctx, &quantity, query)
		if err != nil {
			return 0, err
		} else {
			return quantity, nil
		}
	}
}

func generateToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func createVerifyingString() ([]byte, string) {
	token, err := generateToken()
	if err != nil {
		log.Fatal("Error generating token: %v", err)
	}
	verifiString := fmt.Sprintf(
		"MIME-Version: 1.0\r\n"+
			"Content-Type: text/html; charset=\"UTF-8\";\r\n"+
			"Subject: Troyki profile verification\r\n"+
			"\r\n"+
			"<html><body>"+
			"<p>Click the link below:</p>"+
			"<a href=\"http://localhost:3000/verification/%s\">Troyki verifiaction</a>"+
			"</body></html>\r\n", token)
	message := []byte(verifiString)
	return message, token
}

func createChangeForgetPass() ([]byte, string) {
	token, err := generateToken()
	if err != nil {
		log.Fatal("Error generating token: %v", err)
	}
	verifiString := fmt.Sprintf(
		"MIME-Version: 1.0\r\n"+
			"Content-Type: text/html; charset=\"UTF-8\";\r\n"+
			"Subject: Troyki profile change pass\r\n"+
			"\r\n"+
			"<html><body>"+
			"<p>Click the link below:</p>"+
			"<a href=\"http://localhost:3000/confirm/%s\">http://localhost:3000/confirm/%s</a>"+
			"</body></html>\r\n", token, token)
	message := []byte(verifiString)
	return message, token
}

func sendMail(message []byte) error {
	from := "munhgauzen12@gmail.com"
	password := "qlfqlqasjkrywvij"

	// Receiver email address.
	to := []string{"mr.krabopl12@gmail.com"}

	// SMTP server configuration.
	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	auth := smtp.PlainAuth("", from, password, smtpHost)

	// Sending email.

	err2 := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, to, message)
	if err2 != nil {
		log.Fatal("smtp error: %s", err2)
		return err2
	}

	return nil
}

func setVerification(db *sqlx.DB, ctx context.Context, token string, authorID int) error {
	deleteQuery := fmt.Sprintf(`DELETE FROM verification WHERE id = %d`, authorID)

	_, err1 := db.ExecContext(ctx, deleteQuery)
	if err1 != nil {
		fmt.Println(err1)
		return err1
	}

	expire := time.Now().Add(30 * time.Minute).Format("2006-01-02 15:04:05")
	deleteTime := time.Now().Add(720 * time.Hour).Format("2006-01-02 15:04:05")
	verStr := fmt.Sprintf(`INSERT INTO verification (token, expire, customerId, deleteTime) VALUES 
			('%s', '%s', %d, '%s')`, token, expire, authorID, deleteTime)

	_, err := db.ExecContext(ctx, verStr)
	if err != nil {
		fmt.Println(err, "fwdjfoiewjroiewjroiwe")
		return err
	}
	return nil
}

func (s *PostgresStore) RegisterUser(ctx context.Context, pass string, mail string) (int, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	var exist bool
	queryExStr := fmt.Sprintf(`SELECT EXISTS (SELECT 1 FROM customers WHERE mail = '%s' )`, mail)

	err := db.GetContext(ctx, &exist, queryExStr)

	if err != nil {
		fmt.Println(err)
	}

	if exist {
		fmt.Println("Mail already exist")
		return 1, nil
	} else {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
		if err != nil {
			return 0, err
		}
		fmt.Println(string(hashedPassword))
		customerStr := fmt.Sprintf(`INSERT INTO customers (pass, mail) VALUES 
		('%s', '%s') RETURNING id`, hashedPassword, mail)

		var authorID int

		err1 := db.QueryRow(customerStr).Scan(&authorID)
		if err1 != nil {
			return 0, err1
		}

		message, token := createVerifyingString()

		err3 := sendMail(message)
		if err3 != nil {
			return 0, err3
		} else {
			setVerification(db, ctx, token, authorID)
		}

	}

	return 2, nil
}

func (s *PostgresStore) GetUserData(ctx context.Context, id int) (types.CustimerInfo, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	var userInfo types.CustimerInfo
	queryExStr := fmt.Sprintf(`SELECT name, secondname, mail , phone FROM customers WHERE id = '%d'`, id)

	err := db.GetContext(ctx, &userInfo, queryExStr)

	if err != nil {
		return userInfo, err
	}

	return userInfo, err
}

func (s *PostgresStore) Verify(ctx context.Context, token string) (int16, error) {
	db, _ := s.connect(ctx)
	defer db.Close()

	var verData types.VerInfo
	verStr := fmt.Sprintf(`SELECT id, expire, customerid FROM verification WHERE token = '%s'`, token)

	err := db.GetContext(ctx, &verData, verStr)

	if err != nil {
		return verData.CustomerId, err
	}

	if time.Now().After(verData.Expire) {
		return verData.CustomerId, errorsType.ErrExpire
	}
	query := fmt.Sprintf(`DELETE FROM verification WHERE id = %d`, verData.Id)
	_, err6 := db.ExecContext(ctx, query)
	if err6 != nil {
		return verData.CustomerId, err6
	}
	return verData.CustomerId, nil
}

func (s *PostgresStore) Login(ctx context.Context, mail string, pass string) (int16, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	var passDB types.LoginInfo
	var id int16
	queryExStr := fmt.Sprintf(`SELECT id, pass FROM customers WHERE mail = '%s'`, mail)

	err := db.GetContext(ctx, &passDB, queryExStr)

	if err != nil {
		return id, err
	} else {
		err2 := bcrypt.CompareHashAndPassword(passDB.Pass, []byte(pass))
		if err2 != nil {
			return id, err2
		} else {
			return passDB.Id, nil
		}
	}
}

func (s *PostgresStore) CreateOrder(ctx context.Context, orderData *types.CreateOrderType) (int, int16, string, error) {
	db, _ := s.connect(ctx)
	defer db.Close()

	var unregisterID int16
	unregisterStr := fmt.Sprintf(`INSERT INTO unregistercustomer (name, secondname, mail, phone, town, street, region, index, house, flat) VALUES 
		( '%s', '%s', '%s','%s', '%s','%s', '%s','%s', '%s','%s') RETURNING id`,
		orderData.PersonalData.Name,
		orderData.PersonalData.SecondName,
		orderData.PersonalData.Mail,
		orderData.PersonalData.Phone,
		orderData.Address.Town,
		orderData.Address.Street,
		orderData.Address.Region,
		orderData.Address.Index,
		orderData.Address.House,
		orderData.Address.Flat,
	)
	err := db.QueryRow(unregisterStr).Scan(&unregisterID)
	if err != nil {
		return 0, 0, "", err
	}

	currentTime := time.Now()
	hashedStr := fmt.Sprint(xxhash.Sum64([]byte((currentTime.String() + fmt.Sprint(orderData.PreorderId)))))
	orderStr := fmt.Sprintf(`INSERT INTO orders ( orderdate, status, deliveryPrice, deliveryType, unregistercustomerid, hash) VALUES 
		( '%s', '%s', '%d','%s', '%d', '%s') RETURNING id`,
		currentTime.Format("2006-01-02"),
		"pending",
		orderData.Delivery.DeliveryPrice,
		"cdek",
		unregisterID,
		hashedStr,
	)

	var orderID int
	err1 := db.QueryRow(orderStr).Scan(&orderID)
	if err1 != nil {
		return 0, 0, "", err1
	} else {
		var preorderId int
		query := fmt.Sprintf(`SELECT id FROM preorder WHERE hashUrl = '%s'`, orderData.PreorderId)
		err := db.GetContext(ctx, &preorderId, query)
		if err != nil {
			return 0, 0, "", err
		} else {
			type Products struct {
				Size      string `db:"size"`
				Quantity  int    `db:"quantity"`
				Productid int    `db:"productid"`
			}
			query := fmt.Sprintf("SELECT productid, size, quantity FROM  preorderItems WHERE  orderid=%d", preorderId)
			var products []Products
			err := db.SelectContext(ctx, &products, query)
			if err != nil {
				return 0, 0, "", err
			} else {
				for _, product := range products {
					orderItemStr := fmt.Sprintf(`INSERT INTO orderItems (productid, quantity, size, orderid) VALUES 
						('%d', '%d', '%s', '%d')`,
						product.Productid,
						product.Quantity,
						product.Size,
						orderID,
					)
					_, err := db.Exec(orderItemStr)
					if err != nil {
						return 0, 0, "", err
					}
				}
				deleteQuery := fmt.Sprintf(`DELETE FROM preorderItems WHERE  orderid=%d`, preorderId)
				_, err6 := db.ExecContext(ctx, deleteQuery)
				if err6 != nil {
					return 0, 0, "", err6
				}
				return orderID, unregisterID, hashedStr, nil
			}
		}
	}
}

func (s *PostgresStore) ChangePass(ctx context.Context, newPass string, oldPass string, id int) error {
	db, _ := s.connect(ctx)
	defer db.Close()
	var pass []byte
	queryExStr := fmt.Sprintf(`SELECT pass FROM customers WHERE id = %d`, id)
	err := db.GetContext(ctx, &pass, queryExStr)
	if err != nil {
		return err
	}
	err2 := bcrypt.CompareHashAndPassword(pass, []byte(oldPass))
	if err2 == bcrypt.ErrMismatchedHashAndPassword {
		fmt.Println("The password does not match the hash")
		return errorsType.PassCoincide
	} else if err2 != nil {
		return err2
	}
	hashedPassword, err4 := bcrypt.GenerateFromPassword([]byte(newPass), bcrypt.DefaultCost)
	if err4 != nil {
		panic(err4)
	}
	setNewPassStr := fmt.Sprintf(`UPDATE customers SET pass = '%s' WHERE id=%d`, hashedPassword, id)
	_, err1 := db.ExecContext(ctx, setNewPassStr)
	if err1 != nil {
		return err1
	}
	return nil
}
func (s *PostgresStore) ChangeForgetPass(ctx context.Context, newPass string, id int) error {
	db, _ := s.connect(ctx)
	defer db.Close()

	hashedPassword, err4 := bcrypt.GenerateFromPassword([]byte(newPass), bcrypt.DefaultCost)
	if err4 != nil {
		panic(err4)
	}
	setNewPassStr := fmt.Sprintf(`UPDATE customers SET pass = '%s' WHERE id=%d`, hashedPassword, id)
	_, err1 := db.ExecContext(ctx, setNewPassStr)
	if err1 != nil {
		return err1
	}
	return nil
}
func (s *PostgresStore) UpdateForgetPass(ctx context.Context, mail string) error {
	db, _ := s.connect(ctx)
	defer db.Close()
	var exist bool
	queryExStr := fmt.Sprintf(`SELECT EXISTS (SELECT 1 FROM customers WHERE mail = '%s' )`, mail)
	err := db.GetContext(ctx, &exist, queryExStr)

	if err != nil {
		return err
	}
	if exist {
		var id int16
		queryExStr := fmt.Sprintf(`SELECT id FROM customers WHERE mail = '%s'`, mail)
		err := db.GetContext(ctx, &id, queryExStr)
		if err != nil {
			return err
		} else {
			message, token := createChangeForgetPass()
			err := sendMail(message)
			if err != nil {
				return err
			} else {
				setVerification(db, ctx, token, int(id))
			}
		}
	} else {
		return errorsType.NotExist
	}

	return nil
}

func (s *PostgresStore) GetOrderData(ctx context.Context, hash string) (types.OrderData, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	var orderInfo types.OrderInfo
	var orderData types.OrderData
	//queryExStr := fmt.Sprintf(`SELECT EXISTS (SELECT 1 FROM orders WHERE hash = '%s' )`, hash)
	query := fmt.Sprintf(`SELECT id, hash, status, customerId, unregistercustomerid FROM orders WHERE hash = '%s'`, hash)

	err := db.GetContext(ctx, &orderInfo, query)
	if err != nil {
		return orderData, err
	} else {
		snickers, err := s.GetCartDataFromOrderById(ctx, orderInfo.Id)
		if err != nil {
			return orderData, err
		}
		if orderInfo.UnregisterCostumerId != nil {
			var unregisterCustomerData types.UnregisterCustomerType
			unregisterStr := fmt.Sprintf(`SELECT name, secondname, mail, phone, town, street, region, index, house, flat FROM unregistercustomer WHERE id=%d`, *orderInfo.UnregisterCostumerId)
			err := db.GetContext(ctx, &unregisterCustomerData, unregisterStr)
			if err != nil {
				return orderData, err
			}
			orderData.State = orderInfo.Status
			orderData.UserInfo = unregisterCustomerData
			orderData.SnickersCart = snickers
			orderData.OrderId = orderInfo.Id
			return orderData, nil

		} else {
			return orderData, err
		}
	}
}

func (s *PostgresStore) GetOrderDataByMail(ctx context.Context, mail string, id int) (types.OrderData, string, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	var orderInfo types.OrderInfo
	var orderData types.OrderData
	//queryExStr := fmt.Sprintf(`SELECT EXISTS (SELECT 1 FROM orders WHERE hash = '%s' )`, hash)
	query := fmt.Sprintf(`SELECT id, status, customerId, hash, unregistercustomerid FROM orders WHERE id = %d`, id)

	err := db.GetContext(ctx, &orderInfo, query)
	if err != nil {
		return orderData, "", err
	} else {
		var exist bool
		queryExStr := fmt.Sprintf(`SELECT EXISTS (SELECT 1 FROM unregistercustomer WHERE id = %d AND mail = '%s')`, *orderInfo.UnregisterCostumerId, mail)
		err := db.GetContext(ctx, &exist, queryExStr)
		if err != nil {
			return orderData, "", err
		}
		if !exist {
			return orderData, "", err
		} else {
			var unregisterCustomerData types.UnregisterCustomerType
			unregisterStr := fmt.Sprintf(`SELECT name, secondname, mail, phone, town, street, region, index, house, flat FROM unregistercustomer WHERE id=%d`, *orderInfo.UnregisterCostumerId)
			err := db.GetContext(ctx, &unregisterCustomerData, unregisterStr)
			if err != nil {
				return orderData, "", err
			}
			orderData.State = orderInfo.Status
			orderData.UserInfo = unregisterCustomerData
			orderData.OrderId = orderInfo.Id
			return orderData, orderInfo.Hash, nil
		}
	}
}

func (s *PostgresStore) GetUnregisterCustomerData(ctx context.Context, id int) (types.UnregisterCustomerType, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	var unregisterCustomerData types.UnregisterCustomerType
	unregisterStr := fmt.Sprintf(`SELECT name, secondname, mail, phone, town, street, region, index, house, flat FROM unregistercustomer WHERE id=%d`, id)
	err := db.GetContext(ctx, &unregisterCustomerData, unregisterStr)
	if err != nil {
		return unregisterCustomerData, err
	}
	return unregisterCustomerData, nil
}

func (s *PostgresStore) CreateUniqueCustomer(ctx context.Context) (int, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	currentTime := time.Now()
	dataStr := fmt.Sprintf(`INSERT INTO uniquecustomers (creationTime, history) VALUES ( '%s', '{}') RETURNING id`, currentTime.Format("2006-01-02"))
	var uniqueCustomerId int
	err := db.GetContext(ctx, &uniqueCustomerId, dataStr)
	if err != nil {
		return uniqueCustomerId, err
	}
	return uniqueCustomerId, nil
}

func (s *PostgresStore) SetSnickersHistory(ctx context.Context, idSnickers int, idCustomer int) error {
	db, _ := s.connect(ctx)
	defer db.Close()

	var history []int32

	// Запрос для получения массива history
	dataStr := `SELECT history FROM uniquecustomers WHERE id = $1`

	// Получаем массив history

	err := db.QueryRowContext(ctx, dataStr, idCustomer).Scan(pq.Array(&history))
	if err != nil {
		fmt.Printf("Ошибка при получении массива: %v\n", err)
		return err
	}
	history = append(history, int32(idSnickers))

	queryUpdate := `UPDATE uniquecustomers SET history = $1 WHERE id = $2`
	_, err1 := db.ExecContext(ctx, queryUpdate, pq.Array(history), idCustomer)
	if err1 != nil {
		return err1
	}

	return err
}

func (s *PostgresStore) GetSnickersHistory(ctx context.Context, idCustomer int) ([]types.SnickersSearch, error) {
	db, _ := s.connect(ctx)
	defer db.Close()

	var history []int32

	// Запрос для получения массива history
	dataStr := `SELECT history FROM uniquecustomers WHERE id = $1`

	// Получаем массив history

	err := db.QueryRowContext(ctx, dataStr, idCustomer).Scan(pq.Array(&history))
	fmt.Println(history, "fwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww")
	keys := make(map[int32]bool)
	list := []int32{}

	// Пройдем по срезу и добавим уникальные значения в карту
	for _, entry := range history {
		if _, value := keys[entry]; !value {
			keys[entry] = true
			list = append(list, entry)
		}
	}
	fmt.Println(pq.Array(list), "fk;dsf;sdkfsdflk")
	var data []types.SnickersSearch
	query := `SELECT snickers.minPrice, snickers.id,image_path, name, firm ,maxdiscprice FROM snickers LEFT JOIN discount ON snickers.id = productid WHERE snickers.id = ANY($1)`
	err1 := db.SelectContext(ctx, &data, query, pq.Array(list))
	if err1 != nil {
		fmt.Println(data, err1, "fk;dsf;sdkfsdflk")
		return data, err1
	}

	return data, err
}

func (s *PostgresStore) GetDiscounts(ctx context.Context, max int) ([]types.SnickersSearch, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	var data []types.SnickersSearch
	query := `SELECT snickers.minPrice, snickers.id,image_path, name, firm ,maxdiscprice FROM snickers JOIN discount ON snickers.id = productid`
	err1 := db.SelectContext(ctx, &data, query)
	if err1 != nil {
		return data, err1
	}

	return data, nil
}

type Interface interface {
	GetFirms(ctx context.Context) ([]types.FirmsResult, error)
	GetSnickersByFirmName(ctx context.Context) ([]types.Snickers, error)
	GetSnickersByLineName(ctx context.Context) ([]types.SnickersLine, error)
	GetMainPage(ctx context.Context) ([]types.MainPage, error)
	GetSnickersInfoById(ctx context.Context, id string) (types.SnickersInfo, error)
	GetCartData(ctx context.Context, hash string) ([]types.SnickersCart, error)
	GetSnickersByName(ctx context.Context, name string, max int) ([]types.SnickersSearch, error)
	GetSnickersAndFiltersByString(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (types.SnickersPageAndFilters, error)
	GetFiltersByString(ctx context.Context, name string) (types.Filter, error)
	CountTest(ctx context.Context) ([]Count, error)
	GetCollection(ctx context.Context, names []string, size int, page int) (map[string][]types.SnickersSearch, error)
	GetSoloCollection(ctx context.Context, name string, size int, page int) ([]types.SnickersSearch, error)
	CreatePreorder(ctx context.Context, id int, info map[string]string) (string, error)
	UpdatePreorder(ctx context.Context, id int, info map[string]string, hash string) (int, error)
	GetCartCount(ctx context.Context, hash string) (int, error)
	DeleteCartData(ctx context.Context, preorderid int) error
	RegisterUser(ctx context.Context, pass string, mail string) (int, error)
	CreateOrder(ctx context.Context, orderData *types.CreateOrderType) (int, int16, string, error)
	GetSnickersByString(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (types.SnickersPage, error)
	Login(ctx context.Context, name string, pass string) (int16, error)
	GetUserData(ctx context.Context, id int) (types.CustimerInfo, error)
	Verify(ctx context.Context, token string) (int16, error)
	ChangePass(ctx context.Context, newPass string, oldPass string, id int) error
	UpdateForgetPass(ctx context.Context, mail string) error
	ChangeForgetPass(ctx context.Context, newPass string, id int) error
	GetUnregisterCustomerData(ctx context.Context, id int) (types.UnregisterCustomerType, error)
	GetOrderData(ctx context.Context, hash string) (types.OrderData, error)
	GetCartDataFromOrderById(ctx context.Context, id int) ([]types.SnickersCart, error)
	CreateUniqueCustomer(ctx context.Context) (int, error)
	GetCartDataFromOrderByHash(ctx context.Context, hash string) ([]types.SnickersCart, error)
	GetOrderDataByMail(ctx context.Context, mail string, id int) (types.OrderData, string, error)
	SetSnickersHistory(ctx context.Context, idSnickers int, idCustomer int) error
	GetSnickersHistory(ctx context.Context, idCustomer int) ([]types.SnickersSearch, error)
	GetDiscounts(ctx context.Context, max int) ([]types.SnickersSearch, error)
}
