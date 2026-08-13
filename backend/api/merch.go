package api

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/types"
)

type SizeData struct {
	Price    int32 `json:"price"`
	Quantity int32 `json:"quantity"`
	Discount int32 `json:"discount"`
}

func (s *Server) handleGetFirms(ctx *gin.Context) {
	firms, err := s.store.GetFirms(ctx)
	if err != nil {
		//log.WithCaller().Err(err)
		ctx.JSON(http.StatusUnauthorized, errorResponse(err))
		return
	}
	ctx.JSON(http.StatusOK, firms)
}

func (s *Server) handleGetSnickersByFirmName(ctx *gin.Context) {
	firm := ctx.Query("firm")
	snickers, err := s.store.GetSnickersByFirmName(ctx, firm)
	if err != nil {
		//log.WithCaller().Err(err)
		ctx.JSON(http.StatusUnauthorized, errorResponse(err))
		return
	}
	ctx.JSON(http.StatusOK, snickers)
}

// func (s *Server) handleGetSizes(ctx *gin.Context) {
// 	category := ctx.Query("category")
// 	if val, ok := size.Get(category); ok {
// 		ctx.JSON(http.StatusOK, val)
// 	} else {
// 		ctx.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
// 	}
// }

func (s *Server) handleGetProductsInfoById(ctx *gin.Context) {
	id := ctx.Param("id")
	fmt.Println(id, "ididididididididididididididid")
	numId, err := strconv.ParseInt(id, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	ProductsInfo, err2 := s.store.GetProductsInfoByIdComplex(ctx, int32(numId))
	if err2 != nil {
		fmt.Println(err, "wssssssssssss")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	err = s.taskProcessor.SetProductsInfo(ctx, id, ProductsInfo)
	ctx.JSON(http.StatusOK, ProductsInfo)

	cookie, errC := ctx.Cookie("unique")

	if errC != nil {
		//log.WithCaller().Err(errC).Msg("")
		return
	}
	user, err1 := s.tokenMaker.VerifyToken(cookie)
	if err1 != nil {
		fmt.Println(err1)
	} else {
		fmt.Println(user, user.UserID, "fdslfsd;mfdskmf;sdmfs")
		err := s.store.SetSnickersHistory(ctx, int32(numId), user.UserID)
		if err != nil {
			fmt.Println(user, user.UserID, "blya")
		}
	}
}

type ProductsResponseD struct {
	Name     string      `json:"name"`
	Id       int32       `json:"id"`
	Image    []string    `json:"imgs"`
	Discount interface{} `json:"discount"`
	Price    int         `json:"price"`
}

type Clothes struct {
	S   int64 `json:"s"`
	M   int64 `json:"m"`
	L   int64 `json:"l"`
	XL  int64 `json:"xl"`
	XXL int64 `json:"xxl"`
}
type ProductsFilterStruct struct {
	Firms      []string               `json:"firmsCount"`
	Sizes      map[string]interface{} `json:"sizes"`
	Price      []float32              `json:"price"`
	Types      []int32                `json:"types"`
	Categories []int32                `json:"categories"`
}

func (s *Server) handleSearchWithFilters(ctx *gin.Context) {
	startTotal := time.Now()
	log.Printf("🚀 [START] handleSearchSnickersAndFiltersByNameCategoryAndType")

	// ---- 1. Биндинг JSON ----
	startBind := time.Now()
	var postData types.PostDataSnickersAndFiltersByString
	if err := ctx.BindJSON(&postData); err != nil {
		fmt.Println(err, "error in handleSearchProductsByCategories")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	bindDuration := time.Since(startBind)
	log.Printf("⏱️ [1] BindJSON: %v", bindDuration)
	log.Printf("📥 postData: Name='%s', Category=%d, Type=%d, Page=%d, Size=%d, SortType=%d",
		postData.Name, postData.Category, postData.Type, postData.Page, postData.Size, postData.SortType)

	// ---- 2. Подготовка параметров ----
	startParams := time.Now()
	params := db.GetFiltersByNameCategoryAndTypeParamsNew{
		Name:     pgtype.Text{String: postData.Name, Valid: postData.Name != ""},
		Category: pgtype.Int4{Int32: postData.Category, Valid: postData.Category != 0},
		Type:     pgtype.Int4{Int32: postData.Type, Valid: postData.Type != 0},
		BrandID:  pgtype.Int4{Int32: postData.BrandID, Valid: postData.BrandID != 0},
	}
	paramsDuration := time.Since(startParams)
	log.Printf("⏱️ [2] Подготовка параметров: %v", paramsDuration)
	fmt.Println(params)
	log.Printf("📤 params: Type=%v, Category=%v, Name=%v, BrandId =%v",
		params.Type.Valid, params.Category.Valid, params.Name.Valid, params.BrandID.Valid)

	// ---- 3. Основной запрос ----
	startQuery := time.Now()
	ProductsInfo, err1 := s.store.GetProductsAndFiltersByNameCategoryAndType(
		ctx, params, postData.Page, postData.Size, postData.Filters, postData.SortType)
	queryDuration := time.Since(startQuery)
	log.Printf("⏱️ [3] GetProductsAndFiltersByNameCategoryAndType: %v", queryDuration)

	if err1 != nil {
		log.Printf("❌ [ERROR] GetProductsAndFiltersByNameCategoryAndType: %v", err1)
		ctx.JSON(http.StatusBadRequest, errorResponse(err1))
		return
	}
	// log.Printf("📥 ProductsInfo: TotalCount=%v, ProductsCount=%d, Filters=%+v",
	// 	ProductsInfo.TotalCount, len(ProductsInfo.Products), ProductsInfo.Filters)

	// ---- 4. JSON ответ ----
	startJSON := time.Now()
	ctx.JSON(http.StatusOK, ProductsInfo)
	jsonDuration := time.Since(startJSON)
	log.Printf("⏱️ [4] ctx.JSON: %v", jsonDuration)

	// ---- ИТОГО ----
	totalDuration := time.Since(startTotal)
	log.Printf("⏱️ [TOTAL] handleSearchSnickersAndFiltersByNameCategoryAndType: %v", totalDuration)
	log.Printf("✅ [END] handleSearchSnickersAndFiltersByNameCategoryAndType")
}
func (s *Server) handleSearchSnickersAndFiltersBySlugs(ctx *gin.Context) {
	startTotal := time.Now()
	log.Printf("🚀 [START] handleSearchSnickersAndFiltersBySlugs")

	// ---- 1. Биндинг JSON ----
	startBind := time.Now()
	var postData types.PostDataSnickersAndFiltersBySlugs
	if err := ctx.BindJSON(&postData); err != nil {
		log.Printf("❌ [ERROR] BindJSON: %v", err)
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	bindDuration := time.Since(startBind)
	log.Printf("⏱️ [1] BindJSON: %v", bindDuration)
	log.Printf("📥 postData: Name='%s', CategorySlug='%s', TypeSlug='%s', BrandSlug='%s', LineSlug='%s', Page=%d, Size=%d, SortType=%d",
		postData.Name, postData.CategorySlug, postData.TypeSlug, postData.BrandSlug, postData.LineSlug, postData.Page, postData.Size, postData.SortType)

	// ---- 2. Валидация ----
	if postData.Page < 1 {
		postData.Page = 1
	}
	if postData.Size < 1 || postData.Size > 100 {
		postData.Size = 24
	}

	// ---- 3. Получение данных через store ----
	startStore := time.Now()

	result, err := s.store.GetProductsAndFiltersBySlugs(
		ctx,
		postData.CategorySlug,
		postData.TypeSlug,
		postData.BrandSlug,
		postData.LineSlug,
		postData.Name,
		postData.Filters,
		postData.Page,
		postData.Size,
		postData.SortType,
	)

	storeDuration := time.Since(startStore)
	log.Printf("⏱️ [2] GetProductsAndFiltersBySlugs: %v", storeDuration)

	if err != nil {
		log.Printf("❌ [ERROR] GetProductsAndFiltersBySlugs: %v", err)
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	// ---- 4. JSON ответ ----
	startJSON := time.Now()
	ctx.JSON(http.StatusOK, result)
	jsonDuration := time.Since(startJSON)
	log.Printf("⏱️ [3] ctx.JSON: %v", jsonDuration)

	// ---- ИТОГО ----
	totalDuration := time.Since(startTotal)
	log.Printf("⏱️ [TOTAL] handleSearchSnickersAndFiltersBySlugs: %v", totalDuration)
	log.Printf("✅ [END] handleSearchSnickersAndFiltersBySlugs")
}
func (s *Server) handleSearchProductByCategoriesAndFilters(ctx *gin.Context) {
	var postData types.PostDataAndFiltersByCategoryAndType
	if err := ctx.BindJSON(&postData); err != nil {
		fmt.Println(err, "error in handleSearchProductsByCategories")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	//fmt.Println(postData.Filters.Price, "postData postData postData postData postData postData postData postData ")
	fmt.Println(postData.Filters.InStore, "postData postData postData postData postData postData postData postData ")
	postData.Filters.Status = "active"
	resp, err := s.store.GetProductsByFiltersComplex(ctx, postData.Name, postData.Page, postData.Size, postData.Filters, postData.SortType)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, resp)
}

func (s *Server) handleGetMainPage(c *gin.Context) {
	ctx := c.Request.Context()

	// 1. Пытаемся получить из кэша
	// widgets, err := s.taskProcessor.GetPageWidgets(ctx)
	// // fmt.Println("widgets", widgets)
	// if err == nil && len(widgets) > 0 {
	// 	c.Data(http.StatusOK, "application/json", widgets)
	// 	c.Header("X-Cache", "HIT")
	// 	return
	// }

	// // 2. Кэша нет - отдаём из БД
	// c.Header("X-Cache", "MISS")

	widgetsFromDB, err := s.store.GetPageWidgetsFromDB(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fmt.Println(widgetsFromDB)

	// 3. Обновляем кэш в фоне
	go func() {
		bgCtx := context.Background()
		if err := s.taskProcessor.RefreshPageWidgetsCache(bgCtx); err != nil {
			fmt.Printf("[Redis] Failed to refresh cache: %v\n", err)
		}
	}()

	c.JSON(http.StatusOK, widgetsFromDB)
}

// getPageWidgetsFromDB - получение виджетов напрямую из БД

func (s *Server) handleSearchProductAndByCategoriesAndFilters(ctx *gin.Context) {
	var postData types.PostDataAndFiltersByCategoryAndType
	if err := ctx.BindJSON(&postData); err != nil {
		fmt.Println(err, "error in handleSearchProductsByCategories")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	fmt.Println(postData.Filters.InStore, "dffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
	postData.Filters.Status = "active"
	resp, err := s.store.GetProductsByFiltersComplex(ctx, "", 0, postData.Page, postData.Filters, postData.SortType)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, resp)
}

type GetFiltersByNameCategoryAndTypeReq struct {
}

func (s *Server) handleGetFiltersByNameCategoryAndType(ctx *gin.Context) {
	var params db.GetFiltersByNameCategoryAndTypeParams
	if err := ctx.BindJSON(&params); err != nil {
		fmt.Println(err, "error in handleSearchProductsByCategories")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	fmt.Println("test", params, "kfdnkjfndskjfbnklvkfnkjfbgfkjbjkewbqfjgvkjdsv jnsdfkbdsdkfsdkfnkdsjfnsdnfkjdsqkwpek")
	resp, err := s.store.GetFiltersByNameCategoryAndType(ctx, params)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, resp)
}

type RespSearchProductsByString struct {
	Products []ProductsResponseD `json:"products"`
	Pages    int                 `json:"pages"`
}

func (s *Server) handleSearchProductsByString(ctx *gin.Context) {
	var postData types.PostDataOrdreredSnickersByString
	if err := ctx.BindJSON(&postData); err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	ProductsInfo, _ := s.store.GetProductsByString(ctx, postData.Name, postData.Page, postData.Size, postData.Filters, postData.OrderType)
	ctx.JSON(http.StatusOK, ProductsInfo)
}

func (s *Server) handleSearchProducts(ctx *gin.Context) {
	var postData types.PostData
	if err := ctx.BindJSON(&postData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	response, _ := s.store.GetProductsByNameComplex(ctx, postData.Name, postData.Max)
	ctx.JSON(http.StatusOK, response)
}

func (s *Server) handleGetSoloCollection(ctx *gin.Context) {
	var postData types.PostDataSoloCollection
	if err := ctx.BindJSON(&postData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	offset := (postData.Page - 1) * postData.Size
	response, _ := s.store.GetMerchCollectionComplex(ctx,
		db.GetMerchCollectionParams{
			Firm:      postData.Name,
			Line:      "",
			Limitval:  int32(postData.Size),
			Offsetval: int32(offset),
		})
	ctx.JSON(http.StatusOK, response)
}

func (s *Server) handleGetDiscounts(ctx *gin.Context) {
	searchData, err := s.store.GetProductsWithDiscountComplex(ctx)
	if err != nil {
		//log.WithCaller().Err(err1).Msg("")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	ctx.JSON(http.StatusOK, searchData)
}

type DiscountsData struct {
	ProductId        int32       `json:"productid"`
	Minprice         int         `json:"minprice"`
	MaxDiscountPrice int         `json:"maxdiscountprice"`
	Value            interface{} `json:"value"`
}

// func (s *Server) createDiscounts(ctx *gin.Context) {
// 	var discounts []int32
// 	if err := ctx.BindJSON(&discounts); err != nil {
// 		ctx.JSON(http.StatusBadRequest, errorResponse(err))
// 		return
// 	}
// 	products, err := s.store.GetProductsByIds(ctx, discounts)

// 	var discountsData map[int32]types.DiscountData

// 	if err != nil {
// 		ctx.JSON(http.StatusBadRequest, errorResponse(err))
// 		return
// 	}
// 	if len(products) == 0 {
// 		ctx.JSON(http.StatusBadRequest, gin.H{"error": "No products found for the provided IDs"})
// 		return
// 	} else {
// 		for _, product := range products {
// 			if product.Maxdiscprice.Int32 == 0 {

// 			} else {

// 			}
// 		}

// 	}

//		err1 := s.store.CreateDiscounts(ctx, discountsData)
//		if err1 != nil {
//			//log.WithCaller().Err(err1).Msg("")
//			ctx.JSON(http.StatusBadRequest, errorResponse(err))
//			return
//		}
//		ctx.JSON(http.StatusOK, 0)
//	}
func toJSONRawMessage(v interface{}, defaultVal string) json.RawMessage {
	if v == nil {
		return json.RawMessage(defaultVal)
	}

	switch val := v.(type) {
	case []byte:
		return json.RawMessage(val)
	case string:
		return json.RawMessage(val)
	case json.RawMessage:
		return val
	default:
		// Пробуем сериализовать
		data, err := json.Marshal(v)
		if err != nil {
			return json.RawMessage(defaultVal)
		}
		return json.RawMessage(data)
	}
}

// handleGetCollectionBySlug - получение коллекции по slug
func (s *Server) handleGetCollectionBySlug(c *gin.Context) {
	slug := c.Param("slug")
	ctx := c.Request.Context()

	// 1. Получаем коллекцию из БД
	collection, err := s.store.GetCollectionBySlug(ctx, slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found"})
		return
	}

	var filtersResponse FiltersResponse
	var products []types.CachedProduct
	var total int64

	// 2. В зависимости от типа коллекции - разные запросы
	switch collection.Type {
	case "manual":
		// ===== MANUAL =====
		// Получаем фильтры только для manual
		manualFilters, err := s.store.GetFullFiltersForManualCollection(ctx, collection.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get filters"})
			return
		}
		filtersResponse = convertManualFiltersToResponse(&manualFilters)
		fmt.Println(manualFilters, "ddddddddd")
		// Получаем товары manual коллекции
		dbProducts, dbTotal, err := s.store.GetManualCollectionProductsPaginated(ctx, collection.ID, 24, 0)
		fmt.Println(dbProducts, "qqqqqqqqq")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get products"})
			return
		}

		// Конвертируем db.ProductRow в types.CachedProduct
		products = convertDBProductsToCached(dbProducts)
		total = int64(dbTotal)

	case "dynamic", "hybrid":
		// ===== DYNAMIC / HYBRID =====
		// Формируем параметры фильтров
		var filtersParams db.GetFullFiltersForCollectionParams
		filtersParams.CollectionID = collection.ID

		if len(collection.Settings) > 0 {
			var settings types.CollectionSettings
			if err := json.Unmarshal(collection.Settings, &settings); err == nil && settings.Filters != nil {
				filtersParams.CollectionTypeIds = settings.Filters.Types
				filtersParams.CollectionCategoryIds = settings.Filters.Categories
				filtersParams.CollectionBrandIds = settings.Filters.Firms
				filtersParams.CollectionLineIds = settings.Filters.Lines
				filtersParams.CollectionBodyTypes = settings.Filters.Bodytypes
				if len(settings.Filters.Price) >= 2 {
					filtersParams.CollectionPriceMin = int32(settings.Filters.Price[0])
					filtersParams.CollectionPriceMax = int32(settings.Filters.Price[1])
				}
				filtersParams.CollectionSizes = settings.Filters.Sizes
				filtersParams.CollectionInStore = settings.Filters.InStore
				filtersParams.CollectionRuleIds = settings.Filters.RuleIDs
			}
		}

		// Получаем полный набор фильтров
		dynamicFilters, err := s.store.GetFullFiltersForCollection(ctx, filtersParams)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get filters"})
			return
		}
		filtersResponse = convertDynamicFiltersToResponse(&dynamicFilters)

		// Получаем товары по фильтрам
		dbProducts, dbTotal, err := s.store.GetCollectionProducts(ctx, collection, filtersParams, 1, 24)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get products"})
			return
		}

		// Конвертируем db.ProductRow в types.CachedProduct
		products = convertDBProductsToCached(dbProducts)
		total = int64(dbTotal)

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown collection type"})
		return
	}

	// 3. Формируем ответ
	response := gin.H{
		"collection": gin.H{
			"id":          collection.ID,
			"slug":        collection.Slug,
			"name":        collection.Name,
			"description": collection.Description.String,
			"type":        collection.Type,
			"is_active":   collection.IsActive.Bool,
		},
		"filters": gin.H{
			"sizes":          toJSONRawMessage(filtersResponse.Sizes, "{}"),
			"bodytypes":      toJSONRawMessage(filtersResponse.Bodytypes, "{}"),
			"min_price":      filtersResponse.MinPrice,
			"max_price":      filtersResponse.MaxPrice,
			"firms":          toJSONRawMessage(filtersResponse.Firms, "{}"),
			"product_types":  toJSONRawMessage(filtersResponse.ProductTypes, "[]"),
			"categories":     toJSONRawMessage(filtersResponse.Categories, "[]"),
			"discount_rules": toJSONRawMessage(filtersResponse.DiscountRules, "[]"),
		},
		"products": products,
		"total":    total,
		"page":     1,
		"limit":    24,
	}

	// 4. Сохраняем в кэш
	go func() {
		bgCtx := context.Background()
		data, _ := json.Marshal(response)
		s.taskProcessor.SetCollection(bgCtx, collection.ID, data)
	}()

	c.JSON(http.StatusOK, response)
}

// ============================================
// СТРУКТУРЫ ДЛЯ FILTERS
// ============================================

// FiltersResponse - общая структура для фильтров
type FiltersResponse struct {
	Sizes         map[string]int64       `json:"sizes"`
	Bodytypes     map[string]int64       `json:"bodytypes"`
	MinPrice      int32                  `json:"min_price"`
	MaxPrice      int32                  `json:"max_price"`
	Firms         map[string]int64       `json:"firms"`
	ProductTypes  []int32                `json:"product_types"`
	Categories    []int32                `json:"categories"`
	DiscountRules []DiscountRuleResponse `json:"discount_rules"`
}

// DiscountRuleResponse - структура для правила скидки
type DiscountRuleResponse struct {
	ID            int32   `json:"id"`
	Name          string  `json:"name"`
	DiscountType  string  `json:"discount_type"`
	DiscountValue float64 `json:"discount_value"`
	Priority      int32   `json:"priority"`
}

// ============================================
// КОНВЕРТЕРЫ
// ============================================

// convertManualFiltersToResponse - конвертирует manual фильтры в общий формат
func convertManualFiltersToResponse(manualFilters *db.GetFullFiltersForManualCollectionRow) FiltersResponse {
	var (
		sizes         map[string]int64
		bodytypes     map[string]int64
		firms         map[string]int64
		productTypes  []int32
		categories    []int32
		discountRules []DiscountRuleResponse
		minPrice      int32
		maxPrice      int32
	)

	json.Unmarshal(toJSONRawMessage(manualFilters.Sizes, "{}"), &sizes)
	json.Unmarshal(toJSONRawMessage(manualFilters.Bodytypes, "{}"), &bodytypes)
	json.Unmarshal(toJSONRawMessage(manualFilters.Firms, "{}"), &firms)
	json.Unmarshal(toJSONRawMessage(manualFilters.ProductTypes, "[]"), &productTypes)
	json.Unmarshal(toJSONRawMessage(manualFilters.Categories, "[]"), &categories)
	json.Unmarshal(toJSONRawMessage(manualFilters.DiscountRules, "[]"), &discountRules)
	json.Unmarshal(toJSONRawMessage(manualFilters.MinPrice, "0"), &minPrice)
	json.Unmarshal(toJSONRawMessage(manualFilters.MaxPrice, "0"), &maxPrice)

	return FiltersResponse{
		Sizes:         sizes,
		Bodytypes:     bodytypes,
		MinPrice:      minPrice,
		MaxPrice:      maxPrice,
		Firms:         firms,
		ProductTypes:  productTypes,
		Categories:    categories,
		DiscountRules: discountRules,
	}
}

// convertDynamicFiltersToResponse - конвертирует dynamic/hybrid фильтры в общий формат
func convertDynamicFiltersToResponse(dynamicFilters *db.GetFullFiltersForCollectionRow) FiltersResponse {
	// Используем toJSONRawMessage для конвертации
	var (
		sizes         map[string]int64
		bodytypes     map[string]int64
		firms         map[string]int64
		productTypes  []int32
		categories    []int32
		discountRules []DiscountRuleResponse
		minPrice      int32
		maxPrice      int32
	)

	json.Unmarshal(toJSONRawMessage(dynamicFilters.Sizes, "{}"), &sizes)
	json.Unmarshal(toJSONRawMessage(dynamicFilters.Bodytypes, "{}"), &bodytypes)
	json.Unmarshal(toJSONRawMessage(dynamicFilters.Firms, "{}"), &firms)
	json.Unmarshal(toJSONRawMessage(dynamicFilters.ProductTypes, "[]"), &productTypes)
	json.Unmarshal(toJSONRawMessage(dynamicFilters.Categories, "[]"), &categories)
	json.Unmarshal(toJSONRawMessage(dynamicFilters.DiscountRules, "[]"), &discountRules)
	json.Unmarshal(toJSONRawMessage(dynamicFilters.MinPrice, "0"), &minPrice)
	json.Unmarshal(toJSONRawMessage(dynamicFilters.MaxPrice, "0"), &maxPrice)

	return FiltersResponse{
		Sizes:         sizes,
		Bodytypes:     bodytypes,
		MinPrice:      minPrice,
		MaxPrice:      maxPrice,
		Firms:         firms,
		ProductTypes:  productTypes,
		Categories:    categories,
		DiscountRules: discountRules,
	}
}

func (s *Server) handleGetCollectionById(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection ID"})
		return
	}
	ctx := c.Request.Context()

	// 1. Получаем коллекцию из БД
	collection, err := s.store.GetCollectionByID(ctx, int32(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found"})
		return
	}

	var filtersResponse FiltersResponse
	var products []types.CachedProduct
	var total int64

	// 2. В зависимости от типа коллекции - разные запросы
	switch collection.Type {
	case "manual":
		// ===== MANUAL =====
		// Получаем фильтры только для manual
		fmt.Println("GetFullFiltersForManualCollection")
		manualFilters, err := s.store.GetFullFiltersForManualCollection(ctx, collection.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get filters"})
			return
		}
		filtersResponse = convertManualFiltersToResponse(&manualFilters)

		// Получаем товары manual коллекции
		dbProducts, dbTotal, err := s.store.GetManualCollectionProductsPaginated(ctx, collection.ID, 1, 24)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get products"})
			return
		}

		// Конвертируем db.ProductRow в types.CachedProduct
		products = convertDBProductsToCached(dbProducts)
		total = int64(dbTotal)

	case "dynamic", "hybrid":
		// ===== DYNAMIC / HYBRID =====
		// Формируем параметры фильтров
		var filtersParams db.GetFullFiltersForCollectionParams
		filtersParams.CollectionID = collection.ID

		if len(collection.Settings) > 0 {
			var settings types.CollectionSettings
			if err := json.Unmarshal(collection.Settings, &settings); err == nil && settings.Filters != nil {
				filtersParams.CollectionTypeIds = settings.Filters.Types
				filtersParams.CollectionCategoryIds = settings.Filters.Categories
				filtersParams.CollectionBrandIds = settings.Filters.Firms
				filtersParams.CollectionLineIds = settings.Filters.Lines
				filtersParams.CollectionBodyTypes = settings.Filters.Bodytypes
				if len(settings.Filters.Price) >= 2 {
					filtersParams.CollectionPriceMin = int32(settings.Filters.Price[0])
					filtersParams.CollectionPriceMax = int32(settings.Filters.Price[1])
				}
				filtersParams.CollectionSizes = settings.Filters.Sizes
				filtersParams.CollectionInStore = settings.Filters.InStore
				filtersParams.CollectionRuleIds = settings.Filters.RuleIDs
			}
		}

		// Получаем полный набор фильтров
		dynamicFilters, err := s.store.GetFullFiltersForCollection(ctx, filtersParams)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get filters"})
			return
		}
		filtersResponse = convertDynamicFiltersToResponse(&dynamicFilters)

		// Получаем товары по фильтрам
		dbProducts, dbTotal, err := s.store.GetCollectionProducts(ctx, collection, filtersParams, 1, 24)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get products"})
			return
		}

		// Конвертируем db.ProductRow в types.CachedProduct
		products = convertDBProductsToCached(dbProducts)
		total = int64(dbTotal)

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown collection type"})
		return
	}

	// 3. Формируем ответ
	response := gin.H{
		"collection": gin.H{
			"id":          collection.ID,
			"slug":        collection.Slug,
			"name":        collection.Name,
			"description": collection.Description.String,
			"type":        collection.Type,
			"is_active":   collection.IsActive.Bool,
		},
		"filters": gin.H{
			"sizes":          toJSONRawMessage(filtersResponse.Sizes, "{}"),
			"bodytypes":      toJSONRawMessage(filtersResponse.Bodytypes, "{}"),
			"min_price":      filtersResponse.MinPrice,
			"max_price":      filtersResponse.MaxPrice,
			"firms":          toJSONRawMessage(filtersResponse.Firms, "{}"),
			"product_types":  toJSONRawMessage(filtersResponse.ProductTypes, "[]"),
			"categories":     toJSONRawMessage(filtersResponse.Categories, "[]"),
			"discount_rules": toJSONRawMessage(filtersResponse.DiscountRules, "[]"),
		},
		"products": products,
		"total":    total,
		"page":     1,
		"limit":    24,
	}

	// 4. Сохраняем в кэш
	go func() {
		bgCtx := context.Background()
		data, _ := json.Marshal(response)
		s.taskProcessor.SetCollection(bgCtx, int32(id), data)
	}()

	c.JSON(http.StatusOK, response)
}

// convertDBProductsToCached конвертирует []db.ProductRow в []types.CachedProduct
func convertDBProductsToCached(dbProducts []db.ProductRow) []types.CachedProduct {
	products := make([]types.CachedProduct, 0, len(dbProducts))
	for _, p := range dbProducts {
		imagePath := ""
		if p.ImagePath != "" {
			imagePath = p.ImagePath
		}

		products = append(products, types.CachedProduct{
			ID:              p.ID,
			Name:            p.Name,
			ImagePath:       imagePath,
			Price:           p.MinPrice,
			Discount:        0, // Если есть поле Discount в ProductRow
			DiscountPercent: 0, // Если есть поле DiscountPercent в ProductRow
		})
	}
	return products
}

// ============================================
// ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ STORE
// ============================================

// GetManualCollectionProducts - получение товаров для manual коллекции
// handleGetCollectionProducts - обработчик для получения продуктов коллекции с фильтрацией
type CollectionProductsRequest struct {
	// Пагинация
	Page     int `json:"page"`
	Size     int `json:"size"` // У вас size, не limit
	SortType int `json:"sortType"`

	// Поиск
	Search string `json:"search"` // У вас search, не name

	// Фильтры (вложенный объект)
	Filters struct {
		Sizes      []string `json:"sizes"`
		Types      []int32  `json:"types"`
		Categories []int32  `json:"categories"`
		Firms      []int32  `json:"firms"`
		Lines      []int32  `json:"lines"`
		Bodytypes  []string `json:"bodytypes"`
		PriceMin   *int     `json:"price_min"`
		PriceMax   *int     `json:"price_max"`
		WithPrice  *bool    `json:"with_price"`
		RuleIDs    []int32  `json:"rule_ids"`
		InStore    *bool    `json:"in_store"`
	} `json:"filters"`
}

// handleGetCollectionProducts - обработчик для получения продуктов коллекции с фильтрацией
func (s *Server) handleGetCollectionProducts(c *gin.Context) {
	startTotal := time.Now()
	log.Printf("🚀 [START] handleGetCollectionProducts")

	// ---- 1. Получаем ID коллекции из параметров ----
	collectionID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		log.Printf("❌ [ERROR] Invalid collection ID: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection ID"})
		return
	}
	log.Printf("📥 Collection ID: %d", collectionID)

	// ---- 2. Биндинг JSON ----
	startBind := time.Now()
	var req CollectionProductsRequest

	// Пробуем привязать JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		// Если ошибка - используем значения по умолчанию
		log.Printf("⚠️ [WARN] Invalid JSON body, using defaults: %v", err)
		req = CollectionProductsRequest{
			Page: 1,
			Size: 24,
		}
	}
	bindDuration := time.Since(startBind)
	log.Printf("⏱️ [1] BindJSON: %v", bindDuration)

	// ---- 3. Устанавливаем значения по умолчанию и валидация ----
	if req.Page < 1 {
		req.Page = 1
	}
	if req.Size < 1 || req.Size > 100 {
		req.Size = 24
	}
	if req.SortType < 0 || req.SortType > 4 {
		req.SortType = 0 // default sort
	}

	log.Printf("📥 Request: Page=%d, Size=%d, SortType=%d, Search='%s'",
		req.Page, req.Size, req.SortType, req.Search)
	log.Printf("📥 Filters: Sizes=%v, Types=%v, Categories=%v, Firms=%v, Lines=%v, Bodytypes=%v, PriceMin=%v, PriceMax=%v, RuleIDs=%v",
		req.Filters.Sizes, req.Filters.Types, req.Filters.Categories, req.Filters.Firms, req.Filters.Lines,
		req.Filters.Bodytypes, req.Filters.PriceMin, req.Filters.PriceMax, req.Filters.RuleIDs)

	ctx := c.Request.Context()

	// ---- 4. Получаем коллекцию из БД ----
	startCollection := time.Now()
	collection, err := s.store.GetCollectionByID(ctx, int32(collectionID))
	if err != nil {
		log.Printf("❌ [ERROR] GetCollectionByID: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found"})
		return
	}
	collectionDuration := time.Since(startCollection)
	log.Printf("⏱️ [2] GetCollectionByID: %v, Type: %s", collectionDuration, collection.Type)

	// ---- 5. Формируем фильтры ----
	startFilters := time.Now()
	filters := types.ProductsFilterStruct{
		Sizes:      req.Filters.Sizes,
		Firms:      req.Filters.Firms,
		Lines:      req.Filters.Lines,
		Bodytypes:  req.Filters.Bodytypes,
		Types:      req.Filters.Types,
		Categories: req.Filters.Categories,
		Price:      []float32{},
		WithPrice:  false,
		RuleIDs:    req.Filters.RuleIDs,
		InStore:    false,
	}

	if req.Filters.WithPrice != nil {
		filters.WithPrice = *req.Filters.WithPrice
	}
	if req.Filters.InStore != nil {
		filters.InStore = *req.Filters.InStore
	}
	if req.Filters.PriceMin != nil && req.Filters.PriceMax != nil {
		filters.Price = []float32{float32(*req.Filters.PriceMin), float32(*req.Filters.PriceMax)}
	}

	filtersDuration := time.Since(startFilters)
	log.Printf("⏱️ [3] Формирование фильтров: %v", filtersDuration)

	// ---- 6. Подготовка параметров для запроса ----
	startParams := time.Now()
	params := db.GetCollectionProductsParams{
		CollectionID:   collection.ID,
		Filters:        filters,
		Page:           req.Page,
		Limit:          req.Size,
		SortType:       req.SortType,
		Name:           req.Search,
		UsePriceFilter: req.Filters.PriceMin != nil && req.Filters.PriceMax != nil,
	}
	paramsDuration := time.Since(startParams)
	log.Printf("⏱️ [4] Подготовка параметров: %v", paramsDuration)

	// ---- 7. Основной запрос ----
	startQuery := time.Now()
	result, err := s.store.GetCollectionProductsByFilters(ctx, collection, params)
	queryDuration := time.Since(startQuery)
	log.Printf("⏱️ [5] GetCollectionProductsByFilters: %v, Products: %d, Total: %d",
		queryDuration, len(result.Products), result.TotalCount)

	if err != nil {
		log.Printf("❌ [ERROR] GetCollectionProductsByFilters: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get products"})
		return
	}

	// ---- 8. Конвертируем продукты ----
	startConvert := time.Now()
	products := convertDBProductsToCached(result.Products)
	convertDuration := time.Since(startConvert)
	log.Printf("⏱️ [6] Конвертация продуктов: %v", convertDuration)

	// ---- 9. Получаем фильтры для ответа ----
	startFiltersResponse := time.Now()
	var filtersResponse FiltersResponse

	switch collection.Type {
	case "manual":
		manualFilters, err := s.store.GetFullFiltersForManualCollection(ctx, collection.ID)
		if err != nil {
			log.Printf("⚠️ [WARN] GetFullFiltersForManualCollection: %v", err)
		} else {
			filtersResponse = convertManualFiltersToResponse(&manualFilters)
		}
	case "dynamic", "hybrid":
		// Формируем параметры фильтров из настроек коллекции
		var filtersParams db.GetFullFiltersForCollectionParams
		filtersParams.CollectionID = collection.ID

		if len(collection.Settings) > 0 {
			var settings types.CollectionSettings
			if err := json.Unmarshal(collection.Settings, &settings); err == nil && settings.Filters != nil {
				filtersParams.CollectionTypeIds = settings.Filters.Types
				filtersParams.CollectionCategoryIds = settings.Filters.Categories
				filtersParams.CollectionBrandIds = settings.Filters.Firms
				filtersParams.CollectionLineIds = settings.Filters.Lines
				filtersParams.CollectionBodyTypes = settings.Filters.Bodytypes
				if len(settings.Filters.Price) >= 2 {
					filtersParams.CollectionPriceMin = int32(settings.Filters.Price[0])
					filtersParams.CollectionPriceMax = int32(settings.Filters.Price[1])
				}
				filtersParams.CollectionSizes = settings.Filters.Sizes
				filtersParams.CollectionInStore = settings.Filters.InStore
				filtersParams.CollectionRuleIds = settings.Filters.RuleIDs
			}
		}

		dynamicFilters, err := s.store.GetFullFiltersForCollection(ctx, filtersParams)
		if err != nil {
			log.Printf("⚠️ [WARN] GetFullFiltersForCollection: %v", err)
		} else {
			filtersResponse = convertDynamicFiltersToResponse(&dynamicFilters)
		}
	}
	filtersResponseDuration := time.Since(startFiltersResponse)
	log.Printf("⏱️ [7] Получение фильтров для ответа: %v", filtersResponseDuration)

	// ---- 10. Формируем ответ ----
	startResponse := time.Now()
	response := gin.H{
		"collection": gin.H{
			"id":          collection.ID,
			"slug":        collection.Slug,
			"name":        collection.Name,
			"description": collection.Description.String,
			"type":        collection.Type,
			"is_active":   collection.IsActive.Bool,
		},
		"filters": gin.H{
			"sizes":          toJSONRawMessage(filtersResponse.Sizes, "{}"),
			"bodytypes":      toJSONRawMessage(filtersResponse.Bodytypes, "{}"),
			"min_price":      filtersResponse.MinPrice,
			"max_price":      filtersResponse.MaxPrice,
			"firms":          toJSONRawMessage(filtersResponse.Firms, "{}"),
			"product_types":  toJSONRawMessage(filtersResponse.ProductTypes, "[]"),
			"categories":     toJSONRawMessage(filtersResponse.Categories, "[]"),
			"discount_rules": toJSONRawMessage(filtersResponse.DiscountRules, "[]"),
		},
		"products": products,
		"total":    result.TotalCount,
		"page":     req.Page,
		"limit":    req.Size,
	}
	responseDuration := time.Since(startResponse)
	log.Printf("⏱️ [8] Формирование ответа: %v", responseDuration)

	// ---- 11. Сохраняем в кэш (опционально) ----
	go func() {
		bgCtx := context.Background()
		data, _ := json.Marshal(response)
		s.taskProcessor.SetCollection(bgCtx, int32(collectionID), data)
	}()

	// ---- 12. JSON ответ ----
	startJSON := time.Now()
	c.JSON(http.StatusOK, response)
	jsonDuration := time.Since(startJSON)
	log.Printf("⏱️ [9] ctx.JSON: %v", jsonDuration)

	// ---- ИТОГО ----
	totalDuration := time.Since(startTotal)
	log.Printf("⏱️ [TOTAL] handleGetCollectionProducts: %v", totalDuration)
	log.Printf("✅ [END] handleGetCollectionProducts")
}

// convertDBProductsToCached - конвертирует продукты из БД в кэшируемый формат
