// cmd/fonts-sync/main.go
//
// Синхронизация таблицы fonts с .woff-файлами в FONT_BASE_DIR.
//
// Запуск:
//
//	go run ./cmd/fonts-sync --dir /mnt/d/troyki/docker_troyki/front/fonts --dry-run
//	go run ./cmd/fonts-sync --dir /mnt/d/troyki/docker_troyki/front/fonts --host localhost --dry-run
//	FONT_BASE_DIR=/app/front/fonts go run ./cmd/fonts-sync
package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	_ "github.com/lib/pq"
)

// ---- конфиг БД (значения по умолчанию) ----
const (
	dbHost     = "postgres_db"
	dbPort     = "5432"
	dbUser     = "postgres"
	dbPassword = "s8121996"
	dbName     = "troyki"
)

// ============================================================
// ТИПЫ
// ============================================================

type diskFont struct {
	FilePath string
	RelPath  string
	Slug     string
	Weight   int
	Style    string
	Family   string
}

type dbFont struct {
	ID       int
	Family   string
	Slug     string
	Url      string
	Weight   int
	Style    string
	IsActive bool
}

// ============================================================
// ПАРСИНГ ИМЕНИ ФАЙЛА
// ============================================================

var trailingWeightRe = regexp.MustCompile(`[-_ ](\d{3})(?:_\d+)?$`)
var multiSpaceRe = regexp.MustCompile(`\s+`)

var weightWords = map[string]int{
	"thin":        100,
	"extralight":  200,
	"extra light": 200,
	"light":       300,
	"regular":     400,
	"normal":      400,
	"book":        400,
	"medium":      500,
	"semibold":    600,
	"semi bold":   600,
	"demibold":    600,
	"bold":        700,
	"extrabold":   800,
	"extra bold":  800,
	"black":       900,
	"heavy":       900,
}

// parseFontName разбирает имя файла в (slug, family, weight, style, ok).
//
//	inter-400_1712345678.woff   → (inter_400, inter, 400, normal)
//	inter-400.woff              → (inter_400, inter, 400, normal)
//	PT Mono.woff                → (pt_mono_400, PT Mono, 400, normal)
//	Roboto Slab Bold.woff       → (roboto_slab_700, Roboto Slab, 700, normal)
//	OpenSansCondensed-Regular.woff → (open_sans_condensed_400, Open Sans Condensed, 400, normal)
//	SegoePro-Light.woff         → (segoe_pro_300, Segoe Pro, 300, normal)
func parseFontName(name string) (slug, family string, weight int, style string, ok bool) {
	base := strings.TrimSuffix(name, filepath.Ext(name))
	if base == "" {
		return "", "", 0, "", false
	}

	weight = 400
	style = "normal"
	lower := strings.ToLower(base)

	// 1. weight из слов (bold, light, ...)
	for word, w := range weightWords {
		if strings.Contains(lower, word) {
			weight = w
			break
		}
	}

	// 2. weight из цифр в конце (inter-700, Roboto-700_ts)
	if m := trailingWeightRe.FindStringSubmatch(base); m != nil {
		if w, err := strconv.Atoi(m[1]); err == nil && w >= 100 && w <= 900 {
			weight = w
		}
		base = strings.TrimSpace(base[:len(base)-len(m[0])])
	}

	// 3. style
	if strings.Contains(lower, "italic") || strings.Contains(lower, "oblique") {
		style = "italic"
	}

	// 4. family = base без weight-слов и italic
	family = base
	for word := range weightWords {
		re := regexp.MustCompile(`(?i)\s*\b` + regexp.QuoteMeta(word) + `\b\s*`)
		family = re.ReplaceAllString(family, " ")
	}
	family = regexp.MustCompile(`(?i)\s*\b(italic|oblique)\b\s*`).ReplaceAllString(family, " ")
	family = strings.TrimSpace(multiSpaceRe.ReplaceAllString(family, " "))
	family = strings.Trim(family, "-_ ")

	if family == "" {
		return "", "", 0, "", false
	}

	// 5. camelCase → пробелы: OpenSansCondensed → Open Sans Condensed
	family = camelToSpaced(family)

	// 6. slug = snake_case(family) + _weight[_italic]
	slugSuffix := strconv.Itoa(weight)
	if style == "italic" {
		slugSuffix += "_italic"
	}
	slug = slugify(family) + "_" + slugSuffix

	return slug, family, weight, style, true
}

// camelToSpaced: OpenSans → Open Sans, но PT → PT
func camelToSpaced(s string) string {
	if strings.Contains(s, " ") {
		return s
	}
	var b strings.Builder
	runes := []rune(s)
	for i, r := range runes {
		if i > 0 && r >= 'A' && r <= 'Z' {
			prev := runes[i-1]
			if prev >= 'a' && prev <= 'z' {
				b.WriteRune(' ')
			}
		}
		b.WriteRune(r)
	}
	return b.String()
}

func slugify(s string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(s) {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
		} else if r == ' ' || r == '-' || r == '_' {
			b.WriteRune('_')
		}
	}
	return strings.Trim(b.String(), "_")
}

// ============================================================
// MAIN
// ============================================================

func main() {
	dryRun := flag.Bool("dry-run", false, "только показать, что будет сделано")
	baseDir := flag.String("dir", "", "папка со шрифтами (по умолчанию FONT_BASE_DIR)")
	host := flag.String("host", dbHost, "хост БД (по умолчанию postgres_db)")
	flag.Parse()

	dir := *baseDir
	if dir == "" {
		dir = os.Getenv("FONT_BASE_DIR")
	}
	if dir == "" {
		dir = "/app/front/fonts"
	}

	if _, err := os.Stat(dir); err != nil {
		log.Fatalf("папка не найдена: %s: %v", dir, err)
	}

	fmt.Printf("📁 Папка шрифтов: %s\n", dir)
	if *dryRun {
		fmt.Println("🧪 DRY-RUN: изменения в БД не применяются")
	}

	// ---- 1. сканируем диск ----
	diskFonts, err := scanDisk(dir)
	if err != nil {
		log.Fatalf("scan: %v", err)
	}
	fmt.Printf("📄 Найдено .woff файлов: %d\n", len(diskFonts))

	// ---- 2. подключаемся к БД ----
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		*host, dbPort, dbUser, dbPassword, dbName,
	)
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Ошибка подключения:", err)
	}
	defer db.Close()
	if err := db.Ping(); err != nil {
		log.Fatal("Ошибка пинга БД:", err)
	}
	fmt.Printf("✅ Подключено к БД (%s)\n", *host)

	// ---- 3. читаем существующие ----
	dbFonts, err := loadDBFonts(db)
	if err != nil {
		log.Fatalf("load db fonts: %v", err)
	}
	fmt.Printf("🗄️  Записей в БД: %d\n", len(dbFonts))

	byURL := make(map[string]dbFont, len(dbFonts))
	for _, f := range dbFonts {
		byURL[f.Url] = f
	}

	// ---- 4. синхронизация ----
	var (
		inserted int
		updated  int
		skipped  int
	)

	for _, df := range diskFonts {
		existing, ok := byURL[df.RelPath]

		// файл есть на диске, но нет в БД → INSERT
		if !ok {
			if *dryRun {
				fmt.Printf("  + INSERT  %-35s family=%-25q slug=%-30q weight=%d style=%s\n",
					df.RelPath, df.Family, df.Slug, df.Weight, df.Style)
				inserted++
				continue
			}
			_, err := db.Exec(`
				INSERT INTO fonts (family, slug, url, weight, style, is_active)
				VALUES ($1, $2, $3, $4, $5, true)
				ON CONFLICT (slug, weight, style) DO UPDATE
				SET url        = EXCLUDED.url,
				    family     = EXCLUDED.family,
				    is_active  = true,
				    updated_at = now()
			`, df.Family, df.Slug, df.RelPath, df.Weight, df.Style)
			if err != nil {
				log.Printf("  ❌ INSERT %s: %v", df.RelPath, err)
				continue
			}
			fmt.Printf("  + INSERT  %-35s family=%-25q slug=%-30q weight=%d style=%s\n",
				df.RelPath, df.Family, df.Slug, df.Weight, df.Style)
			inserted++
			continue
		}

		// запись есть — проверим, что поля совпадают
		if existing.Family == df.Family &&
			existing.Weight == df.Weight &&
			existing.Style == df.Style &&
			existing.IsActive {
			skipped++
			continue
		}

		if *dryRun {
			fmt.Printf("  ~ UPDATE  %-35s family=%q→%q weight=%d→%d style=%s→%s active=%v→true\n",
				df.RelPath, existing.Family, df.Family,
				existing.Weight, df.Weight,
				existing.Style, df.Style,
				existing.IsActive)
			updated++
			continue
		}
		_, err := db.Exec(`
			UPDATE fonts
			SET family = $1, weight = $2, style = $3,
			    is_active = true, updated_at = now()
			WHERE id = $4
		`, df.Family, df.Weight, df.Style, existing.ID)
		if err != nil {
			log.Printf("  ❌ UPDATE %s: %v", df.RelPath, err)
			continue
		}
		fmt.Printf("  ~ UPDATE  %-35s family=%q weight=%d style=%s\n",
			df.RelPath, df.Family, df.Weight, df.Style)
		updated++
	}

	// ---- 5. файлы в БД, которых нет на диске → is_active = false ----
	diskSet := make(map[string]bool, len(diskFonts))
	for _, df := range diskFonts {
		diskSet[df.RelPath] = true
	}

	var deactivated int
	for _, f := range dbFonts {
		if diskSet[f.Url] || !f.IsActive {
			continue
		}
		if *dryRun {
			fmt.Printf("  - DEACTIVATE  %s (файла нет на диске)\n", f.Url)
			deactivated++
			continue
		}
		_, err := db.Exec(`
			UPDATE fonts SET is_active = false, updated_at = now()
			WHERE id = $1
		`, f.ID)
		if err != nil {
			log.Printf("  ❌ DEACTIVATE %s: %v", f.Url, err)
			continue
		}
		fmt.Printf("  - DEACTIVATE  %s (файла нет на диске)\n", f.Url)
		deactivated++
	}

	// ---- 6. итог ----
	fmt.Println("\n===== ИТОГ =====")
	fmt.Printf("  вставлено:      %d\n", inserted)
	fmt.Printf("  обновлено:      %d\n", updated)
	fmt.Printf("  деактивировано: %d\n", deactivated)
	fmt.Printf("  без изменений:  %d\n", skipped)
	if *dryRun {
		fmt.Println("  (dry-run: ничего не применено)")
	}
}

// ============================================================
// СКАНИРОВАНИЕ ПАПКИ — только .woff
// ============================================================

func scanDisk(dir string) ([]diskFont, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	var out []diskFont
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		name := e.Name()
		lower := strings.ToLower(name)

		// только .woff, всё остальное (.woff2, .eot, .ttf, .otf) — игнор
		if !strings.HasSuffix(lower, ".woff") {
			continue
		}

		slug, family, weight, style, ok := parseFontName(name)
		if !ok {
			log.Printf("  ⚠️  пропущен (не удалось разобрать имя): %s", name)
			continue
		}

		out = append(out, diskFont{
			FilePath: filepath.Join(dir, name),
			RelPath:  name,
			Slug:     slug,
			Weight:   weight,
			Style:    style,
			Family:   family,
		})
	}
	return out, nil
}

// ============================================================
// ЧТЕНИЕ БД
// ============================================================

func loadDBFonts(db *sql.DB) ([]dbFont, error) {
	rows, err := db.Query(`
		SELECT id, family, slug, url, weight, style, is_active
		FROM fonts
		ORDER BY id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []dbFont
	for rows.Next() {
		var f dbFont
		if err := rows.Scan(&f.ID, &f.Family, &f.Slug, &f.Url, &f.Weight, &f.Style, &f.IsActive); err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, rows.Err()
}
