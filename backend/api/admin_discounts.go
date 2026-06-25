package api

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/netip"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
)

// POST /api/admin/discount-rules
func (s *Server) handleAdminCreateDiscountRule(c *gin.Context) {
	var input struct {
		Name          string `json:"name" binding:"required"`
		Description   string `json:"description"`
		DiscountType  string `json:"discount_type" binding:"required,oneof=percentage fixed_amount"`
		DiscountValue int32  `json:"discount_value" binding:"required,min=0"`
		StartsAt      string `json:"starts_at" binding:"required"`
		EndsAt        string `json:"ends_at"`
		Priority      int32  `json:"priority"`
		Items         []struct {
			ItemType string `json:"item_type" binding:"required,oneof=brand line product"`
			ItemID   int32  `json:"item_id" binding:"required"`
		} `json:"items" binding:"required,min=1,dive"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		fmt.Println(err, "lfm;dmf;slfskmf;sldmf;s")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	startsAt, err := time.Parse("2006-01-02", input.StartsAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid starts_at format, use YYYY-MM-DD"})
		return
	}

	var endsAt pgtype.Timestamptz
	if input.EndsAt != "" {
		t, err := time.Parse("2006-01-02", input.EndsAt)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ends_at format, use YYYY-MM-DD"})
			return
		}
		endsAt = pgtype.Timestamptz{Time: t, Valid: true}
	}

	// Создаём правило
	rule, err := s.store.CreateDiscountRule(c.Request.Context(), db.CreateDiscountRuleParams{
		Name:          input.Name,
		Description:   input.Description,
		DiscountType:  input.DiscountType,
		DiscountValue: input.DiscountValue,
		StartsAt:      pgtype.Timestamptz{Time: startsAt, Valid: true},
		EndsAt:        endsAt,
		Priority:      input.Priority,
	})
	if err != nil {
		fmt.Println("CreateDiscountRule error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create discount rule"})
		return
	}

	// Добавляем связи
	for _, item := range input.Items {
		err = s.store.AddRuleItem(c.Request.Context(), db.AddRuleItemParams{
			RuleID:   rule.ID,
			ItemType: item.ItemType,
			ItemID:   item.ItemID,
		})
		if err != nil {
			fmt.Println("AddRuleItem error:", err)
		}
	}

	// Логируем
	admin, exists := c.Get("admin")
	if !exists {
		c.JSON(http.StatusOK, gin.H{
			"message": "Discount rule created successfully",
			"rule":    rule,
		})
		return
	}
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
			Action:     "create",
			EntityType: pgtype.Text{String: "discount_rule", Valid: true},
			EntityID:   pgtype.Int4{Int32: rule.ID, Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Created discount rule '%s' (%s %d%%)", input.Name, input.DiscountType, input.DiscountValue), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Discount rule created successfully",
		"rule":    rule,
	})
}
func (s *Server) handleAdminGetDiscountActiveRules(c *gin.Context) {
	rules, err := s.store.GetAllActiveDiscountRules(c.Request.Context())
	if err != nil {
		fmt.Println("GetDiscountRules error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get discount rules"})
		return
	}

	if rules == nil {
		rules = []db.DiscountRule{}
	}

	c.JSON(http.StatusOK, gin.H{
		"rules": rules,
	})
}

// GET /api/admin/discount-rules
func (s *Server) handleAdminGetDiscountRules(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	rules, err := s.store.GetDiscountRules(c.Request.Context(), db.GetDiscountRulesParams{
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		fmt.Println("GetDiscountRules error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get discount rules"})
		return
	}

	total, err := s.store.GetDiscountRulesCount(c.Request.Context())
	if err != nil {
		fmt.Println("GetDiscountRulesCount error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get count"})
		return
	}

	if rules == nil {
		rules = []db.DiscountRule{}
	}

	c.JSON(http.StatusOK, gin.H{
		"rules":      rules,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
	})
}
func (s *Server) handleAdminGetDiscountRulesByEntity(c *gin.Context) {
	entityType := c.Query("entity_type")
	entityID, err := strconv.Atoi(c.Query("entity_id"))

	if err != nil || (entityType != "brand" && entityType != "line" && entityType != "product") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid params. Required: entity_type=brand|line|product, entity_id=int"})
		return
	}

	rules, err := s.store.GetDiscountRulesByEntity(c.Request.Context(), db.GetDiscountRulesByEntityParams{
		ItemType: entityType,
		ItemID:   int32(entityID),
	})
	if err != nil {
		fmt.Println("GetDiscountRulesByEntity error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get rules"})
		return
	}

	if rules == nil {
		rules = []db.DiscountRule{}
	}

	c.JSON(http.StatusOK, gin.H{"rules": rules})
}

// GET /api/admin/discount-rules/:id
func (s *Server) handleAdminGetDiscountRule(c *gin.Context) {
	ruleID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rule ID"})
		return
	}

	rule, err := s.store.GetDiscountRule(c.Request.Context(), int32(ruleID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Discount rule not found"})
		return
	}

	items, _ := s.store.GetRuleItems(c.Request.Context(), int32(ruleID))
	if items == nil {
		items = []db.GetRuleItemsRow{}
	}

	c.JSON(http.StatusOK, gin.H{
		"rule":  rule,
		"items": items,
	})
}

// PUT /api/admin/discount-rules/:id
func (s *Server) handleAdminUpdateDiscountRule(c *gin.Context) {
	ruleID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rule ID"})
		return
	}

	var input struct {
		Name          string `json:"name"`
		Description   string `json:"description"`
		DiscountType  string `json:"discount_type" binding:"omitempty,oneof=percentage fixed_amount"`
		DiscountValue int32  `json:"discount_value"`
		StartsAt      string `json:"starts_at"`
		EndsAt        string `json:"ends_at"`
		Priority      int32  `json:"priority"`
		IsActive      *bool  `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Собираем параметры для обновления
	params := db.UpdateDiscountRuleParams{
		ID: int32(ruleID),
	}

	if input.Name != "" {
		params.Name = input.Name
	}
	if input.Description != "" {
		params.Description = input.Description
	}
	if input.DiscountType != "" {
		params.DiscountType = input.DiscountType
	}
	if input.DiscountValue > 0 {
		params.DiscountValue = input.DiscountValue
	}
	if input.StartsAt != "" {
		t, err := time.Parse("2006-01-02", input.StartsAt)
		if err == nil {
			params.StartsAt = pgtype.Timestamptz{Time: t, Valid: true}
		}
	}
	if input.EndsAt != "" {
		t, err := time.Parse("2006-01-02", input.EndsAt)
		if err == nil {
			params.EndsAt = pgtype.Timestamptz{Time: t, Valid: true}
		}
	} else if input.EndsAt == "" {
		// Явно сбрасываем дату окончания
		params.EndsAt = pgtype.Timestamptz{Valid: false}
	}
	if input.Priority >= 0 {
		params.Priority = input.Priority
	}

	rule, err := s.store.UpdateDiscountRule(c.Request.Context(), params)
	if err != nil {
		fmt.Println("UpdateDiscountRule error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update discount rule"})
		return
	}

	admin, exists := c.Get("admin")
	if !exists {
		c.JSON(http.StatusOK, gin.H{
			"message": "Discount rule updated successfully",
			"rule":    rule,
		})
		return
	}
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
			EntityType: pgtype.Text{String: "discount_rule", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(ruleID), Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Updated discount rule ID: %d", ruleID), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Discount rule updated successfully",
		"rule":    rule,
	})
}

// DELETE /api/admin/discount-rules/:id
func (s *Server) handleAdminDeleteDiscountRule(c *gin.Context) {
	ruleID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rule ID"})
		return
	}

	err = s.store.DeleteDiscountRule(c.Request.Context(), int32(ruleID))
	if err != nil {
		fmt.Println("DeleteDiscountRule error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete discount rule"})
		return
	}

	admin, exists := c.Get("admin")
	if !exists {
		c.JSON(http.StatusOK, gin.H{"message": "Discount rule deleted successfully"})
		return
	}
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
			Action:     "delete",
			EntityType: pgtype.Text{String: "discount_rule", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(ruleID), Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Deleted discount rule ID: %d", ruleID), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Discount rule deleted successfully"})
}

// POST /api/admin/discount-rules/:id/items
func (s *Server) handleAdminAddRuleItems(c *gin.Context) {
	ruleID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rule ID"})
		return
	}

	var input struct {
		Items []struct {
			ItemType string `json:"item_type" binding:"required,oneof=brand line product"`
			ItemID   int32  `json:"item_id" binding:"required"`
		} `json:"items" binding:"required,min=1,dive"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for _, item := range input.Items {
		err = s.store.AddRuleItem(c.Request.Context(), db.AddRuleItemParams{
			RuleID:   int32(ruleID),
			ItemType: item.ItemType,
			ItemID:   item.ItemID,
		})
		if err != nil {
			fmt.Println("AddRuleItem error:", err)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Items added successfully"})
}

func (s *Server) handleAdminGetRuleItems(c *gin.Context) {
	ruleID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rule ID"})
		return
	}

	items, err := s.store.GetRuleItems(c.Request.Context(), int32(ruleID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get rule items"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": items,
	})
}

type BulkBrandDiscountRequest struct {
	ProductIDs []int32 `json:"product_ids"`
	SelectAll  bool    `json:"select_all"`
	ExcludeIDs []int32 `json:"exclude_ids"`
	RuleID     int32   `json:"rule_id" binding:"required"`
	Search     string  `json:"search"`
}

func (s *Server) handleAdminAddRuleBrands(c *gin.Context) {
	ruleID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rule ID"})
		return
	}

	var input struct {
		ProductIDs []int32 `json:"product_ids"`
		SelectAll  bool    `json:"select_all"`
		ExcludeIDs []int32 `json:"exclude_ids"`
		Search     string  `json:"search"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var brandIDs []int32
	if input.SelectAll {
		brandIDs, err = s.store.GetBrandsIds(c.Request.Context(), input.Search)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get brand IDs"})
			return
		}
	} else {
		brandIDs = input.ProductIDs
	}

	if len(brandIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No brand IDs provided"})
		return
	}

	for _, id := range brandIDs {
		// Проверка на исключение без отдельной функции
		skip := false
		for _, excl := range input.ExcludeIDs {
			if id == excl {
				skip = true
				break
			}
		}
		if skip {
			continue
		}

		err = s.store.AddRuleItem(c.Request.Context(), db.AddRuleItemParams{
			RuleID:   int32(ruleID),
			ItemType: "brand",
			ItemID:   id,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add rule item"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Items added successfully"})
}

// DELETE /api/admin/discount-rules/:id/items
func (s *Server) handleAdminRemoveRuleItem(c *gin.Context) {
	ruleID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rule ID"})
		return
	}

	var input struct {
		ItemType string `json:"item_type" binding:"required,oneof=brand line product"`
		ItemID   int32  `json:"item_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = s.store.RemoveRuleItem(c.Request.Context(), db.RemoveRuleItemParams{
		RuleID:   int32(ruleID),
		ItemType: input.ItemType,
		ItemID:   input.ItemID,
	})
	if err != nil {
		fmt.Println("RemoveRuleItem error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item removed successfully"})
}

// POST /api/admin/discount-rules/:id/toggle
func (s *Server) handleAdminToggleRule(c *gin.Context) {
	ruleID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rule ID"})
		return
	}

	rule, err := s.store.ToggleDiscountRule(c.Request.Context(), int32(ruleID))
	if err != nil {
		fmt.Println("ToggleDiscountRule error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to toggle rule"})
		return
	}

	action := "deactivated"
	if rule.IsActive {
		action = "activated"
	}

	admin, exists := c.Get("admin")
	if !exists {
		c.JSON(http.StatusOK, gin.H{
			"message":   "Rule toggled successfully",
			"is_active": rule.IsActive,
		})
		return
	}
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
			EntityType: pgtype.Text{String: "discount_rule", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(ruleID), Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("%s discount rule ID: %d", action, ruleID), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, params)
	}()

	c.JSON(http.StatusOK, gin.H{
		"message":   "Rule toggled successfully",
		"is_active": rule.IsActive,
	})
}

type BulkDiscountRequest struct {
	ProductIDs []int32 `json:"product_ids"`
	SelectAll  bool    `json:"select_all"`
	ExcludeIDs []int32 `json:"exclude_ids"`
	RuleID     int32   `json:"rule_id" binding:"required"`

	// Для select_all режима
	Filters *ProductFilters `json:"filters"`
	Search  string          `json:"search"`
}

func (s *Server) handleBulkUpdateProductDiscount(c *gin.Context) {
	var req BulkDiscountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Валидация rule_id
	if req.RuleID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rule ID"})
		return
	}

	// Проверяем существование правила
	_, err := s.store.GetDiscountRuleByID(c.Request.Context(), req.RuleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Discount rule not found"})
		return
	}

	var productIDs []int32

	if req.SelectAll {
		// Получаем все ID товаров по фильтрам
		params := convertFiltersToParams(req.Filters, req.Search)
		params.ExcludeIds = req.ExcludeIDs

		productIDs, err = s.store.GetProductIDsForAdminByFilters(c.Request.Context(), params)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get products"})
			return
		}
	} else {
		if len(req.ExcludeIDs) > 0 {
			// Исключаем указанные ID из списка
			excludeMap := make(map[int32]bool)
			for _, id := range req.ExcludeIDs {
				excludeMap[id] = true
			}

			filtered := make([]int32, 0, len(req.ProductIDs))
			for _, id := range req.ProductIDs {
				if !excludeMap[id] {
					filtered = append(filtered, id)
				}
			}
			productIDs = filtered
		} else {
			productIDs = req.ProductIDs
		}
	}

	if len(productIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No products selected"})
		return
	}

	// Добавляем скидки пачками (batch insert)
	batchSize := 100
	addedCount := 0

	for i := 0; i < len(productIDs); i += batchSize {
		end := i + batchSize
		if end > len(productIDs) {
			end = len(productIDs)
		}

		batch := productIDs[i:end]

		// Используем batch insert для производительности
		err = s.store.BulkAddRuleItems(c.Request.Context(), db.BulkAddRuleItemsParams{
			RuleID:   req.RuleID,
			ItemType: "product",
			ItemIds:  batch,
		})
		fmt.Println("Recalculate discounts", batch)
		if err != nil {
			log.Printf("Failed to add discount batch for products %v: %v", batch, err)
			continue
		}
		fmt.Println("Recalculate all discounts", batch)
		err = s.store.RecalculateAllDiscounts(c.Request.Context())
		if err != nil {
			log.Printf("Failed to add discount batch for products %v: %v", batch, err)
			continue
		}

		addedCount += len(batch)
	}

	c.JSON(http.StatusOK, gin.H{
		"added_count": addedCount,
		"message":     fmt.Sprintf("Discount applied to %d products", addedCount),
	})
}
