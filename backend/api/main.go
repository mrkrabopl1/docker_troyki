package api

import (
	"context"
	"fmt"
	"net/http"

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
	fmt.Println("handleGetMainInfo")

	// Try to get from cache first
	cachedData, err := s.taskProcessor.GetMainInfo(ctx)
	if err == nil {
		ctx.JSON(http.StatusOK, cachedData)
		return
	}

	// If not in cache, fetch from database
	response, err := s.store.GetCategoriesWithTypes(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	firms, err := s.store.GetFirms(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	discounts, err := s.store.GetAllActiveDiscountRules(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	mainInfo := db.MainInfoResponse{
		Categories: response,
		Firms:      firms,
		Discounts:  discounts,
		SizeTables: size.GetAll(),
	}

	// Cache the response (async to not block response)
	go func() {
		if err := s.taskProcessor.SetMainInfo(context.Background(), mainInfo); err != nil {
			fmt.Printf("Failed to cache main info: %v\n", err)
		}
	}()

	ctx.JSON(http.StatusOK, mainInfo)
}
