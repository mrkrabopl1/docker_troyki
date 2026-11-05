// service/font_service.go
package services

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// FontService — сохранение и удаление файлов шрифтов.
// BaseDir = FONT_BASE_DIR (сама папка шрифтов, напр. /app/front/fonts).
// BasePath = FONT_BASE_PATH (URL-префикс, напр. /fonts).
type FontService struct {
	BaseDir  string // /app/front/fonts — сама папка
	BasePath string // /fonts — публичный URL-префикс
	MaxSize  int64  // байт
}

func NewFontService(baseDir, basePath string) *FontService {
	return &FontService{
		BaseDir:  baseDir,
		BasePath: basePath,
		MaxSize:  200 * 1024, // 200 KB на файл
	}
}

// SaveFont сохраняет .woff как есть.
// Возвращает относительный путь (имя файла): "<slug>-<weight>_<ts>.woff"
// Полный путь = BaseDir/<relativePath>.
func (s *FontService) SaveFont(slug string, weight int, file *multipart.FileHeader) (string, error) {
	// 1. расширение — только .woff
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".woff" {
		return "", fmt.Errorf("font must be .woff")
	}

	// 2. размер
	if file.Size > s.MaxSize {
		return "", fmt.Errorf("font too large: max %d KB", s.MaxSize/1024)
	}

	// 3. MIME (грубая проверка, magic bytes ниже)
	ct := file.Header.Get("Content-Type")
	if ct != "font/woff" && ct != "application/font-woff" && ct != "application/octet-stream" {
		return "", fmt.Errorf("invalid font content-type: %s", ct)
	}

	// 4. magic bytes: wOFF
	f, err := file.Open()
	if err != nil {
		return "", err
	}
	defer f.Close()

	head := make([]byte, 4)
	if _, err := io.ReadFull(f, head); err != nil {
		return "", fmt.Errorf("cannot read font header")
	}
	if string(head) != "wOFF" {
		return "", fmt.Errorf("file is not a valid woff")
	}

	// 5. сохраняем
	if _, err := f.Seek(0, io.SeekStart); err != nil {
		return "", err
	}

	filename := fmt.Sprintf("%s-%d_%d.woff", sanitizeSlug(slug), weight, time.Now().UnixNano())
	fullPath := filepath.Join(s.BaseDir, filename) // 👈 без "fonts/", BaseDir уже = папка шрифтов

	if err := os.MkdirAll(s.BaseDir, 0755); err != nil {
		return "", fmt.Errorf("не удалось создать папку: %w", err)
	}

	out, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	defer out.Close()

	if _, err := io.Copy(out, f); err != nil {
		return "", err
	}

	return filename, nil // 👈 относительный путь = имя файла
}

// DeleteFont удаляет файл по относительному пути (имя файла)
func (s *FontService) DeleteFont(relativePath string) error {
	if relativePath == "" {
		return nil
	}
	fullPath := filepath.Join(s.BaseDir, relativePath)
	if err := os.Remove(fullPath); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

// BuildURL собирает публичный URL из относительного пути (имени файла).
// relativePath = "pt_mono-400_123.woff", BasePath = "/fonts"
// → "/fonts/pt_mono-400_123.woff"
func (s *FontService) BuildURL(relativePath string) string {
	if relativePath == "" {
		return ""
	}
	return strings.TrimRight(s.BasePath, "/") + "/" + strings.TrimLeft(relativePath, "/")
}

func sanitizeSlug(s string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(s) {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			b.WriteRune(r)
		} else {
			b.WriteRune('_')
		}
	}
	return b.String()
}
