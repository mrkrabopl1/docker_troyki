package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/types"
)

func (s *Server) handleGetFirms(ctx *gin.Context) {
	fmt.Println("fkms;dlmf;dslmf;sdmf;lsmd;kmkdgb;lmf;gkfm;lgms;dkmf;")
	firms, err := s.store.GetFirms(ctx)
	if err != nil {
		//log.WithCaller().Err(err)
		ctx.JSON(http.StatusUnauthorized, errorResponse(err))
		return
	}
	ctx.JSON(http.StatusOK, firms)
}

func (s *Server) handleGetSnickersByFirmName(ctx *gin.Context) {
	firm := ctx.Query("firm")
	snickers, err := s.store.GetSnickersByFirmName(ctx, firm)
	if err != nil {
		//log.WithCaller().Err(err)
		ctx.JSON(http.StatusUnauthorized, errorResponse(err))
		return
	}
	ctx.JSON(http.StatusOK, snickers)
}
func (s *Server) handleGetSnickersByLineName(ctx *gin.Context) {
	line := ctx.Query("line")
	snickers, err := s.store.GetSnickersByLineName(ctx, line)
	if err != nil {
		//log.WithCaller().Err(err)
		ctx.JSON(http.StatusUnauthorized, errorResponse(err))
		return
	}
	// firmsList := NewSnickersLineResponse(firms)
	ctx.JSON(http.StatusOK, snickers)
}
func (s *Server) handleGetSizes(ctx *gin.Context) {
	file, err := os.ReadFile("json/sizeTable.json")
	if err != nil {
		//log.WithCaller().Err(err)
		ctx.JSON(http.StatusUnauthorized, errorResponse(err))
		return
	}
	var data interface{}
	json.Unmarshal(file, &data)
	ctx.JSON(http.StatusOK, data)
}
func (s *Server) handleGetSnickersInfoById(ctx *gin.Context) {
	id := ctx.Query("id")
	fmt.Println("id", id)
	numId, err := strconv.ParseInt(id, 10, 32)
	if err != nil {
		fmt.Println("dmsa;mdasmd;aslmd;asl;l")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	int32Value := int32(numId)
	snickersInfo, err2 := s.store.GetSnickersInfoByIdComplex(ctx, int32Value)
	if err2 != nil {
		fmt.Println("dmsa;mdasmd;aslmd;asl;l")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	fmt.Println(id, "dml;aksmd;lasmd;asm;k")
	s.taskProcessor.SetSnickersInfo(ctx, id, snickersInfo)
	fmt.Println(snickersInfo)
	//snickersInfoResp := NewSnickersInfoResponse(snickersInfo)
	//log.Log.Info().Interface("snickersInfo", snickersInfoResp).Msg("")
	ctx.JSON(http.StatusOK, snickersInfo)

	cookie, errC := ctx.Cookie("unique")

	if errC != nil {
		//log.WithCaller().Err(errC).Msg("")
		return
	}
	user, err1 := s.tokenMaker.VerifyToken(cookie)
	if err1 != nil {

	} else {
		err := s.store.SetSnickersHistory(ctx, int32(numId), user.UserId)
		if err != nil {
			//log.WithCaller().Err(err).Msg("")
		}
	}
}

type SnickersResponseD struct {
	Name     string      `json:"name"`
	Id       int32       `json:"id"`
	Image    []string    `json:"imgs"`
	Discount interface{} `json:"discount"`
	Price    int         `json:"price"`
}

type RespSearchSnickersAndFiltersByString struct {
	Snickers []SnickersResponseD   `json:"snickers"`
	Pages    int                   `json:"pages"`
	Filters  FiltersSearchResponse `json:"filters"`
}
type SizeData struct {
	Size35  int64 `json:"size_35"`
	Size4   int64 `json:"size_4"`
	Size45  int64 `json:"size_45"`
	Size5   int64 `json:"size_5"`
	Size55  int64 `json:"size_55"`
	Size6   int64 `json:"size_6"`
	Size65  int64 `json:"size_65"`
	Size7   int64 `json:"size_7"`
	Size75  int64 `json:"size_75"`
	Size8   int64 `json:"size_8"`
	Size85  int64 `json:"size_85"`
	Size9   int64 `json:"size_9"`
	Size95  int64 `json:"size_95"`
	Size10  int64 `json:"size_10"`
	Size105 int64 `json:"size_105"`
	Size11  int64 `json:"size_11"`
	Size115 int64 `json:"size_115"`
	Size12  int64 `json:"size_12"`
	Size125 int64 `json:"size_125"`
	Size13  int64 `json:"size_13"`
}

type FiltersSearchResponse struct {
	FirmsCount map[string]int `json:"firmsCount"`
	Price      [2]int         `json:"price"`
	Sizes      SizeData       `json:"sizes"`
}

func (s *Server) handleSearchSnickersAndFiltersByString(ctx *gin.Context) {
	var postData types.PostDataSnickersAndFiltersByString
	if err := ctx.BindJSON(&postData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	snickersInfo, err1 := s.store.GetSnickersAndFiltersByString(ctx, postData.Name, postData.Page, postData.Size, postData.Filters, postData.OrderedType)
	if err1 != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err1))
		return
	}

	ctx.JSON(http.StatusOK, snickersInfo)
}

type RespSearchSnickersByString struct {
	Snickers []SnickersResponseD `json:"snickers"`
	Pages    int                 `json:"pages"`
}

func (s *Server) handleSearchSnickersByString(ctx *gin.Context) {
	var postData types.PostDataOrdreredSnickersByString
	if err := ctx.BindJSON(&postData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	snickersInfo, _ := s.store.GetSnickersByString(ctx, postData.Name, postData.Page, postData.Size, postData.Filters, postData.OrderType)
	ctx.JSON(http.StatusOK, snickersInfo)
}

func (s *Server) handleSearchMerch(ctx *gin.Context) {
	var postData types.PostData
	if err := ctx.BindJSON(&postData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	response, _ := s.store.GetSnickersByNameComplex(ctx, postData.Name, postData.Max)
	ctx.JSON(http.StatusOK, response)
}

func (s *Server) handleGetSoloCollection(ctx *gin.Context) {
	var postData types.PostDataSoloCollection
	if err := ctx.BindJSON(&postData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	end := postData.Page * postData.Size
	offset := (postData.Page - 1) * postData.Size
	response, _ := s.store.GetSoloCollectionComplex(ctx,
		db.GetSoloCollectionParams{
			Firm:   postData.Name,
			Line:   postData.Name,
			Limit:  int32(end),
			Offset: int32(offset),
		})
	ctx.JSON(http.StatusOK, response)
}
func (s *Server) handleGetCollection(ctx *gin.Context) {
	var postData types.PostDataCollection
	if err := ctx.BindJSON(&postData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	offset := (postData.Page - 1) * postData.Size
	fullResponse, err1 := s.store.GetCollections1(ctx, postData.Names, postData.Size, offset)
	if err1 != nil {
		//log.WithCaller().Err(err1).Msg("")
		ctx.JSON(http.StatusBadRequest, errorResponse(err1))
		return
	}

	ctx.JSON(http.StatusOK, fullResponse)
}

func (s *Server) handleGetDiscounts(ctx *gin.Context) {
	searchData, err := s.store.GetSnickersWithDiscountComplex(ctx)
	if err != nil {
		//log.WithCaller().Err(err1).Msg("")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	ctx.JSON(http.StatusOK, searchData)
}
