package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/types"
)

// ============ CREATE PROMO CODE ============
func (s *Server) handleAdminCreatePromoCode(c *gin.Context) {
	var input struct {
		Code          string     `json:"code" binding:"required"`
		Name          string     `json:"name"`
		Description   string     `json:"description"`
		DiscountType  string     `json:"discount_type" binding:"required,oneof=percent fixed"`
		DiscountValue int32      `json:"discount_value" binding:"required,gt=0"`
		AppliesTo     string     `json:"applies_to" binding:"required,oneof=global collection"`
		CollectionID  *int32     `json:"collection_id"`
		MinOrder      *int32     `json:"min_order"`
		MaxOrder      *int32     `json:"max_order"`
		MaxDiscount   *int32     `json:"max_discount"`
		StartsAt      time.Time  `json:"starts_at"`
		EndsAt        *time.Time `json:"ends_at"`
		UsageLimit    *int32     `json:"usage_limit"`
		PerUserLimit  *int32     `json:"per_user_limit"`
		IsActive      *bool      `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Валидация
	if input.AppliesTo == "collection" && (input.CollectionID == nil || *input.CollectionID == 0) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "collection_id is required when applies_to is collection"})
		return
	}

	if input.AppliesTo == "global" && input.CollectionID != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "collection_id must be null when applies_to is global"})
		return
	}

	// Проверяем существование коллекции
	if input.CollectionID != nil {
		_, err := s.store.GetCollectionByID(c.Request.Context(), *input.CollectionID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Collection not found"})
			return
		}
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	// Подготовка параметров с pgtype
	var collectionID pgtype.Int4
	if input.CollectionID != nil {
		collectionID = pgtype.Int4{Int32: *input.CollectionID, Valid: true}
	}

	var minOrder pgtype.Int4
	if input.MinOrder != nil {
		minOrder = pgtype.Int4{Int32: *input.MinOrder, Valid: true}
	}

	var maxOrder pgtype.Int4
	if input.MaxOrder != nil {
		maxOrder = pgtype.Int4{Int32: *input.MaxOrder, Valid: true}
	}

	var maxDiscount pgtype.Int4
	if input.MaxDiscount != nil {
		maxDiscount = pgtype.Int4{Int32: *input.MaxDiscount, Valid: true}
	}

	var endsAt pgtype.Timestamptz
	if input.EndsAt != nil {
		endsAt = pgtype.Timestamptz{Time: *input.EndsAt, Valid: true}
	}

	var usageLimit pgtype.Int4
	if input.UsageLimit != nil {
		usageLimit = pgtype.Int4{Int32: *input.UsageLimit, Valid: true}
	}

	var perUserLimit pgtype.Int4
	if input.PerUserLimit != nil {
		perUserLimit = pgtype.Int4{Int32: *input.PerUserLimit, Valid: true}
	}

	var isActive pgtype.Bool
	if input.IsActive != nil {
		isActive = pgtype.Bool{Bool: *input.IsActive, Valid: true}
	} else {
		isActive = pgtype.Bool{Bool: true, Valid: true}
	}

	promoCode, err := s.store.CreatePromoCode(c.Request.Context(), db.CreatePromoCodeParams{
		Code:          input.Code,
		Name:          pgtype.Text{String: input.Name, Valid: input.Name != ""},
		Description:   pgtype.Text{String: input.Description, Valid: input.Description != ""},
		DiscountType:  input.DiscountType,
		DiscountValue: input.DiscountValue,
		AppliesTo:     input.AppliesTo,
		CollectionID:  collectionID,
		MinOrder:      minOrder,
		MaxOrder:      maxOrder,
		MaxDiscount:   maxDiscount,
		StartsAt:      pgtype.Timestamptz{Time: input.StartsAt, Valid: true},
		EndsAt:        endsAt,
		UsageLimit:    usageLimit,
		PerUserLimit:  perUserLimit,
		IsActive:      isActive,
	})
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create promo code"})
		return
	}

	// Логируем
	go s.logAdminAction(adminDB.ID, "create", "promo_code", promoCode.ID,
		fmt.Sprintf("Create promo code: %s (type: %s, applies_to: %s)",
			promoCode.Code, promoCode.DiscountType, promoCode.AppliesTo), c.ClientIP())

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Promo code created successfully",
		"promo_code": promoCode,
	})
}

// ============ GET ALL PROMO CODES ============
func (s *Server) handleAdminGetPromoCodes(c *gin.Context) {
	promoCodes, err := s.store.ListPromoCodes(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get promo codes"})
		return
	}
	if promoCodes == nil {
		promoCodes = []db.ListPromoCodesRow{}
	}

	type PromoCodeResponse struct {
		ID             int32      `json:"id"`
		Code           string     `json:"code"`
		Name           string     `json:"name"`
		Description    string     `json:"description"`
		DiscountType   string     `json:"discount_type"`
		DiscountValue  int32      `json:"discount_value"`
		AppliesTo      string     `json:"applies_to"`
		CollectionID   *int32     `json:"collection_id"`
		CollectionSlug *string    `json:"collection_slug"`
		CollectionName *string    `json:"collection_name"`
		MinOrder       *int32     `json:"min_order"`
		MaxOrder       *int32     `json:"max_order"`
		MaxDiscount    *int32     `json:"max_discount"`
		StartsAt       time.Time  `json:"starts_at"`
		EndsAt         *time.Time `json:"ends_at"`
		UsageLimit     *int32     `json:"usage_limit"`
		PerUserLimit   *int32     `json:"per_user_limit"`
		IsActive       bool       `json:"is_active"`
		UsageCount     int64      `json:"usage_count"`
		CreatedAt      time.Time  `json:"created_at"`
		UpdatedAt      time.Time  `json:"updated_at"`
	}

	response := make([]PromoCodeResponse, 0, len(promoCodes))
	for _, pc := range promoCodes {
		var collectionID *int32
		var collectionSlug *string
		var collectionName *string
		var endsAt *time.Time
		var minOrder *int32
		var maxOrder *int32
		var maxDiscount *int32
		var usageLimit *int32
		var perUserLimit *int32

		// Приведение типа для UsageCount
		var usageCount int64
		if pc.UsageCount != nil {
			switch v := pc.UsageCount.(type) {
			case int64:
				usageCount = v
			case int32:
				usageCount = int64(v)
			case int:
				usageCount = int64(v)
			default:
				usageCount = 0
			}
		}

		if pc.CollectionID.Valid {
			collectionID = &pc.CollectionID.Int32
		}
		if pc.CollectionSlug.Valid {
			collectionSlug = &pc.CollectionSlug.String
		}
		if pc.CollectionName.Valid {
			collectionName = &pc.CollectionName.String
		}
		if pc.EndsAt.Valid {
			endsAt = &pc.EndsAt.Time
		}
		if pc.MinOrder.Valid {
			minOrder = &pc.MinOrder.Int32
		}
		if pc.MaxOrder.Valid {
			maxOrder = &pc.MaxOrder.Int32
		}
		if pc.MaxDiscount.Valid {
			maxDiscount = &pc.MaxDiscount.Int32
		}
		if pc.UsageLimit.Valid {
			usageLimit = &pc.UsageLimit.Int32
		}
		if pc.PerUserLimit.Valid {
			perUserLimit = &pc.PerUserLimit.Int32
		}

		response = append(response, PromoCodeResponse{
			ID:             pc.ID,
			Code:           pc.Code,
			Name:           pc.Name.String,
			Description:    pc.Description.String,
			DiscountType:   pc.DiscountType,
			DiscountValue:  pc.DiscountValue,
			AppliesTo:      pc.AppliesTo,
			CollectionID:   collectionID,
			CollectionSlug: collectionSlug,
			CollectionName: collectionName,
			MinOrder:       minOrder,
			MaxOrder:       maxOrder,
			MaxDiscount:    maxDiscount,
			StartsAt:       pc.StartsAt.Time,
			EndsAt:         endsAt,
			UsageLimit:     usageLimit,
			PerUserLimit:   perUserLimit,
			IsActive:       pc.IsActive.Bool,
			UsageCount:     usageCount,
			CreatedAt:      pc.CreatedAt.Time,
			UpdatedAt:      pc.UpdatedAt.Time,
		})
	}

	c.JSON(http.StatusOK, response)
}

// ============ GET PROMO CODE BY ID ============
func (s *Server) handleAdminGetPromoCode(c *gin.Context) {
	promoCodeID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid promo code ID"})
		return
	}

	promoCode, err := s.store.GetPromoCodeByID(c.Request.Context(), int32(promoCodeID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Promo code not found"})
		return
	}

	// Получаем статистику использования
	stats, err := s.store.GetPromoCodeUsageStats(c.Request.Context(), int32(promoCodeID))
	if err != nil {
		stats = db.GetPromoCodeUsageStatsRow{
			TotalUses:       0,
			TotalDiscount:   0,
			UniqueCustomers: 0,
		}
	}

	type PromoCodeResponse struct {
		ID              int32      `json:"id"`
		Code            string     `json:"code"`
		Name            string     `json:"name"`
		Description     string     `json:"description"`
		DiscountType    string     `json:"discount_type"`
		DiscountValue   int32      `json:"discount_value"`
		AppliesTo       string     `json:"applies_to"`
		CollectionID    *int32     `json:"collection_id"`
		CollectionSlug  *string    `json:"collection_slug"`
		CollectionName  *string    `json:"collection_name"`
		MinOrder        *int32     `json:"min_order"`
		MaxOrder        *int32     `json:"max_order"`
		MaxDiscount     *int32     `json:"max_discount"`
		StartsAt        time.Time  `json:"starts_at"`
		EndsAt          *time.Time `json:"ends_at"`
		UsageLimit      *int32     `json:"usage_limit"`
		PerUserLimit    *int32     `json:"per_user_limit"`
		IsActive        bool       `json:"is_active"`
		UsageCount      int64      `json:"usage_count"`
		TotalUses       int64      `json:"total_uses"`
		TotalDiscount   int64      `json:"total_discount"`
		UniqueCustomers int64      `json:"unique_customers"`
		CreatedAt       time.Time  `json:"created_at"`
		UpdatedAt       time.Time  `json:"updated_at"`
	}

	var collectionID *int32
	var collectionSlug *string
	var collectionName *string
	var endsAt *time.Time
	var minOrder *int32
	var maxOrder *int32
	var maxDiscount *int32
	var usageLimit *int32
	var perUserLimit *int32

	// Приведение типа для UsageCount
	var usageCount = promoCode.UsageCount

	var totalDiscount int64
	if stats.TotalDiscount != nil {
		switch v := stats.TotalDiscount.(type) {
		case int64:
			totalDiscount = v
		case int32:
			totalDiscount = int64(v)
		case int:
			totalDiscount = int64(v)
		default:
			totalDiscount = 0
		}
	}

	if promoCode.CollectionID.Valid {
		collectionID = &promoCode.CollectionID.Int32
	}
	if promoCode.CollectionSlug.Valid {
		collectionSlug = &promoCode.CollectionSlug.String
	}
	if promoCode.CollectionName.Valid {
		collectionName = &promoCode.CollectionName.String
	}
	if promoCode.EndsAt.Valid {
		endsAt = &promoCode.EndsAt.Time
	}
	if promoCode.MinOrder.Valid {
		minOrder = &promoCode.MinOrder.Int32
	}
	if promoCode.MaxOrder.Valid {
		maxOrder = &promoCode.MaxOrder.Int32
	}
	if promoCode.MaxDiscount.Valid {
		maxDiscount = &promoCode.MaxDiscount.Int32
	}
	if promoCode.UsageLimit.Valid {
		usageLimit = &promoCode.UsageLimit.Int32
	}
	if promoCode.PerUserLimit.Valid {
		perUserLimit = &promoCode.PerUserLimit.Int32
	}

	response := PromoCodeResponse{
		ID:              promoCode.ID,
		Code:            promoCode.Code,
		Name:            promoCode.Name.String,
		Description:     promoCode.Description.String,
		DiscountType:    promoCode.DiscountType,
		DiscountValue:   promoCode.DiscountValue,
		AppliesTo:       promoCode.AppliesTo,
		CollectionID:    collectionID,
		CollectionSlug:  collectionSlug,
		CollectionName:  collectionName,
		MinOrder:        minOrder,
		MaxOrder:        maxOrder,
		MaxDiscount:     maxDiscount,
		StartsAt:        promoCode.StartsAt.Time,
		EndsAt:          endsAt,
		UsageLimit:      usageLimit,
		PerUserLimit:    perUserLimit,
		IsActive:        promoCode.IsActive.Bool,
		UsageCount:      usageCount,
		TotalUses:       stats.TotalUses,
		TotalDiscount:   totalDiscount,
		UniqueCustomers: stats.UniqueCustomers,
		CreatedAt:       promoCode.CreatedAt.Time,
		UpdatedAt:       promoCode.UpdatedAt.Time,
	}

	c.JSON(http.StatusOK, response)
}

// ============ GET PROMO CODE BY CODE (PUBLIC) ============
func (s *Server) handleGetPromoCodeByCode(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Promo code is required"})
		return
	}

	// Получаем hash корзины из query параметра
	hash := c.Query("hash")
	if hash == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cart hash is required"})
		return
	}

	promoCode, err := s.store.ValidatePromoCode(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Promo code not found or invalid"})
		return
	}

	// Проверяем, применим ли промокод к корзине
	isValidForCart := true
	var validationMessage string
	var matchingProducts []int32
	var notMatchingProducts []int32

	// Если промокод привязан к коллекции
	if promoCode.AppliesTo == "collection" && promoCode.CollectionID.Valid {
		collectionID := promoCode.CollectionID.Int32

		// Получаем товары из корзины
		cartData, err := s.store.GetCartData(c.Request.Context(), hash)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get cart data"})
			return
		}

		// Собираем ID товаров из корзины
		productIDs := make([]int32, 0, len(cartData))
		for _, item := range cartData {
			productIDs = append(productIDs, item.ID)
		}

		if len(productIDs) > 0 {
			// Получаем коллекцию с её фильтрами
			collection, err := s.store.GetCollectionByID(c.Request.Context(), collectionID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get collection"})
				return
			}

			// Подготавливаем параметры фильтров для SQL запроса
			params := db.CheckProductsInCollectionParams{
				CollectionID: collectionID,
				ProductIds:   productIDs,
				Categories:   []int32{},
				ProductTypes: []int32{},
				Firms:        []int32{},
				Lines:        []int32{},
				Bodytypes:    []string{},
				Sizes:        []string{},
			}

			// Если коллекция динамическая или гибридная - загружаем фильтры
			if collection.Type == "dynamic" || collection.Type == "hybrid" {
				if len(collection.Settings) > 0 {
					var settings types.CollectionSettings
					if err := json.Unmarshal(collection.Settings, &settings); err == nil && settings.Filters != nil {
						params.Categories = settings.Filters.Categories
						params.ProductTypes = settings.Filters.Types
						params.Firms = settings.Filters.Firms
						params.Lines = settings.Filters.Lines
						params.Bodytypes = settings.Filters.Bodytypes
						params.Sizes = settings.Filters.Sizes

						if len(settings.Filters.Price) >= 2 {
							minPrice := int32(settings.Filters.Price[0])
							maxPrice := int32(settings.Filters.Price[1])
							params.Minprice = pgtype.Int4{Int32: minPrice, Valid: minPrice != 0}
							params.Maxprice = pgtype.Int4{Int32: maxPrice, Valid: maxPrice != 0}
						}

						params.InStore = settings.Filters.InStore
					}
				}
			}

			// Выполняем проверку товаров
			results, err := s.store.CheckProductsInCollection(c.Request.Context(), params)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check products in collection"})
				return
			}

			// Проверяем результаты
			for _, result := range results {
				if result.IsInCollection.Bool {
					matchingProducts = append(matchingProducts, result.ProductID)
				} else {
					notMatchingProducts = append(notMatchingProducts, result.ProductID)
				}
			}
		}
	}

	// Формируем ответ
	type PromoCodeResponse struct {
		ID                int32      `json:"id"`
		Code              string     `json:"code"`
		Name              string     `json:"name"`
		Description       string     `json:"description"`
		DiscountType      string     `json:"discount_type"`
		DiscountValue     int32      `json:"discount_value"`
		AppliesTo         string     `json:"applies_to"`
		CollectionID      *int32     `json:"collection_id"`
		CollectionSlug    *string    `json:"collection_slug"`
		CollectionName    *string    `json:"collection_name"`
		MinOrder          *int32     `json:"min_order"`
		MaxOrder          *int32     `json:"max_order"`
		MaxDiscount       *int32     `json:"max_discount"`
		StartsAt          time.Time  `json:"starts_at"`
		EndsAt            *time.Time `json:"ends_at"`
		UsageLimit        *int32     `json:"usage_limit"`
		PerUserLimit      *int32     `json:"per_user_limit"`
		IsActive          bool       `json:"is_active"`
		UsageCount        int64      `json:"usage_count"`
		IsValidForCart    bool       `json:"is_valid_for_cart"`
		ValidationMessage string     `json:"validation_message,omitempty"`
		MatchingProducts  []int32    `json:"matching_products,omitempty"`
	}

	var collectionID *int32
	var collectionSlug *string
	var collectionName *string
	var endsAt *time.Time
	var minOrder *int32
	var maxOrder *int32
	var maxDiscount *int32
	var usageLimit *int32
	var perUserLimit *int32

	var usageCount int64
	if promoCode.UsageCount != nil {
		switch v := promoCode.UsageCount.(type) {
		case int64:
			usageCount = v
		case int32:
			usageCount = int64(v)
		case int:
			usageCount = int64(v)
		default:
			usageCount = 0
		}
	}

	if promoCode.CollectionID.Valid {
		collectionID = &promoCode.CollectionID.Int32
	}
	if promoCode.CollectionSlug.Valid {
		collectionSlug = &promoCode.CollectionSlug.String
	}
	if promoCode.CollectionName.Valid {
		collectionName = &promoCode.CollectionName.String
	}
	if promoCode.EndsAt.Valid {
		endsAt = &promoCode.EndsAt.Time
	}
	if promoCode.MinOrder.Valid {
		minOrder = &promoCode.MinOrder.Int32
	}
	if promoCode.MaxOrder.Valid {
		maxOrder = &promoCode.MaxOrder.Int32
	}
	if promoCode.MaxDiscount.Valid {
		maxDiscount = &promoCode.MaxDiscount.Int32
	}
	if promoCode.UsageLimit.Valid {
		usageLimit = &promoCode.UsageLimit.Int32
	}
	if promoCode.PerUserLimit.Valid {
		perUserLimit = &promoCode.PerUserLimit.Int32
	}

	response := PromoCodeResponse{
		ID:                promoCode.ID,
		Code:              promoCode.Code,
		Name:              promoCode.Name.String,
		Description:       promoCode.Description.String,
		DiscountType:      promoCode.DiscountType,
		DiscountValue:     promoCode.DiscountValue,
		AppliesTo:         promoCode.AppliesTo,
		CollectionID:      collectionID,
		CollectionSlug:    collectionSlug,
		CollectionName:    collectionName,
		MinOrder:          minOrder,
		MaxOrder:          maxOrder,
		MaxDiscount:       maxDiscount,
		StartsAt:          promoCode.StartsAt.Time,
		EndsAt:            endsAt,
		UsageLimit:        usageLimit,
		PerUserLimit:      perUserLimit,
		IsActive:          promoCode.IsActive.Bool,
		UsageCount:        usageCount,
		IsValidForCart:    isValidForCart,
		ValidationMessage: validationMessage,
		MatchingProducts:  matchingProducts,
	}

	c.JSON(http.StatusOK, response)
}

// ============ UPDATE PROMO CODE ============
func (s *Server) handleAdminUpdatePromoCode(c *gin.Context) {
	promoCodeID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid promo code ID"})
		return
	}

	var input struct {
		Code          string     `json:"code"`
		Name          *string    `json:"name"`
		Description   *string    `json:"description"`
		DiscountType  *string    `json:"discount_type" binding:"omitempty,oneof=percent fixed"`
		DiscountValue *int32     `json:"discount_value" binding:"omitempty,gt=0"`
		AppliesTo     *string    `json:"applies_to" binding:"omitempty,oneof=global collection"`
		CollectionID  *int32     `json:"collection_id"`
		MinOrder      *int32     `json:"min_order"`
		MaxOrder      *int32     `json:"max_order"`
		MaxDiscount   *int32     `json:"max_discount"`
		StartsAt      *time.Time `json:"starts_at"`
		EndsAt        *time.Time `json:"ends_at"`
		UsageLimit    *int32     `json:"usage_limit"`
		PerUserLimit  *int32     `json:"per_user_limit"`
		IsActive      *bool      `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	// Проверяем существование промокода
	_, err = s.store.GetPromoCodeByID(c.Request.Context(), int32(promoCodeID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Promo code not found"})
		return
	}

	// Проверяем коллекцию если указана
	if input.CollectionID != nil && *input.CollectionID != 0 {
		_, err := s.store.GetCollectionByID(c.Request.Context(), *input.CollectionID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Collection not found"})
			return
		}
	}

	// Подготовка параметров с pgtype
	var collectionID pgtype.Int4
	if input.CollectionID != nil {
		collectionID = pgtype.Int4{Int32: *input.CollectionID, Valid: true}
	}

	var minOrder pgtype.Int4
	if input.MinOrder != nil {
		minOrder = pgtype.Int4{Int32: *input.MinOrder, Valid: true}
	}

	var maxOrder pgtype.Int4
	if input.MaxOrder != nil {
		maxOrder = pgtype.Int4{Int32: *input.MaxOrder, Valid: true}
	}

	var maxDiscount pgtype.Int4
	if input.MaxDiscount != nil {
		maxDiscount = pgtype.Int4{Int32: *input.MaxDiscount, Valid: true}
	}

	var startsAt pgtype.Timestamptz
	if input.StartsAt != nil {
		startsAt = pgtype.Timestamptz{Time: *input.StartsAt, Valid: true}
	}

	var endsAt pgtype.Timestamptz
	if input.EndsAt != nil {
		endsAt = pgtype.Timestamptz{Time: *input.EndsAt, Valid: true}
	}

	var usageLimit pgtype.Int4
	if input.UsageLimit != nil {
		usageLimit = pgtype.Int4{Int32: *input.UsageLimit, Valid: true}
	}

	var perUserLimit pgtype.Int4
	if input.PerUserLimit != nil {
		perUserLimit = pgtype.Int4{Int32: *input.PerUserLimit, Valid: true}
	}

	var isActive pgtype.Bool
	if input.IsActive != nil {
		isActive = pgtype.Bool{Bool: *input.IsActive, Valid: true}
	}

	var name pgtype.Text
	if input.Name != nil {
		name = pgtype.Text{String: *input.Name, Valid: true}
	}

	var description pgtype.Text
	if input.Description != nil {
		description = pgtype.Text{String: *input.Description, Valid: true}
	}

	var discountType pgtype.Text
	if input.DiscountType != nil {
		discountType = pgtype.Text{String: *input.DiscountType, Valid: true}
	}

	var discountValue pgtype.Int4
	if input.DiscountValue != nil {
		discountValue = pgtype.Int4{Int32: *input.DiscountValue, Valid: true}
	}

	var appliesTo pgtype.Text
	if input.AppliesTo != nil {
		appliesTo = pgtype.Text{String: *input.AppliesTo, Valid: true}
	}

	// Обновляем
	promoCode, err := s.store.UpdatePromoCode(c.Request.Context(), db.UpdatePromoCodeParams{
		ID:            int32(promoCodeID),
		Name:          name,
		Description:   description,
		DiscountType:  discountType,
		DiscountValue: discountValue,
		AppliesTo:     appliesTo,
		CollectionID:  collectionID,
		MinOrder:      minOrder,
		MaxOrder:      maxOrder,
		MaxDiscount:   maxDiscount,
		StartsAt:      startsAt,
		EndsAt:        endsAt,
		UsageLimit:    usageLimit,
		PerUserLimit:  perUserLimit,
		IsActive:      isActive,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update promo code"})
		return
	}

	// Логируем
	go s.logAdminAction(adminDB.ID, "update", "promo_code", promoCode.ID,
		fmt.Sprintf("Updated promo code: %s", promoCode.Code), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"message":    "Promo code updated successfully",
		"promo_code": promoCode,
	})
}

// ============ DELETE PROMO CODE ============
func (s *Server) handleAdminDeletePromoCode(c *gin.Context) {
	promoCodeID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid promo code ID"})
		return
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	// Получаем промокод для логирования
	promoCode, err := s.store.GetPromoCodeByID(c.Request.Context(), int32(promoCodeID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Promo code not found"})
		return
	}

	// Удаляем
	err = s.store.DeletePromoCode(c.Request.Context(), int32(promoCodeID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete promo code"})
		return
	}

	// Логируем
	go s.logAdminAction(adminDB.ID, "delete", "promo_code", promoCode.ID,
		fmt.Sprintf("Deleted promo code: %s", promoCode.Code), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"message": "Promo code deleted successfully"})
}

// ============ CHECK PROMO CODE USAGE BY CUSTOMER ============
func (s *Server) handleAdminCheckPromoCodeUsage(c *gin.Context) {
	promoCodeID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid promo code ID"})
		return
	}

	customerID, err := strconv.Atoi(c.Query("customer_id"))
	if err != nil || customerID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	usedCount, err := s.store.CheckPromoCodeUsageByCustomer(c.Request.Context(), db.CheckPromoCodeUsageByCustomerParams{
		PromoCodeID: int32(promoCodeID),
		CustomerID:  pgtype.Int4{Int32: int32(customerID), Valid: true},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check usage"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"used_count": usedCount,
	})
}
