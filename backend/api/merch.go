package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/go-chi/render"
	"github.com/mrkrabopl1/go_db/types"
)

func (s *Server) handleGetFirms(w http.ResponseWriter, r *http.Request) {
	fmt.Println("fkms;dlmf;dslmf;sdmf;lsmd;kmkdgb;lmf;gkfm;lgms;dkmf;")
	firms, err := s.store.GetFirms(r.Context())
	if err != nil {
		//log.WithCaller().Err(err)
		render.JSON(w, r, nil)
		return
	}
	render.JSON(w, r, firms)
}

func (s *Server) handleGetSnickersByFirmName(w http.ResponseWriter, r *http.Request) {
	firm := r.URL.Query().Get("firm")
	snickers, err := s.store.GetSnickersByFirmName(r.Context(), firm)
	if err != nil {
		//log.WithCaller().Err(err)
		render.JSON(w, r, nil)
		return
	}
	render.JSON(w, r, snickers)
}
func (s *Server) handleGetSnickersByLineName(w http.ResponseWriter, r *http.Request) {
	line := r.URL.Query().Get("line")
	snickers, err := s.store.GetSnickersByLineName(r.Context(), line)
	if err != nil {
		//log.WithCaller().Err(err)
		render.JSON(w, r, nil)
		return
	}
	// firmsList := NewSnickersLineResponse(firms)
	render.JSON(w, r, snickers)
}

func (s *Server) handleGetSnickersInfoById(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	numId, err := strconv.ParseInt(id, 10, 32)
	if err != nil {
		//log.WithCaller().Err(err).Msg("")
		render.JSON(w, r, nil)
		return
	}
	int32Value := int32(numId)
	snickersInfo, err2 := s.store.GetSnickersInfoById(r.Context(), int32Value)
	if err2 != nil {
		//log.WithCaller().Err(err).Msg("")
		render.JSON(w, r, nil)
		return
	}
	//snickersInfoResp := NewSnickersInfoResponse(snickersInfo)
	//log.Log.Info().Interface("snickersInfo", snickersInfoResp).Msg("")
	render.JSON(w, r, snickersInfo)

	cookie, errC := r.Cookie("unique")

	if errC != nil {
		log.WithCaller().Err(errC).Msg("")
		return
	}
	numId, err3 := strconv.Atoi(id)
	if err3 != nil {
		log.WithCaller().Err(err).Msg("Ошибка преобразования:")
		return
	} else {
		user, err1 := s.tokenMaker.VerifyToken(cookie.Value)
		if err1 != nil {

		} else {
			err := s.store.SetSnickersHistory(r.Context(), numId, user)
			if err != nil {
				log.WithCaller().Err(err).Msg("")
			}
		}
	}
}
func (s *Server) handleSearchSnickersAndFiltersByString(w http.ResponseWriter, r *http.Request) {
	fmt.Println(r.Body)
	var postData types.PostDataSnickersAndFiltersByString
	err := json.NewDecoder(r.Body).Decode(&postData)
	if err != nil {
		log.WithCaller().Err(err)
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
