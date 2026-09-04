// api/admin_news.go

package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
)

// ============================================
// NEWS BLOCKS CRUD
// ============================================

// GET /admin/news-blocks
func (s *Server) handleAdminGetNewsBlocks(c *gin.Context) {
	blocks, err := s.store.GetNewsBlocks(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get news blocks"})
		return
	}
	if blocks == nil {
		blocks = []db.NewsBlock{}
	}
	c.JSON(http.StatusOK, blocks)
}

// GET /admin/news-blocks/:id
func (s *Server) handleAdminGetNewsBlock(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid block ID"})
		return
	}

	block, err := s.store.GetNewsBlockByID(c.Request.Context(), int32(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "News block not found"})
		return
	}

	items, err := s.store.GetNewsItemsByBlock(c.Request.Context(), int32(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get block items"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"block": block,
		"items": items,
	})
}

// POST /admin/news-blocks
func (s *Server) handleAdminCreateNewsBlock(c *gin.Context) {
	contentType := c.GetHeader("Content-Type")

	var title string
	var coverImageUrl string
	var coverAltText string
	var isActive bool
	var publishedAt pgtype.Timestamptz
	var sortOrder int32

	if strings.Contains(contentType, "multipart/form-data") {
		// 🔥 ОБРАБОТКА FORM-DATA (с изображением)
		title = c.PostForm("title")
		coverAltText = c.PostForm("cover_alt_text")
		isActive, _ = strconv.ParseBool(c.PostForm("is_active"))
		sortOrder64, _ := strconv.ParseInt(c.PostForm("sort_order"), 10, 32)
		sortOrder = int32(sortOrder64)

		pubAt := c.PostForm("published_at")
		if pubAt != "" {
			t, err := time.Parse(time.RFC3339, pubAt)
			if err == nil {
				publishedAt = pgtype.Timestamptz{Time: t, Valid: true}
			}
		}
		if !publishedAt.Valid {
			publishedAt = pgtype.Timestamptz{Time: time.Now(), Valid: true}
		}

		// Получаем файл изображения
		file, err := c.FormFile("image")
		if err == nil {
			coverImageUrl, err = s.imageService.SaveNewsImage(file)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image: " + err.Error()})
				return
			}
		}
	} else {
		// 🔥 ОБРАБОТКА JSON (без изображения)
		var input struct {
			Title         string `json:"title" binding:"required"`
			CoverImageUrl string `json:"cover_image_url"`
			CoverAltText  string `json:"cover_alt_text"`
			IsActive      bool   `json:"is_active"`
			PublishedAt   string `json:"published_at"`
			SortOrder     int32  `json:"sort_order"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		title = input.Title
		coverImageUrl = input.CoverImageUrl
		coverAltText = input.CoverAltText
		isActive = input.IsActive
		sortOrder = input.SortOrder

		if input.PublishedAt != "" {
			t, err := time.Parse(time.RFC3339, input.PublishedAt)
			if err == nil {
				publishedAt = pgtype.Timestamptz{Time: t, Valid: true}
			}
		}
		if !publishedAt.Valid {
			publishedAt = pgtype.Timestamptz{Time: time.Now(), Valid: true}
		}
	}

	if isActive {
		count, err := s.store.CountActiveNewsBlocks(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check active blocks count"})
			return
		}
		if count >= 10 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Maximum 10 active news blocks allowed"})
			return
		}
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	block, err := s.store.CreateNewsBlock(c.Request.Context(), db.CreateNewsBlockParams{
		Title:         title,
		CoverImageUrl: pgtype.Text{String: coverImageUrl, Valid: coverImageUrl != ""},
		CoverAltText:  pgtype.Text{String: coverAltText, Valid: coverAltText != ""},
		IsActive:      pgtype.Bool{Bool: isActive, Valid: true},
		PublishedAt:   publishedAt,
		SortOrder:     pgtype.Int4{Int32: sortOrder, Valid: true},
	})
	if err != nil {
		if coverImageUrl != "" {
			s.imageService.DeleteNewsImage(coverImageUrl)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create news block"})
		return
	}

	go s.logAdminAction(adminDB.ID, "create", "news_block", block.ID,
		fmt.Sprintf("Created news block: %s", block.Title), c.ClientIP())

	c.JSON(http.StatusCreated, gin.H{
		"message": "News block created successfully",
		"block":   block,
	})
}

// PUT /admin/news-blocks/:id
func (s *Server) handleAdminUpdateNewsBlock(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid block ID"})
		return
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	oldBlock, err := s.store.GetNewsBlockByID(c.Request.Context(), int32(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "News block not found"})
		return
	}

	contentType := c.GetHeader("Content-Type")

	var title string
	var coverImageUrl string
	var coverAltText string
	var isActive bool
	var publishedAt pgtype.Timestamptz
	var sortOrder int32
	var hasNewImage bool

	if strings.Contains(contentType, "multipart/form-data") {
		// 🔥 ОБРАБОТКА FORM-DATA (с изображением)
		title = c.PostForm("title")
		coverAltText = c.PostForm("cover_alt_text")
		isActive, _ = strconv.ParseBool(c.PostForm("is_active"))
		sortOrder64, _ := strconv.ParseInt(c.PostForm("sort_order"), 10, 32)
		sortOrder = int32(sortOrder64)

		pubAt := c.PostForm("published_at")
		if pubAt != "" {
			t, err := time.Parse(time.RFC3339, pubAt)
			if err == nil {
				publishedAt = pgtype.Timestamptz{Time: t, Valid: true}
			}
		}
		if !publishedAt.Valid {
			publishedAt = oldBlock.PublishedAt
		}

		file, err := c.FormFile("image")
		if err == nil {
			coverImageUrl, err = s.imageService.SaveNewsImage(file)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image: " + err.Error()})
				return
			}
			hasNewImage = true
		} else {
			coverImageUrl = oldBlock.CoverImageUrl.String
		}
	} else {
		// 🔥 ОБРАБОТКА JSON (без изображения)
		var input struct {
			Title         *string `json:"title"`
			CoverImageUrl *string `json:"cover_image_url"`
			CoverAltText  *string `json:"cover_alt_text"`
			IsActive      *bool   `json:"is_active"`
			PublishedAt   *string `json:"published_at"`
			SortOrder     *int32  `json:"sort_order"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if input.Title != nil {
			title = *input.Title
		} else {
			title = oldBlock.Title
		}

		if input.CoverImageUrl != nil {
			coverImageUrl = *input.CoverImageUrl
		} else {
			coverImageUrl = oldBlock.CoverImageUrl.String
		}

		if input.CoverAltText != nil {
			coverAltText = *input.CoverAltText
		} else {
			coverAltText = oldBlock.CoverAltText.String
		}

		if input.IsActive != nil {
			isActive = *input.IsActive
		} else {
			isActive = oldBlock.IsActive.Bool
		}

		if input.SortOrder != nil {
			sortOrder = *input.SortOrder
		} else {
			sortOrder = oldBlock.SortOrder.Int32
		}

		if input.PublishedAt != nil && *input.PublishedAt != "" {
			t, err := time.Parse(time.RFC3339, *input.PublishedAt)
			if err == nil {
				publishedAt = pgtype.Timestamptz{Time: t, Valid: true}
			} else {
				publishedAt = oldBlock.PublishedAt
			}
		} else {
			publishedAt = oldBlock.PublishedAt
		}
	}

	if isActive && !oldBlock.IsActive.Bool {
		count, err := s.store.CountActiveNewsBlocks(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check active blocks count"})
			return
		}
		if count >= 10 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Maximum 10 active news blocks allowed"})
			return
		}
	}

	params := db.UpdateNewsBlockParams{
		ID:            int32(id),
		Title:         title,
		CoverImageUrl: pgtype.Text{String: coverImageUrl, Valid: coverImageUrl != ""},
		CoverAltText:  pgtype.Text{String: coverAltText, Valid: coverAltText != ""},
		IsActive:      pgtype.Bool{Bool: isActive, Valid: true},
		PublishedAt:   publishedAt,
		SortOrder:     pgtype.Int4{Int32: sortOrder, Valid: true},
	}

	block, err := s.store.UpdateNewsBlock(c.Request.Context(), params)
	if err != nil {
		if hasNewImage && coverImageUrl != "" {
			s.imageService.DeleteNewsImage(coverImageUrl)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update news block"})
		return
	}

	if hasNewImage && coverImageUrl != "" && oldBlock.CoverImageUrl.String != "" && oldBlock.CoverImageUrl.String != coverImageUrl {
		s.imageService.DeleteNewsImage(oldBlock.CoverImageUrl.String)
	}

	go s.logAdminAction(adminDB.ID, "update", "news_block", block.ID,
		fmt.Sprintf("Updated news block: %s", block.Title), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"message": "News block updated successfully",
		"block":   block,
	})
}

// DELETE /admin/news-blocks/:id
func (s *Server) handleAdminDeleteNewsBlock(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid block ID"})
		return
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	block, err := s.store.GetNewsBlockByID(c.Request.Context(), int32(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "News block not found"})
		return
	}

	if block.CoverImageUrl.String != "" {
		s.imageService.DeleteNewsImage(block.CoverImageUrl.String)
	}

	err = s.store.DeleteNewsBlock(c.Request.Context(), int32(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete news block"})
		return
	}

	go s.logAdminAction(adminDB.ID, "delete", "news_block", block.ID,
		fmt.Sprintf("Deleted news block: %s", block.Title), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"message": "News block deleted successfully"})
}

// PATCH /admin/news-blocks/reorder
func (s *Server) handleAdminReorderNewsBlocks(c *gin.Context) {
	var input struct {
		Order []int32 `json:"order" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	for idx, blockID := range input.Order {
		err := s.store.ReorderNewsBlock(c.Request.Context(), db.ReorderNewsBlockParams{
			ID:        blockID,
			SortOrder: pgtype.Int4{Int32: int32(idx), Valid: true},
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reorder blocks"})
			return
		}
	}

	go s.logAdminAction(adminDB.ID, "reorder", "news_block", 0,
		fmt.Sprintf("Reordered %d news blocks", len(input.Order)), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"message": "News blocks reordered successfully"})
}

// ============================================
// NEWS ITEMS CRUD
// ============================================

// GET /admin/news-blocks/:id/items
func (s *Server) handleAdminGetNewsItems(c *gin.Context) {
	blockID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid block ID"})
		return
	}

	items, err := s.store.GetNewsItemsByBlock(c.Request.Context(), int32(blockID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get news items"})
		return
	}
	if items == nil {
		items = []db.NewsItem{}
	}
	c.JSON(http.StatusOK, items)
}

// POST /admin/news-blocks/:id/items
func (s *Server) handleAdminCreateNewsItem(c *gin.Context) {
	blockID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid block ID"})
		return
	}

	contentType := c.GetHeader("Content-Type")

	var itemType string
	var content string
	var imageUrl string
	var linkUrl string
	var layout string
	var sortOrder int32

	if strings.Contains(contentType, "multipart/form-data") {
		// 🔥 ОБРАБОТКА FORM-DATA (с изображением)
		itemType = c.PostForm("item_type")
		content = c.PostForm("content")
		linkUrl = c.PostForm("link_url")
		layout = c.PostForm("layout")
		sortOrder64, _ := strconv.ParseInt(c.PostForm("sort_order"), 10, 32)
		sortOrder = int32(sortOrder64)

		// Получаем файл изображения
		file, err := c.FormFile("image")
		if err == nil {
			imageUrl, err = s.imageService.SaveNewsImage(file)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image: " + err.Error()})
				return
			}
		}
	} else {
		// 🔥 ОБРАБОТКА JSON (без изображения)
		var input struct {
			ItemType  string `json:"item_type" binding:"required,oneof=header text image"`
			Content   string `json:"content"`
			ImageUrl  string `json:"image_url"`
			LinkUrl   string `json:"link_url"`
			Layout    string `json:"layout" binding:"oneof=horizontal vertical"`
			SortOrder int32  `json:"sort_order"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		itemType = input.ItemType
		content = input.Content
		imageUrl = input.ImageUrl
		linkUrl = input.LinkUrl
		layout = input.Layout
		sortOrder = input.SortOrder
	}

	// Валидация
	if itemType == "image" && imageUrl == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "image_url is required for image type"})
		return
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	item, err := s.store.CreateNewsItem(c.Request.Context(), db.CreateNewsItemParams{
		NewsBlockID: int32(blockID),
		ItemType:    db.NewsItemTypeEnum(itemType),
		Content:     pgtype.Text{String: content, Valid: content != ""},
		ImageUrl:    pgtype.Text{String: imageUrl, Valid: imageUrl != ""},
		LinkUrl:     pgtype.Text{String: linkUrl, Valid: linkUrl != ""},
		Layout:      pgtype.Text{String: layout, Valid: layout != ""},
		SortOrder:   pgtype.Int4{Int32: sortOrder, Valid: true},
	})
	if err != nil {
		// Если ошибка БД и загружено изображение, удаляем его
		if imageUrl != "" {
			s.imageService.DeleteNewsImage(imageUrl)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create news item"})
		return
	}

	go s.logAdminAction(adminDB.ID, "create", "news_item", item.ID,
		fmt.Sprintf("Created news item type: %s in block %d", itemType, blockID), c.ClientIP())

	c.JSON(http.StatusCreated, gin.H{
		"message": "News item created successfully",
		"item":    item,
	})
}

// PUT /admin/news-items/:id
func (s *Server) handleAdminUpdateNewsItem(c *gin.Context) {
	itemID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	oldItem, err := s.store.GetNewsItemByID(c.Request.Context(), int32(itemID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "News item not found"})
		return
	}

	contentType := c.GetHeader("Content-Type")

	var itemType string
	var content string
	var imageUrl string
	var linkUrl string
	var layout string
	var sortOrder int32
	var hasNewImage bool

	if strings.Contains(contentType, "multipart/form-data") {
		// 🔥 ОБРАБОТКА FORM-DATA (с изображением)
		itemType = c.PostForm("item_type")
		content = c.PostForm("content")
		linkUrl = c.PostForm("link_url")
		layout = c.PostForm("layout")
		sortOrder64, _ := strconv.ParseInt(c.PostForm("sort_order"), 10, 32)
		sortOrder = int32(sortOrder64)

		// Получаем файл изображения
		file, err := c.FormFile("image")
		if err == nil {
			imageUrl, err = s.imageService.SaveNewsImage(file)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image: " + err.Error()})
				return
			}
			hasNewImage = true
		} else {
			imageUrl = oldItem.ImageUrl.String
		}
	} else {
		// 🔥 ОБРАБОТКА JSON (без изображения)
		var input struct {
			ItemType  *string `json:"item_type"`
			Content   *string `json:"content"`
			ImageUrl  *string `json:"image_url"`
			LinkUrl   *string `json:"link_url"`
			Layout    *string `json:"layout"`
			SortOrder *int32  `json:"sort_order"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if input.ItemType != nil {
			itemType = *input.ItemType
		} else {
			itemType = string(oldItem.ItemType)
		}

		if input.Content != nil {
			content = *input.Content
		} else {
			content = oldItem.Content.String
		}

		if input.ImageUrl != nil {
			imageUrl = *input.ImageUrl
		} else {
			imageUrl = oldItem.ImageUrl.String
		}

		if input.LinkUrl != nil {
			linkUrl = *input.LinkUrl
		} else {
			linkUrl = oldItem.LinkUrl.String
		}

		if input.Layout != nil {
			layout = *input.Layout
		} else {
			layout = oldItem.Layout.String
		}

		if input.SortOrder != nil {
			sortOrder = *input.SortOrder
		} else {
			sortOrder = oldItem.SortOrder.Int32
		}
	}

	// Валидация
	if itemType == "image" && imageUrl == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "image_url is required for image type"})
		return
	}

	params := db.UpdateNewsItemParams{
		ID:        int32(itemID),
		ItemType:  db.NewsItemTypeEnum(itemType),
		Content:   pgtype.Text{String: content, Valid: content != ""},
		ImageUrl:  pgtype.Text{String: imageUrl, Valid: imageUrl != ""},
		LinkUrl:   pgtype.Text{String: linkUrl, Valid: linkUrl != ""},
		Layout:    pgtype.Text{String: layout, Valid: layout != ""},
		SortOrder: pgtype.Int4{Int32: sortOrder, Valid: true},
	}

	item, err := s.store.UpdateNewsItem(c.Request.Context(), params)
	if err != nil {
		// Если ошибка БД и загружено новое изображение, удаляем его
		if hasNewImage && imageUrl != "" {
			s.imageService.DeleteNewsImage(imageUrl)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update news item"})
		return
	}

	// Если загружено новое изображение и было старое - удаляем старое
	if hasNewImage && imageUrl != "" && oldItem.ImageUrl.String != "" && oldItem.ImageUrl.String != imageUrl {
		s.imageService.DeleteNewsImage(oldItem.ImageUrl.String)
	}

	go s.logAdminAction(adminDB.ID, "update", "news_item", item.ID,
		fmt.Sprintf("Updated news item %d", item.ID), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"message": "News item updated successfully",
		"item":    item,
	})
}

// DELETE /admin/news-items/:id
func (s *Server) handleAdminDeleteNewsItem(c *gin.Context) {
	itemID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	item, err := s.store.GetNewsItemByID(c.Request.Context(), int32(itemID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "News item not found"})
		return
	}

	// Удаляем изображение если есть
	if item.ImageUrl.String != "" {
		s.imageService.DeleteNewsImage(item.ImageUrl.String)
	}

	err = s.store.DeleteNewsItem(c.Request.Context(), int32(itemID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete news item"})
		return
	}

	go s.logAdminAction(adminDB.ID, "delete", "news_item", item.ID,
		fmt.Sprintf("Deleted news item %d", item.ID), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"message": "News item deleted successfully"})
}

// PATCH /admin/news-items/reorder
func (s *Server) handleAdminReorderNewsItems(c *gin.Context) {
	var input struct {
		BlockID int32   `json:"block_id" binding:"required"`
		Order   []int32 `json:"order" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, _ := c.Get("admin")
	adminDB := admin.(db.GetAdminByIDRow)

	_, err := s.store.GetNewsBlockByID(c.Request.Context(), input.BlockID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "News block not found"})
		return
	}

	for idx, itemID := range input.Order {
		err := s.store.ReorderNewsItem(c.Request.Context(), db.ReorderNewsItemParams{
			ID:        itemID,
			SortOrder: pgtype.Int4{Int32: int32(idx), Valid: true},
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reorder items"})
			return
		}
	}

	go s.logAdminAction(adminDB.ID, "reorder", "news_item", 0,
		fmt.Sprintf("Reordered %d news items in block %d", len(input.Order), input.BlockID), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"message": "News items reordered successfully"})
}

// ============================================
// PUBLIC ENDPOINTS
// ============================================

// GET /api/news - получить все активные новостные блоки
func (s *Server) handleGetActiveNewsBlocks(c *gin.Context) {
	// Получаем параметры из запроса
	search := c.Query("search")
	sortBy := c.Query("sortBy")
	sortOrder := c.Query("sortOrder")
	pageStr := c.Query("page")
	limitStr := c.Query("limit")

	// Значения по умолчанию
	if sortBy == "" {
		sortBy = "published_at"
	}
	if sortOrder == "" {
		sortOrder = "desc"
	}

	page := 1
	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	limit := 10
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	offset := (page - 1) * limit

	// Получаем общее количество
	total, err := s.store.GetNewsListCount(c.Request.Context(), search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get news count"})
		return
	}

	// Получаем новости с фильтрацией
	rows, err := s.store.GetNewsList(c.Request.Context(), db.GetNewsListParams{
		Search:    search,
		SortBy:    sortBy,
		SortOrder: sortOrder,
		Limitval:  int32(limit),
		Offsetval: int32(offset),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get news"})
		return
	}

	if rows == nil {
		rows = []db.GetNewsListRow{}
	}

	// Формируем ответ
	result := make([]gin.H, 0, len(rows))
	for _, row := range rows {
		// 🔥 Парсим items из JSON - приводим к []byte
		var items []db.NewsItem

		// row.Items - это interface{}, нужно привести к []byte
		if itemsBytes, ok := row.Items.([]byte); ok {
			if err := json.Unmarshal(itemsBytes, &items); err != nil {
				items = []db.NewsItem{}
			}
		} else {
			items = []db.NewsItem{}
		}

		result = append(result, gin.H{
			"id":              row.ID,
			"title":           row.Title,
			"cover_image_url": row.CoverImageUrl,
			"cover_alt_text":  row.CoverAltText,
			"is_active":       row.IsActive,
			"published_at":    row.PublishedAt,
			"created_at":      row.CreatedAt,
			"updated_at":      row.UpdatedAt,
			"views_count":     row.ViewsCount,
			"likes_count":     row.LikesCount,
			"sort_order":      row.SortOrder,
			"items":           items,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"blocks": result,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}

// GET /api/news/:id - получить одну новость с элементами
func (s *Server) handleGetNewsBlockByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid news ID"})
		return
	}

	row, err := s.store.GetNewsBlockWithItems(c.Request.Context(), int32(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "News not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"block": gin.H{
			"id":              row.ID,
			"title":           row.Title,
			"cover_image_url": row.CoverImageUrl,
			"cover_alt_text":  row.CoverAltText,
			"is_active":       row.IsActive,
			"published_at":    row.PublishedAt,
			"created_at":      row.CreatedAt,
			"updated_at":      row.UpdatedAt,
			"views_count":     row.ViewsCount,
			"likes_count":     row.LikesCount,
			"sort_order":      row.SortOrder,
		},
		"items": row.Items,
	})
}

// GET /api/news/:id/related - получить похожие новости
func (s *Server) handleGetRelatedNews(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid news ID"})
		return
	}

	limitStr := c.Query("limit")
	limit := 3
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 10 {
			limit = l
		}
	}

	blocks, err := s.store.GetRelatedNews(c.Request.Context(), db.GetRelatedNewsParams{
		ID:       int32(id),
		Limitval: int32(limit),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get related news"})
		return
	}

	if blocks == nil {
		blocks = []db.NewsBlock{}
	}

	c.JSON(http.StatusOK, blocks)
}

// POST /api/news/:id/view - увеличить счетчик просмотров
func (s *Server) handleIncrementNewsView(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid news ID"})
		return
	}

	err = s.store.IncrementNewsBlockViews(c.Request.Context(), int32(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to increment views"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "View counted"})
}

// POST /api/news/:id/like - увеличить счетчик лайков
func (s *Server) handleToggleNewsLike(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid news ID"})
		return
	}

	err = s.store.ToggleNewsBlockLike(c.Request.Context(), int32(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to toggle like"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Like toggled"})
}
