package api

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/types"
	"github.com/mrkrabopl1/go_db/worker"
)

type PreorderType struct {
	Id          int32                `json:"id"`
	Size        string               `json:"size"`
	SourceTable db.ProductSourceEnum `json:"sourceTable"`
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

	fmt.Println(preorderData.Size)

	hashUrl, err := s.store.CreatePreorder(ctx, preorderData.Id, preorderData.Size, preorderData.SourceTable)

	if err != nil {
		//log.WithCaller().Err(err)
		fmt.Println(err)
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	// Print the result and the time taken

	myCookie, err := s.tokenMaker.CreateCoockie(hashUrl, "cart", 36000)

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

	_, unregUserId, hash, err := s.store.CreateOrder(ctx, &orderData)

	if err != nil {
		fmt.Println(err, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
		//log.WithCaller().Err(err)
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	} else {
		myCookie, _ := s.tokenMaker.CreateCoockie(hash, hash, 36000)
		ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge, myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)
		if orderData.Save {
			myCookie, err := s.tokenMaker.CreatePasetoCoockie(unregUserId, "saved", 36000)
			if err != nil {
				//log.WithCaller().Err(err)
				ctx.JSON(http.StatusBadRequest, errorResponse(err))
				return
			}
			ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge, myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)
		}
		data := map[string]interface{}{
			"hash": hash,
		}
		fmt.Println("maybe good")
		err = s.taskDistributor.DistributeTaskSendOrderEmail(ctx, &worker.PayloadSendOrderEmail{
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
		})
		if err != nil {
			fmt.Println(err, "error in taskDistributor")
			ctx.JSON(http.StatusInternalServerError, errorResponse(err))
			return
		}
		ctx.JSON(http.StatusOK, data)
	}
	// Print the result and the time taken

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
	quantity, _ := s.store.UpdatePreorder(ctx, preorderData.Id, preorderData.Size, preorderData.SourceTable, cookie)
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
	responseData := SnickersCartResponseWithourFullPrice(cartData)

	ctx.JSON(http.StatusOK, responseData)
}

func (s *Server) handleGetCartFromOrder(ctx *gin.Context) {
	hashUrl := ctx.Query("hash")

	cartData, err := s.store.GetCartDataFromOrderByHash(ctx, hashUrl)
	fmt.Println(cartData)
	responseData := SnickersCartResponseWithourFullPrice(cartData)

	if err != nil {
		// log.WithCaller().Err(err).Msg("")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	// log.Log.Info().Interface("snickers", responseData)
	// log.Log.Info().Msg("snickers")

	ctx.JSON(http.StatusOK, responseData)
}
func SnickersCartResponseWithourFullPrice(cart []types.SnickersCart) types.FullCartRespone {
	data := types.FullCartRespone{}
	fullPrice := 0
	list := []types.CartResponse{}
	for _, info := range cart {
		img_path := "images/" + info.Image + "/img1.png"

		fullPrice += info.Price * info.Quantity

		list = append(list, types.CartResponse{
			Image:    img_path,
			Id:       int(info.Id),
			Name:     info.Name,
			Size:     info.Size,
			Quantity: info.Quantity,
			Price:    info.Price,
			Firm:     info.Firm,
			PrId:     info.PrId,
		})

	}

	data.CartData = list
	data.FullPice = fullPrice

	return data
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

type OrderDataResp struct {
	UserInfo     types.UnregisterCustomerResponse `json:"userInfo"`
	State        string                           `json:"state"`
	CartResponse types.FullCartRespone            `json:"cartResponse"`
	OrderId      int                              `json:"orderId"`
	Address      db.GetOrderAddressByIdRow        `json:"address"`
}

func orderResponseFunc(orderData db.GetOrderData) OrderDataResp {
	var orderResponse OrderDataResp
	customerInfo := orderData.UserInfo
	orderAddress := orderData.Address
	cartData := SnickersCartResponseWithourFullPrice(orderData.SnickersCart)
	data := types.UnregisterCustomerResponse{
		Name:       customerInfo.Name,
		SecondName: customerInfo.Secondname.String,
		Mail:       customerInfo.Mail,
		Phone:      customerInfo.Phone,
	}

	orderResponse.UserInfo = data
	orderResponse.State = orderData.State
	orderResponse.CartResponse = cartData
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
	myCookie, _ := s.tokenMaker.CreateCoockie(hash, hash, 360000)
	ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge, myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)
	//log.Log.Info().Interface("orders", orderResponse)
	ctx.JSON(http.StatusOK, orderResponse)
}

func (s *Server) handleDeleteCartData(ctx *gin.Context) {
	var data types.DeleteCartData
	if err := ctx.BindJSON(data); err != nil {
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
	cartData := SnickersCartResponseWithourFullPrice(orderData.CartResponse)
	data := types.UnregisterCustomerResponse{
		Name:       customerInfo.Name,
		SecondName: customerInfo.Secondname.String,
		Mail:       customerInfo.Mail,
		Phone:      customerInfo.Phone,
	}

	orderResponse.UserInfo = data
	orderResponse.State = orderData.State
	orderResponse.CartResponse = cartData
	orderResponse.OrderId = int(orderData.OrderId)
	orderResponse.Address = orderData.Address

	return orderResponse
}
