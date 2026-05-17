package api

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time" // <-- добавить для MaxAge

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/services"
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
	imageService    *services.ImageService
}

// NewServer creates a new HTTP server and set up routing.
func NewServer(config util.Config, store db.Store, taskDistributor worker.TaskDistributor, taskProcessor worker.TaskProcessor, imageService *services.ImageService) (*Server, error) {
	fmt.Println("NewServer")
	tokenMaker, err := token.NewPasetoMaker(config.TokenSymmetricKey)
	if err != nil {
		return nil, fmt.Errorf("cannot create token maker: %w", err)
	}

	server := &Server{
		config: config,
		store:  store,

		taskDistributor: taskDistributor,
		taskProcessor:   taskProcessor,
		tokenMaker:      tokenMaker,
		imageService:    imageService,
	}

	fmt.Println("NewServer")
	server.setupRouter()
	return server, nil
}

func (s *Server) setupRouter() {
	router := gin.Default()
	// router.Use(render.SetContentType(render.ContentTypeJSON))
	fmt.Println(s.config.AllowedOrigins, "ыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыыError while creating server")
	corsConfig := cors.Config{
		AllowOrigins:     s.config.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "Origin"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	router.Use(cors.New(corsConfig))
	router.Use(func(c *gin.Context) {
		fmt.Printf("Request: %s %s\n", c.Request.Method, c.Request.URL.Path)
		start := time.Now()

		c.Next()

		fmt.Printf("Response: %d, Duration: %v\n", c.Writer.Status(), time.Since(start))
	})
	// Apply CORS middleware
	// s.router.Use(corsOptions.Handler)
	// s.router.Use(loggingMiddleware)
	// s.router.With(querySelectionMiddleware("name")).Get("/snickersByFirm", s.handleGetSnickersByFirmName)
	// s.router.With(querySelectionMiddleware("name")).Get("/snickersByLine", s.handleGetSnickersByLineName)

	// s.router.With(querySelectionMiddleware("id")).Get("/ProductsInfo", s.handleGetProductsInfoById)
	router.GET("/sizeTable", s.handleGetSizes)
	router.GET("/firms", s.handleGetFirms)
	//s.router.Get("/mainPage", s.handleGetMainPage)

	//s.router.Get("/faq", s.handleFAQ)

	snickersRoute := router.Group("/")
	snickersRoute.Use(CachedMiddleware(s))
	snickersRoute.GET("/productsInfo", s.handleGetProductsInfoById)

	rateLimiter := NewRateLimiter(3, 3) // 3 запроса в секунду, burst 3

	newsletterGroup := router.Group("/newsletter")
	newsletterGroup.Use(RateLimitMiddleware(rateLimiter))
	{
		newsletterGroup.POST("/subscribe", s.handleSubscribeNewsletter)
		newsletterGroup.GET("/verify/:token", s.handleVerifyNewsletter)
		newsletterGroup.POST("/unsubscribe", s.handleUnsubscribeNewsletter)
	}

	bannerRoute := router.Group("/")
	bannerRoute.Use(CachedBannersMiddleware(s))
	bannerRoute.GET("/getMainBanners", s.handleGetMainBanners)

	router.POST("/searchProducts", s.handleSearchProducts)
	router.POST("/getProductsAndFiltersByNameCategoryAndType", s.handleSearchSnickersAndFiltersByNameCategoryAndType)
	router.POST("/getProductsByString", s.handleSearchProductsByString)
	router.POST("/collection", s.handleGetSoloCollection)
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
	router.POST("/registerUser", s.handleRegisterUser)
	router.POST("/login", s.handleLogin)
	router.GET("/unlogin", s.handleUnlogin)
	router.GET("/categoriesWithTypes", s.handleGetCategoriesWithTypes)
	router.GET("/pasetoAutorise", s.handlePasetoAutorise)
	router.GET("/getUserData", s.handleGetUserData)
	router.POST("/verify", s.handleVerifyUser)
	router.POST("/changePass", s.handleChangePass)
	router.GET("/forgetPass", s.handleForgetPass)
	router.POST("/verifyChangePass", s.handleVerifyForgetPass)
	router.POST("/changeForgetPass", s.handleChangeForgetPass)
	router.POST("/getDataByCategoriesAndFilters", s.handleSearchProductByCategoriesAndFilters)
	router.GET("/getMainPage", s.handleGetMainPageInfo)
	router.GET("/checkCustomerData", s.handleCheckCustomerData)

	router.POST("/admin/auth/login", s.handleAdminLogin)
	router.POST("/admin/auth/forgot-password", s.handleAdminForgotPass)
	router.POST("/admin/auth/refresh", s.handleAdminRefreshToken)
	router.POST("/admin/auth/change-forgot-password", s.handleAdminChangeForgetPass)
	adminGroup := router.Group("/admin")

	adminGroup.Use(s.AdminAuthMiddleware()) // Только админский middleware!
	{
		adminGroup.GET("/dashboard/stats", s.handleAdminGetDashboardStats)
		// Управление товарами (доступно admin и superadmin)
		adminGroup.POST("/products", s.handleAdminCreateProduct)

		adminGroup.GET("/productsAndFilters", s.handleAdminGetProductsAndFilters)
		adminGroup.POST("/products/search", s.handleAdminGetProducts)
		adminGroup.PUT("/products/:id", s.handleAdminUpdateProduct)
		adminGroup.GET("/products/:id", s.handleAdminGetProductById)
		adminGroup.DELETE("/products/:id", s.handleAdminHardDeleteProduct)
		adminGroup.POST("/products/:id/image", s.handleAdminUploadProductImage)
		adminGroup.PATCH("/products/bulk-status", s.handleAdminBulkUpdateProductStatus)
		adminGroup.PATCH("/products/bulk-price", s.handleBulkUpdateProductPrice)
		adminGroup.PATCH("/products/:id/status", s.handleAdminUpdateProductStatus)
		adminGroup.DELETE("/products/:id/image", s.handleAdminDeleteProductImage)

		adminGroup.POST("/tempImage/:id", s.handleAdminUploadTempImage)
		adminGroup.GET("/tempImage/:id", s.handleAdminGetTempImages)

		adminGroup.GET("/brandsWithLines", s.handleGetAllBrandsWithLines)
		adminGroup.POST("/firms", s.handleAdminCreateFirm)
		adminGroup.GET("/brands/:id", s.handleAdminGetBrandById)
		adminGroup.POST("/brands/:id", s.handleAdminUpdateBrand)
		adminGroup.PUT("/brands/bulk-sort-order", s.handleAdminBulkUpdateSortOrder)
		adminGroup.PUT("/brands/bulk-active", s.handleAdminBulkUpdateBrandActive)
		adminGroup.GET("/firms/stats", s.handleAdminGetFirmsStats)

		adminGroup.POST("/sql/execute", s.handleAdminExecuteSQL)

		// Управление скидками
		adminGroup.POST("/sales", s.handleAdminCreateSale)
		adminGroup.PUT("/sales/:id", s.handleAdminUpdateSale)
		adminGroup.DELETE("/sales/:id", s.handleAdminDeleteSale)
		adminGroup.GET("/sales", s.handleAdminGetSales)

		// Управление заказами
		adminGroup.GET("/orders", s.handleAdminGetOrders)
		adminGroup.GET("/orders/:id", s.handleAdminGetOrderDetails)
		adminGroup.PUT("/orders/:id/status", s.handleAdminUpdateOrderStatus)

		// Управление баннерами
		adminGroup.GET("/banners/filters", s.handleAdminGetBannersAndFilters)
		adminGroup.GET("/banners", s.handleAdminGetBanners)
		adminGroup.POST("/banners", s.handleAdminCreateBanner)
		adminGroup.PUT("/banners/:id", s.handleAdminUpdateBanner)
		adminGroup.DELETE("/banners/:id", s.handleAdminDeleteBanner)

		discountRules := adminGroup.Group("/discount-rules")
		{
			discountRules.POST("", s.handleAdminCreateDiscountRule)
			discountRules.GET("", s.handleAdminGetDiscountRules)
			discountRules.GET("active", s.handleAdminGetDiscountActiveRules)
			discountRules.GET("/by-entity", s.handleAdminGetDiscountRulesByEntity)
			discountRules.GET("/:id", s.handleAdminGetDiscountRule)
			discountRules.PUT("/:id", s.handleAdminUpdateDiscountRule)
			discountRules.DELETE("/:id", s.handleAdminDeleteDiscountRule)
			discountRules.POST("/:id/items", s.handleAdminAddRuleItems)
			discountRules.PATCH("/products", s.handleBulkUpdateProductDiscount)
			discountRules.DELETE("/:id/items", s.handleAdminRemoveRuleItem)
			discountRules.POST("/:id/toggle", s.handleAdminToggleRule)
		}

		adminGroup.GET("/auth/me", s.handleAdminGetMe)
		// // Управление пользователями
		// adminGroup.GET("/users", s.handleAdminGetUsers)
		// adminGroup.PUT("/users/:id/role", s.handleAdminUpdateUserRole)

		// Статистика

		// ========== ТОЛЬКО SUPERADMIN ==========
		superAdminGroup := adminGroup.Group("/")
		superAdminGroup.Use(s.SuperAdminMiddleware())
		{
			superAdminGroup.GET("/admins", s.handleAdminGetAdmins)
			superAdminGroup.POST("/admins", s.handleAdminCreateAdmin)
			superAdminGroup.PUT("/admins/:id", s.handleAdminUpdateAdmin)
			superAdminGroup.DELETE("/admins/:id", s.handleAdminDeleteAdmin)
			superAdminGroup.GET("/logs", s.handleAdminGetLogs)
		}
	}

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
