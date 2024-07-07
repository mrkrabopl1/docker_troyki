package router

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"reflect"

	"github.com/go-chi/cors"
	"github.com/go-chi/render"
	"github.com/mrkrabopl1/go_db/server/contextKeys"
)

func querySelectionMiddleware(param string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Your middleware logic here...
			// For example, selecting specific query parameters
			param1 := r.URL.Query().Get(param)
			fmt.Println("Type of x:", reflect.TypeOf(param))
			fmt.Println(param)
			// Pass the selected parameters to the next handler via request context
			ctx := r.Context()
			ctx = context.WithValue(ctx, contextKeys.QueryKey, param1)

			fmt.Println("ctxWithValue")

			r = r.WithContext(ctx)

			// Call the next handler
			next.ServeHTTP(w, r)
		})
	}
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		slog.Info(r.Method, " ", r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

type responseWriterWrapper struct {
	http.ResponseWriter
	statusCode int
}

func (s *Server) routes() {
	s.router.Use(render.SetContentType(render.ContentTypeJSON))
	corsOptions := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
	})

	// Apply CORS middleware
	s.router.Use(corsOptions.Handler)
	s.router.Use(loggingMiddleware)
	s.router.With(querySelectionMiddleware("name")).Get("/snickersByFirm", s.handleGetSnickersByFirmName)
	s.router.With(querySelectionMiddleware("name")).Get("/snickersByLine", s.handleGetSnickersByLineName)

	s.router.With(querySelectionMiddleware("id")).Get("/snickersInfo", s.handleGetSnickersInfoById)
	s.router.Get("/sizeTable", s.handleGetSizes)
	s.router.Get("/firms", s.handleGetFirms)
	s.router.Get("/mainPage", s.handleGetMainPage)

	s.router.Get("/faq", s.handleFAQ)

	s.router.Post("/searchMerch", s.handleSearchMerch)
	s.router.Post("/getSnickersAndFiltersByString", s.handleSearchSnickersAndFiltersByString)
	s.router.Post("/getSnickersByString", s.handleSearchSnickersByString)
	s.router.Post("/collection", s.handleGetCollection)

	s.router.Post("/createPreorder", s.handleCreatePreorder)
	s.router.Post("/createOrder", s.handleCreateOrder)
	s.router.Post("/updatePreorder", s.handleUpdatePreorder)
	s.router.Get("/cartCount", s.handleGetCartCount)
	s.router.Get("/getCartData", s.handleGetCart)
	s.router.Post("/deleteCartData", s.handleDeleteCartData)

	s.router.Post("/registerUser", s.handleRegisterUser)
	s.router.Post("/login", s.handleLogin)
	s.router.Get("/jwtAutorise", s.handleJwtAutorise)
	s.router.Get("/getUserData", s.handleGetUserData)
	s.router.Post("/verify", s.handleVerifyUser)
	s.router.Post("/changePass", s.handleChangePass)
}
