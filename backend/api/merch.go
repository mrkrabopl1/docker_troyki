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
	firms, err := s.store.GetMerchFirms(ctx)
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

func (s *Server) handleGetCollectionCount(ctx *gin.Context) {
	name := ctx.Query("name")
	count, err := s.store.GetMerchCountOfCollectionsOrFirms(ctx, db.GetMerchCountOfCollectionsOrFirmsParams{
		Firm: name,
		Line: name,
	})
	if err != nil {
		//log.WithCaller().Err(err)
		ctx.JSON(http.StatusUnauthorized, errorResponse(err))
		return
	}
	ctx.JSON(http.StatusOK, count)
}
func (s *Server) handleGetProductsInfoById(ctx *gin.Context) {
	id := ctx.Query("id")
	fmt.Println("id", id)
	numId, err := strconv.ParseInt(id, 10, 32)
	if err != nil {
		fmt.Println("dmsa;mdasmd;aslmd;asl;l")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	int32Value := int32(numId)
	prInfo, err := s.store.GetProductSource(ctx, int32Value)
	if err != nil {
		fmt.Println("dmsa;mdasmd;aslmd;asl;l")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	if prInfo.SourceTable == "snickers" {
		ProductsInfo, err2 := s.store.GetProductsInfoByIdComplex(ctx, prInfo.InternalID)
		if err2 != nil {
			fmt.Println("dmsa;mdasmd;aslmd;asl;l")
			ctx.JSON(http.StatusBadRequest, errorResponse(err))
			return
		}
		s.taskProcessor.SetProductsInfo(ctx, id, ProductsInfo)
		ctx.JSON(http.StatusOK, ProductsInfo)
	}
	if prInfo.SourceTable == "solomerch" {
		ProductsInfo, err2 := s.store.GetSoloMerchInfoByIdComplex(ctx, prInfo.InternalID)
		if err2 != nil {
			fmt.Println("dmsa;mdasmd;aslmd;asl;l")
			ctx.JSON(http.StatusBadRequest, errorResponse(err))
			return
		}
		//s.taskProcessor.SetProductsInfo(ctx, id, ProductsInfo)
		ctx.JSON(http.StatusOK, ProductsInfo)
	}
	if prInfo.SourceTable == "clothes" {
		ProductsInfo, err2 := s.store.GetClothesInfoByIdComplex(ctx, prInfo.InternalID)
		if err2 != nil {
			fmt.Println("dmsa;mdasmd;aslmd;asl;l")
			ctx.JSON(http.StatusBadRequest, errorResponse(err))
			return
		}
		//s.taskProcessor.SetProductsInfo(ctx, id, ProductsInfo)
		ctx.JSON(http.StatusOK, ProductsInfo)
	}

	cookie, errC := ctx.Cookie("unique")

	if errC != nil {
		//log.WithCaller().Err(errC).Msg("")
		return
	}
	user, err1 := s.tokenMaker.VerifyToken(cookie)
	if err1 != nil {
		fmt.Println(err1)
	} else {
		fmt.Println(user, user.UserId, "fdslfsd;mfdskmf;sdmfs")
		err := s.store.SetSnickersHistory(ctx, int32(numId), user.UserId)
		if err != nil {
			fmt.Println(user, user.UserId, "blya")
		}
	}
}

type ProductsResponseD struct {
	Name     string      `json:"name"`
	Id       int32       `json:"id"`
	Image    []string    `json:"imgs"`
	Discount interface{} `json:"discount"`
	Price    int         `json:"price"`
}

type RespSearchProductsAndFiltersByString struct {
	Products []ProductsResponseD   `json:"products"`
	Pages    int                   `json:"pages"`
	Filters  FiltersSearchResponse `json:"filters"`
}

type Clothes struct {
	S   int64 `json:"s"`
	M   int64 `json:"m"`
	L   int64 `json:"l"`
	XL  int64 `json:"xl"`
	XXL int64 `json:"xxl"`
}
type SnickersFilterStruct struct {
	Firms []string  `json:"firmsCount"`
	Sizes SizeData  `json:"sizes"`
	Price []float32 `json:"price"`
	Type  *int32    `json:"type"`
}
type Snickers struct {
	Size35  int64 `json:"3.5"`
	Size4   int64 `json:"4"`
	Size45  int64 `json:"4.5"`
	Size5   int64 `json:"5"`
	Size55  int64 `json:"5.5"`
	Size6   int64 `json:"6"`
	Size65  int64 `json:"6.5"`
	Size7   int64 `json:"7"`
	Size75  int64 `json:"7.5"`
	Size8   int64 `json:"8"`
	Size85  int64 `json:"8.5"`
	Size9   int64 `json:"9"`
	Size95  int64 `json:"9.5"`
	Size10  int64 `json:"10"`
	Size105 int64 `json:"10.5"`
	Size11  int64 `json:"11"`
	Size115 int64 `json:"11.5"`
	Size12  int64 `json:"12"`
	Size125 int64 `json:"12.5"`
	Size13  int64 `json:"13"`
}
type SizeData struct {
	Snickers Snickers
	Clothes  Clothes
}

type FiltersSearchResponse struct {
	FirmsCount map[string]int `json:"firmsCount"`
	Price      [2]int         `json:"price"`
	Sizes      SizeData       `json:"sizes"`
	Type       *int           `json:"type"`
}

func (s *Server) handleSearchSnickersAndFiltersByString(ctx *gin.Context) {
	var postData types.PostDataSnickersAndFiltersByString
	if err := ctx.BindJSON(&postData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	ProductsInfo, err1 := s.store.GetProductsAndFiltersByString(ctx, postData.Name, postData.Page, postData.Size, postData.Filters, postData.OrderedType)
	if err1 != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err1))
		return
	}

	ctx.JSON(http.StatusOK, ProductsInfo)
}
func (s *Server) handleSearchProductByCategoriesAndFilters(ctx *gin.Context) {
	var postData types.PostDataAndFiltersByCategoryAndType
	if err := ctx.BindJSON(&postData); err != nil {
		fmt.Println(err, "error in handleSearchProductsByCategories")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	fmt.Println("test", postData.Category, "kfdnkjfndskjfbnklvkfnkjfbgfkjbjkewbqfjgvkjdsv jnsdfkbdsdkfsdkfnkdsjfnsdnfkjdsqkwpek")
	category := postData.Category
	typeQ := postData.Type
	typeIds := make([]int32, 0)
	if typeQ != "" {
		typeId, err1 := s.store.GetTypeIDByCategoryAndName(ctx, db.GetTypeIDByCategoryAndNameParams{
			Category: db.ProductSourceEnum(category),
			TypeName: typeQ,
		})
		if err1 != nil {
			fmt.Println(err1, "error in GetTypeIDByCategoryAndName")
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err1.Error()})
			return
		}
		typeIds = append(typeIds, typeId)
	}
	var productsInfo db.SnickersResp
	switch category {
	case "snickers":
		resp, err := s.store.GetSnickersByFilters(ctx, "", postData.Filters, 0, postData.Size, (postData.Page-1)*postData.Size)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if len(resp) != 0 {
			productsInfo.Pages = resp[0].TotalCount / int64(postData.Size)
		} else {
			productsInfo.Pages = 0
		}
		productsInfo.Products = resp
		ctx.JSON(http.StatusOK, productsInfo)
	case "solomerch":
		resp, err := s.store.GetMerchByFilters(ctx, "", postData.Filters, 0, postData.Size, (postData.Page-1)*postData.Size)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if len(resp) != 0 {
			productsInfo.Pages = resp[0].TotalCount / int64(postData.Size)
		} else {
			productsInfo.Pages = 0
		}
		productsInfo.Products = resp
		ctx.JSON(http.StatusOK, productsInfo)
	case "clothes":
		resp, err := s.store.GetClothesByFilters(ctx, "", postData.Filters, 0, postData.Size, (postData.Page-1)*postData.Size)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if len(resp) != 0 {
			productsInfo.Pages = resp[0].TotalCount / int64(postData.Size)
		} else {
			productsInfo.Pages = 0
		}
		productsInfo.Products = resp
		ctx.JSON(http.StatusOK, productsInfo)

	default:
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category"})
		return
	}
}
func (s *Server) handleSearchProductsAndFiltersByCategories(ctx *gin.Context) {
	fmt.Println("handleSearchProductsByCategories")
	var postData types.PostDataAndFiltersByCategoryAndType
	if err := ctx.BindJSON(&postData); err != nil {
		fmt.Println(err, "error in handleSearchProductsByCategories")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	category := postData.Category
	typeQ := postData.Type
	typeIds := make([]int32, 0)
	if typeQ != "" {
		typeId, err1 := s.store.GetTypeIDByCategoryAndName(ctx, db.GetTypeIDByCategoryAndNameParams{
			Category: db.ProductSourceEnum(category),
			TypeName: typeQ,
		})
		if err1 != nil {
			fmt.Println(err1, "error in GetTypeIDByCategoryAndName")
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err1.Error()})
			return
		}
		typeIds = append(typeIds, typeId)
	}
	switch category {
	case "snickers":
		resp, err := s.store.GetSnickersAndFilters(ctx, typeIds, postData)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, resp)
	case "solomerch":
		resp, err := s.store.GetMerchAndFilters(ctx, typeIds, postData)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, resp)
	case "clothes":
		resp, err := s.store.GetClothesAndFilters(ctx, typeIds, postData)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, resp)

	default:
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category"})
		return
	}
}

type RespSearchProductsByString struct {
	Products []ProductsResponseD `json:"products"`
	Pages    int                 `json:"pages"`
}

func (s *Server) handleSearchProductsByString(ctx *gin.Context) {
	var postData types.PostDataOrdreredSnickersByString
	if err := ctx.BindJSON(&postData); err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	ProductsInfo, _ := s.store.GetProductsByString(ctx, postData.Name, postData.Page, postData.Size, postData.Filters, postData.OrderType)
	ctx.JSON(http.StatusOK, ProductsInfo)
}

func (s *Server) handleSearchMerch(ctx *gin.Context) {
	var postData types.PostData
	if err := ctx.BindJSON(&postData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	response, _ := s.store.GetProductsByNameComplex(ctx, postData.Name, postData.Max)
	ctx.JSON(http.StatusOK, response)
}

func (s *Server) handleGetSoloCollection(ctx *gin.Context) {
	var postData types.PostDataSoloCollection
	if err := ctx.BindJSON(&postData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	offset := (postData.Page - 1) * postData.Size
	response, _ := s.store.GetMerchCollectionComplex(ctx,
		db.GetMerchCollectionParams{
			Firm:   postData.Name,
			Line:   postData.Name,
			Limit:  int32(postData.Size),
			Offset: int32(offset),
		})
	ctx.JSON(http.StatusOK, response)
}
func (s *Server) handleGetCollection(ctx *gin.Context) {
	fmt.Println("fd;slfs;dl")
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
	searchData, err := s.store.GetProductsWithDiscountComplex(ctx)
	if err != nil {
		//log.WithCaller().Err(err1).Msg("")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	ctx.JSON(http.StatusOK, searchData)
}

type DiscountsData struct {
	ProductId        int32       `json:"productid"`
	Minprice         int         `json:"minprice"`
	MaxDiscountPrice int         `json:"maxdiscountprice"`
	Value            interface{} `json:"value"`
}

func (s *Server) createDiscounts(ctx *gin.Context) {
	var discounts []int32
	if err := ctx.BindJSON(&discounts); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	products, err := s.store.GetProductsByIds(ctx, discounts)

	var discountsData map[int32]types.DiscountData

	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	if len(products) == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "No products found for the provided IDs"})
		return
	} else {
		for _, product := range products {
			if product.Maxdiscprice.Int32 == 0 {

			} else {

			}
		}

	}

	err1 := s.store.CreateDiscounts(ctx, discountsData)
	if err1 != nil {
		//log.WithCaller().Err(err1).Msg("")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	ctx.JSON(http.StatusOK, 0)
}
