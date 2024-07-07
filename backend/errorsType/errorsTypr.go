package errorsType

import (
	"errors"
	"fmt"
)

// Sentinel errors
var (
	ErrExpire    = errors.New("expire")
	PassCoincide = errors.New("coincide")
)

func NewExpireError(details string) error {
	return fmt.Errorf("%w: %s", ErrExpire, details)
}
