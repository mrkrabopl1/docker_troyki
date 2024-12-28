package db

import (
	"context"
	"fmt"
	"log"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mrkrabopl1/go_db/config/config"
	"github.com/mrkrabopl1/go_db/util"
)

var testStore Store

func TestMain(m *testing.M) {
	fmt.Println("start test")
	cfg := config.LoadConfig()
	fmt.Println(cfg)

	connPool, err := pgxpool.NewWithConfig(context.Background(), util.Config(cfg))
	if err != nil {
		log.Fatal("cannot connect to db:", err)
	}

	testStore = NewStore(connPool)
	os.Exit(m.Run())
}
