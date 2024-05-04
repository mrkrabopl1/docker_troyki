package router

import (
	"encoding/json"
	"fmt"
	_ "image/jpeg"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/render"
	"github.com/mrkrabopl1/go_db/logger"
	"github.com/mrkrabopl1/go_db/types"
)

// func (hr types.SnickersResponse) Render(w http.ResponseWriter, r *http.Request) error {
// 	return nil
// }

// func (d types.FirmResponse) Render(w http.ResponseWriter, r *http.Request) error {
// 	return render.Render(w, r, d)
// }

// func NewFirmResponse(m db.Result ,d *firmResponse) firmResponse {

// 	d[m.Firm] = m.ArrayOfData

// 	return d
// }

func NewMainPageResponse(mp []types.MainPage) []types.MainPageResp {
	var mpResp []types.MainPageResp

	for _, elem := range mp {
		mpResp = append(mpResp, types.MainPageResp{
			MainText: elem.Text,
			SubText:  elem.SubText,
			Image:    elem.Image,
		})
	}

	return mpResp
}

func NewSnickersLineResponse(snLines []types.SnickersLine) types.SnickersLineResponse {
	snLineResp := types.SnickersLineResponse{}

	for _, line := range snLines {
		list := []types.SnickersResponse{}
		var discount interface{}
		json.Unmarshal([]byte(*line.Discount), &discount)
		for indx := range line.Image_path {
			var imgArr []string
			for i := 1; i < 3; i++ {
				str := fmt.Sprintf(line.Image_path[indx]+"/%d.jpg", i)
				imgArr = append(imgArr, str)
			}
			list = append(list, types.SnickersResponse{
				Name:  line.Name[indx],
				Image: imgArr,
				Id:    line.Id[indx],
			})
		}
		snLineResp[line.Line] = list

	}
	return snLineResp
}

func NewSnickersByStringResponse(snLines []types.SnickersSearch) []types.SnickersResponseDD {
	snPageResp := make([]types.SnickersResponseDD, 0)

	start1 := time.Now()

	for _, line := range snLines {
		var imgArr []string
		for i := 1; i < 3; i++ {
			str := fmt.Sprintf(line.Image_path+"/%d.jpg", i)
			imgArr = append(imgArr, str)
		}

		var discount interface{}

		if line.Discount != nil {
			discount = *line.Discount
		} else {
			discount = nil
		}

		snPageResp = append(snPageResp, types.SnickersResponseDD{
			Name:     line.Name,
			Image:    imgArr,
			Price:    line.Price,
			Discount: discount,
			Id:       int32(line.Id),
		})

	}
	end1 := time.Now()
	elapsed1 := end1.Sub(start1)

	fmt.Println(elapsed1, "f,sdlf,sdl,fsdl,fsld,fsdl,f")

	return snPageResp
}

func NewFirmListResponse(firms []types.FirmsResult) types.FirmResponse {
	list := types.FirmResponse{}
	for _, firm := range firms {
		list[firm.Firm] = firm.ArrayOfData
	}
	return list
}

func NewSnickersSearchResponse1(snickersSearch []types.SnickersSearch) []types.SnickersSearchResponse1 {

	list := []types.SnickersSearchResponse1{}
	for _, info := range snickersSearch {
		var imgArr []string
		for i := 1; i < 3; i++ {
			str := fmt.Sprintf(info.Image_path+"/%d.jpg", i)
			imgArr = append(imgArr, str)
		}
		var discount interface{}
		if info.Discount != nil {
			discount = *info.Discount
		} else {
			discount = nil
		}
		list = append(list, types.SnickersSearchResponse1{
			Image:    imgArr,
			Price:    info.Price,
			Id:       int(info.Id),
			Name:     info.Name,
			Firm:     info.Firm,
			Discount: discount,
		})

	}

	return list
}

func NewSnickersSearchResponse(snickersSearch []types.SnickersSearch) []types.SnickersSearchResponse {

	list := []types.SnickersSearchResponse{}
	for _, info := range snickersSearch {
		img_path := info.Image_path + "/1.jpg"
		list = append(list, types.SnickersSearchResponse{
			Image: img_path,
			Price: info.Price,
			Id:    int(info.Id),
			Name:  info.Name,
			Firm:  info.Firm,
		})
	}

	return list
}

func NewSnickersInfoResponse(snInfo types.SnickersInfo) types.SnickersInfoResponse {
	var inf map[string]float64
	var imgArr []string
	files, _ := os.ReadDir(snInfo.Image_path)
	fmt.Println(snInfo.Image_path)
	fmt.Println(len(files))
	for index, _ := range files {
		fmt.Println(index)
		str := fmt.Sprintf(snInfo.Image_path+"/%d.jpg", index+1)
		imgArr = append(imgArr, str)
	}

	// Use json.Unmarshal to parse the JSON string into the map
	err2 := json.Unmarshal([]byte(snInfo.Info), &inf)
	if err2 != nil {
		fmt.Println(err2)
	}

	var discount interface{}

	if snInfo.Discount != nil {
		discount = *snInfo.Discount
	}
	return types.SnickersInfoResponse{
		Name:     snInfo.Name,
		Image:    imgArr,
		Info:     snInfo.Info,
		Discount: discount,
	}
}

func NewSnickersResponse(firms []types.Snickers) []types.SnickersResponseD {
	logger.Debug("NewSnickersResponse")
	list := []types.SnickersResponseD{}
	for _, firm := range firms {
		var imgArr []string
		for i := 0; i < 2; i++ {
			str := fmt.Sprintf(firm.Image_path+"/%d.jpg", i)
			imgArr = append(imgArr, str)
		}

		var discount interface{}

		if firm.Discount != nil {
			json.Unmarshal([]byte(*firm.Discount), &discount)
		} else {
			discount = nil
		}

		list = append(list, types.SnickersResponseD{
			Name:     firm.Name,
			Image:    imgArr,
			Id:       int32(firm.Id),
			Discount: discount,
		})

	}
	return list
}

func SnickersCartResponse(cart []types.SnickersCart) []types.CartResponse {
	list := []types.CartResponse{}
	for _, info := range cart {
		img_path := info.Image + "/1.jpg"

		list = append(list, types.CartResponse{
			Image:    img_path,
			Id:       int(info.Id),
			Name:     info.Name,
			Size:     info.Size,
			Quantity: info.Quantity,
			Price:    info.Price,
			Firm:     info.Firm,
			PrId:     info.PrId,
		})

	}

	return list
}
func (s *Server) handleGetFirms(w http.ResponseWriter, r *http.Request) {
	fmt.Println("invkdsjfkkjf'skd;fj;slfj;sdjfs;kjdf")
	firms, err := s.store.GetFirms(r.Context())
	fmt.Println("jgjgkjgkjgkhgkhgkhinvkdsjfkkjf'skd;fj;slfj;sdjfs;kjdf")
	if err != nil {
		return
	}
	firmsList := NewFirmListResponse(firms)

	logger.Info("Response get firms")
	render.JSON(w, r, firmsList)
}

func (s *Server) handleGetSnickersByFirmName(w http.ResponseWriter, r *http.Request) {
	logger.Debug("handleGetSnickersByFirmName")
	firms, err := s.store.GetSnickersByFirmName(r.Context())
	if err != nil {

		return
	}

	fmt.Println(firms)
	firmsList := NewSnickersResponse(firms)
	//mr := NewMovieResponse(movie)
	render.JSON(w, r, firmsList)
}

func (s *Server) handleGetSnickersByLineName(w http.ResponseWriter, r *http.Request) {

	firms, err := s.store.GetSnickersByLineName(r.Context())
	if err != nil {
		return
	}
	firmsList := NewSnickersLineResponse(firms)
	render.JSON(w, r, firmsList)
}

func (s *Server) handleGetSnickersInfoById(w http.ResponseWriter, r *http.Request) {

	snickersInfo, err := s.store.GetSnickersInfoById(r.Context())
	if err != nil {
		return
	}
	snickersInfoResp := NewSnickersInfoResponse(snickersInfo)
	render.JSON(w, r, snickersInfoResp)
}

func (s *Server) handleGetMainPage(w http.ResponseWriter, r *http.Request) {

	mp, err := s.store.GetMainPage(r.Context())
	if err != nil {
		return
	}
	firmsList := NewMainPageResponse(mp)
	//mr := NewMovieResponse(movie)
	render.JSON(w, r, firmsList)
}

func (s *Server) handleGetSizes(w http.ResponseWriter, r *http.Request) {
	file, err := os.ReadFile("json/sizeTable.json")
	if err != nil {
		fmt.Println(err)
	}
	var data interface{}
	json.Unmarshal(file, &data)
	render.JSON(w, r, data)
}

func (s *Server) handleFAQ(w http.ResponseWriter, r *http.Request) {
	file, err := os.ReadFile("json/faq.json")
	if err != nil {
		fmt.Println(err)
	}
	var data interface{}
	json.Unmarshal(file, &data)
	fmt.Println(data)
	render.JSON(w, r, data)
}

func (s *Server) handleSearchSnickersAndFiltersByString(w http.ResponseWriter, r *http.Request) {
	fmt.Println(r.Body)
	var postData types.PostDataSnickersAndFiltersByString
	err := json.NewDecoder(r.Body).Decode(&postData)
	if err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	snickersInfo, _ := s.store.GetSnickersAndFiltersByString(r.Context(), postData.Name, postData.Page, postData.Size, postData.Filters, postData.OrderedType)
	fmt.Println(snickersInfo, "f;dspfspdfsdpfmsd")
	if err != nil {
		return
	}
	snickers := NewSnickersByStringResponse(snickersInfo.SnickersPageInfo)
	var resp = types.RespSearchSnickersAndFiltersByString{
		Snickers: snickers,
		Pages:    snickersInfo.PageSize,
		Filters: types.FiltersSearchResponse{
			Price:      [2]int{snickersInfo.Filter.SizePriceFilter.MinPrice, snickersInfo.Filter.SizePriceFilter.MaxPrice},
			Sizes:      snickersInfo.Filter.SizePriceFilter.SizeFilter,
			FirmsCount: snickersInfo.Filter.FirmFilter,
		},
	}
	fmt.Println(resp, "dasdasdasd")
	// snickersInfoResp := NewSnickersInfoResponse(snickersInfo)
	render.JSON(w, r, resp)
}
func (s *Server) handleSearchSnickersByString(w http.ResponseWriter, r *http.Request) {
	fmt.Println(r.Body)
	var postData types.PostDataOrdreredSnickersByString
	err := json.NewDecoder(r.Body).Decode(&postData)
	if err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	snickersInfo, _ := s.store.GetSnickersByString(r.Context(), postData.Name, postData.Page, postData.Size, postData.Filters, postData.OrderType)
	if err != nil {
		return
	}
	snickers := NewSnickersByStringResponse(snickersInfo.SnickersPageInfo)
	var resp = types.RespSearchSnickersByString{
		Snickers: snickers,
		Pages:    snickersInfo.PageSize,
	}
	fmt.Println(resp, "dasdasdasd")
	// snickersInfoResp := NewSnickersInfoResponse(snickersInfo)
	render.JSON(w, r, resp)
}

func (s *Server) handleSearchMerch(w http.ResponseWriter, r *http.Request) {
	var postData types.PostData
	err := json.NewDecoder(r.Body).Decode(&postData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	searchData, _ := s.store.GetSnickersByName(r.Context(), postData.Name, postData.Max)
	response := NewSnickersSearchResponse(searchData)
	render.JSON(w, r, response)
}

// func (s *Server) handleGetSnickersForBuyPage(w http.ResponseWriter, r *http.Request) {
// 	var postData map[string][]string
// 	err := json.NewDecoder(r.Body).Decode(&postData)
// 	fmt.Println(postData)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusBadRequest)
// 		return
// 	}
// 	searchData, _ := s.store.GetSnickersInfoByArrOfIdAndSize(r.Context(), &postData)
// 	fmt.Println(searchData)
// 	response := SnickersCartResponse(searchData)
// 	render.JSON(w, r, response)
// }

func (s *Server) handleGetCollection(w http.ResponseWriter, r *http.Request) {
	var postData types.PostDataCollection
	err := json.NewDecoder(r.Body).Decode(&postData)
	fmt.Println(postData, "fnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	searchData, _ := s.store.GetCollection(r.Context(), postData.Name, postData.Size, postData.Page)

	// Print the result and the time taken
	response := NewSnickersSearchResponse1(searchData)

	fmt.Println(response, "fnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn")
	render.JSON(w, r, response)
}

func (s *Server) handleCreatePreorder(w http.ResponseWriter, r *http.Request) {
	var preorderData types.PreorderType
	fmt.Println("tedt")
	err := json.NewDecoder(r.Body).Decode(&preorderData)
	fmt.Println(preorderData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	hashUrl, _ := s.store.CreatePreorder(r.Context(), preorderData.Id, preorderData.Info)

	// Print the result and the time taken

	data := map[string]string{
		"hashUrl": hashUrl,
	}
	render.JSON(w, r, data)
}

func (s *Server) handleCreateOrder(w http.ResponseWriter, r *http.Request) {
	fmt.Println("createOfdsfsd")
	var orderData types.CreateOrderType
	err := json.NewDecoder(r.Body).Decode(&orderData)
	fmt.Println(orderData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	orderId, _ := s.store.CreateOrder(r.Context(), &orderData)

	// Print the result and the time taken

	data := map[string]int{
		"orderId": orderId,
	}
	fmt.Println("sssssssdw", data)
	render.JSON(w, r, data)
}

func (s *Server) handleUpdatePreorder(w http.ResponseWriter, r *http.Request) {
	var preorderData types.UpdataPreorderType
	err := json.NewDecoder(r.Body).Decode(&preorderData)
	fmt.Println(preorderData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	hashUrl, _ := s.store.UpdatePreorder(r.Context(), preorderData.Id, preorderData.Info, preorderData.HashUrl)

	// Print the result and the time taken

	data := map[string]int{
		"count": hashUrl,
	}
	render.JSON(w, r, data)
}
func (s *Server) handleGetCartCount(w http.ResponseWriter, r *http.Request) {

	hashUrl := r.URL.Query().Get("hash")
	quantity, err := s.store.GetCartCount(r.Context(), hashUrl)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	data := map[string]int{
		"count": quantity,
	}

	logger.Info("Response get cart count")

	render.JSON(w, r, data)
}

func (s *Server) handleGetCart(w http.ResponseWriter, r *http.Request) {
	hashUrl := r.URL.Query().Get("hash")
	cartData, err := s.store.GetCartData(r.Context(), hashUrl)

	responseData := SnickersCartResponse(cartData)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	logger.Info("Response get cart data")
	render.JSON(w, r, responseData)
}

func (s *Server) handleDeleteCartData(w http.ResponseWriter, r *http.Request) {
	var data types.DeleteCartData
	err := json.NewDecoder(r.Body).Decode(&data)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err1 := s.store.DeleteCartData(r.Context(), data.PreorderId)

	if err1 != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
}
