package query

import (
	"fmt"
	"strings"

	"github.com/mrkrabopl1/go_db/types"
)

func createSnickersFilter(filters types.SnickersFilterStruct) string {
	var where strings.Builder
	fmt.Println(filters)

	// Фильтр по размерам (только для snickers)
	if len(filters.Sizes) > 0 {
		where.WriteString(" AND (")
		for i, size := range filters.Sizes {
			if i > 0 {
				where.WriteString(" OR ")
			}
			fmt.Fprintf(&where, `"%s" IS NOT NULL`, sanitize(size))
		}
		where.WriteString(")")
	}

	// Фильтр по брендам
	addFirmsFilter(&where, filters.Firms)

	// Фильтр по цене
	addPriceFilter(&where, "snickers", filters.Price)

	fmt.Println("fm;ldsmf", where)
	return where.String()
}

func createClothesFilter(filters types.SnickersFilterStruct) string {
	var where strings.Builder
	fmt.Println(filters)

	// Фильтр по размерам (только для snickers)
	if len(filters.Sizes) > 0 {
		where.WriteString(" AND (")
		for i, size := range filters.Sizes {
			if i > 0 {
				where.WriteString(" OR ")
			}
			fmt.Fprintf(&where, `"%s" IS NOT NULL`, sanitize(size))
		}
		where.WriteString(")")
	}

	// Фильтр по брендам
	addFirmsFilter(&where, filters.Firms)

	// Фильтр по цене
	addPriceFilter(&where, "clothes", filters.Price)

	fmt.Println("fm;ldsmf", where)
	return where.String()
}

func addFirmsFilter(b *strings.Builder, firms []string) {
	if len(firms) == 0 {
		return
	}

	b.WriteString(" AND (")
	for i, firm := range firms {
		if i > 0 {
			b.WriteString(" OR ")
		}
		fmt.Fprintf(b, "firm = '%s'", sanitize(firm))
	}
	b.WriteString(")")
}
func addPriceFilter(b *strings.Builder, table string, price []float32) {
	if len(price) != 2 {
		return
	}
	fmt.Fprintf(b,
		" AND %s.minprice >= %d AND %s.maxprice <= %d",
		table, int(price[0]), table, int(price[1]))
}
func sanitize(s string) string {
	return strings.ReplaceAll(s, "'", "''")
}

func createSolomerchFilter(filters types.SnickersFilterStruct) string {
	var where strings.Builder

	// Фильтр по брендам
	addFirmsFilter(&where, filters.Firms)

	// Фильтр по цене (используем price вместо minprice/maxprice)
	if len(filters.Price) == 2 {
		fmt.Fprintf(&where,
			" AND solomerch.minprice BETWEEN %d AND %d",
			int(filters.Price[0]),
			int(filters.Price[1]))
	}

	return where.String()
}

func createOrderString(orderType int) string {
	var orderedString = ""
	if orderType == 1 {
		orderedString = "ORDER BY price ASC"
	} else {
		orderedString = "ORDER BY price DESC"
	}
	return orderedString
}

func GetCountIdByFiltersAndFirmQuery(name string, filters types.SnickersFilterStruct) string {
	snickersFilter := createSnickersFilter(filters)

	fmt.Println(snickersFilter)
	merchFilter := createSolomerchFilter(filters)
	clothesFilter := createClothesFilter(filters)
	return fmt.Sprintf(`
 		SELECT (
            (SELECT COUNT(id) FROM snickers WHERE name ILIKE '%%%s%%' %s) +
            (SELECT COUNT(id) FROM solomerch WHERE name ILIKE '%%%s%%' %s) +
			(SELECT COUNT(id) FROM clothes WHERE name ILIKE '%%%s%%' %s)
        ) AS total_count`,
		name, snickersFilter,
		name, merchFilter,
		name, clothesFilter,
	)
}

func GetOrderedProductsByFiltersQuery(name string, filters types.SnickersFilterStruct, orderType int, limit int, offset int) string {
	filterSnickersString := createSnickersFilter(filters)
	filterSoloMerchString := createSolomerchFilter(filters)
	orderString := createOrderString(orderType)
	return fmt.Sprintf(`
        (SELECT snickers.id, image_path, name, firm, snickers.minprice  AS price, maxdiscprice FROM snickers  LEFT JOIN discount ON snickers.id = productid WHERE name ILIKE '%%%s%%' %s)
        UNION ALL 
		(SELECT solomerch.id, image_path, name, firm, solomerch.minprice  AS price, maxdiscprice FROM solomerch  LEFT JOIN discount ON solomerch.id = productid WHERE name ILIKE '%%%s%%' %s)
		UNION ALL 
		(SELECT clothes.id, image_path, name, firm, clothes.minprice , clothes FROM clothes  LEFT JOIN discount ON clothes.id = productid WHERE name ILIKE '%%%s%%' %s)
		%s LIMIT %d OFFSET %d`,
		name, filterSnickersString, name, filterSoloMerchString, orderString, limit, offset)
}

func GetOrderedSnickersByFString(name string, filters types.SnickersFilterStruct, orderType int, limit int, offset int) string {
	filterString := createSnickersFilter(filters)
	orderString := createOrderString(orderType)
	return fmt.Sprintf(`SELECT snickers.id, image_path, name, firm, snickers.minprice AS price , maxdiscprice FROM snickers  LEFT JOIN discount ON snickers.id = productid WHERE name ILIKE '%%%s%%' %s  %s LIMIT %d OFFSET %d`, name, filterString, orderString, limit, offset)
}

func GetCollections(names []string, end int, offset int) string {

	// Build placeholders for the IN clause
	namesStr := ""
	for i, name := range names {
		if i == 0 {
			namesStr += fmt.Sprintf("'%s'", name)
		} else {
			namesStr += fmt.Sprintf(",'%s'", name)
		}
	}
	return fmt.Sprintf(`
	(SELECT COALESCE(discount.minprice, snickers.minprice) AS minprice, snickers.id,  image_path, name, firm, maxdiscprice, line FROM snickers LEFT JOIN discount ON snickers.id = productid WHERE firm IN (%s) OR line IN (%s)) +
	UNION ALL 
	(SELECT COALESCE(discount.minprice, solomerch.minprice) AS minprice, solomerch.id,  image_path, name, firm, maxdiscprice AS NULL, line FROM solomerch LEFT JOIN discount ON solomerch.id = productid WHERE firm IN (%s) OR line IN (%s))+
	UNION ALL 
	(SELECT COALESCE(discount.minprice, clothes.minprice) AS minprice, clothes.id,  image_path, name, firm, maxdiscprice AS NULL, line FROM clothes LEFT JOIN discount ON clothes.id = productid WHERE firm IN (%s) OR line IN (%s))+
	%s LIMIT %d OFFSET %d`,
		namesStr, namesStr, namesStr, namesStr, end, offset)
}
