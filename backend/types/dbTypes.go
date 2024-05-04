package types

import "github.com/lib/pq"

type SnickersFilterStruct struct {
	Firms []string  `json:"firms"`
	Sizes []string  `json:"sizes"`
	Price []float32 `json:"price"`
}
type MainPage struct {
	Text    string `db:"maintext"`
	SubText string `db:"subtext"`
	Image   string `db:"imagepath"`
}
type SnickersInfo struct {
	Name       string  `db:"name"`
	Image_path string  `db:"image_path"`
	Info       string  `db:"info"`
	Discount   *string `db:"value"`
}
type SnickersSearch struct {
	Name       string `db:"name"`
	Image_path string `db:"image_path"`
	Id         int16  `db:"id"`
	Firm       string `db:"firm"`
	Price      int    `db:"minprice"`
	Discount   *int   `db:"maxdiscprice"`
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
	SnickersPageInfo []SnickersSearch
	PageSize         int
	Filter           Filter
}
type SnickersPage struct {
	SnickersPageInfo []SnickersSearch
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
	Name     string `db:"name"`
	Price    string `db:"price"`
	Size     string `db:"size"`
	Image    string `db:"image_path"`
	Id       int16  `db:"id"`
	Quantity int    `db:"quantity"`
	PrId     int    `db:"prid"`
	Firm     string `db:"firm"`
}

type SnickersPreorder struct {
	Size     string `db:"size"`
	Quantity int    `db:"quantity"`
	Id       int    `db:"id"`
	PrId     int    `db:"prid"`
}
