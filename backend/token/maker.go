package token

import (
	"net/http"
	"time"
)

// Maker is an interface for managing tokens
type Maker interface {
	// CreateToken creates a new token for a specific username and duration
	CreateToken(userid int32, duration time.Duration) (string, *Payload, error)

	// VerifyToken checks if the token is valid or not
	VerifyToken(token string) (*Payload, error)
	CreateJWTCoockie(userid int32, identifier string, duration time.Duration) (http.Cookie, error)
	CreateCoockie(token string, identifier string, duration time.Duration) (http.Cookie, error)
}
