package db

import (
	"context"
)

func (store *SQLStore) SetSnickersHistory(ctx context.Context, idSnickers int32, idCustomer int32) error {
	history, err := store.Queries.SelectHistoryFromUniqueCustomer(ctx, idCustomer)
	if err != nil {
		return err
	}
	history = append(history, idSnickers)
	params := UpdateUniqueCustomerHistryParams{
		History: history,
		ID:      idCustomer,
	}
	err1 := store.Queries.UpdateUniqueCustomerHistry(ctx, params)
	if err1 != nil {
		return err1
	}
	return nil
}
