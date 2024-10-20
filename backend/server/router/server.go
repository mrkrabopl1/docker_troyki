package router

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/go-chi/chi/v5"
	"github.com/mrkrabopl1/go_db/config/config"
	"github.com/mrkrabopl1/go_db/db"
)

type Server struct {
	cfg    config.HTTPServer
	store  db.Interface
	router *chi.Mux
}

func NewServer(cfg config.HTTPServer, store db.Interface) *Server {
	srv := &Server{
		cfg:    cfg,
		store:  store,
		router: chi.NewRouter(),
	}

	srv.routes()

	return srv
}

func (s *Server) Start(ctx context.Context) {
	fmt.Println(s.cfg.Port, "port")
	fileServer := http.FileServer(http.Dir("./dist"))
	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", s.cfg.Port),
		Handler: s.router,
		// IdleTimeout:  s.cfg.IdleTimeout,
		// ReadTimeout:  s.cfg.ReadTimeout,
		// WriteTimeout: s.cfg.WriteTimeout,
	}

	// s.router.Get("/*", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	// 	http.ServeFile(w, r, "./dist/index.html")
	// }))
	// s.router.Get("/buy", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	// 	http.ServeFile(w, r, "./dist/index.html")
	// }))
	// s.router.Get("/images/*", func(w http.ResponseWriter, r *http.Request) {
	// 	http.StripPrefix("/images/", http.FileServer(http.Dir("./images"))).ServeHTTP(w, r)
	// })
	// s.router.Get("/collections/*", func(w http.ResponseWriter, r *http.Request) {
	// 	http.Redirect(w, r, "/", http.StatusFound)
	// })
	// s.router.Get("/images/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	// 	fmt.Println("jfnl3rfnlerjnglntglkn5yhmlytnhkgmr;f'gtkhkryht;grtm;lglgm5tlgm5[lmh5[l]]")
	// 	imageName := filepath.Base(r.URL.Path)
	// 	fmt.Println(imageName)
	// 	// Open the image file
	// 	imagePath := filepath.Join("uploads", imageName)
	// 	file, err := os.Open(imagePath)
	// 	if err != nil {
	// 		// Handle error (e.g., image not found)
	// 		w.WriteHeader(http.StatusNotFound)
	// 		return
	// 	}
	// 	defer file.Close()

	// 	// Serve the image
	// 	http.ServeContent(w, r, "", time.Now(), file)
	// }))

	s.router.Handle("/*", fileServer)

	shutdownComplete := handleShutdown(func() {
		if err := server.Shutdown(ctx); err != nil {
			log.Error("server.Shutdown failed: %v\n", err)
		}
	})
	if err := server.ListenAndServe(); err == http.ErrServerClosed {
		<-shutdownComplete
	} else {
		log.Error("http.ListenAndServe failed: %v\n", err)
	}

	log.InfoFields("Shutdown gracefully")
}

func handleShutdown(onShutdownSignal func()) <-chan struct{} {
	shutdown := make(chan struct{})

	go func() {
		shutdownSignal := make(chan os.Signal, 1)
		signal.Notify(shutdownSignal, os.Interrupt, syscall.SIGTERM)

		<-shutdownSignal

		onShutdownSignal()
		close(shutdown)
	}()

	return shutdown
}
