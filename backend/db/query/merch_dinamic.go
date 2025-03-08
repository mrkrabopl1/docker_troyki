package query

import (
	"fmt"

	"github.com/mrkrabopl1/go_db/types"
)

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
		minPriceStr := fmt.Sprintf(`AND snickers.minprice <= %d`, int(filters.Price[1]))
		priceStr += minPriceStr + " "
		maxPriceStr := fmt.Sprintf(`AND snickers.maxprice >= %d`, int(filters.Price[0]))
		priceStr += maxPriceStr + " "
		filterStr += priceStr
	}
	return filterStr
}

func createOrderString(orderType int) string {
	var orderedString = ""
	if orderType == 1 {
		orderedString = "ORDER BY snickers.minprice ASC"
	} else {
		orderedString = "ORDER BY snickers.minprice DESC"
	}
	return orderedString
}

func GetCountIdByFiltersAndFirmQuery(name string, filters types.SnickersFilterStruct) string {
	filterString := createFilterQuery(filters)
	return fmt.Sprintf(`SELECT COUNT(id) FROM snickers  WHERE name ILIKE '%%%s%%' %s`, name, filterString)
}

func GetOrderedSnickersByFiltersQuery(name string, filters types.SnickersFilterStruct, orderType int, limit int, offset int) string {
	filterString := createFilterQuery(filters)
	orderString := createOrderString(orderType)
	return fmt.Sprintf(`SELECT snickers.id, image_path, name, firm, snickers.minprice , maxdiscprice FROM snickers  LEFT JOIN discount ON snickers.id = productid WHERE name ILIKE '%%%s%%' %s  %s LIMIT %d OFFSET %d`, name, filterString, orderString, limit, offset)
}

func GetOrderedSnickersByFString(name string, filters types.SnickersFilterStruct, orderType int, limit int, offset int) string {
	filterString := createFilterQuery(filters)
	orderString := createOrderString(orderType)
	return fmt.Sprintf(`SELECT snickers.id, image_path, name, firm, snickers.minprice , maxdiscprice FROM snickers  LEFT JOIN discount ON snickers.id = productid WHERE name ILIKE '%%%s%%' %s  %s LIMIT %d OFFSET %d`, name, filterString, orderString, limit, offset)
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

	return fmt.Sprintf("SELECT COALESCE(discount.minprice, snickers.minprice) AS minprice, snickers.id,  image_path, name, firm, maxdiscprice, line FROM snickers LEFT JOIN discount ON snickers.id = productid WHERE firm IN (%s) OR line IN (%s) LIMIT %d OFFSET %d", namesStr, namesStr, end, offset)

}
