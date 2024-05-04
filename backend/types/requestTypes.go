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
type CreateOrderType struct {
	PreorderId   string `json:"preorderId"`
	PersonalData struct {
		Name       string `json:"name"`
		Phone      string `json:"phone"`
		Mail       string `json:"mail"`
		SecondName string `json:"secondName"`
	} `json:"personalData"`
	Address struct {
		PostIndex int    `json:"postIndex"`
		Address   string `json:"address"`
	} `json:"address"`
	Delivery struct {
		DeliveryPrice int `json:"deliveryPrice"`
		Type          int `json:"type"`
	} `json:"delivery"`
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
