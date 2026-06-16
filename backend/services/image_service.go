// service/image_service.go
package services

import (
	"errors"
	"fmt"
	"image"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/disintegration/imaging"
	"github.com/kolesa-team/go-webp/encoder"
	"github.com/kolesa-team/go-webp/webp"
)

// ImageService объединяет работу с файлами и построение путей
type ImageService struct {
	*ImagePathBuilder
	BaseDir      string
	maxSize      int64
	allowedTypes map[string]bool
	maxWidth     int
	thumbWidth   int
	webpQuality  float32
}

// NewImageService создает новый сервис для работы с изображениями
func NewImageService(baseDir string, baseURL string, useCDN bool, maxSizeMB int64) *ImageService {
	return &ImageService{
		ImagePathBuilder: NewImagePathBuilder(baseURL, useCDN, baseDir),
		BaseDir:          baseDir,
		maxSize:          maxSizeMB * 1024 * 1024,
		maxWidth:         2000,
		thumbWidth:       200,
		webpQuality:      80,
		allowedTypes: map[string]bool{
			"image/jpeg": true,
			"image/jpg":  true,
			"image/png":  true,
			"image/webp": true,
		},
	}
}

// ========== ВРЕМЕННЫЕ ФАЙЛЫ ==========

// SaveTempImage сохраняет загруженный файл во временную папку (как есть)
func (s *ImageService) SaveTempImage(sessionID string, file *multipart.FileHeader) (string, error) {
	if err := s.validateFile(file); err != nil {
		return "", err
	}

	timestamp := time.Now().Unix()
	ext := strings.ToLower(filepath.Ext(file.Filename))
	filename := fmt.Sprintf("%d_%s%s", timestamp, sanitizeFilename(file.Filename), ext)

	relativePath := filepath.Join("temp", sessionID)
	fullPath := filepath.Join(s.BaseDir, relativePath, filename)

	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return "", fmt.Errorf("failed to create temp directory: %w", err)
	}

	if err := s.saveUploadedFile(file, fullPath); err != nil {
		return "", fmt.Errorf("failed to save temp file: %w", err)
	}

	return relativePath, nil
}
func (s *ImageService) SaveProductImage(imagePath string, file *multipart.FileHeader, imageNumber int) (string, string, error) {
	// Валидация
	if err := s.validateFile(file); err != nil {
		return "", "", err
	}

	// Открываем
	src, err := file.Open()
	if err != nil {
		return "", "", fmt.Errorf("не удалось открыть файл: %w", err)
	}
	defer src.Close()

	// Декодируем
	img, _, err := image.Decode(src)
	if err != nil {
		return "", "", fmt.Errorf("неверный формат изображения: %w", err)
	}

	// Ресайз если больше maxWidth
	bounds := img.Bounds()
	if bounds.Dx() > s.maxWidth || bounds.Dy() > s.maxWidth {
		img = imaging.Fit(img, s.maxWidth, s.maxWidth, imaging.Lanczos)
	}

	// Thumb
	thumb := imaging.Fit(img, s.thumbWidth, s.thumbWidth, imaging.Lanczos)

	// Папка назначения
	dstDir := filepath.Join(s.BaseDir, imagePath)
	if err := os.MkdirAll(dstDir, 0755); err != nil {
		return "", "", fmt.Errorf("не удалось создать папку: %w", err)
	}

	// Сохраняем оригинал
	if err := s.saveWebP(img, filepath.Join(dstDir, fmt.Sprintf("img%d.webp", imageNumber))); err != nil {
		return "", "", err
	}

	// Сохраняем thumb
	if err := s.saveWebP(thumb, filepath.Join(dstDir, fmt.Sprintf("img%d_thumb.webp", imageNumber))); err != nil {
		return "", "", err
	}

	// URL
	imageURL := s.GetProductImageByPath(imagePath, imageNumber)
	thumbURL := s.GetProductThumbByPath(imagePath, imageNumber)

	return imageURL, thumbURL, nil
}
func (s *ImageService) DeleteProductImage(imageURL string) error {
	// Извлекаем относительный путь из URL
	relativePath := s.ExtractRelativePath(imageURL)

	// Убираем расширение чтобы получить базовое имя
	// "products/123/img1.webp" → "products/123/img1"
	ext := filepath.Ext(relativePath)
	basePath := strings.TrimSuffix(relativePath, ext)

	// Полный физический путь
	fullPath := filepath.Join(s.BaseDir, basePath+".webp")
	thumbPath := filepath.Join(s.BaseDir, basePath+"_thumb.webp")

	// Удаляем оригинал
	if err := os.Remove(fullPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("не удалось удалить изображение: %w", err)
	}

	// Удаляем thumb
	os.Remove(thumbPath)

	return nil
}

// ========== КОНВЕРТАЦИЯ ИЗ TEMP В ТОВАР ==========

// ConvertTempToProduct конвертирует все файлы из temp и сохраняет как WebP + thumb
func (s *ImageService) ConvertTempToProduct(sessionID string, productDir string) (int, error) {
	tempDir := filepath.Join(s.BaseDir, "temp", sessionID)

	entries, err := os.ReadDir(tempDir)
	if err != nil {
		return 0, fmt.Errorf("temp папка не найдена: %w", err)
	}

	// Фильтруем файлы изображений
	var files []string
	for _, entry := range entries {
		if !entry.IsDir() {
			ext := strings.ToLower(filepath.Ext(entry.Name()))
			if ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".webp" {
				files = append(files, entry.Name())
			}
		}
	}

	if len(files) == 0 {
		return 0, fmt.Errorf("нет файлов в temp")
	}

	dstDir := filepath.Join(s.BaseDir, productDir)
	savedCount := 0

	for i, fileName := range files {
		srcPath := filepath.Join(tempDir, fileName)

		if err := s.convertAndSave(srcPath, dstDir, i+1); err != nil {
			fmt.Printf("❌ %s: %v\n", fileName, err)
			continue
		}

		savedCount++
		fmt.Printf("✅ %s → img%d.webp + img%d_thumb.webp\n", fileName, i+1, i+1)
	}

	return savedCount, nil
}

// CleanTemp удаляет временную папку сессии
func (s *ImageService) CleanTemp(sessionID string) {
	tempDir := filepath.Join(s.BaseDir, "temp", sessionID)
	os.RemoveAll(tempDir)
}

// ========== ЯДРО КОНВЕРТАЦИИ ==========

// convertAndSave открывает, ресайзит и сохраняет WebP + thumb
func (s *ImageService) convertAndSave(srcPath string, dstDir string, imageNumber int) error {
	// Открываем
	img, err := imaging.Open(srcPath)
	if err != nil {
		return fmt.Errorf("не удалось открыть: %w", err)
	}

	// Ресайз если больше maxWidth
	bounds := img.Bounds()
	if bounds.Dx() > s.maxWidth || bounds.Dy() > s.maxWidth {
		img = imaging.Fit(img, s.maxWidth, s.maxWidth, imaging.Lanczos)
	}

	// Thumb
	thumb := imaging.Fit(img, s.thumbWidth, s.thumbWidth, imaging.Lanczos)

	// Создаем папку
	if err := os.MkdirAll(dstDir, 0755); err != nil {
		return fmt.Errorf("не удалось создать папку: %w", err)
	}

	// Сохраняем
	if err := s.saveWebP(img, filepath.Join(dstDir, fmt.Sprintf("img%d.webp", imageNumber))); err != nil {
		return err
	}
	if err := s.saveWebP(thumb, filepath.Join(dstDir, fmt.Sprintf("img%d_thumb.webp", imageNumber))); err != nil {
		return err
	}

	return nil
}

// saveWebP сохраняет изображение в WebP
func (s *ImageService) saveWebP(img image.Image, dstPath string) error {
	options, err := encoder.NewLossyEncoderOptions(encoder.PresetDefault, s.webpQuality)
	if err != nil {
		return fmt.Errorf("ошибка энкодера: %w", err)
	}

	file, err := os.Create(dstPath)
	if err != nil {
		return fmt.Errorf("не удалось создать файл: %w", err)
	}
	defer file.Close()

	if err := webp.Encode(file, img, options); err != nil {
		return fmt.Errorf("ошибка кодирования: %w", err)
	}

	return nil
}

// ========== УРЛ ДЛЯ ИЗОБРАЖЕНИЙ ==========

// GetProductImageURL возвращает URL для основного изображения
func (s *ImageService) GetProductImageURL(productID int32, imageNumber int) string {
	return s.buildURL(fmt.Sprintf("products/%d/img%d.webp", productID, imageNumber))
}

// GetProductThumbURL возвращает URL для миниатюры
func (s *ImageService) GetProductThumbURL(productID int32, imageNumber int) string {
	return s.buildURL(fmt.Sprintf("products/%d/img%d_thumb.webp", productID, imageNumber))
}

// GetProductImageByPath возвращает URL по пути в БД
func (s *ImageService) GetProductImageByPath(imagePath string, imageNumber int) string {
	return s.buildURL(fmt.Sprintf("%s/img%d.webp", imagePath, imageNumber))
}

// GetProductThumbByPath возвращает URL миниатюры по пути в БД
func (s *ImageService) GetProductThumbByPath(imagePath string, imageNumber int) string {
	return s.buildURL(fmt.Sprintf("%s/img%d_thumb.webp", imagePath, imageNumber))
}

func (s *ImageService) buildURL(relativePath string) string {
	return s.GetImageURLFromPath(relativePath)
}

// GetBrandImageURL возвращает URL логотипа бренда
func (s *ImageService) GetBrandImageURL(slug string) string {
	return s.ImagePathBuilder.GetBrandImageURL(slug) // ✅ теперь в билдере
}

// ========== УДАЛЕНИЕ ==========

// DeleteProductImages удаляет все изображения товара
func (s *ImageService) DeleteProductImages(productID int32) error {
	productDir := filepath.Join(s.BaseDir, "products", fmt.Sprintf("%d", productID))
	return os.RemoveAll(productDir)
}

// DeleteProductImagesByPath удаляет по структурированному пути
func (s *ImageService) DeleteProductImagesByPath(imagePath string) error {
	fullPath := filepath.Join(s.BaseDir, imagePath)
	return os.RemoveAll(fullPath)
}

// DeleteBannerImage удаляет изображение баннера
func (s *ImageService) DeleteBannerImage(imageURL string) error {
	relativePath := strings.TrimPrefix(imageURL, "/images/")
	fullPath := filepath.Join(s.BaseDir, relativePath)

	if err := os.Remove(fullPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete file: %w", err)
	}
	return nil
}

// ========== БАННЕРЫ ==========

// SaveBannerImage сохраняет изображение баннера как WebP
func (s *ImageService) SaveBannerImage(file *multipart.FileHeader) (string, error) {
	if err := s.validateFile(file); err != nil {
		return "", err
	}

	filename := fmt.Sprintf("banner_%d.webp", time.Now().UnixNano())
	relativePath := "banners"
	fullPath := filepath.Join(s.BaseDir, relativePath, filename)

	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return "", err
	}

	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	img, _, err := image.Decode(src)
	if err != nil {
		return "", err
	}

	if err := s.saveWebP(img, fullPath); err != nil {
		return "", err
	}

	return filepath.Join(relativePath, filename), nil
}

// ========== ВАЛИДАЦИЯ ==========

func (s *ImageService) validateFile(file *multipart.FileHeader) error {
	if file.Size > s.maxSize {
		return fmt.Errorf("file too large: max %d MB", s.maxSize/(1024*1024))
	}

	contentType := file.Header.Get("Content-Type")
	if !s.allowedTypes[contentType] {
		return fmt.Errorf("invalid file type: allowed %v", s.getAllowedTypesList())
	}

	openedFile, err := file.Open()
	if err != nil {
		return err
	}
	defer openedFile.Close()

	_, format, err := image.DecodeConfig(openedFile)
	if err != nil {
		return errors.New("invalid image file")
	}

	allowedFormats := map[string]bool{"jpeg": true, "jpg": true, "png": true, "webp": true}
	if !allowedFormats[format] {
		return fmt.Errorf("unsupported image format: %s", format)
	}

	return nil
}

func (s *ImageService) saveUploadedFile(file *multipart.FileHeader, dst string) error {
	src, err := file.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, src)
	return err
}

func (s *ImageService) getAllowedTypesList() []string {
	types := make([]string, 0, len(s.allowedTypes))
	for t := range s.allowedTypes {
		types = append(types, t)
	}
	return types
}

func sanitizeFilename(filename string) string {
	ext := filepath.Ext(filename)
	name := strings.TrimSuffix(filename, ext)
	re := regexp.MustCompile(`[^a-zA-Z0-9\-_]`)
	cleanName := re.ReplaceAllString(name, "_")
	return cleanName
}
