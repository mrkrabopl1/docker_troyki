package imaging

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

type Migrator struct {
	baseDir   string
	processor *ImageProcessor
	workers   int
}

type MigrateStats struct {
	Total      int64
	Converted  int64
	Skipped    int64
	Failed     int64
	SavedBytes int64
	Errors     []string
	mu         sync.Mutex
	StartTime  time.Time
}

func NewMigrator(baseDir string) *Migrator {
	return &Migrator{
		baseDir:   baseDir,
		processor: NewImageProcessor(),
		workers:   4,
	}
}

func (m *Migrator) Migrate() {
	stats := &MigrateStats{StartTime: time.Now()}

	fmt.Println("🔍 Обходим папки и обрабатываем PNG файлы...")
	fmt.Printf("⚙️  Запускаем %d воркеров...\n\n", m.workers)

	jobs := make(chan string, 1000)

	var wg sync.WaitGroup
	for i := 0; i < m.workers; i++ {
		wg.Add(1)
		go m.worker(jobs, &wg, stats)
	}

	done := make(chan struct{})
	go m.showProgress(stats, done)

	filepath.Walk(m.baseDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}
		if strings.HasSuffix(strings.ToLower(info.Name()), ".png") {
			atomic.AddInt64(&stats.Total, 1)
			jobs <- path
		}
		return nil
	})

	close(jobs)
	wg.Wait()
	close(done)

	elapsed := time.Since(stats.StartTime)
	fmt.Println("\n" + strings.Repeat("=", 55))
	fmt.Println("✅ МИГРАЦИЯ ЗАВЕРШЕНА")
	fmt.Printf("   Всего файлов:     %d\n", stats.Total)
	fmt.Printf("   Конвертировано:   %d\n", stats.Converted)
	fmt.Printf("   Пропущено:        %d\n", stats.Skipped)
	fmt.Printf("   Ошибок:           %d\n", stats.Failed)
	fmt.Printf("   Сэкономлено:      %.2f MB\n", float64(stats.SavedBytes)/1024/1024)
	fmt.Printf("   Время:            %v\n", elapsed.Round(time.Second))

	if len(stats.Errors) > 0 {
		fmt.Printf("\n❌ Ошибки (%d):\n", len(stats.Errors))
		for _, e := range stats.Errors {
			fmt.Printf("   - %s\n", e)
		}
	}

	fmt.Println("\n💡 PNG файлы НЕ удалены. Для удаления вызовите RemovePNGFiles()")
}

func (m *Migrator) worker(jobs <-chan string, wg *sync.WaitGroup, stats *MigrateStats) {
	defer wg.Done()
	for pngPath := range jobs {
		err := m.convertOne(pngPath, stats)
		if err != nil {
			stats.mu.Lock()
			stats.Errors = append(stats.Errors, err.Error())
			stats.mu.Unlock()
		}
	}
}

func (m *Migrator) convertOne(pngPath string, stats *MigrateStats) error {
	// Получаем базовое имя файла без расширения
	baseName := strings.TrimSuffix(filepath.Base(pngPath), ".png")
	dstDir := filepath.Dir(pngPath)

	webpPath := filepath.Join(dstDir, baseName+".webp")

	// Уже есть WebP
	if _, err := os.Stat(webpPath); err == nil {
		atomic.AddInt64(&stats.Skipped, 1)
		return nil
	}

	// Размер PNG
	pngInfo, _ := os.Stat(pngPath)
	pngSize := int64(0)
	if pngInfo != nil {
		pngSize = pngInfo.Size()
	}

	// Конвертируем через общий Processor
	result, err := m.processor.Convert(pngPath)
	if err != nil {
		atomic.AddInt64(&stats.Failed, 1)
		return fmt.Errorf("%s: %w", pngPath, err)
	}

	// Сохраняем с правильными именами
	origSize, thumbSize, err := m.processor.SavePairWithName(result.Image, result.Thumb, dstDir, baseName)
	if err != nil {
		atomic.AddInt64(&stats.Failed, 1)
		return fmt.Errorf("%s: %w", pngPath, err)
	}

	saved := pngSize - origSize - thumbSize
	atomic.AddInt64(&stats.SavedBytes, saved)
	atomic.AddInt64(&stats.Converted, 1)
	return nil
}

func (m *Migrator) showProgress(stats *MigrateStats, done chan struct{}) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-done:
			return
		case <-ticker.C:
			total := atomic.LoadInt64(&stats.Total)
			converted := atomic.LoadInt64(&stats.Converted)
			skipped := atomic.LoadInt64(&stats.Skipped)
			failed := atomic.LoadInt64(&stats.Failed)
			processed := converted + skipped + failed
			percent := float64(0)
			if total > 0 {
				percent = float64(processed) / float64(total) * 100
			}
			saved := atomic.LoadInt64(&stats.SavedBytes)
			fmt.Printf("\r⚡ Прогресс: %.1f%% | %d/%d | ✅ %d | ⏭️ %d | ❌ %d | Экономия: %.2f MB",
				percent, processed, total, converted, skipped, failed, float64(saved)/1024/1024)
		}
	}
}

// RemovePNGFiles удаляет PNG файлы, у которых есть WebP копия
func (m *Migrator) RemovePNGFiles(dryRun bool) error {
	var deleted int
	var total int

	err := filepath.Walk(m.baseDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if info.IsDir() {
			return nil
		}
		if !strings.HasSuffix(strings.ToLower(info.Name()), ".png") {
			return nil
		}

		baseName := strings.TrimSuffix(info.Name(), ".png")
		dir := filepath.Dir(path)

		webpPath := filepath.Join(dir, baseName+".webp")
		thumbPath := filepath.Join(dir, baseName+"_thumb.webp")

		_, webpExists := os.Stat(webpPath)
		_, thumbExists := os.Stat(thumbPath)

		if webpExists == nil && thumbExists == nil {
			total++
			if dryRun {
				fmt.Printf("💡 Будет удален: %s\n", path)
			} else {
				if err := os.Remove(path); err != nil {
					return fmt.Errorf("ошибка удаления %s: %w", path, err)
				}
				deleted++
			}
		}

		return nil
	})

	if err != nil {
		return err
	}

	if dryRun {
		fmt.Printf("\n💡 DRY RUN: будет удалено %d PNG файлов\n", total)
		fmt.Println("   Запустите RemovePNGFiles(false) для реального удаления")
	} else {
		fmt.Printf("\n🗑️  Удалено %d PNG файлов\n", deleted)
	}

	return nil
}
