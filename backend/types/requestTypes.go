package types

type DeleteCartData struct {
	PreorderId int32 `json:"preorderid"`
}
type PreorderType struct {
	Id          int32  `json:"id"`
	Size        string `json:"size"`
	SourceTable string `json:"sourceTable"`
}

type UpdataPreorderType struct {
	PreorderType
	HashUrl string `json:"hashUrl"`
}

type PostDataRegisterUser struct {
	Login    string `json:"login"`
	Mail     string `json:"mail"`
	Password string `json:"pass"`
}

type PersonalData struct {
	Name       string `json:"name"`
	Phone      string `json:"phone"`
	Mail       string `json:"mail"`
	SecondName string `json:"secondName,omitempty"`
}

type Address struct {
	Town        string   `json:"town"`
	Index       string   `json:"index"`
	Region      string   `json:"region"`
	Street      string   `json:"street"`
	House       string   `json:"house,omitempty"`
	Flat        string   `json:"flat,omitempty"`
	Coordinates []string `json:"coordinates"`
}

type Discounts struct {
	// Define your struct to represent the JSON data
	Max int `json:"max"`
}
type PostDataSoloCollection struct {
	// Define your struct to represent the JSON data
	Name string `json:"name"`
	Page int    `json:"page"`
	Size int    `json:"size"`
}
type PostDataCollection struct {
	// Define your struct to represent the JSON data
	Names []string `json:"names"`
	Page  int      `json:"page"`
	Size  int      `json:"size"`
}
type PostData struct {
	Name string `json:"name"`
	Max  int32  `json:"max"`
}
type PostDataSnickersAndFiltersByString struct {
	// Define your struct to represent the JSON data
	Name     string               `json:"name"`
	Page     int                  `json:"page"`
	Size     int                  `json:"size"`
	Filters  ProductsFilterStruct `json:"filters"`
	SortType int                  `json:"orderedType"`
	Type     int32                `json:"type"`
	Category int32                `json:"category"`
}

type PostDataAndFiltersByCategoryAndType struct {
	// Define your struct to represent the JSON data
	Name     string               `json:"name"`
	Page     int                  `json:"page"`
	Size     int                  `json:"size"`
	Filters  ProductsFilterStruct `json:"filters"`
	SortType int32                `json:"sortType"`
}
type VerifyData struct {
	Token string `json:"token"`
}
type ChangePassType struct {
	NewPass string `json:"newPass"`
	OldPass string `json:"oldPass"`
}
type OrderRequest struct {
	OrderId int32  `json:"orderId"`
	Mail    string `json:"mail"`
}

type DiscountData struct {
	Sizes   []string `json:"sizes"`
	Percent int32    `json:"percent"`
}
