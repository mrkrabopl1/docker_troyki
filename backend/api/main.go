package api

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
)

func (s *Server) handleGetMainBanners(ctx *gin.Context) {
	fmt.Println("handleGetMainBanners")
	resp, err := s.store.GetActiveBanners(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Конвертируем в CreateBannerParams
	params := make([]db.CreateBannerParams, len(resp))
	for i, banner := range resp {
		params[i] = db.CreateBannerParams{
			Title:    pgtype.Text{String: banner.Title.String, Valid: banner.Title.Valid},
			ImageUrl: banner.ImageUrl,
			LinkUrl:  banner.LinkUrl,
		}
	}

	s.taskProcessor.SetBanners(ctx, params)
	ctx.JSON(http.StatusOK, resp)
}
