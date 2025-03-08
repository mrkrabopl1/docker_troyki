package api

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/types"
)

func (s *Server) handleCreatePreorder(ctx *gin.Context) {
	var preorderData types.PreorderType
	fmt.Println("tedt")
	if err := ctx.BindJSON(&preorderData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	hashUrl, _ := s.store.CreatePreorder(ctx, preorderData.Id, preorderData.Size)

	// Print the result and the time taken

	data := map[string]string{
		"hashUrl": hashUrl,
	}
	ctx.JSON(http.StatusOK, data)
}

func (s *Server) handleCreateOrder(ctx *gin.Context) {
	var orderData types.CreateOrderType
	if err := ctx.BindJSON(&orderData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	_, unregUserId, hash, err := s.store.CreateOrder(ctx, &orderData)

	if err != nil {
		//log.WithCaller().Err(err)
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
	} else {
		myCookie, _ := s.tokenMaker.CreateCoockie(hash, hash, 36000)
		ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge, myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)
		if orderData.Save {
			myCookie, err := s.tokenMaker.CreateJWTCoockie(unregUserId, "saved", 36000)
			if err != nil {
				//log.WithCaller().Err(err)
				ctx.JSON(http.StatusBadRequest, errorResponse(err))
			}
			ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge, myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)
		}
		data := map[string]interface{}{
			"hash": hash,
		}
		ctx.JSON(http.StatusOK, data)
	}

	// Print the result and the time taken

}

func (s *Server) handleUpdatePreorder(ctx *gin.Context) {
	var preorderData types.UpdataPreorderType
	if err := ctx.BindJSON(&preorderData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	quantity, _ := s.store.UpdatePreorder(ctx, preorderData.Id, preorderData.Size, preorderData.HashUrl)

	// Print the result and the time taken

	data := map[string]int32{
		"count": quantity,
	}
	ctx.JSON(http.StatusOK, data)
}
func (s *Server) handleGetCartCount(ctx *gin.Context) {

	hashUrl := ctx.Query("hash")
	quantity, err := s.store.GetCartCount(ctx, hashUrl)

	if err != nil {
		//log.WithCaller().Err(err)
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	data := map[string]int32{
		"count": quantity,
	}

	//log.InfoFields(fmt.Sprintf("count %d", quantity))

	ctx.JSON(http.StatusOK, data)
}

func (s *Server) handleGetCart(ctx *gin.Context) {
	hashUrl := ctx.Query("hash")

	cartData, err := s.store.GetCartData(ctx, hashUrl)

	responseData := SnickersCartResponseWithourFullPrice(cartData)

	if err != nil {

		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

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
		img_path := info.Image + "/1.jpg"

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

func orderResponseFunc(orderData db.GetOrderData) types.OrderDataResp {
	var orderResponse types.OrderDataResp
	customerInfo := orderData.UserInfo
	cartData := SnickersCartResponseWithourFullPrice(orderData.SnickersCart)
	data := types.UnregisterCustomerResponse{
		Name:       customerInfo.Name,
		SecondName: customerInfo.Secondname.String,
		Mail:       customerInfo.Mail,
		Phone:      customerInfo.Phone,
		Address: types.AddressTypeResp{
			House:  customerInfo.House.String,
			Flat:   customerInfo.Flat.String,
			Index:  customerInfo.Index,
			Region: customerInfo.Region,
			Town:   customerInfo.Town,
		},
	}

	orderResponse.UserInfo = data
	orderResponse.State = orderData.State
	orderResponse.CartResponse = cartData
	orderResponse.OrderId = orderData.OrderId

	return orderResponse
}

type OrderDataResp1 struct {
	UserInfo     types.UnregisterCustomerResponse `json:"userInfo"`
	State        db.StatusEnum                    `json:"state"`
	CartResponse types.FullCartRespone            `json:"cartResponse"`
	OrderId      int                              `json:"orderId"`
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
		Address: types.AddressTypeResp{
			House:  customerInfo.House.String,
			Flat:   customerInfo.Flat.String,
			Index:  customerInfo.Index,
			Region: customerInfo.Region,
			Town:   customerInfo.Town,
		},
	}

	orderResponse.UserInfo = data
	orderResponse.State = orderData.State
	orderResponse.CartResponse = cartData
	orderResponse.OrderId = int(orderData.OrderId)

	return orderResponse
}
