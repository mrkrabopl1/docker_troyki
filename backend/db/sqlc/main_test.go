package db

import (
	"context"
	"fmt"
	"log"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mrkrabopl1/go_db/services"
	"github.com/mrkrabopl1/go_db/util"
	"github.com/stretchr/testify/require"
)

var testStore Store
var testImagePathBuilder *services.ImagePathBuilder

func TestMain(m *testing.M) {
	config, err := util.LoadConfig("../..")
	if err != nil {
		log.Fatal("cannot load config:", err)
	}

	connPool, err := pgxpool.New(context.Background(), config.DBSource)
	if err != nil {
		log.Fatal("cannot connect to db:", err)
	}

	imageService := services.NewImageService(
		config.ImageBaseDir,
		config.ImageBasePath,
		config.UseCDN,
		config.MaxImageSizeMB,
	)

	// СОЗДАЕМ Store с ImageService
	testStore = NewStore(connPool, imageService.ImagePathBuilder)
	testImagePathBuilder = imageService.ImagePathBuilder
	os.Exit(m.Run())
}

func TestGetMainPageBanners(t *testing.T) {
	banners, err := testStore.GetActiveBanners(context.Background())
	require.NoError(t, err)
	fmt.Println(banners[0].ImageUrl)
}
