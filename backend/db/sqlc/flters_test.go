package db

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/require"
)

func TestCompareAllFiltersPerformance_EmptyParams(t *testing.T) {
	// Проверяем, что есть данные
	var count int
	err := testStore.DB().QueryRow(context.Background(),
		"SELECT COUNT(*) FROM products WHERE status = 'active'").Scan(&count)
	require.NoError(t, err)

	if count == 0 {
		t.Skip("No active products in database, skipping test")
	}

	t.Logf("✅ Found %d active products", count)

	// ============================================================
	// ПАРАМЕТРЫ БЕЗ ФИЛЬТРОВ (ВСЕ ПУСТЫЕ)
	// ============================================================

	// Для старого метода - пустые параметры
	oldParams := GetFiltersByNameCategoryAndTypeParams{
		Type:     pgtype.Int4{Int32: 0, Valid: false},
		Category: pgtype.Int4{Int32: 0, Valid: false},
		Name:     pgtype.Text{String: "", Valid: false},
	}

	// Для новых методов
	newParams := FilterParams{
		Type:     nil,
		Category: nil,
		Name:     nil,
		BrandID:  nil,
	}

	// Для нового sqlc метода
	sqlcParams := GetFiltersByNameCategoryAndTypeNewParams{
		Column1: 0,
		Column2: 0,
		Column3: "",
	}

	// ============================================================
	// ПРОГРЕВ (3 раза)
	// ============================================================
	t.Log("Warming up with empty params...")
	for i := 0; i < 3; i++ {
		_, _ = testStore.GetFiltersByNameCategoryAndType(context.Background(), oldParams)
		_, _ = testStore.GetFiltersOptimized(context.Background(), newParams)
		_, _ = testStore.GetFiltersOptimizedMemo(context.Background(), newParams)
		_, _ = testStore.GetFiltersByNameCategoryAndTypeNew(context.Background(), sqlcParams)
	}

	// ============================================================
	// ЗАМЕР СТАРОГО МЕТОДА (10 итераций)
	// ============================================================
	var oldTotal time.Duration
	var oldResult GetFiltersByNameCategoryAndTypeRow
	for i := 0; i < 10; i++ {
		start := time.Now()
		result, err := testStore.GetFiltersByNameCategoryAndType(context.Background(), oldParams)
		require.NoError(t, err)
		oldTotal += time.Since(start)
		oldResult = result
	}
	oldAvg := oldTotal / 10

	// ============================================================
	// ЗАМЕР МЕТОДА С ВРЕМЕННОЙ ТАБЛИЦЕЙ (10 итераций)
	// ============================================================
	var tempTableTotal time.Duration
	var tempTableResult *FiltersResult
	for i := 0; i < 10; i++ {
		start := time.Now()
		result, err := testStore.GetFiltersOptimized(context.Background(), newParams)
		require.NoError(t, err)
		tempTableTotal += time.Since(start)
		tempTableResult = result
	}
	tempTableAvg := tempTableTotal / 10

	// ============================================================
	// ЗАМЕР МЕТОДА С MATERIALIZED CTE (10 итераций)
	// ============================================================
	var memoTotal time.Duration
	var memoResult *FiltersResult
	for i := 0; i < 10; i++ {
		start := time.Now()
		result, err := testStore.GetFiltersOptimizedMemo(context.Background(), newParams)
		require.NoError(t, err)
		memoTotal += time.Since(start)
		memoResult = result
	}
	memoAvg := memoTotal / 10

	// ============================================================
	// ЗАМЕР НОВОГО SQLC МЕТОДА (10 итераций)
	// ============================================================
	var sqlcTotal time.Duration
	var sqlcResult GetFiltersByNameCategoryAndTypeNewRow
	for i := 0; i < 10; i++ {
		start := time.Now()
		result, err := testStore.GetFiltersByNameCategoryAndTypeNew(context.Background(), sqlcParams)
		require.NoError(t, err)
		sqlcTotal += time.Since(start)
		sqlcResult = result
	}
	sqlcAvg := sqlcTotal / 10

	// ============================================================
	// ВЫВОД РЕЗУЛЬТАТОВ
	// ============================================================
	fmt.Println("\n========== СРАВНЕНИЕ (БЕЗ ФИЛЬТРОВ) ==========")
	fmt.Printf("📊 1. GetFiltersByNameCategoryAndType (старый):          %v\n", oldAvg)
	fmt.Printf("🚀 2. GetFiltersOptimized (временная таблица):           %v\n", tempTableAvg)
	fmt.Printf("💎 3. GetFiltersOptimizedMemo (MATERIALIZED CTE):        %v\n", memoAvg)
	fmt.Printf("🆕 4. GetFiltersByNameCategoryAndTypeNew (sqlc):         %v\n", sqlcAvg)
	fmt.Println("")

	// Находим самый быстрый
	minTime := oldAvg
	winner := "Старый метод"

	if tempTableAvg < minTime {
		minTime = tempTableAvg
		winner = "Временная таблица"
	}
	if memoAvg < minTime {
		minTime = memoAvg
		winner = "MATERIALIZED CTE"
	}
	if sqlcAvg < minTime {
		minTime = sqlcAvg
		winner = "Новый sqlc метод"
	}

	if winner == "Старый метод" {
		fmt.Printf("🏆 Самый быстрый: Старый метод (%v)\n", oldAvg)
	} else {
		speedup := float64(oldAvg) / float64(minTime)
		fmt.Printf("🏆 Самый быстрый: %s (ускорение в %.2fx против старого)\n", winner, speedup)
	}
	fmt.Println("===========================================")

	// Проверяем, что результаты не пустые
	require.NotNil(t, oldResult)
	require.NotNil(t, tempTableResult)
	require.NotNil(t, memoResult)
	require.NotNil(t, sqlcResult)

	t.Log("✅ Тест пройден успешно")
}

// TestCompareAllFiltersPerformance - сравнение производительности трёх методов
func TestCompareAllFiltersPerformance(t *testing.T) {
	// Проверяем, что есть данные
	var count int
	err := testStore.DB().QueryRow(context.Background(),
		"SELECT COUNT(*) FROM products WHERE status = 'active'").Scan(&count)
	require.NoError(t, err)

	if count == 0 {
		t.Skip("No active products in database, skipping test")
	}

	t.Logf("✅ Found %d active products", count)

	// Параметры для теста
	var typeID int32 = 1
	var categoryID int32 = 1
	name := "кроссовки"

	// Для старого метода
	oldParams := GetFiltersByNameCategoryAndTypeParams{
		Type:     pgtype.Int4{Int32: typeID, Valid: true},
		Category: pgtype.Int4{Int32: categoryID, Valid: true},
		Name:     pgtype.Text{String: name, Valid: true},
	}

	// Для новых методов
	newParams := FilterParams{
		Type:     &typeID,
		Category: &categoryID,
		Name:     &name,
		BrandID:  nil,
	}

	// Для нового sqlc метода
	sqlcParams := GetFiltersByNameCategoryAndTypeNewParams{
		Column1: typeID,
		Column2: categoryID,
		Column3: name,
	}

	// Прогрев (3 раза)
	t.Log("Warming up...")
	for i := 0; i < 3; i++ {
		_, _ = testStore.GetFiltersByNameCategoryAndType(context.Background(), oldParams)
		_, _ = testStore.GetFiltersOptimized(context.Background(), newParams)
		_, _ = testStore.GetFiltersOptimizedMemo(context.Background(), newParams)
		_, _ = testStore.GetFiltersByNameCategoryAndTypeNew(context.Background(), sqlcParams)
	}

	// ---- Замер старого метода (10 итераций) ----
	var oldTotal time.Duration
	var oldResult GetFiltersByNameCategoryAndTypeRow
	for i := 0; i < 10; i++ {
		start := time.Now()
		result, err := testStore.GetFiltersByNameCategoryAndType(context.Background(), oldParams)
		require.NoError(t, err)
		oldTotal += time.Since(start)
		oldResult = result
	}
	oldAvg := oldTotal / 10

	// ---- Замер нового метода с временной таблицей (10 итераций) ----
	var tempTableTotal time.Duration
	var tempTableResult *FiltersResult
	for i := 0; i < 10; i++ {
		start := time.Now()
		result, err := testStore.GetFiltersOptimized(context.Background(), newParams)
		require.NoError(t, err)
		tempTableTotal += time.Since(start)
		tempTableResult = result
	}
	tempTableAvg := tempTableTotal / 10

	// ---- Замер нового метода с MATERIALIZED CTE (10 итераций) ----
	var memoTotal time.Duration
	var memoResult *FiltersResult
	for i := 0; i < 10; i++ {
		start := time.Now()
		result, err := testStore.GetFiltersOptimizedMemo(context.Background(), newParams)
		require.NoError(t, err)
		memoTotal += time.Since(start)
		memoResult = result
	}
	memoAvg := memoTotal / 10

	// ---- Замер нового sqlc метода (10 итераций) ----
	var sqlcTotal time.Duration
	var sqlcResult GetFiltersByNameCategoryAndTypeNewRow
	for i := 0; i < 10; i++ {
		start := time.Now()
		result, err := testStore.GetFiltersByNameCategoryAndTypeNew(context.Background(), sqlcParams)
		require.NoError(t, err)
		sqlcTotal += time.Since(start)
		sqlcResult = result
	}
	sqlcAvg := sqlcTotal / 10

	// ---- Вывод результатов ----
	fmt.Println("\n========== СРАВНЕНИЕ ЧЕТЫРЁХ МЕТОДОВ ==========")
	fmt.Printf("📊 1. GetFiltersByNameCategoryAndType (старый):          %v\n", oldAvg)
	fmt.Printf("🚀 2. GetFiltersOptimized (временная таблица):           %v\n", tempTableAvg)
	fmt.Printf("💎 3. GetFiltersOptimizedMemo (MATERIALIZED CTE):        %v\n", memoAvg)
	fmt.Printf("🆕 4. GetFiltersByNameCategoryAndTypeNew (sqlc):         %v\n", sqlcAvg)
	fmt.Println("")

	// Находим самый быстрый
	minTime := oldAvg
	winner := "Старый метод"

	if tempTableAvg < minTime {
		minTime = tempTableAvg
		winner = "Временная таблица"
	}
	if memoAvg < minTime {
		minTime = memoAvg
		winner = "MATERIALIZED CTE"
	}
	if sqlcAvg < minTime {
		minTime = sqlcAvg
		winner = "Новый sqlc метод"
	}

	if winner == "Старый метод" {
		fmt.Printf("🏆 Самый быстрый: Старый метод (%v)\n", oldAvg)
	} else {
		speedup := float64(oldAvg) / float64(minTime)
		fmt.Printf("🏆 Самый быстрый: %s (ускорение в %.2fx против старого)\n", winner, speedup)
	}
	fmt.Println("===========================================")

	// Проверяем, что результаты не пустые
	require.NotNil(t, oldResult)
	require.NotNil(t, tempTableResult)
	require.NotNil(t, memoResult)
	require.NotNil(t, sqlcResult)

	t.Log("✅ Тест пройден успешно")
}

// TestCompareAllFiltersWithDifferentParams - тест с разными параметрами
func TestCompareAllFiltersWithDifferentParams(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping test in short mode")
	}

	var count int
	err := testStore.DB().QueryRow(context.Background(),
		"SELECT COUNT(*) FROM products WHERE status = 'active'").Scan(&count)
	require.NoError(t, err)

	if count == 0 {
		t.Skip("No active products in database")
	}

	testCases := []struct {
		name     string
		typeID   *int32
		category *int32
		search   *string
		brandID  *int32
	}{
		{
			name:     "Без фильтров",
			typeID:   nil,
			category: nil,
			search:   nil,
			brandID:  nil,
		},
		{
			name:     "Только категория",
			typeID:   nil,
			category: ptrInt32(1),
			search:   nil,
			brandID:  nil,
		},
		{
			name:     "Только тип",
			typeID:   ptrInt32(1),
			category: nil,
			search:   nil,
			brandID:  nil,
		},
		{
			name:     "Только имя",
			typeID:   nil,
			category: nil,
			search:   ptrString("кроссовки"),
			brandID:  nil,
		},
		{
			name:     "Категория + тип",
			typeID:   ptrInt32(1),
			category: ptrInt32(1),
			search:   nil,
			brandID:  nil,
		},
		{
			name:     "Категория + тип + имя",
			typeID:   ptrInt32(1),
			category: ptrInt32(1),
			search:   ptrString("кроссовки"),
			brandID:  nil,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Старый метод
			oldParams := GetFiltersByNameCategoryAndTypeParams{
				Type:     pgtype.Int4{Int32: 0, Valid: false},
				Category: pgtype.Int4{Int32: 0, Valid: false},
				Name:     pgtype.Text{String: "", Valid: false},
			}
			if tc.typeID != nil {
				oldParams.Type = pgtype.Int4{Int32: *tc.typeID, Valid: true}
			}
			if tc.category != nil {
				oldParams.Category = pgtype.Int4{Int32: *tc.category, Valid: true}
			}
			if tc.search != nil {
				oldParams.Name = pgtype.Text{String: *tc.search, Valid: true}
			}

			// Новые методы
			newParams := FilterParams{
				Type:     tc.typeID,
				Category: tc.category,
				Name:     tc.search,
				BrandID:  tc.brandID,
			}

			// Выполняем все три метода
			oldResult, err := testStore.GetFiltersByNameCategoryAndType(context.Background(), oldParams)
			require.NoError(t, err)

			tempResult, err := testStore.GetFiltersOptimized(context.Background(), newParams)
			require.NoError(t, err)

			memoResult, err := testStore.GetFiltersOptimizedMemo(context.Background(), newParams)
			require.NoError(t, err)

			// Проверяем, что все результаты не nil
			require.NotNil(t, oldResult)
			require.NotNil(t, tempResult)
			require.NotNil(t, memoResult)

			t.Logf("✅ %s: все методы вернули данные", tc.name)
		})
	}
}

// TestGetFiltersOptimized_NoFilters - без фильтров
func TestGetFiltersOptimized_NoFilters(t *testing.T) {
	params := FilterParams{
		Type:     nil,
		Category: nil,
		Name:     nil,
		BrandID:  nil,
	}

	result, err := testStore.GetFiltersOptimized(context.Background(), params)
	require.NoError(t, err)
	require.NotNil(t, result)

	// Проверяем, что есть данные
	require.Greater(t, len(result.Sizes), 0)
	require.Greater(t, len(result.Firms), 0)

	t.Logf("✅ Без фильтрации: sizes=%d, firms=%d",
		len(result.Sizes), len(result.Firms))
}

// TestGetFiltersOptimized_WithName - только по имени
func TestGetFiltersOptimized_WithName(t *testing.T) {
	name := "кроссовки"
	params := FilterParams{
		Type:     nil,
		Category: nil,
		Name:     &name,
		BrandID:  nil,
	}

	result, err := testStore.GetFiltersOptimized(context.Background(), params)
	require.NoError(t, err)
	require.NotNil(t, result)

	t.Logf("✅ Поиск по имени '%s': min_price=%d, max_price=%d",
		name, result.MinPrice, result.MaxPrice)
}

// TestGetFiltersOptimized_WithCategory - только по категории
func TestGetFiltersOptimized_WithCategory(t *testing.T) {
	var categoryID int32 = 1
	params := FilterParams{
		Type:     nil,
		Category: &categoryID,
		Name:     nil,
		BrandID:  nil,
	}

	result, err := testStore.GetFiltersOptimized(context.Background(), params)
	require.NoError(t, err)
	require.NotNil(t, result)

	t.Logf("✅ Фильтрация по категории %d: min_price=%d, max_price=%d",
		categoryID, result.MinPrice, result.MaxPrice)
}

// BenchmarkGetFiltersOptimized - бенчмарк нового метода с временной таблицей
func BenchmarkGetFiltersOptimized(b *testing.B) {
	var typeID int32 = 1
	var categoryID int32 = 1
	name := "кроссовки"

	params := FilterParams{
		Type:     &typeID,
		Category: &categoryID,
		Name:     &name,
		BrandID:  nil,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := testStore.GetFiltersOptimized(context.Background(), params)
		if err != nil {
			b.Fatal(err)
		}
	}
}

// BenchmarkGetFiltersOptimizedMemo - бенчмарк нового метода с MATERIALIZED CTE
func BenchmarkGetFiltersOptimizedMemo(b *testing.B) {
	var typeID int32 = 1
	var categoryID int32 = 1
	name := "кроссовки"

	params := FilterParams{
		Type:     &typeID,
		Category: &categoryID,
		Name:     &name,
		BrandID:  nil,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := testStore.GetFiltersOptimizedMemo(context.Background(), params)
		if err != nil {
			b.Fatal(err)
		}
	}
}

// BenchmarkGetFiltersByNameCategoryAndType - бенчмарк старого метода
func BenchmarkGetFiltersByNameCategoryAndType(b *testing.B) {
	oldParams := GetFiltersByNameCategoryAndTypeParams{
		Type:     pgtype.Int4{Int32: 1, Valid: true},
		Category: pgtype.Int4{Int32: 1, Valid: true},
		Name:     pgtype.Text{String: "кроссовки", Valid: true},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := testStore.GetFiltersByNameCategoryAndType(context.Background(), oldParams)
		if err != nil {
			b.Fatal(err)
		}
	}
}

// Вспомогательные функции
func ptrInt32(v int32) *int32 {
	return &v
}

func ptrString(v string) *string {
	return &v
}

func TestGetFiltersOptimizedMemo_OnlyCategory(t *testing.T) {
	var categoryID int32 = 1
	params := FilterParams{
		Type:     nil,
		Category: &categoryID,
		Name:     nil,
		BrandID:  nil,
	}

	result, err := testStore.GetFiltersOptimizedMemo(context.Background(), params)
	require.NoError(t, err)
	require.NotNil(t, result)

	require.GreaterOrEqual(t, result.MinPrice, int32(0))
	require.GreaterOrEqual(t, result.MaxPrice, int32(0))
	fmt.Println(result)
	t.Logf("✅ Фильтрация по категории %d: min_price=%d, max_price=%d",
		categoryID, result.MinPrice, result.MaxPrice)
}

func TestGetFiltersOptimizedMemo_OnlyCategory1(t *testing.T) {
	var categoryID int32 = 1
	params := FilterParams{
		Type:     nil,
		Category: &categoryID,
		Name:     nil,
		BrandID:  nil,
	}

	result, err := testStore.GetFiltersOptimizedMemo(context.Background(), params)
	require.NoError(t, err)
	require.NotNil(t, result)

	require.GreaterOrEqual(t, result.MinPrice, int32(0))
	require.GreaterOrEqual(t, result.MaxPrice, int32(0))
	fmt.Println(result)
	t.Logf("✅ Фильтрация по категории %d: min_price=%d, max_price=%d",
		categoryID, result.MinPrice, result.MaxPrice)
}

func TestGetFiltersOptimizedMemo_OnlyCategory2(t *testing.T) {
	// Проверяем, к какой БД подключены
	var dbName string
	err := testStore.DB().QueryRow(context.Background(), "SELECT current_database()").Scan(&dbName)
	require.NoError(t, err)
	fmt.Printf("🔍 Текущая БД: %s\n", dbName)

	// Проверяем, сколько товаров в категории 1
	var count int
	err = testStore.DB().QueryRow(context.Background(),
		"SELECT COUNT(*) FROM products WHERE category = 1 AND status = 'active'").Scan(&count)
	require.NoError(t, err)
	fmt.Printf("🔍 Товаров в категории 1: %d\n", count)

	// Теперь выполняем твой запрос
	params := FilterParams{
		Type:     nil,
		Category: ptrInt32(1),
		Name:     nil,
		BrandID:  nil,
	}

	result, err := testStore.GetFiltersOptimizedMemo(context.Background(), params)
	require.NoError(t, err)
	require.NotNil(t, result)

	fmt.Printf("🔍 MaxPrice: %d\n", result.MaxPrice)
}

func TestGetFiltersByNameCategoryAndTypeNew_Detailed(t *testing.T) {
	// Проверяем, что есть данные
	var count int
	err := testStore.DB().QueryRow(context.Background(),
		"SELECT COUNT(*) FROM products WHERE status = 'active'").Scan(&count)
	require.NoError(t, err)

	if count == 0 {
		t.Skip("No active products in database, skipping test")
	}

	t.Logf("✅ Found %d active products", count)

	// ============================================================
	// ТЕСТ 1: БЕЗ ФИЛЬТРОВ
	// ============================================================
	t.Run("Без фильтров", func(t *testing.T) {
		params := GetFiltersByNameCategoryAndTypeNewParams{
			Column1: 0,
			Column2: 0,
			Column3: "",
		}

		start := time.Now()
		result, err := testStore.GetFiltersByNameCategoryAndTypeNew(context.Background(), params)
		duration := time.Since(start)

		require.NoError(t, err)
		require.NotNil(t, result)

		t.Logf("⏱️ Время выполнения: %v", duration)
		t.Logf("📊 Sizes: %v", result.Sizes)
		t.Logf("📊 Bodytypes: %v", result.Bodytypes)
		t.Logf("📊 Firms: %v (количество: %d)", result.Firms, len(result.Firms.(map[string]interface{})))
		t.Logf("📊 MinPrice: %v", result.MinPrice)
		t.Logf("📊 MaxPrice: %v", result.MaxPrice)
		t.Logf("📊 ProductTypes: %v", result.ProductTypes)
		t.Logf("📊 DiscountRules: %v", result.DiscountRules)

		// Проверяем, что есть данные
		require.NotEmpty(t, result.Sizes)
		require.NotEmpty(t, result.Firms)
		require.Greater(t, toInt64(result.MaxPrice), int64(0))
	})

	// ============================================================
	// ТЕСТ 2: С КАТЕГОРИЕЙ
	// ============================================================
	t.Run("С категорией (category=1)", func(t *testing.T) {
		params := GetFiltersByNameCategoryAndTypeNewParams{
			Column1: 0,
			Column2: 1,
			Column3: "",
		}

		start := time.Now()
		result, err := testStore.GetFiltersByNameCategoryAndTypeNew(context.Background(), params)
		duration := time.Since(start)

		require.NoError(t, err)
		require.NotNil(t, result)

		t.Logf("⏱️ Время выполнения: %v", duration)
		t.Logf("📊 Sizes: %v", result.Sizes)
		t.Logf("📊 Bodytypes: %v", result.Bodytypes)
		t.Logf("📊 Firms: %v", result.Firms)
		t.Logf("📊 MinPrice: %v", result.MinPrice)
		t.Logf("📊 MaxPrice: %v", result.MaxPrice)

		require.NotEmpty(t, result.Sizes)
		require.NotEmpty(t, result.Firms)
		require.Greater(t, toInt64(result.MaxPrice), int64(0))
	})

	// ============================================================
	// ТЕСТ 3: С ИМЕНЕМ
	// ============================================================
	t.Run("С именем (кроссовки)", func(t *testing.T) {
		params := GetFiltersByNameCategoryAndTypeNewParams{
			Column1: 0,
			Column2: 0,
			Column3: "кроссовки",
		}

		start := time.Now()
		result, err := testStore.GetFiltersByNameCategoryAndTypeNew(context.Background(), params)
		duration := time.Since(start)

		require.NoError(t, err)
		require.NotNil(t, result)

		t.Logf("⏱️ Время выполнения: %v", duration)
		t.Logf("📊 Sizes: %v", result.Sizes)
		t.Logf("📊 Bodytypes: %v", result.Bodytypes)
		t.Logf("📊 MinPrice: %v", result.MinPrice)
		t.Logf("📊 MaxPrice: %v", result.MaxPrice)

		require.NotEmpty(t, result.Sizes)
		require.NotEmpty(t, result.Firms)
	})

	// ============================================================
	// ТЕСТ 4: ВСЕ ПАРАМЕТРЫ
	// ============================================================
	t.Run("Все параметры (type=1, category=1, name=кроссовки)", func(t *testing.T) {
		params := GetFiltersByNameCategoryAndTypeNewParams{
			Column1: 1,
			Column2: 1,
			Column3: "кроссовки",
		}

		start := time.Now()
		result, err := testStore.GetFiltersByNameCategoryAndTypeNew(context.Background(), params)
		duration := time.Since(start)

		require.NoError(t, err)
		require.NotNil(t, result)

		t.Logf("⏱️ Время выполнения: %v", duration)
		t.Logf("📊 Sizes: %v", result.Sizes)
		t.Logf("📊 Bodytypes: %v", result.Bodytypes)
		t.Logf("📊 MinPrice: %v", result.MinPrice)
		t.Logf("📊 MaxPrice: %v", result.MaxPrice)

		require.NotEmpty(t, result.Sizes)
		require.NotEmpty(t, result.Firms)
		require.Greater(t, toInt64(result.MaxPrice), int64(0))
	})

	// ============================================================
	// ТЕСТ 5: ПРОВЕРКА ТИПОВ
	// ============================================================
	t.Run("Проверка типов данных", func(t *testing.T) {
		params := GetFiltersByNameCategoryAndTypeNewParams{
			Column1: 1,
			Column2: 1,
			Column3: "кроссовки",
		}

		result, err := testStore.GetFiltersByNameCategoryAndTypeNew(context.Background(), params)
		require.NoError(t, err)

		// Проверяем типы
		t.Logf("🔍 Типы полей:")
		t.Logf("   Sizes: %T", result.Sizes)
		t.Logf("   Bodytypes: %T", result.Bodytypes)
		t.Logf("   Firms: %T", result.Firms)
		t.Logf("   ProductTypes: %T", result.ProductTypes)
		t.Logf("   MinPrice: %T", result.MinPrice)
		t.Logf("   MaxPrice: %T", result.MaxPrice)
		t.Logf("   DiscountRules: %T", result.DiscountRules)

		// Проверяем, что можно конвертировать
		var sizesMap map[string]interface{}
		switch v := result.Sizes.(type) {
		case map[string]interface{}:
			sizesMap = v
		case string:
			err := json.Unmarshal([]byte(v), &sizesMap)
			require.NoError(t, err)
		default:
			// Пробуем через Marshal
			data, err := json.Marshal(result.Sizes)
			require.NoError(t, err)
			err = json.Unmarshal(data, &sizesMap)
			require.NoError(t, err)
		}
		t.Logf("✅ Sizes успешно сконвертирован: %d записей", len(sizesMap))

		// Проверяем цены
		var minPrice, maxPrice int64
		switch v := result.MinPrice.(type) {
		case int32:
			minPrice = int64(v)
		case int64:
			minPrice = v
		case float64:
			minPrice = int64(v)
		default:
			t.Logf("⚠️ MinPrice имеет неожиданный тип: %T", result.MinPrice)
		}

		switch v := result.MaxPrice.(type) {
		case int32:
			maxPrice = int64(v)
		case int64:
			maxPrice = v
		case float64:
			maxPrice = int64(v)
		default:
			t.Logf("⚠️ MaxPrice имеет неожиданный тип: %T", result.MaxPrice)
		}

		t.Logf("✅ MinPrice: %d, MaxPrice: %d", minPrice, maxPrice)
		require.Greater(t, maxPrice, int64(0))
	})
}

// Вспомогательная функция
func toInt64(v interface{}) int64 {
	if v == nil {
		return 0
	}
	switch val := v.(type) {
	case int32:
		return int64(val)
	case int64:
		return val
	case float64:
		return int64(val)
	case int:
		return int64(val)
	default:
		return 0
	}
}

func TestGetFiltersByNameCategoryAndTypeNewWithLine_ByBrand(t *testing.T) {
	// Проверяем, что есть данные
	var count int
	err := testStore.DB().QueryRow(context.Background(),
		"SELECT COUNT(*) FROM products WHERE status = 'active'").Scan(&count)
	require.NoError(t, err)

	if count == 0 {
		t.Skip("No active products in database, skipping test")
	}

	t.Logf("✅ Found %d active products", count)

	// ============================================================
	// ТЕСТ: Передаём только бренд (Column4 = brandID)
	// ============================================================
	params := GetFiltersByNameCategoryAndTypeNewWithLineParams{
		Column1: 0,
		Column2: 0,
		Column3: "",
		Column4: 1375, // brandID = 1
	}

	start := time.Now()
	result, err := testStore.GetFiltersByNameCategoryAndTypeNewWithLine(context.Background(), params)
	duration := time.Since(start)

	require.NoError(t, err)
	require.NotNil(t, result)

	t.Logf("⏱️ Время выполнения: %v", duration)
	t.Logf("📊 Lines (только brandID=1): %v", result.Lines)
	t.Logf("📊 MinPrice: %v", result.MinPrice)
	t.Logf("📊 MaxPrice: %v", result.MaxPrice)

	// Проверяем, что есть данные
	require.NotEmpty(t, result.Sizes)
	require.NotEmpty(t, result.Lines)
	require.Greater(t, toInt64(result.MaxPrice), int64(0))
}
