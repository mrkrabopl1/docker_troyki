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

// CreateToken creates a new token for a specific username and duration
func (maker *PasetoMaker) CreateToken(userid int32, duration time.Duration) (string, *Payload, error) {
	payload, err := NewPayload(userid, duration)
	if err != nil {
		return "", payload, err
	}

	token, err := maker.paseto.Encrypt(maker.symmetricKey, payload, nil)
	return token, payload, err
}

// VerifyToken checks if the token is valid or not
func (maker *PasetoMaker) VerifyToken(token string) (*Payload, error) {
	payload := &Payload{}

	err := maker.paseto.Decrypt(token, maker.symmetricKey, payload, nil)
	if err != nil {
		return nil, ErrInvalidToken
	}

	fmt.Println(payload.ExpiredAt, "payload")

	err = payload.Valid()
	if err != nil {
		return nil, err
	}

	return payload, nil
}

// CreatePasetoCookie creates a cookie with PASETO token
func (maker *PasetoMaker) CreatePasetoCookie(userid int32, identifier string, duration time.Duration) (http.Cookie, error) {
	token, _, err := maker.CreateToken(userid, duration)
	var myCookie http.Cookie
	if err != nil {
		return myCookie, err
	}

	expirationTime := time.Now().Add(duration)

	myCookie = http.Cookie{
		Name:     identifier,
		Value:    token,
		Expires:  expirationTime,
		Path:     "/",
		MaxAge:   int(duration.Seconds()),
		HttpOnly: false,                // Рекомендуется true для безопасности
		Secure:   false,                // В production должно быть true (HTTPS)
		SameSite: http.SameSiteLaxMode, // Важно для кросс-доменных запросов
		Domain:   "",                   // Пустой domain означает текущий домен
	}
	return myCookie, nil
}

// CreateCookie creates a cookie with existing token
func (maker *PasetoMaker) CreateCookie(token string, identifier string, duration time.Duration) (http.Cookie, error) {
	expirationTime := time.Now().Add(duration)

	myCookie := http.Cookie{
		Name:     identifier,
		Value:    token,
		Expires:  expirationTime,
		Path:     "/",
		MaxAge:   int(duration.Seconds()),
		HttpOnly: false,                // Рекомендуется true для безопасности
		Secure:   false,                // В production должно быть true (HTTPS)
		SameSite: http.SameSiteLaxMode, // Важно для кросс-доменных запросов
		Domain:   "",                   // Пустой domain означает текущий домен
	}
	return myCookie, nil
}
