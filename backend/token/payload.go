package token

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// Different types of error returned by the VerifyToken function
var (
	ErrInvalidToken = errors.New("token is invalid")
	ErrExpiredToken = errors.New("token has expired")
)

// Payload contains the payload data of the token
type Payload struct {
	ID        uuid.UUID `json:"id"`
	UserID    int32     `json:"user_id"`
	IsAdmin   bool      `json:"is_admin"`
	IssuedAt  time.Time `json:"issued_at"`
	ExpiredAt time.Time `json:"expired_at"`
}

// NewPayload creates a new token payload for a user
func NewPayload(userID int32, isAdmin bool, duration time.Duration) (*Payload, error) {
	tokenID, err := uuid.NewRandom()
	if err != nil {
		return nil, err
	}

	payload := &Payload{
		ID:        tokenID,
		UserID:    userID,
		IsAdmin:   isAdmin,
		IssuedAt:  time.Now(),
		ExpiredAt: time.Now().Add(duration),
	}
	return payload, nil
}

// NewUserPayload creates a token for regular user
func NewUserPayload(userID int32, duration time.Duration) (*Payload, error) {
	return NewPayload(userID, false, duration)
}

// NewAdminPayload creates a token for admin
func NewAdminPayload(adminID int32, duration time.Duration) (*Payload, error) {
	return NewPayload(adminID, true, duration)
}

// Valid checks if the token payload is valid or not
func (payload *Payload) Valid() error {
	if time.Now().After(payload.ExpiredAt) {
		return ErrExpiredToken
	}
	return nil
}
