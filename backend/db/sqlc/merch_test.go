package db

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/mrkrabopl1/go_db/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetFirms(t *testing.T) {
	firms, err := testStore.GetFirms(context.Background())
	fmt.Println(firms)
	require.NoError(t, err)
	require.NotEmpty(t, firms)
}

func TestGetMerchFirms(t *testing.T) {
	firms, err := testStore.GetMerchFirms(context.Background())
	fmt.Println(firms)
	require.NoError(t, err)
	require.NotEmpty(t, firms)
}

func TestGetSnickersByFirmName(t *testing.T) {
	snickers, err := testStore.GetSnickersByFirmName(context.Background(), "soloMerch")
	fmt.Println(snickers)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetMerchByFirmName(t *testing.T) {
	snickers, err := testStore.GetMerchProductsByFirmName(context.Background(), "solomerch")
	fmt.Println(snickers)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}
func TestGetCategoriesWithTypes(t *testing.T) {
	snickers, err := testStore.GetCategoriesWithTypes(context.Background())
	fmt.Println(snickers[0].TypeName)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetFiltersByNameCategoryAndType(t *testing.T) {
	params := GetFiltersByNameCategoryAndTypeParams{
		Name:     pgtype.Text{String: "", Valid: false},
		Category: pgtype.Int4{Int32: 2, Valid: true},
		//Type:     pgtype.Int4{Int32: 1, Valid: true},
	}
	snickers, err := testStore.GetFiltersByNameCategoryAndType(context.Background(), params)
	fmt.Println(snickers)
	var result map[string]interface{}
	fmt.Println(result, "test")
	require.NoError(t, err)
}

func TestGetProductsByNameCategoryAndType(t *testing.T) {
	snickers, err := testStore.GetProductsByNameCategoryAndType(context.Background(), GetProductsByNameCategoryAndTypeParams{
		Name:     pgtype.Text{String: "", Valid: false},
		Category: pgtype.Int4{Int32: 1, Valid: true},
		Type:     pgtype.Int4{Int32: 1, Valid: true},
	})
	fmt.Println(len(snickers))
	var result map[string]interface{}
	fmt.Println(result, err)
	require.NoError(t, err)
}
func TestGetCombFiltersByString(t *testing.T) {
	snickers, err := testStore.GetCombinedFiltersByString(context.Background(), "POP MART")
	fmt.Println(snickers)

	var result map[string]interface{}

	// Type assert to []byte
	if firmCountBytes, ok := snickers.FirmCountMap.([]byte); ok {
		err = json.Unmarshal(firmCountBytes, &result)
		if err != nil {
			t.Errorf("Failed to unmarshal FirmCountMap: %v", err)
		}
	} else {
		t.Errorf("FirmCountMap is not []byte, it's %T", snickers.FirmCountMap)
	}

	fmt.Println(result)
	require.NoError(t, err)
}

// func TestGetCountIdByFiltersAndFirm(t *testing.T) {
// 	snickers, err := testStore.GetCountIdByFiltersAndFirm(context.Background(), "Labubu", types.ProductsFilterStruct{
// 		Sizes: []string{},
// 		Firms: []string{},
// 		Price: []float32{},
// 	})
// 	fmt.Println(snickers, "fldkfjlskdjflsd")
// 	require.NoError(t, err)
// 	require.NotEmpty(t, snickers)
// }

//	func TestGetOrderedSnickersIByFilters(t *testing.T) {
//		snickers, err := testStore.GetProductsByFiltersComplex(context.Background(), "POP MART", []string{"solomerch"}, 0, 10, 0)
//		fmt.Println(snickers, err)
//		require.NoError(t, err)
//		require.NotEmpty(t, snickers)
//	}

func TestGetProductsByFiltersNew(t *testing.T) {
	params := GetProductsByFiltersNewTestParams{}
	snickers, err := testStore.GetProductsByFiltersNewTest(context.Background(), params)
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetMainPageInfo(t *testing.T) {
	snickers, err := testStore.GetMainPageInfo(context.Background(), 2)
	fmt.Println(snickers[0].ImagePath, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers[0])
}
func TestGetProductsInfoById(t *testing.T) {
	snickers, err := testStore.GetProductsInfoByIdComplex(context.Background(), 1)
	fmt.Println(snickers.Article, "fdsfds", err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

// func TestCreateDiscounts(t *testing.T) {
// 	// Подготавливаем тестовые данные
// 	discountData := map[int32]DiscountData{
// 		1: {Percent: 20}, // 20% скидка на товар ID 1
// 		2: {Percent: 15}, // 15% скидка на товар ID 2
// 	}

// 	// Добавляем отладку
// 	t.Log("Before calling CreateDiscounts")
// 	t.Logf("Discount data: %+v", discountData)

// 	// Проверяем, существует ли testStore
// 	if testStore == nil {
// 		t.Fatal("testStore is nil")
// 	}
// 	t.Log("testStore is not nil")

// 	// Проверяем, есть ли продукты в БД
// 	ctx := context.Background()

// 	// Попробуем получить продукты

//		t.Log("Calling CreateDiscounts...")
//		err := testStore.CreateDiscounts(ctx, discountData)
//		t.Logf("CreateDiscounts returned: %v", err)
//		require.NoError(t, err)
//	}
func TestGetProductByArticle(t *testing.T) {
	// 1. Сначала создаем тестовый продукт
	testArticle := "IOTS019-3465"

	product, err := testStore.GetProductByArticle(context.Background(), testArticle)
	require.NoError(t, err)
	require.NotEmpty(t, product)
}

func TestGetProductsInfoByIdComplex(t *testing.T) {
	snickers, err := testStore.GetProductsInfoByIdComplex(context.Background(), 1)
	fmt.Println(snickers.Store, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}
func TestGetSoloCollection(t *testing.T) {
	snickers, err := testStore.GetMerchCollection(context.Background(), GetMerchCollectionParams{
		Firm:      "nike",
		Line:      "",
		Limitval:  40,
		Offsetval: 36,
	})
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

// db/sqlc/collections_test.go

func TestGetFullFiltersForCollection(t *testing.T) {
	ctx := context.Background()

	collections, err := testStore.GetAllCollections(ctx)
	require.NoError(t, err)

	if len(collections) == 0 {
		t.Skip("No collections found")
	}

	filtersParams := GetFullFiltersForCollectionParams{
		CollectionID:        1,
		CollectionTypeIds:   []int32{},
		CollectionBrandIds:  []int32{},
		CollectionSizes:     []string{},
		CollectionBodyTypes: []string{"child"},
	}

	filters, err := testStore.GetFullFiltersForCollection(ctx, filtersParams)
	require.NoError(t, err)

	fmt.Printf("\n=== FILTERS RESULT ===\n")
	fmt.Printf("Sizes: %v\n", filters.Sizes)
	fmt.Printf("Bodytypes: %v\n", filters.Bodytypes)
	fmt.Printf("Min price: %d\n", filters.MinPrice)
	fmt.Printf("Max price: %d\n", filters.MaxPrice)
	fmt.Printf("Firms: %v\n", filters.Firms)
	fmt.Printf("Product types: %v\n", filters.ProductTypes)
	fmt.Printf("Categories: %v\n", filters.Categories)
	fmt.Printf("Discount rules: %v\n", filters.DiscountRules)

	// Приводим interface{} к []byte и парсим
	if filters.Sizes != nil {
		sizesBytes, ok := filters.Sizes.([]byte)
		if ok && len(sizesBytes) > 0 {
			var sizes map[string]int64
			err = json.Unmarshal(sizesBytes, &sizes)
			if err == nil {
				fmt.Printf("\nParsed sizes: %+v\n", sizes)
			}
		}
	}

	if filters.Firms != nil {
		firmsBytes, ok := filters.Firms.([]byte)
		if ok && len(firmsBytes) > 0 {
			var firms map[string]int64
			err = json.Unmarshal(firmsBytes, &firms)
			if err == nil {
				fmt.Printf("Parsed firms: %+v\n", firms)
			}
		}
	}

	if filters.Bodytypes != nil {
		bodytypesBytes, ok := filters.Bodytypes.([]byte)
		if ok && len(bodytypesBytes) > 0 {
			var bodytypes map[string]int64
			err = json.Unmarshal(bodytypesBytes, &bodytypes)
			if err == nil {
				fmt.Printf("Parsed bodytypes: %+v\n", bodytypes)
			}
		}
	}

	if filters.ProductTypes != nil {
		productTypesBytes, ok := filters.ProductTypes.([]byte)
		if ok && len(productTypesBytes) > 0 {
			var productTypes []int64
			err = json.Unmarshal(productTypesBytes, &productTypes)
			if err == nil {
				fmt.Printf("Parsed product types: %+v\n", productTypes)
			}
		}
	}
}

func TestGetProductsForCollectionByFiltersPaginateFull(t *testing.T) {
	// Подготовка
	ctx := context.Background()

	// ID существующей коллекции (замените на реальный ID)
	collectionID := int32(7)

	params := GetProductsForCollectionByFiltersPaginateFullParams{
		Sizes:        []string{},
		Name:         "",
		Categories:   []int32{},
		ProductTypes: []int32{617},
		Firms:        []int32{},
		Lines:        []int32{},
		Bodytypes:    []string{},
		Minprice:     pgtype.Int4{Int32: 0, Valid: false},
		Maxprice:     pgtype.Int4{Int32: 0, Valid: false},
		WithPrice:    false,
		CollectionID: collectionID,
		SortType:     0,
		Offsetval:    0,
		Limitval:     10,
	}

	// Выполнение
	rows, err := testStore.GetProductsForCollectionByFiltersPaginateFull(ctx, params)

	// Проверка
	require.NoError(t, err)
	assert.NotNil(t, rows)
	assert.GreaterOrEqual(t, len(rows), 0, "Должен возвращать список продуктов")

	t.Logf("✅ Найдено %d продуктов", len(rows))

	// Логируем первые 3 продукта
	for i, p := range rows {
		if i >= 3 {
			break
		}
		t.Logf("  Product %d: ID=%d, Name=%s, Price=%d", i+1, p.ID, p.Name, p.MinPrice)
	}
}
func TestGetManualCollectionProducts(t *testing.T) {
	// Подготовка
	ctx := context.Background()

	// ID существующей manual коллекции (замените на реальный ID из вашей БД)
	collectionID := int32(7)

	// Параметры пагинации
	page := 1
	limit := 10

	// Выполнение
	products, err := testStore.GetManualCollectionProducts(ctx, GetManualCollectionProductsParams{
		CollectionID: collectionID,
		Limit:        int32(limit),
		Offset:       int32(0),
	})

	// Проверка
	require.NoError(t, err)
	assert.NotNil(t, products)
	assert.GreaterOrEqual(t, len(products), 0, "Должен возвращать список продуктов")

	t.Logf("✅ Найдено %d продуктов на странице %d", len(products), page)

	// Проверяем структуру первых 3 товаров
	for i, p := range products {
		if i >= 3 {
			break
		}
		t.Logf("  Product %d: ID=%d, Name=%s, Price=%d", i+1, p.GlobalID, p.Name, p.MinPrice)
	}
}
func TestGetProductsByFiltersPaginateFullWithSlugs_Base(t *testing.T) {
	// Подготовка
	ctx := context.Background()
	// твоя функция для тестовой БД
	fmt.Println("eeee")
	params := GetProductsByFiltersPaginateBaseWithSlugsParams{
		CategorySlug: "sneakers", // пусто → без фильтра
		TypeSlug:     "",         // пусто → без фильтра
		BrandSlug:    "",         // пусто → без фильтра
		LineSlug:     "",         // пусто → без фильтра
		Name:         "",
		Sizes:        []string{},
		Categories:   []int32{},
		ProductTypes: []int32{},
		Firms:        []int32{},
		Lines:        []int32{},
		Bodytypes:    []string{},
		WithPrice:    true,
		Limitval:     100,
		Offsetval:    0,
		SortType:     0,
	}

	// Выполнение
	rows, err := testStore.GetProductsByFiltersPaginateBaseWithSlugs(ctx, params)

	// Проверка
	require.NoError(t, err)
	assert.NotNil(t, rows)
	assert.GreaterOrEqual(t, len(rows), 0, "Должен возвращать список продуктов")
	t.Logf("✅ Найдено %d продуктов", len(rows))
}
func TestCountProductsByFiltersPaginateFullWithSlugs(t *testing.T) {
	// Подготовка
	ctx := context.Background()

	// Параметры для обоих запросов (одинаковые)
	params := CountProductsByFiltersBaseWithSlugsParams{
		CategorySlug: "sneakers",
		TypeSlug:     "boots",
		BrandSlug:    "",
		LineSlug:     "",
		Name:         "",
		Sizes:        []string{},
		Categories:   []int32{},
		ProductTypes: []int32{},
		Firms:        []int32{},
		Lines:        []int32{},
		Bodytypes:    []string{},
		HasDiscount:  false,
		WithPrice:    true,
	}

	// Выполнение первого запроса (с slugs)
	countWithSlugs, err := testStore.CountProductsByFiltersBaseWithSlugs(ctx, params)
	require.NoError(t, err)

	// Выполнение второго запроса (base)
	// Для второго запроса нужны те же параметры, но в другом формате
	paramsBase := CountProductsByFiltersBaseParams{
		Name:         params.Name,
		Sizes:        params.Sizes,
		Categories:   []int32{1},
		ProductTypes: []int32{6},
		Firms:        params.Firms,
		Lines:        params.Lines,
		Bodytypes:    params.Bodytypes,
		Minprice:     params.Minprice,
		Maxprice:     params.Maxprice,
		WithPrice:    params.WithPrice,
	}

	countBase, err := testStore.CountProductsByFiltersBase(ctx, paramsBase)
	require.NoError(t, err)

	// Проверка
	t.Logf("CountWithSlugs: %d", countWithSlugs)
	t.Logf("CountBase: %d", countBase)

	// Ожидаем, что результаты будут одинаковыми
	assert.Equal(t, countBase, countWithSlugs,
		"Counts should be equal when filters are the same")
	assert.NotZero(t, countWithSlugs, "Should have at least some products")
}
func TestCountProductsForCollectionByFiltersFull(t *testing.T) {
	// Подготовка
	ctx := context.Background()
	// твоя функция для тестовой БД
	fmt.Println("eeee")
	params := CountProductsForCollectionByFiltersFullParams{
		CollectionID: 3,
	}

	// Выполнение
	rows, err := testStore.CountProductsForCollectionByFiltersFull(ctx, params)

	// Проверка
	fmt.Println(rows)
	require.NoError(t, err)
	assert.NotNil(t, rows)

}
func TestGetProductsByFiltersPaginateFull_Base(t *testing.T) {
	// Подготовка
	ctx := context.Background()
	// твоя функция для тестовой БД

	params := GetProductsByFiltersPaginateFullParams{
		ProductTypes: []int32{617},
	}

	// Выполнение
	rows, err := testStore.GetProductsByFiltersPaginateFull(ctx, params)

	// Проверка
	require.NoError(t, err)
	assert.NotNil(t, rows)
	assert.GreaterOrEqual(t, len(rows), 0, "Должен возвращать список продуктов")
	t.Logf("✅ Найдено %d продуктов", len(rows))
}
func TestGetProductsByFiltersPaginateDiscount(t *testing.T) {
	ctx := context.Background()

	// Создаем параметры с пустым массивом rule_ids
	params := GetProductsByFiltersPaginateWithDiscountParams{
		RuleIds:   []int32{}, // пустой массив - должны получить все товары со скидкой
		Limitval:  50,
		Offsetval: 0,
		SortType:  1, // или 0 для сортировки по умолчанию
		// остальные параметры можно оставить nil или пустыми
	}

	rows, err := testStore.GetProductsByFiltersPaginateWithDiscount(ctx, params)

	require.NoError(t, err)
	assert.NotNil(t, rows)
	assert.GreaterOrEqual(t, len(rows), 1, "Должен возвращать продукты со скидкой")
	t.Logf("✅ Найдено %d продуктов", len(rows))
}
func TestGetProductsByFiltersPaginateWithStore(t *testing.T) {
	// Подготовка
	ctx := context.Background()
	// твоя функция для тестовой БД

	params := GetProductsByFiltersPaginateWithStoreParams{
		Limitval:     24,
		Offsetval:    0,
		Sizes:        []string{},
		Firms:        []int32{},
		Bodytypes:    []string{},
		ProductTypes: []int32{},
		SortType:     0,
		Lines:        []int32{},
		WithPrice:    true,
		Name:         "",
		Categories:   []int32{2},
		Minprice:     pgtype.Int4{Valid: false},
		Maxprice:     pgtype.Int4{Valid: false},
	}

	// Логирование параметров перед выполнением
	log.Printf("=== GetProductsByFiltersPaginateWithStore Params ===")
	log.Printf("Limitval: %d, Offsetval: %d", params.Limitval, params.Offsetval)
	log.Printf("Sizes: %v", params.Sizes)
	log.Printf("Firms: %v", params.Firms)
	log.Printf("Bodytypes: %v", params.Bodytypes)
	log.Printf("ProductTypes: %v", params.ProductTypes)
	log.Printf("SortType: %d", params.SortType)
	log.Printf("Lines: %v", params.Lines)
	log.Printf("WithPrice: %v", params.WithPrice)
	log.Printf("Name: '%s'", params.Name)
	log.Printf("Categories: %v", params.Categories)
	if params.Minprice.Valid {
		log.Printf("Minprice: %d", params.Minprice.Int32)
	} else {
		log.Printf("Minprice: NULL")
	}
	if params.Maxprice.Valid {
		log.Printf("Maxprice: %d", params.Maxprice.Int32)
	} else {
		log.Printf("Maxprice: NULL")
	}
	log.Printf("===========================================")

	// Выполнение
	rows, err := testStore.GetProductsByFiltersPaginateWithStore(ctx, params)

	// Проверка
	require.NoError(t, err)
	assert.NotNil(t, rows)
	assert.GreaterOrEqual(t, len(rows), 0, "Должен возвращать список продуктов")
	t.Logf("✅ Найдено %d продуктов", len(rows))

	// Дополнительная проверка категории
	if len(rows) > 0 {
		t.Logf("✅ Первый продукт: ID=%d, Name=%s", rows[0].ID, rows[0].Name)
	}
}
func TestGetSoloCollectionWithCount(t *testing.T) {
	snickers, err := testStore.GetSoloCollectionWithCount(context.Background(), GetSoloCollectionWithCountParams{
		Firm:      "nike",
		Line:      "air_jordan_1",
		Limitval:  20,
		Offsetval: 10,
	})
	fmt.Println(len(snickers), err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetMerchCollectionWithCount(t *testing.T) {
	snickers, err := testStore.GetMerchCollectionWithCount(context.Background(), GetMerchCollectionWithCountParams{
		Firm:      "solomerch",
		Line:      "air_jordan_1",
		Limitval:  20,
		Offsetval: 10,
	})
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetCollectionCount(t *testing.T) {
	snickers, err := testStore.GetCountOfCollectionsOrFirms(context.Background(), GetCountOfCollectionsOrFirmsParams{
		Firm: "nike",
		Line: "air_jordan_1",
	})
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

// func TestGetCollections(t *testing.T) {
// 	// names := []string{"nike", "balanciaga"}
// 	// placeholders := make([]string, len(names))
// 	// args := make([]interface{}, len(names))

// 	// // Build placeholders for the IN clause
// 	// for i, name := range names {
// 	// 	placeholders[i] = fmt.Sprintf("$%d", i+1)
// 	// 	args[i] = name
// 	// }

// 	//fmt.Println(strings.Join(placeholders, ","))
// 	fmt.Println("start", testStore)
// 	snickers, err := testStore.GetCollections1(context.Background(), []string{"balanciaga", "nike"}, 12, 0)

// 	fmt.Println(snickers, err)
// 	//fmt.Println(data, err)
// 	require.NoError(t, err)
// 	//require.NotEmpty(t, snickers)
// }

func TestGetProductsByName(t *testing.T) {
	snickers, err := testStore.GetProductsByName(context.Background(), GetProductsByNameParams{
		Column1: "A",
		Limit:   1,
	})
	fmt.Println(snickers, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestGetProductsAndFiltersByString(t *testing.T) {
	filters := types.ProductsFilterStruct{}
	params := GetFiltersByNameCategoryAndTypeParamsNew{
		Name: pgtype.Text{String: "", Valid: true},
		// Category: pgtype.Int4{Int32: 0, Valid: 0 != 0},
		// Type:     pgtype.Int4{Int32: 0, Valid: 0 != 0},
	}
	snickers, err := testStore.GetProductsAndFiltersByNameCategoryAndType(context.Background(), params, 1, 8, filters, 0)
	// fmt.Println(snickers.Filters, err)
	require.NoError(t, err)
	require.NotEmpty(t, snickers)
}

func TestCGetDiscounts(t *testing.T) {

	val, err := testStore.GetProductsWithDiscountComplex(context.Background())
	fmt.Println(err)
	require.NoError(t, err)
	require.NotEmpty(t, val)
}

// func TestGetTypeIdByCategoryAndName(t *testing.T) {
// 	merch, err := testStore.GetTypeIDByCategoryAndName(context.Background(), GetTypeIDByCategoryAndNameParams{
// 		Category: "solomerch",
// 		TypeName: "toys",
// 	})
// 	fmt.Println(merch, err)
// 	require.NoError(t, err)
// 	require.NotEmpty(t, merch)
// }
