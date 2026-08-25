// api/health.go (НОВЫЙ ФАЙЛ)
package api

import (
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
)

type HealthResponse struct {
    Status    string    `json:"status"`
    Service   string    `json:"service"`
    Timestamp time.Time `json:"timestamp"`
    Database  string    `json:"database"`
    Version   string    `json:"version"`
}

// HealthCheckHandler - эндпоинт для проверки состояния
func (s *Server) HealthCheckHandler(c *gin.Context) {
    ctx := c.Request.Context()
    response := HealthResponse{
        Service:   "goapp1",
        Timestamp: time.Now(),
        Version:   "1.0.0",
    }
    
    // Проверяем БД
    if err := s.store.HealthCheck(ctx); err != nil {
        response.Status = "unhealthy"
        response.Database = "error: " + err.Error()
        c.JSON(http.StatusServiceUnavailable, response)
        return
    }
    
    response.Status = "healthy"
    response.Database = "connected"
    c.JSON(http.StatusOK, response)
}