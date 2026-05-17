package util

import (
	cryptorand "crypto/rand" // алиас для crypto/rand
	"encoding/hex"
	"math/rand"
	"strings"
	"time"
)

const alphabet = "abcdefghijklmnopqrstuvwxyz"

func init() {
	rand.Seed(time.Now().UnixNano()) // для math/rand
}

// RandomString - для тестов (использует math/rand)
func RandomString(n int) string {
	var sb strings.Builder
	k := len(alphabet)

	for i := 0; i < n; i++ {
		c := alphabet[rand.Intn(k)] // math/rand
		sb.WriteByte(c)
	}

	return sb.String()
}

// GenerateRandomToken - для безопасности (использует crypto/rand)
func GenerateRandomToken(bytesLength int) (string, error) {
	bytes := make([]byte, bytesLength)
	_, err := cryptorand.Read(bytes) // crypto/rand через алиас
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
