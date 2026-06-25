package util

import (
	"context"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mrkrabopl1/go_db/types"
)

// ========== ТЕСТЫ ПАРСЕРА ==========

func TestParseSQLScript_SingleQuery(t *testing.T) {
	script := "SELECT * FROM products;"
	queries := ParseSQLScript(script)

	if len(queries) != 1 {
		t.Fatalf("ожидался 1 запрос, получено %d", len(queries))
	}
	if queries[0].Query != "SELECT * FROM products" {
		t.Errorf("неверный запрос: %s", queries[0].Query)
	}
}

func TestParseSQLScript_MultipleQueries(t *testing.T) {
	script := `
		SELECT * FROM products;
		INSERT INTO brands (name) VALUES ('Nike');
		UPDATE products SET price = 100 WHERE id = 1;
	`
	queries := ParseSQLScript(script)

	if len(queries) != 3 {
		t.Fatalf("ожидалось 3 запроса, получено %d", len(queries))
	}

	expected := []string{
		"SELECT * FROM products",
		"INSERT INTO brands (name) VALUES ('Nike')",
		"UPDATE products SET price = 100 WHERE id = 1",
	}

	for i, q := range queries {
		if q.Query != expected[i] {
			t.Errorf("запрос #%d: ожидалось '%s', получено '%s'", i+1, expected[i], q.Query)
		}
	}
}

func TestParseSQLScript_WithComments(t *testing.T) {
	script := `
		-- Получаем все продукты
		SELECT * FROM products;
		-- Добавляем бренд
		INSERT INTO brands (name) VALUES ('Adidas');
	`
	queries := ParseSQLScript(script)

	if len(queries) != 2 {
		t.Fatalf("ожидалось 2 запроса, получено %d", len(queries))
	}

	if queries[0].Comment != "Получаем все продукты" {
		t.Errorf("неверный комментарий: '%s'", queries[0].Comment)
	}
	if queries[1].Comment != "Добавляем бренд" {
		t.Errorf("неверный комментарий: '%s'", queries[1].Comment)
	}
}

func TestParseSQLScript_MultilineComments(t *testing.T) {
	script := `
		-- Первая строка
		-- Вторая строка
		SELECT * FROM products;
	`
	queries := ParseSQLScript(script)

	if len(queries) != 1 {
		t.Fatalf("ожидался 1 запрос, получено %d", len(queries))
	}

	expectedComment := "Первая строка | Вторая строка"
	if queries[0].Comment != expectedComment {
		t.Errorf("ожидался комментарий '%s', получено '%s'", expectedComment, queries[0].Comment)
	}
}

func TestParseSQLScript_NoSemicolon(t *testing.T) {
	script := "SELECT * FROM products"
	queries := ParseSQLScript(script)

	if len(queries) != 1 {
		t.Fatalf("ожидался 1 запрос, получено %d", len(queries))
	}
	if queries[0].Query != "SELECT * FROM products" {
		t.Errorf("неверный запрос: %s", queries[0].Query)
	}
}

func TestParseSQLScript_EmptyScript(t *testing.T) {
	queries := ParseSQLScript("")
	if len(queries) != 0 {
		t.Errorf("ожидалось 0 запросов, получено %d", len(queries))
	}
}

func TestParseSQLScript_OnlyComments(t *testing.T) {
	script := "-- Это просто комментарий\n-- Ещё комментарий"
	queries := ParseSQLScript(script)
	if len(queries) != 0 {
		t.Errorf("ожидалось 0 запросов, получено %d", len(queries))
	}
}

func TestParseSQLScript_MixedCase(t *testing.T) {
	script := "select * from PRODUCTS where ID = 1;"
	queries := ParseSQLScript(script)

	if len(queries) != 1 {
		t.Fatalf("ожидался 1 запрос, получено %d", len(queries))
	}
	if queries[0].Query != "select * from PRODUCTS where ID = 1" {
		t.Errorf("неверный запрос: %s", queries[0].Query)
	}
}

func TestParseSQLScript_CreateTable(t *testing.T) {
	script := `
		CREATE TABLE IF NOT EXISTS public.products (
			id SERIAL PRIMARY KEY,
			name TEXT NOT NULL
		);
	`
	queries := ParseSQLScript(script)

	if len(queries) != 1 {
		t.Fatalf("ожидался 1 запрос, получено %d", len(queries))
	}
	if !strings.Contains(queries[0].Query, "CREATE TABLE") {
		t.Errorf("запрос не содержит CREATE TABLE: %s", queries[0].Query)
	}
}

// ========== ТЕСТЫ ВАЛИДАТОРА ==========

func TestValidateSQL_SuperadminCanDoAnything(t *testing.T) {
	queries := []types.ParsedQuery{
		{Query: "DROP TABLE products"},
		{Query: "DELETE FROM admins"},
		{Query: "ALTER TABLE users ADD COLUMN test TEXT"},
	}

	result := ValidateSQL(queries, "superadmin")

	if !result.Valid {
		t.Errorf("суперадмин должен иметь доступ ко всему, ошибки: %v", result.Errors)
	}
}

func TestValidateSQL_AdminCanSelect(t *testing.T) {
	queries := []types.ParsedQuery{
		{Query: "SELECT * FROM products"},
		{Query: "SELECT * FROM orders"},
	}

	result := ValidateSQL(queries, "admin")

	if !result.Valid {
		t.Errorf("админ должен иметь доступ к SELECT, ошибки: %v", result.Errors)
	}
}

func TestValidateSQL_AdminCanInsertAllowed(t *testing.T) {
	queries := []types.ParsedQuery{
		{Query: "INSERT INTO products (name) VALUES ('Test')"},
		{Query: "INSERT INTO brands (name) VALUES ('Nike')"},
	}

	result := ValidateSQL(queries, "admin")

	if !result.Valid {
		t.Errorf("админ должен иметь доступ к INSERT в разрешённые таблицы, ошибки: %v", result.Errors)
	}
}

func TestValidateSQL_AdminCannotInsertForbidden(t *testing.T) {
	queries := []types.ParsedQuery{
		{Query: "INSERT INTO admins (email) VALUES ('test@test.com')"},
	}

	result := ValidateSQL(queries, "admin")

	if result.Valid {
		t.Error("админ НЕ должен иметь доступ к INSERT в admins")
	}
}

func TestValidateSQL_AdminCannotDeleteForbidden(t *testing.T) {
	testCases := []struct {
		name  string
		query string
	}{
		{"удаление админов", "DELETE FROM admins WHERE id = 1"},
		{"удаление логов", "DELETE FROM admin_logs"},
		{"удаление паролей", "DELETE FROM password_resets"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			queries := []types.ParsedQuery{{Query: tc.query}}
			result := ValidateSQL(queries, "admin")
			if result.Valid {
				t.Errorf("админ НЕ должен иметь доступ к: %s", tc.query)
			}
		})
	}
}

func TestValidateSQL_ForbiddenKeywords(t *testing.T) {
	testCases := []struct {
		name  string
		query string
	}{
		{"DROP DATABASE", "DROP DATABASE mydb"},
		{"REVOKE", "REVOKE ALL ON products FROM user1"},
		{"GRANT", "GRANT SELECT ON products TO user1"},
		{"COPY", "COPY products TO '/tmp/products.csv'"},
		{"pg_read_file", "SELECT pg_read_file('/etc/passwd')"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			queries := []types.ParsedQuery{{Query: tc.query}}
			result := ValidateSQL(queries, "superadmin")
			if result.Valid {
				t.Errorf("запрещённая команда должна быть заблокирована: %s", tc.query)
			}
		})
	}
}

func TestValidateSQL_DangerousOperationsWarnings(t *testing.T) {
	testCases := []struct {
		name          string
		query         string
		expectWarning bool
	}{
		{"DELETE без WHERE", "DELETE FROM products", true},
		{"UPDATE без WHERE", "UPDATE products SET price = 100", true},
		{"DELETE с WHERE", "DELETE FROM products WHERE id = 1", false},
		{"UPDATE с WHERE", "UPDATE products SET price = 100 WHERE id = 1", false},
		{"DROP TABLE", "DROP TABLE products", true},
		{"TRUNCATE", "TRUNCATE products", true},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			queries := []types.ParsedQuery{{Query: tc.query}}
			result := ValidateSQL(queries, "superadmin")

			if tc.expectWarning && len(result.Warnings) == 0 {
				t.Errorf("ожидалось предупреждение для: %s", tc.query)
			}
			if !tc.expectWarning && len(result.Warnings) > 0 {
				t.Errorf("НЕ ожидалось предупреждение для: %s, но получено: %v", tc.query, result.Warnings)
			}
		})
	}
}

func TestValidateSQL_CTEOperations(t *testing.T) {
	queries := []types.ParsedQuery{
		{
			Query: `
				WITH updated AS (
					UPDATE products SET price = 100 WHERE id = 1
					RETURNING *
				)
				SELECT * FROM updated
			`,
		},
	}

	result := ValidateSQL(queries, "admin")
	if !result.Valid {
		t.Errorf("CTE с UPDATE должен быть разрешён, ошибки: %v", result.Errors)
	}
}

func TestValidateSQL_BeginCommit(t *testing.T) {
	queries := []types.ParsedQuery{
		{Query: "BEGIN"},
		{Query: "SELECT * FROM products"},
		{Query: "COMMIT"},
	}

	result := ValidateSQL(queries, "admin")
	if !result.Valid {
		t.Errorf("BEGIN/COMMIT должны быть разрешены, ошибки: %v", result.Errors)
	}
}

func TestValidateSQL_CreateIndexAllowed(t *testing.T) {
	queries := []types.ParsedQuery{
		{Query: "CREATE INDEX IF NOT EXISTS idx_test ON products(name)"},
	}

	result := ValidateSQL(queries, "admin")
	if !result.Valid {
		t.Errorf("CREATE INDEX должен быть разрешён, ошибки: %v", result.Errors)
	}
}

func TestValidateSQL_ExecutionModes(t *testing.T) {
	testCases := []struct {
		name         string
		query        string
		expectedMode types.SQLExecutionMode
	}{
		{"SELECT", "SELECT * FROM products", types.SQLModeReadOnly},
		{"INSERT", "INSERT INTO products (name) VALUES ('test')", types.SQLModeWrite},
		{"UPDATE", "UPDATE products SET name = 'test'", types.SQLModeWrite},
		{"DELETE", "DELETE FROM products WHERE id = 1", types.SQLModeWrite},
		{"CREATE", "CREATE TABLE test (id INT)", types.SQLModeDDL},
		{"ALTER", "ALTER TABLE products ADD COLUMN test TEXT", types.SQLModeDDL},
		{"DROP", "DROP TABLE test", types.SQLModeDDL},
		{"TRUNCATE", "TRUNCATE products", types.SQLModeDDL},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			queries := []types.ParsedQuery{{Query: tc.query}}
			result := ValidateSQL(queries, "superadmin")
			if result.Mode != tc.expectedMode {
				t.Errorf("ожидался режим %s, получен %s", tc.expectedMode, result.Mode)
			}
		})
	}
}

func TestValidateSQL_MultipleOperationsMode(t *testing.T) {
	queries := []types.ParsedQuery{
		{Query: "SELECT * FROM products"},
		{Query: "INSERT INTO products (name) VALUES ('test')"},
		{Query: "CREATE INDEX idx_test ON products(name)"},
	}

	result := ValidateSQL(queries, "superadmin")
	// Должен быть самый строгий режим - DDL
	if result.Mode != types.SQLModeDDL {
		t.Errorf("ожидался режим DDL (самый строгий), получен %s", result.Mode)
	}
}

func TestValidateSQL_AdminModeRestriction(t *testing.T) {
	queries := []types.ParsedQuery{
		{Query: "CREATE INDEX idx_test ON products(name)"},
	}

	result := ValidateSQL(queries, "admin")
	// Админ не может DDL, поэтому режим должен быть Write
	if result.Mode != types.SQLModeWrite {
		t.Errorf("ожидался режим Write для админа, получен %s", result.Mode)
	}
}

func TestValidateSQL_EmptyQuery(t *testing.T) {
	queries := []types.ParsedQuery{
		{Query: ""},
		{Query: "SELECT * FROM products"},
	}

	result := ValidateSQL(queries, "admin")
	if !result.Valid {
		t.Errorf("пустые запросы должны игнорироваться, ошибки: %v", result.Errors)
	}
	if len(result.Operations) != 1 {
		t.Errorf("ожидалась 1 операция, получено %d", len(result.Operations))
	}
}

// ========== ТЕСТЫ ИЗВЛЕЧЕНИЯ ТАБЛИЦ ==========

func TestExtractTableName(t *testing.T) {
	testCases := []struct {
		name     string
		query    string
		opType   string
		expected string
	}{
		{"INSERT INTO", "INSERT INTO products (name) VALUES ('test')", "INSERT", "products"},
		{"INSERT INTO public", "INSERT INTO public.brands (name) VALUES ('test')", "INSERT", "brands"},
		{"UPDATE", "UPDATE products SET name = 'test'", "UPDATE", "products"},
		{"DELETE FROM", "DELETE FROM products WHERE id = 1", "DELETE", "products"},
		{"SELECT FROM", "SELECT * FROM products", "SELECT", "products"},
		{"SELECT JOIN", "SELECT * FROM orders JOIN products ON orders.id = products.id", "SELECT", "orders"},
		{"CREATE TABLE", "CREATE TABLE products (id INT)", "CREATE", "products"},
		{"CREATE TABLE IF NOT EXISTS", "CREATE TABLE IF NOT EXISTS products (id INT)", "CREATE", "products"},
		{"ALTER TABLE", "ALTER TABLE products ADD COLUMN test TEXT", "ALTER", "products"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := extractTableName(tc.query, tc.opType)
			if result != tc.expected {
				t.Errorf("ожидалась таблица '%s', получена '%s'", tc.expected, result)
			}
		})
	}
}

// ========== ТЕСТЫ ОПРЕДЕЛЕНИЯ ТИПА ОПЕРАЦИИ ==========

func TestDetectOperationType(t *testing.T) {
	testCases := []struct {
		query    string
		expected string
	}{
		{"SELECT * FROM products", "SELECT"},
		{"INSERT INTO products VALUES (1)", "INSERT"},
		{"UPDATE products SET name = 'test'", "UPDATE"},
		{"DELETE FROM products", "DELETE"},
		{"CREATE TABLE test (id INT)", "CREATE"},
		{"ALTER TABLE test ADD COLUMN x INT", "ALTER"},
		{"DROP TABLE test", "DROP"},
		{"TRUNCATE test", "TRUNCATE"},
		{"BEGIN", "BEGIN"},
		{"COMMIT", "COMMIT"},
		{"WITH cte AS (SELECT 1) SELECT * FROM cte", "SELECT"},
		{"EXPLAIN SELECT * FROM products", "OTHER"},
	}

	for _, tc := range testCases {
		t.Run(tc.expected, func(t *testing.T) {
			upperQ := strings.ToUpper(tc.query)
			result := detectOperationType(upperQ, tc.query)
			if result != tc.expected {
				t.Errorf("для '%s' ожидался тип '%s', получен '%s'", tc.query, tc.expected, result)
			}
		})
	}
}

// ========== ТЕСТЫ СОДЕРЖАНИЯ ЗАПРЕЩЁННЫХ СЛОВ ==========

func TestContainsForbiddenKeywords(t *testing.T) {
	testCases := []struct {
		query    string
		expected bool
	}{
		{"SELECT * FROM products", false},
		{"DROP DATABASE test", true},
		{"GRANT SELECT ON products TO user1", true},
		{"REVOKE ALL ON products", true},
		{"SELECT pg_read_file('/etc/passwd')", true},
		{"CREATE TABLE test (id INT)", false},
		{"INSERT INTO products VALUES (1)", false},
	}

	for _, tc := range testCases {
		t.Run("", func(t *testing.T) {
			result := containsForbiddenKeywords(strings.ToUpper(tc.query))
			if result != tc.expected {
				t.Errorf("для '%s' ожидалось %v, получено %v", tc.query, tc.expected, result)
			}
		})
	}
}

// ========== ТЕСТЫ ПРОВЕРКИ ОПАСНЫХ ОПЕРАЦИЙ ==========

func TestCheckDangerousOperations(t *testing.T) {
	testCases := []struct {
		name          string
		query         string
		opType        string
		tableName     string
		expectWarning bool
	}{
		{"DELETE без WHERE", "DELETE FROM products", "DELETE", "products", true},
		{"UPDATE без WHERE", "UPDATE products SET price = 100", "UPDATE", "products", true},
		{"DELETE с WHERE", "DELETE FROM products WHERE id = 1", "DELETE", "products", false},
		{"UPDATE с RETURNING", "UPDATE products SET price = 100 RETURNING *", "UPDATE", "products", false},
		{"SELECT безопасный", "SELECT * FROM products", "SELECT", "products", false},
		{"DROP TABLE", "DROP TABLE products", "DROP", "products", true},
		{"TRUNCATE", "TRUNCATE products", "TRUNCATE", "products", true},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			warnings := checkDangerousOperations(strings.ToUpper(tc.query), tc.opType, tc.tableName)
			hasWarning := len(warnings) > 0
			if hasWarning != tc.expectWarning {
				t.Errorf("ожидалось предупреждение=%v, получено=%v", tc.expectWarning, hasWarning)
			}
		})
	}
}

// ========== ТЕСТЫ РЕЖИМОВ ВЫПОЛНЕНИЯ ==========

func TestGetExecutionMode(t *testing.T) {
	testCases := []struct {
		opType   string
		expected types.SQLExecutionMode
	}{
		{"SELECT", types.SQLModeReadOnly},
		{"INSERT", types.SQLModeWrite},
		{"UPDATE", types.SQLModeWrite},
		{"DELETE", types.SQLModeWrite},
		{"CREATE", types.SQLModeDDL},
		{"ALTER", types.SQLModeDDL},
		{"DROP", types.SQLModeDDL},
		{"TRUNCATE", types.SQLModeDDL},
		{"BEGIN", types.SQLModeAll},
		{"UNKNOWN", types.SQLModeAll},
	}

	for _, tc := range testCases {
		t.Run(tc.opType, func(t *testing.T) {
			result := getExecutionMode(tc.opType)
			if result != tc.expected {
				t.Errorf("для '%s' ожидался режим '%s', получен '%s'", tc.opType, tc.expected, result)
			}
		})
	}
}

func TestIsStricterMode(t *testing.T) {
	testCases := []struct {
		new      types.SQLExecutionMode
		current  types.SQLExecutionMode
		expected bool
	}{
		{types.SQLModeWrite, types.SQLModeReadOnly, true},
		{types.SQLModeDDL, types.SQLModeWrite, true},
		{types.SQLModeAll, types.SQLModeDDL, true},
		{types.SQLModeReadOnly, types.SQLModeWrite, false},
		{types.SQLModeWrite, types.SQLModeDDL, false},
		{types.SQLModeReadOnly, types.SQLModeReadOnly, false},
	}

	for _, tc := range testCases {
		t.Run(string(tc.new)+"_vs_"+string(tc.current), func(t *testing.T) {
			result := isStricterMode(tc.new, tc.current)
			if result != tc.expected {
				t.Errorf("isStricterMode(%s, %s) = %v, ожидалось %v",
					tc.new, tc.current, result, tc.expected)
			}
		})
	}
}

// ========== ИНТЕГРАЦИОННЫЙ ТЕСТ (без БД) ==========

func TestFullFlow_Validation(t *testing.T) {
	script := `
		-- Получаем продукты
		SELECT * FROM products;
		-- Добавляем бренд
		INSERT INTO brands (name) VALUES ('Nike');
		-- Обновляем цену
		UPDATE products SET price = 100 WHERE id = 1;
	`

	// Парсинг
	queries := ParseSQLScript(script)
	if len(queries) != 3 {
		t.Fatalf("ожидалось 3 запроса после парсинга, получено %d", len(queries))
	}

	// Валидация
	result := ValidateSQL(queries, "admin")
	if !result.Valid {
		t.Errorf("валидация не прошла: %v", result.Errors)
	}
	if len(result.Operations) != 3 {
		t.Errorf("ожидалось 3 операции, получено %d", len(result.Operations))
	}

	// Проверка типов операций
	expectedTypes := []string{"SELECT", "INSERT", "UPDATE"}
	for i, op := range result.Operations {
		if op.Type != expectedTypes[i] {
			t.Errorf("операция #%d: ожидался тип '%s', получен '%s'", i+1, expectedTypes[i], op.Type)
		}
	}

	// Проверка комментариев
	expectedComments := []string{"Получаем продукты", "Добавляем бренд", "Обновляем цену"}
	for i, op := range result.Operations {
		if op.Message != expectedComments[i] {
			t.Errorf("операция #%d: ожидался комментарий '%s', получен '%s'",
				i+1, expectedComments[i], op.Message)
		}
	}
}

func TestFullFlow_ForbiddenOperation(t *testing.T) {
	script := `
		SELECT * FROM products;
		INSERT INTO admins (email) VALUES ('hacker@test.com');
		DELETE FROM admin_logs;
	`

	queries := ParseSQLScript(script)
	result := ValidateSQL(queries, "admin")

	if result.Valid {
		t.Error("валидация должна была провалиться из-за запрещённых операций")
	}
	if len(result.Errors) != 2 {
		t.Errorf("ожидалось 2 ошибки, получено %d: %v", len(result.Errors), result.Errors)
	}
}

func TestFullFlow_SuperadminBypass(t *testing.T) {
	script := `
		DELETE FROM admins WHERE id = 1;
		ALTER TABLE products ADD COLUMN test TEXT;
		DROP INDEX idx_test;
	`

	queries := ParseSQLScript(script)
	result := ValidateSQL(queries, "superadmin")

	if !result.Valid {
		t.Errorf("суперадмин должен иметь доступ ко всему, ошибки: %v", result.Errors)
	}
}

// ========== ТЕСТЫ С РЕАЛЬНОЙ БД (опционально) ==========

func TestExecuteSQLQueries_Integration(t *testing.T) {
	if testing.Short() {
		t.Skip("пропускаем интеграционный тест в коротком режиме")
	}

	// Подключаем тестовую БД
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, "postgres://test:test@localhost:5432/testdb")
	if err != nil {
		t.Fatalf("не удалось подключиться к БД: %v", err)
	}
	defer pool.Close()

	// Создаём тестовую таблицу
	_, err = pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS test_products (
			id SERIAL PRIMARY KEY,
			name TEXT NOT NULL
		)
	`)
	if err != nil {
		t.Fatalf("не удалось создать таблицу: %v", err)
	}
	defer pool.Exec(ctx, "DROP TABLE IF EXISTS test_products")

	// Тестовые данные
	queries := []types.ParsedQuery{
		{Query: "INSERT INTO test_products (name) VALUES ('test1')"},
		{Query: "INSERT INTO test_products (name) VALUES ('test2')"},
		{Query: "SELECT * FROM test_products"},
		{Query: "UPDATE test_products SET name = 'updated' WHERE name = 'test1'"},
		{Query: "DELETE FROM test_products WHERE name = 'test2'"},
	}

	validation := types.SQLValidationResult{
		Operations: []types.SQLOperationInfo{
			{Type: "INSERT", Table: "test_products"},
			{Type: "INSERT", Table: "test_products"},
			{Type: "SELECT", Table: "test_products"},
			{Type: "UPDATE", Table: "test_products"},
			{Type: "DELETE", Table: "test_products"},
		},
	}

	operations, summary, err := ExecuteSQLQueries(ctx, pool, queries, validation)
	if err != nil {
		t.Fatalf("ошибка выполнения: %v", err)
	}

	// Проверки
	if summary.TotalQueries != 5 {
		t.Errorf("ожидалось 5 запросов, выполнено %d", summary.TotalQueries)
	}
	if summary.Successful != 5 {
		t.Errorf("ожидалось 5 успешных, получено %d", summary.Successful)
	}
	if summary.Failed != 0 {
		t.Errorf("ожидалось 0 ошибок, получено %d", summary.Failed)
	}

	// Проверяем SELECT
	if operations[2].RowsAffected != 2 {
		t.Errorf("SELECT должен был вернуть 2 строки, вернул %d", operations[2].RowsAffected)
	}
}

func TestExecuteSQLQueries_OnConflict(t *testing.T) {
	if testing.Short() {
		t.Skip("пропускаем интеграционный тест в коротком режиме")
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, "postgres://test:test@localhost:5432/testdb")
	if err != nil {
		t.Fatalf("не удалось подключиться к БД: %v", err)
	}
	defer pool.Close()

	// Создаём таблицу с уникальным constraint
	_, err = pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS test_unique (
			id SERIAL PRIMARY KEY,
			code TEXT UNIQUE NOT NULL
		)
	`)
	if err != nil {
		t.Fatalf("не удалось создать таблицу: %v", err)
	}
	defer pool.Exec(ctx, "DROP TABLE IF EXISTS test_unique")

	// Первая вставка
	queries := []types.ParsedQuery{
		{Query: "INSERT INTO test_unique (code) VALUES ('A') ON CONFLICT (code) DO NOTHING"},
		{Query: "INSERT INTO test_unique (code) VALUES ('A') ON CONFLICT (code) DO NOTHING"},
	}

	validation := types.SQLValidationResult{
		Operations: []types.SQLOperationInfo{
			{Type: "INSERT", Table: "test_unique"},
			{Type: "INSERT", Table: "test_unique"},
		},
	}

	operations, summary, err := ExecuteSQLQueries(ctx, pool, queries, validation)
	if err != nil {
		t.Fatalf("ошибка выполнения: %v", err)
	}

	if operations[0].Status != "success" {
		t.Errorf("первая вставка должна быть успешной, статус: %s", operations[0].Status)
	}
	if operations[1].Status != "skipped" {
		t.Errorf("вторая вставка должна быть skipped, статус: %s", operations[1].Status)
	}
	if summary.Skipped != 1 {
		t.Errorf("ожидалась 1 пропущенная операция, получено %d", summary.Skipped)
	}
}
