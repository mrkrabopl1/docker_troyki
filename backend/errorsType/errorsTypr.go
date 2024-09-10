package errorsType

import (
	"errors"
	"fmt"
)

// Sentinel errors
var (
	ErrExpire    = errors.New("expire")
	PassCoincide = errors.New("coincide")
	NotExist     = errors.New("notExist")
)

func NewExpireError(details string) error {
	return fmt.Errorf("%w: %s", ErrExpire, details)
}
func NewNotExistError(details string) error {
	return fmt.Errorf("%w: %s", NotExist, details)
}
