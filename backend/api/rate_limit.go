package api

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type RateLimiter struct {
	ips map[string]*rate.Limiter
	mu  *sync.RWMutex
	r   rate.Limit
	b   int
}

func NewRateLimiter(r rate.Limit, b int) *RateLimiter {
	return &RateLimiter{
		ips: make(map[string]*rate.Limiter),
		mu:  &sync.RWMutex{},
		r:   r,
		b:   b,
	}
}

func (rl *RateLimiter) GetLimiter(ip string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	limiter, exists := rl.ips[ip]
	if !exists {
		limiter = rate.NewLimiter(rl.r, rl.b)
		rl.ips[ip] = limiter
	}
	return limiter
}

func RateLimitMiddleware(rl *RateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiter := rl.GetLimiter(ip)
		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "too many requests, please try again later",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// type RateLimiter struct {
// 	visitors map[string]*rate.Limiter
// 	mu       sync.RWMutex
// }

// func NewRateLimiter() *RateLimiter {
// 	rl := &RateLimiter{
// 		visitors: make(map[string]*rate.Limiter),
// 	}

// 	// Очищаем старые лимитеры каждые 10 минут
// 	go rl.cleanup()

// 	return rl
// }

// func (rl *RateLimiter) getLimiter(ip string, r rate.Limit, b int) *rate.Limiter {
// 	rl.mu.Lock()
// 	defer rl.mu.Unlock()

// 	if limiter, exists := rl.visitors[ip]; exists {
// 		return limiter
// 	}

// 	limiter := rate.NewLimiter(r, b)
// 	rl.visitors[ip] = limiter
// 	return limiter
// }

// func (rl *RateLimiter) cleanup() {
// 	ticker := time.NewTicker(10 * time.Minute)
// 	for range ticker.C {
// 		rl.mu.Lock()
// 		for ip, limiter := range rl.visitors {
// 			// Удаляем неактивные лимитеры
// 			if limiter.Allow() {
// 				delete(rl.visitors, ip)
// 			}
// 		}
// 		rl.mu.Unlock()
// 	}
// }

// // Middleware с разными лимитами
// func (rl *RateLimiter) RateLimit() gin.HandlerFunc {
// 	return func(c *gin.Context) {
// 		ip := c.ClientIP()
// 		path := c.Request.URL.Path

// 		var r rate.Limit
// 		var b int

// 		// Разные лимиты для разных маршрутов
// 		switch {
// 		case path == "/api/auth/login" || path == "/api/auth/register":
// 			r = 5 // 5 запросов в минуту
// 			b = 1
// 		case path == "/api/auth/reset-password":
// 			r = 3 // 3 запроса в минуту
// 			b = 1
// 		case strings.HasPrefix(path, "/api/admin"):
// 			r = 10 // 10 запросов в секунду
// 			b = 5
// 		case strings.HasPrefix(path, "/api/public"):
// 			r = 100 // 100 запросов в секунду
// 			b = 20
// 		default:
// 			r = 50 // 50 запросов в секунду
// 			b = 10
// 		}

// 		limiter := rl.getLimiter(ip, r, b)

// 		if !limiter.Allow() {
// 			c.JSON(http.StatusTooManyRequests, gin.H{
// 				"error":       "Too many requests. Please try again later.",
// 				"retry_after": "60",
// 			})
// 			c.Abort()
// 			return
// 		}

// 		c.Next()
// 	}
// }
