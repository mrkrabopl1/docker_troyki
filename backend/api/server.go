package api

import (
	"fmt"

	"github.com/go-chi/chi/v5"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/token"
)

// Server serves HTTP requests for our banking service.
type Server struct {
	store      db.Store
	router     *chi.Mux
	tokenMaker token.Maker
}

// NewServer creates a new HTTP server and set up routing.
func NewServer(config util.config, store db.Store) *Server {
	fmt.Println("flm;dlsmf;lsdmf;lmsd;flmsd;fl")
	tokenMaker, err := token.NewPasetoMaker(config.TokenSymmetricKey)
	if err != nil {
		return nil, fmt.Errorf("cannot create token maker: %w", err)
	}
	server := &Server{
		store:      store,
		router:     chi.NewRouter(),
		tokenMaker: tokenMaker,
	}
	server.routes()
	return server
}
