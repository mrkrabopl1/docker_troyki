package api

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/token"
	"github.com/mrkrabopl1/go_db/util"
	"github.com/mrkrabopl1/go_db/worker"
)

// Server serves HTTP requests for our banking service.
type Server struct {
	config          util.Config
	store           db.Store
	tokenMaker      token.Maker
	router          *gin.Engine
	taskDistributor worker.TaskDistributor
	taskProcessor   worker.TaskProcessor
}

// NewServer creates a new HTTP server and set up routing.
func NewServer(config util.Config, store db.Store, taskDistributor worker.TaskDistributor, taskProcessor worker.TaskProcessor) (*Server, error) {
	fmt.Println("NewServer")
	tokenMaker, err := token.NewPasetoMaker(config.TokenSymmetricKey)
	if err != nil {
		return nil, fmt.Errorf("cannot create token maker: %w", err)
	}

	server := &Server{
		config:          config,
		store:           store,
		taskDistributor: taskDistributor,
		taskProcessor:   taskProcessor,
		tokenMaker:      tokenMaker,
	}

	fmt.Println("NewServer")
	server.setupRouter()
	return server, nil
}

func (s *Server) setupRouter() {
	router := gin.Default()
	// router.Use(render.SetContentType(render.ContentTypeJSON))
	corsConfig := cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"}, //.config.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
	}
	router.Use(cors.New(corsConfig))
	// Apply CORS middleware
	// s.router.Use(corsOptions.Handler)
	// s.router.Use(loggingMiddleware)
	// s.router.With(querySelectionMiddleware("name")).Get("/snickersByFirm", s.handleGetSnickersByFirmName)
	// s.router.With(querySelectionMiddleware("name")).Get("/snickersByLine", s.handleGetSnickersByLineName)

	// s.router.With(querySelectionMiddleware("id")).Get("/snickersInfo", s.handleGetSnickersInfoById)
	router.GET("/sizeTable", s.handleGetSizes)
	router.GET("/firms", s.handleGetFirms)
	//s.router.Get("/mainPage", s.handleGetMainPage)

	//s.router.Get("/faq", s.handleFAQ)

	snickersRoute := router.Group("/")
	snickersRoute.Use(CachedMiddleware(s))
	snickersRoute.GET("/snickersInfo", s.handleGetSnickersInfoById)

	router.POST("/searchMerch", s.handleSearchMerch)
	router.POST("/getSnickersAndFiltersByString", s.handleSearchSnickersAndFiltersByString)
	router.POST("/getSnickersByString", s.handleSearchSnickersByString)
	router.POST("/collection", s.handleGetSoloCollection)
	router.POST("/collections", s.handleGetCollection)
	router.POST("/disconts", s.handleGetDiscounts)
	router.GET("/setUniqueCustomer", s.handleSetUniqueCustomer)
	router.POST("/createPreorder", s.handleCreatePreorder)
	router.POST("/createOrder", s.handleCreateOrder)
	router.POST("/updatePreorder", s.handleUpdatePreorder)
	router.GET("/getCartCount", s.handleGetCartCount)
	router.GET("/getCartData", s.handleGetCart)
	router.GET("/getCartDataFromOrder", s.handleGetCartFromOrder)
	router.GET("/getOrderDataByHash", s.handleGetOrderDataByHash)
	router.POST("/getOrderDataByMail", s.handleGetOrderDataByMail)
	router.POST("/deleteCartData", s.handleDeleteCartData)
	router.GET("/historyInfo", s.handleGetHistory)
	router.GET("/collectionCount", s.handleGetCollectionCount)
	router.POST("/registerUser", s.handleRegisterUser)
	router.POST("/login", s.handleLogin)
	router.GET("/unlogin", s.handleUnlogin)
	router.GET("/jwtAutorise", s.handleJwtAutorise)
	router.GET("/getUserData", s.handleGetUserData)
	router.POST("/verify", s.handleVerifyUser)
	router.POST("/changePass", s.handleChangePass)
	router.GET("/forgetPass", s.handleForgetPass)
	router.POST("/verifyChangePass", s.handleVerifyForgetPass)
	router.POST("/changeForgetPass", s.handleChangeForgetPass)

	router.GET("/checkCustomerData", s.handleCheckCustomerData)

	s.router = router
}

func (server *Server) Start(address string) error {
	fmt.Println(server.router, "dnlsakdmas;")
	return server.router.Run(address)
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
func errorResponse(err error) gin.H {
	return gin.H{"error": err.Error()}
}
