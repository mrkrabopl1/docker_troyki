package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/render"
	"github.com/mrkrabopl1/go_db/types"
)

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var postData types.PostDataRegisterUser
	err := json.NewDecoder(r.Body).Decode(&postData)
	if err != nil {
		log.WithCaller().Err(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	id, err1 := s.store.Login(r.Context(), postData.Mail, postData.Password)
	if err1 != nil {
		log.WithCaller().Err(err1)
		render.JSON(w, r, false)
	} else {
		myCookie, err := s.tokenMaker.CreateToken(int32(id), 3600000)
		if err != nil {
			log.WithCaller().Err(err)
			render.JSON(w, r, nil)
			return
		}
		http.SetCookie(w, &myCookie)
		render.JSON(w, r, true)
	}
}
