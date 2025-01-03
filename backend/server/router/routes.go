package router

import (
	"context"
	"fmt"
	"net/http"
	"reflect"

	"github.com/go-chi/cors"
	"github.com/go-chi/render"
	"github.com/mrkrabopl1/go_db/logger"
	"github.com/mrkrabopl1/go_db/server/contextKeys"
)

var log = logger.InitLogger()

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
		log.InfoFields(r.Method, " ", r.URL.Path)
		log.Log.Info().Msg(r.RemoteAddr)
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
	s.router.Post("/collection", s.handleGetSoloCollection)
	s.router.Post("/collections", s.handleGetCollection)
	s.router.Post("/disconts", s.handleGetDiscounts)
	s.router.Get("/setUniqueCustomer", s.handleSetUniqueCustomer)
	s.router.Post("/createPreorder", s.handleCreatePreorder)
	s.router.Post("/createOrder", s.handleCreateOrder)
	s.router.Post("/updatePreorder", s.handleUpdatePreorder)
	s.router.Get("/cartCount", s.handleGetCartCount)
	s.router.Get("/getCartData", s.handleGetCart)
	s.router.Get("/getCartDataFromOrder", s.handleGetCartFromOrder)
	s.router.Get("/getOrderDataByHash", s.handleGetOrderDataByHash)
	s.router.Post("/getOrderDataByMail", s.handleGetOrderDataByMail)
	s.router.Post("/deleteCartData", s.handleDeleteCartData)
	s.router.Get("/historyInfo", s.handleGetHistory)

	s.router.Post("/registerUser", s.handleRegisterUser)
	s.router.Post("/login", s.handleLogin)
	s.router.Get("/unlogin", s.handleUnlogin)
	s.router.Get("/jwtAutorise", s.handleJwtAutorise)
	s.router.Get("/getUserData", s.handleGetUserData)
	s.router.Post("/verify", s.handleVerifyUser)
	s.router.Post("/changePass", s.handleChangePass)
	s.router.Get("/forgetPass", s.handleForgetPass)
	s.router.Post("/verifyChangePass", s.handleVerifyForgetPass)
	s.router.Post("/changeForgetPass", s.handleChangeForgetPass)

	s.router.Get("/checkCustomerData", s.handleCheckCustomerData)
}
