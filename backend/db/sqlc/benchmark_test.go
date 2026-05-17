package db

import (
	"context"
	"testing"
)

func BenchmarkGetProducts_SingleQuery(b *testing.B) {
	// Подготовка общих параметров (только фильтры, лимит/оффсет)
	params := GetProductsByFiltersParams{
		Limitval:   1000,
		Offsetval:  8,
		Categories: []int32{1},
		SortType:   1,
		// ... остальные пустые/нулевые
	}

	b.ResetTimer() // сбрасываем таймер после подготовки
	for i := 0; i < b.N; i++ {
		_, err := testStore.GetProductsByFilters(context.Background(), params)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkGetProducts_SeparateQueries(b *testing.B) {
	countParams := CountProductsByFiltersParams{
		Categories: []int32{1},
		// ... такие же фильтры, но без Limit/Offset/SortType
	}
	listParams := GetProductsByFiltersPaginateParams{
		Limitval:   1000,
		Offsetval:  8,
		Categories: []int32{1},
		SortType:   1,
		// ...
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		total, err := testStore.CountProductsByFilters(context.Background(), countParams)
		if err != nil {
			b.Fatal(err)
		}
		_, err = testStore.GetProductsByFiltersPaginate(context.Background(), listParams)
		if err != nil {
			b.Fatal(err)
		}
		// total можно присвоить в пустую переменную, чтобы избежать оптимизации компилятором
		_ = total
	}
}
