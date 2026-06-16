// main.go
package main

import (
	"fmt"
	"os"

	"github.com/mrkrabopl1/migrate_images/internal/imaging"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Использование:")
		fmt.Println("  migrate <путь к папке с изображениями>")
		fmt.Println("  remove  <путь к папке> [--force]")
		os.Exit(1)
	}

	command := os.Args[1]

	switch command {
	case "migrate":
		dir := "."
		if len(os.Args) >= 3 {
			dir = os.Args[2]
		}
		migrator := imaging.NewMigrator(dir)
		migrator.Migrate()

	case "remove":
		if len(os.Args) < 3 {
			fmt.Println("Укажи папку: remove <путь> [--force]")
			os.Exit(1)
		}
		dir := os.Args[2]
		dryRun := true
		if len(os.Args) >= 4 && os.Args[3] == "--force" {
			dryRun = false
		}

		migrator := imaging.NewMigrator(dir)
		migrator.RemovePNGFiles(dryRun)

	default:
		fmt.Printf("Неизвестная команда: %s\n", command)
		os.Exit(1)
	}
}
