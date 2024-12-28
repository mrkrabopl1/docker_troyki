package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

type PostgresStore struct {
	databaseUrl string
	dbx         *sqlx.DB
}

type TextArray []string

func (t *TextArray) Scan(src interface{}) error {
	if src == nil {
		*t = nil
		return nil
	}

	switch v := src.(type) {
	case []string:
		*t = v
	default:
		return fmt.Errorf("cannot scan into TextArray: %v", v)
	}
	return nil
}

type IntArray []int

func (t *IntArray) Scan(src interface{}) error {
	if src == nil {
		*t = nil
		return nil
	}

	switch v := src.(type) {
	case []int:
		*t = v
	default:
		return fmt.Errorf("cannot scan into TextArray: %v", v)
	}
	return nil
}

func NewPostgresStore(databaseUrl string) *PostgresStore {
	return &PostgresStore{
		databaseUrl: databaseUrl,
	}
}

const DriverName = "postgres"

func (s *PostgresStore) connect(ctx context.Context) (*sqlx.DB, error) {
	dbx, err := sqlx.ConnectContext(ctx, DriverName, s.databaseUrl)
	if err != nil {
		return nil, err
	}
	dbx.SetMaxOpenConns(10)
	dbx.SetConnMaxLifetime(1 * time.Minute)

	return dbx, nil
	// dbx, err := sqlx.Open(driverName, s.databaseUrl)

	// fmt.Println(s.databaseUrl)
	// //dbx, err := sqlx.ConnectContext(ctx, driverName, s.databaseUrl)
	// if err != nil {
	// 	fmt.Println()
	// 	return err
	// }

	// s.dbx = dbx
	// return nil
}

func (s *PostgresStore) close() error {
	return s.dbx.Close()
}
