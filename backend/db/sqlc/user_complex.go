package db

import (
	"context"
	"fmt"
	"time"

	"github.com/mrkrabopl1/go_db/errorsType"
	"github.com/mrkrabopl1/go_db/types"
	"golang.org/x/crypto/bcrypt"
)

func (store *SQLStore) SetSnickersHistory(ctx context.Context, idSnickers int32, idCustomer int32) error {
	history, err := store.Queries.SelectHistoryFromUniqueCustomer(ctx, idCustomer)
	if err != nil {
		fmt.Println("fdkmlsfknsdkfms")
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
func int32SliceToInterface(ids []int32) []interface{} {
	args := make([]interface{}, len(ids))
	for i, v := range ids {
		args[i] = v
	}
	return args
}
func (store *SQLStore) GetSnickersHistoryComplex(ctx context.Context, idCustomer int32) ([]types.SnickersSearchResponse1, error) {
	history, err := store.Queries.SelectHistoryFromUniqueCustomer(ctx, idCustomer)
	if err != nil {
		return nil, err
	}
	list := []int32{}
	keys := make(map[int32]bool)
	for _, entry := range history {
		if _, value := keys[entry]; !value {
			keys[entry] = true
			list = append(list, entry)
		}
	}

	snickers, err1 := store.Queries.GetSnickersByIds(ctx, list)
	fmt.Println("test1")
	if err1 != nil {
		return []types.SnickersSearchResponse1{}, err1
	}

	return NewSnickersSearchResponse5(snickers), nil
}

func NewSnickersSearchResponse5(snickersSearch []GetSnickersByIdsRow) []types.SnickersSearchResponse1 {

	list := []types.SnickersSearchResponse1{}
	for _, info := range snickersSearch {
		var imgArr []string
		for i := 1; i < 3; i++ {
			str := "images/" + fmt.Sprintf(info.ImagePath+"/img%d.png", i)
			imgArr = append(imgArr, str)
		}
		var discount interface{}
		if info.Maxdiscprice.Int32 != 0 {
			discount = info.Maxdiscprice.Int32
		} else {
			discount = nil
		}
		list = append(list, types.SnickersSearchResponse1{
			Image:    imgArr,
			Price:    100, //int(info.Minprice),
			Id:       int(info.ID),
			Name:     info.Name,
			Firm:     info.Firm,
			Discount: discount,
		})

	}

	return list
}

func (store *SQLStore) RegisterUser(ctx context.Context, pass string, mail string) (int32, error) {
	exist, err := store.Queries.CheckMail(ctx, mail)

	if err != nil {
		return 0, err
	}
	if exist {
		return 1, nil
	} else {
		// hashedPassword, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
		// if err != nil {
		// 	return 0, err
		// }
		// fmt.Println(string(hashedPassword))
		// userId, err1 := store.Queries.CreateCustomer(ctx, CreateCustomerParams{
		// 	Pass: []byte(pass),
		// 	Mail: mail,
		// })

		// if err1 != nil {
		// 	return 0, err1
		// }

		// message, token := createVerifyingString()

		// err3 := sendMail(message)
		// if err3 != nil {
		// 	return 0, err3
		// } else {
		// 	setVerification(db, ctx, token, userID)
		// }
		return 2, nil
	}
}
func (store *SQLStore) VerifyUser(ctx context.Context, token string) (int32, error) {
	verData, err := store.Queries.GetVerification(ctx, token)
	if err != nil {
		return 0, err
	}
	if time.Now().After(verData.Expire.Time) {
		return verData.Customerid, errorsType.ErrExpire
	}

	err1 := store.Queries.DeleteVerification(ctx, verData.ID)
	if err != nil {
		return 0, err1
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
		// id, err := store.Queries.GetCustomerId(ctx, mail)
		// if err != nil {
		// 	return err
		// } else {
		// 	message, token := createChangeForgetPass()
		// 	err := sendMail(message)
		// 	if err != nil {
		// 		return err
		// 	} else {
		// 		setVerification(db, ctx, token, int(id))
		// 	}
		// }
	} else {
		return errorsType.NotExist
	}

	return nil
}
