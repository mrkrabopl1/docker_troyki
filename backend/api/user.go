package api

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/errorsType"
	"github.com/mrkrabopl1/go_db/types"
	"golang.org/x/crypto/bcrypt"
)

func (s *Server) handleLogin(ctx *gin.Context) {
	var postData types.PostDataRegisterUser
	if err := ctx.BindJSON(&postData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	customerData, err1 := s.store.GetBaseCustomerData(ctx, postData.Mail)
	if err1 != nil {
		//log.WithCaller().Err(err1)
		ctx.JSON(http.StatusBadRequest, errorResponse(err1))
	} else {

		err2 := bcrypt.CompareHashAndPassword(customerData.Pass, []byte(postData.Password))
		if err2 != nil {
			ctx.JSON(http.StatusBadRequest, errorResponse(err1))
		} else {
			myCookie, err := s.tokenMaker.CreateJWTCoockie(customerData.ID, "unique", 3600000)
			if err != nil {
				//log.WithCaller().Err(err)
				ctx.JSON(http.StatusBadRequest, errorResponse(err1))
				return
			}
			ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge, myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)
			ctx.JSON(http.StatusOK, true)
		}
	}
}
func (s *Server) handleSetUniqueCustomer(ctx *gin.Context) {
	uniqueCustomerId, err := s.store.CreateUniqueCustomer(ctx, pgtype.Date{Time: time.Now()})
	if err != nil {
		// log.WithCaller().Err(err).Msg("")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
	} else {
		myCookie, err := s.tokenMaker.CreateJWTCoockie(uniqueCustomerId, "unique", 36000)
		if err != nil {
			//log.WithCaller().Err(err).Msg("")
			ctx.JSON(http.StatusBadRequest, errorResponse(err))
			return
		}
		ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge, myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)
		ctx.JSON(http.StatusOK, 1)
	}

}
func (s *Server) handleGetHistory(ctx *gin.Context) {
	cookie, err := ctx.Cookie("unique")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	user, err := s.tokenMaker.VerifyToken(cookie)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	snickers, err := s.store.GetSnickersHistoryComplex(ctx, user.UserId)
	if errors.Is(err, errorsType.NotExist) {
		ctx.JSON(http.StatusOK, snickers)
		return
	}
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	ctx.JSON(http.StatusOK, snickers)
}

func (s *Server) handleRegisterUser(ctx *gin.Context) {
	var postData types.PostDataRegisterUser
	if err := ctx.BindJSON(&postData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	index, err5 := s.store.RegisterUser(ctx, postData.Password, postData.Mail)

	if err5 != nil {
		//log.WithCaller().Err(err5)
		return
	}
	if index == 1 {

		return
	}

	data := map[string]int32{
		"registerIndex": index,
	}
	ctx.JSON(http.StatusOK, data)
}
func (s *Server) handleUnlogin(ctx *gin.Context) {
	_, errC := ctx.Request.Cookie("token")
	if errC != nil {
		if errC == http.ErrNoCookie {
			ctx.JSON(http.StatusBadRequest, errorResponse(errC))
			return
		} else {
			panic(errC)
		}
	} else {
		ctx.SetCookie("token", "", -1, "/", "", false, true)
		ctx.JSON(http.StatusOK, 0)
	}
}
func (s *Server) handleJwtAutorise(ctx *gin.Context) {

	_, err := ctx.Request.Cookie("token")

	if err != nil {
		//log.WithCaller().Err(err)
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
	} else {
		ctx.JSON(http.StatusOK, true)
	}

	// token1, _ := jwt.ParseWithClaims(cookie.Value, &jwt.StandardClaims{}, func(token *jwt.Token) (interface{}, error) {
	// 	return []byte(jwtKey), nil
	// })

	// fmt.Println(token1)

	// // if err3 != nil {
	// // 	fmt.Println(err3)
	// // }

	// claims1 := token1.Claims.(*jwt.StandardClaims)
	// // if err1 != nil {
	// // 	fmt.Println(err1)
	// // }
	// fmt.Println(claims1.Issuer, "ggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg0-=0g")
}

func (s *Server) handleGetUserData(ctx *gin.Context) {

	cookie, err := ctx.Cookie("token")

	payload, _ := s.tokenMaker.VerifyToken(cookie)

	response, err := s.store.GetCustomerData(ctx, payload.UserId)
	if err != nil {
		//	log.WithCaller().Err(err)
	}
	ctx.JSON(http.StatusOK, response)
}
func (s *Server) handleVerifyUser(ctx *gin.Context) {
	var verData types.VerifyData
	if err := ctx.BindJSON(&verData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	id, err := s.store.VerifyUser(ctx, verData.Token)
	if err != nil {
		//log.WithCaller().Err(err)
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
	} else {
		myCookie, err1 := s.tokenMaker.CreateJWTCoockie(id, "token", 3600000)
		if err1 != nil {
			//log.WithCaller().Err(err1)
			ctx.JSON(http.StatusBadRequest, errorResponse(err))

		} else {
			ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge, myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)

			// Render the response as JSON
			ctx.JSON(http.StatusOK, true)
		}
	}
}
func (s *Server) handleChangePass(ctx *gin.Context) {
	var passes types.ChangePassType
	cookie, err := ctx.Cookie("token")
	payload, _ := s.tokenMaker.VerifyToken(cookie)
	if err := ctx.BindJSON(&passes); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	fmt.Println(passes)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	err2 := s.store.ChangePass(ctx, passes.NewPass, passes.OldPass, payload.UserId)
	errorType := 0
	if err2 == errorsType.PassCoincide {
		errorType = 1
	}
	data := map[string]int{
		"err": errorType,
	}
	ctx.JSON(http.StatusOK, data)
}

func (s *Server) handleForgetPass(ctx *gin.Context) {
	mail := ctx.Query("mail")
	err := s.store.UpdateForgetPass(ctx, mail)
	if errors.Is(err, errorsType.NotExist) {
		ctx.JSON(http.StatusOK, 1)
		return
	}
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	fmt.Println(err)
	ctx.JSON(http.StatusOK, 0)
}
func (s *Server) handleVerifyForgetPass(ctx *gin.Context) {
	var verData types.VerifyData
	if err := ctx.BindJSON(&verData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	id, err := s.store.VerifyUser(ctx, verData.Token)
	if err != nil {
		//log.WithCaller().Err(err).Msg("error")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
	} else {
		myCookie, err := s.tokenMaker.CreateJWTCoockie(id, "changePass", 3600)
		if err != nil {
			//log.WithCaller().Err(err).Msg("error")
			ctx.JSON(http.StatusBadRequest, errorResponse(err))
		}
		ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge, myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)

		// Render the response as JSON
		ctx.JSON(http.StatusOK, true)
	}
}
func (s *Server) handleChangeForgetPass(ctx *gin.Context) {
	//var passes types.ChangePassType
	cookie, errC := ctx.Cookie("changePass")
	if errC != nil {
		if errC == http.ErrNoCookie {
			//log.WithCaller().Err(errC)
			ctx.JSON(http.StatusOK, 1)
			return
		} else {
			panic(errC)
		}
	}
	payload, _ := s.tokenMaker.VerifyToken(cookie)
	//fmt.Println(issuer, "f;lsdf;llkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk")
	var newPass types.Pass
	if err := ctx.BindJSON(&newPass); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	hashedPassword, err4 := bcrypt.GenerateFromPassword([]byte(newPass.Pass), bcrypt.DefaultCost)
	if err4 != nil {
		panic(err4)
	}
	err3 := s.store.UpdateCustomerPass(ctx, db.UpdateCustomerPassParams{
		Pass: hashedPassword,
		ID:   payload.UserId,
	})

	if err3 != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err3))
		return
	}
	ctx.JSON(http.StatusOK, 0)
}
func (s *Server) handleCheckCustomerData(ctx *gin.Context) {
	cookie, errC := ctx.Cookie("saved")
	cookie2, _ := ctx.Cookie("cart")
	fmt.Println(cookie, "fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", errC)
	fmt.Println(cookie2, "fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
	if errC != nil {
		if errC == http.ErrNoCookie {
			fmt.Println("0 codsad")
			ctx.JSON(http.StatusOK, 0)
			return
		} else {
			panic(errC)
		}
	}
	payload, _ := s.tokenMaker.VerifyToken(cookie)
	//fmt.Println(issuer, "fdsdflksdfksdp", err3)
	costumerData, err := s.store.GetUnregisterCustomer(ctx, payload.UserId)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
	} else {
		ctx.JSON(http.StatusOK, UnregisterCustomerDataResponse(costumerData))
	}
}
func UnregisterCustomerDataResponse(customerInfo db.GetUnregisterCustomerRow) types.UnregisterCustomerResponse {
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
			Street: customerInfo.Street,
		},
	}

	return data
}
