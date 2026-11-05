// api/site_settings_handler.go
package api

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
)

// ============================================================
// GET /api/site-settings — публичный
// Возвращает текущие настройки брендинга.
// Если строки нет (миграция не выполнилась) — отдаёт дефолт.
// ============================================================
func (s *Server) handleGetSiteSettings(c *gin.Context) {
	settings, err := s.store.GetSiteSettings(c.Request.Context())
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusOK, gin.H{
				"logo_url":        "/troyki_logo.svg",
				"logo_alt":        "TROYKI_BENCH",
				"logo_version":    0,
				"font_body_id":    nil,
				"font_display_id": nil,
				"fonts":           []gin.H{},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get settings"})
		return
	}

	fonts, _ := s.store.GetAllFonts(c.Request.Context())
	fontsOut := make([]gin.H, 0, len(fonts))
	for _, f := range fonts {
		if !f.IsActive {
			continue
		}
		fontsOut = append(fontsOut, gin.H{
			"id":      f.ID,
			"family":  f.Family,
			"slug":    f.Slug,
			"url":     s.fontService.BuildURL(f.Url),
			"weight":  f.Weight,
			"style":   f.Style,
			"version": f.Version,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"logo_url":        settings.LogoUrl,
		"logo_alt":        settings.LogoAlt,
		"logo_version":    settings.LogoVersion,
		"font_body_id":    pgInt4ToPtr(settings.FontBodyID),
		"font_display_id": pgInt4ToPtr(settings.FontDisplayID),
		"fonts":           fontsOut,
	})
}

// ============================================================
// POST /api/admin/site-settings/logo
// multipart/form-data:
//   - image    (file, обязательно, только SVG)
//   - logo_alt (string, опционально; если пусто — оставляем текущий)
//
// Порядок операций (важно для отката):
//  1. читаем текущие настройки (нужен старый logo_url)
//  2. сохраняем новый файл через ImageService
//  3. обновляем БД (logo_url, logo_alt, logo_version++)
//  4. при ошибке БД — удаляем новый файл (откат)
//  5. старый файл НЕ удаляем — оставляем для отката
//
// ============================================================
func (s *Server) handleAdminUploadLogo(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "image is required"})
		return
	}

	// 1. читаем текущие настройки
	cur, err := s.store.GetSiteSettings(c.Request.Context())
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get settings"})
		return
	}

	// 2. сохраняем новый файл (внутри — валидация SVG: расширение, MIME, размер, содержимое)
	logoPath, err := s.imageService.SaveLogo(file)
	fmt.Println(logoPath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3. определяем alt: из формы, иначе — текущий (или дефолт, если строки не было)
	alt := strings.TrimSpace(c.PostForm("logo_alt"))
	if alt == "" {
		if cur.LogoAlt != "" {
			alt = cur.LogoAlt
		} else {
			alt = "TROYKI_BENCH"
		}
	}

	// 4. обновляем БД
	updated, err := s.store.UpdateSiteLogo(c.Request.Context(), db.UpdateSiteLogoParams{
		LogoUrl: logoPath,
		LogoAlt: alt,
	})
	if err != nil {
		// откат: удаляем только что сохранённый файл, чтобы не оставлять сироту
		_ = s.imageService.DeleteLogo(logoPath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update settings"})
		return
	}

	// 5. старый файл НЕ удаляем — оставляем на диске для отката.
	//    Чистка «сирот» — отдельной задачей/cron позже.

	// 6. инвалидация кеша mainInfo (если CachedMiddleware умеет ручную инвалидацию)
	s.invalidateMainInfoCache()

	c.JSON(http.StatusOK, gin.H{
		"logo_url":     updated.LogoUrl,
		"logo_alt":     updated.LogoAlt,
		"logo_version": updated.LogoVersion,
	})
}

// ============================================================
// PATCH /api/admin/site-settings/logo-alt
// Только alt. Файл не меняется → logo_version НЕ инкрементится.
// ============================================================
func (s *Server) handleAdminUpdateLogoAlt(c *gin.Context) {
	var req struct {
		LogoAlt *string `json:"logo_alt"` // указатель: отличаем «не передали» от «передали пусто»
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.LogoAlt == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "logo_alt is required"})
		return
	}

	updated, err := s.store.UpdateSiteLogoAlt(c.Request.Context(), *req.LogoAlt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "site settings not initialized"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update alt"})
		return
	}

	s.invalidateMainInfoCache()

	c.JSON(http.StatusOK, gin.H{
		"logo_url":     updated.LogoUrl,
		"logo_alt":     updated.LogoAlt,
		"logo_version": updated.LogoVersion, // не менялся
	})
}

// ============================================================
// invalidateMainInfoCache — сброс кеша GET /api/main/info
//
// Если CachedMiddleware кеширует по URL и умеет ручную инвалидацию —
// раскомментируйте вызов. Иначе оставьте no-op: изменения появятся
// по истечении TTL (для магазина это приемлемо).
// ============================================================
func (s *Server) invalidateMainInfoCache() {
	// Пример, если в Server есть поле cache:
	// if s.cache != nil {
	//     s.cache.Del("/api/main/info")
	// }
	_ = struct{}{}
}
