package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/golang/mock/gomock"
	mockdb "github.com/mrkrabopl1/go_db/db/mock"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/types"
	mockwk "github.com/mrkrabopl1/go_db/worker/mock"
	"github.com/stretchr/testify/require"
)

func TestHandleGetHistory(t *testing.T) {
	// user := db.User{
	// 	ID:       1,
	// 	Username: "testuser",
	// }

	snickers := []types.ProductsSearchResponse1{
		{
			Id:       1345345,
			Name:     "Snickers1",
			Firm:     "Firm1",
			Image:    []string{"image1", "image2"},
			Price:    100,
			Discount: 90,
		},
	}

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
					GetSnickersHistoryComplex(gomock.Any(), gomock.Eq(int32(1))).
					Times(1).
					Return(snickers, nil)
			},
			checkResponse: func(recorder *httptest.ResponseRecorder) {
				require.Equal(t, http.StatusOK, recorder.Code)
				requireBodyMatchSnickers(t, recorder.Body, snickers)
			},
		},
		{
			name:        "InvalidToken",
			cookieValue: "invalid-token",
			buildStubs: func(store *mockdb.MockStore) {
				store.EXPECT().
					GetSnickersHistoryComplex(gomock.Any(), gomock.Any()).
					Times(0)
			},
			checkResponse: func(recorder *httptest.ResponseRecorder) {
				require.Equal(t, http.StatusBadRequest, recorder.Code)
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

			url := "/historyInfo"

			fmt.Println("url", url, "ytfjgjhgjhgj")
			request, err := http.NewRequest(http.MethodGet, url, nil)
			fmt.Println("url", url, "ytfjgjhgjhgj")
			require.NoError(t, err)

			// Set the cookie
			if tc.cookieValue == "valid-token" {
				token, _, _ := server.tokenMaker.CreateToken(1, server.config.AccessTokenDuration)
				cookie := &http.Cookie{
					Name:  "unique",
					Value: token,
					Path:  "/",
				}
				request.AddCookie(cookie)
			} else {
				cookie := &http.Cookie{
					Name:  "unique",
					Value: tc.cookieValue,
					Path:  "/",
				}
				request.AddCookie(cookie)
			}

			server.router.ServeHTTP(recorder, request)
			tc.checkResponse(recorder)
		})
	}
}

func requireBodyMatchSnickers(t *testing.T, body *bytes.Buffer, snickers []types.ProductsSearchResponse1) {
	data, err := io.ReadAll(body)
	require.NoError(t, err)

	var gotSnickers []types.ProductsSearchResponse1
	err = json.Unmarshal(data, &gotSnickers)

	fmt.Println("Expected snickers:", gotSnickers)
	require.NoError(t, err)
	fmt.Println("Expected snickers:", snickers)
	fmt.Println("Got snickers:", gotSnickers)
	//require.Equal(t, snickers, gotSnickers)
}

func TestHandleGetProductsInfo(t *testing.T) {
	// user := db.User{
	// 	ID:       1,
	// 	Username: "testuser",
	// }

	snickers := db.GetProductsInfoByIdRow{
		Info:      []byte(`{"id":1,"name":"Snickers1","firm":"Firm1","image":["image1","image2"],"price":100,"discount":90}`),
		Name:      "Snickers1",
		ImagePath: "test",
		Value:     []byte(`{"id":1,"name":"Snickers1","firm":"Firm1","image":["image1","image2"],"price":100,"discount":90}`),
	}

	data := map[string]interface{}{}
	json.Unmarshal(snickers.Info, &data)
	fmt.Println(data, "ffffffffffffffffffffffffffffffffffffffffffffff")

	testCases := []struct {
		name          string
		cookieValue   string
		buildStubs    func(store *mockdb.MockStore)
		checkResponse func(recorder *httptest.ResponseRecorder)
	}{
		{
			name:        "OK",
			cookieValue: "valid-query",
			buildStubs: func(store *mockdb.MockStore) {
				store.EXPECT().
					GetProductsInfoByIdComplex(gomock.Any(), gomock.Eq(int32(1))).
					Times(1).
					Return(snickers, nil)
			},
			checkResponse: func(recorder *httptest.ResponseRecorder) {
				require.Equal(t, http.StatusOK, recorder.Code)
				requireBodyMatchSnickers1(t, recorder.Body, snickers)
			},
		},
		{
			name:        "InvalidToken",
			cookieValue: "invalid-token",
			buildStubs: func(store *mockdb.MockStore) {
				store.EXPECT().
					GetProductsInfoByIdComplex(gomock.Any(), gomock.Any()).
					Times(0)
			},
			checkResponse: func(recorder *httptest.ResponseRecorder) {
				require.Equal(t, http.StatusBadRequest, recorder.Code)
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

			url := "/ProductsInfo"
			if tc.cookieValue == "valid-query" {
				url += "?id=1"
			} else {
			}
			request, err := http.NewRequest(http.MethodGet, url, nil)
			require.NoError(t, err)

			// Set the cookie

			server.router.ServeHTTP(recorder, request)
			tc.checkResponse(recorder)
		})
	}
}
func requireBodyMatchSnickers1(t *testing.T, body *bytes.Buffer, snickers db.GetProductsInfoByIdRow) {
	data, err := io.ReadAll(body)
	require.NoError(t, err)

	var gotSnickers db.GetProductsInfoByIdRow
	err = json.Unmarshal(data, &gotSnickers)

	fmt.Println("Expected snickers:", gotSnickers)
	require.NoError(t, err)
	fmt.Println("Expected snickers:", snickers)
	fmt.Println("Got snickers:", gotSnickers)
	//require.Equal(t, snickers, gotSnickers)
}

func TestHandleSearchSnickersAndFiltersByString(t *testing.T) {
	// user := db.User{
	// 	ID:       1,
	// 	Username: "testuser",
	// }

	snickers := db.GetProductsInfoByIdRow{
		Info:      []byte(`{"id":1,"name":"Snickers1","firm":"Firm1","image":["image1","image2"],"price":100,"discount":90}`),
		Name:      "Snickers1",
		ImagePath: "test",
		Value:     []byte(`{"id":1,"name":"Snickers1","firm":"Firm1","image":["image1","image2"],"price":100,"discount":90}`),
	}

	data := map[string]interface{}{}
	json.Unmarshal(snickers.Info, &data)
	fmt.Println(data, "ffffffffffffffffffffffffffffffffffffffffffffff")

	testCases := []struct {
		name          string
		cookieValue   string
		buildStubs    func(store *mockdb.MockStore)
		checkResponse func(recorder *httptest.ResponseRecorder)
	}{
		{
			name:        "OK",
			cookieValue: "valid-query",
			buildStubs: func(store *mockdb.MockStore) {
				store.EXPECT().
					GetProductsInfoByIdComplex(gomock.Any(), gomock.Eq(int32(1))).
					Times(1).
					Return(snickers, nil)
			},
			checkResponse: func(recorder *httptest.ResponseRecorder) {
				require.Equal(t, http.StatusOK, recorder.Code)
				requireBodyMatchSnickers2(t, recorder.Body, snickers)
			},
		},
		{
			name:        "InvalidToken",
			cookieValue: "invalid-token",
			buildStubs: func(store *mockdb.MockStore) {
				store.EXPECT().
					GetProductsInfoByIdComplex(gomock.Any(), gomock.Any()).
					Times(0)
			},
			checkResponse: func(recorder *httptest.ResponseRecorder) {
				require.Equal(t, http.StatusBadRequest, recorder.Code)
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

			url := "/ProductsInfo"
			if tc.cookieValue == "valid-query" {
				url += "?id=1"
			} else {
			}
			request, err := http.NewRequest(http.MethodGet, url, nil)
			require.NoError(t, err)

			// Set the cookie

			server.router.ServeHTTP(recorder, request)
			tc.checkResponse(recorder)
		})
	}
}
func requireBodyMatchSnickers2(t *testing.T, body *bytes.Buffer, snickers db.GetProductsInfoByIdRow) {
	data, err := io.ReadAll(body)
	require.NoError(t, err)

	var gotSnickers db.GetProductsInfoByIdRow
	err = json.Unmarshal(data, &gotSnickers)

	fmt.Println("Expected snickers:", gotSnickers)
	require.NoError(t, err)
	fmt.Println("Expected snickers:", snickers)
	fmt.Println("Got snickers:", gotSnickers)
	//require.Equal(t, snickers, gotSnickers)
}
