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
)

// ImageService объединяет работу с файлами и построение путей
type ImageService struct {
	*ImagePathBuilder
	BaseDir      string // физическая папка на диске, например "front/images"
	maxSize      int64  // максимальный размер файла в байтах
	allowedTypes map[string]bool
}

// NewImageService создает новый сервис для работы с изображениями
func NewImageService(baseDir string, baseURL string, useCDN bool, maxSizeMB int64) *ImageService {
	return &ImageService{
		ImagePathBuilder: NewImagePathBuilder(baseURL, useCDN, baseDir),
		BaseDir:          baseDir,
		maxSize:          maxSizeMB * 1024 * 1024,
		allowedTypes: map[string]bool{
			"image/jpeg": true,
			"image/jpg":  true,
			"image/png":  true,
			"image/webp": true,
			"image/gif":  true,
		},
	}
}

// ========== РАБОТА С ФАЙЛАМИ ==========
func sanitizeFilename(filename string) string {
	// Удаляем расширение
	ext := filepath.Ext(filename)
	name := strings.TrimSuffix(filename, ext)

	// Заменяем危险的 символы
	re := regexp.MustCompile(`[^a-zA-Z0-9\-_]`)
	cleanName := re.ReplaceAllString(name, "_")

	return cleanName
}
func (s *ImageService) SaveTempImage(sessionID string, file *multipart.FileHeader) (string, error) {
	// Проверяем тип файла
	if err := s.validateFile(file); err != nil {
		return "", err
	}

	// Генерируем уникальное имя файла
	timestamp := time.Now().Unix()
	ext := strings.ToLower(filepath.Ext(file.Filename))
	filename := fmt.Sprintf("%d_%s%s", timestamp, sanitizeFilename(file.Filename), ext)

	// Формируем путь: temp/products/sessionID/filename
	relativePath := filepath.Join("temp", sessionID)
	fullPath := filepath.Join(s.BaseDir, relativePath, filename)
	fmt.Println(fullPath, "fullPath in SaveTempImage")

	// Создаем директорию если не существует
	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return "", fmt.Errorf("failed to create temp directory: %w", err)
	}

	// Сохраняем файл
	if err := s.saveUploadedFile(file, fullPath); err != nil {
		return "", fmt.Errorf("failed to save temp file: %w", err)
	}

	// Возвращаем URL
	return relativePath, nil
}

// SaveProductImage сохраняет изображение товара и возвращает URL
func (s *ImageService) SaveProductImage(productID int32, file *multipart.FileHeader, imageNumber int) (string, error) {
	// Проверяем тип файла
	if err := s.validateFile(file); err != nil {
		return "", err
	}

	// Генерируем имя файла
	ext := strings.ToLower(filepath.Ext(file.Filename))
	filename := fmt.Sprintf("%d_img%d%s", productID, imageNumber, ext)

	// Формируем путь: products/productID/filename
	relativePath := filepath.Join("products", fmt.Sprintf("%d", productID))
	fullPath := filepath.Join(s.BaseDir, relativePath, filename)

	// Создаем директорию если не существует
	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return "", fmt.Errorf("failed to create directory: %w", err)
	}

	// Сохраняем оригинальный файл
	if err := s.saveUploadedFile(file, fullPath); err != nil {
		return "", fmt.Errorf("failed to save file: %w", err)
	}

	// Опционально: создаем WebP версию для оптимизации
	go s.createWebPVersion(fullPath)

	// Возвращаем URL через билдер
	return s.GetProductImagePath(filepath.Join(relativePath, filename), imageNumber), nil
}

// SaveProductImages сохраняет несколько изображений товара
func (s *ImageService) SaveProductImages(productID int32, files []*multipart.FileHeader) ([]string, error) {
	var urls []string
	for i, file := range files {
		url, err := s.SaveProductImage(productID, file, i+1)
		if err != nil {
			// Если одно изображение не сохранилось, удаляем уже сохраненные
			s.DeleteProductImages(productID, urls)
			return nil, fmt.Errorf("failed to save image %d: %w", i+1, err)
		}
		urls = append(urls, url)
	}
	return urls, nil
}

// SaveBannerImage сохраняет изображение баннера
func (s *ImageService) SaveBannerImage(file *multipart.FileHeader) (string, error) {
	if err := s.validateFile(file); err != nil {
		return "", err
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	filename := fmt.Sprintf("banner_%d%s", time.Now().UnixNano(), ext)

	relativePath := "banners"
	fullPath := filepath.Join(s.BaseDir, relativePath, filename)
	fmt.Println(fullPath, "fullPath in SaveBannerImage")

	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return "", err
	}

	if err := s.saveUploadedFile(file, fullPath); err != nil {
		return "", err
	}

	// Возвращаем путь для сохранения в БД
	return filepath.Join(relativePath, filename), nil
}

// DeleteProductImage удаляет конкретное изображение товара
func (s *ImageService) DeleteProductImage(imageURL string) error {
	// Из URL получаем физический путь
	relativePath := strings.TrimPrefix(imageURL, s.basePath)
	relativePath = strings.TrimPrefix(relativePath, "/")

	fullPath := filepath.Join(s.BaseDir, relativePath)
	fmt.Println(fullPath, "fffffffffffffffffffffffffffffffffffff")

	// Удаляем файл
	if err := os.Remove(fullPath); err != nil && !os.IsNotExist(err) {
		fmt.Println("aaaaaaaaaaaaaaaaaaaaaaaaaa")
		return fmt.Errorf("failed to delete file: %w", err)
	}

	// Удаляем WebP версию если есть
	webpPath := strings.TrimSuffix(fullPath, filepath.Ext(fullPath)) + ".webp"
	os.Remove(webpPath)

	return nil
}

// DeleteProductImages удаляет все изображения товара
func (s *ImageService) DeleteProductImages(productID int32, imageURLs []string) error {
	for _, url := range imageURLs {
		if err := s.DeleteProductImage(url); err != nil {
			// Логируем ошибку, но продолжаем удалять остальные
			fmt.Printf("Failed to delete image %s: %v\n", url, err)
		}
	}

	// Удаляем папку товара если она пуста
	productDir := filepath.Join(s.BaseDir, "products", fmt.Sprintf("%d", productID))
	os.Remove(productDir) // Remove удаляет только пустую директорию

	return nil
}

// ========== ОПТИМИЗАЦИЯ ИЗОБРАЖЕНИЙ ==========

// createWebPVersion создает WebP версию изображения для оптимизации
func (s *ImageService) createWebPVersion(imagePath string) {
	// Открываем оригинал
	src, err := imaging.Open(imagePath)
	if err != nil {
		return
	}

	// Создаем WebP версию
	webpPath := strings.TrimSuffix(imagePath, filepath.Ext(imagePath)) + ".webp"

	// Сохраняем как WebP (качество 80%)
	if err := imaging.Save(src, webpPath, imaging.JPEGQuality(80)); err != nil {
		fmt.Printf("Failed to create WebP version: %v\n", err)
	}
}

// ResizeImage изменяет размер изображения
func (s *ImageService) ResizeImage(inputPath string, outputPath string, width, height int) error {
	src, err := imaging.Open(inputPath)
	if err != nil {
		return err
	}

	dst := imaging.Resize(src, width, height, imaging.Lanczos)
	return imaging.Save(dst, outputPath)
}

// GenerateThumbnails генерирует миниатюры для товара
func (s *ImageService) GenerateThumbnails(productID int32, imagePath string) error {
	fullPath := filepath.Join(s.BaseDir, imagePath)

	// Маленькая миниатюра (100x100)
	thumbPath := strings.TrimSuffix(fullPath, filepath.Ext(fullPath)) + "_thumb.jpg"
	if err := s.ResizeImage(fullPath, thumbPath, 100, 100); err != nil {
		return err
	}

	// Средняя миниатюра (300x300)
	mediumPath := strings.TrimSuffix(fullPath, filepath.Ext(fullPath)) + "_medium.jpg"
	if err := s.ResizeImage(fullPath, mediumPath, 300, 300); err != nil {
		return err
	}

	return nil
}

// ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

// validateFile проверяет файл на допустимые типы и размер
func (s *ImageService) validateFile(file *multipart.FileHeader) error {
	// Проверяем размер
	if file.Size > s.maxSize {
		return fmt.Errorf("file too large: max %d MB", s.maxSize/(1024*1024))
	}

	// Проверяем тип
	contentType := file.Header.Get("Content-Type")
	if !s.allowedTypes[contentType] {
		return fmt.Errorf("invalid file type: allowed %v", s.getAllowedTypesList())
	}

	// Проверяем что это реально изображение (читаем первые байты)
	openedFile, err := file.Open()
	if err != nil {
		return err
	}
	defer openedFile.Close()

	// Пробуем декодировать изображение
	_, format, err := image.DecodeConfig(openedFile)
	if err != nil {
		return errors.New("invalid image file")
	}

	// Проверяем формат
	allowedFormats := map[string]bool{"jpeg": true, "jpg": true, "png": true, "gif": true, "webp": true}
	if !allowedFormats[format] {
		return fmt.Errorf("unsupported image format: %s", format)
	}

	return nil
}

// saveUploadedFile сохраняет загруженный файл
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

// getAllowedTypesList возвращает список разрешенных типов
func (s *ImageService) getAllowedTypesList() []string {
	types := make([]string, 0, len(s.allowedTypes))
	for t := range s.allowedTypes {
		types = append(types, t)
	}
	return types
}

// ========== МЕТОДЫ ДЛЯ РАБОТЫ С URL ==========

// GetProductImageURL возвращает URL для изображения товара
func (s *ImageService) GetProductImageURL(productID int32, imageNumber int) string {
	relativePath := filepath.Join("products", fmt.Sprintf("%d", productID))
	return s.GetProductImagePath(relativePath, imageNumber)
}
func (s *ImageService) GetBrandImageURL(slug string) string {

	return s.GetBrandImagePath(slug)
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

// GetProductMainImageURL возвращает URL главного изображения
// func (s *ImageService) GetProductMainImage(productID int32) string {
// 	relativePath := filepath.Join("products", fmt.Sprintf("%d", productID))
// 	return s.builder.GetProductMainImage(relativePath)
// }

// // GetProductImagesURLs возвращает URL всех изображений товара
// func (s *ImageService) GetProductImagesURLs(productID int32, count int) []string {
// 	relativePath := filepath.Join("products", fmt.Sprintf("%d", productID))
// 	return s.builder.GetProductImages(relativePath, count)
// }

// // ParseImageURL извлекает из URL productID и номер изображения
// func (s *ImageService) ParseImageURL(url string) (productID int32, imageNumber int, err error) {
// 	// URL: /images/products/123/img1.png
// 	parts := strings.Split(url, "/")
// 	if len(parts) < 4 {
// 		return 0, 0, errors.New("invalid image URL")
// 	}

// 	// Извлекаем productID
// 	fmt.Sscanf(parts[3], "%d", &productID)

// 	// Извлекаем номер изображения из img1.png
// 	filename := parts[4]
// 	fmt.Sscanf(filename, "img%d", &imageNumber)

// 	return productID, imageNumber, nil
// }
