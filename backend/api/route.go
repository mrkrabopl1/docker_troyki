package api

// func (s *Server) routes() {
// 	s.router.Use(render.SetContentType(render.ContentTypeJSON))
// 	corsOptions := cors.New(cors.Options{
// 		AllowedOrigins:   []string{"http://localhost:3000"},
// 		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
// 		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
// 		AllowCredentials: true,
// 	})

// 	// Apply CORS middleware
// 	s.router.Use(corsOptions.Handler)
// 	s.router.Get("/firms", s.handleGetFirms)
// 	s.router.Get("/snickersByFirm", s.handleGetSnickersByFirmName)
// 	s.router.Get("/snickersByLine", s.handleGetSnickersByLineName)
// 	s.router.Get("/snickersInfo", s.handleGetSnickersInfoById)
// }
