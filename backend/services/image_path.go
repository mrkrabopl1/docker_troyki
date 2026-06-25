package services

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
)

type StructuredPathParams struct {
	ID       int32
	Firm     string
	Category string
	Type     string
	Name     string
	Article  string
}

type ImagePathBuilder struct {
	basePath  string
	imagesDir string
	useCDN    bool
}

func NewImagePathBuilder(basePath string, useCDN bool, imagesDir string) *ImagePathBuilder {
	return &ImagePathBuilder{
		basePath:  basePath,
		useCDN:    useCDN,
		imagesDir: imagesDir,
	}
}

func (b *ImagePathBuilder) SetImagesDir(dir string) *ImagePathBuilder {
	b.imagesDir = dir
	return b
}

// ========== URL ДЛЯ ИЗОБРАЖЕНИЙ ==========

// GetProductImageURL возвращает URL для WebP изображения
func (b *ImagePathBuilder) GetProductImageURL(imagePath string, imageNumber int) string {
	relativePath := filepath.Join(imagePath, fmt.Sprintf("img%d.webp", imageNumber))
	return b.buildURL(relativePath)
}

// GetProductThumbURL возвращает URL для миниатюры
func (b *ImagePathBuilder) GetProductThumbURL(imagePath string, imageNumber int) string {
	relativePath := filepath.Join(imagePath, fmt.Sprintf("img%d_thumb.webp", imageNumber))
	return b.buildURL(relativePath)
}

// GetProductMainImage возвращает URL главного изображения
func (b *ImagePathBuilder) GetProductMainImage(imagePath string) string {
	return b.GetProductImageURL(imagePath, 1)
}

// GetProductMainThumb возвращает URL главной миниатюры
func (b *ImagePathBuilder) GetProductMainThumb(imagePath string) string {
	return b.GetProductThumbURL(imagePath, 1)
}

// GetProductImages возвращает массив URL изображений
func (b *ImagePathBuilder) GetProductImages(imagePath string, count int) []string {
	images := make([]string, 0, count)
	for i := 1; i <= count; i++ {
		images = append(images, b.GetProductImageURL(imagePath, i))
	}
	return images
}

// GetProductThumbs возвращает массив URL миниатюр
func (b *ImagePathBuilder) GetProductThumbs(imagePath string, count int) []string {
	thumbs := make([]string, 0, count)
	for i := 1; i <= count; i++ {
		thumbs = append(thumbs, b.GetProductThumbURL(imagePath, i))
	}
	return thumbs
}

// GetBrandImageURL возвращает URL логотипа бренда
func (b *ImagePathBuilder) GetBrandImageURL(brandName string) string {
	relativePath := filepath.Join("brandLogo", brandName, "image.webp")
	return b.buildURL(relativePath)
}

// ========== СТРУКТУРИРОВАННЫЕ ПУТИ ==========

func (b *ImagePathBuilder) BuildStructuredPath(params StructuredPathParams) string {
	firm := b.normalize(params.Firm, 30)
	category := b.normalize(params.Category, 30)
	productType := b.normalize(params.Type, 30)
	folderName := b.generateFolderName(params)

	return filepath.Join(firm, category, productType, folderName)
}

func (b *ImagePathBuilder) GetStructuredProductImageURL(params StructuredPathParams, imageNumber int) string {
	imagePath := b.BuildStructuredPath(params)
	return b.GetProductImageURL(imagePath, imageNumber)
}

func (b *ImagePathBuilder) GetStructuredProductThumbURL(params StructuredPathParams, imageNumber int) string {
	imagePath := b.BuildStructuredPath(params)
	return b.GetProductThumbURL(imagePath, imageNumber)
}

// ========== ФИЗИЧЕСКИЕ ПУТИ ==========

func (b *ImagePathBuilder) GetPhysicalPath(relativePath string) string {
	imagesDir := b.imagesDir
	if imagesDir == "" {
		execPath, _ := os.Executable()
		execDir := filepath.Dir(execPath)
		imagesDir = filepath.Join(execDir, "..", "..", "front", "images")
	}

	imagesDir = strings.ReplaceAll(imagesDir, "\\", "/")
	relativePath = strings.ReplaceAll(relativePath, "\\", "/")

	return path.Join(imagesDir, relativePath)
}

func (b *ImagePathBuilder) GetPhysicalProductPath(params StructuredPathParams) string {
	relativePath := b.BuildStructuredPath(params)
	return b.GetPhysicalPath(relativePath)
}

// ========== ПОДСЧЕТ ФАЙЛОВ ==========

// CountExistingProductImages считает количество WebP оригиналов (не _thumb)
func (b *ImagePathBuilder) CountExistingProductImages(relativePath string) int32 {
	physicalPath := b.GetPhysicalPath(relativePath)

	entries, err := os.ReadDir(physicalPath)
	if err != nil {
		return 0
	}

	count := int32(0)
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := strings.ToLower(entry.Name())
		// Считаем только оригиналы WebP (img1.webp, img2.webp), исключая _thumb
		if strings.HasSuffix(name, ".webp") && !strings.Contains(name, "_thumb") {
			count++
		}
	}

	return count
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ==========

func (b *ImagePathBuilder) buildURL(relativePath string) string {
	return fmt.Sprintf("%s/%s", b.basePath, relativePath)
}

func (b *ImagePathBuilder) GetImageURLFromPath(relativePath string) string {
	return b.buildURL(relativePath)
}

func (b *ImagePathBuilder) ExtractRelativePath(url string) string {
	result := strings.TrimPrefix(url, b.basePath)
	result = strings.TrimPrefix(result, "/")
	return result
}

func (b *ImagePathBuilder) normalize(str string, maxLength int) string {
	if str == "" {
		return "unknown"
	}

	result := strings.ToLower(str)
	result = b.transliterate(result)

	reg := regexp.MustCompile(`[^a-z0-9]+`)
	result = reg.ReplaceAllString(result, "_")
	result = regexp.MustCompile(`_+`).ReplaceAllString(result, "_")
	result = strings.Trim(result, "_")

	if len(result) > maxLength {
		result = result[:maxLength]
	}

	if result == "" {
		return "unknown"
	}

	return result
}

func (b *ImagePathBuilder) transliterate(str string) string {
	translitMap := map[rune]string{
		'а': "a", 'б': "b", 'в': "v", 'г': "g", 'д': "d", 'е': "e", 'ё': "e",
		'ж': "zh", 'з': "z", 'и': "i", 'й': "y", 'к': "k", 'л': "l", 'м': "m",
		'н': "n", 'о': "o", 'п': "p", 'р': "r", 'с': "s", 'т': "t", 'у': "u",
		'ф': "f", 'х': "h", 'ц': "ts", 'ч': "ch", 'ш': "sh", 'щ': "sch", 'ъ': "",
		'ы': "y", 'ь': "", 'э': "e", 'ю': "yu", 'я': "ya",
	}

	result := ""
	for _, ch := range str {
		if converted, ok := translitMap[ch]; ok {
			result += converted
		} else {
			result += string(ch)
		}
	}
	return result
}

func (b *ImagePathBuilder) generateFolderName(params StructuredPathParams) string {
	if params.Article != "" {
		name := b.normalize(params.Article, 30)
		if name != "" && name != "unknown" {
			return name
		}
	}

	if params.Name != "" {
		name := b.normalize(params.Name, 25)
		if name != "" && name != "unknown" {
			hash := b.shortHash(params.Name)
			return fmt.Sprintf("%s_%s", name, hash)
		}
	}

	hash := b.shortHash(fmt.Sprintf("%d_%s", params.ID, params.Name))
	return fmt.Sprintf("product_%s", hash)
}

func (b *ImagePathBuilder) shortHash(str string) string {
	hash := md5.Sum([]byte(str))
	return hex.EncodeToString(hash[:])[:6]
}
