package db

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/cespare/xxhash"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/mrkrabopl1/go_db/types"
)

func (q *Queries) GetCartCount(ctx context.Context, hash string) (int32, error) {
	id, err := q.GetPreorderIdByHashUrl(ctx, hash)
	if err != nil {
		return 0, err
	}
	id1, err1 := q.GetFullPreorderCount(ctx, id)
	if err1 != nil {
		return 0, err1
	}
	return id1.(int32), nil

}

func (q *Queries) UpdatePreorder(ctx context.Context, id int32, size string, hash string) (int32, error) {
	orderId, err := q.GetPreorderIdByHashUrl(ctx, hash)
	if err != nil {
		return 0, err
	}
	quantity, err1 := q.SelectQuantityFromPreorderItems(ctx, SelectQuantityFromPreorderItemsParams{
		Orderid: orderId,
		Size: pgtype.Text{
			String: size,
			Valid:  true, // Mark as valid (not NULL)
		},
		Productid: id,
	})

	if err1 == sql.ErrNoRows {
		_, err2 := q.InsertPreorderItems(ctx, InsertPreorderItemsParams{
			Orderid: orderId,
			Size: pgtype.Text{
				String: size,
				Valid:  true, // Mark as valid (not NULL)
			},
			Productid: id,
		})
		if err2 != nil {
			fmt.Println(err2)
		}
		return 1, nil
	} else if err1 != nil {
		panic(err1)
	} else {
		err := q.UpdatePreorderItems(ctx, UpdatePreorderItemsParams{
			Quantity: quantity,
			Orderid:  orderId,
			Size: pgtype.Text{
				String: size,
				Valid:  true, // Mark as valid (not NULL)
			},
			Productid: id,
		})
		if err != nil {
			return 0, err
		}

		return quantity, nil
	}

}

func (q *Queries) CreatePreorder(ctx context.Context, id int32, size string) (string, error) {
	currentTime := time.Now()

	hashedStr := xxhash.Sum64([]byte((currentTime.String() + fmt.Sprint(id))))
	orderId, err := q.InsertPreorder(ctx, InsertPreorderParams{
		Hashurl: fmt.Sprint(hashedStr),
		Updatetime: pgtype.Date{
			Time: currentTime,
		},
	})
	if err != nil {
		return "", err
	}
	_, err2 := q.InsertPreorderItems(ctx, InsertPreorderItemsParams{
		Orderid: orderId,
		Size: pgtype.Text{
			String: size,
			Valid:  true, // Mark as valid (not NULL)
		},
		Productid: id,
	})
	if err2 != nil {
		fmt.Println(err2)
		return "", err2
	}
	return fmt.Sprint(hashedStr), nil
}
func (store *SQLStore) CreateOrder(ctx context.Context, orderData *types.CreateOrderType) (int32, int32, string, error) {
	userId, err := store.Queries.SetUnregisterCustomer(ctx, SetUnregisterCustomerParams{
		Name: orderData.PersonalData.Name,
		Secondname: pgtype.Text{
			String: orderData.PersonalData.SecondName,
		},
		Mail:   orderData.PersonalData.Mail,
		Phone:  orderData.PersonalData.Phone,
		Town:   orderData.Address.Town,
		Street: orderData.Address.Street,
		Region: orderData.Address.Region,
		Index:  orderData.Address.Index,
		House: pgtype.Text{
			String: orderData.Address.House,
		},
		Flat: pgtype.Text{
			String: orderData.Address.Flat,
		},
	})
	if err != nil {
		return 0, 0, "", err
	}
	currentTime := time.Now()
	hashedStr := fmt.Sprint(xxhash.Sum64([]byte((currentTime.String() + fmt.Sprint(orderData.PreorderId)))))
	orderId, err1 := store.Queries.InsertOrder(ctx, InsertOrderParams{
		Orderdate: pgtype.Date{
			Time: currentTime,
		},
		Status:        StatusEnumPending,
		Deliveryprice: int32(orderData.Delivery.DeliveryPrice),
		Deliverytype:  DeliveryEnumOwn,
		Unregistercustomerid: pgtype.Int4{
			Int32: userId,
		},
		Hash: hashedStr,
	})
	if err1 != nil {
		return 0, 0, "", err1
	}
	preorderId, err2 := store.Queries.GetPreorderIdByHashUrl(ctx, orderData.PreorderId)
	if err2 != nil {
		return 0, 0, "", err2
	}
	prData, err3 := store.Queries.GetPreorderDataById(ctx, preorderId)
	if err3 != nil {
		return 0, 0, "", err3
	}
	err4 := store.Queries.InsertManyPreorderItems(ctx, prData, int(orderId))
	if err4 != nil {
		return 0, 0, "", err4
	}
	err5 := store.Queries.DeleteCartData(ctx, preorderId)
	if err5 != nil {
		return 0, 0, "", err5
	}

	return orderId, userId, hashedStr, nil
}

type GetOrderData struct {
	UserInfo     GetUnregisterCustomerRow
	State        string
	SnickersCart []types.SnickersCart
	OrderId      int
}

func (store *SQLStore) GetOrderData(ctx context.Context, hash string) (GetOrderData, error) {

	orderInfo, err := store.Queries.GetOrder(ctx, hash)

	if err != nil {
		return GetOrderData{}, err
	} else {
		snickers, err := store.GetCartDataFromOrderById(ctx, orderInfo.ID)
		if err != nil {
			return GetOrderData{}, err
		}
		if orderInfo.Unregistercustomerid.Valid {
			unregData, err1 := store.Queries.GetUnregisterCustomer(ctx, orderInfo.Unregistercustomerid.Int32)
			if err1 != nil {
				return GetOrderData{}, err1
			}
			return GetOrderData{
				State:        string(orderInfo.Status),
				UserInfo:     unregData,
				SnickersCart: snickers,
				OrderId:      int(orderInfo.ID),
			}, nil

		} else {
			return GetOrderData{}, err
		}
	}
}
func (store *SQLStore) GetCartData(ctx context.Context, hash string) ([]types.SnickersCart, error) {
	var dataQuery []types.SnickersCart
	prId, err := store.GetPreorderIdByHashUrl(ctx, hash)
	if err != nil {
		return dataQuery, err
	} else {
		prData, err := store.GetPreorderDataById(ctx, prId)
		if err != nil {
			return dataQuery, err
		} else {
			data, err := store.GetSnickersPreorderData(ctx, prData)
			if err != nil {
				return dataQuery, err
			}
			return data, nil
		}

	}
}

func (store *SQLStore) GetCartDataFromOrderById(ctx context.Context, id int32) ([]types.SnickersCart, error) {
	orderData, err := store.Queries.GetOrderDataById(ctx, pgtype.Int4{Int32: id})
	if err != nil {
		return []types.SnickersCart{}, err
	}
	snickersOrder, err1 := store.GetSnickersOrderData(ctx, orderData)
	if err1 != nil {
		return []types.SnickersCart{}, err
	}
	return snickersOrder, nil
}
func (store *SQLStore) GetCartDataFromOrderByHash(ctx context.Context, hash string) ([]types.SnickersCart, error) {
	orderId, err := store.Queries.GetOrderIdByHashUrl(ctx, hash)
	if err != nil {
		return []types.SnickersCart{}, err
	}
	snickers, err1 := store.GetCartDataFromOrderById(ctx, orderId)
	if err1 != nil {
		return []types.SnickersCart{}, err1
	}
	return snickers, nil
}

type OrderDataResp struct {
	UserInfo     GetUnregisterCustomerRow `json:"userInfo"`
	State        StatusEnum               `json:"state"`
	CartResponse []types.SnickersCart     `json:"cartResponse"`
	OrderId      int32                    `json:"orderId"`
}

func (store *SQLStore) GetOrderDataByMail(ctx context.Context, mail string, id int32) (OrderDataResp, string, error) {

	var orderData OrderDataResp
	orderInfo, err := store.Queries.GetOrderById(ctx, id)
	if err != nil {
		return orderData, "", err
	} else {
		var exist bool
		exist, err := store.Queries.CheckCustomerExistence(ctx, CheckCustomerExistenceParams{
			ID:   orderInfo.Unregistercustomerid.Int32,
			Mail: mail,
		})
		if err != nil {
			return orderData, "", err
		}
		if !exist {
			return orderData, "", err
		} else {
			unregisterCustomerData, err := store.Queries.GetUnregisterCustomer(ctx, orderInfo.Unregistercustomerid.Int32)
			snickers, err := store.GetCartDataFromOrderById(ctx, orderInfo.ID)
			if err != nil {
				return orderData, "", err
			}
			orderData.State = StatusEnumPending
			orderData.UserInfo = unregisterCustomerData
			orderData.OrderId = orderInfo.ID
			orderData.CartResponse = snickers
			return orderData, orderInfo.Hash, nil
		}
	}
}

func NewSnickersSearchResponse3(snickersSearch []GetSnickersWithDiscountRow) []types.SnickersSearchResponse1 {

	list := []types.SnickersSearchResponse1{}
	for _, info := range snickersSearch {
		var imgArr []string
		for i := 1; i < 3; i++ {
			str := fmt.Sprintf(info.ImagePath+"/%d.jpg", i)
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
			Price:    int(info.Minprice),
			Id:       int(info.ID),
			Name:     info.Name,
			Firm:     info.Firm,
			Discount: discount,
		})

	}

	return list
}
