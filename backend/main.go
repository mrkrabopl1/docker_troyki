package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/lib/pq"
	_ "github.com/lib/pq"
	"github.com/mrkrabopl1/go_db/api"
	"github.com/mrkrabopl1/go_db/config/config"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/mail"
	"github.com/mrkrabopl1/go_db/util"
	"github.com/mrkrabopl1/go_db/worker"
	"golang.org/x/sync/errgroup"
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

var interruptSignals = []os.Signal{
	os.Interrupt,
	syscall.SIGTERM,
	syscall.SIGINT,
}

func main() {
	//ctx := context.Background()
	//mailer := mail.NewGmailSender("config.EmailSenderName", "config.EmailSenderAddress", "config.EmailSenderPassword")
	fmt.Println("Hello")
	cfg := config.LoadConfig()
	cfg1, _ := util.LoadConfig(".")
	//cfg1.DBSource = os.Getenv("DATABASE_URL")
	fmt.Println(cfg1)
	fmt.Println(cfg)
	connPool, err := pgxpool.NewWithConfig(context.Background(), util.CreateConfig(cfg1.DBSource))
	if err != nil {
		log.Fatal("Error while creating connection to the database!!")
		return
	}

	store := db.NewStore(connPool)

	redisOpt := asynq.RedisClientOpt{
		Addr: cfg1.RedisAddress,
	}

	taskDistributor := worker.NewRedisTaskDistributor(redisOpt)
	ctx, stop := signal.NotifyContext(context.Background(), interruptSignals...)
	defer stop()
	waitGroup, ctx := errgroup.WithContext(ctx)

	taskProcessor := runTaskProcessor(ctx, waitGroup, cfg1, redisOpt, store)
	runGinServer(cfg1, store, taskDistributor, taskProcessor)
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

func runGinServer(config util.Config, store db.Store, taskDistributor worker.TaskDistributor, taskProcessor worker.TaskProcessor) {
	server, err := api.NewServer(config, store, taskDistributor, taskProcessor)
	if err != nil {
		fmt.Println(err, "Error while creating server")
		//log.Fatal().Err(err).Msg("cannot create server")
	}

	err = server.Start(config.HTTPServerAddress)
	if err != nil {
		fmt.Println(err, "Error while starting server1")
		//log.Fatal().Err(err).Msg("cannot start server")
	}
}

func runTaskProcessor(
	ctx context.Context,
	waitGroup *errgroup.Group,
	config util.Config,
	redisOpt asynq.RedisClientOpt,
	store db.Store,
) worker.TaskProcessor {
	mailer := mail.NewGmailSender(config.EmailSenderName, config.EmailSenderAddress, config.EmailSenderPassword)
	taskProcessor := worker.NewRedisTaskProcessor(redisOpt, store, mailer)

	//log.Info().Msg("start task processor")
	err := taskProcessor.Start()
	if err != nil {
		fmt.Println(err, "Error while starting server2")
		//log.Fatal().Err(err).Msg("failed to start task processor")
	}

	waitGroup.Go(func() error {
		<-ctx.Done()
		//log.Info().Msg("graceful shutdown task processor")

		taskProcessor.Shutdown()
		//log.Info().Msg("task processor is stopped")

		return nil
	})
	return taskProcessor
}
