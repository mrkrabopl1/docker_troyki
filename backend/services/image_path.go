package services

import (
	"fmt"
	"path/filepath"
)

type ImagePathBuilder struct {
	basePath string
	useCDN   bool
}

func NewImagePathBuilder(basePath string, useCDN bool) *ImagePathBuilder {
	return &ImagePathBuilder{
		basePath: basePath,
		useCDN:   useCDN,
	}
}

// GetProductImageBasePath возвращает базовый путь к папке с изображениями
// Фронтенд сам добавит img1.png, img2.png и т.д.
func (b *ImagePathBuilder) GetProductImageBasePath(imagePath string) string {
	// Формируем путь: /images/brandLogos/apple/img
	relativePath := filepath.Join(imagePath, "img")

	if b.useCDN {
		return fmt.Sprintf("%s/%s", b.basePath, relativePath)
	}
	return fmt.Sprintf("%s/%s", b.basePath, relativePath)
}

// GetProductImagePath возвращает полный путь к конкретному изображению
// Используется когда нужно отдать конкретное изображение (например, для SEO)
func (b *ImagePathBuilder) GetProductImagePath(imagePath string, imageNumber int) string {
	relativePath := filepath.Join(imagePath, fmt.Sprintf("img%d.png", imageNumber))

	if b.useCDN {
		return fmt.Sprintf("%s/%s", b.basePath, relativePath)
	}
	return fmt.Sprintf("%s/%s", b.basePath, relativePath)
}

// GetProductMainImage возвращает путь к главному изображению
func (b *ImagePathBuilder) GetProductMainImage(imagePath string) string {
	fmt.Print(imagePath, "mkdfmksfmslkdmflksdmflskdfmsldkfm")
	return b.GetProductImagePath(imagePath, 1)
}

// GetProductImages возвращает массив из N изображений (если нужно отдать все сразу)
func (b *ImagePathBuilder) GetProductImages(imagePath string, count int) []string {
	images := make([]string, 0, count)
	for i := 1; i <= count; i++ {
		images = append(images, b.GetProductImagePath(imagePath, i))
	}
	return images
}
