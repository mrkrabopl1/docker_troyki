package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/gosimple/slug"
)

func main() {
	dirPath := "/mnt/d/troyki/docker_troyki/front/images/brandLogos"

	files, err := os.ReadDir(dirPath)
	if err != nil {
		fmt.Printf("Ошибка: %v\n", err)
		return
	}

	// Собираем все существующие имена (в нижнем регистре)
	existing := make(map[string]string)
	for _, f := range files {
		if f.IsDir() {
			existing[strings.ToLower(f.Name())] = f.Name()
		}
	}

	for _, f := range files {
		if !f.IsDir() {
			continue
		}

		oldName := f.Name()
		oldPath := filepath.Join(dirPath, oldName)

		// Пропускаем пустые имена
		if strings.TrimSpace(oldName) == "" {
			fmt.Printf("Пропуск: пустое имя '%s'\n", oldName)
			continue
		}

		// Генерируем slug-имя
		newName := slug.Make(oldName)
		if newName == "" {
			fmt.Printf("Пропуск: slug вернул пустоту для '%s'\n", oldName)
			continue
		}

		newPath := filepath.Join(dirPath, newName)

		// Если путь совпадает - пропускаем
		if oldPath == newPath {
			continue
		}

		// Проверяем коллизию (регистронезависимо)
		if existingName, exists := existing[strings.ToLower(newName)]; exists {
			// Если это та же папка (игнорируем регистр)
			if strings.EqualFold(existingName, oldName) {
				// Это та же папка, но нужно переименовать в нижний регистр
				// Переименовываем во временное имя, потом обратно
				tempName := newName + "_temp_" + oldName
				tempPath := filepath.Join(dirPath, tempName)

				fmt.Printf("Временное переименование: %s -> %s\n", oldName, tempName)
				if err := os.Rename(oldPath, tempPath); err != nil {
					fmt.Printf("Ошибка: %v\n", err)
					continue
				}

				// Обновляем карту
				delete(existing, strings.ToLower(oldName))
				existing[strings.ToLower(tempName)] = tempName

				// Переименовываем в нужное имя
				fmt.Printf("Финальное переименование: %s -> %s\n", tempName, newName)
				if err := os.Rename(tempPath, newPath); err != nil {
					fmt.Printf("Ошибка: %v\n", err)
					continue
				}

				delete(existing, strings.ToLower(tempName))
				existing[strings.ToLower(newName)] = newName
				fmt.Printf("Переименована: %s -> %s\n", oldName, newName)
				continue
			}

			// Это другая папка - коллизия
			fmt.Printf("Пропуск: %s -> %s (уже существует как %s)\n", oldName, newName, existingName)
			continue
		}

		// Переименовываем
		fmt.Printf("Переименование: %s -> %s\n", oldName, newName)
		if err := os.Rename(oldPath, newPath); err != nil {
			fmt.Printf("Ошибка: %v\n", err)
		} else {
			delete(existing, strings.ToLower(oldName))
			existing[strings.ToLower(newName)] = newName
			fmt.Printf("Переименована: %s -> %s\n", oldName, newName)
		}
	}

	fmt.Println("Готово!")
}
