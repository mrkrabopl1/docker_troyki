package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/mrkrabopl1/go_db/errorsType"
	"github.com/mrkrabopl1/go_db/types"
	"golang.org/x/crypto/bcrypt"
)

// GetSnickersHistoryComplex — история просмотров залогиненного пользователя.
// Возвращает полные данные товаров (как на карточке).
func (store *SQLStore) GetSnickersHistoryComplex(
	ctx context.Context,
	customerID int32,
) ([]types.ProductsSearchResponse1, error) {
	// 1. id товаров из истории
	productIDs, err := store.Queries.GetUserHistoryIDs(ctx, GetUserHistoryIDsParams{
		CustomerID: pgtype.Int4{Int32: customerID, Valid: true},
		Limit:      50,
	})
	if err != nil {
		return nil, err
	}
	if len(productIDs) == 0 {
		return []types.ProductsSearchResponse1{}, nil
	}

	// 2. полные данные
	snickers, err := store.Queries.GetProductsByIds(ctx, productIDs)
	if err != nil {
		return []types.ProductsSearchResponse1{}, err
	}

	// 3. восстанавливаем порядок: productIDs отсортированы по last_viewed DESC,
	//    а GetProductsByIds может вернуть в любом порядке.
	byID := make(map[int32]GetProductsByIdsRow, len(snickers))
	for _, s := range snickers {
		byID[s.GlobalID] = s // ← проверь: если у тебя ключ GlobalID, замени на s.GlobalID
	}
	ordered := make([]GetProductsByIdsRow, 0, len(productIDs))
	for _, id := range productIDs {
		if s, ok := byID[id]; ok {
			ordered = append(ordered, s)
		}
	}

	return NewProductsSearchResponse5(ordered), nil
}

func NewProductsSearchResponse5(ProductsSearch []GetProductsByIdsRow) []types.ProductsSearchResponse1 {
	list := []types.ProductsSearchResponse1{}
	for _, info := range ProductsSearch {
		var imgArr []string
		for i := 1; i < 3; i++ {
			str := "/images/" + fmt.Sprintf(info.ImagePath+"/img%d.png", i)
			imgArr = append(imgArr, str)
		}
		var discount interface{}
		if info.DiscountedPrice != 0 {
			discount = info.DiscountedPrice
		} else {
			discount = nil
		}
		list = append(list, types.ProductsSearchResponse1{
			Image:           imgArr,
			Price:           int(info.MinPrice),
			Id:              int(info.GlobalID),
			Name:            info.Name,
			Firm:            info.Firm,
			Discount:        discount,
			DiscountPercent: info.DiscountPercent,
			Article:         info.Article,
		})
	}
	return list
}

func (store *SQLStore) RegisterUser(
	ctx context.Context,
	pass string,
	mail string,
) (int32, int32, error) {
	exist, err := store.Queries.CheckMail(ctx, mail)
	if err != nil {
		return 2, 0, err
	}
	if exist {
		return 1, 0, nil
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
	if err != nil {
		return 2, 0, err
	}

	userID, err := store.Queries.CreateCustomer(ctx, CreateCustomerParams{
		Pass: hashedPassword,
		Mail: mail,
	})
	if err != nil {
		return 2, 0, err
	}

	return 0, userID, nil
}

func (store *SQLStore) VerifyUser(ctx context.Context, token string) (int32, error) {
	fmt.Println(token)
	verData, err := store.Queries.GetVerification(ctx, token)
	fmt.Println(verData, "verData")
	if err != nil {
		return 0, err
	}

	if time.Now().After(verData.Expire.Time) {
		_ = store.Queries.DeleteVerification(ctx, verData.ID)
		return 0, errorsType.ErrExpire
	}

	if err := store.Queries.DeleteVerification(ctx, verData.ID); err != nil {
		return 0, err
	}

	return verData.Customerid, nil
}

func (store *SQLStore) ChangePass(ctx context.Context, newPass string, oldPass string, id int32) error {
	realPass, err := store.Queries.GetPassword(ctx, id)
	if err != nil {
		return err
	}
	err2 := bcrypt.CompareHashAndPassword(realPass, []byte(oldPass))
	if err2 == bcrypt.ErrMismatchedHashAndPassword {
		fmt.Println("The password does not match the hash")
		return errorsType.PassCoincide
	} else if err2 != nil {
		return err2
	}
	hashedPassword, err4 := bcrypt.GenerateFromPassword([]byte(newPass), bcrypt.DefaultCost)
	if err4 != nil {
		panic(err4)
	}
	err1 := store.Queries.UpdateCustomerPass(ctx, UpdateCustomerPassParams{
		Pass: hashedPassword,
		ID:   id,
	})
	if err1 != nil {
		return err1
	}
	return nil
}

func (store *SQLStore) UpdateForgetPass(ctx context.Context, mail string) error {
	exist, err := store.Queries.CheckMail(ctx, mail)
	if err != nil {
		return err
	}
	if exist {
		// TODO
	} else {
		return errorsType.NotExist
	}
	return nil
}
