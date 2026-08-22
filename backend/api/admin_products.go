package api

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
)

type SizeInfo struct {
	SizeKey       string `json:"size_key"`
	ProductCount  int32  `json:"product_count"`
	TotalQuantity int32  `json:"total_quantity"`
	AvgPrice      int32  `json:"avg_price"`
	MinPrice      int32  `json:"min_price"`
	MaxPrice      int32  `json:"max_price"`
}

type SizeProduct struct {
	ID       int32  `json:"id"`
	Name     string `json:"name"`
	Article  string `json:"article"`
	Firm     string `json:"firm"`
	Price    int32  `json:"price"`
	Quantity int32  `json:"quantity"`
	InStock  bool   `json:"in_stock"`
}

type SizesResponse struct {
	Sizes []SizeInfo `json:"sizes"`
	Total int64      `json:"total"`
}

// handleAdminGetSizes - получение всех размеров со статистикой
func (s *Server) handleAdminGetSizes(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	search := c.DefaultQuery("search", "")

	if limit < 1 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	// Получаем размеры с пагинацией и поиском
	sizes, err := s.store.GetAllSizesStats(c.Request.Context(), db.GetAllSizesStatsParams{
		Search:    search,
		LimitVal:  int32(limit),
		OffsetVal: int32(offset),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get sizes"})
		return
	}

	// Получаем общее количество
	total, err := s.store.GetSizesCount(c.Request.Context(), search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get count"})
		return
	}

	// Конвертируем в нужный формат
	var sizeInfos []SizeInfo
	for _, size := range sizes {
		sizeInfos = append(sizeInfos, SizeInfo{
			SizeKey:       size.SizeKey,
			ProductCount:  size.ProductCount,
			TotalQuantity: size.TotalQuantity,
			AvgPrice:      size.AvgPrice,
			MinPrice:      size.MinPrice,
			MaxPrice:      size.MaxPrice,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"sizes":      sizeInfos,
		"total":      total,
		"page":       offset/limit + 1,
		"limit":      limit,
		"totalPages": (total + int32(limit) - 1) / int32(limit),
	})
}
func (s *Server) handleAdminBulkDeleteSize(c *gin.Context) {
	var req struct {
		SizeKey string `json:"sizeKey" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Проверяем, сколько товаров затронет удаление
	stats, err := s.store.GetSizeStatsByKey(c.Request.Context(), req.SizeKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get size stats"})
		return
	}

	if stats.ProductCount == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Size not found"})
		return
	}

	// Удаляем размер с защитой
	err = s.store.DeleteSizeFromAllProducts(c.Request.Context(), req.SizeKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete size"})
		return
	}
	s.asyncRecalculateDiscounts(c.Request.Context())
	c.JSON(http.StatusOK, gin.H{
		"success":          true,
		"affectedProducts": stats.ProductCount,
		"message":          fmt.Sprintf("Size '%s' deleted from %d products (last sizes replaced with no_size)", req.SizeKey, stats.ProductCount),
	})
}

// api/size_handler.go

type RenameSizeRequest struct {
	OldSizeKey string `json:"oldSizeKey" binding:"required"`
	NewSizeKey string `json:"newSizeKey" binding:"required"`
}

// handleAdminRenameSize - переименование размера у всех товаров
func (s *Server) handleAdminRenameSize(c *gin.Context) {
	var req RenameSizeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Проверяем, что старый размер существует
	exists, err := s.store.CheckSizeExists(c.Request.Context(), req.OldSizeKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check size"})
		return
	}
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Size not found"})
		return
	}

	// Проверяем, что новый размер не существует
	exists, err = s.store.CheckSizeExists(c.Request.Context(), req.NewSizeKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check size"})
		return
	}
	if exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "New size key already exists"})
		return
	}

	// 1. Переименовываем размер (синхронно, быстро)
	err = s.store.RenameSize(c.Request.Context(), db.RenameSizeParams{
		OldSizeKey: req.OldSizeKey,
		NewSizeKey: req.NewSizeKey,
	})
	if err != nil {
		fmt.Println(err, "qqqqqqqqqqqqqq")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to rename size"})
		return
	}

	// 2. Запускаем пересчет скидок асинхронно
	s.asyncRecalculateDiscounts(c.Request.Context())

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("Size '%s' renamed to '%s'. Discount recalculation started in background.",
			req.OldSizeKey, req.NewSizeKey),
	})
}

// asyncRecalculateDiscounts - асинхронный пересчет скидок
func (s *Server) asyncRecalculateDiscounts(ctx context.Context) {
	go func() {
		// Создаем новый контекст с таймаутом, чтобы не зависеть от запроса
		timeoutCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		start := time.Now()
		log.Println("Starting async discount recalculation...")

		err := s.store.RecalculateAllDiscounts(timeoutCtx)

		if err != nil {
			log.Printf("Failed to recalculate discounts: %v", err)
			// Здесь можно добавить отправку в систему мониторинга/ошибок
			return
		}

		log.Printf("Discount recalculation completed in %v", time.Since(start))
	}()
}

func (s *Server) handleGetProductsLight(c *gin.Context) {
	limit := parseLimit(c.Query("limit"), 1000, 5000)
	offset := parseOffset(c.Query("offset"))

	products, err := s.store.GetProductsLight(c.Request.Context(), db.GetProductsLightParams{
		LimitVal:  pgtype.Int4{Int32: int32(limit), Valid: true},
		OffsetVal: pgtype.Int4{Int32: int32(offset), Valid: true},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"pagination": gin.H{
			"limit":  limit,
			"offset": offset,
			"count":  len(products),
		},
	})
}

func (s *Server) handleGetBrandsLight(c *gin.Context) {
	limit := parseLimit(c.Query("limit"), 1000, 5000)
	offset := parseOffset(c.Query("offset"))

	brands, err := s.store.GetBrandsLight(c.Request.Context(), db.GetBrandsLightParams{
		LimitVal:  pgtype.Int4{Int32: int32(limit), Valid: true},
		OffsetVal: pgtype.Int4{Int32: int32(offset), Valid: true},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"brands": brands,
		"pagination": gin.H{
			"limit":  limit,
			"offset": offset,
			"count":  len(brands),
		},
	})
}

// ============================================================
// 2. GET /admin/products/light/since
// Только обновленные после указанной даты
// ============================================================
// Query параметры:
//   - since: RFC3339 дата (например, 2026-07-31T17:35:32Z)
//   - limit: int (default 1000, max 5000)
//   - offset: int (default 0)
//
// ============================================================
func (s *Server) handleGetProductsLightSince(c *gin.Context) {
	sinceStr := c.Query("since")
	limit := parseLimit(c.Query("limit"), 1000, 5000)
	offset := parseOffset(c.Query("offset"))

	var since sql.NullTime
	if sinceStr != "" {
		t, err := time.Parse(time.RFC3339, sinceStr)
		if err == nil {
			since = sql.NullTime{Time: t, Valid: true}
		}
	}

	// Общее количество обновленных

	products, err := s.store.GetProductsLightSince(c.Request.Context(), db.GetProductsLightSinceParams{
		Since:     pgtype.Timestamptz{Time: since.Time, Valid: since.Valid},
		LimitVal:  pgtype.Int4{Int32: int32(limit), Valid: true},
		OffsetVal: pgtype.Int4{Int32: int32(offset), Valid: true},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"pagination": gin.H{
			"limit":  limit,
			"offset": offset,
			"count":  len(products),
		},
		"since": sinceStr,
	})
}

func parseLimit(val string, defaultVal, maxVal int) int {
	if val == "" {
		return defaultVal
	}
	parsed, err := strconv.Atoi(val)
	if err != nil || parsed <= 0 {
		return defaultVal
	}
	if parsed > maxVal {
		return maxVal
	}
	return parsed
}

func parseOffset(val string) int {
	if val == "" {
		return 0
	}
	parsed, err := strconv.Atoi(val)
	if err != nil || parsed < 0 {
		return 0
	}
	return parsed
}
