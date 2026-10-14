package api

import (
	"errors"
	"net/http"
	"strconv"
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

// ============================================================
// AUTH: LOGIN / REGISTER / LOGOUT / ME
// ============================================================

func (s *Server) handleLogin(ctx *gin.Context) {
	var postData types.PostDataRegisterUser
	if err := ctx.BindJSON(&postData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	customerData, err := s.store.GetBaseCustomerData(ctx, postData.Mail)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword(customerData.Pass, []byte(postData.Password)); err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	myCookie, err := s.tokenMaker.CreateUserCookie(customerData.ID, time.Hour, true, true)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.SetCookie(
		myCookie.Name,
		myCookie.Value,
		myCookie.MaxAge,
		myCookie.Path,
		myCookie.Domain,
		myCookie.Secure,
		myCookie.HttpOnly,
	)

	ctx.JSON(http.StatusOK, gin.H{"ok": true})
}

func (s *Server) handleRegisterUser(ctx *gin.Context) {
	var postData types.PostDataRegisterUser
	if err := ctx.BindJSON(&postData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	index, customerID, err := s.store.RegisterUser(ctx, postData.Password, postData.Mail)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"registerIndex": 2,
			"error":         err.Error(),
		})
		return
	}
	if index == 1 {
		ctx.JSON(http.StatusOK, gin.H{"registerIndex": 1})
		return
	}

	// Приветственный промокод 5%
	welcomePromo, promoErr := s.store.CreateWelcomePromoCode(ctx, customerID)
	if promoErr != nil {
		log.Error().Err(promoErr).Int32("customer_id", customerID).Msg("failed to create welcome promo")
	}

	// Verification token
	token := util.RandomString(64)
	err = s.store.InsertVerification(ctx, db.InsertVerificationParams{
		Token:      token,
		Customerid: customerID,
		Expire:     pgtype.Timestamp{Time: time.Now().Add(24 * time.Hour), Valid: true},
		Deletetime: pgtype.Timestamp{Time: time.Now().Add(25 * time.Hour), Valid: true},
	})
	if err != nil {
		log.Error().Err(err).Int32("customer_id", customerID).Msg("failed to create verification")
	}

	// Письмо с промокодом
	promoCodeStr := ""
	if promoErr == nil {
		promoCodeStr = welcomePromo.Code
	}

	err = s.taskDistributor.DistributeTaskSendVerifyEmail(
		ctx,
		&worker.PayloadSendVerifyEmail{
			Email:     postData.Mail,
			Token:     token,
			PromoCode: promoCodeStr,
		},
		asynq.MaxRetry(3),
		asynq.Timeout(30*time.Second),
		asynq.Queue(worker.QueueDefault),
	)
	if err != nil {
		log.Error().Err(err).Str("email", postData.Mail).Msg("failed to enqueue verify email")
	}

	// Кука — сразу залогинен
	myCookie, err := s.tokenMaker.CreateUserCookie(customerID, time.Hour, true, true)
	if err != nil {
		log.Error().Err(err).Msg("failed to create user cookie")
		ctx.JSON(http.StatusOK, gin.H{"registerIndex": 2, "error": "user created, please login"})
		return
	}

	ctx.SetCookie(
		myCookie.Name, myCookie.Value, myCookie.MaxAge,
		myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly,
	)

	ctx.JSON(http.StatusOK, gin.H{"registerIndex": 0})
}

// POST /auth/logout
func (s *Server) handleLogout(ctx *gin.Context) {
	ctx.SetCookie("auth_token", "", -1, "/", "", false, true)
	ctx.JSON(http.StatusOK, gin.H{"ok": true})
}

// GET /auth/me — опциональный (гость получает 200 + null)
func (s *Server) handleGetMe(ctx *gin.Context) {
	customerID := getCustomerID(ctx) // 0, если гость

	if customerID == 0 {
		ctx.JSON(http.StatusOK, nil)
		return
	}

	user, err := s.store.GetCustomerData(ctx, customerID)
	if err != nil {
		ctx.JSON(http.StatusOK, nil)
		return
	}

	ctx.JSON(http.StatusOK, user)
}

// POST /auth/verify-email
func (s *Server) handleVerifyUser(ctx *gin.Context) {
	var verData types.VerifyData
	if err := ctx.BindJSON(&verData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	if verData.Token == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "token is required"})
		return
	}

	id, err := s.store.VerifyUser(ctx, verData.Token)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	myCookie, err := s.tokenMaker.CreateUserCookie(id, time.Hour, true, true)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.SetCookie(
		myCookie.Name, myCookie.Value, myCookie.MaxAge,
		myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly,
	)

	ctx.JSON(http.StatusOK, true)
}

// ============================================================
// ПАРОЛЬ
// ============================================================

// POST /users/password — защищённый
func (s *Server) handleChangePass(ctx *gin.Context) {
	customerID := mustCustomerID(ctx)

	var passes types.ChangePassType
	if err := ctx.BindJSON(&passes); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	err := s.store.ChangePass(ctx, passes.NewPass, passes.OldPass, customerID)
	errorType := 0
	if err == errorsType.PassCoincide {
		errorType = 1
	}

	ctx.JSON(http.StatusOK, gin.H{"err": errorType})
}

// POST /users/password/forgot
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
	ctx.JSON(http.StatusOK, 0)
}

// POST /users/password/verify
func (s *Server) handleVerifyForgetPass(ctx *gin.Context) {
	var verData types.VerifyData
	if err := ctx.BindJSON(&verData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	id, err := s.store.VerifyUser(ctx, verData.Token)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	myCookie, _, err := s.tokenMaker.CreateCookieWithPasetoToken(id, "changePass", time.Hour, true, true)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	ctx.SetCookie(
		myCookie.Name, myCookie.Value, myCookie.MaxAge,
		myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly,
	)

	ctx.JSON(http.StatusOK, true)
}

// POST /users/password/reset
func (s *Server) handleChangeForgetPass(ctx *gin.Context) {
	cookie, err := ctx.Cookie("changePass")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "no change-pass session"})
		return
	}

	payload, err := s.tokenMaker.VerifyToken(cookie)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid session"})
		return
	}

	var newPass types.Pass
	if err := ctx.BindJSON(&newPass); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPass.Pass), bcrypt.DefaultCost)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	err = s.store.UpdateCustomerPass(ctx, db.UpdateCustomerPassParams{
		Pass: hashedPassword,
		ID:   payload.UserID,
	})
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	ctx.SetCookie("changePass", "", -1, "/", "", false, true)
	ctx.JSON(http.StatusOK, 0)
}

// ============================================================
// ПРОФИЛЬ
// ============================================================

// POST /auth/profile — защищённый
func (s *Server) handleUpdateProfile(ctx *gin.Context) {
	customerID := mustCustomerID(ctx)

	var data types.UpdateProfileData
	if err := ctx.BindJSON(&data); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	err := s.store.UpdateCustomerProfile(ctx, db.UpdateCustomerProfileParams{
		ID:    customerID,
		Name:  pgtype.Text{String: data.Name, Valid: data.Name != ""},
		Phone: pgtype.Text{String: data.Phone, Valid: data.Phone != ""},
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	user, err := s.store.GetCustomerData(ctx, customerID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, user)
}

// ============================================================
// АДРЕСА (customer_addresses)
// ============================================================

// GET /auth/addresses
func (s *Server) handleGetAddresses(ctx *gin.Context) {
	customerID := mustCustomerID(ctx)

	addresses, err := s.store.GetCustomerAddresses(ctx, customerID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}
	if addresses == nil {
		addresses = []db.CustomerAddress{}
	}

	ctx.JSON(http.StatusOK, addresses)
}

// GET /auth/addresses/:id
func (s *Server) handleGetAddress(ctx *gin.Context) {
	customerID := mustCustomerID(ctx)

	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid address id"})
		return
	}

	address, err := s.store.GetCustomerAddressByID(ctx, db.GetCustomerAddressByIDParams{
		ID:         int32(id),
		CustomerID: customerID,
	})
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "address not found"})
		return
	}

	ctx.JSON(http.StatusOK, address)
}

// GET /auth/addresses/default
func (s *Server) handleGetDefaultAddress(ctx *gin.Context) {
	customerID := mustCustomerID(ctx)

	address, err := s.store.GetDefaultCustomerAddress(ctx, customerID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "default address not found"})
		return
	}

	ctx.JSON(http.StatusOK, address)
}

// POST /auth/addresses
func (s *Server) handleCreateAddress(ctx *gin.Context) {
	customerID := mustCustomerID(ctx)

	var data types.Address
	if err := ctx.BindJSON(&data); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	if data.Town == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "town is required"})
		return
	}

	count, err := s.store.CountCustomerAddresses(ctx, customerID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}
	isFirst := count == 0

	address, err := s.store.CreateCustomerAddress(ctx, db.CreateCustomerAddressParams{
		CustomerID:  customerID,
		Town:        data.Town,
		Street:      pgtype.Text{String: data.Street, Valid: data.Street != ""},
		House:       pgtype.Text{String: data.House, Valid: data.House != ""},
		Flat:        pgtype.Text{String: data.Flat, Valid: data.Flat != ""},
		PostalCode:  pgtype.Text{String: data.Index, Valid: data.Index != ""},
		Region:      pgtype.Text{String: data.Region, Valid: data.Region != ""},
		Coordinates: data.Coordinates,
		IsDefault:   isFirst,
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusCreated, address)
}

// PUT /auth/addresses/:id
func (s *Server) handleUpdateAddress(ctx *gin.Context) {
	customerID := mustCustomerID(ctx)

	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid address id"})
		return
	}

	var data types.Address
	if err := ctx.BindJSON(&data); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	_, err = s.store.GetCustomerAddressByID(ctx, db.GetCustomerAddressByIDParams{
		ID:         int32(id),
		CustomerID: customerID,
	})
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "address not found"})
		return
	}

	address, err := s.store.UpdateCustomerAddress(ctx, db.UpdateCustomerAddressParams{
		ID:          int32(id),
		CustomerID:  customerID,
		Town:        data.Town,
		Street:      pgtype.Text{String: data.Street, Valid: data.Street != ""},
		House:       pgtype.Text{String: data.House, Valid: data.House != ""},
		Flat:        pgtype.Text{String: data.Flat, Valid: data.Flat != ""},
		PostalCode:  pgtype.Text{String: data.Index, Valid: data.Index != ""},
		Region:      pgtype.Text{String: data.Region, Valid: data.Region != ""},
		Coordinates: data.Coordinates,
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, address)
}

// DELETE /auth/addresses/:id
func (s *Server) handleDeleteAddress(ctx *gin.Context) {
	customerID := mustCustomerID(ctx)

	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid address id"})
		return
	}

	addr, err := s.store.GetCustomerAddressByID(ctx, db.GetCustomerAddressByIDParams{
		ID:         int32(id),
		CustomerID: customerID,
	})
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "address not found"})
		return
	}

	err = s.store.DeleteCustomerAddress(ctx, db.DeleteCustomerAddressParams{
		ID:         int32(id),
		CustomerID: customerID,
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	if addr.IsDefault {
		remaining, _ := s.store.GetCustomerAddresses(ctx, customerID)
		if len(remaining) > 0 {
			_ = s.store.SetDefaultCustomerAddress(ctx, db.SetDefaultCustomerAddressParams{
				ID:         remaining[0].ID,
				CustomerID: customerID,
			})
		}
	}

	ctx.JSON(http.StatusOK, gin.H{"ok": true})
}

// PATCH /auth/addresses/:id/default
func (s *Server) handleSetDefaultAddress(ctx *gin.Context) {
	customerID := mustCustomerID(ctx)

	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid address id"})
		return
	}

	_, err = s.store.GetCustomerAddressByID(ctx, db.GetCustomerAddressByIDParams{
		ID:         int32(id),
		CustomerID: customerID,
	})
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "address not found"})
		return
	}

	if err := s.store.UnsetDefaultCustomerAddress(ctx, customerID); err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}
	if err := s.store.SetDefaultCustomerAddress(ctx, db.SetDefaultCustomerAddressParams{
		ID:         int32(id),
		CustomerID: customerID,
	}); err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"ok": true})
}

// ============================================================
// ГОСТЕВАЯ СЕССИЯ / ИСТОРИЯ
// ============================================================

// GET /customers/unique
func (s *Server) handleSetUniqueCustomer(ctx *gin.Context) {
	validDate := pgtype.Date{Time: time.Now(), Valid: true}

	uniqueCustomerID, err := s.store.CreateUniqueCustomer(ctx, validDate)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	myCookie, err := s.tokenMaker.CreateGuestCookie(uniqueCustomerID, 2*time.Hour, true, true)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.SetCookie(
		myCookie.Name, myCookie.Value, myCookie.MaxAge,
		myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly,
	)

	ctx.JSON(http.StatusOK, gin.H{"ok": true})
}

// GET /history
func (s *Server) handleGetHistory(ctx *gin.Context) {
	customerID := getCustomerID(ctx)

	if customerID != 0 {
		snickers, err := s.store.GetSnickersHistoryComplex(ctx, customerID)
		if errors.Is(err, errorsType.NotExist) {
			ctx.JSON(http.StatusOK, []any{})
			return
		}
		if err != nil {
			ctx.JSON(http.StatusBadRequest, errorResponse(err))
			return
		}
		ctx.JSON(http.StatusOK, snickers)
		return
	}

	guestToken := s.tokenMaker.GetGuestTokenFromRequest(ctx.Request)
	if guestToken == "" {
		ctx.JSON(http.StatusOK, []any{})
		return
	}

	payload, err := s.tokenMaker.VerifyToken(guestToken)
	if err != nil {
		ctx.JSON(http.StatusOK, []any{})
		return
	}

	snickers, err := s.store.GetSnickersHistoryComplex(ctx, payload.UserID)
	if errors.Is(err, errorsType.NotExist) {
		ctx.JSON(http.StatusOK, []any{})
		return
	}
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, snickers)
}

// GET /customers/check
func (s *Server) handleCheckCustomerData(ctx *gin.Context) {
	cookie, err := ctx.Cookie("saved")
	if err != nil {
		ctx.JSON(http.StatusOK, 0)
		return
	}

	payload, err := s.tokenMaker.VerifyToken(cookie)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	costumerData, err := s.store.GetUnregisterCustomer(ctx, payload.UserID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, UnregisterCustomerDataResponse(costumerData))
}

// ============================================================
// NEWSLETTER — вот они, на месте
// ============================================================

type subscribeNewsletterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Username string `json:"username,omitempty"`
}

func (s *Server) handleSubscribeNewsletter(ctx *gin.Context) {
	var req subscribeNewsletterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

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

	verificationToken := util.RandomString(64)
	expiresAt := time.Now().Add(24 * time.Hour)
	ipAddress := ctx.ClientIP()
	userAgent := ctx.GetHeader("User-Agent")

	subscriber, err := s.store.CreateNewsletterSubscriber(ctx, db.CreateNewsletterSubscriberParams{
		Email:             req.Email,
		VerificationToken: verificationToken,
		TokenExpiresAt:    pgtype.Timestamp{Time: expiresAt, Valid: true},
		IpAddress:         pgtype.Text{String: ipAddress, Valid: ipAddress != ""},
		UserAgent:         pgtype.Text{String: userAgent, Valid: userAgent != ""},
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

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
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Verification email sent. Please check your inbox.",
		"email":   subscriber.Email,
	})
}

func (s *Server) handleVerifyNewsletter(ctx *gin.Context) {
	token := ctx.Param("token")
	if token == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "token is required"})
		return
	}

	err := s.store.VerifyNewsletterSubscriber(ctx, token)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid or expired token"})
		return
	}

	subscriber, err := s.store.GetNewsletterSubscriberByToken(ctx, token)
	if err != nil {
		ctx.JSON(http.StatusOK, gin.H{"message": "Email verified successfully"})
		return
	}

	payload := &worker.PayloadSendNewsletterWelcome{
		Email:    subscriber.Email,
		Username: "",
	}

	err = s.taskDistributor.DistributeTaskSendNewsletterWelcome(ctx, payload,
		asynq.MaxRetry(2),
		asynq.Timeout(20*time.Second),
		asynq.Queue(worker.QueueDefault),
	)
	if err != nil {
		log.Error().Err(err).Str("email", subscriber.Email).Msg("failed to enqueue welcome email")
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Email verified successfully! Welcome to our newsletter!",
		"email":   subscriber.Email,
	})
}

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

	ctx.JSON(http.StatusOK, map[string]int64{
		"verified_count":     verifiedCount,
		"pending_count":      pendingCount,
		"unsubscribed_count": unsubscribedCount,
		"total_count":        totalCount,
	})
}

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
		asynq.MaxRetry(1),
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

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ
// ============================================================

func UnregisterCustomerDataResponse(customerInfo db.Unregistercustomer) types.UnregisterCustomerResponse {
	return types.UnregisterCustomerResponse{
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
}

func (s *Server) handleGetMyOrders(ctx *gin.Context) {
	customerID := mustCustomerID(ctx)

	orders, err := s.store.GetCustomerOrders(ctx, pgtype.Int4{
		Int32: customerID,
		Valid: true,
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}
	if orders == nil {
		orders = []db.GetCustomerOrdersRow{}
	}

	ctx.JSON(http.StatusOK, orders)
}
