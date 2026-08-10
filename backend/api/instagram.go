package api

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/netip"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
)

const (
	MaxInstagramPhotos = 20 // Максимальное количество фото в ленте
)

type InstagramPhotoResponse struct {
	ID        int32     `json:"id"`
	ImageURL  string    `json:"image_url"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}

// ========== ЗАГРУЗКА ФОТО (СРАЗУ НЕСКОЛЬКО) ==========
// ========== ЗАГРУЗКА ФОТО (СРАЗУ НЕСКОЛЬКО) ==========
func (s *Server) handleAdminUploadInstagramPhotos(c *gin.Context) {
	// 1. Проверяем админа
	admin, _ := c.Get("admin")
	adminRow := admin.(db.GetAdminByIDRow)

	// 2. Получаем файлы (максимум 10 за раз)
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	files := form.File["images"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No images uploaded"})
		return
	}

	// 3. Проверяем лимит загрузки за раз
	if len(files) > 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Maximum 10 images per upload"})
		return
	}

	// 4. Проверяем общее количество фото
	count, err := s.store.CountInstagramPosts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check posts count"})
		return
	}

	if int(count)+len(files) > MaxInstagramPhotos {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Maximum %d photos allowed. You have %d, trying to add %d",
				MaxInstagramPhotos, count, len(files)),
			"current_count":     count,
			"max_allowed":       MaxInstagramPhotos,
			"attempting_to_add": len(files),
		})
		return
	}

	// 5. Создаем папку если нет
	instagramDir := filepath.Join(s.imageService.BaseDir, "instagram")
	if err := os.MkdirAll(instagramDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create directory"})
		return
	}

	var savedPosts []InstagramPhotoResponse
	var failedFiles []string

	// 6. Обрабатываем каждый файл
	for _, fileHeader := range files {
		// Проверяем размер (макс 5MB)
		if fileHeader.Size > 5*1024*1024 {
			failedFiles = append(failedFiles, fileHeader.Filename+" (too large, max 5MB)")
			continue
		}

		// Проверяем расширение
		ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
		allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
		if !allowedExts[ext] {
			failedFiles = append(failedFiles, fileHeader.Filename+" (invalid format)")
			continue
		}

		// Открываем файл
		file, err := fileHeader.Open()
		if err != nil {
			failedFiles = append(failedFiles, fileHeader.Filename+" (failed to open)")
			continue
		}

		// Генерируем имя
		newFilename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), uuid.New().String(), ext)
		newPath := filepath.Join(instagramDir, newFilename)
		fmt.Println(newPath, "newPath", fileHeader.Filename, "fileHeader.Filename", "instagramDir", instagramDir)
		// Сохраняем файл
		out, err := os.Create(newPath)
		if err != nil {
			file.Close()
			failedFiles = append(failedFiles, fileHeader.Filename+" (failed to save)")
			continue
		}

		if _, err := io.Copy(out, file); err != nil {
			file.Close()
			out.Close()
			os.Remove(newPath)
			failedFiles = append(failedFiles, fileHeader.Filename+" (failed to copy)")
			continue
		}

		file.Close()
		out.Close()

		// Сохраняем в БД
		imageURL := "/images/instagram/" + newFilename
		post, err := s.store.CreateInstagramPost(c.Request.Context(), imageURL)
		if err != nil {
			failedFiles = append(failedFiles, fileHeader.Filename+" (failed to save to DB)")
			os.Remove(newPath)
			continue
		}

		savedPosts = append(savedPosts, InstagramPhotoResponse{
			ID:        post.ID,
			ImageURL:  post.ImageUrl,
			IsActive:  post.IsActive.Bool,
			CreatedAt: post.CreatedAt.Time,
		})
	}

	// 7. Логируем
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
			Action:     "upload_instagram",
			EntityType: pgtype.Text{String: "instagram_photos", Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Uploaded %d instagram photos", len(savedPosts)), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, logParams)
	}()

	// 8. Ответ
	response := gin.H{
		"message":  "Photos uploaded successfully",
		"uploaded": len(savedPosts),
		"photos":   savedPosts,
	}

	if len(failedFiles) > 0 {
		response["warnings"] = failedFiles
		response["failed"] = len(failedFiles)
	}

	c.JSON(http.StatusOK, response)
}

// ========== УДАЛЕНИЕ ФОТО ==========
func (s *Server) handleAdminDeleteInstagramPhoto(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	admin, _ := c.Get("admin")
	adminRow := admin.(db.GetAdminByIDRow)

	// 1. Получаем информацию о фото
	posts, err := s.store.GetAdminInstagramPosts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get posts"})
		return
	}

	var imageURL string
	found := false
	for _, p := range posts {
		if p.ID == int32(id) {
			imageURL = p.ImageUrl
			found = true
			break
		}
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "Photo not found"})
		return
	}

	// 2. Удаляем из БД
	err = s.store.DeleteInstagramPost(c.Request.Context(), int32(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete photo"})
		return
	}

	// 3. Удаляем файл
	if imageURL != "" {
		filename := filepath.Base(imageURL)
		filePath := filepath.Join(s.imageService.BaseDir, "instagram", filename)
		if err := os.Remove(filePath); err != nil {
			// Логируем но не возвращаем ошибку
			fmt.Printf("Failed to delete file: %v\n", err)
		}
	}

	// 4. Логируем
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
			Action:     "delete_instagram",
			EntityType: pgtype.Text{String: "instagram_photo", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(id), Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Deleted instagram photo ID: %d", id), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, logParams)
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Photo deleted successfully"})
}

// ========== ПОЛУЧЕНИЕ ВСЕХ ФОТО ДЛЯ АДМИНА ==========
func (s *Server) handleAdminGetInstagramPhotos(c *gin.Context) {
	posts, err := s.store.GetAdminInstagramPosts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get photos"})
		return
	}

	// Гарантируем что возвращаем массив, а не null
	if posts == nil {
		posts = []db.InstagramPost{}
	}

	// Считаем общее количество активных фото
	count, err := s.store.CountInstagramPosts(c.Request.Context())
	if err != nil {
		count = 0
	}

	c.JSON(http.StatusOK, gin.H{
		"photos":  posts,
		"total":   len(posts),
		"active":  count,
		"max":     MaxInstagramPhotos,
		"can_add": int(count) < MaxInstagramPhotos,
	})
}

// ========== ВКЛЮЧЕНИЕ/ВЫКЛЮЧЕНИЕ ФОТО ==========
func (s *Server) handleAdminToggleInstagramPhoto(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	admin, _ := c.Get("admin")
	adminRow := admin.(db.GetAdminByIDRow)

	post, err := s.store.ToggleInstagramPost(c.Request.Context(), int32(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to toggle photo"})
		return
	}

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
			Action:     "toggle_instagram",
			EntityType: pgtype.Text{String: "instagram_photo", Valid: true},
			EntityID:   pgtype.Int4{Int32: int32(id), Valid: true},
			Details:    pgtype.Text{String: fmt.Sprintf("Toggled instagram photo ID: %d to active: %v", id, post.IsActive), Valid: true},
			IpAddress:  ipAddr,
		}
		_ = s.store.CreateAdminLog(ctx, logParams)
	}()

	c.JSON(http.StatusOK, post)
}

// ========== ПОЛУЧЕНИЕ ФОТО ДЛЯ КЛИЕНТА ==========
func (s *Server) handleGetInstagramPhotos(c *gin.Context) {
	posts, err := s.store.GetInstagramPosts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get photos"})
		return
	}

	// Если posts == nil, возвращаем пустой массив
	if posts == nil {
		posts = []db.InstagramPost{}
	}

	c.JSON(http.StatusOK, posts)
}
