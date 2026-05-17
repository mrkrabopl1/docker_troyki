package api

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/errorsType"
	"github.com/mrkrabopl1/go_db/types"
	"github.com/mrkrabopl1/go_db/util"
	"github.com/mrkrabopl1/go_db/worker"
	"github.com/rs/zerolog/log"
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
			myCookie, err := s.tokenMaker.CreateUserCookie(customerData.ID, 3600000, true, true)
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
	validDate := pgtype.Date{
		Time:  time.Now().Add(2 * time.Hour),
		Valid: true, // This is crucial!
	}
	uniqueCustomerId, err := s.store.CreateUniqueCustomer(ctx, validDate)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		fmt.Println(err)
		return
	} else {
		myCookie, err := s.tokenMaker.CreateUserCookie(uniqueCustomerId, 2*time.Hour, true, true)
		fmt.Println(myCookie.Expires)
		if err != nil {
			//log.WithCaller().Err(err).Msg("")
			ctx.JSON(http.StatusBadRequest, errorResponse(err))
			return
		}
		fmt.Println(myCookie)
		ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge, myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)
		ctx.JSON(http.StatusOK, 1)
	}

}
func (s *Server) handleGetHistory(ctx *gin.Context) {
	cookie, err := ctx.Cookie("unique")
	if err != nil {
		fmt.Println(err, "1")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	user, err := s.tokenMaker.VerifyToken(cookie)
	if err != nil {
		fmt.Println(err, "2")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	fmt.Println(user.UserID)
	snickers, err := s.store.GetSnickersHistoryComplex(ctx, user.UserID)
	if errors.Is(err, errorsType.NotExist) {
		ctx.JSON(http.StatusOK, snickers)
		return
	}
	if err != nil {
		fmt.Println(err, "3")
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
func (s *Server) handlePasetoAutorise(ctx *gin.Context) {

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

	response, err := s.store.GetCustomerData(ctx, payload.UserID)
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
		myCookie, err1 := s.tokenMaker.CreateUserCookie(id, 3600000, true, true)
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
	err2 := s.store.ChangePass(ctx, passes.NewPass, passes.OldPass, payload.UserID)
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
		myCookie, _, err := s.tokenMaker.CreateCookieWithPasetoToken(id, "changePass", 3600, true, true)
		if err != nil {
			//log.WithCaller().Err(err).Msg("error")
			ctx.JSON(http.StatusBadRequest, errorResponse(err))
		}
		ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge, myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)

		// Render the response as JSON
		ctx.JSON(http.StatusOK, true)
	}
}
func (s *Server) handleUpdateUniqeCustomer(ctx *gin.Context) {

	//merchId := ctx.Query("merchId")

	coockie, err := ctx.Cookie("uniqe")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	payload, _ := s.tokenMaker.VerifyToken(coockie)

	data := db.UpdateUniqueCustomerHistryParams{
		History: []int32{1},
		ID:      payload.UserID,
	}

	err1 := s.store.UpdateUniqueCustomerHistry(ctx, data)
	if err1 != nil {
		//log.WithCaller().Err(err).Msg("error")
		ctx.JSON(http.StatusBadRequest, errorResponse(err1))
	}
	ctx.JSON(http.StatusOK, true)
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
		ID:   payload.UserID,
	})

	if err3 != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err3))
		return
	}
	ctx.JSON(http.StatusOK, 0)
}
func (s *Server) handleCheckCustomerData(ctx *gin.Context) {
	// fmt.Println()
	fmt.Println("cheeeeeeeeeck")
	cookie, errC := ctx.Cookie("saved")
	fmt.Println("cheeeeeeeeeck", cookie)
	if errC != nil {
		if errC == http.ErrNoCookie {
			fmt.Println("0 codsad")
			ctx.JSON(http.StatusOK, 0)
			return
		} else {
			fmt.Println("lfmdskmflkdsm")
			panic(errC)
		}
	}

	payload, errV := s.tokenMaker.VerifyToken(cookie)
	if errV != nil {
		fmt.Println(errV, "s")
	}
	fmt.Println("GetUnregisterCustomer", "fdsdflksdfksdp", payload.UserID)
	costumerData, err := s.store.GetUnregisterCustomer(ctx, payload.UserID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
	} else {
		ctx.JSON(http.StatusOK, UnregisterCustomerDataResponse(costumerData))
	}
}

// ============ НОВЫЕ ОБРАБОТЧИКИ ДЛЯ НОВОСТНОЙ РАССЫЛКИ ============

type subscribeNewsletterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Username string `json:"username,omitempty"`
}

// handleSubscribeNewsletter - подписка на новостную рассылку
// handleSubscribeNewsletter — подписка на новостную рассылку
func (s *Server) handleSubscribeNewsletter(ctx *gin.Context) {
	var req subscribeNewsletterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Проверяем, не подписан ли уже пользователь
	existing, err := s.store.GetNewsletterSubscriberByEmail(ctx, req.Email)
	if err == nil {
		if existing.Status == "verified" {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "email already subscribed"})
			return
		}
		if existing.Status == "pending" {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "verification email already sent, please check your inbox"})
			return
		}
	}

	// Генерируем токен
	verificationToken := util.RandomString(64)
	expiresAt := time.Now().Add(24 * time.Hour)
	ipAddress := ctx.ClientIP()
	userAgent := ctx.GetHeader("User-Agent")

	// Создаём подписчика
	subscriber, err := s.store.CreateNewsletterSubscriber(ctx, db.CreateNewsletterSubscriberParams{
		Email:             req.Email,
		VerificationToken: verificationToken,
		TokenExpiresAt: pgtype.Timestamp{
			Time:  expiresAt,
			Valid: true,
		},
		IpAddress: pgtype.Text{
			String: ipAddress,
			Valid:  ipAddress != "",
		},
		UserAgent: pgtype.Text{
			String: userAgent,
			Valid:  userAgent != "",
		},
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	// Ставим задачу на отправку верификационного письма
	payload := &worker.PayloadSendNewsletterVerification{
		Email:    subscriber.Email,
		Token:    verificationToken,
		Username: req.Username,
	}

	err = s.taskDistributor.DistributeTaskSendNewsletterVerification(ctx, payload,
		asynq.MaxRetry(3),
		asynq.Timeout(30*time.Second),
		asynq.Queue(worker.QueueDefault),
	)
	if err != nil {
		log.Error().Err(err).Str("email", subscriber.Email).Msg("failed to enqueue verification email")
		// Можно вернуть ошибку пользователю или продолжить (решение за тобой)
		// здесь продолжаем, т.к. подписка уже создана
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Verification email sent. Please check your inbox.",
		"email":   subscriber.Email,
	})
}

// handleVerifyNewsletter — верификация подписки
func (s *Server) handleVerifyNewsletter(ctx *gin.Context) {
	token := ctx.Param("token")
	if token == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "token is required"})
		return
	}

	// Подтверждаем подписку
	err := s.store.VerifyNewsletterSubscriber(ctx, token)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid or expired token"})
		return
	}

	// Получаем подписчика (чтобы знать email)
	subscriber, err := s.store.GetNewsletterSubscriberByToken(ctx, token)
	if err != nil {
		// Если токен валидный, но подписчика не нашли — странно, но возвращаем успех
		ctx.JSON(http.StatusOK, gin.H{"message": "Email verified successfully"})
		return
	}

	// Ставим задачу на отправку приветственного письма
	payload := &worker.PayloadSendNewsletterWelcome{
		Email:    subscriber.Email,
		Username: "", // если есть username в БД — можно добавить поле и вытащить
	}

	err = s.taskDistributor.DistributeTaskSendNewsletterWelcome(ctx, payload,
		asynq.MaxRetry(2),
		asynq.Timeout(20*time.Second),
		asynq.Queue(worker.QueueDefault),
	)
	if err != nil {
		log.Error().Err(err).Str("email", subscriber.Email).Msg("failed to enqueue welcome email")
		// Продолжаем — верификация прошла
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Email verified successfully! Welcome to our newsletter!",
		"email":   subscriber.Email,
	})
}

// handleUnsubscribeNewsletter — отписка (здесь асинхронная отправка не нужна)
func (s *Server) handleUnsubscribeNewsletter(ctx *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	err := s.store.UnsubscribeNewsletter(ctx, req.Email)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "You have been unsubscribed from our newsletter.",
	})
}

// handleGetNewsletterStats — статистика (без изменений, асинхронности нет)
func (s *Server) handleGetNewsletterStats(ctx *gin.Context) {
	verifiedCount, err := s.store.GetNewsletterVerifiedCount(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	pendingCount, err := s.store.GetNewsletterPendingCount(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	unsubscribedCount, err := s.store.GetNewsletterUnsubscribedCount(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	totalCount, err := s.store.GetNewsletterTotalCount(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	stats := map[string]int64{
		"verified_count":     verifiedCount,
		"pending_count":      pendingCount,
		"unsubscribed_count": unsubscribedCount,
		"total_count":        totalCount,
	}

	ctx.JSON(http.StatusOK, stats)
}

// handleSendNewsletterBroadcast — массовая рассылка (у тебя уже было почти правильно)
func (s *Server) handleSendNewsletterBroadcast(ctx *gin.Context) {
	var req struct {
		Subject string `json:"subject" binding:"required"`
		Content string `json:"content" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	emails, err := s.store.GetVerifiedNewsletterSubscribers(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	if len(emails) == 0 {
		ctx.JSON(http.StatusOK, gin.H{"message": "No subscribers to send to"})
		return
	}

	payload := &worker.PayloadSendNewsletterBroadcast{
		Subject: req.Subject,
		Content: req.Content,
		Emails:  emails,
	}

	err = s.taskDistributor.DistributeTaskSendNewsletterBroadcast(ctx, payload,
		asynq.MaxRetry(1), // для broadcast retry обычно не нужен
		asynq.Timeout(15*time.Minute),
		asynq.Queue(worker.QueueDefault),
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":    "Broadcast task enqueued",
		"recipients": len(emails),
	})
}
func UnregisterCustomerDataResponse(customerInfo db.Unregistercustomer) types.UnregisterCustomerResponse {
	data := types.UnregisterCustomerResponse{
		Name:       customerInfo.Name,
		SecondName: customerInfo.Secondname.String,
		Mail:       customerInfo.Mail,
		Phone:      customerInfo.Phone,
		Address: types.AddressTypeResp{
			Town:        customerInfo.Town,
			Street:      customerInfo.Street.String,
			Index:       customerInfo.Index,
			House:       customerInfo.House.String,
			Coordinates: customerInfo.Coordinates,
			Flat:        customerInfo.Flat.String,
			Settlement:  customerInfo.Settlement.String,
		},
		DeliveryComment: customerInfo.Deliverycomment.String,
	}

	return data
}
