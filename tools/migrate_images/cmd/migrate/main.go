// cmd/migrate/main.go
package main

import "github.com/mrkrabopl1/migrate_images/internal/imaging"

func main() {
	migrator := imaging.NewMigrator("/mnt/d/troyki/docker_troyki/front/images/products")

	// Шаг 1: Конвертация (без удаления PNG)
	migrator.Migrate()

	// Шаг 2: Проверяем что всё ок

	// Шаг 3: Смотрим что будет удалено
	migrator.RemovePNGFiles(false) // dryRun

	// Шаг 4: Только когда уверены - удаляем
	// migrator.RemovePNGFiles(false)
}
