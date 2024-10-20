package types

type DeleteCartData struct {
	PreorderId int `json:"preorderid"`
}
type PreorderType struct {
	Id   int               `json:"id"`
	Info map[string]string `json:"info"`
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
type CreateOrderType struct {
	PreorderId   string `json:"preorderId"`
	PersonalData struct {
		Name       string `json:"name"`
		Phone      string `json:"phone"`
		Mail       string `json:"mail"`
		SecondName string `json:"secondName,omitempty"`
	} `json:"personalData"`
	Address struct {
		Town   string `json:"town"`
		Index  string `json:"index"`
		Region string `json:"region"`
		Street string `json:"street"`
		House  string `json:"house,omitempty"`
		Flat   string `json:"flat,omitempty"`
	} `json:"address"`
	Delivery struct {
		DeliveryPrice int `json:"deliveryPrice"`
		Type          int `json:"type"`
	} `json:"delivery"`
	Save bool `json:"save"`
}
type PostDataCollection struct {
	// Define your struct to represent the JSON data
	Name string `json:"name"`
	Page int    `json:"page"`
	Size int    `json:"size"`
}
type PostData struct {
	Name string `json:"name"`
	Max  int    `json:"max"`
}
type PostDataSnickersAndFiltersByString struct {
	// Define your struct to represent the JSON data
	Name        string               `json:"name"`
	Page        int                  `json:"page"`
	Size        int                  `json:"size"`
	Filters     SnickersFilterStruct `json:"filters"`
	OrderedType int                  `json:"orderedType"`
}
type VerifyData struct {
	Token string `json:"token"`
}
type ChangePassType struct {
	NewPass string `json:"newPass"`
	OldPass string `json:"oldPass"`
}
type OrderRequest struct {
	OrderId int    `json:"orderId"`
	Mail    string `json:"mail"`
}
