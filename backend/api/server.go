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

	// ==================== ГРУППА /api ====================
	api := router.Group("/api")
	{
		// Snickers routes
		snickersRoute := api.Group("/")
		snickersRoute.Use(CachedMiddleware(s))
		snickersRoute.GET("/productsInfo", s.handleGetProductsInfoById)

		// Newsletter
		rateLimiter := NewRateLimiter(3, 3)
		newsletterGroup := api.Group("/newsletter")
		newsletterGroup.Use(RateLimitMiddleware(rateLimiter))
		{
			newsletterGroup.POST("/subscribe", s.handleSubscribeNewsletter)
			newsletterGroup.GET("/verify/:token", s.handleVerifyNewsletter)
			newsletterGroup.POST("/unsubscribe", s.handleUnsubscribeNewsletter)
		}

		// Banners
		bannerRoute := api.Group("/")
		bannerRoute.Use(CachedBannersMiddleware(s))
		bannerRoute.GET("/getMainBanners", s.handleGetMainBanners)

		// Основные API маршруты
		api.POST("/searchProducts", s.handleSearchProducts)
		api.POST("/getProductsAndFiltersByNameCategoryAndType", s.handleSearchSnickersAndFiltersByNameCategoryAndType)
		api.POST("/getProductsByString", s.handleSearchProductsByString)
		api.POST("/collection", s.handleGetSoloCollection)
		api.POST("/disconts", s.handleGetDiscounts)
		api.GET("/setUniqueCustomer", s.handleSetUniqueCustomer)
		api.POST("/createPreorder", s.handleCreatePreorder)
		api.POST("/createOrder", s.handleCreateOrder)
		api.POST("/updatePreorder", s.handleUpdatePreorder)
		api.GET("/getCartCount", s.handleGetCartCount)
		api.GET("/getCartData", s.handleGetCart)
		api.GET("/getCartDataFromOrder", s.handleGetCartFromOrder)
		api.GET("/getOrderDataByHash", s.handleGetOrderDataByHash)
		api.POST("/getOrderDataByMail", s.handleGetOrderDataByMail)
		api.POST("/deleteCartData", s.handleDeleteCartData)
		api.GET("/historyInfo", s.handleGetHistory)
		api.POST("/registerUser", s.handleRegisterUser)
		api.POST("/login", s.handleLogin)
		api.GET("/unlogin", s.handleUnlogin)
		api.GET("/categoriesWithTypes", s.handleGetCategoriesWithTypes)
		api.GET("/pasetoAutorise", s.handlePasetoAutorise)
		api.GET("/getUserData", s.handleGetUserData)
		api.POST("/verify", s.handleVerifyUser)
		api.POST("/changePass", s.handleChangePass)
		api.GET("/forgetPass", s.handleForgetPass)
		api.POST("/verifyChangePass", s.handleVerifyForgetPass)
		api.POST("/changeForgetPass", s.handleChangeForgetPass)
		api.POST("/getDataByCategoriesAndFilters", s.handleSearchProductByCategoriesAndFilters)
		api.GET("/getMainPage", s.handleGetMainPage)
		api.GET("/getMainInfo", s.handleGetMainInfo)
		api.GET("/checkCustomerData", s.handleCheckCustomerData)

		// Admin auth (без middleware)
		api.POST("/admin/auth/login", s.handleAdminLogin)
		api.POST("/admin/auth/forgot-password", s.handleAdminForgotPass)
		api.POST("/admin/auth/refresh", s.handleAdminRefreshToken)
		api.POST("/admin/auth/reset-password", s.handleAdminResetPassword)
		api.GET("/admin/verify-invite", s.handleAdminVerifyInvite)
		api.POST("/admin/accept-invite", s.handleAdminAcceptInvite)

		// Admin group с middleware
		adminGroup := api.Group("/admin")
		adminGroup.Use(s.AdminAuthMiddleware())
		{
			adminGroup.GET("/dashboard/stats", s.handleAdminGetDashboardStats)

			// Управление товарами
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
			adminGroup.DELETE("/tempImage/:id", s.handleAdminDeleteTempImage)
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

			adminGroup.GET("/sizes", s.handleAdminGetSizes)
			adminGroup.DELETE("/sizes", s.handleAdminBulkDeleteSize)
			adminGroup.PUT("/sizes", s.handleAdminRenameSize)

			adminGroup.GET("/page-blocks", s.handleAdminGetPageWidgets)
			adminGroup.POST("/page-blocks", s.handleAdminCreatePageWidget)
			adminGroup.PUT("/page-blocks/:id", s.handleAdminUpdatePageWidget)
			adminGroup.DELETE("/page-blocks/:id", s.handleAdminDeletePageWidget)
			adminGroup.PATCH("/page-blocks/reorder", s.handleAdminReorderPageWidgets)

			// Discount rules
			discountRules := adminGroup.Group("/discount-rules")
			{
				discountRules.POST("", s.handleAdminCreateDiscountRule)
				discountRules.GET("", s.handleAdminGetDiscountRules)
				discountRules.GET("/active", s.handleAdminGetDiscountActiveRules)
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

			// ========== ТОЛЬКО SUPERADMIN ==========
			superAdminGroup := adminGroup.Group("/")
			superAdminGroup.Use(s.SuperAdminMiddleware())
			{
				superAdminGroup.GET("/admins", s.handleAdminGetAdmins)
				superAdminGroup.POST("/admins", s.handleAdminCreateAdmin)
				superAdminGroup.PUT("/admins/:id", s.handleAdminUpdateAdmin)
				superAdminGroup.DELETE("/admins/:id", s.handleAdminDeleteAdmin)
				superAdminGroup.POST("/invites", s.handleAdminInviteAdmin)
				superAdminGroup.GET("/logs", s.handleAdminGetLogs)
			}
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
