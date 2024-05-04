package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"time"

	"github.com/cespare/xxhash"
	"github.com/mrkrabopl1/go_db/logger"
	"github.com/mrkrabopl1/go_db/server/contextKeys"
	"github.com/mrkrabopl1/go_db/types"
)

type Snickers2 struct {
	Data []types.Snickers `db:"data"`
	Line string           `db:"line"`
}

// type SnickersLine struct {
// 	Line string `db:"firm"`
// 	Line []Snickers `db:"line"`
// }

func (s *PostgresStore) GetFirms(ctx context.Context) ([]types.FirmsResult, error) {
	fmt.Println("connect db")

	db, err1 := s.connect(ctx)
	fmt.Println("connect(((((((((((((((((((((((())))))))))))))))))))))))", err1, db)
	defer db.Close()

	if err1 != nil {
		fmt.Println("erroe to db connection", err1)
	}

	query := `
	SELECT firm, array_agg(DISTINCT line) AS array_of_data
	FROM "snickers"
	GROUP BY firm`
	var results []types.FirmsResult

	err := db.SelectContext(
		ctx,
		&results,
		query)
	if err != nil {
		fmt.Println(err, "jhbljlkj;lj;khugl;j;hlugkh;ojlugkgl")
		return nil, err
	}
	return results, err
}

func (s *PostgresStore) GetSnickersByFirmName(ctx context.Context) ([]types.Snickers, error) {
	logger.Debug("GetSnickersByFirmName")
	db, _ := s.connect(ctx)
	defer db.Close()
	firm := ctx.Value(contextKeys.QueryKey)

	//query := `SELECT name, image_path, id	FROM snickers WHERE firm='nike'`

	query := fmt.Sprintf("SELECT name, image_path, snickers.id, value  FROM snickers LEFT JOIN discount ON snickers.id = productid WHERE firm = '%s'", firm)

	defer db.Close()

	// rows, err := dbx.Queryx(query)
	// if err != nil {
	// 	log.Fatalf("Error executing query: %v", err)
	// }
	// defer rows.Close()

	// // Iterate over the results
	var results []types.Snickers

	err1 := db.SelectContext(
		ctx,
		&results,
		query,
	)

	if err1 != nil {
		logger.Error(err1.Error())
	}
	// if err != nil {
	// 	// if err != sql.ErrNoRows {
	// 	// 	return Movie{}, err
	// 	// }

	// 	// return Movie{}, &RecordNotFoundError{}

	// 	fmt.Println(err)
	// 	//return map1, nil
	// }

	fmt.Println(results)

	return results, err1
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
		fmt.Println(err1)
	}

	fmt.Println(results)
	end := time.Now()
	elapsed := end.Sub(start)
	fmt.Printf("YourFunction took %s\n", elapsed)
	return results, err1
}

func (s *PostgresStore) jsonAgregation(ctx context.Context, query string) ([]Snickers2, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	start := time.Now()
	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		log.Fatal(err)
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
			log.Fatal(err)
		}

		// Unmarshal JSON data into slice of Sale structs
		if err := json.Unmarshal([]byte(salesData), &sa.Data); err != nil {
			log.Fatal(err)
		}

		// Append the struct to the slice
		salesAggregations = append(salesAggregations, sa)
	}
	if err != nil {
		log.Fatal(err)
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
		fmt.Println(err1)
		return filter, err1
	}

	fmt.Println(spFilter)

	filter.SizePriceFilter = spFilter

	rows, err2 := db.QueryContext(ctx, query2)

	firmFilter2 := make(map[string]int)

	for rows.Next() {
		var firm string
		var count int // To hold JSON data as string

		// Scan values into struct fields
		if err := rows.Scan(&firm, &count); err != nil {
			log.Fatal(err)
		}

		firmFilter2[firm] = count
	}

	fmt.Println(firmFilter2)

	//err2 := s.dbx.SelectContext(ctx, &firmFilter, query2)

	if err2 != nil {
		fmt.Println(err2)
		return filter, err1
	}
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
				firmStr = fmt.Sprintf(`AND (firm = '%s'`, firm)
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
			fmt.Println(err1)
			return filter, err1
		}
	}

	//var firmFilter []FirmFilter
	query2 := fmt.Sprintf(`SELECT firm,
	COUNT(id)  count
	FROM snickers WHERE name ILIKE '%%%s%%'	GROUP BY  firm`, name)

	var spFilter types.SizePriceFilter

	fmt.Println(spFilter)

	filter.SizePriceFilter = spFilter

	rows, _ := db.QueryContext(ctx, query2)

	firmFilter2 := make(map[string]int)

	for rows.Next() {
		var firm string
		var count int // To hold JSON data as string

		// Scan values into struct fields
		if err := rows.Scan(&firm, &count); err != nil {
			log.Fatal(err)
		}

		firmFilter2[firm] = count
	}

	fmt.Println(firmFilter2)

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

	fmt.Println(filters.Firms)

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
	fmt.Println(filterStr)
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
	filterString := createFilterQuery(filters)
	query1 := fmt.Sprintf(`SELECT COUNT(id) FROM snickers  WHERE name ILIKE '%%%s%%' %s`, name, filterString)
	fmt.Println(query1)
	err1 := db.GetContext(ctx, &count, query1)
	if err1 != nil {
		fmt.Println(err1)
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
	var data []types.SnickersSearch

	err := db.SelectContext(ctx, &data, query)
	if err != nil {
		fmt.Println(err)
	}

	var finalData = types.SnickersPage{
		SnickersPageInfo: data,
		PageSize:         int(pageSize),
	}
	return finalData, nil
}
func (s *PostgresStore) GetSnickersAndFiltersByString(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (types.SnickersPageAndFilters, error) {

	db, _ := s.connect(ctx)
	defer db.Close()
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
		fmt.Println(err1)
	}

	var pageSize = math.Ceil(float64(count) / float64(size))

	var offset = (page - 1) * size

	var limit = size * page

	query := fmt.Sprintf("SELECT snickers.id, image_path, name, firm, snickers.minprice , maxdiscprice FROM snickers  LEFT JOIN discount ON snickers.id = productid WHERE name ILIKE '%%%s%%' %s  %s LIMIT %d OFFSET %d", name, filterString, orderedString, limit, offset)
	var data []types.SnickersSearch

	err := db.SelectContext(ctx, &data, query)
	if err != nil {
		fmt.Println(err)
	}

	fmt.Println(data)

	filter, fError := s.GetFiltersByString(ctx, name)

	if fError != nil {
		fmt.Println(fError)
	}

	var finalData = types.SnickersPageAndFilters{
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
		fmt.Println(err)
	}

	fmt.Println(data)

	return data, nil
}

func (s *PostgresStore) GetSnickersInfoById(ctx context.Context) (types.SnickersInfo, error) {
	var data types.SnickersInfo
	db, _ := s.connect(ctx)
	strId := ctx.Value(contextKeys.QueryKey)

	defer db.Close()

	query := fmt.Sprintf("SELECT info,image_path, name , value FROM snickers  LEFT JOIN discount ON snickers.id = productid WHERE snickers.id =%s", strId)
	//query := "SELECT image_path, name FROM snickers WHERE id =1"
	err := db.GetContext(ctx, &data, query)
	if err != nil {
		fmt.Println(err)
	}

	return data, nil
}
func (s *PostgresStore) GetCollection(ctx context.Context, name string, size int, page int) ([]types.SnickersSearch, error) {

	end := page * size
	offset := (page - 1) * size
	db, _ := s.connect(ctx)
	var data []types.SnickersSearch
	query := fmt.Sprintf("SELECT   COALESCE(discount.minprice, snickers.minprice) AS minprice, snickers.id,image_path, name, firm , maxdiscprice  FROM snickers LEFT JOIN discount ON snickers.id = productid WHERE firm = '%s' OR line = '%s' LIMIT %d  OFFSET %d ", name, name, end, offset)
	fmt.Println(query)
	defer db.Close()

	err := db.SelectContext(
		ctx,
		&data,
		query)
	if err != nil {
		// if err != sql.ErrNoRows {
		// 	return Movie{}, err
		// }

		// return Movie{}, &RecordNotFoundError{}

		fmt.Println(err)
		//return map1, nil
	}

	return data, nil
}
func (s *PostgresStore) GetSnickersByName(ctx context.Context, name string, max int) ([]types.SnickersSearch, error) {
	db, _ := s.connect(ctx)
	var data []types.SnickersSearch
	query := fmt.Sprintf("SELECT snickers.minPrice, snickers.id,image_path, name, firm ,maxdiscprice FROM snickers LEFT JOIN discount ON snickers.id = productid WHERE name ILIKE '%%%s%%' LIMIT %d", name, max)
	fmt.Println(query)
	defer db.Close()

	err := db.SelectContext(
		ctx,
		&data,
		query)
	if err != nil {
		// if err != sql.ErrNoRows {
		// 	return Movie{}, err
		// }

		// return Movie{}, &RecordNotFoundError{}

		fmt.Println(err)
		//return map1, nil
	}

	fmt.Println(data)

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
		logger.Error(err.Error())
		return dataQuery, err
	} else {
		query := fmt.Sprintf("SELECT id, productid AS prid, size, quantity FROM  preorderItems WHERE  orderid=%d", idData)
		err := db.SelectContext(ctx, &snickersPreorder, query)
		if err != nil {
			logger.Error(err.Error())
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
				logger.Error(err.Error())
				return dataQuery, err
			}
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

	fmt.Println(currentTime.Format("2006-01-02"))

	dataStr := fmt.Sprintf(`INSERT INTO preorder (hashurl, updatetime) VALUES ('%s', '%s') RETURNING id`, fmt.Sprint(hashedStr), currentTime.Format("2006-01-02"))
	fmt.Println(dataStr)
	var authorID int

	var size string

	if val, ok := info["size"]; ok {
		size = val
	}

	err := db.QueryRow(dataStr).Scan(&authorID)
	if err != nil {
		fmt.Println("err1", err)
	}

	prItStr := fmt.Sprintf(`INSERT INTO preorderItems (orderid, productid, size, quantity) VALUES (%d, %d, '%s', 1) RETURNING id`, authorID, id, size)

	_, err1 := db.Exec(prItStr)
	if err1 != nil {
		fmt.Println(err)
	}

	fmt.Println(authorID)

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
		fmt.Println(err)
		return 0, err
	} else {
		connStr := fmt.Sprintf("orderid=%d AND size='%s' AND productid='%d'", idData, size, id)
		qStr := fmt.Sprintf("SELECT quantity FROM preorderitems WHERE %s", connStr)
		fmt.Println(qStr)
		fmt.Println(idData)
		// Check if the row exists
		var existingValue int
		err = db.QueryRow(qStr).Scan(&existingValue)
		if err == sql.ErrNoRows {
			fmt.Println("insert")
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
		fmt.Println(err)
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
		logger.Error(err.Error())
		return 0, err
	} else {
		query := fmt.Sprintf("SELECT coalesce(SUM(quantity),0) FROM  preorderItems WHERE  orderid=%d", idData)
		var quantity int
		err := db.GetContext(ctx, &quantity, query)
		if err != nil {
			logger.Error(err.Error())
			return 0, err
		} else {
			return quantity, nil
		}
	}
}

func (s *PostgresStore) CountTest(ctx context.Context) ([]Count, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	var data []Count

	//query := "SELECT SUM(CASE WHEN firm = 'nike' THEN 1 ELSE 0 END) AS name_data, SUM(CASE WHEN name ILIKE '%n%' THEN 1 ELSE 0 END) AS name_data1 FROM snickers"

	//query := `SELECT name FROM snickers WHERE "8.5" IS NOT NULL`

	//query := `SELECT CASE WHEN id = 1 THEN "10" || ', ' || "11"  WHEN id = 2 THEN  "11" || '' END AS result FROM snickers WHERE id = 1 OR id = 2`
	query := `SELECT CASE WHEN id = 1 THEN  ARRAY["10", "11"] WHEN id = 2 THEN ARRAY["11"]  END AS result FROM snickers WHERE id = 1 OR id = 2`

	err := db.SelectContext(
		ctx,
		&data,
		query)
	if err != nil {
		logger.Error(err.Error())
	}
	return data, nil
}

func (s *PostgresStore) CreateOrder(ctx context.Context, orderData *types.CreateOrderType) (int, error) {
	db, _ := s.connect(ctx)
	defer db.Close()
	fmt.Println("orderId")
	customStr := fmt.Sprintf(`INSERT INTO customers (name, secondname, mail, phone, country, town, postindex) VALUES 
	('%s', '%s', '%s', '%s','%s', '%s', '%d') RETURNING id`,
		orderData.PersonalData.Name,
		orderData.PersonalData.SecondName,
		orderData.PersonalData.Mail,
		orderData.PersonalData.Phone,
		"Russia",
		orderData.Address.Address,
		orderData.Address.PostIndex,
	)
	fmt.Println(customStr)
	var customerID int
	err := db.QueryRow(customStr).Scan(&customerID)
	if err != nil {
		fmt.Println("err1", err)
		return 0, err
	} else {
		currentTime := time.Now()
		orderStr := fmt.Sprintf(`INSERT INTO orders (customerid, orderdate, status, deliveryPrice, deliveryType) VALUES 
		('%d', '%s', '%s', '%d','%s') RETURNING id`,
			customerID,
			currentTime.Format("2006-01-02"),
			"pending",
			orderData.Delivery.DeliveryPrice,
			"cdek",
		)
		var orderID int
		err := db.QueryRow(orderStr).Scan(&orderID)
		if err != nil {
			fmt.Println("err1", err)
			return 0, err
		} else {
			var preorderId int
			query := fmt.Sprintf(`SELECT id FROM preorder WHERE hashUrl = '%s'`, orderData.PreorderId)
			err := db.GetContext(ctx, &preorderId, query)
			if err != nil {
				fmt.Println(err)
				return 0, err
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
					fmt.Println("select null", err)
					return 0, err
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
							fmt.Println("select null", err)
						}
					}
					return orderID, nil
				}
			}
		}
	}
}

type Interface interface {
	GetFirms(ctx context.Context) ([]types.FirmsResult, error)
	GetSnickersByFirmName(ctx context.Context) ([]types.Snickers, error)
	GetSnickersByLineName(ctx context.Context) ([]types.SnickersLine, error)
	GetMainPage(ctx context.Context) ([]types.MainPage, error)
	GetSnickersInfoById(ctx context.Context) (types.SnickersInfo, error)
	GetCartData(ctx context.Context, hash string) ([]types.SnickersCart, error)
	GetSnickersByName(ctx context.Context, name string, max int) ([]types.SnickersSearch, error)
	GetSnickersAndFiltersByString(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (types.SnickersPageAndFilters, error)
	GetFiltersByString(ctx context.Context, name string) (types.Filter, error)
	CountTest(ctx context.Context) ([]Count, error)
	GetCollection(ctx context.Context, name string, size int, page int) ([]types.SnickersSearch, error)
	CreatePreorder(ctx context.Context, id int, info map[string]string) (string, error)
	UpdatePreorder(ctx context.Context, id int, info map[string]string, hash string) (int, error)
	GetCartCount(ctx context.Context, hash string) (int, error)
	DeleteCartData(ctx context.Context, preorderid int) error
	CreateOrder(ctx context.Context, orderData *types.CreateOrderType) (int, error)
	GetSnickersByString(ctx context.Context, name string, page int, size int, filters types.SnickersFilterStruct, orderedType int) (types.SnickersPage, error)
}
