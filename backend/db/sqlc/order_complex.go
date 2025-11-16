package db

import (
	"context"
	"database/sql"
	"errors"
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
	fmt.Println(id, "preorderId")
	id1, err1 := q.GetFullPreorderCount(ctx, id)
	fmt.Println(id1, "preorderCount")
	if err1 != nil {
		return 0, err1
	}
	return int32(id1.(int64)), nil

}

func (q *Queries) UpdatePreorder(ctx context.Context, id int32, size string, price int32, name string, image_path string, hash string) (int32, error) {
	orderId, err := q.GetPreorderIdByHashUrl(ctx, hash)
	fmt.Println(orderId, "orderId", err)
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

	fmt.Println(quantity, "quantity", err1)

	if errors.Is(err1, sql.ErrNoRows) {
		_, err2 := q.InsertPreorderItem(ctx, InsertPreorderItemParams{
			Orderid: orderId,
			Size: pgtype.Text{
				String: size,
				Valid:  true, // Mark as valid (not NULL)
			},
			Productid: id,
			Price:     price,
			Name:      name,
			ImagePath: image_path,
		})
		if err2 != nil {
			fmt.Println(err2)
		}
		return 1, nil
	} else if err1 != nil {
		panic(err1)
	} else {
		err := q.UpdatePreorderItems(ctx, UpdatePreorderItemsParams{
			Quantity: quantity + 1,
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

func (q *Queries) CreatePreorder(ctx context.Context, id int32, size string, price int32, name string, image_path string) (string, error) {
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
	_, err2 := q.InsertPreorderItem(ctx, InsertPreorderItemParams{
		Orderid: orderId,
		Size: pgtype.Text{
			String: size,
			Valid:  true, // Mark as valid (not NULL)
		},
		Productid: id,
		Price:     price,
		Name:      name,
		ImagePath: image_path,
	})
	if err2 != nil {
		fmt.Println(err2)
		return "", err2
	}
	return fmt.Sprint(hashedStr), nil
}

type Delivery struct {
	DeliveryPrice int          `json:"deliveryPrice"`
	Type          DeliveryEnum `json:"type"`
}
type CreateOrderType struct {
	PreorderHash string             `json:"preorderHash"`
	PersonalData types.PersonalData `json:"personalData"`
	Address      types.Address      `json:"address"`
	Delivery     Delivery           `json:"delivery"`
	Save         bool               `json:"save"`
}

type OrderItemJSON struct {
	ProductID int32  `json:"product_id"`
	Quantity  int32  `json:"quantity"`
	Size      string `json:"size"`
}

func (store *SQLStore) CreateOrder(ctx context.Context, orderData *CreateOrderType) (int32, int32, string, error) {
	fmt.Println(orderData, "orderData in createOrder")
	userId, err := store.Queries.SetUnregisterCustomer(ctx, SetUnregisterCustomerParams{
		Name: orderData.PersonalData.Name,
		Secondname: pgtype.Text{
			String: orderData.PersonalData.SecondName,
		},
		Mail:  orderData.PersonalData.Mail,
		Phone: orderData.PersonalData.Phone,
	})
	fmt.Println(pgtype.Int4{
		Int32: userId,
	}, "addressId", "f;s;dkflsdknflsdk", err)
	if err != nil {
		return 0, 0, "", err
	}

	fmt.Println("testpreorderId")
	currentTime := time.Now()
	hashedStr := fmt.Sprint(xxhash.Sum64([]byte((currentTime.String() + fmt.Sprint(orderData.PreorderHash)))))
	orderId, err1 := store.Queries.InsertOrder(ctx, InsertOrderParams{
		Status:        StatusEnumPending,
		Deliveryprice: int32(orderData.Delivery.DeliveryPrice),
		Deliverytype:  orderData.Delivery.Type,
		Unregistercustomerid: pgtype.Int4{
			Int32: userId,
			Valid: true,
		},
		Hash: hashedStr,
	})
	fmt.Println(orderId, "testpreorderId", err1)
	if err1 != nil {
		return 0, 0, "", err1
	}
	if orderData.Delivery.Type != DeliveryEnumOwn {
		_, err9 := store.Queries.SetOrderAddress(ctx, SetOrderAddressParams{
			Town: orderData.Address.Town,
			Street: pgtype.Text{
				String: orderData.Address.Street,
				Valid:  true,
			},
			Region: pgtype.Text{
				String: orderData.Address.Region,
				Valid:  true,
			},
			Index: orderData.Address.Index,
			House: pgtype.Text{
				String: orderData.Address.House,
			},
			Flat: pgtype.Text{
				String: orderData.Address.Flat,
			},
			Coordinates: orderData.Address.Coordinates,
			Orderid:     orderId,
		})
		fmt.Println(pgtype.Int4{
			Int32: userId,
		}, "addressId", "f;s;dkflsdknflsdk", err9)
	}
	preorderId, err2 := store.Queries.GetPreorderIdByHashUrl(ctx, orderData.PreorderHash)
	fmt.Println(preorderId, "preorderId", orderData.PreorderHash, err2)
	if err2 != nil {
		return 0, 0, "", err2
	}
	prData, err3 := store.Queries.GetPreorderDataById(ctx, preorderId)
	fmt.Println(prData, err3, "ccccccccccccccccccccccccc")
	if err3 != nil {
		return 0, 0, "", err3
	}

	// Подготавливаем массивы для UNNEST
	productIDs := make([]int32, len(prData))
	quantities := make([]int32, len(prData))
	sizes := make([]string, len(prData))
	prices := make([]int32, len(prData))       // если есть price
	image_paths := make([]string, len(prData)) // если есть image_path
	names := make([]string, len(prData))       // если есть name

	for i, item := range prData {
		productIDs[i] = item.ID
		quantities[i] = item.Quantity
		sizes[i] = item.Size.String
		image_paths[i] = item.ImagePath
		names[i] = item.Name
		prices[i] = item.Price
	}

	// Используем UNNEST версию
	err4 := store.Queries.InsertManyOrderItems(ctx, InsertManyOrderItemsParams{
		ProductIds: productIDs,
		Quantities: quantities,
		Sizes:      sizes,
		Prices:     prices, // если есть price
		Names:      names,
		ImagePaths: image_paths,
		OrderID:    orderId,
	})
	if err4 != nil {
		fmt.Println(err4, "error in InsertManyOrderItems", prData)
		return 0, 0, "", err4
	}
	if err4 != nil {
		fmt.Println(err4, "error in InsertManyPreorderItems", prData)
		return 0, 0, "", err4
	}
	err5 := store.Queries.DeleteCartData(ctx, preorderId)
	if err5 != nil {
		fmt.Println(err5, "error in InsertManyPreorderItems", prData)
		return 0, 0, "", err5
	}

	return orderId, userId, hashedStr, nil
}

type GetOrderData struct {
	UserInfo     GetUnregisterCustomerRow
	State        string
	SnickersCart []GetOrderDataByIdRow
	OrderId      int
	Address      GetOrderAddressByIdRow
}

func (store *SQLStore) GetOrderData(ctx context.Context, hash string) (GetOrderData, error) {

	orderInfo, err := store.Queries.GetOrder(ctx, hash)

	if err != nil {
		return GetOrderData{}, err
	} else {
		snickers, err := store.GetOrderDataById(ctx, orderInfo.ID)
		if err != nil {
			fmt.Println(err, "error in GetOrderDataById")
			return GetOrderData{}, err
		}
		var address GetOrderAddressByIdRow
		if orderInfo.Deliverytype != DeliveryEnumOwn {
			address, err = store.GetOrderAddressById(ctx, orderInfo.ID)

			if err != nil {
				fmt.Println(err, "error in GetOrderAddressById")
				return GetOrderData{}, err
			}
		}

		if orderInfo.Unregistercustomerid.Valid {
			unregData, err1 := store.Queries.GetUnregisterCustomer(ctx, orderInfo.Unregistercustomerid.Int32)
			if err1 != nil {
				fmt.Println(err1, "error in GetUnregisterCustomer")
				return GetOrderData{}, err1
			}
			return GetOrderData{
				State:        string(orderInfo.Status),
				UserInfo:     unregData,
				SnickersCart: snickers,
				OrderId:      int(orderInfo.ID),
				Address:      address,
			}, nil

		} else {
			return GetOrderData{}, err
		}
	}
}
func (store *SQLStore) GetCartData(ctx context.Context, hash string) ([]GetPreorderDataByIdRow, error) {

	prId, err := store.GetPreorderIdByHashUrl(ctx, hash)
	if err != nil {
		fmt.Println("Error getting preorder ID:", err)
		return nil, err
	} else {
		prData, err := store.GetPreorderDataById(ctx, prId)

		if err != nil {
			fmt.Println("Error getting preorder data:", err)
			return nil, err
		}
		return prData, nil

	}
}

func (store *SQLStore) GetCartDataFromOrderByHash(ctx context.Context, hash string) ([]GetOrderDataByIdRow, error) {
	orderId, err := store.Queries.GetOrderIdByHashUrl(ctx, hash)
	if err != nil {
		return nil, err
	}
	snickers, err1 := store.GetOrderDataById(ctx, orderId)
	if err1 != nil {
		return nil, err1
	}
	return snickers, nil
}

func (store *SQLStore) GetCartDataFromPreorderByHash(ctx context.Context, hash string) ([]GetOrderDataByIdRow, error) {
	orderId, err := store.Queries.GetPreorderIdByHashUrl(ctx, hash)
	if err != nil {
		return nil, err
	}
	snickers, err1 := store.GetOrderDataById(ctx, orderId)
	if err1 != nil {
		return nil, err1
	}
	return snickers, nil
}

type OrderDataResp struct {
	UserInfo     GetUnregisterCustomerRow `json:"userInfo"`
	State        StatusEnum               `json:"state"`
	CartResponse []GetOrderDataByIdRow    `json:"cartResponse"`
	OrderId      int32                    `json:"orderId"`
	Address      types.Address            `json:"address"`
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
			snickers, err := store.GetOrderDataById(ctx, orderInfo.ID)
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

func NewProductsSearchResponse3(ProductsSearch []GetProductsWithDiscountRow) []types.ProductsSearchResponse1 {

	list := []types.ProductsSearchResponse1{}
	for _, info := range ProductsSearch {
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
		list = append(list, types.ProductsSearchResponse1{
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
