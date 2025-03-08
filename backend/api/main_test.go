package api

import (
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/token"
	"github.com/mrkrabopl1/go_db/util"
	"github.com/mrkrabopl1/go_db/worker"
	"github.com/stretchr/testify/require"
)

func newTestServer(t *testing.T, store db.Store, worker worker.TaskDistributor, taskProcessor worker.TaskProcessor) *Server {
	config := util.Config{
		TokenSymmetricKey:   util.RandomString(32),
		AccessTokenDuration: time.Minute,
	}

	server, err := NewServer(config, store, worker, taskProcessor)
	tokenMaker, err1 := token.NewPasetoMaker(config.TokenSymmetricKey)
	fmt.Println("tokenMaker", tokenMaker)
	fmt.Println("err1", err1, err)
	server.tokenMaker = tokenMaker
	require.NoError(t, err)

	return server
}

func TestMain(m *testing.M) {
	gin.SetMode(gin.TestMode)

	os.Exit(m.Run())
}
