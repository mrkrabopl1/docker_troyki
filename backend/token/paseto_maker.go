package token

import (
	"fmt"
	"net/http"
	"time"

	"github.com/o1egl/paseto"
	"golang.org/x/crypto/chacha20poly1305"
)

// PasetoMaker is a PASETO token maker
type PasetoMaker struct {
	paseto       *paseto.V2
	symmetricKey []byte
}

// NewPasetoMaker creates a new PasetoMaker
func NewPasetoMaker(symmetricKey string) (Maker, error) {
	if len(symmetricKey) != chacha20poly1305.KeySize {
		return nil, fmt.Errorf("invalid key size: must be exactly %d characters", chacha20poly1305.KeySize)
	}

	maker := &PasetoMaker{
		paseto:       paseto.NewV2(),
		symmetricKey: []byte(symmetricKey),
	}

	return maker, nil
}

// CreateToken creates a new token with userID and isAdmin flag
func (maker *PasetoMaker) CreateToken(userID int32, isAdmin bool, duration time.Duration) (string, *Payload, error) {
	payload, err := NewPayload(userID, isAdmin, duration)
	if err != nil {
		return "", payload, err
	}

	token, err := maker.paseto.Encrypt(maker.symmetricKey, payload, nil)
	return token, payload, err
}

// CreateUserToken creates a token for regular user
func (maker *PasetoMaker) CreateUserToken(userID int32, duration time.Duration) (string, *Payload, error) {
	return maker.CreateToken(userID, false, duration)
}

// CreateAdminToken creates a token for admin
func (maker *PasetoMaker) CreateAdminToken(adminID int32, duration time.Duration) (string, *Payload, error) {
	return maker.CreateToken(adminID, true, duration)
}

// VerifyToken checks if the token is valid or not
func (maker *PasetoMaker) VerifyToken(token string) (*Payload, error) {
	payload := &Payload{}

	err := maker.paseto.Decrypt(token, maker.symmetricKey, payload, nil)
	if err != nil {
		return nil, ErrInvalidToken
	}

	err = payload.Valid()
	if err != nil {
		return nil, err
	}

	return payload, nil
}

// CreateCookie creates a cookie with PASETO token
func (maker *PasetoMaker) CreateCookie(token string, cookieName string, duration time.Duration, httpOnly bool, secure bool) (http.Cookie, error) {
	expirationTime := time.Now().Add(duration)

	myCookie := http.Cookie{
		Name:     cookieName,
		Value:    token,
		Expires:  expirationTime,
		Path:     "/",
		MaxAge:   int(duration.Seconds()),
		HttpOnly: httpOnly,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		Domain:   "",
	}
	return myCookie, nil
}
func (maker *PasetoMaker) CreateUserCookie(userID int32, duration time.Duration, httpOnly bool, secure bool) (http.Cookie, error) {
	token, _, err := maker.CreateUserToken(userID, duration)
	if err != nil {
		return http.Cookie{}, err
	}

	cookie, err := maker.CreateCookie(token, "auth_token", duration, httpOnly, secure)
	return cookie, err
}

// CreateUserCookie creates a cookie for regular user
func (maker *PasetoMaker) CreateCookieWithPasetoToken(userID int32, cookieName string, duration time.Duration, httpOnly bool, secure bool) (http.Cookie, string, error) {
	token, _, err := maker.CreateToken(userID, false, duration)
	if err != nil {
		return http.Cookie{}, "", err
	}

	cookie, err := maker.CreateCookie(token, cookieName, duration, httpOnly, secure)
	return cookie, token, err
}

// CreateAdminCookie creates a cookie for admin
func (maker *PasetoMaker) CreateAdminCookie(adminID int32, duration time.Duration, httpOnly bool, secure bool) (http.Cookie, error) {
	token, _, err := maker.CreateAdminToken(adminID, duration)
	if err != nil {
		return http.Cookie{}, err
	}

	cookie, err := maker.CreateCookie(token, "admin_token", duration, httpOnly, secure)
	return cookie, err
}

// GetTokenFromRequest extracts token from Authorization header or cookie
func (maker *PasetoMaker) GetTokenFromRequest(r *http.Request, cookieName string) string {
	// Try Authorization header first
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		var token string
		_, err := fmt.Sscanf(authHeader, "Bearer %s", &token)
		if err == nil && token != "" {
			return token
		}
	}

	// Try cookie
	cookie, err := r.Cookie(cookieName)
	if err == nil && cookie.Value != "" {
		return cookie.Value
	}

	return ""
}

// GetUserTokenFromRequest extracts user token from request
func (maker *PasetoMaker) GetUserTokenFromRequest(r *http.Request) string {
	return maker.GetTokenFromRequest(r, "auth_token")
}

// GetAdminTokenFromRequest extracts admin token from request
func (maker *PasetoMaker) GetAdminTokenFromRequest(r *http.Request) string {
	return maker.GetTokenFromRequest(r, "admin_token")
}
