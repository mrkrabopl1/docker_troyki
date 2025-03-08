package api

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
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

func CachedMiddleware(s *Server) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		cookie, errC := ctx.Cookie("unique")
		idStr := ctx.Query("id")
		if idStr == "" {
			ctx.JSON(http.StatusBadRequest, errorResponse(errors.New("id is not provided")))
			return
		}
		fmt.Println("idStr", idStr)
		snickersInfo, err := s.taskProcessor.GetSnickersInfo(ctx, idStr)

		if err == nil {
			fmt.Println("reddis")
			ctx.JSON(http.StatusOK, snickersInfo)
			if errC != nil {
				//log.WithCaller().Err(errC).Msg("")
				return
			}
			user, err1 := s.tokenMaker.VerifyToken(cookie)
			if err1 != nil {

			} else {
				numId, err := strconv.ParseInt(idStr, 10, 32)
				if err == nil {
					s.store.SetSnickersHistory(ctx, int32(numId), user.UserId)
				}
			}
			ctx.Abort()
			return
		}
		ctx.Next()
	}
}
