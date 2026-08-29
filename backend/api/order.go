package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
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

	myCookie, err := s.tokenMaker.CreateCookie(hashUrl, "cart", 36000, false, false)
	if err != nil {
		fmt.Println(err, "cookieError")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Устанавливаем cookie
	ctx.SetCookie(
		myCookie.Name,
		myCookie.Value,
		int(myCookie.MaxAge),
		myCookie.Path,
		myCookie.Domain,
		myCookie.Secure,
		myCookie.HttpOnly,
	)

	// ПРОВЕРКА: выводим заголовки ответа
	fmt.Println("Set-Cookie header:", ctx.Writer.Header().Get("Set-Cookie"))
	fmt.Println("All response headers:", ctx.Writer.Header())
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

	// === ОБРАБОТКА ПРОМОКОДА ===
	var promoCodeID *int32
	var promoDiscountAmount int
	var appliedPromoCode string
	var promoCodeSnapshot map[string]interface{}

	if orderData.PromoCodeID != nil && *orderData.PromoCodeID > 0 {
		// Получаем промокод по ID для проверки лимита
		promoCode, err := s.store.GetPromoCodeByID(ctx.Request.Context(), *orderData.PromoCodeID)
		if err != nil {
			fmt.Printf("Promo code not found by ID: %d\n", *orderData.PromoCodeID)
			ctx.JSON(http.StatusBadRequest, gin.H{
				"error": "Promo code not found",
			})
			return
		}

		// Проверяем активность
		if !promoCode.IsActive.Bool {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"error": "Promo code is not active",
			})
			return
		}

		// Проверяем даты
		now := time.Now()
		if promoCode.StartsAt.Valid && promoCode.StartsAt.Time.After(now) {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"error": "Promo code not yet active",
			})
			return
		}
		if promoCode.EndsAt.Valid && promoCode.EndsAt.Time.Before(now) {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"error": "Promo code expired",
			})
			return
		}

		// Проверяем лимит использований
		usageCount := promoCode.UsageCount
		usageLimit := promoCode.UsageLimit.Int32

		if usageLimit > 0 && usageCount >= int64(usageLimit) {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("Promo code usage limit exceeded (%d/%d)", usageCount, usageLimit),
			})
			return
		}

		// Всё хорошо - применяем промокод
		promoCodeID = &promoCode.ID
		promoDiscountAmount = orderData.PromoDiscount
		appliedPromoCode = promoCode.Code

		// === СОХРАНЯЕМ СНАПШОТ ПРОМОКОДА ===
		promoCodeSnapshot = map[string]interface{}{
			"code":              promoCode.Code,
			"discount_type":     promoCode.DiscountType,
			"discount_value":    promoCode.DiscountValue,
			"max_discount":      promoCode.MaxDiscount,
			"min_order":         promoCode.MinOrder,
			"max_order":         promoCode.MaxOrder,
			"matching_products": orderData.MatchingProducts,
			"per_user_limit":    promoCode.PerUserLimit,
			"usage_limit":       promoCode.UsageLimit,
		}

		fmt.Printf("Promo code validated: %s (ID: %d), usage: %d/%d\n",
			appliedPromoCode, promoCode.ID, usageCount, usageLimit)
	}

	orderID, unregUserId, hash, err := s.store.CreateOrderWithStockUpdate(ctx, &orderData)

	if err != nil {
		fmt.Println(err, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// === СОХРАНЯЕМ ИСПОЛЬЗОВАНИЕ ПРОМОКОДА С СНАПШОТОМ ===
	if promoCodeID != nil {
		go func() {
			ctxBg := context.Background()

			// Преобразуем снапшот в JSON
			snapshotJSON, _ := json.Marshal(promoCodeSnapshot)
			fmt.Println(snapshotJSON, "f,ldll")
			_, err := s.store.CreatePromoCodeUsage(ctxBg, db.CreatePromoCodeUsageParams{
				PromoCodeID:       *promoCodeID,
				OrderID:           orderID,
				CustomerID:        pgtype.Int4{Valid: false},
				DiscountAmount:    int32(promoDiscountAmount),
				PromoCodeSnapshot: snapshotJSON,
			})
			if err != nil {
				fmt.Printf("Failed to create promo code usage for order %d: %v\n", orderID, err)
			} else {
				fmt.Printf("Promo code usage recorded: %s (ID: %d) for order %d, discount: %d\n",
					appliedPromoCode, *promoCodeID, orderID, promoDiscountAmount)
			}
		}()
	}

	// Создаем запись в order_events о создании заказа
	go func() {
		ctxBg := context.Background()

		eventParams := db.CreateOrderEventParams{
			OrderID:       orderID,
			EventType:     "status_change",
			OldStatus:     pgtype.Text{Valid: false},
			NewStatus:     pgtype.Text{String: "pending", Valid: true},
			ChangedByType: "system",
			Reason:        pgtype.Text{String: "Order created", Valid: true},
		}

		if err := s.store.CreateOrderEvent(ctxBg, eventParams); err != nil {
			fmt.Printf("Failed to create order event for order %d: %v\n", orderID, err)
		}
	}()

	// Устанавливаем куки
	ctx.SetCookie("cart", "", -1, "/", "", false, true)
	myCookie, _ := s.tokenMaker.CreateCookie(hash, hash, 36000, false, false)
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
		Email:         orderData.PersonalData.Mail,
		Name:          orderData.PersonalData.Name,
		Phone:         orderData.PersonalData.Phone,
		Town:          orderData.Address.Town,
		Street:        orderData.Address.Street,
		Index:         orderData.Address.Index,
		House:         orderData.Address.House,
		Flat:          orderData.Address.Flat,
		OrderPrice:    orderData.Delivery.DeliveryPrice,
		DeliveryType:  orderData.Delivery.Type,
		SecondName:    orderData.PersonalData.SecondName,
		PromoCode:     appliedPromoCode,
		PromoDiscount: promoDiscountAmount,
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
	// 1. Получаем ID предзаказа из URL
	idParam := ctx.Param("id")
	if idParam == "" {
		ctx.JSON(http.StatusBadRequest, errorResponse(fmt.Errorf("missing preorder id")))
		return
	}

	preorderID, err := strconv.Atoi(idParam)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(fmt.Errorf("invalid preorder id: %s", idParam)))
		return
	}

	// 2. Получаем корзину ИЗ КОНТЕКСТА
	cartID, exists := ctx.Get("cart_id")
	if !exists {
		ctx.JSON(http.StatusInternalServerError, errorResponse(fmt.Errorf("cart not in context")))
		return
	}

	cartIDStr, ok := cartID.(string)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, errorResponse(fmt.Errorf("invalid cart type")))
		return
	}

	// 3. Парсим тело запроса
	var preorderData UpdataPreorderType
	if err := ctx.ShouldBindJSON(&preorderData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(fmt.Errorf("invalid request: %w", err)))
		return
	}

	// 4. Обновляем предзаказ
	quantity, err := s.store.UpdatePreorder(
		ctx,
		int32(preorderID),
		preorderData.Size,
		preorderData.Price,
		preorderData.Name,
		preorderData.Image_path,
		cartIDStr, // ← из контекста
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(fmt.Errorf("failed to update preorder: %w", err)))
		return
	}

	// 5. Возвращаем результат
	ctx.JSON(http.StatusOK, gin.H{
		"success":  true,
		"quantity": quantity,
		"message":  "Preorder updated successfully",
	})
}
func (s *Server) handleGetCartCount(ctx *gin.Context) {
	// Получаем корзину из контекста
	cartID, exists := ctx.Get("cart_id")
	if !exists {
		ctx.JSON(http.StatusInternalServerError, errorResponse(fmt.Errorf("cart not in context")))
		return
	}

	cartIDStr, ok := cartID.(string)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, errorResponse(fmt.Errorf("invalid cart type")))
		return
	}

	quantity, err := s.store.GetCartCount(ctx, cartIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

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
	hashUrl := ctx.Param("hash")
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
	UserInfo     types.UnregisterCustomerResponse `json:"userInfo"`
	State        string                           `json:"state"`
	OrderId      int                              `json:"orderId"`
	Address      db.GetOrderAddressByIdRow        `json:"address"`
	CartData     []db.GetOrderDataByIdRow         `json:"cartData"`
	DeliveryType db.DeliveryEnum                  `json:"deliverytype"`
	PromoCode    json.RawMessage                  `json:"promocode"`
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
	orderResponse.PromoCode = orderData.PromoCodeSnapshot

	orderResponse.UserInfo = data
	orderResponse.State = orderData.State
	orderResponse.CartData = cartData
	orderResponse.OrderId = orderData.OrderId
	orderResponse.Address = orderAddress
	orderResponse.DeliveryType = orderData.DeliveryType
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
	myCookie, _ := s.tokenMaker.CreateCookie(hash, hash, 360000, false, true)
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
