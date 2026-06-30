package db

import (
	"context"
	"testing"
)

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
