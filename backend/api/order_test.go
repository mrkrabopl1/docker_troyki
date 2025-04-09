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
	"github.com/mrkrabopl1/go_db/types"
	mockwk "github.com/mrkrabopl1/go_db/worker/mock"
	"github.com/stretchr/testify/require"
)

func TestHandleCreatePreorder(t *testing.T) {
	// user := db.User{
	// 	ID:       1,
	// 	Username: "testuser",
	// }

	preorder := "nfdshflsdfjsldkjflsdk"

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
					CreatePreorder(gomock.Any(), gomock.Eq(int32(1)), gomock.Eq("10")).
					Times(1).
					Return(preorder, nil)
			},
			checkResponse: func(recorder *httptest.ResponseRecorder) {
				require.Equal(t, http.StatusOK, recorder.Code)
				requireBodyMatchPreorder(t, recorder.Body, preorder)
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

			url := "/createPreorder"
			data := types.PreorderType{
				Id:   int32(1),
				Size: "10",
			}

			// Кодируем структуру в JSON
			jsonData, _ := json.Marshal(data)
			fmt.Println("url", url, "ytfjgjhgjhgj")
			request, err := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(jsonData))
			fmt.Println("url", url, "ytfjgjhgjhgj")
			require.NoError(t, err)

			server.router.ServeHTTP(recorder, request)
			tc.checkResponse(recorder)
		})
	}
}

func requireBodyMatchPreorder(t *testing.T, body *bytes.Buffer, preorder string) {
	data, err := io.ReadAll(body)
	require.NoError(t, err)

	fmt.Println(data, "fdata")

	var gotPreorder string
	err = json.Unmarshal(data, &gotPreorder)

	fmt.Println("Expected preorder:", gotPreorder)
	require.NoError(t, err)
	fmt.Println("Expected snickers:", preorder)
	fmt.Println("Got snickers:", gotPreorder)
	//require.Equal(t, snickers, gotSnickers)
}

func TestHandleUpdatePreorder(t *testing.T) {
	// user := db.User{
	// 	ID:       1,
	// 	Username: "testuser",
	// }

	quantity := int32(1)

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
					UpdatePreorder(gomock.Any(), gomock.Eq(int32(1)), gomock.Eq("10"), gomock.Eq("1465553591858304793")).
					Times(1).
					Return(quantity, nil)
			},
			checkResponse: func(recorder *httptest.ResponseRecorder) {
				require.Equal(t, http.StatusOK, recorder.Code)
				requireBodyMatchPreorder1(t, recorder.Body, quantity)
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

			url := "/updatePreorder"
			data := types.PreorderType{
				Id:   int32(1),
				Size: "10",
			}

			// Кодируем структуру в JSON
			jsonData, _ := json.Marshal(data)
			request, err := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(jsonData))
			require.NoError(t, err)
			cookie := &http.Cookie{
				Name:  "cart",
				Value: "1465553591858304793",
				Path:  "/",
			}
			request.AddCookie(cookie)

			server.router.ServeHTTP(recorder, request)
			tc.checkResponse(recorder)
		})
	}
}

func requireBodyMatchPreorder1(t *testing.T, body *bytes.Buffer, preorder int32) {
	data, err := io.ReadAll(body)
	require.NoError(t, err)

	fmt.Println(data, "fdata")

	var gotPreorder string

	fmt.Println("Expected preorder:", gotPreorder)
	require.NoError(t, err)
	fmt.Println("Expected snickers:", preorder)
	fmt.Println("Got snickers:", gotPreorder)
	//require.Equal(t, snickers, gotSnickers)
}

func TestHandleGetCartCount(t *testing.T) {
	// user := db.User{
	// 	ID:       1,
	// 	Username: "testuser",
	// }

	quantity := int32(1)

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
					GetCartCount(gomock.Any(), gomock.Eq("1465553591858304793")).
					Times(1).
					Return(quantity, nil)
			},
			checkResponse: func(recorder *httptest.ResponseRecorder) {
				require.Equal(t, http.StatusOK, recorder.Code)
				requireBodyMatchPreorder2(t, recorder.Body, quantity)
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

			url := "/getCartCount"
			data := types.PreorderType{
				Id:   int32(1),
				Size: "10",
			}

			// Кодируем структуру в JSON
			jsonData, _ := json.Marshal(data)
			request, err := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(jsonData))
			require.NoError(t, err)
			cookie := &http.Cookie{
				Name:  "cart",
				Value: "1465553591858304793",
				Path:  "/",
			}
			request.AddCookie(cookie)

			server.router.ServeHTTP(recorder, request)
			tc.checkResponse(recorder)
		})
	}
}

func requireBodyMatchPreorder2(t *testing.T, body *bytes.Buffer, preorder int32) {
	data, err := io.ReadAll(body)
	require.NoError(t, err)

	fmt.Println(data, "fdata")

	var gotPreorder string

	fmt.Println("Expected preorder:", gotPreorder)
	require.NoError(t, err)
	fmt.Println("Expected snickers:", preorder)
	fmt.Println("Got snickers:", gotPreorder)
	//require.Equal(t, snickers, gotSnickers)
}
