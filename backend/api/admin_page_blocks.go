// api/admin_page_widgets.go

package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/worker"
)

// ============ CREATE ============
// api/admin_page_widgets.go

func (s *Server) handleAdminCreatePageWidget(c *gin.Context) {
	var input struct {
		Name      string          `json:"name" binding:"required"`
		Type      string          `json:"type" binding:"required,oneof=products_slider banner_slider brands_scroller"`
		SortOrder int32           `json:"sort_order"`
		IsActive  bool            `json:"is_active"`
		Filters   json.RawMessage `json:"filters"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		fmt.Println(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	// 1. ✅ Быстрое сохранение в БД (без link_url)
	widget, err := s.store.CreatePageWidget(c.Request.Context(), db.CreatePageWidgetParams{
		Name:      input.Name,
		Type:      input.Type,
		SortOrder: input.SortOrder,
		IsActive:  pgtype.Bool{Bool: input.IsActive, Valid: true},
		Settings:  input.Filters,
		LinkUrl:   "", // ⬅️ пусто, сгенерим в фоне
	})

	fmt.Println(input.Name, "mmmmmmmmmmmmmmmmmmmmmmmmmmmmm")

	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create widget"})
		return
	}

	// 2. ✅ Отвечаем СРАЗУ (не ждём генерации link_url и пересчёта товаров)
	c.JSON(http.StatusAccepted, gin.H{
		"message": "Widget created, processing in background",
		"id":      widget.ID,
		"status":  "processing",
	})

	// 3. 🔥 Отправляем задачу в Asynq для фоновой обработки
	err = s.taskDistributor.DistributeTaskGenerateWidgetLink(c.Request.Context(), &worker.PayloadGenerateWidgetLink{
		WidgetID: widget.ID,
		Action:   "create",
	})
	if err != nil {
		// fallback: если Asynq недоступен, делаем синхронно (но это редкий случай)
		fmt.Printf("[Asynq] Failed to enqueue task: %v\n", err)
		// go s.processWidgetLinkGeneration(context.Background(), widget.ID)
	}

	// 4. 🔥 Инвалидируем кэш главной страницы (асинхронно)
	go func() {
		ctx := context.Background()
		fmt.Println("Clear page widget cache")
		if err := s.taskProcessor.ClearPageWidgetsCache(ctx); err != nil {
			fmt.Printf("[Redis] Failed to clear page widgets cache: %v\n", err)
		} else {
			fmt.Println("Page widget cache cleared successfully")
		}
	}()

	// 5. Логируем (асинхронно)
	go s.logAdminAction(adminDB.ID, "create", "page_widget", widget.ID,
		fmt.Sprintf("Create widget: %s (processing in background)", widget.Name), c.ClientIP())
}

// ============ GET ALL ============
func (s *Server) handleAdminGetPageWidgets(c *gin.Context) {
	widgets, err := s.store.GetAllPageWidgets(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get widgets"})
		return
	}
	if widgets == nil {
		widgets = []db.PageWidget{}
	}

	// ✅ Преобразуем []byte в json.RawMessage для корректной сериализации
	type WidgetResponse struct {
		ID        int32           `json:"id"`
		Name      string          `json:"name"`
		Type      string          `json:"type"`
		SortOrder int32           `json:"sort_order"`
		IsActive  bool            `json:"is_active"`
		Settings  json.RawMessage `json:"filters"`
		LinkUrl   string          `json:"link_url"`
		CreatedAt time.Time       `json:"created_at"`
		UpdatedAt time.Time       `json:"updated_at"`
	}

	response := make([]WidgetResponse, 0, len(widgets))
	for _, w := range widgets {
		// Если Settings пустые — передаём пустой объект
		settings := w.Settings
		if len(settings) == 0 || string(settings) == "null" {
			settings = json.RawMessage("{}")
		}

		response = append(response, WidgetResponse{
			ID:        w.ID,
			Name:      w.Name,
			Type:      w.Type,
			SortOrder: w.SortOrder,
			IsActive:  w.IsActive.Bool,
			Settings:  settings,
			LinkUrl:   w.LinkUrl,
		})
	}

	c.JSON(http.StatusOK, response)
}

// ============ GET ONE ============
func (s *Server) handleAdminGetPageWidget(c *gin.Context) {
	widgetID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid widget ID"})
		return
	}

	widget, err := s.store.GetPageWidget(c.Request.Context(), int32(widgetID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Widget not found"})
		return
	}

	// ✅ Преобразуем Settings в json.RawMessage
	settings := widget.Settings
	if len(settings) == 0 || string(settings) == "null" {
		settings = json.RawMessage("{}")
	}

	// ✅ Используем ту же структуру для ответа
	type WidgetResponse struct {
		ID        int32           `json:"id"`
		Name      string          `json:"name"`
		Type      string          `json:"type"`
		SortOrder int32           `json:"sort_order"`
		IsActive  bool            `json:"is_active"`
		Settings  json.RawMessage `json:"filters"`
		LinkUrl   string          `json:"link_url"`
		CreatedAt time.Time       `json:"created_at"`
		UpdatedAt time.Time       `json:"updated_at"`
	}

	response := WidgetResponse{
		ID:        widget.ID,
		Name:      widget.Name,
		Type:      widget.Type,
		SortOrder: widget.SortOrder,
		IsActive:  widget.IsActive.Bool,
		Settings:  settings,
		LinkUrl:   widget.LinkUrl,
	}

	c.JSON(http.StatusOK, response)
}

// ============ UPDATE ============
func (s *Server) handleAdminUpdatePageWidget(c *gin.Context) {
	widgetID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid widget ID"})
		return
	}

	var input struct {
		Name      string          `json:"name" binding:"required"`
		Type      string          `json:"type" binding:"required,oneof=products_slider banner_slider brands_scroller"`
		SortOrder int32           `json:"sort_order"`
		IsActive  bool            `json:"is_active"`
		Settings  json.RawMessage `json:"settings"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	// Получаем текущий виджет для логирования
	existing, err := s.store.GetPageWidget(c.Request.Context(), int32(widgetID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Widget not found"})
		return
	}

	// Обновляем
	widget, err := s.store.UpdatePageWidget(c.Request.Context(), db.UpdatePageWidgetParams{
		ID:        int32(widgetID),
		Name:      pgtype.Text{String: input.Name, Valid: input.Name != ""},
		Type:      pgtype.Text{String: input.Type, Valid: input.Type != ""},
		SortOrder: pgtype.Int4{Int32: input.SortOrder, Valid: true},
		IsActive:  pgtype.Bool{Bool: input.IsActive, Valid: true},
		Settings:  input.Settings,
		LinkUrl:   pgtype.Text{String: "", Valid: false}, // не обновляем
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update widget"})
		return
	}

	// Инвалидируем кэш
	go func() {
		ctx := context.Background()
		s.taskProcessor.ClearPageWidgetsCache(ctx)
	}()

	// Логируем
	go s.logAdminAction(adminDB.ID, "update", "page_widget", widget.ID,
		fmt.Sprintf("Updated widget: %s (was: %s)", widget.Name, existing.Name), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"message": "Widget updated successfully",
		"widget":  widget,
	})
}

// ============ DELETE ============
func (s *Server) handleAdminDeletePageWidget(c *gin.Context) {
	widgetID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid widget ID"})
		return
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	// Получаем виджет для логирования
	widget, err := s.store.GetPageWidget(c.Request.Context(), int32(widgetID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Widget not found"})
		return
	}

	// Удаляем
	err = s.store.DeletePageWidget(c.Request.Context(), int32(widgetID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete widget"})
		return
	}

	// Инвалидируем кэш
	go func() {
		ctx := context.Background()
		s.taskProcessor.ClearPageWidgetsCache(ctx)
	}()

	// Логируем
	go s.logAdminAction(adminDB.ID, "delete", "page_widget", widget.ID,
		fmt.Sprintf("Deleted widget: %s", widget.Name), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"message": "Widget deleted successfully"})
}

// ============ REORDER ============
func (s *Server) handleAdminReorderPageWidgets(c *gin.Context) {
	var input struct {
		Order []int32 `json:"order" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	// Обновляем порядок
	for idx, widgetID := range input.Order {
		err := s.store.ReorderPageWidgets(c.Request.Context(), db.ReorderPageWidgetsParams{
			ID:       widgetID,
			NewOrder: int32(idx),
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reorder widgets"})
			return
		}
	}

	// Инвалидируем кэш
	go func() {
		ctx := context.Background()
		s.taskProcessor.ClearPageWidgetsCache(ctx)
	}()

	// Логируем
	go s.logAdminAction(adminDB.ID, "reorder", "page_widget", 0,
		fmt.Sprintf("Reordered %d widgets", len(input.Order)), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"message": "Widgets reordered successfully"})
}
