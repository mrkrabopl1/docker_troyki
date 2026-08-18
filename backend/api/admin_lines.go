package api

import (
	"context"
	"fmt"
	"net/netip"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
)

// ==================== REQUEST STRUCTS ====================

type CreateLineRequest struct {
	BrandID     int32  `json:"brand_id" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Slug        string `json:"slug" binding:"required"`
	Description string `json:"description"`
	ImagePath   string `json:"image_path"`
	Season      string `json:"season"`
	Year        int32  `json:"year"`
	IsActive    bool   `json:"is_active"`
	SortOrder   int32  `json:"sort_order"`
}

type UpdateLineRequest struct {
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	ImagePath   string `json:"image_path"`
	Season      string `json:"season"`
	Year        int32  `json:"year"`
	IsActive    *bool  `json:"is_active"`
	SortOrder   int32  `json:"sort_order"`
}

type LinesResp struct {
	ActiveCount int32                                 `json:"active_count"`
	TotalCount  int32                                 `json:"total_count"`
	Lines       []db.GetLinesWithStatsAndDiscountsRow `json:"lines"`
}

// ==================== HANDLERS ====================

// GET /admin/lines/stats - получение линеек с фильтрацией и пагинацией
type LinesReqParams struct {
	Name     string  `form:"name"`
	BrandIDs []int32 `form:"brand_ids"` // теперь массив
	SortType int32   `form:"sortType"`
	Page     int32   `form:"page"`
	PageSize int32   `form:"pageSize"`
}

// GET /admin/lines/stats
func (s *Server) handleAdminGetLinesStats(ctx *gin.Context) {
	var params LinesReqParams

	if err := ctx.ShouldBind(&params); err != nil {
		ctx.JSON(400, errorResponse(err))
		return
	}

	fmt.Println("Name:", params.Name, "BrandIDs:", params.BrandIDs)

	page := params.Page
	if page < 1 {
		page = 1
	}
	pageSize := params.PageSize
	if pageSize < 1 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	lines, err := s.store.GetLinesWithStatsAndDiscounts(ctx, db.GetLinesWithStatsAndDiscountsParams{
		Name:      params.Name,
		BrandIds:  params.BrandIDs,
		SortType:  params.SortType,
		LimitVal:  pageSize,
		OffsetVal: offset,
	})
	if err != nil {
		fmt.Println("Error getting lines stats:", err)
		ctx.JSON(500, errorResponse(err))
		return
	}

	for i := range lines {
		lines[i].ImagePath.String = s.imageService.ImagePathBuilder.GetImageURLFromPath(lines[i].ImagePath.String)
	}

	counts, err := s.store.CountLines(ctx, db.CountLinesParams{
		Name:     params.Name,
		BrandIds: params.BrandIDs,
	})
	if err != nil {
		fmt.Println("Error counting lines:", err)
		ctx.JSON(500, errorResponse(err))
		return
	}

	ctx.JSON(200, LinesResp{
		ActiveCount: int32(counts.TotalActiveLines),
		TotalCount:  int32(counts.TotalLines),
		Lines:       lines,
	})
}

// GET /admin/lines/:id - получение одной линейки
func (s *Server) handleAdminGetLineById(ctx *gin.Context) {
	id := ctx.Param("id")
	numId, err := strconv.ParseInt(id, 10, 32)
	if err != nil {
		ctx.JSON(400, errorResponse(err))
		return
	}

	line, err := s.store.GetLineByID(ctx, int32(numId))
	if err != nil {
		ctx.JSON(404, gin.H{"error": "Line not found"})
		return
	}

	line.ImagePath.String = s.imageService.ImagePathBuilder.GetImageURLFromPath(line.ImagePath.String)

	ctx.JSON(200, line)
}

// POST /admin/lines - создание новой линейки
func (s *Server) handleAdminCreateLine(ctx *gin.Context) {
	var req CreateLineRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(400, errorResponse(err))
		return
	}

	// Проверяем обязательные поля
	if req.Slug == "" {
		ctx.JSON(400, gin.H{"error": "Slug is required"})
		return
	}

	// Проверяем, не существует ли уже линейка с таким slug для этого бренда
	// Для этого нужен brand_id, но в запросе его нет
	// Предполагаем, что brand_id передается отдельно или берется из контекста

	// Создаем линейку
	line, err := s.store.CreateBrandLine(ctx, db.CreateBrandLineParams{
		BrandID:     req.BrandID, // нужно добавить поле BrandID в CreateLineRequest
		Name:        req.Name,
		Slug:        req.Slug,
		Description: pgtype.Text{String: req.Description, Valid: req.Description != ""},
		ImagePath:   pgtype.Text{String: req.ImagePath, Valid: req.ImagePath != ""},
		Season:      pgtype.Text{String: req.Season, Valid: req.Season != ""},
		Year:        pgtype.Int4{Int32: req.Year, Valid: req.Year != 0},
		IsActive:    pgtype.Bool{Bool: req.IsActive, Valid: true},
		SortOrder:   pgtype.Int4{Int32: req.SortOrder, Valid: true},
	})

	if err != nil {
		fmt.Println("Error creating line:", err)
		ctx.JSON(500, errorResponse(err))
		return
	}

	ctx.JSON(200, gin.H{
		"message": "Line created successfully",
		"id":      line.ID,
		"slug":    line.Slug,
	})
}

// POST /admin/lines/:id - обновление линейки
func (s *Server) handleAdminUpdateLine(ctx *gin.Context) {
	id := ctx.Param("id")
	numId, err := strconv.ParseInt(id, 10, 32)
	if err != nil {
		ctx.JSON(400, errorResponse(err))
		return
	}

	// JSON обработка
	var req UpdateLineRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(400, errorResponse(err))
		return
	}

	// Получаем текущую линейку
	_, err = s.store.GetLineByID(ctx, int32(numId))
	if err != nil {
		ctx.JSON(404, gin.H{"error": "Line not found"})
		return
	}

	// Обновляем только переданные поля

	err = s.store.UpdateLine(ctx, db.UpdateLineParams{
		ID:          int32(numId),
		Name:        req.Name,
		Slug:        req.Slug,
		Description: req.Description,
		ImagePath:   req.ImagePath,
		Season:      req.Season,
		Year:        req.Year,
		IsActive:    *req.IsActive,
		SortOrder:   req.SortOrder,
	})
	if err != nil {
		fmt.Println("Error updating line:", err)
		ctx.JSON(500, errorResponse(err))
		return
	}

	// Логирование
	admin, exists := ctx.Get("admin")
	if exists {
		adminDB := admin.(db.GetAdminByIDRow)
		go func() {
			ctxBg := context.Background()
			var ipAddr *netip.Addr
			if ip := ctx.ClientIP(); ip != "" {
				if parsed, err := netip.ParseAddr(ip); err == nil {
					ipAddr = &parsed
				}
			}
			params := db.CreateAdminLogParams{
				AdminID:    adminDB.ID,
				Action:     "update",
				EntityType: pgtype.Text{String: "line", Valid: true},
				EntityID:   pgtype.Int4{Int32: int32(numId), Valid: true},
				Details:    pgtype.Text{String: fmt.Sprintf("Updated line ID: %d", numId), Valid: true},
				IpAddress:  ipAddr,
			}
			_ = s.store.CreateAdminLog(ctxBg, params)
		}()
	}

	ctx.JSON(200, gin.H{"message": "Line updated successfully"})
}

// DELETE /admin/lines/:id - удаление линейки
func (s *Server) handleAdminDeleteLine(ctx *gin.Context) {
	id := ctx.Param("id")
	numId, err := strconv.ParseInt(id, 10, 32)
	if err != nil {
		ctx.JSON(400, errorResponse(err))
		return
	}

	// Получаем линейку для логирования
	line, err := s.store.GetLineByID(ctx, int32(numId))
	if err != nil {
		ctx.JSON(404, gin.H{"error": "Line not found"})
		return
	}

	// Удаляем изображение, если есть
	if line.ImagePath.String != "" {
		physicalPath := s.imageService.GetPhysicalPath(line.ImagePath.String)
		if err := os.Remove(physicalPath); err != nil && !os.IsNotExist(err) {
			// Логируем ошибку, но продолжаем
			fmt.Println("Error deleting line image:", err)
		}
		// Пробуем удалить пустую директорию
		dir := filepath.Dir(physicalPath)
		os.Remove(dir)
	}

	err = s.store.DeleteLine(ctx, int32(numId))
	if err != nil {
		fmt.Println("Error deleting line:", err)
		ctx.JSON(500, errorResponse(err))
		return
	}

	// Логирование
	admin, exists := ctx.Get("admin")
	if exists {
		adminDB := admin.(db.GetAdminByIDRow)
		go func() {
			ctxBg := context.Background()
			var ipAddr *netip.Addr
			if ip := ctx.ClientIP(); ip != "" {
				if parsed, err := netip.ParseAddr(ip); err == nil {
					ipAddr = &parsed
				}
			}
			params := db.CreateAdminLogParams{
				AdminID:    adminDB.ID,
				Action:     "delete",
				EntityType: pgtype.Text{String: "line", Valid: true},
				EntityID:   pgtype.Int4{Int32: int32(numId), Valid: true},
				Details:    pgtype.Text{String: fmt.Sprintf("Deleted line: %s (ID: %d)", line.Name, numId), Valid: true},
				IpAddress:  ipAddr,
			}
			_ = s.store.CreateAdminLog(ctxBg, params)
		}()
	}

	ctx.JSON(200, gin.H{"message": "Line deleted successfully"})
}

// PUT /admin/lines/bulk-active - массовое обновление активности
func (s *Server) handleAdminBulkUpdateLineActive(ctx *gin.Context) {
	var req struct {
		IDs        []int32 `json:"ids"`
		SelectAll  bool    `json:"select_all"`
		ExcludeIDs []int32 `json:"exclude_ids"`
		Search     string  `json:"search"`
		IsActive   bool    `json:"is_active"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(400, gin.H{"error": err.Error()})
		return
	}

	var lineIDs []int32
	var err error

	if req.SelectAll {
		lineIDs, err = s.store.GetLineIdsBySearch(ctx, req.Search)
		if err != nil {
			ctx.JSON(500, gin.H{"error": "Failed to get line IDs"})
			return
		}
	} else {
		lineIDs = req.IDs
	}

	if len(lineIDs) == 0 {
		ctx.JSON(400, gin.H{"error": "No line IDs provided"})
		return
	}

	// Фильтруем исключённые ID
	filteredIDs := make([]int32, 0, len(lineIDs))
	for _, id := range lineIDs {
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
		ctx.JSON(400, gin.H{"error": "All lines are excluded"})
		return
	}

	err = s.store.BulkUpdateLineActive(ctx, db.BulkUpdateLineActiveParams{
		Ids:      filteredIDs,
		IsActive: pgtype.Bool{Bool: req.IsActive, Valid: true},
	})
	if err != nil {
		fmt.Println("BulkUpdateLineActive error:", err)
		ctx.JSON(500, gin.H{"error": "Failed to update lines"})
		return
	}

	ctx.JSON(200, gin.H{
		"message": "Lines updated successfully",
		"updated": len(filteredIDs),
	})
}
