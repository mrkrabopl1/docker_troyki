package api

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
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

	// Переименовываем размер
	err = s.store.RenameSize(c.Request.Context(), db.RenameSizeParams{
		OldSizeKey: req.OldSizeKey,
		NewSizeKey: req.NewSizeKey,
	})
	if err != nil {
		fmt.Println(err, "qqqqqqqqqqqqqq")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to rename size"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("Size '%s' renamed to '%s'", req.OldSizeKey, req.NewSizeKey),
	})
}
