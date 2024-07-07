package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

type PostgresStore struct {
	databaseUrl string
	dbx         *sqlx.DB
}

func NewPostgresStore(databaseUrl string) *PostgresStore {
	return &PostgresStore{
		databaseUrl: databaseUrl,
	}
}

const DriverName = "postgres"

func (s *PostgresStore) connect(ctx context.Context) (*sqlx.DB, error) {
	fmt.Println(";fldsflds;fdskfsldkflsdkflksdnflskdnf")
	fmt.Println(s.databaseUrl)
	dbx, err := sqlx.ConnectContext(ctx, DriverName, s.databaseUrl)
	if err != nil {
		fmt.Println(err, ";sdmgllkdmm;gld'gdlkhflgj;hfh'lgnh;gfkh;kdlkhlmfht;khm'tmhptlgkddmgpfpg[ey[eokgeok]]")
		return nil, err
	}

	fmt.Println(dbx, err, "g;kfmg;lfmg;ldm;gmdf;gmd;gkhm;fgmhlfh;fm;hmglh;flmh;flmh;fmgh;,f;bmf;lmh;flgmh;lfmh;kfmghkmfg")

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
