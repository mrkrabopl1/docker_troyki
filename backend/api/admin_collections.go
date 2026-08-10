// api/admin_collections.go
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

// CreateCollection - создание коллекции
func (s *Server) handleAdminCreateCollection(c *gin.Context) {
	var input struct {
		Slug        string          `json:"slug" binding:"required"`
		Name        string          `json:"name" binding:"required"`
		Description string          `json:"description"`
		Type        string          `json:"type" binding:"required,oneof=dynamic manual hybrid"`
		Settings    json.RawMessage `json:"settings"`
		IsActive    bool            `json:"is_active"`
		SortOrder   int32           `json:"sort_order"`
		ProductIDs  []int32         `json:"product_ids,omitempty"` // Для ручного режима
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Проверяем уникальность slug
	existing, _ := s.store.GetCollectionBySlug(c.Request.Context(), input.Slug)
	if existing.ID != 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Collection with this slug already exists"})
		return
	}

	// Парсим настройки
	var settings types.CollectionSettings
	if len(input.Settings) > 0 {
		if err := json.Unmarshal(input.Settings, &settings); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid settings"})
			return
		}
	}

	// Валидация в зависимости от типа
	switch input.Type {
	case "dynamic":
		if settings.Filters == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "filters are required for dynamic collection",
			})
			return
		}
	case "manual":
		if len(input.ProductIDs) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "product_ids are required for manual collection",
			})
			return
		}
	case "hybrid":
		if settings.Filters == nil && len(input.ProductIDs) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "either filters or product_ids are required for hybrid collection",
			})
			return
		}
	}

	// Создаем коллекцию
	collection, err := s.store.CreateCollection(c.Request.Context(), db.CreateCollectionParams{
		Slug:        input.Slug,
		Name:        input.Name,
		Description: pgtype.Text{String: input.Description, Valid: input.Description != ""},
		Type:        input.Type,
		Settings:    input.Settings,
		IsActive:    pgtype.Bool{Bool: input.IsActive, Valid: true},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create collection"})
		return
	}

	// Если ручной режим - добавляем товары
	if input.Type == "manual" || input.Type == "hybrid" {
		if len(input.ProductIDs) > 0 {
			// Создаем массив для sort_order (по порядку)
			sortOrders := make([]int32, len(input.ProductIDs))
			for i := range sortOrders {
				sortOrders[i] = int32(i)
			}

			if err := s.store.AddProductsToCollection(c.Request.Context(), db.AddProductsToCollectionParams{
				CollectionID: collection.ID,
				ProductIds:   input.ProductIDs,
			}); err != nil {
				// Логируем ошибку, но не откатываем создание коллекции
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Failed to add products to collection",
				})
				return
			}
		}
	}

	// Логируем
	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)
	go s.logAdminAction(adminDB.ID, "create", "collection", collection.ID,
		fmt.Sprintf("Created collection: %s (%s)", collection.Name, collection.Type),
		c.ClientIP())

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Collection created successfully",
		"collection": collection,
	})
}

// GetCollections - получение всех коллекций
func (s *Server) handleAdminGetCollections(c *gin.Context) {
	collections, err := s.store.GetAllCollections(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get collections"})
		return
	}

	// Определяем структуру ответа с json.RawMessage для Settings
	type CollectionResponse struct {
		ID           int32           `json:"id"`
		Name         string          `json:"name"`
		Slug         string          `json:"slug"`
		Description  string          `json:"description"`
		Settings     json.RawMessage `json:"settings"`
		IsActive     bool            `json:"is_active"`
		ProductCount int32           `json:"product_count"`
		Type         string          `json:"type"`
		CreatedAt    time.Time       `json:"created_at"`
		UpdatedAt    time.Time       `json:"updated_at"`
	}

	result := make([]CollectionResponse, 0, len(collections))
	for _, col := range collections {
		count, _ := s.store.GetCollectionProductCount(c.Request.Context(), col.ID)

		// Преобразуем Settings в json.RawMessage
		settings := col.Settings
		if len(settings) == 0 || string(settings) == "null" {
			settings = json.RawMessage("{}")
		}

		result = append(result, CollectionResponse{
			ID:           col.ID,
			Name:         col.Name,
			Slug:         col.Slug,
			Description:  col.Description.String,
			Settings:     settings,
			IsActive:     col.IsActive.Bool, // если используется sql.NullBool
			ProductCount: count,
			CreatedAt:    col.CreatedAt.Time,
			UpdatedAt:    col.UpdatedAt.Time,
			Type:         col.Type,
		})
		fmt.Println(result[0].Type)
	}

	c.JSON(http.StatusOK, result)
}

// GetCollection - получение одной коллекции
// GetCollection - получение одной коллекции
func (s *Server) handleAdminGetCollection(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	collection, err := s.store.GetCollectionByID(c.Request.Context(), int32(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found"})
		return
	}

	// Получаем товары для ручного режима
	var productIDs []int32
	if collection.Type == "manual" || collection.Type == "hybrid" {
		productIDs, _ = s.store.GetCollectionProductIDs(c.Request.Context(), collection.ID)
	}

	// Парсим Settings в нужный формат
	var settingsMap map[string]interface{}

	if len(collection.Settings) > 0 {
		var settings types.CollectionSettings
		if err := json.Unmarshal(collection.Settings, &settings); err == nil && settings.Filters != nil {
			settingsMap = map[string]interface{}{
				"firms":     settings.Filters.Firms,
				"lines":     settings.Filters.Lines,
				"price":     settings.Filters.Price,
				"sizes":     settings.Filters.Sizes,
				"types":     settings.Filters.Types,
				"in_store":  settings.Filters.InStore,
				"rule_ids":  settings.Filters.RuleIDs,
				"bodytypes": settings.Filters.Bodytypes,
			}
		}
	}

	// Если settingsMap не заполнен - дефолтные значения
	if settingsMap == nil {
		settingsMap = map[string]interface{}{
			"firms":     []int32{},
			"lines":     []int32{},
			"price":     []int{0, 100000},
			"sizes":     []string{},
			"types":     []int32{},
			"in_store":  false,
			"rule_ids":  []int32{},
			"bodytypes": []string{},
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"collection": gin.H{
			"id":          collection.ID,
			"slug":        collection.Slug,
			"name":        collection.Name,
			"description": collection.Description.String,
			"type":        collection.Type,
			"is_active":   collection.IsActive.Bool,
			"created_at":  collection.CreatedAt,
			"updated_at":  collection.UpdatedAt,
		},
		"filters":     toJSONRawMessage(settingsMap, "{}"),
		"product_ids": productIDs,
	})
}

// UpdateCollection - обновление коллекции
func (s *Server) handleAdminUpdateCollection(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var input struct {
		Slug        *string         `json:"slug"`
		Name        *string         `json:"name"`
		Description *string         `json:"description"`
		Type        *string         `json:"type"`
		Settings    json.RawMessage `json:"settings"`
		IsActive    *bool           `json:"is_active"`
		SortOrder   *int32          `json:"sort_order"`
		ProductIDs  []int32         `json:"product_ids"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Получаем текущую коллекцию
	current, err := s.store.GetCollectionByID(c.Request.Context(), int32(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found"})
		return
	}

	// Обновляем коллекцию
	updateParams := db.UpdateCollectionParams{
		ID: int32(id),
	}

	if input.Slug != nil {
		updateParams.Slug = *input.Slug
		// Проверяем уникальность нового slug
		if *input.Slug != current.Slug {
			existing, _ := s.store.GetCollectionBySlug(c.Request.Context(), *input.Slug)
			if existing.ID != 0 {
				c.JSON(http.StatusConflict, gin.H{"error": "Collection with this slug already exists"})
				return
			}
		}
	}

	if input.Name != nil {
		updateParams.Name = *input.Name
	}

	if input.Description != nil {
		updateParams.Description = pgtype.Text{String: *input.Description, Valid: true}
	}

	if input.Type != nil {
		updateParams.Type = *input.Type
	}

	if input.Settings != nil {
		updateParams.Settings = input.Settings
	}

	if input.IsActive != nil {
		updateParams.IsActive = pgtype.Bool{Bool: *input.IsActive, Valid: true}
	}

	collection, err := s.store.UpdateCollection(c.Request.Context(), updateParams)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update collection"})
		return
	}

	// Обновляем товары, если переданы
	if len(input.ProductIDs) > 0 && (collection.Type == "manual" || collection.Type == "hybrid") {
		// Очищаем старые связи
		if err := s.store.ClearCollectionProducts(c.Request.Context(), collection.ID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update products"})
			return
		}

		// Добавляем новые
		sortOrders := make([]int32, len(input.ProductIDs))
		for i := range sortOrders {
			sortOrders[i] = int32(i)
		}

		if err := s.store.AddProductsToCollection(c.Request.Context(), db.AddProductsToCollectionParams{
			CollectionID: collection.ID,
			ProductIds:   input.ProductIDs,
		}); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add products"})
			return
		}
	}

	// Инвалидируем кэш
	go s.taskProcessor.ClearCollectionCache(c.Request.Context(), collection.Slug)

	// Логируем
	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)
	go s.logAdminAction(adminDB.ID, "update", "collection", collection.ID,
		fmt.Sprintf("Updated collection: %s", collection.Name),
		c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"message":    "Collection updated successfully",
		"collection": collection,
	})
}

// DeleteCollection - удаление коллекции
func (s *Server) handleAdminDeleteCollection(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	// Получаем коллекцию для логирования
	collection, err := s.store.GetCollectionByID(c.Request.Context(), int32(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found"})
		return
	}

	// Удаляем
	if err := s.store.DeleteCollection(c.Request.Context(), int32(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete collection"})
		return
	}

	// Инвалидируем кэш
	go s.taskProcessor.ClearCollectionCache(c.Request.Context(), collection.Slug)

	// Логируем
	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)
	go s.logAdminAction(adminDB.ID, "delete", "collection", collection.ID,
		fmt.Sprintf("Deleted collection: %s", collection.Name),
		c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"message": "Collection deleted successfully"})
}
