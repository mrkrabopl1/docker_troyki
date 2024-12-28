package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/lib/pq"
	_ "github.com/lib/pq"
	"github.com/mrkrabopl1/go_db/config/config"
	"github.com/mrkrabopl1/go_db/util"
)

type Snickers struct {
	// Name       string
	Firm string
	Line []string
	// Image_path string
	// Id         int
	// Info       []byte
}

type Result struct {
	Firm        string         `db:"firm"`
	ArrayOfData pq.StringArray `db:"array_of_data"`
}

func main() {
	//ctx := context.Background()
	cfg := config.LoadConfig()
	connPool, err := pgxpool.NewWithConfig(context.Background(), util.Config(cfg))
	if err != nil {
		log.Fatal("Error while creating connection to the database!!")
	}

	connection, err := connPool.Acquire(context.Background())
	if err != nil {
		log.Fatal("Error while acquiring connection from the database pool!!")
	}
	defer connection.Release()

	err = connection.Ping(context.Background())
	if err != nil {
		log.Fatal("Could not ping database")
	}

	fmt.Println("Connected to the database!!")
	//postgres_db

	// dbPath := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", "localhost", "5432", cfg.PgUser, cfg.PgPass, cfg.PgBase)
	// // fmt.Println(dbPath, os.Getenv("DATABASE_URL"), "tggtttttttttttttttttttttttttttttttttttttttttttttttttt")
	// //store := db.NewPostgresStore(os.Getenv("DATABASE_URL"))
	// store := db.NewPostgresStore(dbPath)
	// //	store.CreateTables(ctx)

	// // store.UpdateTable(ctx)

	// //store.GetTest(ctx)

	// // data := db.JSONTransformToStruct()
	// // store.FillTables(ctx, data)

	// server := router.NewServer(cfg.HTTPServer, store)
	// server.Start(ctx)

}
