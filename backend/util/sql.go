package util

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mrkrabopl1/go_db/types"
)

// ========== КОНФИГУРАЦИЯ ==========

var AllowedWriteTables = map[string][]string{
	"INSERT": {
		"products", "product_colors", "product_categories",
		"product_types", "brands", "brand_lines", "colors",
		"store_house", "discount", "discount_rules",
		"discount_rule_items", "banners", "newsletter_subscribers",
	},
	"UPDATE": {
		"products", "product_categories", "product_types",
		"brands", "brand_lines", "colors", "store_house",
		"discount", "discount_rules", "discount_rule_items",
		"banners", "customers", "orders",
	},
	// DELETE - удален, запрещен
}

var ForbiddenKeywords = []string{
	"DROP", "ALTER", "TRUNCATE", "DELETE",
	"REVOKE", "GRANT", "COPY", "EXECUTE", "PREPARE",
	"LISTEN", "NOTIFY", "VACUUM", "REINDEX", "CLUSTER",
	"pg_read_file", "pg_read_binary_file",
	"pg_ls_dir", "pg_ls_waldir",
	"lo_import", "lo_export",
	"ALTER DATABASE", "ALTER SCHEMA",
	"CREATE DATABASE", "CREATE SCHEMA",
	"DROP DATABASE", "DROP SCHEMA", "DROP OWNED",
}

var ForbiddenWriteTables = []string{
	"admins", "admin_logs", "admin_invites",
	"password_resets", "customer_password_resets",
	"admin_password_resets", "verification", "order_events",
	"pg_", "information_schema", "pg_catalog",
}

// ========== ПАРСЕР ==========

func ParseSQLScript(script string) []types.ParsedQuery {
	var queries []types.ParsedQuery
	lines := strings.Split(script, "\n")

	var currentQuery strings.Builder
	var currentComment strings.Builder

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		if strings.HasPrefix(trimmed, "--") {
			if currentComment.Len() > 0 {
				currentComment.WriteString(" | ")
			}
			currentComment.WriteString(strings.TrimPrefix(trimmed, "--"))
			continue
		}

		if trimmed == "" {
			if currentQuery.Len() > 0 {
				currentQuery.WriteString("\n")
			}
			continue
		}

		currentQuery.WriteString(line + "\n")

		if strings.HasSuffix(trimmed, ";") {
			query := strings.TrimSpace(currentQuery.String())
			query = strings.TrimSuffix(query, ";")

			if query != "" {
				queries = append(queries, types.ParsedQuery{
					Query:   query,
					Comment: strings.TrimSpace(currentComment.String()),
				})
			}

			currentQuery.Reset()
			currentComment.Reset()
		}
	}

	finalQuery := strings.TrimSpace(currentQuery.String())
	if finalQuery != "" {
		queries = append(queries, types.ParsedQuery{
			Query:   finalQuery,
			Comment: strings.TrimSpace(currentComment.String()),
		})
	}

	return queries
}

// ========== ВАЛИДАТОР ==========

func ValidateSQL(queries []types.ParsedQuery, adminRole string) types.SQLValidationResult {
	result := types.SQLValidationResult{
		Valid:      true,
		Operations: make([]types.SQLOperationInfo, 0),
		Errors:     make([]string, 0),
		Warnings:   make([]string, 0),
	}

	for i, pq := range queries {
		if pq.Query == "" {
			continue
		}

		upperQ := strings.ToUpper(strings.TrimSpace(pq.Query))

		// ========== ЯВНЫЕ ЗАПРЕТЫ ==========

		// Запрещаем DELETE
		if strings.HasPrefix(upperQ, "DELETE") {
			result.Errors = append(result.Errors,
				fmt.Sprintf("Запрос #%d: DELETE запрещен в SQL консоли", i+1))
			result.Valid = false
			continue
		}

		// Запрещаем ALTER
		if strings.HasPrefix(upperQ, "ALTER") {
			result.Errors = append(result.Errors,
				fmt.Sprintf("Запрос #%d: ALTER запрещен в SQL консоли", i+1))
			result.Valid = false
			continue
		}

		// Запрещаем DROP
		if strings.HasPrefix(upperQ, "DROP") {
			result.Errors = append(result.Errors,
				fmt.Sprintf("Запрос #%d: DROP запрещен в SQL консоли", i+1))
			result.Valid = false
			continue
		}

		// Запрещаем TRUNCATE
		if strings.HasPrefix(upperQ, "TRUNCATE") {
			result.Errors = append(result.Errors,
				fmt.Sprintf("Запрос #%d: TRUNCATE запрещен в SQL консоли", i+1))
			result.Valid = false
			continue
		}

		// Запрещаем CREATE (кроме CREATE INDEX)
		if strings.HasPrefix(upperQ, "CREATE") && !strings.Contains(upperQ, "CREATE INDEX") {
			result.Errors = append(result.Errors,
				fmt.Sprintf("Запрос #%d: CREATE запрещен в SQL консоли (разрешены только CREATE INDEX)", i+1))
			result.Valid = false
			continue
		}

		// Проверка на запрещенные ключевые слова
		if containsForbiddenKeywords(upperQ) {
			result.Errors = append(result.Errors,
				fmt.Sprintf("Запрос #%d содержит запрещённые операции", i+1))
			result.Valid = false
			continue
		}

		opType := detectOperationType(upperQ, pq.Query)
		tableName := extractTableName(pq.Query, opType)

		// Еще одна проверка на DELETE (для надежности)
		if opType == "DELETE" {
			result.Errors = append(result.Errors,
				fmt.Sprintf("Запрос #%d: DELETE запрещен в SQL консоли", i+1))
			result.Valid = false
			continue
		}

		if !isOperationAllowed(opType, tableName, adminRole) {
			result.Errors = append(result.Errors,
				fmt.Sprintf("Запрос #%d: операция %s над таблицей %s запрещена",
					i+1, opType, tableName))
			result.Valid = false
			continue
		}

		if warnings := checkDangerousOperations(upperQ, opType, tableName); len(warnings) > 0 {
			result.Warnings = append(result.Warnings, warnings...)
		}

		mode := getExecutionMode(opType)
		if mode == types.SQLModeAll && adminRole != "superadmin" {
			mode = types.SQLModeWrite
		}

		result.Operations = append(result.Operations, types.SQLOperationInfo{
			Type:    opType,
			Table:   tableName,
			Message: pq.Comment,
		})

		if isStricterMode(mode, result.Mode) {
			result.Mode = mode
		}
	}

	return result
}

func containsForbiddenKeywords(query string) bool {
	for _, keyword := range ForbiddenKeywords {
		if strings.Contains(query, keyword) {
			return true
		}
	}
	return false
}

func detectOperationType(upperQ, originalQuery string) string {
	switch {
	case strings.HasPrefix(upperQ, "SELECT"):
		return "SELECT"
	case strings.HasPrefix(upperQ, "INSERT"):
		return "INSERT"
	case strings.HasPrefix(upperQ, "UPDATE"):
		return "UPDATE"
	case strings.HasPrefix(upperQ, "DELETE"):
		return "DELETE"
	case strings.HasPrefix(upperQ, "CREATE"):
		return "CREATE"
	case strings.HasPrefix(upperQ, "ALTER"):
		return "ALTER"
	case strings.HasPrefix(upperQ, "DROP"):
		return "DROP"
	case strings.HasPrefix(upperQ, "TRUNCATE"):
		return "TRUNCATE"
	case strings.HasPrefix(upperQ, "WITH"):
		return detectCTEOperationType(originalQuery)
	case strings.HasPrefix(upperQ, "BEGIN"):
		return "BEGIN"
	case strings.HasPrefix(upperQ, "COMMIT"):
		return "COMMIT"
	default:
		return "OTHER"
	}
}

func detectCTEOperationType(query string) string {
	re := regexp.MustCompile(`\)\s*(SELECT|INSERT|UPDATE|DELETE)\b`)
	matches := re.FindStringSubmatch(strings.ToUpper(query))
	if len(matches) > 1 {
		return matches[1]
	}
	return "SELECT"
}

func extractTableName(query, opType string) string {
	upperQ := strings.ToUpper(query)
	var re *regexp.Regexp

	switch opType {
	case "INSERT":
		re = regexp.MustCompile(`(?i)INSERT\s+INTO\s+(?:public\.)?(\w+)`)
	case "UPDATE":
		re = regexp.MustCompile(`(?i)UPDATE\s+(?:ONLY\s+)?(?:public\.)?(\w+)`)
	case "DELETE":
		re = regexp.MustCompile(`(?i)DELETE\s+FROM\s+(?:public\.)?(\w+)`)
	case "SELECT":
		re = regexp.MustCompile(`(?i)(?:FROM|JOIN)\s+(?:public\.)?(\w+)`)
	case "CREATE":
		re = regexp.MustCompile(`(?i)CREATE\s+(?:TABLE|INDEX|TYPE)\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?(?:public\.)?(\w+)`)
	case "ALTER":
		re = regexp.MustCompile(`(?i)ALTER\s+TABLE\s+(?:public\.)?(\w+)`)
	default:
		return ""
	}

	matches := re.FindStringSubmatch(upperQ)
	if len(matches) > 1 {
		return strings.ToLower(matches[1])
	}
	return ""
}

func isOperationAllowed(opType, tableName, adminRole string) bool {
	// SUPERADMIN может все
	if adminRole == "superadmin" {
		return true
	}

	// SELECT всегда разрешен
	if opType == "SELECT" || opType == "BEGIN" || opType == "COMMIT" {
		return true
	}

	// DELETE запрещен для всех (кроме superadmin)
	if opType == "DELETE" {
		return false
	}

	// ALTER, DROP, TRUNCATE запрещены для всех (кроме superadmin)
	if opType == "ALTER" || opType == "DROP" || opType == "TRUNCATE" {
		return false
	}

	// CREATE запрещен (кроме CREATE INDEX для superadmin)
	if opType == "CREATE" {
		return false
	}

	tableName = strings.ToLower(tableName)

	// Запрещенные таблицы
	for _, forbidden := range ForbiddenWriteTables {
		if strings.HasPrefix(tableName, forbidden) {
			return false
		}
	}

	// Проверяем разрешенные таблицы для INSERT/UPDATE
	if allowedTables, ok := AllowedWriteTables[opType]; ok {
		for _, allowed := range allowedTables {
			if tableName == allowed {
				return true
			}
		}
		return false
	}

	return false
}

func checkDangerousOperations(query, opType, tableName string) []string {
	warnings := make([]string, 0)

	if (opType == "DELETE" || opType == "UPDATE") &&
		!strings.Contains(query, "WHERE") &&
		!strings.Contains(query, "RETURNING") {
		warnings = append(warnings,
			fmt.Sprintf("⚠️ %s без WHERE затронет ВСЕ строки в таблице %s", opType, tableName))
	}

	if opType == "DROP" && strings.Contains(query, "TABLE") {
		warnings = append(warnings,
			fmt.Sprintf("⚠️ DROP TABLE %s удалит таблицу безвозвратно", tableName))
	}

	if opType == "TRUNCATE" {
		warnings = append(warnings,
			fmt.Sprintf("⚠️ TRUNCATE удалит все данные из %s", tableName))
	}

	return warnings
}

func getExecutionMode(opType string) types.SQLExecutionMode {
	switch opType {
	case "SELECT":
		return types.SQLModeReadOnly
	case "INSERT", "UPDATE", "DELETE":
		return types.SQLModeWrite
	case "CREATE", "ALTER", "DROP", "TRUNCATE":
		return types.SQLModeDDL
	default:
		return types.SQLModeAll
	}
}

func isStricterMode(new, current types.SQLExecutionMode) bool {
	modes := map[types.SQLExecutionMode]int{
		types.SQLModeReadOnly: 0,
		types.SQLModeWrite:    1,
		types.SQLModeDDL:      2,
		types.SQLModeAll:      3,
	}
	return modes[new] > modes[current]
}

// ========== ВЫПОЛНЕНИЕ ==========

func ExecuteSQLQueries(
	ctx context.Context,
	db *pgxpool.Pool,
	queries []types.ParsedQuery,
	validation types.SQLValidationResult,
) ([]types.SQLOperationInfo, types.ExecuteSummary, error) {

	var operations []types.SQLOperationInfo
	summary := types.ExecuteSummary{
		TablesAffected:   make(map[string]int),
		OperationsByType: make(map[string]int),
	}

	for i, pq := range queries {
		if pq.Query == "" {
			continue
		}

		summary.TotalQueries++
		opInfo := validation.Operations[i]
		queryStartTime := time.Now()

		var rowsAffected int64

		switch {
		case opInfo.Type == "SELECT":
			rows, err := db.Query(ctx, pq.Query)
			if err != nil {
				opInfo.Status = "error"
				opInfo.Message = err.Error()
				summary.Failed++
			} else {
				count := 0
				for rows.Next() {
					count++
				}
				rows.Close()
				opInfo.Status = "success"
				opInfo.RowsAffected = int64(count)
				summary.Successful++
			}

		case opInfo.Type == "BEGIN", opInfo.Type == "COMMIT":
			_, err := db.Exec(ctx, pq.Query)
			if err != nil {
				opInfo.Status = "error"
				opInfo.Message = err.Error()
				summary.Failed++
			} else {
				opInfo.Status = "success"
				summary.Successful++
			}

		default:
			result, err := db.Exec(ctx, pq.Query)
			if err != nil {
				opInfo.Status = "error"
				opInfo.Message = err.Error()
				summary.Failed++
			} else {
				rowsAffected = result.RowsAffected()
				opInfo.RowsAffected = rowsAffected

				if rowsAffected == 0 {
					if strings.Contains(strings.ToUpper(pq.Query), "ON CONFLICT") {
						opInfo.Status = "skipped"
						opInfo.Message = "Пропущено (ON CONFLICT)"
						summary.Skipped++
					} else {
						opInfo.Status = "success"
						opInfo.Message = "Затронуто 0 строк"
						summary.Successful++
					}
				} else {
					opInfo.Status = "success"
					summary.Successful++
				}
			}
		}

		if opInfo.Table != "" {
			summary.TablesAffected[opInfo.Table]++
		}
		summary.OperationsByType[opInfo.Type]++

		queryDuration := time.Since(queryStartTime)
		fmt.Printf("[SQL] #%d %s -> %s (за %v)\n",
			summary.TotalQueries, opInfo.Type, opInfo.Status, queryDuration)

		operations = append(operations, opInfo)
	}

	return operations, summary, nil
}
