package types

import (
	"time"

	"github.com/lib/pq"
)

type SizesT struct {
	Snickers []string `json:"snickers"`
	Clothes  []string `json:"clothes"`
}
type SnickersFilterStruct struct {
	Firms []string  `json:"firms"`
	Sizes SizesT    `json:"sizes"`
	Price []float32 `json:"price"`
	Types []int32   `json:"types"`
}
type MainPage struct {
	Text    string `db:"maintext"`
	SubText string `db:"subtext"`
	Image   string `db:"imagepath"`
}
type ProductsInfo struct {
	Name       string  `db:"name"`
	Image_path string  `db:"image_path"`
	Info       string  `db:"info"`
	Discount   *string `db:"value"`
}
type ProductsSearch struct {
	Name       string `db:"name"`
	Image_path string `db:"image_path"`
	Id         int16  `db:"id"`
	Firm       string `db:"firm"`
	Price      int    `db:"minprice"`
	Discount   *int   `db:"maxdiscprice"`
	TotalCount int64  `json:"total_count"`
}
type FirmsResult struct {
	Firm        string         `db:"firm"`
	ArrayOfData pq.StringArray `db:"array_of_data"`
}
type Snickers struct {
	Name       string  `db:"name"`
	Image_path string  `db:"image_path"`
	Id         int16   `db:"id"`
	Discount   *string `db:"value"`
}
type SnickersLine struct {
	Name       pq.StringArray `db:"name_data"`
	Image_path pq.StringArray `db:"image_path"`
	Id         pq.Int32Array  `db:"id"`
	Line       string         `db:"line"`
	Discount   *string        `db:"value"`
}
type SnickersPageAndFilters struct {
	ProductsPageInfo []ProductsSearch
	PageSize         int
	Filter           Filter
}
type ProductsPage struct {
	ProductsPageInfo []ProductsSearch
	PageSize         int
}
type SizeFilter struct {
	C1  int `json:"3.5" db:"name_data2"`
	C2  int `json:"4" db:"name_data3"`
	C3  int `json:"4.5" db:"name_data4"`
	C4  int `json:"5" db:"name_data5"`
	C5  int `json:"5.5" db:"name_data6"`
	C6  int `json:"6" db:"name_data7"`
	C7  int `json:"6.5" db:"name_data8"`
	C8  int `json:"7" db:"name_data9"`
	C9  int `json:"7.5" db:"name_data10"`
	C10 int `json:"8" db:"name_data11"`
	C11 int `json:"8.5" db:"name_data12"`
	C12 int `json:"9" db:"name_data13"`
	C13 int `json:"9.5" db:"name_data163"`
	C14 int `json:"10" db:"name_data14"`
	C15 int `json:"10.5" db:"name_data15"`
	C16 int `json:"11" db:"name_data16"`
	C17 int `json:"11.5" db:"name_data17"`
	C18 int `json:"12" db:"name_data18"`
	C19 int `json:"12.5" db:"name_data19"`
	C20 int `json:"13" db:"name_data20"`
}

type SizePriceFilter struct {
	SizeFilter
	MaxPrice int `db:"max"`
	MinPrice int `db:"min"`
}

type Filter struct {
	SizePriceFilter SizePriceFilter
	FirmFilter      map[string]int
}
type SnickersCart struct {
	Name        string `db:"name"`
	Price       int    `db:"price"`
	Size        string `db:"size"`
	Image       string `db:"image_path"`
	Id          int16  `db:"id"`
	Quantity    int    `db:"quantity"`
	PrId        int    `db:"prid"`
	Firm        string `db:"firm"`
	SourceTable string `db:"source_table"`
}

type SnickersPreorder struct {
	Size     string `db:"size"`
	Quantity int    `db:"quantity"`
	Id       int    `db:"id"`
	PrId     int    `db:"prid"`
}

type CustimerInfo struct {
	Name       string `db:"name"`
	SecondName string `db:"secondName"`
	Mail       string `db:"mail"`
	Phone      string `db:"phone"`
}
type LoginInfo struct {
	Id   int16  `db:"id"`
	Pass []byte `db:"pass"`
}
type VerInfo struct {
	Id         int16     `db:"id"`
	Expire     time.Time `db:"expire"`
	CustomerId int16     `db:"customerid"`
}
type Pass struct {
	Pass string `db:"pass"`
}

type OrderInfo struct {
	Status               string `db:"status"`
	Id                   int    `db:"id"`
	CostumerId           *int   `db:"customerid"`
	UnregisterCostumerId *int   `db:"unregistercustomerid"`
	Hash                 string `db:"hash"`
}

type UnregisterCustomerType struct {
	Name       string `db:"name"`
	SecondName string `db:"secondname,omitempty"`
	Phone      string `db:"phone"`
	Mail       string `db:"mail"`
	Town       string `db:"town"`
	Street     string `db:"street"`
	Region     string `db:"region"`
	Index      string `db:"index"`
	House      string `db:"house,omitempty"`
	Flat       string `db:"flat,omitempty"`
}

type OrderData struct {
	UserInfo     UnregisterCustomerType
	State        string
	SnickersCart []SnickersCart
	OrderId      int
}
type ProductsInsert struct {
	Size        string `db:"size"`
	Quantity    int    `db:"quantity"`
	Productid   int    `db:"productid"`
	ProductType int    `db:"producttype"`
}
