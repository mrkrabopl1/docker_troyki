package api

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/internal/size"
)

func (s *Server) handleGetMainBanners(ctx *gin.Context) {
	fmt.Println("handleGetMainBanners")
	resp, err := s.store.GetActiveBanners(ctx)
	if err != nil {
		fmt.Println("Error fetching active banners:", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	params := make([]db.GetActiveBannersRow, len(resp))
	for i, banner := range resp {
		fullURL := s.imageService.ImagePathBuilder.GetImageURLFromPath(banner.ImageUrl)
		fmt.Println("Banner from DB:", fullURL)
		resp[i].ImageUrl = fullURL // <-- ОБНОВЛЯЕМ ИСХОДНЫЙ СЛАЙС
		fmt.Println(banner.CollectionSlug, "sndlnljnndskajnd")
		params[i] = db.GetActiveBannersRow{
			Title:          pgtype.Text{String: banner.Title.String, Valid: banner.Title.Valid},
			ImageUrl:       fullURL,
			CollectionID:   banner.CollectionID,
			CollectionSlug: banner.CollectionSlug,
		}
	}
	fmt.Println(params, "paaaaaaaarams")
	s.taskProcessor.SetBanners(ctx, params)
	ctx.JSON(http.StatusOK, resp)
}

type MainInfoResponse struct {
	Categories []db.GetCategoriesWithTypesRow `json:"categories"`
	Firms      []db.GetFirmsRow               `json:"firms"`
	Discounts  []db.DiscountRule              `json:"discounts"`
	SizeTables map[string]interface{}         `json:"sizeTables"`
}

func (s *Server) handleGetMainInfo(ctx *gin.Context) {
	startTime := time.Now()
	fmt.Printf("⏱️ [handleGetMainInfo] START at %s\n", startTime.Format(time.RFC3339Nano))

	// Try to get from cache first
	cacheStart := time.Now()
	cachedData, err := s.taskProcessor.GetMainInfo(ctx)
	if err == nil {
		cacheElapsed := time.Since(cacheStart)
		fmt.Printf("⏱️ [handleGetMainInfo] ✅ FROM CACHE in %dms\n", cacheElapsed.Milliseconds())
		ctx.JSON(http.StatusOK, cachedData)
		return
	}
	cacheElapsed := time.Since(cacheStart)
	fmt.Printf("⏱️ [handleGetMainInfo] ❌ CACHE MISS in %dms\n", cacheElapsed.Milliseconds())

	// If not in cache, fetch from database
	fmt.Printf("⏱️ [handleGetMainInfo] 🔄 Fetching from database...\n")

	// 1. Get Categories with Types
	categoriesStart := time.Now()
	response, err := s.store.GetCategoriesWithTypes(ctx)
	if err != nil {
		fmt.Printf("⏱️ [handleGetMainInfo] ❌ GetCategoriesWithTypes FAILED after %dms: %v\n", time.Since(categoriesStart).Milliseconds(), err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	categoriesElapsed := time.Since(categoriesStart)
	fmt.Printf("⏱️ [handleGetMainInfo] ✅ GetCategoriesWithTypes: %dms, %d categories\n", categoriesElapsed.Milliseconds(), len(response))

	// 2. Get Firms
	firmsStart := time.Now()
	firms, err := s.store.GetFirms(ctx)
	if err != nil {
		fmt.Printf("⏱️ [handleGetMainInfo] ❌ GetFirms FAILED after %dms: %v\n", time.Since(firmsStart).Milliseconds(), err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	firmsElapsed := time.Since(firmsStart)
	fmt.Printf("⏱️ [handleGetMainInfo] ✅ GetFirms: %dms, %d firms\n", firmsElapsed.Milliseconds(), len(firms))

	// 3. Get Discounts
	discountsStart := time.Now()
	discounts, err := s.store.GetAllActiveDiscountRules(ctx)
	if err != nil {
		fmt.Printf("⏱️ [handleGetMainInfo] ❌ GetAllActiveDiscountRules FAILED after %dms: %v\n", time.Since(discountsStart).Milliseconds(), err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	discountsElapsed := time.Since(discountsStart)
	fmt.Printf("⏱️ [handleGetMainInfo] ✅ GetAllActiveDiscountRules: %dms, %d discounts\n", discountsElapsed.Milliseconds(), len(discounts))

	// 4. Get Size Tables
	sizeStart := time.Now()
	sizeTables := size.GetAll()
	sizeElapsed := time.Since(sizeStart)
	fmt.Printf("⏱️ [handleGetMainInfo] ✅ SizeTables: %dms, %d entries\n", sizeElapsed.Milliseconds(), len(sizeTables))

	// Build response
	buildStart := time.Now()
	mainInfo := db.MainInfoResponse{
		Categories: response,
		Firms:      firms,
		Discounts:  discounts,
		SizeTables: sizeTables,
	}
	buildElapsed := time.Since(buildStart)
	fmt.Printf("⏱️ [handleGetMainInfo] ✅ Response built in %dms\n", buildElapsed.Milliseconds())

	// Cache the response (async to not block response)
	cacheSetStart := time.Now()
	go func() {
		if err := s.taskProcessor.SetMainInfo(context.Background(), mainInfo); err != nil {
			fmt.Printf("⏱️ [handleGetMainInfo] ❌ Failed to cache: %v\n", err)
		} else {
			fmt.Printf("⏱️ [handleGetMainInfo] 💾 Cached in %dms\n", time.Since(cacheSetStart).Milliseconds())
		}
	}()

	totalElapsed := time.Since(startTime)
	fmt.Printf("⏱️ [handleGetMainInfo] 🏁 TOTAL TIME: %dms\n", totalElapsed.Milliseconds())
	fmt.Printf("⏱️ [handleGetMainInfo] 📊 Data stats: categories=%d, firms=%d, discounts=%d, sizeTables=%d\n",
		len(response), len(firms), len(discounts), len(sizeTables))

	ctx.JSON(http.StatusOK, mainInfo)
}

func (s *Server) handleGetBrandsWithLines(ctx *gin.Context) {

	firmsStart := time.Now()
	firms, err := s.store.GetFirms(ctx)
	if err != nil {
		fmt.Printf("⏱️ [handleGetMainInfo] ❌ GetFirms FAILED after %dms: %v\n", time.Since(firmsStart).Milliseconds(), err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	firmsElapsed := time.Since(firmsStart)
	fmt.Printf("⏱️ [handleGetMainInfo] ✅ GetFirms: %dms, %d firms\n", firmsElapsed.Milliseconds(), len(firms))

	buildStart := time.Now()
	mainInfo := db.MainInfoResponse{
		Firms: firms,
	}
	buildElapsed := time.Since(buildStart)
	fmt.Printf("⏱️ [handleGetMainInfo] ✅ Response built in %dms\n", buildElapsed.Milliseconds())

	// Cache the response (async to not block response)
	cacheSetStart := time.Now()
	go func() {
		if err := s.taskProcessor.SetMainInfo(context.Background(), mainInfo); err != nil {
			fmt.Printf("⏱️ [handleGetMainInfo] ❌ Failed to cache: %v\n", err)
		} else {
			fmt.Printf("⏱️ [handleGetMainInfo] 💾 Cached in %dms\n", time.Since(cacheSetStart).Milliseconds())
		}
	}()

	ctx.JSON(http.StatusOK, mainInfo)
}

func (s *Server) handleGetMenuInfo(ctx *gin.Context) {
	startTime := time.Now()
	fmt.Printf("⏱️ [handleGetMenuInfo] START at %s\n", startTime.Format(time.RFC3339Nano))

	// // Try to get from cache first
	// cacheStart := time.Now()
	// cachedData, err := s.taskProcessor.GetMenuInfo(ctx)
	// if err == nil {
	// 	cacheElapsed := time.Since(cacheStart)
	// 	fmt.Printf("⏱️ [handleGetMainInfo] ✅ FROM CACHE in %dms\n", cacheElapsed.Milliseconds())
	// 	ctx.JSON(http.StatusOK, cachedData)
	// 	return
	// }
	// cacheElapsed := time.Since(cacheStart)
	// fmt.Printf("⏱️ [handleGetMainInfo] ❌ CACHE MISS in %dms\n", cacheElapsed.Milliseconds())

	// // If not in cache, fetch from database
	// fmt.Printf("⏱️ [handleGetMainInfo] 🔄 Fetching from database...\n")

	// 1. Get Categories with Types
	categoriesStart := time.Now()
	response, err := s.store.GetCategoriesWithTypes(ctx)
	if err != nil {
		fmt.Printf("⏱️ [handleGetMainInfo] ❌ GetCategoriesWithTypes FAILED after %dms: %v\n", time.Since(categoriesStart).Milliseconds(), err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	categoriesElapsed := time.Since(categoriesStart)
	fmt.Printf("⏱️ [handleGetMainInfo] ✅ GetCategoriesWithTypes: %dms, %d categories\n", categoriesElapsed.Milliseconds(), len(response))

	// 3. Get Discounts
	discountsStart := time.Now()
	discounts, err := s.store.GetAllActiveDiscountRules(ctx)
	if err != nil {
		fmt.Printf("⏱️ [handleGetMainInfo] ❌ GetAllActiveDiscountRules FAILED after %dms: %v\n", time.Since(discountsStart).Milliseconds(), err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	discountsElapsed := time.Since(discountsStart)
	fmt.Printf("⏱️ [handleGetMainInfo] ✅ GetAllActiveDiscountRules: %dms, %d discounts\n", discountsElapsed.Milliseconds(), len(discounts))

	// 4. Get Size Tables
	sizeStart := time.Now()
	sizeTables := size.GetAll()
	sizeElapsed := time.Since(sizeStart)
	fmt.Printf("⏱️ [handleGetMainInfo] ✅ SizeTables: %dms, %d entries\n", sizeElapsed.Milliseconds(), len(sizeTables))

	// Build response
	buildStart := time.Now()
	menuInfo := db.MainInfoResponse{
		Categories: response,
		Discounts:  discounts,
		SizeTables: sizeTables,
	}
	buildElapsed := time.Since(buildStart)
	fmt.Printf("⏱️ [handleGetMainInfo] ✅ Response built in %dms\n", buildElapsed.Milliseconds())

	// Cache the response (async to not block response)
	// cacheSetStart := time.Now()
	// go func() {
	// 	if err := s.taskProcessor.SetMenuInfo(context.Background(), mainInfo); err != nil {
	// 		fmt.Printf("⏱️ [handleGetMainInfo] ❌ Failed to cache: %v\n", err)
	// 	} else {
	// 		fmt.Printf("⏱️ [handleGetMainInfo] 💾 Cached in %dms\n", time.Since(cacheSetStart).Milliseconds())
	// 	}
	// }()

	// totalElapsed := time.Since(startTime)
	// fmt.Printf("⏱️ [handleGetMainInfo] 🏁 TOTAL TIME: %dms\n", totalElapsed.Milliseconds())
	fmt.Printf("⏱️ [handleGetMainInfo] 📊 Data stats: categories=%d, firms=%d, discounts=%d, sizeTables=%d\n",
		len(response), len(discounts), len(sizeTables))

	ctx.JSON(http.StatusOK, menuInfo)
}
