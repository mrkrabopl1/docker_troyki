package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"mime/multipart"
	"net/http"
	"net/netip"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/services"
	"github.com/mrkrabopl1/go_db/types"
	"github.com/mrkrabopl1/go_db/util"
	"github.com/mrkrabopl1/go_db/worker"
	"golang.org/x/crypto/bcrypt"
)

// ========== АВТОРИЗАЦИЯ ==========

type AdminLoginRequest struct {
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required"`
	RememberMe bool   `json:"remember"` // добавляем поле
}

func (s *Server) logAdminAction(adminID int32, action, entityType string, entityID int32, details, ip string) {
	go func() {
		baseCtx := context.Background()

		var ipAddr *netip.Addr
		if ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		params := db.CreateAdminLogParams{
			AdminID:    adminID,
			Action:     action,
			EntityType: pgtype.Text{String: entityType, Valid: entityType != ""},
			EntityID:   pgtype.Int4{Int32: entityID, Valid: entityID != 0},
			Details:    pgtype.Text{String: details, Valid: details != ""},
			IpAddress:  ipAddr,
		}

		_ = s.store.CreateAdminLog(baseCtx, params)
	}()
}
func (s *Server) handleAdminLogin(c *gin.Context) {
	var req AdminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, err := s.store.GetAdminByEmail(c.Request.Context(), req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword(admin.PasswordHash, []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !admin.IsActive.Bool {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account is disabled"})
		return
	}

	// Выбираем длительность в зависимости от rememberMe
	var accessTokenDuration time.Duration
	var refreshTokenDuration time.Duration

	if req.RememberMe {
		accessTokenDuration = 15 * time.Minute     // 15 минут для access токена
		refreshTokenDuration = 30 * 24 * time.Hour // 30 дней для refresh токена
	} else {
		accessTokenDuration = 15 * time.Minute // 15 минут
		refreshTokenDuration = 2 * time.Hour   // 2 часа для refresh токена
	}

	// ✅ Генерируем ACCESS токен (короткоживущий)
	accessToken, _, err := s.tokenMaker.CreateAdminToken(admin.ID, accessTokenDuration)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
		return
	}

	// ✅ Генерируем REFRESH токен (долгоживущий)
	refreshToken, _, err := s.tokenMaker.CreateToken(admin.ID, false, refreshTokenDuration)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	// ✅ Устанавливаем REFRESH токен в HTTP-only cookie (безопасно)
	// Важно: path="/admin/auth/refresh" - только для refresh эндпоинта
	c.SetCookie(
		"refresh_token",                     // name
		refreshToken,                        // value
		int(refreshTokenDuration.Seconds()), // maxAge
		"/admin/auth/refresh",               // path - только для refresh!
		"",                                  // domain
		false,                               // secure (true в production с HTTPS)
		true,                                // httpOnly - недоступен для JS
	)

	// Опционально: можно также положить access token в cookie, но обычно его возвращают в теле
	// Если хотите использовать cookie для access token:
	c.SetCookie(
		"admin_token",                      // name
		accessToken,                        // value
		int(accessTokenDuration.Seconds()), // maxAge
		"/",                                // path - для всех админских запросов
		"",                                 // domain
		false,                              // secure
		true,                               // httpOnly
	)

	// Обновляем last_login
	go func() {
		ip := c.ClientIP()
		var ipAddr *netip.Addr
		if parsed, err := netip.ParseAddr(ip); err == nil {
			ipAddr = &parsed
		}
		s.store.UpdateAdminLastLogin(c.Request.Context(), db.UpdateAdminLastLoginParams{
			ID:          admin.ID,
			LastLoginIp: ipAddr,
		})
	}()

	// ✅ Возвращаем ACCESS токен в теле ответа
	c.JSON(http.StatusOK, gin.H{
		"access_token":       accessToken, // access token для заголовка Authorization
		"token_type":         "Bearer",
		"expires_in":         int(accessTokenDuration.Seconds()),
		"refresh_expires_in": int(refreshTokenDuration.Seconds()),
		"admin": gin.H{
			"id":        admin.ID,
			"email":     admin.Email,
			"name":      admin.Name,
			"role":      admin.Role,
			"is_active": admin.IsActive.Bool,
		},
	})
}

// ========== УПРАВЛЕНИЕ ТОВАРАМИ ==========

type CreateProductRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	CategoryID  int32  `json:"category_id" binding:"required"`
	TypeID      int32  `json:"type_id" binding:"required"`
	BrandID     int32  `json:"brand_id" binding:"required"`
	Firm        string `json:"firm"`
	LineID      int32  `json:"line_id"`
	Article     string `json:"article"`
	BodyType    string `json:"bodytype"`
	Sizes       map[string]SizeData
	SessionID   string `json:"session_id" binding:"required"`
}

func (s *Server) handleAdminCreateProduct(c *gin.Context) {
	// ========== 1. ПОЛУЧАЕМ ДАННЫЕ (ТОЛЬКО JSON, БЕЗ ФАЙЛОВ) ==========
	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, _ := c.Get("admin")

	adminRow := admin.(db.GetAdminByIDRow)

	// ========== 2. ВАЛИДАЦИЯ ==========
	if req.Article == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Article is required"})
		return
	}
	if req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product name is required"})
		return
	}
	if req.BrandID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Brand is required"})
		return
	}
	if req.CategoryID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category is required"})
		return
	}
	if req.TypeID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Type is required"})
		return
	}
	if len(req.Sizes) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one size is required"})
		return
	}
	if req.SessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session ID is required"})
		return
	}

	// ========== 3. ПРОВЕРКА НА ДУБЛИКАТЫ ==========
	exists, err := s.store.CheckProductExists(c.Request.Context(), db.CheckProductExistsParams{
		Article: req.Article,
		Name:    req.Name,
		BrandID: req.BrandID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing product"})
		return
	}
	if exists.ArticleExists {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Product with this article already exists",
			"field": "article",
			"value": req.Article,
		})
		return
	}
	if exists.NameFirmExists {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Product with this name and firm already exists",
			"field": "name_firm",
			"name":  req.Name,
		})
		return
	}

	// ========== 4. ПРОВЕРКА КАТЕГОРИИ И ТИПА ==========
	categoryExists, err := s.store.CheckCategoryExistsById(c.Request.Context(), req.CategoryID)
	if err != nil || !categoryExists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category"})
		return
	}

	typeExists, err := s.store.CheckTypeExistsByIds(c.Request.Context(), db.CheckTypeExistsByIdsParams{
		Type:     req.TypeID,
		Category: req.CategoryID,
	})
	if err != nil || !typeExists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type for this category"})
		return
	}

	// ========== 5. ПРОВЕРКА BODY TYPE ==========
	validBodyTypes := map[string]bool{"man": true, "woman": true, "child": true, "unisex": true}
	if !validBodyTypes[req.BodyType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid body type. Allowed: man, woman, child, unisex"})
		return
	}

	// ========== 6. ПОДСЧЕТ MIN/MAX PRICE ==========
	var minPrice, maxPrice int32
	for size, sizeData := range req.Sizes {
		if size == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Size name cannot be empty"})
			return
		}
		if sizeData.Price <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Price must be greater than 0 for size: " + size})
			return
		}
		if sizeData.Quantity < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Quantity cannot be negative for size: " + size})
			return
		}
		if minPrice == 0 || sizeData.Price < minPrice {
			minPrice = sizeData.Price
		}
		if sizeData.Price > maxPrice {
			maxPrice = sizeData.Price
		}
	}

	// ========== 7. ПРОВЕРЯЕМ СУЩЕСТВОВАНИЕ ВРЕМЕННЫХ ФАЙЛОВ ==========
	tempDir := filepath.Join(s.imageService.BaseDir, "temp", req.SessionID)
	if _, err := os.Stat(tempDir); os.IsNotExist(err) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No images found for this session"})
		return
	}

	files, err := os.ReadDir(tempDir)
	if err != nil || len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No images found for this session"})
		return
	}

	// ========== 8. СОЗДАЕМ ТОВАР В БД ==========
	sizesJSON, err := json.Marshal(req.Sizes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal sizes"})
		return
	}

	var bodyTypeEnum db.BodyEnum
	switch req.BodyType {
	case "child":
		bodyTypeEnum = db.BodyEnumChild
	case "woman":
		bodyTypeEnum = db.BodyEnumWoman
	case "man":
		bodyTypeEnum = db.BodyEnumMan
	case "unisex":
		bodyTypeEnum = db.BodyEnumUnisex
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid body type"})
		return
	}
	data, err := s.store.GetCategoryAndTypeByIDs(c.Request.Context(), db.GetCategoryAndTypeByIDsParams{
		CategoryID: req.CategoryID,
		TypeID:     req.TypeID,
		BrandID:    req.BrandID,
	})
	// СТРОИМ ПРАВИЛЬНЫЙ СТРУКТУРИРОВАННЫЙ ПУТЬ
	pathParams := services.StructuredPathParams{
		Firm:     data.BrandKey, // используем brand_key из запроса
		Category: data.CategoryKey,
		Type:     data.TypeKey,
		Name:     req.Name,
		Article:  req.Article,
	}
	fmt.Println(pathParams, "eeeeeeeeeeeeeeeeeeeeeeeee")
	relativePath := filepath.Join("products/", s.imageService.BuildStructuredPath(pathParams)) // ПРАВИЛЬНЫЙ СТРУКТУРИРОВАННЫЙ ПУТЬ
	fmt.Println(relativePath, "rrrrrrrrrrrrrrrrrrrrrrrrrr")
	timestamp := time.Now().UnixMilli()
	compositeID := fmt.Sprintf("%s_%s_%s_%s", req.Firm, data.TypeKey, timestamp)
	params := db.CreateProductWithIdsParams{
		QID:        compositeID,
		CategoryID: data.CategoryID,
		TypeID:     data.TypeID,
		BrandID:    req.BrandID,
		Name:       req.Name,
		LineID: pgtype.Int4{
			Int32: int32(req.LineID),
			Valid: req.LineID != 0,
		},
		ImagePath:   relativePath, // ПРАВИЛЬНЫЙ ПУТЬ
		Minprice:    minPrice,
		Maxprice:    maxPrice,
		Article:     req.Article,
		Description: pgtype.Text{String: req.Description, Valid: req.Description != ""},
		ImageCount:  int32(len(files)),
		Sizes:       sizesJSON,
		Bodytype:    bodyTypeEnum,
		Date: pgtype.Text{
			String: time.Now().Format("2006-01-02 15:04:05"),
			Valid:  true,
		},
	}

	product, err := s.store.CreateProductWithIds(c.Request.Context(), params)
	if err != nil {
		fmt.Printf("Failed to create product in DB: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}
	var productIDs []int32
	var values [][]byte
	var discountPercents []int32
	var originalPrices []int32
	var discountedPrices []int32
	var minPrices []int32
	var maxPrices []int32

	for sizeName, sizeData := range req.Sizes {
		// Если есть скидка
		if sizeData.Discount > 0 {
			productIDs = append(productIDs, product.ID)

			// Формируем value для этого размера
			discountValue := map[string]interface{}{
				"original_price":   sizeData.Price,
				"discounted_price": sizeData.Price - sizeData.Discount,
				"percent":          sizeData.Discount,
			}

			// Для каждого размера своя скидка
			sizeDiscounts := map[string]interface{}{
				sizeName: discountValue,
			}

			discountJSON, err := json.Marshal(sizeDiscounts)
			if err != nil {
				fmt.Printf("Failed to marshal discount for size %s: %v\n", sizeName, err)
				continue
			}

			values = append(values, discountJSON)
			discountPercents = append(discountPercents, sizeData.Discount)
			originalPrices = append(originalPrices, sizeData.Price)
			discountedPrices = append(discountedPrices, sizeData.Price-sizeData.Discount)
			minPrices = append(minPrices, sizeData.Price-sizeData.Discount)
			maxPrices = append(maxPrices, sizeData.Price)
		}
	}

	// Вставляем скидки если есть
	if len(productIDs) > 0 {
		err = s.store.BulkUpsertDiscount(c.Request.Context(), db.BulkUpsertDiscountParams{
			ProductIds:       productIDs,
			Values:           values,
			DiscountPercents: discountPercents,
			OriginalPrices:   originalPrices,
			DiscountedPrices: discountedPrices,
			MinPrices:        minPrices,
			MaxPrices:        maxPrices,
		})
		if err != nil {
			// Логируем ошибку, но не откатываем создание продукта
			fmt.Printf("Failed to insert discounts: %v\n", err)
		}
	}
	// ========== 9. КОНВЕРТИРУЕМ ИЗ TEMP В WEBP ==========
	savedCount, err := s.imageService.ConvertTempToProduct(req.SessionID, relativePath)
	if err != nil || savedCount == 0 {
		s.store.DeleteHardProduct(c.Request.Context(), product.ID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to convert images"})
		return
	}

	// Чистим temp
	s.imageService.CleanTemp(req.SessionID)

	// ========== 10. ЛОГИРУЕМ ==========
	go func() {
		ctx := context.Background()
		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		logParams := db.CreateAdminLogParams{
			AdminID:    adminRow.ID,
			Action:     "create",
			EntityType: pgtype.Text{String: "product", Valid: true},
			EntityID:   pgtype.Int4{Int32: product.ID, Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Created product: %s (Article: %s) with %d images", req.Name, req.Article, savedCount), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, logParams)
	}()

	// ========== 11. ОТВЕТ ==========
	c.JSON(http.StatusOK, gin.H{
		"message":     "Product created successfully",
		"id":          product.ID,
		"qId":         product.Qid,
		"article":     product.Article,
		"image_path":  relativePath,
		"image_count": len(files),
	})
}

type UpdateProductRequest struct {
	Name        *string              `json:"name"`
	Description *string              `json:"description"`
	CategoryID  *int32               `json:"category_id"`
	TypeID      *int32               `json:"type_id"`
	BrandID     *int32               `json:"brand_id"`
	LineID      *int32               `json:"line_id"`
	Article     *string              `json:"article"`
	BodyType    *string              `json:"bodytype"`
	Sizes       *map[string]SizeData `json:"sizes"` // ← добавить sizes
}

func (s *Server) handleAdminUpdateProduct(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, _ := c.Get("admin")
	adminRow := admin.(db.GetAdminByIDRow)
	// Проверяем, существует ли товар
	_, err = s.store.CheckProductExistsById(c.Request.Context(), int32(productID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Если переданы sizes - пересчитываем minprice и maxprice
	var minPrice, maxPrice int32
	var sizesJSON []byte

	if req.Sizes != nil {
		for size, sizeData := range *req.Sizes {
			if sizeData.Price <= 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Price must be greater than 0 for size: " + size})
				return
			}
			if sizeData.Quantity < 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Quantity cannot be negative for size: " + size})
				return
			}
			if minPrice == 0 || sizeData.Price < minPrice {
				minPrice = sizeData.Price
			}
			if sizeData.Price > maxPrice {
				maxPrice = sizeData.Price
			}
		}

		sizesJSON, err = json.Marshal(req.Sizes)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal sizes"})
			return
		}
	}

	// Формируем параметры обновления
	params := db.UpdateProductParams{
		ID: int32(productID),
	}

	if req.Name != nil {
		params.Name = *req.Name
	}
	if req.Description != nil {
		params.Description = pgtype.Text{String: *req.Description, Valid: true}
	}
	if req.CategoryID != nil {
		params.Category = *req.CategoryID
	}
	if req.CategoryID != nil {
		params.Category = *req.CategoryID
	}
	if req.TypeID != nil {
		params.Type = *req.TypeID
	}
	if req.BrandID != nil {
		params.BrandID = *req.BrandID
	}
	if req.LineID != nil {
		params.LineID = pgtype.Int4{Int32: *req.LineID, Valid: true}
	}
	if req.Article != nil {
		params.Article = *req.Article
	}
	if req.BodyType != nil {
		params.Bodytype = db.BodyEnum(*req.BodyType)
	}
	if req.Sizes != nil {
		params.Minprice = minPrice
		params.Maxprice = maxPrice
		params.ImageCount = int32(len(*req.Sizes))
		params.Sizes = sizesJSON
	}
	fmt.Printf("%+v\n", params)
	err = s.store.UpdateProduct(c.Request.Context(), params)
	if err != nil {
		fmt.Println(err, "d11111111111111111")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}

	// Логируем
	go func() {
		ctx := context.Background()
		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}
		logParams := db.CreateAdminLogParams{
			AdminID:    adminRow.ID,
			Action:     "update",
			EntityType: pgtype.Text{String: "product", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(productID), Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Updated product ID: %d", productID), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, logParams)
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Product updated successfully"})
}

func (s *Server) handleAdminHardDeleteProduct(c *gin.Context) {
	// ========== 1. ПОЛУЧАЕМ ID ==========
	productID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	admin, _ := c.Get("admin")

	adminRow := admin.(db.GetAdminByIDRow)

	// ========== 2. ПРОВЕРЯЕМ, ЕСТЬ ЛИ ТОВАР В ЗАКАЗАХ ==========
	hasOrders, err := s.store.CheckProductInOrders(c.Request.Context(), int32(productID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check orders"})
		return
	}

	hasPreorders, err := s.store.CheckProductInPreorders(c.Request.Context(), int32(productID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check preorders"})
		return
	}

	if hasOrders || hasPreorders {
		c.JSON(http.StatusConflict, gin.H{
			"error":        "Cannot delete product: it exists in orders or preorders",
			"in_orders":    hasOrders,
			"in_preorders": hasPreorders,
		})
		return
	}

	// ========== 3. ПОЛУЧАЕМ ИНФОРМАЦИЮ О ТОВАРЕ ==========
	product, err := s.store.GetProductsInfoById(c.Request.Context(), int32(productID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// ========== 4. УДАЛЯЕМ ПАПКУ ТОВАРА ==========
	if product.ImagePath != "" {
		physicalPath := s.imageService.GetPhysicalPath(product.ImagePath)
		if err := os.RemoveAll(physicalPath); err != nil {
			fmt.Printf("Failed to delete product folder %s: %v\n", physicalPath, err)
		}
	}

	// ========== 5. УДАЛЯЕМ ТОВАР ИЗ БД ==========
	if _, err := s.store.DeleteHardProduct(c.Request.Context(), int32(productID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
		return
	}

	// ========== 9. ЛОГИРУЕМ ДЕЙСТВИЕ ==========
	go func() {
		ctx := context.Background()

		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		params := db.CreateAdminLogParams{
			AdminID:    adminRow.ID,
			Action:     "hard_delete",
			EntityType: pgtype.Text{String: "product", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(productID), Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Hard deleted product: %s (Article: %s) with %d images", product.Name, product.Article, product.ImageCount), Valid: true},
			IpAddress:  ipAddr,
		}

		_ = s.store.CreateAdminLog(ctx, params)
	}()

	// ========== 10. ОТВЕТ ==========
	c.JSON(http.StatusOK, gin.H{
		"message": "Product permanently deleted successfully",
		"id":      productID,
		"article": product.Article,
	})
}

func (s *Server) handleAdminUploadProductImage(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image file is required"})
		return
	}

	admin, _ := c.Get("admin")
	adminRow := admin.(db.GetAdminByIDRow)

	// Получаем текущее количество изображений товара
	product, err := s.store.GetProductsInfoById(c.Request.Context(), int32(productID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get product images"})
		return
	}
	nextNumber := product.ImageCount + 1

	// Сохраняем через ImageService (вся логика внутри)
	imageURL, thumbURL, err := s.imageService.SaveProductImage(product.ImagePath, file, int(nextNumber))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Обновляем счетчик в БД
	err = s.store.UpdateProductImageCount(c.Request.Context(), db.UpdateProductImageCountParams{
		ID:         int32(productID),
		ImageCount: nextNumber,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}

	// Логируем
	go func() {
		ctx := context.Background()
		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		params := db.CreateAdminLogParams{
			AdminID:    adminRow.ID,
			Action:     "upload",
			EntityType: pgtype.Text{String: "product", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(productID), Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Uploaded image #%d for product ID: %d", nextNumber, productID), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{
		"message":      "Image uploaded successfully",
		"image_url":    imageURL,
		"thumb_url":    thumbURL,
		"image_number": nextNumber,
	})
}
func (s *Server) handleAdminDeleteProductImage(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req struct {
		ImagePath string `json:"imagePath" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, _ := c.Get("admin")
	adminRow := admin.(db.GetAdminByIDRow)

	// Получаем информацию о товаре
	product, err := s.store.GetProductsInfoById(c.Request.Context(), int32(productID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get product info"})
		return
	}

	// Удаляем файлы (и .webp и _thumb.webp)
	// req.ImagePath может быть "products/123/img1.webp" или просто "img1.webp"
	fullPath := filepath.Join(s.imageService.BaseDir, req.ImagePath)

	// Удаляем оригинал
	if err := os.Remove(fullPath); err != nil && !os.IsNotExist(err) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image file"})
		return
	}

	// Удаляем thumb
	ext := filepath.Ext(fullPath)
	thumbPath := strings.Replace(fullPath, ext, "_thumb"+ext, 1)
	os.Remove(thumbPath) // не страшно если нет

	// Получаем актуальное количество изображений
	newCount := s.imageService.CountExistingProductImages(product.ImagePath)
	if newCount < 0 {
		newCount = 0
	}

	// Обновляем счетчик в БД
	err = s.store.UpdateProductImageCount(c.Request.Context(), db.UpdateProductImageCountParams{
		ID:         int32(productID),
		ImageCount: newCount,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}

	// Логируем
	go func() {
		ctx := context.Background()
		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		params := db.CreateAdminLogParams{
			AdminID:    adminRow.ID,
			Action:     "delete",
			EntityType: pgtype.Text{String: "product", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(productID), Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Deleted image %s for product ID: %d", req.ImagePath, productID), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Image deleted successfully"})
}

func (s *Server) handleAdminGetTempImages(c *gin.Context) {
	// ========== 1. ПРОВЕРКА АДМИНА ==========
	_, exists := c.Get("admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	sessionID := c.Param("session_id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session ID is required"})
		return
	}

	// ========== 2. ЧИТАЕМ ПАПКУ ==========
	tempDir := filepath.Join(s.imageService.BaseDir, "temp", sessionID)

	// Если папки нет - возвращаем пустой массив
	if _, err := os.Stat(tempDir); os.IsNotExist(err) {
		c.JSON(http.StatusOK, gin.H{
			"images": []string{},
			"count":  0,
		})
		return
	}

	files, err := os.ReadDir(tempDir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read temp directory"})
		return
	}

	// ========== 3. ФОРМИРУЕМ URL ==========
	var images []string
	for _, file := range files {
		if file.IsDir() {
			continue
		}
		imageURL := fmt.Sprintf("/temp/products/%s/%s", sessionID, file.Name())
		images = append(images, imageURL)
	}

	// ========== 4. ОТВЕТ ==========
	c.JSON(http.StatusOK, gin.H{
		"images": images,
		"count":  len(images),
	})
}
func (s *Server) handleAdminUploadTempImage(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session ID is required"})
		return
	}

	// Проверка админа
	_, exists := c.Get("admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get image"})
		return
	}

	_, err = s.imageService.SaveTempImage(sessionID, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Получаем все файлы в папке
	tempDir := filepath.Join(s.imageService.BaseDir, "temp", sessionID)
	var allImages []string

	if files, err := os.ReadDir(tempDir); err == nil {
		for _, f := range files {
			if f.IsDir() {
				continue
			}
			// Добавляем все существующие файлы
			existingURL := s.imageService.ImagePathBuilder.GetImageURLFromPath(fmt.Sprintf("temp/%s/%s", sessionID, f.Name()))
			allImages = append(allImages, existingURL)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"images":  allImages, // все изображения в сессии
		"temp_id": sessionID,
	})
}

func (s *Server) handleAdminDeleteTempImage(c *gin.Context) {
	sessionID := c.Param("id")
	filename := c.Query("filename")
	if filename == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Filename is required"})
		return
	}

	// Проверка на безопасность - не даем удалить файлы вне директории
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid filename"})
		return
	}

	// Формируем путь к файлу
	tempDir := filepath.Join(s.imageService.BaseDir, "temp", sessionID)
	filePath := filepath.Join(tempDir, filename)

	// Проверяем существование файла
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// Удаляем файл
	if err := os.Remove(filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file"})
		return
	}

	// Получаем обновленный список файлов
	allImages := []string{}
	files, err := os.ReadDir(tempDir)
	if err == nil {
		for _, f := range files {
			if f.IsDir() {
				continue
			}
			existingURL := s.imageService.ImagePathBuilder.GetImageURLFromPath(fmt.Sprintf("temp/%s/%s", sessionID, f.Name()))
			allImages = append(allImages, existingURL)
		}
	}

	// Если файлов больше нет - удаляем папку
	if len(allImages) == 0 {
		if err := os.Remove(tempDir); err != nil {
			// Если не удалось удалить - просто логируем, не фатально
			// Но можно и вернуть ошибку, если хотите
			_ = err
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "File deleted successfully",
		"images":  allImages,
		"temp_id": sessionID,
	})
}

func (s *Server) handleAdminDeleteProductImages(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req struct {
		ImageURLs []string `json:"image_urls" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, _ := c.Get("admin")
	adminID := admin.(db.GetAdminByIDRow).ID

	// Удаляем файлы
	for _, imageURL := range req.ImageURLs {
		s.imageService.DeleteProductImage(imageURL)
	}

	// Получаем текущее количество изображений товара
	product, err := s.store.GetProductsInfoById(c.Request.Context(), int32(productID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get product images"})
		return
	}
	newCount := product.ImageCount - int32(len(req.ImageURLs))
	if newCount < 0 {
		newCount = 0
	}

	// Обновляем счетчик в БД
	err = s.store.UpdateProduct(c.Request.Context(), db.UpdateProductParams{
		ID:         int32(productID),
		ImageCount: newCount,
	})

	// Логируем действие
	go func() {
		ctx := context.Background()

		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		params := db.CreateAdminLogParams{
			AdminID:    adminID,
			Action:     "delete",
			EntityType: pgtype.Text{String: "product", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(productID), Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Deleted %d images for product ID: %s", len(req.ImageURLs), c.Param("id")), Valid: true},
			IpAddress:  ipAddr,
		}

		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Images deleted successfully"})
}

// ========== УПРАВЛЕНИЕ АДМИНАМИ (только superadmin) ==========

type CreateAdminRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required"`
	Role     string `json:"role" binding:"required,oneof=admin superadmin"`
}

func (s *Server) handleAdminCreateAdmin(c *gin.Context) {
	var req CreateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	currentAdminID, _ := c.Get("admin")

	// Хешируем пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Проверяем, не существует ли уже такой email
	existing, _ := s.store.GetAdminByEmail(c.Request.Context(), req.Email)
	if existing.ID != 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Admin with this email already exists"})
		return
	}

	// Конвертируем string в AdminRoleEnum
	var roleEnum db.AdminRoleEnum
	switch req.Role {
	case "admin":
		roleEnum = db.AdminRoleEnumAdmin
	case "superadmin":
		roleEnum = db.AdminRoleEnumSuperadmin
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role. Must be 'admin' or 'superadmin'"})
		return
	}

	admin, err := s.store.CreateAdmin(c.Request.Context(), db.CreateAdminParams{
		Email:        req.Email,
		Name:         req.Name,
		Role:         roleEnum,
		PasswordHash: hashedPassword,
		IsActive:     pgtype.Bool{Bool: true, Valid: true},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create admin"})
		return
	}

	// Логируем действие
	go func() {
		ctx := context.Background()
		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		params := db.CreateAdminLogParams{
			AdminID:    currentAdminID.(int32),
			Action:     "create",
			EntityType: pgtype.Text{String: "admin", Valid: true},
			EntityID:   pgtype.Int4{Int32: admin.ID, Valid: true},
			Details:    pgtype.Text{String: "Created admin: " + req.Email, Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Admin created successfully",
		"id":      admin.ID,
	})
}

func (s *Server) handleAdminGetAdmins(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	admins, err := s.store.ListAdmins(c.Request.Context(), db.ListAdminsParams{
		Offset: int32((page - 1) * limit),
		Limit:  int32(limit),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get admins"})
		return
	}

	// ✅ Ключевое исправление: проверяем на nil и заменяем на пустой слайс
	if admins == nil {
		admins = []db.ListAdminsRow{} // или []YourAdminType{}
	}

	fmt.Printf("Admins: %+v\n", admins)
	c.JSON(http.StatusOK, gin.H{
		"admins": admins, // теперь это будет [] а не null
		"page":   page,
		"limit":  limit,
	})
}

func (s *Server) handleAdminDeleteAdmin(c *gin.Context) {
	adminID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid admin ID"})
		return
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)
	currentAdminID := adminDB.ID
	// Не даем удалить самого себя
	if currentAdminID == int32(adminID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete your own account"})
		return
	}

	err = s.store.DeleteAdmin(c.Request.Context(), int32(adminID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete admin"})
		return
	}

	// Логируем действие
	go func() {
		ctx := context.Background()

		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		params := db.CreateAdminLogParams{
			AdminID:    currentAdminID,
			Action:     "delete",
			EntityType: pgtype.Text{String: "admin", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(adminID), Valid: true},
			Details:    pgtype.Text{String: "Deleted admin ID: " + c.Param("id"), Valid: true},
			IpAddress:  ipAddr,
		}

		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Admin deleted successfully"})
}

func (s *Server) handleAdminUpdateAdmin(c *gin.Context) {
	adminID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid admin ID"})
		return
	}

	admin, exists := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)
	currentAdminID := adminDB.ID
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Не даем обновить самого себя (опционально, можно разрешить кроме роли)
	if currentAdminID == int32(adminID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot update your own account through this endpoint"})
		return
	}

	var req struct {
		Name     *string `json:"name"`
		Role     *string `json:"role"`
		IsActive *bool   `json:"is_active"`
		Password *string `json:"password"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Проверяем, что хотя бы одно поле для обновления передано
	if req.Name == nil && req.Role == nil && req.IsActive == nil && req.Password == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	// Получаем текущие данные админа для логирования изменений
	currentAdmin, err := s.store.GetAdminByID(c.Request.Context(), int32(adminID))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Admin not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get admin data"})
		return
	}

	// Собираем детали изменений для лога
	var changes []string

	// Обновление основных данных
	if req.Name != nil || req.Role != nil || req.IsActive != nil {
		params := db.UpdateAdminParams{
			AdminID: int32(adminID),
		}

		if req.Name != nil {
			params.Name = pgtype.Text{String: *req.Name, Valid: true}
			if currentAdmin.Name != *req.Name {
				changes = append(changes, fmt.Sprintf("name: %s -> %s", currentAdmin.Name, *req.Name))
			}
		}

		if req.Role != nil {
			// Проверяем валидность роли
			validRoles := map[string]bool{"admin": true, "superadmin": true}
			if !validRoles[*req.Role] {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role. Must be 'admin' or 'superadmin'"})
				return
			}

			params.Role = db.NullAdminRoleEnum{
				AdminRoleEnum: db.AdminRoleEnum(*req.Role),
				Valid:         true,
			}
			if string(currentAdmin.Role) != *req.Role {
				changes = append(changes, fmt.Sprintf("role: %s -> %s", currentAdmin.Role, *req.Role))
			}
		}

		if req.IsActive != nil {
			params.IsActive = pgtype.Bool{Bool: *req.IsActive, Valid: true}
			if currentAdmin.IsActive.Bool != *req.IsActive {
				changes = append(changes, fmt.Sprintf("is_active: %v -> %v", currentAdmin.IsActive.Bool, *req.IsActive))
			}
		}

		if err := s.store.UpdateAdmin(c.Request.Context(), params); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update admin: " + err.Error()})
			return
		}
	}

	// Обновление пароля отдельно
	if req.Password != nil && *req.Password != "" {
		if len(*req.Password) < 6 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters"})
			return
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}

		err = s.store.UpdateAdminPassword(c.Request.Context(), db.UpdateAdminPasswordParams{
			ID:           int32(adminID),
			PasswordHash: hashedPassword,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
			return
		}
		changes = append(changes, "password updated")
	}

	// Логируем действие
	go func() {
		ctx := context.Background()

		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		details := fmt.Sprintf("Updated admin ID: %d (%s)", adminID, currentAdmin.Email)
		if len(changes) > 0 {
			details += "\nChanges: " + strings.Join(changes, ", ")
		}

		params := db.CreateAdminLogParams{
			AdminID:    currentAdminID,
			Action:     "update",
			EntityType: pgtype.Text{String: "admin", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(adminID), Valid: true},
			Details:    pgtype.Text{String: details, Valid: true},
			IpAddress:  ipAddr,
		}

		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Admin updated successfully",
		"changes": changes,
	})
}

type UpdateProductStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=active archived deleted draft"`
}

func (s *Server) handleAdminUpdateProductStatus(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req UpdateProductStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	// Проверяем, существует ли товар
	exists, err := s.store.CheckProductExistsById(c.Request.Context(), int32(productID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check product"})
		return
	}
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	fmt.Println("flmd;smfs;dmf;sldmf;sdlm")
	// Обновляем статус
	err = s.store.UpdateProductStatus(c.Request.Context(), db.UpdateProductStatusParams{
		ID:     int32(productID),
		Status: req.Status,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product status"})
		return
	}

	// Логируем действие
	go func() {
		ctx := context.Background()
		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		params := db.CreateAdminLogParams{
			AdminID:    adminDB.ID,
			Action:     "update",
			EntityType: pgtype.Text{String: "product", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(productID), Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Updated product ID: %d status to %s", productID, req.Status), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Product status updated successfully",
		"status":  req.Status,
	})
}

type BulkUpdateStatusRequest struct {
	ProductIDs []int32 `json:"product_ids"`
	SelectAll  bool    `json:"select_all"`
	ExcludeIDs []int32 `json:"exclude_ids"`
	Status     string  `json:"status" binding:"required"`

	// Для select_all режима
	Filters *ProductFilters `json:"filters"`
	Search  string          `json:"search"`
}

func (s *Server) handleAdminBulkUpdateProductStatus(c *gin.Context) {
	var req BulkUpdateStatusRequest
	fmt.Printf("Received bulk update request: %+v\n", req)
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var productIDs []int32
	if req.SelectAll {
		// Получаем все ID товаров по фильтрам
		var err error
		productIDs, err = s.store.GetProductIDsForAdminByFilters(c.Request.Context(), convertFiltersToParams(req.Filters, req.Search))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get products"})
			return
		}

	} else {
		productIDs = req.ProductIDs
	}
	// Валидация
	if len(productIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product IDs are required"})
		return
	}

	validStatuses := map[string]bool{
		"active":   true,
		"archived": true,
		"draft":    true,
		"deleted":  true,
	}
	if !validStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status. Allowed: active, archived, draft, deleted"})
		return
	}

	admin, exists := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Обновляем статус для всех ID
	err := s.store.BulkUpdateProductStatus(c.Request.Context(), db.BulkUpdateProductStatusParams{
		ProductIds: req.ProductIDs,
		Status:     req.Status,
	})
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update products status"})
		return
	}

	// Логируем массовое действие
	go func() {
		ctx := context.Background()
		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		params := db.CreateAdminLogParams{
			AdminID:    adminDB.ID,
			Action:     "update",
			EntityType: pgtype.Text{String: "product", Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Bulk updated %d products status to %s", len(req.ProductIDs), req.Status), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{
		"message":     "Products status updated successfully",
		"updated":     len(req.ProductIDs),
		"status":      req.Status,
		"product_ids": req.ProductIDs,
	})
}

func (s *Server) handleAdminGetLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 50
	}

	offset := (page - 1) * limit

	// Подготовка параметров для sqlc с pgtype
	var adminID pgtype.Int4
	if adminIDStr := c.Query("admin_id"); adminIDStr != "" {
		id, err := strconv.ParseInt(adminIDStr, 10, 32)
		if err == nil && id > 0 {
			adminID = pgtype.Int4{Int32: int32(id), Valid: true}
		}
	}

	var action pgtype.Text
	if actionStr := c.Query("action"); actionStr != "" {
		action = pgtype.Text{String: actionStr, Valid: true}
	}

	var dateFrom pgtype.Timestamptz
	if dateFromStr := c.Query("date_from"); dateFromStr != "" {
		t, err := time.Parse("2006-01-02", dateFromStr)
		if err == nil {
			dateFrom = pgtype.Timestamptz{Time: t, Valid: true}
		}
	}

	var dateTo pgtype.Timestamptz
	if dateToStr := c.Query("date_to"); dateToStr != "" {
		t, err := time.Parse("2006-01-02", dateToStr)
		if err == nil {
			// Добавляем 23:59:59 для включения всего дня
			t = t.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
			dateTo = pgtype.Timestamptz{Time: t, Valid: true}
		}
	}

	// Получаем логи с фильтрацией
	logs, err := s.store.GetAdminLogs(c.Request.Context(), db.GetAdminLogsParams{
		AdminID:  adminID,
		Action:   action,
		DateFrom: dateFrom,
		DateTo:   dateTo,
		Limit:    int32(limit),
		Offset:   int32(offset),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get logs"})
		return
	}

	// Получаем общее количество для пагинации
	total, err := s.store.GetAdminLogsCount(c.Request.Context(), db.GetAdminLogsCountParams{
		AdminID: adminID,
		Action:  action,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get logs count"})
		return
	}

	// Гарантируем, что возвращаем массив, а не null
	if logs == nil {
		logs = []db.GetAdminLogsRow{}
	}

	c.JSON(http.StatusOK, gin.H{
		"logs":       logs,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
	})
}

type CreateSaleRequest struct {
	ProductID int32            `json:"product_id" binding:"required"`
	Sizes     map[string]int32 `json:"sizes" binding:"required"` // размер -> процент
}

func (s *Server) handleAdminCreateSale(c *gin.Context) {
	var req CreateSaleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, _ := c.Get("admin")
	adminID := admin.(db.GetAdminByIDRow).ID

	// Проверяем существование товара
	exists, err := s.store.CheckProductExistsById(c.Request.Context(), req.ProductID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check product"})
		return
	}
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Получаем товар с размерами
	product, err := s.store.GetProductsInfoById(c.Request.Context(), req.ProductID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get product"})
		return
	}

	// Парсим текущие размеры
	var currentSizes map[string]struct {
		Price    int32 `json:"price"`
		Quantity int32 `json:"quantity"`
		InStock  bool  `json:"in_stock"`
	}
	if err := json.Unmarshal(product.Sizes, &currentSizes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse product sizes"})
		return
	}

	// Формируем данные для скидки
	value := make(map[string]int32)
	var minPrice, maxDiscPrice int32

	for size, percent := range req.Sizes {
		// Проверяем валидность процента
		if percent < 1 || percent > 100 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Percent must be between 1 and 100 for size: " + size})
			return
		}

		// Проверяем, существует ли такой размер у товара
		sizeData, ok := currentSizes[size]
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Size " + size + " does not exist for this product"})
			return
		}

		discountPrice := sizeData.Price - (sizeData.Price * percent / 100)
		value[size] = discountPrice

		if minPrice == 0 || discountPrice < minPrice {
			minPrice = discountPrice
		}
		if discountPrice > maxDiscPrice {
			maxDiscPrice = discountPrice
		}
	}

	if len(value) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No valid sizes for discount"})
		return
	}

	valueJSON, err := json.Marshal(value)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal discount value"})
		return
	}

	discountData := map[int32]db.DiscountData{
		req.ProductID: {
			Value:        valueJSON,
			MinPrice:     minPrice,
			MaxDiscPrice: maxDiscPrice,
		},
	}

	err = s.store.CreateDiscounts(c.Request.Context(), discountData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create sale"})
		return
	}

	// Логируем
	go func() {
		ctx := context.Background()
		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		params := db.CreateAdminLogParams{
			AdminID:    adminID,
			Action:     "create",
			EntityType: pgtype.Text{String: "discount", Valid: true},
			EntityID:   pgtype.Int4{Int32: req.ProductID, Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Created sale for product ID: %d with sizes: %v", req.ProductID, req.Sizes), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{
		"message":    "Sale created successfully",
		"product_id": req.ProductID,
		"sizes":      req.Sizes,
	})
}

// UpdateSaleRequest тоже упрощаем
type UpdateSaleRequest struct {
	Sizes map[string]int32 `json:"sizes" binding:"required"`
}

func (s *Server) handleAdminUpdateSale(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req UpdateSaleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, _ := c.Get("admin")
	adminID := admin.(db.GetAdminByIDRow).ID

	// Проверяем существование товара
	exists, err := s.store.CheckProductExistsById(c.Request.Context(), int32(productID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check product"})
		return
	}
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Получаем товар с размерами
	product, err := s.store.GetProductsInfoById(c.Request.Context(), int32(productID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get product"})
		return
	}

	// Парсим текущие размеры
	var currentSizes map[string]struct {
		Price    int32 `json:"price"`
		Quantity int32 `json:"quantity"`
		InStock  bool  `json:"in_stock"`
	}
	if err := json.Unmarshal(product.Sizes, &currentSizes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse product sizes"})
		return
	}

	// Формируем данные для скидки
	value := make(map[string]int32)
	var minPrice, maxDiscPrice int32

	for size, percent := range req.Sizes {
		if percent < 1 || percent > 100 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Percent must be between 1 and 100 for size: " + size})
			return
		}

		sizeData, ok := currentSizes[size]
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Size " + size + " does not exist for this product"})
			return
		}

		discountPrice := sizeData.Price - (sizeData.Price * percent / 100)
		value[size] = discountPrice

		if minPrice == 0 || discountPrice < minPrice {
			minPrice = discountPrice
		}
		if discountPrice > maxDiscPrice {
			maxDiscPrice = discountPrice
		}
	}

	if len(value) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No valid sizes for discount"})
		return
	}

	valueJSON, err := json.Marshal(value)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal discount value"})
		return
	}

	discountData := map[int32]db.DiscountData{
		int32(productID): {
			Value:        valueJSON,
			MinPrice:     minPrice,
			MaxDiscPrice: maxDiscPrice,
		},
	}

	err = s.store.CreateDiscounts(c.Request.Context(), discountData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update sale"})
		return
	}

	// Логируем
	go func() {
		ctx := context.Background()
		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		params := db.CreateAdminLogParams{
			AdminID:    adminID,
			Action:     "update",
			EntityType: pgtype.Text{String: "discount", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(productID), Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Updated sale for product ID: %d with sizes: %v", productID, req.Sizes), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{
		"message":    "Sale updated successfully",
		"product_id": productID,
		"sizes":      req.Sizes,
	})
}

// ========== УПРАВЛЕНИЕ СКИДКАМИ ==========

func (s *Server) handleAdminDeleteSale(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	admin, _ := c.Get("admin")
	adminID := admin.(db.GetAdminByIDRow).ID

	// Проверяем, существует ли товар
	exists, err := s.store.CheckProductExistsById(c.Request.Context(), int32(productID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check product"})
		return
	}
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Удаляем скидку
	err = s.store.DeleteDiscount(c.Request.Context(), int32(productID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete sale"})
		return
	}

	// Логируем
	go func() {
		ctx := context.Background()
		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		params := db.CreateAdminLogParams{
			AdminID:    adminID,
			Action:     "delete",
			EntityType: pgtype.Text{String: "discount", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(productID), Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Deleted sale for product ID: %d", productID), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Sale deleted successfully"})
}

func (s *Server) handleAdminGetSales(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	sales, err := s.store.GetDiscounts(c.Request.Context(), db.GetDiscountsParams{
		Offset: int32(page),
		Limit:  int32(limit),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get sales"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sales": sales,
		"page":  page,
		"limit": limit,
	})
}

// ========== УПРАВЛЕНИЕ ЗАКАЗАМИ ==========

func (s *Server) handleAdminGetOrders(c *gin.Context) {
	fmt.Println("ssssssssssssssssssssssssssssssssssssssssssssssssss1")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")
	search := c.Query("search")
	deliveryType := c.Query("delivery_type")
	sortBy := c.DefaultQuery("sort_by", "date_desc")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	// offset := (page - 1) * limit

	// Подготовка параметров для GetOrdersWithFilters
	params := db.GetOrdersWithFiltersParams{

		SortBy: sortBy,
	}

	// Статус
	if status != "" {
		switch status {
		case "pending":
			params.Status = db.NullStatusEnum{
				StatusEnum: db.StatusEnumPending,
				Valid:      true,
			}
		case "approved":
			params.Status = db.NullStatusEnum{
				StatusEnum: db.StatusEnumApproved,
				Valid:      true,
			}
		case "rejected":
			params.Status = db.NullStatusEnum{
				StatusEnum: db.StatusEnumRejected,
				Valid:      true,
			}
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status. Must be 'pending', 'approved', or 'rejected'"})
			return
		}
	}

	// Тип доставки
	if deliveryType != "" {
		params.DeliveryType = pgtype.Text{
			String: deliveryType,
			Valid:  true,
		}
	}

	// Поиск
	if search != "" {
		params.Search = pgtype.Text{String: search, Valid: true}
	}

	// Получаем заказы с фильтрацией
	orders, err := s.store.GetOrdersWithFilters(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get orders: " + err.Error()})
		return
	}

	// Параметры для подсчета
	countParams := db.GetOrdersCountParams{}
	if status != "" {
		countParams.Status = params.Status
	}
	if deliveryType != "" {
		countParams.DeliveryType = db.NullDeliveryEnum{
			DeliveryEnum: db.DeliveryEnum(deliveryType),
			Valid:        true,
		}
	}

	// Получаем общее количество
	total, err := s.store.GetOrdersCount(c.Request.Context(), countParams)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get orders count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}

func (s *Server) handleAdminGetOrderDetails(c *gin.Context) {
	orderID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	// Получаем заказ (основная информация)
	order, err := s.store.GetOrderById(c.Request.Context(), int32(orderID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Получаем информацию о заказе (статистика)
	orderInfo, err := s.store.GetOrderInfo(c.Request.Context(), int32(orderID))
	if err != nil {
		orderInfo = nil // Не критично, может отсутствовать
	}

	// Получаем адрес доставки
	var address *gin.H
	addr, err := s.store.GetOrderAddressById(c.Request.Context(), int32(orderID))
	if err == nil {
		address = &gin.H{
			"town":        addr.Town,
			"street":      addr.Street,
			"region":      addr.Region,
			"index":       addr.Index,
			"house":       addr.House,
			"flat":        addr.Flat,
			"coordinates": addr.Coordinates,
		}
	}

	// Формируем данные покупателя
	customer := gin.H{}

	if order.Customerid.Valid && order.Customerid.Int32 != 0 {
		// Зарегистрированный покупатель
		cust, err := s.store.GetCustomerById(c.Request.Context(), order.Customerid.Int32)
		if err == nil {
			customer = gin.H{
				"id":          cust.ID,
				"name":        cust.Name,
				"second_name": cust.Secondname,
				"email":       cust.Mail,
				"phone":       cust.Phone,
				"town":        cust.Town,
				"street":      cust.Street,
				"region":      cust.Region,
				"index":       cust.Index,
				"house":       cust.Home,
				"flat":        cust.Flat,
				"type":        "registered",
			}
		}
	} else if order.Unregistercustomerid.Valid && order.Unregistercustomerid.Int32 != 0 {
		// Незарегистрированный покупатель
		unregCust, err := s.store.GetUnregisterCustomerByID(c.Request.Context(), order.Unregistercustomerid.Int32)
		if err == nil {
			customer = gin.H{
				"id":               unregCust.ID,
				"name":             unregCust.Name,
				"second_name":      unregCust.Secondname,
				"email":            unregCust.Mail,
				"phone":            unregCust.Phone,
				"town":             unregCust.Town,
				"street":           unregCust.Street,
				"settlement":       unregCust.Settlement,
				"region":           unregCust.Region,
				"index":            unregCust.Index,
				"house":            unregCust.House,
				"flat":             unregCust.Flat,
				"delivery_comment": unregCust.Deliverycomment,
				"type":             "unregistered",
			}
		}
	}

	// Получаем товары в заказе
	items, err := s.store.GetOrderDataById(c.Request.Context(), int32(orderID))
	if err != nil {
		items = []db.GetOrderDataByIdRow{}
	}

	// Получаем историю изменений заказа
	history, err := s.store.GetOrderEvents(c.Request.Context(), int32(orderID))
	if err != nil {
		history = []db.GetOrderEventsRow{}
	}

	// Рассчитываем общую сумму и количество
	totalAmount := 0
	totalItems := 0
	for _, item := range items {
		totalAmount += int(item.Price) * int(item.Quantity)
		totalItems += int(item.Quantity)
	}

	// Формируем ответ
	response := gin.H{
		"id":               orderID,
		"hash":             order.Hash,
		"status":           order.Status,
		"order_date":       order.Orderdate,
		"delivery_type":    order.Deliverytype,
		"delivery_price":   order.Deliveryprice,
		"delivery_comment": order.Deliverycomment,
		"total_amount":     totalAmount,
		"items_count":      totalItems,
		"customer":         customer,
		"items":            items,
		"history":          history,
		"created_at":       order.CreatedAt,
	}

	if orderInfo != nil {
		response["order_info"] = orderInfo
	}

	if address != nil {
		response["address"] = *address
	}

	c.JSON(http.StatusOK, response)
}

type UpdateOrderStatusRequest struct {
	Status     string  `json:"status" binding:"required,oneof=pending approved rejected"`
	Reason     *string `json:"reason,omitempty"`
	ReasonCode *string `json:"reason_code,omitempty"`
}

func (s *Server) handleAdminUpdateOrderStatus(c *gin.Context) {
	orderID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var req UpdateOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, exists := c.Get("admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Admin not authenticated"})
		return
	}
	adminData := admin.(db.GetAdminByIDRow)

	// Получаем заказ для проверки текущего статуса
	order, err := s.store.GetOrderById(c.Request.Context(), int32(orderID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Проверяем допустимость перехода (машина состояний)
	if !isValidStatusTransition(string(order.Status), req.Status) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Cannot change status from '%s' to '%s'", order.Status, req.Status),
		})
		return
	}

	// Для отмены/отклонения reason обязателен
	if (req.Status == "rejected") && (req.Reason == nil || *req.Reason == "") {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Reason is required for rejection",
		})
		return
	}

	// Определяем статус
	var statusEnum db.StatusEnum
	switch req.Status {
	case "pending":
		statusEnum = db.StatusEnumPending
	case "approved":
		statusEnum = db.StatusEnumApproved
	case "rejected":
		statusEnum = db.StatusEnumRejected
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid status. Must be 'pending', 'approved', or 'rejected'",
		})
		return
	}

	// Обновляем статус заказа
	err = s.store.UpdateOrderStatus(c.Request.Context(), db.UpdateOrderStatusParams{
		OrderID: int32(orderID),
		Status:  statusEnum,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status"})
		return
	}

	// Логируем действие и сохраняем в order_events
	go func() {
		ctx := context.Background()
		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		// 1. Лог админа (для аудита)
		details := fmt.Sprintf("Updated order %d status from %s to %s", orderID, order.Status, req.Status)
		if req.Reason != nil && *req.Reason != "" {
			details += fmt.Sprintf(". Reason: %s", *req.Reason)
		}

		adminLogParams := db.CreateAdminLogParams{
			AdminID:    adminData.ID,
			Action:     "update_status",
			EntityType: pgtype.Text{String: "order", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(orderID), Valid: true},
			Details:    pgtype.Text{String: details, Valid: true},
			IpAddress:  ipAddr,
		}
		if err := s.store.CreateAdminLog(ctx, adminLogParams); err != nil {
			log.Printf("Failed to create admin log: %v", err)
		}

		// 2. Сохраняем в историю событий заказа
		var reasonText pgtype.Text
		if req.Reason != nil {
			reasonText = pgtype.Text{String: *req.Reason, Valid: true}
		}

		var reasonCodeText pgtype.Text
		if req.ReasonCode != nil {
			reasonCodeText = pgtype.Text{String: *req.ReasonCode, Valid: true}
		}

		orderEventParams := db.CreateOrderEventParams{
			OrderID:        int32(orderID),
			EventType:      "status_change",
			OldStatus:      pgtype.Text{String: string(order.Status), Valid: true},
			NewStatus:      pgtype.Text{String: req.Status, Valid: true},
			Reason:         reasonText,
			ReasonCode:     reasonCodeText,
			ChangedByAdmin: pgtype.Int4{Int32: adminData.ID, Valid: true},
			ChangedByType:  "admin",
			IpAddress:      ipAddr,
		}

		if err := s.store.CreateOrderEvent(ctx, orderEventParams); err != nil {
			log.Printf("Failed to create order event: %v", err)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message":    "Order status updated successfully",
		"order_id":   orderID,
		"old_status": order.Status,
		"new_status": req.Status,
	})
}

// Машина состояний
func isValidStatusTransition(currentStatus, newStatus string) bool {
	transitions := map[string][]string{
		"pending":  {"approved", "rejected"},
		"approved": {},
		"rejected": {},
	}

	allowed, exists := transitions[currentStatus]
	if !exists {
		return false
	}

	// Если статус не меняется - разрешаем (идемпотентность)
	if currentStatus == newStatus {
		return true
	}

	for _, status := range allowed {
		if status == newStatus {
			return true
		}
	}
	return false
}

// ========== УПРАВЛЕНИЕ БАННЕРАМИ ==========

type CreateBannerRequest struct {
	Title   string `json:"title"`
	LinkURL string `json:"url"`
}

func (s *Server) handleAdminCreateBanner(c *gin.Context) {
	// Получаем данные из form-data
	title := c.PostForm("title")
	linkURL := c.PostForm("url")

	// Получаем файл изображения
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image file is required"})
		return
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	// 1. Сначала сохраняем изображение (путь генерируется независимо от ID)
	imageURL, err := s.imageService.SaveBannerImage(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	fmt.Println(imageURL)

	// 2. Создаем баннер в БД
	banner, err := s.store.CreateBanner(c.Request.Context(), db.CreateBannerParams{
		Title:    pgtype.Text{String: title, Valid: title != ""},
		ImageUrl: imageURL,
		LinkUrl:  linkURL,
		IsActive: true,
	})
	if err != nil {
		// Если ошибка БД, удаляем сохраненное изображение
		s.imageService.DeleteBannerImage(imageURL)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create banner"})
		return
	}

	// 3. 🟢 ОЧИСТИТЬ КЭШ БАННЕРОВ В REDIS
	go func() {
		ctx := context.Background()
		if err := s.taskProcessor.ClearBannersCache(ctx); err != nil {
			fmt.Printf("[Redis] Failed to clear banners cache: %v\n", err)
		} else {
			fmt.Println("[Redis] Banners cache cleared after create")
		}
	}()

	// 4. Логируем
	go func() {
		ctx := context.Background()
		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		params := db.CreateAdminLogParams{
			AdminID:    adminDB.ID,
			Action:     "create",
			EntityType: pgtype.Text{String: "banner", Valid: true},
			EntityID:   pgtype.Int4{Int32: banner.ID, Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Created banner: %s", imageURL), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{
		"message":   "Banner created successfully",
		"id":        banner.ID,
		"image_url": imageURL,
	})
}

type UpdateBannerRequest struct {
	Title    *string `json:"title"`
	LinkURL  *string `json:"link_url"`
	IsActive *bool   `json:"is_active"`
}

func (s *Server) handleAdminUpdateBanner(c *gin.Context) {
	bannerID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid banner ID"})
		return
	}

	admin, _ := c.Get("admin")
	adminID := admin.(db.GetAdminByIDRow).ID

	// Получаем существующий баннер
	existingBanner, err := s.store.GetBannerByID(c.Request.Context(), int32(bannerID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Banner not found"})
		return
	}

	// Обрабатываем обновление полей (JSON или form-data)
	var title *string
	var linkURL *string
	var isActive *bool
	var newImageURL string

	// Пробуем как JSON
	if c.GetHeader("Content-Type") == "application/json" {
		var req UpdateBannerRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		title = req.Title
		linkURL = req.LinkURL
		isActive = req.IsActive
	} else {
		// Или как form-data
		if t := c.PostForm("title"); t != "" {
			title = &t
		}
		if l := c.PostForm("link_url"); l != "" {
			linkURL = &l
		}
		if a := c.PostForm("is_active"); a != "" {
			active := a == "true"
			isActive = &active
		}

		// Проверяем, есть ли новый файл
		file, err := c.FormFile("image")
		if err == nil {
			// Сохраняем новое изображение
			newImageURL, err = s.imageService.SaveBannerImage(file)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}
	}

	// Обновляем баннер
	err = s.store.UpdateBanner(c.Request.Context(), db.UpdateBannerParams{
		ID:       int32(bannerID),
		Title:    pgtype.Text{String: *title, Valid: title != nil},
		ImageUrl: newImageURL,
		LinkUrl:  *linkURL,
		IsActive: *isActive,
	})
	if err != nil {
		// Если загрузили новое изображение, удаляем его
		if newImageURL != "" {
			s.imageService.DeleteBannerImage(newImageURL)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update banner"})
		return
	}

	// Если загружено новое изображение, удаляем старое
	if newImageURL != "" && existingBanner.ImageUrl != "" {
		s.imageService.DeleteBannerImage(existingBanner.ImageUrl)
	}

	// Логируем
	go func() {
		ctx := context.Background()
		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		params := db.CreateAdminLogParams{
			AdminID:    adminID,
			Action:     "update",
			EntityType: pgtype.Text{String: "banner", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(bannerID), Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Updated banner ID: %d", bannerID), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Banner updated successfully"})
}

func (s *Server) handleAdminDeleteBanner(c *gin.Context) {
	bannerID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid banner ID"})
		return
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	// Получаем баннер перед удалением
	banner, err := s.store.GetBannerByID(c.Request.Context(), int32(bannerID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Banner not found"})
		return
	}

	// Удаляем файл изображения
	if banner.ImageUrl != "" {
		s.imageService.DeleteBannerImage(banner.ImageUrl)
	}

	// Удаляем баннер из БД
	err = s.store.DeleteBanner(c.Request.Context(), int32(bannerID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete banner"})
		return
	}

	// Логируем
	go func() {
		ctx := context.Background()
		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		params := db.CreateAdminLogParams{
			AdminID:    adminDB.ID,
			Action:     "delete",
			EntityType: pgtype.Text{String: "banner", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(bannerID), Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Deleted banner ID: %d", bannerID), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Banner deleted successfully"})
}
func (s *Server) handleAdminInviteAdmin(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
		Role  string `json:"role" binding:"required,oneof=admin superadmin"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	fmt.Println("Invite request for email:", req.Email, "with role:", req.Role)
	adminRaw, _ := c.Get("admin")
	currentAdminID := adminRaw.(db.GetAdminByIDRow).ID
	// Проверяем, не существует ли уже активный админ с таким email
	existingAdmin, _ := s.store.GetAdminByEmail(c.Request.Context(), req.Email)
	fmt.Println("dddddddddddddddddddddddddddddddddddddddddddddddddddd")
	if existingAdmin.ID != 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Admin with this email already exists"})
		return
	}

	// Генерируем уникальный токен приглашения
	inviteToken, err := util.GenerateRandomToken(32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate invite token"})
		return
	}
	fmt.Println("111111111111111111111111111")
	// Сохраняем приглашение в БД (отдельная таблица admin_invites)
	_, err = s.store.CreateAdminInvite(c.Request.Context(), db.CreateAdminInviteParams{
		Email:     req.Email,
		Role:      db.AdminRoleEnum(req.Role),
		Token:     inviteToken,
		InvitedBy: pgtype.Int4{Int32: currentAdminID, Valid: true},
		ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(48 * time.Hour), Valid: true}, // действительно 48 часов
	})
	if err != nil {
		fmt.Println(err, "rrrrrrrrrrrrrrrrr")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invite"})
		return
	}
	fmt.Println("122222222222222222222222222")
	// Отправляем email с приглашением
	inviteLink := fmt.Sprintf("%s/admin/accept-invite?token=%s", s.config.AppURL, inviteToken)

	go func() {
		s.taskDistributor.DistributeTaskSendAdminInvite(context.Background(), &worker.PayloadSendAdminInvite{
			Email:      req.Email,
			InviteLink: inviteLink,
			Role:       req.Role,
		})
	}()
	fmt.Println("dddddddddddddddddddddddddddddddddddddddddddddddddddd")
	// Логируем
	go s.logAdminAction(currentAdminID, "invite_admin", "admin_invite", 0,
		fmt.Sprintf("Invited admin: %s with role: %s", req.Email, req.Role), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"message":    "Invitation sent successfully",
		"expires_at": time.Now().Add(48 * time.Hour),
	})
}
func (s *Server) handleAdminChangePass(ctx *gin.Context) {
	var req struct {
		OldPass string `json:"old_pass" binding:"required"`
		NewPass string `json:"new_pass" binding:"required,min=6"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Получаем админа из контекста (установлен AdminAuthMiddleware)
	admin, exists := ctx.Get("admin")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	a := admin.(*db.Admin)

	// Проверяем старый пароль
	if err := bcrypt.CompareHashAndPassword(a.PasswordHash, []byte(req.OldPass)); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Old password is incorrect"})
		return
	}

	// Хешируем новый пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPass), bcrypt.DefaultCost)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Обновляем пароль
	err = s.store.UpdateAdminPassword(ctx.Request.Context(), db.UpdateAdminPasswordParams{
		ID:           a.ID,
		PasswordHash: hashedPassword,
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	// Логируем действие
	go func() {
		baseCtx := context.Background()
		var ipAddr *netip.Addr
		if ip := ctx.ClientIP(); ip != "" {
			if parsed, err := netip.ParseAddr(ip); err == nil {
				ipAddr = &parsed
			}
		}

		params := db.CreateAdminLogParams{
			AdminID:    a.ID,
			Action:     "change",
			EntityType: pgtype.Text{String: "admin", Valid: true},
			EntityID:   pgtype.Int4{Int32: a.ID, Valid: true},
			Details:    pgtype.Text{String: "Changed password", Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(baseCtx, params)
	}()

	ctx.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}
func (s *Server) handleAdminForgotPass(ctx *gin.Context) {
	// Для POST запроса читаем из body
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	fmt.Println("🔵 [STEP 1] Forgot password handler called")

	if err := ctx.ShouldBindJSON(&req); err != nil {
		fmt.Printf("🔴 [STEP 2] Invalid email format: %v\n", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: email required"})
		return
	}

	email := req.Email
	fmt.Printf("🟢 [STEP 2] Email received: %s\n", email)

	// 1. Проверяем существование (но не выдаем информацию)
	fmt.Println("🔵 [STEP 3] Checking if admin exists...")
	admin, err := s.store.GetAdminByEmail(ctx.Request.Context(), email)
	if err != nil {
		// Всегда возвращаем одинаковый ответ
		fmt.Printf("🟡 [STEP 3] Admin with email not found: %s, error: %v\n", email, err)
		ctx.JSON(http.StatusOK, gin.H{"message": "If email exists, reset link will be sent"})
		return
	}
	fmt.Printf("🟢 [STEP 3] Admin found: ID=%d, Name=%s, Email=%s, IsActive=%v\n", admin.ID, admin.Name, admin.Email, admin.IsActive)

	// 2. Удаляем старые неиспользованные токены для этого email
	fmt.Println("🔵 [STEP 4] Deleting old password reset tokens...")
	err = s.store.DeleteOldPasswordResetTokenByEmail(ctx.Request.Context(), email)
	if err != nil {
		fmt.Printf("🟡 [STEP 4] Warning - error deleting old tokens: %v\n", err)
	} else {
		fmt.Println("🟢 [STEP 4] Old tokens deleted successfully")
	}

	// 3. Создаем новый токен
	fmt.Println("🔵 [STEP 5] Generating new reset token...")
	token, err := util.GenerateRandomToken(32)
	if err != nil {
		fmt.Printf("🔴 [STEP 5] Failed to generate token: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate reset token"})
		return
	}
	fmt.Printf("🟢 [STEP 5] Token generated: %s\n", token)

	fmt.Println("🔵 [STEP 6] Saving token to database...")
	err = s.store.CreateAdminPasswordResetToken(ctx.Request.Context(), db.CreateAdminPasswordResetTokenParams{
		Email: email,
		Token: token,
	})
	if err != nil {
		fmt.Printf("🔴 [STEP 6] Failed to create reset token in DB: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create reset token"})
		return
	}
	fmt.Println("🟢 [STEP 6] Token saved to database successfully")

	// 4. Отправляем email
	resetLink := fmt.Sprintf("%s/admin/reset-password/%s", s.config.AppURL, token)
	fmt.Printf("🟢 [STEP 7] Reset link generated: %s\n", resetLink)
	fmt.Printf("🔵 [STEP 7] Attempting to send email to: %s\n", email)

	// Проверяем, что taskDistributor не nil
	if s.taskDistributor == nil {
		fmt.Printf("🔴 [STEP 7] CRITICAL: taskDistributor is nil!\n")
	} else {
		fmt.Println("🟢 [STEP 7] taskDistributor is available, sending task...")
		err = s.taskDistributor.DistributeTaskSendAdminPasswordReset(ctx, &worker.PayloadSendAdminPasswordReset{
			Email:     email,
			Name:      admin.Name,
			ResetLink: resetLink,
		})
		if err != nil {
			fmt.Printf("🔴 [STEP 7] Failed to distribute task: %v\n", err)
		} else {
			fmt.Println("🟢 [STEP 7] Task distributed successfully to queue")
		}
	}

	// 5. Логируем попытку (безопасность)
	fmt.Printf("🔵 [STEP 8] Logging admin action for admin ID: %d\n", admin.ID)
	s.logAdminAction(admin.ID, "password_reset_request", "admin", admin.ID, "Password reset requested", ctx.ClientIP())
	fmt.Println("🟢 [STEP 8] Admin action logged")

	fmt.Println("🟢 [STEP 9] Sending success response to client")
	ctx.JSON(http.StatusOK, gin.H{"message": "If email exists, reset link will be sent"})
	fmt.Println("🔵 [STEP 9] Response sent, handler finished")
}

// VerifyForgetPass - проверяем токен сброса
func (s *Server) handleAdminVerifyForgetPass(c *gin.Context) {
	var req struct {
		Token string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Проверяем токен
	admin, err := s.store.GetAdminByResetToken(c.Request.Context(), req.Token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired token"})
		return
	}

	// Создаем временный токен для смены пароля
	tempToken, _, err := s.tokenMaker.CreateAdminToken(admin.ID, 15*time.Minute)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create token"})
		return
	}

	// Устанавливаем cookie
	c.SetCookie("admin_reset_token", tempToken, 900, "/admin", "", true, true)

	c.JSON(http.StatusOK, gin.H{
		"valid": true,
		"email": admin.Email,
	})
}
func (s *Server) handleAdminAcceptInvite(c *gin.Context) {
	var req struct {
		Token    string `json:"token" binding:"required"`
		Name     string `json:"name" binding:"required"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Проверяем приглашение
	invite, err := s.store.GetAdminInviteByToken(c.Request.Context(), req.Token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invitation"})
		return
	}

	// Проверяем срок действия
	if time.Now().After(invite.ExpiresAt.Time) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invitation has expired"})
		return
	}

	// Проверяем, не использовано ли уже
	if invite.UsedAt.Valid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invitation already used"})
		return
	}

	// Хешируем пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
		return
	}

	// Конвертируем роль
	var roleEnum db.AdminRoleEnum
	switch invite.Role {
	case db.AdminRoleEnumAdmin:
		roleEnum = db.AdminRoleEnumAdmin
	case db.AdminRoleEnumSuperadmin:
		roleEnum = db.AdminRoleEnumSuperadmin
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	// Создаем админа
	admin, err := s.store.CreateAdmin(c.Request.Context(), db.CreateAdminParams{
		Email:        invite.Email,
		Name:         req.Name,
		Role:         roleEnum,
		PasswordHash: hashedPassword,
		IsActive:     pgtype.Bool{Bool: true, Valid: true},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create admin"})
		return
	}

	// Помечаем приглашение как использованное
	err = s.store.MarkInviteAsUsed(c.Request.Context(), db.MarkInviteAsUsedParams{
		Token:  req.Token,
		UsedBy: pgtype.Int4{Int32: admin.ID, Valid: true},
	})
	if err != nil {
		// Логируем ошибку, но не откатываем создание админа
		fmt.Printf("Failed to mark invite as used: %v\n", err)
	}

	// Логируем действие
	go func() {
		ctx := context.Background()
		var ipAddr *netip.Addr
		if ip := c.ClientIP(); ip != "" {
			if parsed, parseErr := netip.ParseAddr(ip); parseErr == nil {
				ipAddr = &parsed
			}
		}

		params := db.CreateAdminLogParams{
			AdminID:    admin.ID,
			Action:     "accept_invite",
			EntityType: pgtype.Text{String: "admin", Valid: true},
			EntityID:   pgtype.Int4{Int32: admin.ID, Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Accepted invitation. Created admin: %s with role: %s", invite.Email, invite.Role), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, params)
	}()

	// Отправляем приветственное письмо
	go func() {
		s.taskDistributor.DistributeTaskSendAdminWelcome(
			context.Background(),
			&worker.PayloadSendAdminWelcome{
				Email: admin.Email,
				Name:  admin.Name,
			},
		)
	}()

	c.JSON(http.StatusOK, gin.H{
		"message":  "Admin account created successfully",
		"admin_id": admin.ID,
	})
}
func (s *Server) handleAdminVerifyInvite(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token is required"})
		return
	}

	// Проверяем валидность токена приглашения
	invite, err := s.store.GetAdminInviteByToken(c.Request.Context(), token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired invitation"})
		return
	}

	// Проверяем не истек ли срок
	if time.Now().After(invite.ExpiresAt.Time) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invitation has expired"})
		return
	}

	// Проверяем не использовано ли уже
	if invite.UsedAt.Valid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invitation already used"})
		return
	}

	// Проверяем, не зарегистрирован ли уже админ с таким email
	existingAdmin, _ := s.store.GetAdminByEmail(c.Request.Context(), invite.Email)
	if existingAdmin.ID != 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Admin with this email already exists"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid": true,
		"email": invite.Email,
		"role":  invite.Role,
	})
}
func (s *Server) handleAdminGetMe(c *gin.Context) {
	adminRaw, exists := c.Get("admin")
	fmt.Println("Admin raw from context:", adminRaw)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Используем правильный тип
	a := adminRaw.(db.GetAdminByIDRow) // ← не *db.Admin
	c.JSON(http.StatusOK, gin.H{
		"admin": gin.H{
			"id":    a.ID,
			"email": a.Email,
			"name":  a.Name,
			"role":  a.Role,
		},
	})
}
func (s *Server) handleAdminRefreshToken(c *gin.Context) {
	// Получаем refresh токен из cookie
	refreshToken, err := c.Cookie("refresh_token")
	fmt.Println("Refresh token from cookie:", refreshToken)
	if err != nil {
		fmt.Println("ddsdadasdasdasdasd", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token required"})
		return
	}

	// Проверяем refresh токен
	payload, err := s.tokenMaker.VerifyToken(refreshToken)
	if err != nil {
		fmt.Println("Invalid refresh token:", err, "flkdnlfjsndlfjn")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	// Создаем новый access token
	newAccessToken, newPayload, err := s.tokenMaker.CreateAdminToken(payload.UserID, 15*time.Minute)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create token"})
		return
	}

	// Обновляем access token cookie
	c.SetCookie("admin_token", newAccessToken, int(15*time.Minute.Seconds()), "/admin", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"access_token": newAccessToken,
		"expires_at":   newPayload.ExpiredAt,
	})
}

// ChangeForgetPass - смена забытого пароля
func (s *Server) handleAdminResetPassword(ctx *gin.Context) {
	var req struct {
		Token   string `json:"token" binding:"required"`
		NewPass string `json:"new_pass" binding:"required,min=8"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Проверяем токен сброса пароля
	resetToken, err := s.store.GetAdminPasswordResetToken(ctx, req.Token)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired token"})
		return
	}

	// 2. Проверяем, не истек ли токен
	if resetToken.ExpiresAt.Time.Before(time.Now()) {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Token has expired"})
		return
	}

	// 3. Проверяем, не использован ли токен
	if resetToken.UsedAt.Valid {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Token already used"})
		return
	}

	// 4. Хешируем новый пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPass), bcrypt.DefaultCost)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// 5. Обновляем пароль админа
	err = s.store.UpdateAdminPasswordByEmail(ctx, db.UpdateAdminPasswordByEmailParams{
		Email:        resetToken.Email,
		PasswordHash: hashedPassword,
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	// 6. Помечаем токен как использованный
	err = s.store.MarkAdminPasswordResetTokenUsed(ctx, resetToken.ID)
	if err != nil {
		// Логируем, но не возвращаем ошибку пользователю
		fmt.Println("Failed to mark token as used:", err)
	}

	// 7. Удаляем все старые неиспользованные токены для этого email (опционально)
	s.store.DeleteOldPasswordResetTokenByEmail(ctx, resetToken.Email)

	ctx.JSON(http.StatusOK, gin.H{"message": "Password has been reset successfully"})
}
func (s *Server) handleAdminGetDashboardStats(ctx *gin.Context) {
	stats, err := s.store.GetAdminDashboardStats(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, stats)
}

type GetParamsForProductsAndFilters struct {
	Page     int `form:"page"`
	Size     int `form:"size"`
	SortType int `form:"sortType"`
}

func (s *Server) handleAdminGetProductsAndFilters(ctx *gin.Context) {
	var postData GetParamsForProductsAndFilters
	if err := ctx.ShouldBindQuery(&postData); err != nil {
		fmt.Println(err, "error in handleAdminGetProducts")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Установка значений по умолчанию
	if postData.Page == 0 {
		postData.Page = 1
	}
	if postData.Size == 0 {
		postData.Size = 24
	}

	fmt.Printf("Received params: page=%d, size=%d, sortType=%d\n", postData.Page, postData.Size, postData.SortType)

	products, err := s.store.GetAllProductsAndFilters(ctx, postData.Page, postData.Size, postData.SortType)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, products)
}

type GetParamsForProducts struct {
	Page     int `form:"page"`
	Size     int `form:"size"`
	SortType int `form:"sortType"`
	Filters  types.ProductsForAdminFilterStruct
}

func (s *Server) handleAdminGetProducts(ctx *gin.Context) {
	var postData types.PostDataAndFiltersForAdminByCategoryAndType
	if err := ctx.BindJSON(&postData); err != nil {
		fmt.Println(err, "error in handleSearchProductsByCategories")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	fmt.Printf("%+v\n", postData, "postData in handleAdminGetProductssssssssssssssssssss")
	// Установка значений по умолчанию
	if postData.Page == 0 {
		postData.Page = 1
	}
	if postData.Size == 0 {
		postData.Size = 24
	}

	fmt.Printf("Received params: page=%d, size=%d, sortType=%d\n", postData.Page, postData.Size, postData.SortType)

	products, err := s.store.GetProductsForAdminByFiltersComplex(ctx, postData.Name, postData.Page, postData.Size, postData.Filters, postData.SortType)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, products)
}
func (s *Server) handleAdminGetProductById(ctx *gin.Context) {
	id := ctx.Param("id")
	numId, err := strconv.ParseInt(id, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	ProductsInfo, err2 := s.store.GetAdminProductsInfoByIdComplex(ctx, int32(numId))
	if err2 != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, ProductsInfo)
}

type CreateBrandLineRequest struct {
	Name        string `json:"name" binding:"required"`
	Slug        string `json:"slug" binding:"required"`
	Description string `json:"description"`
	ImagePath   string `json:"image_path"`
	Season      string `json:"season"`
	Year        int32  `json:"year"`
	IsActive    bool   `json:"is_active"`
	SortOrder   int32  `json:"sort_order"`
}

// CreateBrandRequest – обновлённая структура запроса
type CreateBrandRequest struct {
	Name        string              `json:"name" binding:"required"`
	Slug        string              `json:"slug" binding:"required"`
	Description string              `json:"description"`
	Website     string              `json:"website"`
	Country     string              `json:"country"`
	FoundedYear int32               `json:"founded_year"`
	IsActive    bool                `json:"is_active"`
	SortOrder   int32               `json:"sort_order"`
	SessionID   string              `json:"session_id"` // <-- идентификатор временной загрузки
	Lines       []CreateLineRequest `json:"lines"`
}

// CreateLineRequest – без изменений (изображения линий можно обрабатывать аналогично при необходимости)
type CreateLineRequest struct {
	Name        string `json:"name" binding:"required"`
	Slug        string `json:"slug" binding:"required"`
	Description string `json:"description"`
	ImagePath   string `json:"image_path"`
	Season      string `json:"season"`
	Year        int32  `json:"year"`
	IsActive    bool   `json:"is_active"`
	SortOrder   int32  `json:"sort_order"`
}

func (s *Server) handleAdminCreateBrand(ctx *gin.Context) {
	// ========== 1. ПОЛУЧАЕМ ДАННЫЕ (ТОЛЬКО JSON) ==========
	var req CreateBrandRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// ========== 2. ВАЛИДАЦИЯ ОБЯЗАТЕЛЬНЫХ ПОЛЕЙ ==========
	if req.Slug == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Slug is required"})
		return
	}
	if req.SessionID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Session ID is required"})
		return
	}

	// ========== 3. ПРОВЕРЯЕМ ВРЕМЕННУЮ ДИРЕКТОРИЮ С ЛОГОТИПОМ ==========
	tempDir := filepath.Join(s.imageService.BaseDir, "temp", req.SessionID)
	info, err := os.Stat(tempDir)
	if err != nil || !info.IsDir() {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "No logo image found for this session"})
		return
	}

	files, err := os.ReadDir(tempDir)
	if err != nil || len(files) == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "No logo image found for this session"})
		return
	}
	// Ожидаем ровно один файл (можно смягчить: брать первый)
	if len(files) > 1 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Only one brand logo is allowed"})
		return
	}
	logoFileName := files[0].Name()

	// ========== 4. СТРОИМ ПОСТОЯННЫЙ ПУТЬ ДЛЯ ЛОГОТИПА ==========
	// ImageService должен предоставлять метод GetBrandImageURL(slug) -> "brands/{slug}/"
	brandImageDir := s.imageService.GetBrandImageURL(req.Slug)
	// Полный путь к файлу логотипа
	imagePath := filepath.Join(brandImageDir, "logo.png")

	// ========== 5. СОЗДАЁМ БРЕНД (ПОКА БЕЗ ФАЙЛА) ==========
	brand, err := s.store.CreateBrand(ctx, db.CreateBrandParams{
		Name:        req.Name,
		Slug:        req.Slug,
		Description: pgtype.Text{String: req.Description, Valid: req.Description != ""},
		Website:     pgtype.Text{String: req.Website, Valid: req.Website != ""},
		Country:     pgtype.Text{String: req.Country, Valid: req.Country != ""},
		FoundedYear: pgtype.Int4{Int32: req.FoundedYear, Valid: req.FoundedYear != 0},
		IsActive:    pgtype.Bool{Bool: req.IsActive, Valid: true},
		SortOrder:   pgtype.Int4{Int32: req.SortOrder, Valid: true},
		ImagePath:   pgtype.Text{String: imagePath, Valid: true}, // путь уже знаем
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	// ========== 6. ПЕРЕНОСИМ ФАЙЛ ИЗ TEMP В ПОСТОЯННОЕ МЕСТО ==========
	permanentDir := filepath.Join(s.imageService.BaseDir, brandImageDir)
	if err := os.MkdirAll(permanentDir, 0755); err != nil {
		s.store.DeleteBrand(ctx, brand.ID) // откат бренда
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create image directory"})
		return
	}

	oldPath := filepath.Join(tempDir, logoFileName)
	newPath := filepath.Join(s.imageService.BaseDir, imagePath) // абсолютный путь
	if err := os.Rename(oldPath, newPath); err != nil {
		os.RemoveAll(permanentDir)
		s.store.DeleteBrand(ctx, brand.ID)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to move logo image"})
		return
	}

	// Удаляем временную папку
	os.RemoveAll(tempDir)

	// ========== 7. СОЗДАЁМ ЛИНИИ (ПОКА БЕЗ ИЗОБРАЖЕНИЙ В ТЕКУЩЕЙ РЕАЛИЗАЦИИ) ==========
	for _, line := range req.Lines {
		_, err := s.store.CreateBrandLine(ctx, db.CreateBrandLineParams{
			BrandID:     brand.ID,
			Name:        line.Name,
			Slug:        line.Slug,
			Description: pgtype.Text{String: line.Description, Valid: line.Description != ""},
			ImagePath:   pgtype.Text{String: line.ImagePath, Valid: line.ImagePath != ""},
			Season:      pgtype.Text{String: line.Season, Valid: line.Season != ""},
			Year:        pgtype.Int4{Int32: line.Year, Valid: line.Year != 0},
			IsActive:    pgtype.Bool{Bool: line.IsActive, Valid: true},
			SortOrder:   pgtype.Int4{Int32: line.SortOrder, Valid: true},
		})
		if err != nil {
			// Можно решить: удалять бренд или оставить? Пока логируем и продолжаем
			_ = s.store.DeleteBrand(ctx, brand.ID)
			os.RemoveAll(permanentDir)
			ctx.JSON(http.StatusInternalServerError, errorResponse(err))
			return
		}
	}

	// ========== 8. ОТВЕТ ==========
	ctx.JSON(http.StatusOK, gin.H{
		"message":    "Brand created successfully",
		"id":         brand.ID,
		"image_path": imagePath,
	})
}

func (s *Server) handleGetAllBrandsWithLines(ctx *gin.Context) {
	resp, err := s.store.GetAllBrandsWithLines(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	ctx.JSON(http.StatusOK, resp)
}

func GenerateSlug(name string) string {
	// Приводим к нижнему регистру
	slug := strings.ToLower(name)

	// Заменяем все не буквенно-цифровые символы на дефис
	reg := regexp.MustCompile(`[^a-z0-9]+`)
	slug = reg.ReplaceAllString(slug, "-")

	// Удаляем дефисы в начале и конце
	slug = strings.Trim(slug, "-")

	return slug
}

func (s *Server) handleAdminCreateFirm(c *gin.Context) {
	var req struct {
		Name        string                `form:"name" binding:"required"`
		Description string                `form:"description"`
		Website     string                `form:"website"`
		Country     string                `form:"country"`
		FoundedYear int32                 `form:"founded_year"`
		Image       *multipart.FileHeader `form:"image"`
		Lines       []struct {
			Name        string `form:"name"`
			Description string `form:"description"`
			Season      string `form:"season"`
			Year        int32  `form:"year"`
		} `form:"lines"`
	}

	if err := c.ShouldBind(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Генерируем slug из названия
	slug := GenerateSlug(req.Name)

	// Проверяем существует ли фирма с таким slug
	existingFirm, err := s.store.GetBrandBySlug(c.Request.Context(), slug)
	fmt.Println(slug)
	if err == nil && existingFirm.ID > 0 {
		c.JSON(409, gin.H{"error": "Firm with this name already exists"})
		return
	}

	// Создаем директорию для изображений фирмы
	firmImagePath := filepath.Join("brandLogos", slug)
	physicalPath := s.imageService.GetPhysicalPath(firmImagePath)

	if err := os.MkdirAll(physicalPath, 0755); err != nil {
		c.JSON(500, gin.H{"error": "Failed to create directory"})
		return
	}

	file, err := c.FormFile("image")
	// Сохраняем изображение если есть
	var imagePath string
	if file != nil {
		filename := "image.png"
		fullPath := filepath.Join(physicalPath, filename)
		if err := c.SaveUploadedFile(file, fullPath); err != nil {
			c.JSON(500, gin.H{"error": "Failed to save image"})
			return
		}
		imagePath = filepath.Join(firmImagePath, filename)
	} else {
		c.JSON(500, gin.H{"error": "Failed to save image"})
		return
	}

	// Создаем фирму в БД
	firm, err := s.store.CreateBrand(c.Request.Context(), db.CreateBrandParams{
		Name:        req.Name,
		Slug:        slug,
		Description: pgtype.Text{String: req.Description, Valid: req.Description != ""},
		Website:     pgtype.Text{String: req.Website, Valid: req.Website != ""},
		Country:     pgtype.Text{String: req.Country, Valid: req.Country != ""},
		FoundedYear: pgtype.Int4{Int32: req.FoundedYear, Valid: req.FoundedYear > 0},
		ImagePath:   pgtype.Text{String: imagePath, Valid: imagePath != ""},
		IsActive:    true,
	})

	if err != nil {
		fmt.Println(err, "jnljnll")
		c.JSON(500, gin.H{"error": "Failed to create firm"})
		return
	}

	// Создаем линейки
	for _, lineReq := range req.Lines {
		if lineReq.Name == "" {
			continue
		}

		// Генерируем slug для линейки
		lineSlug := GenerateSlug(lineReq.Name)

		_, err := s.store.CreateBrandLine(c.Request.Context(), db.CreateBrandLineParams{
			BrandID:     firm.ID,
			Name:        lineReq.Name,
			Slug:        lineSlug,
			Description: pgtype.Text{String: lineReq.Description, Valid: lineReq.Description != ""},
			Season:      pgtype.Text{String: lineReq.Season, Valid: lineReq.Season != ""},
			Year:        pgtype.Int4{Int32: lineReq.Year, Valid: lineReq.Year > 0},
			IsActive:    true,
		})

		if err != nil {
			// Логируем ошибку но продолжаем
			log.Printf("Failed to create line %s: %v", lineReq.Name, err)
		}
	}

	c.JSON(200, gin.H{
		"message": "Firm created successfully",
		"id":      firm.ID,
		"slug":    firm.Slug,
	})
}

type FirmsReqParams struct {
	Name     string `form:"name" `
	SortType int32  `form:"sortType" `
	Page     int32  `form:"page"`
	PageSize int32  `form:"pageSize" `
}
type BrandsResp struct {
	ActiveCount int32                                  `json:"active_count"`
	TotalCount  int32                                  `json:"total_count"`
	Brands      []db.GetBrandsWithStatsAndDiscountsRow `json:"brands"`
}

func (s *Server) handleAdminGetFirmsStats(ctx *gin.Context) {
	var params FirmsReqParams

	if err := ctx.ShouldBind(&params); err != nil {
		fmt.Println(err, "error in handleAdminGetFirmsStats")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Устанавливаем значения по умолчанию
	page := params.Page
	if page < 1 {
		page = 1
	}
	pageSize := params.PageSize
	if pageSize < 1 {
		pageSize = 100
	}
	offset := (page - 1) * pageSize

	brandsInfo, err := s.store.GetBrandsWithStatsAndDiscounts(ctx, db.GetBrandsWithStatsAndDiscountsParams{
		Name:      params.Name,
		SortType:  params.SortType,
		LimitVal:  pageSize,
		OffsetVal: offset,
	})

	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	for i := range brandsInfo {
		brandsInfo[i].ImagePath.String = s.imageService.ImagePathBuilder.GetImageURLFromPath(brandsInfo[i].ImagePath.String)
	}
	counts, err := s.store.CountBrands(ctx, params.Name)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}
	// var totalCount float64
	// if len(brandsInfo) > 0 {
	// 	totalCount = float64(brandsInfo[0])
	// } else {
	// 	totalCount = 0
	// }

	ctx.JSON(http.StatusOK, BrandsResp{
		ActiveCount: int32(counts.TotalActiveBrands),
		TotalCount:  int32(counts.TotalBrands),
		Brands:      brandsInfo,
	})
}

func (s *Server) handleAdminGetBrandById(ctx *gin.Context) {
	id := ctx.Param("id")
	numId, err := strconv.ParseInt(id, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	BrandInfo, err2 := s.store.GetBrandByID(ctx, int32(numId))
	if err2 != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	BrandInfo.ImagePath.String = s.imageService.ImagePathBuilder.GetImageURLFromPath(BrandInfo.ImagePath.String)
	ctx.JSON(http.StatusOK, BrandInfo)
}

func (s *Server) handleAdminGetBanners(ctx *gin.Context) {
	banners, err := s.store.GetAdminBanners(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Обновляем URL изображений для каждого баннера
	for i := range banners {
		banners[i].ImageUrl = s.imageService.ImagePathBuilder.GetImageURLFromPath(banners[i].ImageUrl)
	}

	ctx.JSON(http.StatusOK, banners)
}

// handlers/admin_brands.go
func (s *Server) handleAdminBulkUpdateBrandActive(c *gin.Context) {
	var req struct {
		IDs        []int32 `json:"ids"` // больше не required, т.к. может быть select_all
		SelectAll  bool    `json:"select_all"`
		ExcludeIDs []int32 `json:"exclude_ids"`
		Search     string  `json:"search"`
		IsActive   bool    `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Println("f,dfl,sl;fmsd", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var brandIDs []int32
	var err error

	if req.SelectAll {
		brandIDs, err = s.store.GetBrandsIds(c.Request.Context(), req.Search)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get brand IDs"})
			return
		}
	} else {
		brandIDs = req.IDs
	}

	if len(brandIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No brand IDs provided"})
		return
	}

	// Фильтруем исключённые ID
	filteredIDs := make([]int32, 0, len(brandIDs))
	for _, id := range brandIDs {
		excluded := false
		for _, excl := range req.ExcludeIDs {
			if id == excl {
				excluded = true
				break
			}
		}
		if !excluded {
			filteredIDs = append(filteredIDs, id)
		}
	}

	if len(filteredIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All brands are excluded"})
		return
	}

	err = s.store.BulkUpdateBrandActive(c.Request.Context(), db.BulkUpdateBrandActiveParams{
		Ids:    filteredIDs,
		Active: req.IsActive,
	})
	if err != nil {
		fmt.Println("BulkUpdateBrandActive error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update brands"})
		return
	}

	// Логирование
	admin, exists := c.Get("admin")
	if exists {
		adminDB := admin.(db.GetAdminByIDRow)
		go func() {
			ctx := context.Background()
			var ipAddr *netip.Addr
			if ip := c.ClientIP(); ip != "" {
				if parsed, err := netip.ParseAddr(ip); err == nil {
					ipAddr = &parsed
				}
			}
			params := db.CreateAdminLogParams{
				AdminID:    adminDB.ID,
				Action:     "update",
				EntityType: pgtype.Text{String: "brand", Valid: true},
				Details:    pgtype.Text{String: fmt.Sprintf("Bulk updated %d brands active to %v", len(filteredIDs), req.IsActive), Valid: true},
				IpAddress:  ipAddr,
			}
			_ = s.store.CreateAdminLog(ctx, params)
		}()
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Brands updated successfully",
		"updated": len(filteredIDs),
	})
}

// handlers/admin_brands.go

type BulkUpdateSortOrderRequest struct {
	IDs        []int32 `json:"ids"`
	SelectAll  bool    `json:"select_all"`
	ExcludeIDs []int32 `json:"exclude_ids"`
	Search     string  `json:"search"`
	SortOrder  int32   `json:"sort_order" binding:"required"`
}

func (s *Server) handleAdminBulkUpdateSortOrder(c *gin.Context) {
	var req BulkUpdateSortOrderRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var brandIDs []int32
	var err error

	if req.SelectAll {
		brandIDs, err = s.store.GetBrandsIds(c.Request.Context(), req.Search)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get brand IDs"})
			return
		}
	} else {
		brandIDs = req.IDs
	}

	if len(brandIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No brand IDs provided"})
		return
	}

	// Фильтруем исключённые ID
	filteredIDs := make([]int32, 0, len(brandIDs))
	for _, id := range brandIDs {
		excluded := false
		for _, excl := range req.ExcludeIDs {
			if id == excl {
				excluded = true
				break
			}
		}
		if !excluded {
			filteredIDs = append(filteredIDs, id)
		}
	}

	if len(filteredIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All brands are excluded"})
		return
	}

	err = s.store.BulkUpdateBrandSortOrder(c.Request.Context(), db.BulkUpdateBrandSortOrderParams{
		Ids:       filteredIDs,
		SortOrder: req.SortOrder,
	})
	if err != nil {
		fmt.Println("BulkUpdateBrandSortOrder error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update sort order"})
		return
	}

	// Логирование (оставляем как было, но обновляем сообщение)
	if admin, exists := c.Get("admin"); exists {
		adminDB := admin.(db.GetAdminByIDRow)
		go func() {
			ctx := context.Background()
			var ipAddr *netip.Addr
			if ip := c.ClientIP(); ip != "" {
				if parsed, err := netip.ParseAddr(ip); err == nil {
					ipAddr = &parsed
				}
			}
			params := db.CreateAdminLogParams{
				AdminID:    adminDB.ID,
				Action:     "update",
				EntityType: pgtype.Text{String: "brand", Valid: true},
				Details:    pgtype.Text{String: fmt.Sprintf("Bulk updated %d brands sort_order to %d", len(filteredIDs), req.SortOrder), Valid: true},
				IpAddress:  ipAddr,
			}
			_ = s.store.CreateAdminLog(ctx, params)
		}()
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Sort order updated",
		"updated": len(filteredIDs),
	})
}

func (s *Server) handleAdminGetBannersAndFilters(ctx *gin.Context) {
	banners, err := s.store.GetAdminBanners(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	if banners == nil {
		banners = []db.GetAdminBannersRow{}
	}
	filters, err := s.store.GetFiltersByNameCategoryAndType(ctx, db.GetFiltersByNameCategoryAndTypeParams{})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	for i := range banners {
		banners[i].ImageUrl = s.imageService.ImagePathBuilder.GetImageURLFromPath(banners[i].ImageUrl)
	}
	ctx.JSON(http.StatusOK, gin.H{
		"banners": banners,
		"filters": filters,
	})
}

//CONSOLE

// --- request_models.go ---

type ExecuteSQLRequest struct {
	Query string `json:"query" binding:"required"`
}

// Режим выполнения
type SQLExecutionMode string

const (
	SQLModeReadOnly SQLExecutionMode = "readonly" // Только SELECT
	SQLModeWrite    SQLExecutionMode = "write"    // INSERT/UPDATE/DELETE
	SQLModeDDL      SQLExecutionMode = "ddl"      // CREATE/ALTER/DROP
	SQLModeAll      SQLExecutionMode = "all"      // Всё (только суперадмин)
)

// Разрешённые таблицы для записи
var AllowedWriteTables = map[string][]string{
	// INSERT разрешён
	"INSERT": {
		"products", "product_colors", "product_categories", "product_types",
		"brands", "brand_lines", "colors", "store_house",
		"discount", "discount_rules", "discount_rule_items",
		"banners", "newsletter_subscribers",
	},
	// UPDATE разрешён
	"UPDATE": {
		"products", "product_categories", "product_types",
		"brands", "brand_lines", "colors", "store_house",
		"discount", "discount_rules", "discount_rule_items",
		"banners", "customers", "orders",
	},
	// DELETE разрешён (осторожно!)
	"DELETE": {
		"products", "product_colors", "store_house",
		"discount", "discount_rule_items",
	},
}

// Запрещённые ключевые слова (полный список)
var ForbiddenKeywords = []string{
	"DROP DATABASE", "DROP SCHEMA", "DROP OWNED",
	"REVOKE", "GRANT",
	"CREATE DATABASE", "CREATE SCHEMA",
	"ALTER DATABASE", "ALTER SCHEMA",
	"COPY", "\\COPY",
	"pg_read_file", "pg_read_binary_file",
	"pg_ls_dir", "pg_ls_waldir",
	"lo_import", "lo_export",
	"EXECUTE", "PREPARE",
	"LISTEN", "NOTIFY",
	"VACUUM", "REINDEX", "CLUSTER",
}

// Запрещённые таблицы для записи (системные + чувствительные)
var ForbiddenWriteTables = []string{
	"admins", "admin_logs", "admin_invites",
	"password_resets", "customer_password_resets", "admin_password_resets",
	"verification", "order_events",
	"pg_", "information_schema", "pg_catalog",
}

type SQLValidationResult struct {
	Valid       bool               `json:"valid"`
	Mode        SQLExecutionMode   `json:"mode"`
	Operations  []SQLOperationInfo `json:"operations"`
	Errors      []string           `json:"errors,omitempty"`
	Warnings    []string           `json:"warnings,omitempty"`
	EstimatedRC int                `json:"estimatedRowCount"` // примерное количество строк
}

type SQLOperationInfo struct {
	Type         string `json:"type"`
	Table        string `json:"table"`
	RowsAffected int64  `json:"rowsAffected,omitempty"`
	Status       string `json:"status"`
	Message      string `json:"message,omitempty"`
}

type ExecuteSQLResponse struct {
	Success    bool                `json:"success"`
	Validation SQLValidationResult `json:"validation"`
	Operations []SQLOperationInfo  `json:"operations"`
	Summary    ExecuteSummary      `json:"summary"`
	TotalTime  string              `json:"totalTime"`
	Error      string              `json:"error,omitempty"`
}

type ExecuteSummary struct {
	TotalQueries     int            `json:"totalQueries"`
	Successful       int            `json:"successful"`
	Failed           int            `json:"failed"`
	Skipped          int            `json:"skipped"`
	TablesAffected   map[string]int `json:"tablesAffected"`
	OperationsByType map[string]int `json:"operationsByType"`
}

// Выполнение SQL
func (s *Server) handleAdminExecuteSQL(ctx *gin.Context) {
	var req types.ExecuteSQLRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		fmt.Printf("[SQL] ❌ Неверный формат запроса: %v\n", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат запроса"})
		return
	}

	query := strings.TrimSpace(req.Query)
	if query == "" {
		fmt.Println("[SQL] ⚠️ Пустой SQL запрос")
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "SQL запрос не может быть пустым"})
		return
	}

	adminRole, _ := ctx.Get("admin_role")
	role := adminRole.(string)

	fmt.Println("========================================")
	fmt.Printf("[SQL] 🚀 ВЫПОЛНЕНИЕ SQL (роль: %s)\n", role)
	fmt.Printf("[SQL] Длина запроса: %d символов\n", len(query))
	fmt.Println("========================================")

	startTime := time.Now()

	// 1. Парсим запросы
	parsedQueries := util.ParseSQLScript(query)
	fmt.Printf("[SQL] 📝 Найдено %d запросов\n", len(parsedQueries))

	// 2. Валидируем
	validation := util.ValidateSQL(parsedQueries, role)

	// 3. Проверяем ошибки
	if !validation.Valid {
		fmt.Println("[SQL] ❌ ОШИБКИ ВАЛИДАЦИИ:")
		for _, err := range validation.Errors {
			fmt.Printf("  - %s\n", err)
		}

		ctx.JSON(http.StatusBadRequest, types.ExecuteSQLResponse{
			Success:    false,
			Validation: validation,
			Error:      "Запрос не прошёл валидацию",
			TotalTime:  fmt.Sprintf("%.2f мс", float64(time.Since(startTime).Microseconds())/1000),
		})
		return
	}

	// 4. Предупреждения
	if len(validation.Warnings) > 0 {
		fmt.Println("[SQL] ⚠️ ПРЕДУПРЕЖДЕНИЯ:")
		for _, w := range validation.Warnings {
			fmt.Printf("  - %s\n", w)
		}
	}

	// 5. Выполняем
	operations, summary, err := util.ExecuteSQLQueries(
		ctx.Request.Context(),
		s.store.DB(),
		parsedQueries,
		validation,
	)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка выполнения SQL: " + err.Error(),
		})
		return
	}

	elapsed := time.Since(startTime)

	// 6. Итоги в консоль
	fmt.Println("\n========================================")
	fmt.Println("[SQL] 📊 ИТОГИ ВЫПОЛНЕНИЯ")
	fmt.Println("========================================")
	fmt.Printf("  Всего запросов:     %d\n", summary.TotalQueries)
	fmt.Printf("  ✅ Успешно:         %d\n", summary.Successful)
	fmt.Printf("  ❌ Ошибок:          %d\n", summary.Failed)
	fmt.Printf("  ⏭️ Пропущено:       %d\n", summary.Skipped)
	fmt.Printf("  ⏱️ Общее время:     %v\n", elapsed)
	if len(summary.TablesAffected) > 0 {
		fmt.Println("  По таблицам:")
		for table, count := range summary.TablesAffected {
			fmt.Printf("    %s: %d операций\n", table, count)
		}
	}
	fmt.Println("========================================\n")

	response := types.ExecuteSQLResponse{
		Success:    summary.Failed == 0,
		Validation: validation,
		Operations: operations,
		Summary:    summary,
		TotalTime:  fmt.Sprintf("%.2f мс", float64(elapsed.Microseconds())/1000),
	}

	if summary.Failed > 0 {
		response.Error = fmt.Sprintf("%d из %d запросов завершились с ошибкой",
			summary.Failed, summary.TotalQueries)
	}

	ctx.JSON(http.StatusOK, response)
}

// Парсинг SQL скрипта на отдельные запросы
type ParsedQuery struct {
	Query   string
	Comment string
}

func parseSQLScript(script string) []ParsedQuery {
	var result []ParsedQuery

	// Удаляем многострочные комментарии
	script = regexp.MustCompile(`/\*[\s\S]*?\*/`).ReplaceAllString(script, "")

	lines := strings.Split(script, "\n")
	var currentQuery strings.Builder
	var currentComment strings.Builder

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Пропускаем пустые строки
		if trimmed == "" {
			continue
		}

		// Комментарии
		if strings.HasPrefix(trimmed, "--") {
			comment := strings.TrimPrefix(trimmed, "--")
			comment = strings.TrimSpace(comment)

			// Проверяем, не разделитель ли это
			if strings.HasPrefix(comment, "===") || strings.HasPrefix(comment, "---") {
				continue
			}

			// Если есть накопленный запрос и это не просто комментарий
			if currentQuery.Len() > 0 && !strings.Contains(comment, "только новые") && !strings.Contains(comment, "существующие") {
				// Сохраняем как описание к запросу
				if currentComment.Len() == 0 {
					currentComment.WriteString(comment)
				}
			}
			continue
		}

		// Проверяем BEGIN/COMMIT
		upperLine := strings.ToUpper(trimmed)
		if upperLine == "BEGIN;" || upperLine == "BEGIN" {

			if currentQuery.Len() > 0 {
				result = append(result, ParsedQuery{
					Query:   strings.TrimSpace(currentQuery.String()),
					Comment: strings.TrimSpace(currentComment.String()),
				})
				currentQuery.Reset()
				currentComment.Reset()
			}
			result = append(result, ParsedQuery{
				Query:   trimmed,
				Comment: "Начало транзакции",
			})
			continue
		}

		if upperLine == "COMMIT;" || upperLine == "COMMIT" {
			if currentQuery.Len() > 0 {
				result = append(result, ParsedQuery{
					Query:   strings.TrimSpace(currentQuery.String()),
					Comment: strings.TrimSpace(currentComment.String()),
				})
				currentQuery.Reset()
				currentComment.Reset()
			}
			result = append(result, ParsedQuery{
				Query:   trimmed,
				Comment: "Конец транзакции",
			})
			continue
		}

		// Добавляем строку к текущему запросу
		if currentQuery.Len() > 0 {
			currentQuery.WriteString(" ")
		}
		currentQuery.WriteString(trimmed)

		// Проверяем, завершён ли запрос (точка с запятой)
		if strings.HasSuffix(trimmed, ";") {
			queryStr := strings.TrimSpace(currentQuery.String())
			// Убираем точку с запятой в конце
			queryStr = strings.TrimSuffix(queryStr, ";")

			result = append(result, ParsedQuery{
				Query:   queryStr,
				Comment: strings.TrimSpace(currentComment.String()),
			})

			currentQuery.Reset()
			currentComment.Reset()
		}
	}

	// Если остался незавершённый запрос
	if currentQuery.Len() > 0 {
		result = append(result, ParsedQuery{
			Query:   strings.TrimSpace(currentQuery.String()),
			Comment: strings.TrimSpace(currentComment.String()),
		})
	}

	return result
}

// Извлечение имени таблицы
func extractTableName(query string, keywords ...string) string {
	upperQ := strings.ToUpper(query)

	for _, keyword := range keywords {
		idx := strings.Index(upperQ, strings.ToUpper(keyword))
		if idx == -1 {
			continue
		}

		// Берём текст после ключевого слова
		after := strings.TrimSpace(query[idx+len(keyword):])

		// Убираем public. если есть
		after = strings.TrimPrefix(after, "public.")

		// Берём первое слово (имя таблицы)
		words := strings.Fields(after)
		if len(words) > 0 {
			tableName := words[0]
			// Убираем скобки и лишние символы
			tableName = strings.TrimRight(tableName, "(")
			tableName = strings.TrimSpace(tableName)
			return tableName
		}
	}

	return ""
}

// Извлечение запроса после CTE
func extractAfterCTE(query string) string {
	upperQ := strings.ToUpper(query)
	// Ищем закрывающую скобку CTE и то что после неё
	// Простой способ - найти последнее ") SELECT", ") UPDATE", ") INSERT", ") DELETE"

	patterns := []string{") SELECT", ") UPDATE", ") INSERT", ") DELETE", ") WITH"}
	for _, pattern := range patterns {
		idx := strings.LastIndex(upperQ, pattern)
		if idx != -1 {
			return strings.TrimSpace(query[idx+2:])
		}
	}

	return query
}

// Удаление комментариев
func removeComments(query string) string {
	// Удаляем однострочные комментарии
	lines := strings.Split(query, "\n")
	var result []string
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if !strings.HasPrefix(trimmed, "--") {
			result = append(result, line)
		}
	}
	return strings.Join(result, "\n")
}

type BulkPriceUpdateRequest struct {
	ProductIDs []int32 `json:"product_ids"`
	SelectAll  bool    `json:"select_all"`
	ExcludeIDs []int32 `json:"exclude_ids"`
	PriceType  string  `json:"price_type" binding:"required"` // "set", "increase", "decrease"
	PriceValue float64 `json:"price_value" binding:"required"`

	// Для select_all режима
	Filters *ProductFilters `json:"filters"`
	Search  string          `json:"search"`
}

type ProductFilters struct {
	Price       []float64 `json:"price"`
	Sizes       []string  `json:"sizes"`
	Firms       []string  `json:"firms"`
	Types       []int32   `json:"types"`
	IsActive    *bool     `json:"is_active"`
	Discount    bool      `json:"discount"`
	CreatedFrom int64     `json:"created_from"`
	UpdatedFrom int64     `json:"updated_from"`
}

// handler
func (s *Server) handleBulkUpdateProductPrice(c *gin.Context) {
	var req BulkPriceUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Валидация
	if req.PriceValue <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "price_value must be greater than 0"})
		return
	}

	if req.PriceType == "set" && req.PriceValue > 999999 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "price value too large"})
		return
	}

	if (req.PriceType == "increase" || req.PriceType == "decrease") && req.PriceValue > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "percentage must be between 0 and 100"})
		return
	}

	var productIDs []int32

	if req.SelectAll {
		// Получаем все ID товаров по фильтрам
		var err error
		productIDs, err = s.store.GetProductIDsForAdminByFilters(c.Request.Context(), convertFiltersToParams(req.Filters, req.Search))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get products"})
			return
		}

	} else {
		productIDs = req.ProductIDs
	}

	if len(productIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No products selected"})
		return
	}

	// Получаем продукты с размерами
	products, err := s.store.GetProductsWithSizesByIDs(c.Request.Context(), productIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}

	// Обновляем цены
	updatedCount := 0
	for _, product := range products {
		sizesMap := make(map[string]interface{})
		if product.Sizes != nil {
			json.Unmarshal(product.Sizes, &sizesMap)
		}

		// Обновляем размеры
		for size, sizeData := range sizesMap {
			if sizeDataMap, ok := sizeData.(map[string]interface{}); ok {
				if currentPrice, exists := sizeDataMap["price"]; exists {
					currentPriceFloat := getFloatValue(currentPrice)

					var newPrice float64
					switch req.PriceType {
					case "set":
						newPrice = req.PriceValue
					case "increase":
						newPrice = currentPriceFloat * (1 + req.PriceValue/100)
					case "decrease":
						newPrice = currentPriceFloat * (1 - req.PriceValue/100)
					}

					// Округляем до целого
					sizeDataMap["price"] = math.Round(newPrice)
					// Обновляем значение в map по ключу size
					sizesMap[size] = sizeDataMap
				}
			}
		}

		// Обновляем minprice и maxprice
		newMinPrice, newMaxPrice := calculateMinMaxPrices(sizesMap)

		// Сохраняем обновленные размеры
		updatedSizes, err := json.Marshal(sizesMap)
		if err != nil {
			log.Printf("Failed to marshal sizes for product %d: %v", product.ID, err)
			continue
		}

		// Обновляем в БД
		err = s.store.UpdateProductPrice(c.Request.Context(), db.UpdateProductPriceParams{
			ID:       product.ID,
			Sizes:    updatedSizes,
			Minprice: int32(newMinPrice),
			Maxprice: int32(newMaxPrice),
		})

		if err != nil {
			log.Printf("Failed to update product %d: %v", product.ID, err)
			continue
		}

		updatedCount++
	}

	admin, exists := c.Get("admin")
	if exists {
		adminDB := admin.(db.GetAdminByIDRow)
		go func() {
			ctx := context.Background()
			var ipAddr *netip.Addr
			if ip := c.ClientIP(); ip != "" {
				if parsed, err := netip.ParseAddr(ip); err == nil {
					ipAddr = &parsed
				}
			}
			params := db.CreateAdminLogParams{
				AdminID:    adminDB.ID,
				Action:     "update",
				EntityType: pgtype.Text{String: "product", Valid: true},
				Details:    pgtype.Text{String: fmt.Sprintf("Bulk updated %d products price to %v", len(productIDs), req.PriceValue), Valid: true},
				IpAddress:  ipAddr,
			}
			_ = s.store.CreateAdminLog(ctx, params)
		}()
	}

	c.JSON(http.StatusOK, gin.H{
		"updated_count": updatedCount,
		"message":       fmt.Sprintf("Prices updated for %d products", updatedCount),
	})
}
func convertFiltersToParams(filters *ProductFilters, search string) db.GetProductIDsForAdminByFiltersParams {
	params := db.GetProductIDsForAdminByFiltersParams{
		Name:      search,
		SortType:  0,
		Offsetval: 0,
		Limitval:  100000, // Большой лимит чтобы получить все ID
	}

	if filters != nil {
		// Статус (активные/неактивные)
		if filters.IsActive != nil {
			if *filters.IsActive {
				params.Status = "active"
			} else {
				params.Status = "draft"
			}
		}

		// Размеры
		if len(filters.Sizes) > 0 {
			params.Sizes = filters.Sizes
		}

		// Цены (конвертируем float64 в int32)
		if len(filters.Price) >= 2 {
			if filters.Price[0] > 0 {
				params.Minprice = pgtype.Int4{Int32: int32(filters.Price[0]), Valid: true}
			}
			if filters.Price[1] > 0 {
				params.Maxprice = pgtype.Int4{Int32: int32(filters.Price[1]), Valid: true}
			}
		}

		// Фирмы (конвертируем []string в []int32)
		// Предполагаем что приходят названия, нужно преобразовать в ID
		// Если приходят уже ID, то просто конвертируем
		if len(filters.Firms) > 0 {
			var firmIDs []int32
			for _, firm := range filters.Firms {
				if id, err := strconv.ParseInt(firm, 10, 32); err == nil {
					firmIDs = append(firmIDs, int32(id))
				}
			}
			params.Firms = firmIDs
		}

		// Типы
		if len(filters.Types) > 0 {
			params.ProductTypes = filters.Types
		}

		// Скидка
		params.HasDiscount = filters.Discount

		// Даты
		if filters.CreatedFrom > 0 {
			params.CreatedFrom = pgtype.Timestamptz{
				Time:  time.Unix(filters.CreatedFrom, 0),
				Valid: true,
			}
		}
		if filters.UpdatedFrom > 0 {
			params.UpdatedFrom = pgtype.Timestamptz{
				Time:  time.Unix(filters.UpdatedFrom, 0),
				Valid: true,
			}
		}
	}

	return params
}

// Вспомогательные функции
func getFloatValue(v interface{}) float64 {
	switch val := v.(type) {
	case float64:
		return val
	case float32:
		return float64(val)
	case int:
		return float64(val)
	case int32:
		return float64(val)
	case int64:
		return float64(val)
	case json.Number:
		f, _ := val.Float64()
		return f
	default:
		return 0
	}
}

func calculateMinMaxPrices(sizes map[string]interface{}) (float64, float64) {
	if len(sizes) == 0 {
		return 0, 0
	}

	minPrice := math.MaxFloat64
	maxPrice := 0.0

	for _, sizeData := range sizes {
		if sizeDataMap, ok := sizeData.(map[string]interface{}); ok {
			if price, exists := sizeDataMap["price"]; exists {
				priceFloat := getFloatValue(price)
				if priceFloat < minPrice {
					minPrice = priceFloat
				}
				if priceFloat > maxPrice {
					maxPrice = priceFloat
				}
			}
		}
	}

	if minPrice == math.MaxFloat64 {
		return 0, 0
	}

	return minPrice, maxPrice
}

type UpdateBrandLineRequest struct {
	CreateBrandLineRequest
	ID int32 `json:"id"`
}
type UpdateBrandRequest struct {
	Name        *string           `json:"name"`
	ImagePath   *string           `json:"image_path"`
	Description *string           `json:"description"`
	Website     *string           `json:"website"`
	Country     *string           `json:"country"`
	FoundedYear *int32            `json:"founded_year"`
	IsActive    *bool             `json:"is_active"`
	SortOrder   *int32            `json:"sort_order"`
	Lines       []BrandLineAction `json:"lines"`
	SessionID   string            `json:"session_id"`
}

// BrandLineAction – одно действие над линией.
type BrandLineAction struct {
	Action string         `json:"action" binding:"required,oneof=new upd del"`
	Data   *BrandLineData `json:"data,omitempty"`
}

// BrandLineData – данные линии (для new/upd обязательные поля зависят от действия).
type BrandLineData struct {
	ID          *int32  `json:"id,omitempty"`   // обязателен для upd и del
	Name        *string `json:"name,omitempty"` // обязателен для new
	Description *string `json:"description,omitempty"`
	ImagePath   *string `json:"image_path,omitempty"`
	Season      *string `json:"season,omitempty"`
	Year        *int32  `json:"year,omitempty"`
	IsActive    *bool   `json:"is_active,omitempty"`
	SortOrder   *int32  `json:"sort_order,omitempty"`
}

func (s *Server) handleAdminUpdateBrand(ctx *gin.Context) {
	brandID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(fmt.Errorf("invalid brand id")))
		return
	}

	var req UpdateBrandRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	tx, err := s.store.BeginTx(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}
	defer tx.Rollback(ctx)

	// Получаем текущие данные бренда
	currentBrand, err := tx.GetBrandByID(ctx, int32(brandID))
	if err != nil {
		ctx.JSON(http.StatusNotFound, errorResponse(fmt.Errorf("brand not found")))
		return
	}

	// Определяем новый slug ТОЛЬКО если изменилось имя
	var newName, newSlug string
	if req.Name != nil && *req.Name != "" && *req.Name != currentBrand.Name {
		newName = *req.Name
		newSlug = GenerateSlug(newName)

		// Проверяем уникальность slug
		exists, err := tx.CheckBrandExistsBySlug(ctx, newSlug)
		if err != nil {
			log.Printf("ERROR: Failed to check slug uniqueness: %v", err)
			ctx.JSON(http.StatusInternalServerError, errorResponse(fmt.Errorf("failed to check slug uniqueness")))
			return
		}
		if exists {
			newSlug = generateUniqueSlug(ctx, tx, newName, int32(brandID))
		}
	} else {
		newName = currentBrand.Name
		newSlug = currentBrand.Slug
	}

	// ---------- ОБРАБОТКА ИЗОБРАЖЕНИЯ ----------
	var newImagePath string
	oldImagePath := currentBrand.ImagePath.String

	if req.SessionID != "" {
		// Есть новое изображение в temp
		tempDir := filepath.Join(s.imageService.BaseDir, "temp", req.SessionID)
		fmt.Println(tempDir)
		files, err := os.ReadDir(tempDir)
		if err != nil || len(files) == 0 {
			ctx.JSON(http.StatusBadRequest, errorResponse(fmt.Errorf("no logo image in session")))
			return
		}

		// Создаем директорию для бренда
		newBrandDir := filepath.Join("brands", newSlug)
		newPhysicalDir := filepath.Join(s.imageService.BaseDir, newBrandDir)

		if err := os.MkdirAll(newPhysicalDir, 0755); err != nil {
			log.Printf("ERROR: Failed to create directory: %v", err)
			ctx.JSON(http.StatusInternalServerError, errorResponse(fmt.Errorf("failed to create directory")))
			return
		}

		// Перемещаем логотип
		logoFile := files[0]
		ext := filepath.Ext(logoFile.Name())
		newLogoName := "logo" + ext
		oldTempPath := filepath.Join(tempDir, logoFile.Name())
		newLogoPath := filepath.Join(newPhysicalDir, newLogoName)

		if err := os.Rename(oldTempPath, newLogoPath); err != nil {
			log.Printf("ERROR: Failed to move logo: %v", err)
			os.RemoveAll(newPhysicalDir)
			ctx.JSON(http.StatusInternalServerError, errorResponse(fmt.Errorf("failed to move logo image")))
			return
		}

		// Удаляем временную папку
		os.RemoveAll(tempDir)

		newImagePath = filepath.Join(newBrandDir, newLogoName)

		// Удаляем старую директорию если slug не изменился
		if newSlug == currentBrand.Slug && oldImagePath != "" {
			oldDir := filepath.Join(s.imageService.BaseDir, filepath.Dir(oldImagePath))
			if oldDir != newPhysicalDir {
				os.RemoveAll(oldDir)
			}
		}

	} else if newSlug != currentBrand.Slug {
		// Slug изменился, но логотип не обновлялся - перемещаем старую папку
		oldDir := filepath.Join(s.imageService.BaseDir, "brands", currentBrand.Slug)
		newDir := filepath.Join(s.imageService.BaseDir, "brands", newSlug)

		if _, err := os.Stat(oldDir); err == nil {
			if err := os.Rename(oldDir, newDir); err != nil {
				log.Printf("WARNING: Failed to move brand directory: %v", err)
				newImagePath = oldImagePath // Оставляем старый путь
			} else {
				// Обновляем путь
				newImagePath = strings.Replace(oldImagePath, currentBrand.Slug, newSlug, 1)
			}
		} else {
			newImagePath = oldImagePath
		}
	} else {
		newImagePath = oldImagePath
	}

	// ---------- ФОРМИРУЕМ ПАРАМЕТРЫ ОБНОВЛЕНИЯ ----------
	updateParams := db.UpdateBrandParams{
		ID:        int32(brandID),
		Name:      pgtype.Text{String: newName, Valid: true},
		Slug:      pgtype.Text{String: newSlug, Valid: true},
		ImagePath: pgtype.Text{String: newImagePath, Valid: newImagePath != ""},
	}

	// Остальные поля - только если переданы
	if req.Description != nil {
		updateParams.Description = pgtype.Text{String: *req.Description, Valid: true}
	}
	if req.Website != nil {
		updateParams.Website = pgtype.Text{String: *req.Website, Valid: true}
	}
	if req.Country != nil {
		updateParams.Country = pgtype.Text{String: *req.Country, Valid: true}
	}
	if req.FoundedYear != nil {
		updateParams.FoundedYear = pgtype.Int4{Int32: *req.FoundedYear, Valid: true}
	}
	if req.IsActive != nil {
		updateParams.IsActive = pgtype.Bool{Bool: *req.IsActive, Valid: true}
	}
	if req.SortOrder != nil {
		updateParams.SortOrder = pgtype.Int4{Int32: *req.SortOrder, Valid: true}
	}

	log.Printf("DEBUG: Updating brand %d: name='%s' -> '%s', slug='%s' -> '%s', isActive=%v, sortOrder=%v",
		brandID, currentBrand.Name, newName, currentBrand.Slug, newSlug, updateParams.IsActive, updateParams.SortOrder)

	// Выполняем обновление бренда
	if err := tx.UpdateBrand(ctx, updateParams); err != nil {
		log.Printf("ERROR: Failed to update brand: %v", err)

		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			switch pgErr.Code {
			case "23505": // unique_violation
				ctx.JSON(http.StatusConflict, errorResponse(fmt.Errorf(
					"duplicate key violates unique constraint: %s", pgErr.ConstraintName)))
				return
			default:
				ctx.JSON(http.StatusInternalServerError, errorResponse(fmt.Errorf(
					"database error: %s (code: %s)", pgErr.Message, pgErr.Code)))
				return
			}
		}

		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}
	fmt.Println("dlksandlaskndlasn")
	// ---------- ОБРАБОТКА ЛИНИЙ ----------
	for i, action := range req.Lines {
		switch action.Action {
		case "new":
			if action.Data == nil || action.Data.Name == nil || *action.Data.Name == "" {
				ctx.JSON(http.StatusBadRequest,
					errorResponse(fmt.Errorf("line %d: name is required", i)))
				return
			}

			// Генерируем slug из имени линии
			lineSlug := GenerateSlug(*action.Data.Name)

			// Проверяем уникальность slug линии
			lineExists, err := tx.CheckBrandLineExistsBySlug(ctx, lineSlug)
			if err != nil {
				log.Printf("ERROR: Failed to check line slug: %v", err)
				ctx.JSON(http.StatusInternalServerError, errorResponse(err))
				return
			}
			if lineExists {
				lineSlug = generateUniqueLineSlug(ctx, tx, *action.Data.Name)
			}

			params := db.CreateBrandLineParams{
				BrandID: int32(brandID),
				Name:    *action.Data.Name,
				Slug:    lineSlug,
			}
			if action.Data.Description != nil {
				params.Description = pgtype.Text{String: *action.Data.Description, Valid: true}
			}
			if action.Data.ImagePath != nil {
				params.ImagePath = pgtype.Text{String: *action.Data.ImagePath, Valid: true}
			}
			if action.Data.Season != nil {
				params.Season = pgtype.Text{String: *action.Data.Season, Valid: true}
			}
			if action.Data.Year != nil {
				params.Year = pgtype.Int4{Int32: *action.Data.Year, Valid: true}
			}
			if action.Data.IsActive != nil {
				params.IsActive = pgtype.Bool{Bool: *action.Data.IsActive, Valid: true}
			} else {
				params.IsActive = pgtype.Bool{Bool: true, Valid: true}
			}
			if action.Data.SortOrder != nil {
				params.SortOrder = pgtype.Int4{Int32: *action.Data.SortOrder, Valid: true}
			}

			if _, err := tx.CreateBrandLine(ctx, params); err != nil {
				log.Printf("ERROR: Failed to create brand line: %v", err)
				ctx.JSON(http.StatusInternalServerError, errorResponse(err))
				return
			}

		case "upd":
			if action.Data == nil || action.Data.ID == nil {
				ctx.JSON(http.StatusBadRequest,
					errorResponse(fmt.Errorf("line %d: id is required", i)))
				return
			}
			lineID := *action.Data.ID

			existingLine, err := tx.GetBrandLineById(ctx, lineID)
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					ctx.JSON(http.StatusNotFound,
						errorResponse(fmt.Errorf("line %d not found", lineID)))
				} else {
					log.Printf("ERROR: Failed to get brand line: %v", err)
					ctx.JSON(http.StatusInternalServerError, errorResponse(err))
				}
				return
			}
			if existingLine.BrandID != int32(brandID) {
				ctx.JSON(http.StatusBadRequest,
					errorResponse(fmt.Errorf("line %d does not belong to brand %d", lineID, brandID)))
				return
			}

			updParams := db.UpdateBrandLineParams{ID: lineID}

			// Slug меняется только если изменилось имя
			if action.Data.Name != nil && *action.Data.Name != "" && *action.Data.Name != existingLine.Name {
				updParams.Name = *action.Data.Name
				newLineSlug := GenerateSlug(*action.Data.Name)

				lineSlugExists, err := tx.CheckBrandLineExistsBySlug(ctx, newLineSlug)
				if err != nil {
					log.Printf("ERROR: Failed to check line slug: %v", err)
					ctx.JSON(http.StatusInternalServerError, errorResponse(err))
					return
				}
				if lineSlugExists {
					newLineSlug = generateUniqueLineSlug(ctx, tx, *action.Data.Name)
				}

				updParams.Slug = newLineSlug
			}

			// Остальные поля
			if action.Data.Description != nil {
				updParams.Description = pgtype.Text{String: *action.Data.Description, Valid: true}
			}
			if action.Data.ImagePath != nil {
				updParams.ImagePath = pgtype.Text{String: *action.Data.ImagePath, Valid: true}
			}
			if action.Data.Season != nil {
				updParams.Season = pgtype.Text{String: *action.Data.Season, Valid: true}
			}
			if action.Data.Year != nil {
				updParams.Year = pgtype.Int4{Int32: *action.Data.Year, Valid: true}
			}
			if action.Data.IsActive != nil {
				updParams.IsActive = pgtype.Bool{Bool: *action.Data.IsActive, Valid: true}
			}
			if action.Data.SortOrder != nil {
				updParams.SortOrder = pgtype.Int4{Int32: *action.Data.SortOrder, Valid: true}
			}

			if err := tx.UpdateBrandLine(ctx, updParams); err != nil {
				log.Printf("ERROR: Failed to update brand line: %v", err)

				var pgErr *pgconn.PgError
				if errors.As(err, &pgErr) && pgErr.Code == "23505" {
					ctx.JSON(http.StatusConflict, errorResponse(fmt.Errorf("line slug already exists")))
					return
				}

				ctx.JSON(http.StatusInternalServerError, errorResponse(err))
				return
			}

		case "del":
			if action.Data == nil || action.Data.ID == nil {
				ctx.JSON(http.StatusBadRequest,
					errorResponse(fmt.Errorf("line %d: id is required", i)))
				return
			}
			lineID := *action.Data.ID

			existingLine, err := tx.GetBrandLineById(ctx, lineID)
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					ctx.JSON(http.StatusNotFound,
						errorResponse(fmt.Errorf("line %d not found", lineID)))
				} else {
					log.Printf("ERROR: Failed to get brand line: %v", err)
					ctx.JSON(http.StatusInternalServerError, errorResponse(err))
				}
				return
			}
			if existingLine.BrandID != int32(brandID) {
				ctx.JSON(http.StatusBadRequest,
					errorResponse(fmt.Errorf("line %d does not belong to brand %d", lineID, brandID)))
				return
			}

			if err := tx.DeactivateBrandLine(ctx, lineID); err != nil {
				log.Printf("ERROR: Failed to deactivate brand line: %v", err)
				ctx.JSON(http.StatusInternalServerError, errorResponse(err))
				return
			}

		default:
			ctx.JSON(http.StatusBadRequest, errorResponse(fmt.Errorf("unknown action: %s", action.Action)))
			return
		}
	}

	// ---------- ФИКСАЦИЯ ТРАНЗАКЦИИ ----------
	if err := tx.Commit(ctx); err != nil {
		log.Printf("ERROR: Failed to commit transaction: %v", err)
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	// Получаем обновленный бренд
	updatedBrand, err := s.store.GetBrandByID(ctx, int32(brandID))
	if err != nil {
		log.Printf("ERROR: Failed to get updated brand: %v", err)
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, updatedBrand)
}

// Вспомогательные функции
func generateUniqueSlug(ctx context.Context, tx *db.Tx, name string, excludeID int32) string {
	baseSlug := GenerateSlug(name)
	slug := baseSlug

	for i := 1; ; i++ {
		exists, err := tx.CheckBrandExistsBySlug(ctx, slug)
		if err != nil || !exists {
			break
		}
		slug = fmt.Sprintf("%s-%d", baseSlug, i)
	}

	return slug
}

func generateUniqueLineSlug(ctx context.Context, tx *db.Tx, name string) string {
	baseSlug := GenerateSlug(name)
	slug := baseSlug

	for i := 1; ; i++ {
		exists, err := tx.CheckBrandLineExistsBySlug(ctx, slug)
		if err != nil || !exists {
			break
		}
		slug = fmt.Sprintf("%s-%d", baseSlug, i)
	}

	return slug
}
