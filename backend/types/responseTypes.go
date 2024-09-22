package types

type FirmResponse map[string][]string

type SnickersLineResponse map[string][]SnickersResponse

type SnickersResponse struct {
	Name  string   `json:"name"`
	Id    int32    `json:"id"`
	Image []string `json:"imgs"`
}

type SnickersResponseDD struct {
	Name     string      `json:"name"`
	Id       int32       `json:"id"`
	Image    []string    `json:"imgs"`
	Discount interface{} `json:"discount"`
	Price    int         `json:"price"`
}

type SnickersInfoResponse struct {
	Name     string      `json:"name"`
	Image    []string    `json:"imgs"`
	Info     string      `json:"info"`
	Discount interface{} `json:"discount"`
}
type SnickersSearchResponse struct {
	Name  string `json:"name"`
	Image string `json:"img"`
	Firm  string `json:"firm"`
	Price int    `json:"price"`
	Id    int    `json:"id"`
}

type SnickersSearchResponse1 struct {
	Name     string      `json:"name"`
	Image    []string    `json:"imgs"`
	Firm     string      `json:"firm"`
	Price    int         `json:"price"`
	Id       int         `json:"id"`
	Discount interface{} `json:"discount"`
}

type FiltersSearchResponse struct {
	FirmsCount map[string]int `json:"firmsCount"`
	Price      [2]int         `json:"price"`
	Sizes      SizeFilter     `json:"sizes"`
}

type MainPageResp struct {
	MainText string `json:"mainText"`
	SubText  string `json:"subText"`
	Image    string `json:"img"`
}
type SnickersResponseD struct {
	Name     string      `json:"name"`
	Id       int32       `json:"id"`
	Image    []string    `json:"imgs"`
	Discount interface{} `json:"discount"`
}
type CartResponse struct {
	Name     string `json:"name"`
	Image    string `json:"img"`
	Id       int    `json:"id"`
	Size     string `json:"size"`
	Quantity int    `json:"quantity"`
	Price    int    `json:"price"`
	Firm     string `json:"firm"`
	PrId     int    `json:"prid"`
}

type FullCartRespone struct {
	CartData []CartResponse `json:"cartData"`
	FullPice int            `json:"fullPrice"`
}

type PostDataOrdreredSnickersByString struct {
	// Define your struct to represent the JSON data
	Name      string               `json:"name"`
	Page      int                  `json:"page"`
	Size      int                  `json:"size"`
	Filters   SnickersFilterStruct `json:"filters"`
	OrderType int                  `json:"orderType"`
}
type RespSearchSnickersByString struct {
	Snickers []SnickersResponseDD `json:"snickers"`
	Pages    int                  `json:"pages"`
}
type RespSearchSnickersAndFiltersByString struct {
	Snickers []SnickersResponseDD  `json:"snickers"`
	Pages    int                   `json:"pages"`
	Filters  FiltersSearchResponse `json:"filters"`
}
type UnregisterCustomerResponse struct {
	Name       string          `json:"name"`
	Phone      string          `json:"phone"`
	Mail       string          `json:"mail"`
	SecondName string          `json:"secondName,omitempty"`
	Address    AddressTypeResp `json:"address"`
}

type AddressTypeResp struct {
	Town   string `json:"town"`
	Index  string `json:"index"`
	Region string `json:"region"`
	Street string `json:"street"`
	House  string `json:"house,omitempty"`
	Flat   string `json:"flat,omitempty"`
}

type OrderDataResp struct {
	UserInfo     UnregisterCustomerResponse `json:"userInfo"`
	State        string                     `json:"state"`
	CartResponse FullCartRespone            `json:"cartResponse"`
}
