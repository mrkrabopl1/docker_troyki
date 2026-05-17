// token/maker.go

package token

import (
	"net/http"
	"time"
)

type Maker interface {
	// CreateToken creates a new token
	CreateToken(userID int32, isAdmin bool, duration time.Duration) (string, *Payload, error)

	// CreateUserToken creates a token for regular user
	CreateUserToken(userID int32, duration time.Duration) (string, *Payload, error)

	// CreateAdminToken creates a token for admin
	CreateAdminToken(adminID int32, duration time.Duration) (string, *Payload, error)

	// VerifyToken verifies a token
	VerifyToken(token string) (*Payload, error)

	// CreateCookie creates a cookie with token
	CreateCookie(token string, cookieName string, duration time.Duration, httpOnly bool, secure bool) (http.Cookie, error)

	// CreateUserCookie creates a cookie for regular user
	CreateUserCookie(userID int32, duration time.Duration, httpOnly bool, secure bool) (http.Cookie, error)

	// CreateAdminCookie creates a cookie for admin
	CreateAdminCookie(adminID int32, duration time.Duration, httpOnly bool, secure bool) (http.Cookie, error)

	// GetTokenFromRequest extracts token from request
	GetTokenFromRequest(r *http.Request, cookieName string) string

	// GetUserTokenFromRequest extracts user token from request
	GetUserTokenFromRequest(r *http.Request) string

	// GetAdminTokenFromRequest extracts admin token from request
	GetAdminTokenFromRequest(r *http.Request) string

	CreateCookieWithPasetoToken(userID int32, cookieName string, duration time.Duration, httpOnly bool, secure bool) (http.Cookie, string, error)
}
