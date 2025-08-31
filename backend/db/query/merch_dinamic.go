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
	if len(filters.Sizes.Snickers) > 0 {
		sizeString := fmt.Sprintf(`AND COALESCE("%s") IS NOT NULL`, strings.Join(filters.Sizes.Snickers, `", "`))
		where.WriteString(sizeString)
	}
	if len(filters.Types) != 0 {
		typeStrings := make([]string, len(filters.Types))
		for i, t := range filters.Types {
			typeStrings[i] = fmt.Sprintf("%d", t)
		}
		where.WriteString(fmt.Sprintf(" AND type IN (%s)", strings.Join(typeStrings, ", ")))
	}

	// Фильтр по брендам
	addFirmsFilter(&where, filters.Firms)

	// Фильтр по цене
	addPriceFilter(&where, "snickers", filters.Price)

	fmt.Println("fm;ldsmf", where.String())
	return where.String()
}

func createClothesFilter(filters types.SnickersFilterStruct) string {
	var where strings.Builder
	fmt.Println(filters)

	// Фильтр по размерам (только для snickers)
	if len(filters.Sizes.Clothes) > 0 {
		sizeString := fmt.Sprintf(`AND COALESCE('%s') IS NOT NULL`, strings.Join(filters.Sizes.Clothes, `", "`))
		where.WriteString(sizeString)
	}
	if len(filters.Types) != 0 {
		typeStrings := make([]string, len(filters.Types))
		for i, t := range filters.Types {
			typeStrings[i] = fmt.Sprintf("%d", t)
		}
		where.WriteString(fmt.Sprintf(" AND type IN (%s)", strings.Join(typeStrings, ", ")))
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

func addHasSnickersSizeOrder(b *strings.Builder, firms []string) {
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
	fmt.Println(price, "dmdddddddddddddddddddddddddddddddddd")
	if len(price) != 2 {
		return
	}

	prStr := fmt.Sprintf(" AND %s.minprice >= %d AND %s.maxprice <= %d",
		table, int(price[0]), table, int(price[1]))
	fmt.Println(prStr)
	fmt.Fprintf(b,
		prStr)

	fmt.Println(b.String(), "dnlaskmd")
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
	if len(filters.Types) != 0 {
		typeStrings := make([]string, len(filters.Types))
		for i, t := range filters.Types {
			typeStrings[i] = fmt.Sprintf("%d", t)
		}
		where.WriteString(fmt.Sprintf(" AND type IN (%s)", strings.Join(typeStrings, ", ")))
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
	merchFilter := createSolomerchFilter(filters)
	clothesFilter := createClothesFilter(filters)
	if len(filters.Sizes.Snickers) == 0 && len(filters.Sizes.Clothes) == 0 {
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
	} else if len(filters.Sizes.Snickers) != 0 && len(filters.Sizes.Clothes) == 0 {
		return fmt.Sprintf(`SELECT COUNT(id) FROM snickers WHERE name ILIKE '%%%s%%' %s`,
			name, snickersFilter,
		)
	} else if len(filters.Sizes.Snickers) == 0 && len(filters.Sizes.Clothes) != 0 {
		return fmt.Sprintf(`SELECT COUNT(id) FROM clothes WHERE name ILIKE '%%%s%%' %s`,
			name, clothesFilter,
		)
	} else {
		return fmt.Sprintf(`
		SELECT (
			(SELECT COUNT(id) FROM snickers WHERE name ILIKE '%%%s%%' %s) +
			(SELECT COUNT(id) FROM clothes WHERE name ILIKE '%%%s%%' %s)
		) AS total_count`,
			name, snickersFilter,
			name, clothesFilter,
		)
	}
}

func getProductsFilterString(name string, filters types.SnickersFilterStruct) string {
	filterSnickersString := createSnickersFilter(filters)
	filterSoloMerchString := createSolomerchFilter(filters)
	filterClothesString := createClothesFilter(filters)

	if len(filters.Sizes.Snickers) == 0 && len(filters.Sizes.Clothes) == 0 {
		return fmt.Sprintf(`
 		        (SELECT pr.global_id, image_path, name, firm, snickers.minprice  AS price, maxdiscprice FROM snickers JOIN product_registry pr ON pr.internal_id = snickers.id AND pr.source_table = 'snickers'  LEFT JOIN discount ON snickers.id = productid WHERE name ILIKE '%%%s%%' %s)
        UNION ALL 
		(SELECT pr.global_id, image_path, name, firm, solomerch.minprice  AS price, maxdiscprice FROM solomerch JOIN product_registry pr ON pr.internal_id = solomerch.id AND pr.source_table = 'solomerch'  LEFT JOIN discount ON solomerch.id = productid WHERE name ILIKE '%%%s%%' %s)
		UNION ALL 
		(SELECT pr.global_id, image_path, name, firm, clothes.minprice AS price , maxdiscprice FROM clothes JOIN product_registry pr ON pr.internal_id = clothes.id AND pr.source_table = 'clothes'  LEFT JOIN discount ON clothes.id = productid WHERE name ILIKE '%%%s%%' %s)`,
			name, filterSnickersString, name, filterSoloMerchString, name, filterClothesString)
	} else if len(filters.Sizes.Snickers) != 0 && len(filters.Sizes.Clothes) == 0 {
		return fmt.Sprintf(`(SELECT pr.global_id, image_path, name, firm, snickers.minprice  AS price, maxdiscprice FROM snickers JOIN product_registry pr ON pr.internal_id = snickers.id AND pr.source_table = 'clothes'  LEFT JOIN discount ON snickers.id = productid WHERE name ILIKE '%%%s%%' %s)`,
			name, filterSnickersString,
		)
	} else if len(filters.Sizes.Snickers) == 0 && len(filters.Sizes.Clothes) != 0 {
		return fmt.Sprintf(`(SELECT pr.global_id, image_path, name, firm, clothes.minprice AS price , maxdiscprice FROM clothes JOIN product_registry pr ON pr.internal_id = clothes.id AND pr.source_table = 'clothes'  LEFT JOIN discount ON clothes.id = productid WHERE name ILIKE '%%%s%%' %s)`,
			name, filterClothesString,
		)
	} else {
		return fmt.Sprintf(`
 		        (SELECT pr.global_id, image_path, name, firm, snickers.minprice  AS price, maxdiscprice FROM snickers JOIN product_registry pr ON pr.internal_id = snickers.id AND pr.source_table = 'snickers'  LEFT JOIN discount ON snickers.id = productid WHERE name ILIKE '%%%s%%' %s)
		UNION ALL 
		(SELECT pr.global_id, image_path, name, firm, clothes.minprice AS price , maxdiscprice FROM clothes JOIN product_registry pr ON pr.internal_id = clothes.id AND pr.source_table = 'clothes'  LEFT JOIN discount ON clothes.id = productid WHERE name ILIKE '%%%s%%' %s)`,
			name, filterSnickersString, name, filterClothesString)
	}
}
func getSnickersFilterString(name string, filters types.SnickersFilterStruct) string {
	filterSnickersString := createSnickersFilter(filters)
	return fmt.Sprintf(`
 		        SELECT pr.global_id, image_path, name, firm, snickers.minprice  AS price, maxdiscprice FROM snickers JOIN product_registry pr ON pr.internal_id = snickers.id AND pr.source_table = 'snickers'  LEFT JOIN discount ON snickers.id = productid WHERE name ILIKE '%%%s%%' %s`,
		name, filterSnickersString)
}
func getClothesFilterString(name string, filters types.SnickersFilterStruct) string {
	filterClothesString := createClothesFilter(filters)
	return fmt.Sprintf(`
 		        SELECT pr.global_id, image_path, name, firm, clothes.minprice AS price , maxdiscprice FROM clothes JOIN product_registry pr ON pr.internal_id = clothes.id AND pr.source_table = 'clothes'  LEFT JOIN discount ON clothes.id = productid WHERE name ILIKE '%%%s%%' %s`,
		name, filterClothesString)
}

func getMerchFilterString(name string, filters types.SnickersFilterStruct) string {
	filterSoloMerchString := createSolomerchFilter(filters)
	return fmt.Sprintf(`
 		        SELECT pr.global_id, image_path, name, firm, solomerch.minprice  AS price, maxdiscprice FROM solomerch JOIN product_registry pr ON pr.internal_id = solomerch.id AND pr.source_table = 'solomerch'  LEFT JOIN discount ON solomerch.id = productid WHERE name ILIKE '%%%s%%' %s`,
		name, filterSoloMerchString)
}

func GetOrderedProductsByFiltersQuery(name string, filters types.SnickersFilterStruct, orderType int, limit int, offset int) string {
	merchFilterString := getProductsFilterString(name, filters)
	orderString := createOrderString(orderType)
	return fmt.Sprintf(`
        SELECT 
            *,
            COUNT(*) OVER() AS total_count
        FROM (%s) AS filtered
        %s LIMIT %d OFFSET %d`,
		merchFilterString, orderString, limit, offset)
}

func GetSnickersByFiltersQuery(name string, filters types.SnickersFilterStruct, orderType int, limit int, offset int) string {
	merchFilterString := getSnickersFilterString(name, filters)
	orderString := createOrderString(orderType)
	return fmt.Sprintf(`
        SELECT 
            *,
            COUNT(*) OVER() AS total_count
        FROM (%s) AS filtered
        %s LIMIT %d OFFSET %d`,
		merchFilterString, orderString, limit, offset)
}

func GetClothesByFiltersQuery(name string, filters types.SnickersFilterStruct, orderType int, limit int, offset int) string {
	merchFilterString := getClothesFilterString(name, filters)
	orderString := createOrderString(orderType)
	return fmt.Sprintf(`
        SELECT 
            *,
            COUNT(*) OVER() AS total_count
        FROM (%s) AS filtered
        %s LIMIT %d OFFSET %d`,
		merchFilterString, orderString, limit, offset)
}

func GetMerchByFiltersQuery(name string, filters types.SnickersFilterStruct, orderType int, limit int, offset int) string {
	merchFilterString := getMerchFilterString(name, filters)
	orderString := createOrderString(orderType)
	return fmt.Sprintf(`
        SELECT 
            *,
            COUNT(*) OVER() AS total_count
        FROM (%s) AS filtered
        %s LIMIT %d OFFSET %d`,
		merchFilterString, orderString, limit, offset)
}

func GetOrderedSnickersByFString(name string, filters types.SnickersFilterStruct, orderType int, limit int, offset int) string {
	filterString := createSnickersFilter(filters)
	orderString := createOrderString(orderType)
	fmt.Println(filterString, "fnldksnflkdsnflskn")
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
	LIMIT %d OFFSET %d`,
		namesStr, namesStr, namesStr, namesStr, namesStr, namesStr, end, offset)
}
