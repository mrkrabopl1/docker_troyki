package api

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/types"
	"github.com/mrkrabopl1/go_db/worker"
)

type PreorderType struct {
	Id         int32  `json:"id"`
	Size       string `json:"size"`
	Price      int32  `json:"price"`
	Name       string `json:"name"`
	Image_path string `json:"image_path"`
}
type UpdataPreorderType struct {
	PreorderType
	HashUrl string `json:"hashUrl"`
}

func (s *Server) handleCreatePreorder(ctx *gin.Context) {
	var preorderData PreorderType
	if err := ctx.BindJSON(&preorderData); err != nil {
		fmt.Println(err, "error in preorder")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	fmt.Println(preorderData, "fkdsmflkdsnflsdnlfnsdlfndslkfnldsknf")

	hashUrl, err := s.store.CreatePreorder(ctx, preorderData.Id, preorderData.Size, preorderData.Price, preorderData.Name, preorderData.Image_path)

	if err != nil {
		//log.WithCaller().Err(err)
		fmt.Println(err)
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	// Print the result and the time taken

	myCookie, err := s.tokenMaker.CreateCookie(hashUrl, "cart", 36000, false, true)
	fmt.Println(myCookie)

	if err != nil {
		//log.WithCaller().Err(err)
		fmt.Println(err, "coockieError")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	fmt.Println(myCookie, "myCookie")
	ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge, myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)

	data := hashUrl
	ctx.JSON(http.StatusOK, data)
}

func (s *Server) handleCreateOrder(ctx *gin.Context) {
	var orderData db.CreateOrderType
	if err := ctx.BindJSON(&orderData); err != nil {
		fmt.Println(err, "f,;dslf;sd")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	orderID, unregUserId, hash, err := s.store.CreateOrder(ctx, &orderData)

	if err != nil {
		fmt.Println(err, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Создаем запись в order_events о создании заказа
	go func() {
		ctxBg := context.Background()

		eventParams := db.CreateOrderEventParams{
			OrderID:       orderID,
			EventType:     "status_change",
			OldStatus:     pgtype.Text{Valid: false}, // Первый статус - не было предыдущего
			NewStatus:     pgtype.Text{String: "pending", Valid: true},
			ChangedByType: "system", // Создан системой автоматически
			Reason:        pgtype.Text{String: "Order created", Valid: true},
		}

		if err := s.store.CreateOrderEvent(ctxBg, eventParams); err != nil {
			fmt.Printf("Failed to create order event for order %d: %v\n", orderID, err)
		}
	}()

	// Устанавливаем куки
	ctx.SetCookie("cart", "", -1, "/", "", false, true)
	myCookie, _ := s.tokenMaker.CreateCookie(hash, hash, 36000, false, true)
	ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge, myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)

	if orderData.Save {
		myCookie, _, err := s.tokenMaker.CreateCookieWithPasetoToken(unregUserId, "saved", 2*time.Hour, true, true)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, errorResponse(err))
			return
		}
		fmt.Println("set cccccccccccccccccccccccccccccooooooooooooooooockie")
		ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge, myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)
	}

	// Подготавливаем данные для email
	data := map[string]interface{}{
		"hash": hash,
	}

	fmt.Println("maybe good")
	fmt.Printf("orderData: %v\n", orderData)
	fmt.Printf("Sending task with email: %s\n", orderData.PersonalData.Mail)
	fmt.Printf("Delivery price: %v\n", orderData.Address.Flat)
	fmt.Printf("DeliveryType: %v\n", orderData.Delivery.Type)

	data1 := worker.PayloadSendOrderEmail{
		Email:        orderData.PersonalData.Mail,
		Name:         orderData.PersonalData.Name,
		Phone:        orderData.PersonalData.Phone,
		Town:         orderData.Address.Town,
		Street:       orderData.Address.Street,
		Index:        orderData.Address.Index,
		House:        orderData.Address.House,
		Flat:         orderData.Address.Flat,
		OrderPrice:   orderData.Delivery.DeliveryPrice,
		DeliveryType: orderData.Delivery.Type,
		SecondName:   orderData.PersonalData.SecondName,
	}

	fmt.Printf("Deliveryww price: %v\n", data1)

	err = s.taskDistributor.DistributeTaskSendOrderEmail(ctx, &data1)
	if err != nil {
		fmt.Println(err, "error in taskDistributor")
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, data)
}

func (s *Server) handleUpdatePreorder(ctx *gin.Context) {
	cookie, err := ctx.Cookie("cart")
	fmt.Println(err, "fkmdslkfsdlkfms")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	fmt.Println("yes")
	var preorderData UpdataPreorderType
	if err := ctx.BindJSON(&preorderData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	fmt.Println("yes1", preorderData)
	quantity, _ := s.store.UpdatePreorder(ctx, preorderData.Id, preorderData.Size, preorderData.Price, preorderData.Name, preorderData.Image_path, cookie)
	fmt.Println("yes3", quantity)
	// Print the result and the time taken

	ctx.JSON(http.StatusOK, quantity)
}
func (s *Server) handleGetCartCount(ctx *gin.Context) {

	cookie, err := ctx.Cookie("cart")
	if err != nil {
		fmt.Println(err, "error")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	fmt.Println(cookie, "cookie")
	quantity, err := s.store.GetCartCount(ctx, cookie)

	if err != nil {
		//log.WithCaller().Err(err)
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	//log.InfoFields(fmt.Sprintf("count %d", quantity))

	ctx.JSON(http.StatusOK, quantity)
}

func (s *Server) handleGetCart(ctx *gin.Context) {
	hashUrl := ctx.Query("hash")

	fmt.Println(hashUrl, "lfd;lfm;dslmf;dsmf;dsmf;lsdlf,;dslf;ldfsd;mf;lsdmf;sd")

	cartData, err := s.store.GetCartData(ctx, hashUrl)
	if err != nil {
		fmt.Println(err, "fdkjsbfdks")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, cartData)
}

func (s *Server) handleGetCartFromOrder(ctx *gin.Context) {
	hashUrl := ctx.Query("hash")

	cartData, err := s.store.GetCartDataFromOrderByHash(ctx, hashUrl)
	fmt.Println(cartData)

	if err != nil {
		// log.WithCaller().Err(err).Msg("")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	// log.Log.Info().Interface("snickers", responseData)
	// log.Log.Info().Msg("snickers")

	ctx.JSON(http.StatusOK, cartData)
}

func (s *Server) handleGetOrderDataByHash(ctx *gin.Context) {
	hashUrl := ctx.Query("hash")
	_, errC := ctx.Cookie(hashUrl)
	if errC != nil {
		if errC == http.ErrNoCookie {
			fmt.Println("0 codsad")
			ctx.JSON(http.StatusOK, 0)
			return
		} else {
			panic(errC)
		}
	}
	orderData, err := s.store.GetOrderData(ctx, hashUrl)

	orderResponse := orderResponseFunc(orderData)

	if err != nil {
		//log.WithCaller().Err(err)
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	//log.Log.Info().Interface("orders", orderResponse)
	ctx.JSON(http.StatusOK, orderResponse)
}

type FullCartRespone struct {
	CartData []db.GetOrderDataByIdRow `json:"cartData"`
	FullPice int                      `json:"fullPrice"`
}
type OrderDataResp struct {
	UserInfo types.UnregisterCustomerResponse `json:"userInfo"`
	State    string                           `json:"state"`
	OrderId  int                              `json:"orderId"`
	Address  db.GetOrderAddressByIdRow        `json:"address"`
	CartData []db.GetOrderDataByIdRow         `json:"cartData"`
}

func orderResponseFunc(orderData db.GetOrderData) OrderDataResp {
	var orderResponse OrderDataResp
	customerInfo := orderData.UserInfo
	orderAddress := orderData.Address
	cartData := orderData.SnickersCart
	data := types.UnregisterCustomerResponse{
		Name:       customerInfo.Name,
		SecondName: customerInfo.Secondname.String,
		Mail:       customerInfo.Mail,
		Phone:      customerInfo.Phone,
	}

	orderResponse.UserInfo = data
	orderResponse.State = orderData.State
	orderResponse.CartData = cartData
	orderResponse.OrderId = orderData.OrderId
	orderResponse.Address = orderAddress
	return orderResponse
}

type OrderDataResp1 struct {
	UserInfo     types.UnregisterCustomerResponse `json:"userInfo"`
	State        db.StatusEnum                    `json:"state"`
	CartResponse types.FullCartRespone            `json:"cartResponse"`
	OrderId      int                              `json:"orderId"`
	Address      types.Address                    `json:"address"`
	CartData     []db.GetOrderDataByIdRow         `json:"cartData"`
}

func (s *Server) handleGetOrderDataByMail(ctx *gin.Context) {
	fmt.Println("1faaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
	var orderReq types.OrderRequest
	if err := ctx.BindJSON(&orderReq); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	orderData, hash, err := s.store.GetOrderDataByMail(ctx, orderReq.Mail, orderReq.OrderId)

	orderResponse := orderResponseFunc1(orderData)

	if err != nil {
		//log.WithCaller().Err(err1).Msg("error")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	myCookie, _ := s.tokenMaker.CreateCookie(hash, hash, 360000, true, true)
	ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge, myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)
	//log.Log.Info().Interface("orders", orderResponse)
	ctx.JSON(http.StatusOK, orderResponse)
}

func (s *Server) handleDeleteCartData(ctx *gin.Context) {
	var data types.DeleteCartData
	if err := ctx.BindJSON(&data); err != nil {
		fmt.Println(err, "error in delete cart data", data)
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	err := s.store.DeleteCartData(ctx, data.PreorderId)

	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
}

func orderResponseFunc1(orderData db.OrderDataResp) OrderDataResp1 {
	var orderResponse OrderDataResp1
	customerInfo := orderData.UserInfo
	data := types.UnregisterCustomerResponse{
		Name:       customerInfo.Name,
		SecondName: customerInfo.Secondname.String,
		Mail:       customerInfo.Mail,
		Phone:      customerInfo.Phone,
	}

	orderResponse.UserInfo = data
	orderResponse.State = orderData.State
	orderResponse.CartData = orderData.CartResponse
	orderResponse.OrderId = int(orderData.OrderId)
	orderResponse.Address = orderData.Address

	return orderResponse
}
