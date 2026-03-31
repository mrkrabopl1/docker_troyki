package db

import (
	"context"
	"fmt"
	"testing"

	"github.com/stretchr/testify/require"
)

var testStore Store

// func TestMain(m *testing.M) {
// 	config, err := util.LoadConfig("../..")
// 	if err != nil {
// 		log.Fatal("cannot load config:", err)
// 	}

// 	connPool, err := pgxpool.New(context.Background(), config.DBSource)
// 	if err != nil {
// 		log.Fatal("cannot connect to db:", err)
// 	}

// 	testStore = NewStore(connPool)
// 	os.Exit(m.Run())
// }

func TestGetMainPageBanners(t *testing.T) {
	banners, err := testStore.GetMainPageBanners(context.Background())
	require.NoError(t, err)
	fmt.Println(banners[0].ImageUrl)
}
