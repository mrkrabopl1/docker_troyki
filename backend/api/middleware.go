package api

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/token"
)

const (
	authorizationHeaderKey  = "authorization"
	authorizationTypeBearer = "bearer"
	authorizationPayloadKey = "authorization_payload"
	adminPayloadKey         = "admin"
)

// ========== ОБЫЧНАЯ AUTH MIDDLEWARE (ДЛЯ ПОЛЬЗОВАТЕЛЕЙ) ==========

// AuthMiddleware creates a gin middleware for authorization (для пользователей)
func authMiddleware(tokenMaker token.Maker) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		authorizationHeader := ctx.GetHeader(authorizationHeaderKey)

		if len(authorizationHeader) == 0 {
			err := errors.New("authorization header is not provided")
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, errorResponse(err))
			return
		}

		fields := strings.Fields(authorizationHeader)
		if len(fields) < 2 {
			err := errors.New("invalid authorization header format")
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, errorResponse(err))
			return
		}

		authorizationType := strings.ToLower(fields[0])
		if authorizationType != authorizationTypeBearer {
			err := fmt.Errorf("unsupported authorization type %s", authorizationType)
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, errorResponse(err))
			return
		}

		accessToken := fields[1]
		payload, err := tokenMaker.VerifyToken(accessToken)
		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, errorResponse(err))
			return
		}

		// Проверяем, что это не админ (админы не должны использовать этот middleware)
		if payload.IsAdmin {
			err := errors.New("admin cannot use user auth")
			ctx.AbortWithStatusJSON(http.StatusForbidden, errorResponse(err))
			return
		}

		ctx.Set(authorizationPayloadKey, payload)
		ctx.Next()
	}
}

// ========== SESSION MIDDLEWARE (ДЛЯ УНИКАЛЬНЫХ ПОСЕТИТЕЛЕЙ) ==========

func createSession(ctx *gin.Context, s *Server) {
	// cookie unique — просто маркер гостя, БД не трогаем
	myCookie, err := s.tokenMaker.CreateUserCookie(0, 36000, true, true)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}
	ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge,
		myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)
}
func AuthMiddleware(s *Server) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		fmt.Println("fmdskfmlksdngknlkfnbg[fkkds[fksd]]")
		token, err := ctx.Cookie("unique")
		if err != nil {
			fmt.Println(err, "nfdsjhfjds")
			createSession(ctx, s)
			ctx.Next()
			return
		}

		cookie, err := s.tokenMaker.VerifyToken(token)
		if err != nil || cookie.ExpiredAt.Before(time.Now()) {
			fmt.Println(err, "flksdjjfksd")
			createSession(ctx, s)
			ctx.Next()
			return
		}

		ctx.Next()
	}
}

// ========== ADMIN MIDDLEWARE (ДЛЯ АДМИНОВ) ==========

// AdminAuthMiddleware проверяет авторизацию админа через заголовок Authorization
func (s *Server) AdminAuthMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		authorizationHeader := ctx.GetHeader(authorizationHeaderKey)
		fmt.Println(authorizationHeader, "AdminAuthMiddleware", "fndkjbfkjsdnfjsdbflsdfjhsbdfllsjbfs")

		// Если это Basic Auth от nginx - игнорируем его и берём токен из cookie
		if strings.HasPrefix(authorizationHeader, "Basic ") {
			fmt.Println("Basic Auth detected, ignoring and using cookie instead")
			// Берём токен из cookie
			adminToken, err := ctx.Cookie("admin_token")
			fmt.Println(adminToken, "adminToken from cookie", err)
			if err != nil {
				ctx.AbortWithStatusJSON(http.StatusUnauthorized, errorResponse(errors.New("authorization required")))
				return
			}
			authorizationHeader = "Bearer " + adminToken
		}

		// Если заголовок пустой - тоже пробуем cookie
		if len(authorizationHeader) == 0 {
			adminToken, err := ctx.Cookie("admin_token")
			fmt.Println(adminToken, "adminToken from cookie", err)
			if err != nil {
				ctx.AbortWithStatusJSON(http.StatusUnauthorized, errorResponse(errors.New("authorization required")))
				return
			}
			authorizationHeader = "Bearer " + adminToken
		}

		fields := strings.Fields(authorizationHeader)
		if len(fields) < 2 {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, errorResponse(errors.New("invalid authorization header format")))
			return
		}

		authorizationType := strings.ToLower(fields[0])
		if authorizationType != authorizationTypeBearer {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, errorResponse(fmt.Errorf("unsupported authorization type %s", authorizationType)))
			return
		}

		accessToken := fields[1]
		payload, err := s.tokenMaker.VerifyToken(accessToken)
		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, errorResponse(err))
			return
		}

		// Проверяем, что это админ
		if !payload.IsAdmin {
			ctx.AbortWithStatusJSON(http.StatusForbidden, errorResponse(errors.New("admin access required")))
			return
		}

		fmt.Println(payload, "payload", "2222222222222222222222222222222222111111111111111111111111111111111111")

		// Проверяем, существует ли админ в БД и активен ли он
		admin, err := s.store.GetAdminByID(ctx, payload.UserID)
		if err != nil || !admin.IsActive.Bool {
			ctx.AbortWithStatusJSON(http.StatusForbidden, errorResponse(errors.New("admin account not found or disabled")))
			return
		}

		fmt.Println(admin, "admin", "33333333333333333333333333333333333", adminPayloadKey)
		ctx.Set(adminPayloadKey, admin)
		ctx.Next()
	}
}

// AdminOnlyMiddleware проверяет, что админ имеет роль admin (не superadmin)
func (s *Server) AdminOnlyMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		role, exists := ctx.Get("admin_role")
		if !exists {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, errorResponse(errors.New("authentication required")))
			return
		}

		if role != "admin" && role != "superadmin" {
			ctx.AbortWithStatusJSON(http.StatusForbidden, errorResponse(errors.New("admin access required")))
			return
		}

		ctx.Next()
	}
}

// SuperAdminMiddleware проверяет, что админ имеет роль superadmin
func (s *Server) SuperAdminMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		admin, exists := ctx.Get(adminPayloadKey)
		if !exists {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, errorResponse(errors.New("authentication required")))
			return
		}

		// Приводим к GetAdminByIDRow (не db.Admin!)
		adminObj, ok := admin.(db.GetAdminByIDRow)
		if !ok {
			// Попробуем через рефлексию посмотреть реальный тип
			ctx.AbortWithStatusJSON(http.StatusInternalServerError,
				gin.H{"error": fmt.Sprintf("invalid admin data type: %T", admin)})
			return
		}

		// Проверяем роль - теперь это AdminRoleEnum
		if adminObj.Role != db.AdminRoleEnumSuperadmin {
			ctx.AbortWithStatusJSON(http.StatusForbidden, errorResponse(errors.New("superadmin access required")))
			return
		}

		ctx.Next()
	}
}

// ========== CACHED MIDDLEWARE ==========

func CachedMiddleware(s *Server) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		idStr := ctx.Param("id")
		if idStr == "" {
			ctx.JSON(http.StatusBadRequest, errorResponse(errors.New("id is not provided")))
			return
		}

		productsInfo, err := s.taskProcessor.GetProductsInfo(ctx.Request.Context(), idStr)
		if err == nil {
			// ✅ кэш-хит: пишем просмотр через единый helper
			if numID64, e := strconv.ParseInt(idStr, 10, 32); e == nil {
				s.trackProductView(ctx, int32(numID64))
			}
			ctx.JSON(http.StatusOK, productsInfo)
			ctx.Abort()
			return
		}
		ctx.Next()
	}
}
func CartMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		cartID, err := ctx.Cookie("cart")
		if err != nil {
			// Если нет cookie - просто прерываем с ошибкой
			ctx.AbortWithStatusJSON(http.StatusBadRequest, errorResponse(fmt.Errorf("cart not found")))
			return
		}

		// Сохраняем в контекст для использования в хендлерах
		ctx.Set("cart_id", cartID)
		ctx.Next()
	}
}
func CachedBannersMiddleware(s *Server) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// fmt.Println("CachedBannersMiddleware")
		// BanersInfo, err := s.taskProcessor.GetBanners(ctx)

		// if err == nil {
		// 	ctx.JSON(http.StatusOK, BanersInfo)
		// 	ctx.Abort()
		// 	return
		// }
		ctx.Next()
	}
}
func MaxBodySizeMiddleware(maxBytes int64, skipPrefixes ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		switch c.Request.Method {
		case http.MethodGet, http.MethodHead, http.MethodOptions:
			c.Next()
			return
		}

		for _, p := range skipPrefixes {
			if strings.HasPrefix(c.Request.URL.Path, p) {
				c.Next()
				return
			}
		}

		if c.Request.Body != nil {
			c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
		}
		c.Next()
	}
}

// ========== CUSTOMER MIDDLEWARE (ДЛЯ ЗАЛОГИНЕННЫХ ПОЛЬЗОВАТЕЛЕЙ) ==========

// RequireCustomer — пропускает только залогиненных customer'ов.
// Кладёт в контекст "customerID" (int32) и "customer_payload" (*token.Payload).
// Гостя и админа — отсекает.
func (s *Server) RequireCustomer() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		tokenStr := s.tokenMaker.GetUserTokenFromRequest(ctx.Request)
		if tokenStr == "" {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, errorResponse(errors.New("authorization required")))
			return
		}

		payload, err := s.tokenMaker.VerifyToken(tokenStr)
		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, errorResponse(err))
			return
		}

		// Админ не должен ходить по customer-роутам
		if payload.IsAdmin {
			ctx.AbortWithStatusJSON(http.StatusForbidden, errorResponse(errors.New("admin cannot use customer endpoints")))
			return
		}

		ctx.Set("customerID", payload.UserID)
		ctx.Set("customer_payload", payload)
		ctx.Next()
	}
}

// OptionalCustomer — пропускает всех. Если есть валидный auth_token,
// кладёт customerID в контекст. Для роутов, где гость тоже допускается.
func (s *Server) OptionalCustomer() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		tokenStr := s.tokenMaker.GetUserTokenFromRequest(ctx.Request)
		if tokenStr != "" {
			if payload, err := s.tokenMaker.VerifyToken(tokenStr); err == nil {
				// Админа игнорируем — он не customer
				if !payload.IsAdmin {
					ctx.Set("customerID", payload.UserID)
					ctx.Set("customer_payload", payload)
				}
			}
		}
		ctx.Next() // 👈 ВСЕГДА пропускаем дальше
	}
}

const (
	sessionCookieName = "sid"
	visitorCookieName = "vid"
	sessionTTLSec     = 30 * 60         // 30 минут
	visitorTTLSec     = 365 * 24 * 3600 // 1 год
)

// api/session.go
func SessionMiddleware(s *Server) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		secure := s.config.Environment != "development"
		vid, vidErr := ctx.Cookie(visitorCookieName)
		sid, sidErr := ctx.Cookie(sessionCookieName)

		// cookie есть → кладём в контекст, продлеваем TTL, TouchSession
		if vidErr == nil && vid != "" && sidErr == nil && sid != "" {
			ctx.SetSameSite(http.SameSiteLaxMode)
			ctx.SetCookie(visitorCookieName, vid, visitorTTLSec, "/", "", secure, true)
			ctx.SetCookie(sessionCookieName, sid, sessionTTLSec, "/", "", secure, true)

			ctx.Set("session_id", sid)
			ctx.Set("visitor_id", vid)

			go func(sid string) {
				bg, cancel := context.WithTimeout(context.Background(), 3*time.Second)
				defer cancel()
				if err := s.store.TouchSession(bg, sid); err != nil {
					log.Printf("TouchSession: %v", err)
				}
			}(sid)
		}
		// cookie нет → НЕ создаём, просто пропускаем
		ctx.Next()
	}
}

func hashIP(ip, salt string) string {
	if ip == "" {
		return ""
	}
	sum := sha256.Sum256([]byte(ip + salt))
	return hex.EncodeToString(sum[:])
}
func mustCustomerID(ctx *gin.Context) int32 {
	v, exists := ctx.Get("customerID")
	if !exists {
		return 0
	}
	id, ok := v.(int32)
	if !ok {
		return 0
	}
	return id
}
func getCustomerID(ctx *gin.Context) int32 {
	v, exists := ctx.Get("customerID")
	if !exists {
		return 0
	}
	id, ok := v.(int32)
	if !ok {
		return 0
	}
	return id
}

// api/middleware/rate_limit.go
