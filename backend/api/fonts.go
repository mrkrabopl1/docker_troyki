// api/fonts_handler.go
package api

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
)

// ============================================================
// GET /api/fonts — публичный список активных шрифтов
// (нужен витрине, если не хотите тянуть из mainInfo)
// ============================================================
func (s *Server) handleGetFonts(c *gin.Context) {
	fonts, err := s.store.GetAllFonts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get fonts"})
		return
	}

	out := make([]gin.H, 0, len(fonts))
	for _, f := range fonts {
		if !f.IsActive {
			continue
		}
		out = append(out, gin.H{
			"id":      f.ID,
			"family":  f.Family,
			"slug":    f.Slug,
			"url":     s.fontService.BuildURL(f.Url), // /fonts/...
			"weight":  f.Weight,
			"style":   f.Style,
			"version": f.Version,
		})
	}
	c.JSON(http.StatusOK, out)
}

// ============================================================
// GET /api/admin/fonts — все шрифты (включая неактивные)
// ============================================================
func (s *Server) handleAdminGetFonts(c *gin.Context) {
	fonts, err := s.store.GetAllFonts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get fonts"})
		return
	}

	out := make([]gin.H, 0, len(fonts))
	for _, f := range fonts {
		out = append(out, gin.H{
			"id":        f.ID,
			"family":    f.Family,
			"slug":      f.Slug,
			"url":       s.fontService.BuildURL(f.Url),
			"weight":    f.Weight,
			"style":     f.Style,
			"is_active": f.IsActive,
			"version":   f.Version,
		})
	}
	c.JSON(http.StatusOK, out)
}

// ============================================================
// POST /api/admin/fonts
// multipart: family, slug, weight, style, file (.woff)
// ============================================================
func (s *Server) handleAdminCreateFont(c *gin.Context) {
	family := c.PostForm("family")
	slug := c.PostForm("slug")
	weightStr := c.PostForm("weight")
	style := c.PostForm("style")

	if family == "" || slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "family and slug are required"})
		return
	}

	weight, err := strconv.Atoi(weightStr)
	if err != nil || weight < 100 || weight > 900 || weight%100 != 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid weight"})
		return
	}
	if style == "" {
		style = "normal"
	}
	if style != "normal" && style != "italic" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid style"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	url, err := s.fontService.SaveFont(slug, weight, file)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	created, err := s.store.CreateFont(c.Request.Context(), db.CreateFontParams{
		Family:   family,
		Slug:     slug,
		Url:      url,
		Weight:   int16(weight),
		Style:    style,
		IsActive: true,
	})
	if err != nil {
		_ = s.fontService.DeleteFont(url)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save font"})
		return
	}

	s.invalidateMainInfoCache()

	c.JSON(http.StatusOK, gin.H{
		"id":        created.ID,
		"family":    created.Family,
		"slug":      created.Slug,
		"url":       s.fontService.BuildURL(created.Url),
		"weight":    created.Weight,
		"style":     created.Style,
		"is_active": created.IsActive,
		"version":   created.Version,
	})
}

// ============================================================
// POST /api/admin/fonts/:id — заменить файл
// multipart: file (.woff)
// ============================================================
func (s *Server) handleAdminUpdateFont(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	existing, err := s.store.GetFontByID(c.Request.Context(), int32(id))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "font not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get font"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	url, err := s.fontService.SaveFont(existing.Slug, int(existing.Weight), file)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updated, err := s.store.UpdateFont(c.Request.Context(), db.UpdateFontParams{
		ID:       int32(id),
		Url:      url,
		Family:   existing.Family,
		Weight:   existing.Weight,
		Style:    existing.Style,
		IsActive: true,
	})
	if err != nil {
		_ = s.fontService.DeleteFont(url)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update font"})
		return
	}

	// старый файл не удаляем — оставляем для отката

	s.invalidateMainInfoCache()

	c.JSON(http.StatusOK, gin.H{
		"id":        updated.ID,
		"family":    updated.Family,
		"slug":      updated.Slug,
		"url":       s.fontService.BuildURL(updated.Url),
		"weight":    updated.Weight,
		"style":     updated.Style,
		"is_active": updated.IsActive,
		"version":   updated.Version,
	})
}

// ============================================================
// DELETE /api/admin/fonts/:id
// ============================================================
func (s *Server) handleAdminDeleteFont(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	font, err := s.store.GetFontByID(c.Request.Context(), int32(id))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "font not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get font"})
		return
	}

	if err := s.store.DeleteFont(c.Request.Context(), int32(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete font"})
		return
	}

	// файл не удаляем — только запись. Чистка файлов — отдельным cron.
	_ = font // чтобы не ругался компилятор

	s.invalidateMainInfoCache()

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ============================================================
// PATCH /api/admin/site-settings/fonts
// body: { "font_body_id": 1 | null, "font_display_id": 2 | null }
// ============================================================
func (s *Server) handleAdminSetFontRoles(c *gin.Context) {
	var req struct {
		FontBodyID    *int32 `json:"font_body_id"`
		FontDisplayID *int32 `json:"font_display_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updated, err := s.store.SetFontRole(c.Request.Context(), db.SetFontRoleParams{
		FontBodyID:    toPgInt4(req.FontBodyID),
		FontDisplayID: toPgInt4(req.FontDisplayID),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save roles"})
		return
	}

	s.invalidateMainInfoCache()

	c.JSON(http.StatusOK, gin.H{
		"logo_url":        updated.LogoUrl,
		"logo_alt":        updated.LogoAlt,
		"logo_version":    updated.LogoVersion,
		"font_body_id":    pgInt4ToPtr(updated.FontBodyID),
		"font_display_id": pgInt4ToPtr(updated.FontDisplayID),
	})
}

// ============================================================
// хелперы
// ============================================================

func toPgInt4(p *int32) pgtype.Int4 {
	if p == nil {
		return pgtype.Int4{Valid: false}
	}
	return pgtype.Int4{Int32: *p, Valid: true}
}

func pgInt4ToPtr(v pgtype.Int4) *int32 {
	if !v.Valid {
		return nil
	}
	return &v.Int32
}
