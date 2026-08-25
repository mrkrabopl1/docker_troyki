package db

import (
	"context"
	"fmt"
)

func (s *SQLStore) HealthCheck(ctx context.Context) error {
	// Проверяем, что подключение к БД живо
	conn := s.connPool
	if conn == nil {
		return fmt.Errorf("database connection pool is nil")
	}

	// Пингуем БД
	if err := conn.Ping(ctx); err != nil {
		return fmt.Errorf("database ping failed: %w", err)
	}

	return nil
}
