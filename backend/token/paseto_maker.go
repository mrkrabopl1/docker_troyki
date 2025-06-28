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

func (maker *PasetoMaker) CreatePasetoCoockie(userid int32, identifier string, duration time.Duration) (http.Cookie, error) {
	token, _, err := maker.CreateToken(userid, duration)
	var myCookie http.Cookie
	if err != nil {
		//log.WithCaller().Err(err)
		return myCookie, err
	}
	myCookie = http.Cookie{
		Name:     identifier,
		Value:    token,
		Expires:  time.Now().Add(2 * time.Hour),
		Path:     "/",
		MaxAge:   3600,
		HttpOnly: false,
		Secure:   false,
		// SameSite: http.SameSiteNoneMode,
		Domain: "localhost:3000",
	}
	return myCookie, nil
}

func (maker *PasetoMaker) CreateCoockie(token string, identifier string, duration time.Duration) (http.Cookie, error) {
	var myCookie http.Cookie
	myCookie = http.Cookie{
		Name:  identifier,
		Value: token,
		//Expires:  expirationTime,
		Path:     "/",
		MaxAge:   3600,
		HttpOnly: false,
		Secure:   false,
		// SameSite: http.SameSiteNoneMode,
		// Domain:   "localhost:3000",
	}
	return myCookie, nil
}
