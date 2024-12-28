package api

import (
	"bytes"
	"encoding/json"
	"io"
	"testing"

	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/stretchr/testify/require"
)

func TestGetFirmsApi(t *testing.T) {
	// ctrl := gomock.NewController(t)
	// defer ctrl.Finish()
	// firms := randomFirms()
	// store := mock_sqlc.NewMockStore(ctrl)
	// store.EXPECT().GetFirms(gomock.Any()).Times(1).Return(firms, nil)
	// server := NewServer(store)
	// recorder := httptest.NewRecorder()
	// request, err := http.NewRequest(http.MethodGet, "/firms", nil)
	// server.router.ServeHTTP(recorder, request)

	// require.NoError(t, err)
	// require.Equal(t, http.StatusOK, recorder.Code)

	// requireBodyMatchFirms(t, recorder.Body, firms)

}

func randomFirms() []db.GetFirmsRow {
	type FirmData struct {
		Name   string
		Amount int
	}
	return []db.GetFirmsRow{
		{
			Firm:        "dsadfdafad",
			ArrayOfData: [1]string{"line"},
		},
	}
}
func requireBodyMatchFirms(t *testing.T, body *bytes.Buffer, firms []db.GetFirmsRow) {
	data, err := io.ReadAll(body)
	require.NoError(t, err)

	var gotFirms []db.GetFirmsRow
	err = json.Unmarshal(data, &gotFirms)
	require.NoError(t, err)
	require.Equal(t, firms, gotFirms)
}
