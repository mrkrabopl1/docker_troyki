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
)

// AuthMiddleware creates a gin middleware for authorization
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

		ctx.Set(authorizationPayloadKey, payload)
		ctx.Next()
	}
}

func createSession(ctx *gin.Context, s *Server) {
	validDate := pgtype.Date{
		Time:  time.Now(),
		Valid: true, // This is crucial!
	}
	id, err := s.store.CreateUniqueCustomer(ctx, validDate)
	if err != nil {
		//log.WithCaller().Err(err).Msg("")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	myCookie, err := s.tokenMaker.CreatePasetoCoockie(id, "unique", 36000)
	ctx.SetCookie(myCookie.Name, myCookie.Value, myCookie.MaxAge, myCookie.Path, myCookie.Domain, myCookie.Secure, myCookie.HttpOnly)
}

func AuthMiddleware(s *Server) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		token, err := ctx.Cookie("unique")
		if err != nil {
			createSession(ctx, s)
			ctx.Next() // Allow request to proceed after creating a session
			return
		}

		cookie, err := s.tokenMaker.VerifyToken(token)
		if err != nil || cookie.ExpiredAt.Before(time.Now()) {
			createSession(ctx, s)
			ctx.Next() // Allow request to proceed after refreshing the session
			return
		}

		ctx.Next() // Proceed if the token is valid
	}
}

func CachedMiddleware(s *Server) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		fmt.Println("ldasldsmfklmds;flmsdlfmsd;l,';2222222222222222")
		cookie, errC := ctx.Cookie("unique")
		idStr := ctx.Query("id")
		if idStr == "" {
			ctx.JSON(http.StatusBadRequest, errorResponse(errors.New("id is not provided")))
			return
		}
		fmt.Println("idStr", idStr)
		ProductsInfo, err := s.taskProcessor.GetProductsInfo(ctx, idStr)
		fmt.Println(ProductsInfo.Image, "redisTest")
		if err == nil {
			fmt.Println("reddis", ProductsInfo.Info, ProductsInfo.Image, "redisTest")
			ctx.JSON(http.StatusOK, db.ProductsInfoResponse{
				Info:        ProductsInfo.Info,
				Image:       ProductsInfo.Image,
				Name:        ProductsInfo.Name,
				Discount:    ProductsInfo.Discount,
				ProductType: ProductsInfo.ProductType,
			})
			if errC != nil {
				fmt.Println(errC, "ssssssssssssssssssssss")
				ctx.Abort()
				return
			}
			fmt.Println(cookie, "rerb")
			user, err1 := s.tokenMaker.VerifyToken(cookie)
			if err1 != nil {
				fmt.Println(err1, "ssssssssssssssssssssss")
			} else {
				numId, err := strconv.ParseInt(idStr, 10, 32)
				if err == nil {
					fmt.Println("fkfsdfsldkfmsd", user.UserId)
					s.store.SetSnickersHistory(ctx, int32(numId), user.UserId)
				}
			}
			ctx.Abort()
			return
		}
		ctx.Next()
	}
}
