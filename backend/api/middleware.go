package api

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
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
	validDate := pgtype.Date{
		Time:  time.Now(),
		Valid: true,
	}
	id, err := s.store.CreateUniqueCustomer(ctx, validDate)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	// Создаем cookie для уникального посетителя (не админ)
	myCookie, err := s.tokenMaker.CreateUserCookie(id, 36000, true, true)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}
	ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge, myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)
}

func AuthMiddleware(s *Server) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		token, err := ctx.Cookie("unique")
		if err != nil {
			createSession(ctx, s)
			ctx.Next()
			return
		}

		cookie, err := s.tokenMaker.VerifyToken(token)
		if err != nil || cookie.ExpiredAt.Before(time.Now()) {
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
		cookie, errC := ctx.Cookie("unique")
		idStr := ctx.Query("id")
		if idStr == "" {
			ctx.JSON(http.StatusBadRequest, errorResponse(errors.New("id is not provided")))
			return
		}
		fmt.Println("idStr", idStr)
		ProductsInfo, err := s.taskProcessor.GetProductsInfo(ctx, idStr)

		if err == nil {
			ctx.JSON(http.StatusOK, ProductsInfo)
			if errC != nil {
				ctx.Abort()
				return
			}
			fmt.Println(cookie, "rerb")
			user, err1 := s.tokenMaker.VerifyToken(cookie)
			if err1 != nil {
				fmt.Println(err1)
			} else {
				numId, err := strconv.ParseInt(idStr, 10, 32)
				if err == nil {
					s.store.SetSnickersHistory(ctx, int32(numId), user.UserID)
				}
			}
			ctx.Abort()
			return
		}
		ctx.Next()
	}
}

func CachedBannersMiddleware(s *Server) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		fmt.Println("CachedBannersMiddleware")
		BanersInfo, err := s.taskProcessor.GetBanners(ctx)

		if err == nil {
			ctx.JSON(http.StatusOK, BanersInfo)
			ctx.Abort()
			return
		}
		ctx.Next()
	}
}

// api/middleware/rate_limit.go
