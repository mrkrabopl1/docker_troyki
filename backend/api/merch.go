package api

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/types"
)

type SizeData struct {
	Price    int32 `json:"price"`
	Quantity int32 `json:"quantity"`
	Discount int32 `json:"discount"`
}

func (s *Server) handleGetFirms(ctx *gin.Context) {
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

// func (s *Server) handleGetSizes(ctx *gin.Context) {
// 	category := ctx.Query("category")
// 	if val, ok := size.Get(category); ok {
// 		ctx.JSON(http.StatusOK, val)
// 	} else {
// 		ctx.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
// 	}
// }

func (s *Server) handleGetCollectionCount(ctx *gin.Context) {
	name := ctx.Query("name")
	count, err := s.store.GetMerchCountOfCollectionsOrFirms(ctx, db.GetMerchCountOfCollectionsOrFirmsParams{
		Firm: name,
		Line: "",
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
	numId, err := strconv.ParseInt(id, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	ProductsInfo, err2 := s.store.GetProductsInfoByIdComplex(ctx, int32(numId))
	if err2 != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	s.taskProcessor.SetProductsInfo(ctx, id, ProductsInfo)
	ctx.JSON(http.StatusOK, ProductsInfo)

	cookie, errC := ctx.Cookie("unique")

	if errC != nil {
		//log.WithCaller().Err(errC).Msg("")
		return
	}
	user, err1 := s.tokenMaker.VerifyToken(cookie)
	if err1 != nil {
		fmt.Println(err1)
	} else {
		fmt.Println(user, user.UserID, "fdslfsd;mfdskmf;sdmfs")
		err := s.store.SetSnickersHistory(ctx, int32(numId), user.UserID)
		if err != nil {
			fmt.Println(user, user.UserID, "blya")
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

type Clothes struct {
	S   int64 `json:"s"`
	M   int64 `json:"m"`
	L   int64 `json:"l"`
	XL  int64 `json:"xl"`
	XXL int64 `json:"xxl"`
}
type ProductsFilterStruct struct {
	Firms      []string               `json:"firmsCount"`
	Sizes      map[string]interface{} `json:"sizes"`
	Price      []float32              `json:"price"`
	Types      []int32                `json:"types"`
	Categories []int32                `json:"categories"`
}

func (s *Server) handleSearchSnickersAndFiltersByNameCategoryAndType(ctx *gin.Context) {
	var postData types.PostDataSnickersAndFiltersByString
	if err := ctx.BindJSON(&postData); err != nil {
		fmt.Println(err, "error in handleSearchProductsByCategories")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	params := db.GetFiltersByNameCategoryAndTypeParams{
		Name:     pgtype.Text{String: postData.Name, Valid: postData.Name != ""},
		Category: pgtype.Int4{Int32: postData.Category, Valid: postData.Category != 0},
		Type:     pgtype.Int4{Int32: postData.Type, Valid: postData.Type != 0},
	}
	fmt.Println(params.Type.Valid, params.Category.Valid, params.Name.Valid, "kfdnkjfndskjfbnklvkfnkjfbgfkjbjkewbqfjgvkjdsv jnsdfkbdsdkfsdkfnkdsjfnsdnfkjdsqkwpek")
	ProductsInfo, err1 := s.store.GetProductsAndFiltersByNameCategoryAndType(ctx, params, postData.Page, postData.Size, postData.Filters, postData.SortType)
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

	//fmt.Println(postData.Filters.Price, "postData postData postData postData postData postData postData postData ")
	fmt.Println(postData.Filters.Types, "postData postData postData postData postData postData postData postData ")
	postData.Filters.Status = "active"
	resp, err := s.store.GetProductsByFiltersComplex(ctx, "", postData.Page, postData.Size, postData.Filters, postData.SortType)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, resp)
}

func (s *Server) handleGetMainPageInfo(ctx *gin.Context) {
	fmt.Println("mainpageinwcdczcfo mainpageinfo mainpageinfo mainpageinfo mainpageinfo ")
	resp, err := s.store.GetMainPageInfoComplex(ctx, 15)

	fmt.Println(resp, "mainpageinfo mainpageinfo mainpageinfo mainpageinfo mainpageinfo ")
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, resp)
}

func (s *Server) handleSearchProductAndByCategoriesAndFilters(ctx *gin.Context) {
	var postData types.PostDataAndFiltersByCategoryAndType
	if err := ctx.BindJSON(&postData); err != nil {
		fmt.Println(err, "error in handleSearchProductsByCategories")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	fmt.Println(postData.Filters.InStore, "dffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
	postData.Filters.Status = "active"
	resp, err := s.store.GetProductsByFiltersComplex(ctx, "", 0, postData.Page, postData.Filters, postData.SortType)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, resp)
}

type GetFiltersByNameCategoryAndTypeReq struct {
}

func (s *Server) handleGetFiltersByNameCategoryAndType(ctx *gin.Context) {
	var params db.GetFiltersByNameCategoryAndTypeParams
	if err := ctx.BindJSON(&params); err != nil {
		fmt.Println(err, "error in handleSearchProductsByCategories")
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	fmt.Println("test", params, "kfdnkjfndskjfbnklvkfnkjfbgfkjbjkewbqfjgvkjdsv jnsdfkbdsdkfsdkfnkdsjfnsdnfkjdsqkwpek")
	resp, err := s.store.GetFiltersByNameCategoryAndType(ctx, params)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, resp)
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

func (s *Server) handleSearchProducts(ctx *gin.Context) {
	var postData types.PostData
	if err := ctx.BindJSON(&postData); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}
	response, _ := s.store.GetProductsByNameComplex(ctx, postData.Name, postData.Max)
	ctx.JSON(http.StatusOK, response)
}

func (s *Server) handleGetCategoriesWithTypes(ctx *gin.Context) {
	response, _ := s.store.GetCategoriesWithTypes(ctx)
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
			Firm:      postData.Name,
			Line:      "",
			Limitval:  int32(postData.Size),
			Offsetval: int32(offset),
		})
	ctx.JSON(http.StatusOK, response)
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

// func (s *Server) createDiscounts(ctx *gin.Context) {
// 	var discounts []int32
// 	if err := ctx.BindJSON(&discounts); err != nil {
// 		ctx.JSON(http.StatusBadRequest, errorResponse(err))
// 		return
// 	}
// 	products, err := s.store.GetProductsByIds(ctx, discounts)

// 	var discountsData map[int32]types.DiscountData

// 	if err != nil {
// 		ctx.JSON(http.StatusBadRequest, errorResponse(err))
// 		return
// 	}
// 	if len(products) == 0 {
// 		ctx.JSON(http.StatusBadRequest, gin.H{"error": "No products found for the provided IDs"})
// 		return
// 	} else {
// 		for _, product := range products {
// 			if product.Maxdiscprice.Int32 == 0 {

// 			} else {

// 			}
// 		}

// 	}

// 	err1 := s.store.CreateDiscounts(ctx, discountsData)
// 	if err1 != nil {
// 		//log.WithCaller().Err(err1).Msg("")
// 		ctx.JSON(http.StatusBadRequest, errorResponse(err))
// 		return
// 	}
// 	ctx.JSON(http.StatusOK, 0)
// }
