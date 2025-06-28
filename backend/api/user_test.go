package api

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/golang/mock/gomock"
	mockdb "github.com/mrkrabopl1/go_db/db/mock"
	"github.com/mrkrabopl1/go_db/types"
	mockwk "github.com/mrkrabopl1/go_db/worker/mock"
	"github.com/stretchr/testify/require"
)

func TestHandleSetUniqueCustomer(t *testing.T) {
	// user := db.User{
	// 	ID:       1,
	// 	Username: "testuser",
	// }

	uniqueCustomerId := int32(1)

	//now := time.Now().Truncate(time.Second)

	testCases := []struct {
		name          string
		cookieValue   string
		buildStubs    func(store *mockdb.MockStore)
		checkResponse func(recorder *httptest.ResponseRecorder)
	}{
		{
			name:        "OK",
			cookieValue: "valid-token",
			buildStubs: func(store *mockdb.MockStore) {
				store.EXPECT().
					CreateUniqueCustomer(gomock.Any(), gomock.Any()).
					Times(1).
					Return(uniqueCustomerId, nil)
			},
			checkResponse: func(recorder *httptest.ResponseRecorder) {
				require.Equal(t, http.StatusOK, recorder.Code)
				requireBodyMatchUniqueCustomer(t, recorder.Body, uniqueCustomerId)
			},
		},
	}

	for i := range testCases {
		tc := testCases[i]

		t.Run(tc.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			store := mockdb.NewMockStore(ctrl)
			tc.buildStubs(store)
			taskDistributor := mockwk.NewMockTaskDistributor(ctrl)
			taskProcessor := mockwk.NewMockTaskProcessor(ctrl)
			server := newTestServer(t, store, taskDistributor, taskProcessor)
			recorder := httptest.NewRecorder()

			url := "/setUniqueCustomer"
			data := types.PreorderType{
				Id:   int32(1),
				Size: "10",
			}

			// Кодируем структуру в JSON
			jsonData, _ := json.Marshal(data)
			request, err := http.NewRequest(http.MethodGet, url, bytes.NewBuffer(jsonData))
			require.NoError(t, err)

			server.router.ServeHTTP(recorder, request)
			tc.checkResponse(recorder)
		})
	}
}

func requireBodyMatchUniqueCustomer(t *testing.T, body *bytes.Buffer, expectedID int32) {
	data, err := io.ReadAll(body)
	require.NoError(t, err)

	var responseID int32
	err = json.Unmarshal(data, &responseID)
	require.NoError(t, err)

	require.Equal(t, expectedID, responseID)
}
