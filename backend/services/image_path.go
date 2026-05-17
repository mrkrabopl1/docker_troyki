package services

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"path/filepath"
	"regexp"
	"strings"
)

type StructuredPathParams struct {
	ID       int32  // ID товара (после создания в БД)
	Firm     string // Бренд (Nike, Adidas)
	Category string // Категория (sneakers, clothes)
	Type     string // Тип (running, training, hoodie)
	Name     string // Название товара (Air Max 90)
	Article  string // Артикул (уникальный идентификатор)
}
type ImagePathBuilder struct {
	basePath  string // базовый URL путь: "/images" или "https://cdn.site.com"
	imagesDir string // физическая директория: "front/images"
	useCDN    bool
}

func NewImagePathBuilder(basePath string, useCDN bool, imagesDir string) *ImagePathBuilder {
	return &ImagePathBuilder{
		basePath:  basePath,
		useCDN:    useCDN,
		imagesDir: imagesDir,
	}
}

// SetImagesDir устанавливает физическую директорию для сохранения файлов
func (b *ImagePathBuilder) SetImagesDir(dir string) *ImagePathBuilder {
	b.imagesDir = dir
	return b
}

// ========== ОСНОВНЫЕ МЕТОДЫ ==========

// GetProductImageBasePath возвращает базовый путь к папке с изображениями
func (b *ImagePathBuilder) GetProductImageBasePath(imagePath string) string {
	relativePath := filepath.Join(imagePath, "img")
	return b.buildURL(relativePath)
}

// GetProductImagePath возвращает полный путь к конкретному изображению
func (b *ImagePathBuilder) GetProductImagePath(imagePath string, imageNumber int) string {
	relativePath := filepath.Join(imagePath, fmt.Sprintf("img%d.png", imageNumber))
	return b.buildURL(relativePath)
}
func (b *ImagePathBuilder) GetBrandImagePath(brandName string) string {
	relativePath := filepath.Join("brandLogo", brandName, "image.png")
	return b.buildURL(relativePath)
}

// GetProductMainImage возвращает путь к главному изображению
func (b *ImagePathBuilder) GetProductMainImage(imagePath string) string {
	return b.GetProductImagePath(imagePath, 1)
}

// GetProductImages возвращает массив из N изображений
func (b *ImagePathBuilder) GetProductImages(imagePath string, count int) []string {
	images := make([]string, 0, count)
	for i := 1; i <= count; i++ {
		images = append(images, b.GetProductImagePath(imagePath, i))
	}
	return images
}

// ========== НОВЫЕ МЕТОДЫ ДЛЯ СТРУКТУРИРОВАННЫХ ПУТЕЙ ==========

// BuildStructuredPath строит структурированный путь для товара
// Пример: nike/sneakers/running/air_max_abc123

func (b *ImagePathBuilder) BuildStructuredPath(params StructuredPathParams) string {
	firm := b.normalize(params.Firm, 30)
	category := b.normalize(params.Category, 30)
	productType := b.normalize(params.Type, 30)

	// Уникальный идентификатор папки
	folderName := b.generateFolderName(params)

	return filepath.Join(firm, category, productType, folderName)
}

// GetStructuredProductImagePath возвращает путь к изображению в структурированной папке
func (b *ImagePathBuilder) GetStructuredProductImagePath(params StructuredPathParams, imageNumber int) string {
	imagePath := b.BuildStructuredPath(params)
	return b.GetProductImagePath(imagePath, imageNumber)
}

// GetPhysicalPath возвращает физический путь для сохранения файла
func (b *ImagePathBuilder) GetPhysicalPath(relativePath string) string {
	fmt.Println(b.imagesDir, "nnrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr")
	if b.imagesDir == "" {
		return relativePath
	}
	return filepath.Join(b.imagesDir, relativePath)
}

// GetPhysicalProductPath возвращает физический путь к папке товара
func (b *ImagePathBuilder) GetPhysicalProductPath(params StructuredPathParams) string {
	relativePath := b.BuildStructuredPath(params)
	return b.GetPhysicalPath(relativePath)
}

// ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

// buildURL строит URL с учетом CDN
func (b *ImagePathBuilder) buildURL(relativePath string) string {
	if b.useCDN {
		return fmt.Sprintf("%s/%s", b.basePath, relativePath)
	}
	return fmt.Sprintf("%s/%s", b.basePath, relativePath)
}

// normalize нормализует строку для использования в пути
func (b *ImagePathBuilder) normalize(str string, maxLength int) string {
	if str == "" {
		return "unknown"
	}

	// Приводим к нижнему регистру
	result := strings.ToLower(str)

	// Транслитерация русских букв
	result = b.transliterate(result)

	// Заменяем все не буквенно-цифровые символы на _
	reg := regexp.MustCompile(`[^a-z0-9]+`)
	result = reg.ReplaceAllString(result, "_")

	// Убираем дублирующиеся _
	result = regexp.MustCompile(`_+`).ReplaceAllString(result, "_")

	// Убираем _ в начале и конце
	result = strings.Trim(result, "_")

	// Обрезаем до maxLength
	if len(result) > maxLength {
		result = result[:maxLength]
	}

	if result == "" {
		return "unknown"
	}

	return result
}

// transliterate переводит русские буквы в латиницу
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

// generateFolderName генерирует уникальное имя папки для товара
func (b *ImagePathBuilder) generateFolderName(params StructuredPathParams) string {
	// Приоритет: артикул -> имя -> хеш
	if params.Article != "" {
		name := b.normalize(params.Article, 30)
		if name != "" && name != "unknown" {
			return name
		}
	}

	if params.Name != "" {
		name := b.normalize(params.Name, 25)
		if name != "" && name != "unknown" {
			// Добавляем короткий хеш для уникальности
			hash := b.shortHash(params.Name)
			return fmt.Sprintf("%s_%s", name, hash)
		}
	}

	// Если ничего нет, генерируем по времени
	hash := b.shortHash(fmt.Sprintf("%d_%s", params.ID, params.Name))
	return fmt.Sprintf("product_%s", hash)
}

// shortHash создает короткий хеш (6 символов)
func (b *ImagePathBuilder) shortHash(str string) string {
	hash := md5.Sum([]byte(str))
	return hex.EncodeToString(hash[:])[:6]
}

// ========== МЕТОДЫ ДЛЯ РАБОТЫ С URL ==========

// GetImageURLFromPath возвращает URL из относительного пути
func (b *ImagePathBuilder) GetImageURLFromPath(relativePath string) string {
	return b.buildURL(relativePath)
}

// ExtractRelativePath извлекает относительный путь из URL
func (b *ImagePathBuilder) ExtractRelativePath(url string) string {
	result := strings.TrimPrefix(url, b.basePath)
	result = strings.TrimPrefix(result, "/")
	return result
}
