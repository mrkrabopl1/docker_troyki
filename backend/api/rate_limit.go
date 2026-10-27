package api

import (
	"fmt"
	"net/http"
	"sync"
	"time"

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

type ipLimiter struct {
	mu       sync.Mutex
	limiters map[string]*ipLimiterEntry
	rate     rate.Limit
	burst    int
	ttl      time.Duration
}

type ipLimiterEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

func newIPLimiter(r rate.Limit, b int, ttl time.Duration) *ipLimiter {
	l := &ipLimiter{
		limiters: make(map[string]*ipLimiterEntry),
		rate:     r,
		burst:    b,
		ttl:      ttl,
	}
	go l.cleanupLoop()
	return l
}

func (l *ipLimiter) get(ip string) *rate.Limiter {
	l.mu.Lock()
	defer l.mu.Unlock()

	entry, ok := l.limiters[ip]
	if !ok {
		entry = &ipLimiterEntry{
			limiter: rate.NewLimiter(l.rate, l.burst),
		}
		l.limiters[ip] = entry
	}
	entry.lastSeen = time.Now()
	return entry.limiter
}

func (l *ipLimiter) cleanupLoop() {
	ticker := time.NewTicker(l.ttl)
	defer ticker.Stop()
	for range ticker.C {
		l.mu.Lock()
		cutoff := time.Now().Add(-l.ttl)
		for ip, entry := range l.limiters {
			if entry.lastSeen.Before(cutoff) {
				delete(l.limiters, ip)
			}
		}
		l.mu.Unlock()
	}
}

// RateLimitByIP — middleware, ограничивающий запросы с одного IP.
func RateLimitByIP(limiter *ipLimiter) gin.HandlerFunc {
	fmt.Println("fmdlsnfsdjfnsdjfsldk")
	return func(c *gin.Context) {
		fmt.Println("12345", limiter.get(c.ClientIP()))
		if !limiter.get(c.ClientIP()).Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "too many requests, please try again later",
			})
			return
		}
		c.Next()
	}
}
