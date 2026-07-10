package api

import (
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
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	params := make([]db.CreateBannerParams, len(resp))
	for i, banner := range resp {
		fullURL := s.imageService.ImagePathBuilder.GetImageURLFromPath(banner.ImageUrl)
		fmt.Println("Banner from DB:", fullURL)
		resp[i].ImageUrl = fullURL // <-- ОБНОВЛЯЕМ ИСХОДНЫЙ СЛАЙС
		params[i] = db.CreateBannerParams{
			Title:    pgtype.Text{String: banner.Title.String, Valid: banner.Title.Valid},
			ImageUrl: fullURL,
			LinkUrl:  banner.LinkUrl,
		}
	}

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
	discounts, _ := s.store.GetAllActiveDiscountRules(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, MainInfoResponse{Categories: response, Firms: firms, Discounts: discounts, SizeTables: size.GetAll()})
}
