// internal/imaging/processor.go
package imaging

import (
	"fmt"
	"image"
	"os"
	"path/filepath"

	"github.com/disintegration/imaging"
	"github.com/kolesa-team/go-webp/encoder"
	"github.com/kolesa-team/go-webp/webp"
)

type ImageProcessor struct {
	MaxWidth   int
	ThumbWidth int
	Quality    float32
}

func NewImageProcessor() *ImageProcessor {
	return &ImageProcessor{
		MaxWidth:   2000,
		ThumbWidth: 200,
		Quality:    80,
	}
}

// ConvertResult результат конвертации
type ConvertResult struct {
	Image     image.Image
	Thumb     image.Image
	OrigSize  int64
	ThumbSize int64
	Width     int
	Height    int
}

// Convert открывает, ресайзит и возвращает image.Image (без сохранения на диск)
func (p *ImageProcessor) Convert(srcPath string) (*ConvertResult, error) {
	// Открываем
	img, err := imaging.Open(srcPath)
	if err != nil {
		return nil, fmt.Errorf("не удалось открыть: %w", err)
	}

	// Ресайз если больше MaxWidth
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	if width > p.MaxWidth || height > p.MaxWidth {
		img = imaging.Fit(img, p.MaxWidth, p.MaxWidth, imaging.Lanczos)
		bounds = img.Bounds()
		width = bounds.Dx()
		height = bounds.Dy()
	}

	// Thumb
	thumb := imaging.Fit(img, p.ThumbWidth, p.ThumbWidth, imaging.Lanczos)

	return &ConvertResult{
		Image:  img,
		Thumb:  thumb,
		Width:  width,
		Height: height,
	}, nil
}

// SaveWebP сохраняет image.Image в WebP файл
func (p *ImageProcessor) SaveWebP(img image.Image, dstPath string) (int64, error) {
	options, err := encoder.NewLossyEncoderOptions(encoder.PresetDefault, p.Quality)
	if err != nil {
		return 0, fmt.Errorf("ошибка энкодера: %w", err)
	}

	file, err := os.Create(dstPath)
	if err != nil {
		return 0, fmt.Errorf("не удалось создать файл: %w", err)
	}
	defer file.Close()

	if err := webp.Encode(file, img, options); err != nil {
		return 0, fmt.Errorf("ошибка кодирования: %w", err)
	}

	info, _ := os.Stat(dstPath)
	if info != nil {
		return info.Size(), nil
	}
	return 0, nil
}

// SavePair сохраняет оригинал + thumb в указанную папку
func (p *ImageProcessor) SavePair(img image.Image, thumb image.Image, dstDir string, imageNumber int) (origSize, thumbSize int64, err error) {
	if err := os.MkdirAll(dstDir, 0755); err != nil {
		return 0, 0, fmt.Errorf("не удалось создать папку: %w", err)
	}

	origPath := filepath.Join(dstDir, fmt.Sprintf("img%d.webp", imageNumber))
	thumbPath := filepath.Join(dstDir, fmt.Sprintf("img%d_thumb.webp", imageNumber))

	origSize, err = p.SaveWebP(img, origPath)
	if err != nil {
		return 0, 0, err
	}

	thumbSize, err = p.SaveWebP(thumb, thumbPath)
	if err != nil {
		return 0, 0, err
	}

	return origSize, thumbSize, nil
}

// SavePairWithName сохраняет изображение и его тамбнейл с указанным базовым именем
func (p *ImageProcessor) SavePairWithName(img image.Image, thumb image.Image, dstDir string, baseName string) (origSize, thumbSize int64, err error) {
	if err := os.MkdirAll(dstDir, 0755); err != nil {
		return 0, 0, fmt.Errorf("не удалось создать папку: %w", err)
	}

	origPath := filepath.Join(dstDir, baseName+".webp")
	thumbPath := filepath.Join(dstDir, baseName+"_thumb.webp")

	origSize, err = p.SaveWebP(img, origPath)
	if err != nil {
		return 0, 0, err
	}

	thumbSize, err = p.SaveWebP(thumb, thumbPath)
	if err != nil {
		return 0, 0, err
	}

	return origSize, thumbSize, nil
}
