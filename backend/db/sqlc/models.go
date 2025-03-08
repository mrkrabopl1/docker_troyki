// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.26.0

package db

import (
	"database/sql/driver"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
)

type DeliveryEnum string

const (
	DeliveryEnumOwn     DeliveryEnum = "own"
	DeliveryEnumExpress DeliveryEnum = "express"
	DeliveryEnumCdek    DeliveryEnum = "cdek"
)

func (e *DeliveryEnum) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = DeliveryEnum(s)
	case string:
		*e = DeliveryEnum(s)
	default:
		return fmt.Errorf("unsupported scan type for DeliveryEnum: %T", src)
	}
	return nil
}

type NullDeliveryEnum struct {
	DeliveryEnum DeliveryEnum `json:"delivery_enum"`
	Valid        bool         `json:"valid"` // Valid is true if DeliveryEnum is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullDeliveryEnum) Scan(value interface{}) error {
	if value == nil {
		ns.DeliveryEnum, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.DeliveryEnum.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullDeliveryEnum) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.DeliveryEnum), nil
}

type StatusEnum string

const (
	StatusEnumPending  StatusEnum = "pending"
	StatusEnumApproved StatusEnum = "approved"
	StatusEnumRejected StatusEnum = "rejected"
)

func (e *StatusEnum) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = StatusEnum(s)
	case string:
		*e = StatusEnum(s)
	default:
		return fmt.Errorf("unsupported scan type for StatusEnum: %T", src)
	}
	return nil
}

type NullStatusEnum struct {
	StatusEnum StatusEnum `json:"status_enum"`
	Valid      bool       `json:"valid"` // Valid is true if StatusEnum is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullStatusEnum) Scan(value interface{}) error {
	if value == nil {
		ns.StatusEnum, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.StatusEnum.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullStatusEnum) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.StatusEnum), nil
}

type Customer struct {
	ID         int32       `json:"id"`
	Name       pgtype.Text `json:"name"`
	Secondname pgtype.Text `json:"secondname"`
	Mail       string      `json:"mail"`
	Pass       []byte      `json:"pass"`
	Phone      pgtype.Text `json:"phone"`
	Town       pgtype.Text `json:"town"`
	Index      pgtype.Text `json:"index"`
	Sendmail   pgtype.Bool `json:"sendmail"`
	Street     pgtype.Text `json:"street"`
	Region     pgtype.Text `json:"region"`
	Home       pgtype.Text `json:"home"`
	Flat       pgtype.Text `json:"flat"`
}

type Discount struct {
	ID           int32       `json:"id"`
	Productid    int32       `json:"productid"`
	Value        []byte      `json:"value"`
	Minprice     pgtype.Int4 `json:"minprice"`
	Maxdiscprice pgtype.Int4 `json:"maxdiscprice"`
}

type Order struct {
	ID                   int32        `json:"id"`
	Customerid           pgtype.Int4  `json:"customerid"`
	Unregistercustomerid pgtype.Int4  `json:"unregistercustomerid"`
	Orderdate            pgtype.Date  `json:"orderdate"`
	Status               StatusEnum   `json:"status"`
	Hash                 string       `json:"hash"`
	Deliveryprice        int32        `json:"deliveryprice"`
	Deliverytype         DeliveryEnum `json:"deliverytype"`
}

type Orderitem struct {
	ID        int32       `json:"id"`
	Orderid   int32       `json:"orderid"`
	Productid int32       `json:"productid"`
	Quantity  int32       `json:"quantity"`
	Size      pgtype.Text `json:"size"`
}

type Preorder struct {
	ID         int32       `json:"id"`
	Hashurl    string      `json:"hashurl"`
	Updatetime pgtype.Date `json:"updatetime"`
}

type Preorderitem struct {
	ID        int32       `json:"id"`
	Orderid   int32       `json:"orderid"`
	Productid int32       `json:"productid"`
	Quantity  int32       `json:"quantity"`
	Size      pgtype.Text `json:"size"`
}

type Snicker struct {
	ID          int32       `json:"id"`
	Qid         string      `json:"qid"`
	Name        string      `json:"name"`
	Info        []byte      `json:"info"`
	Firm        string      `json:"firm"`
	Line        string      `json:"line"`
	ImagePath   string      `json:"image_path"`
	Minprice    int32       `json:"minprice"`
	Maxprice    int32       `json:"maxprice"`
	Article     pgtype.Text `json:"article"`
	Date        pgtype.Text `json:"date"`
	Description pgtype.Text `json:"description"`
	_35         pgtype.Int4 `json:"3.5"`
	_4          pgtype.Int4 `json:"4"`
	_45         pgtype.Int4 `json:"4.5"`
	_5          pgtype.Int4 `json:"5"`
	_55         pgtype.Int4 `json:"5.5"`
	_6          pgtype.Int4 `json:"6"`
	_65         pgtype.Int4 `json:"6.5"`
	_7          pgtype.Int4 `json:"7"`
	_75         pgtype.Int4 `json:"7.5"`
	_8          pgtype.Int4 `json:"8"`
	_85         pgtype.Int4 `json:"8.5"`
	_9          pgtype.Int4 `json:"9"`
	_95         pgtype.Int4 `json:"9.5"`
	_10         pgtype.Int4 `json:"10"`
	_105        pgtype.Int4 `json:"10.5"`
	_11         pgtype.Int4 `json:"11"`
	_115        pgtype.Int4 `json:"11.5"`
	_12         pgtype.Int4 `json:"12"`
	_125        pgtype.Int4 `json:"12.5"`
	_13         pgtype.Int4 `json:"13"`
}

type Uniquecustomer struct {
	ID           int32       `json:"id"`
	Creationtime pgtype.Date `json:"creationtime"`
	History      []int32     `json:"history"`
}

type Unregistercustomer struct {
	ID         int32       `json:"id"`
	Name       string      `json:"name"`
	Secondname pgtype.Text `json:"secondname"`
	Mail       string      `json:"mail"`
	Phone      string      `json:"phone"`
	Town       string      `json:"town"`
	Index      string      `json:"index"`
	Sendmail   pgtype.Bool `json:"sendmail"`
	Street     string      `json:"street"`
	Region     string      `json:"region"`
	House      pgtype.Text `json:"house"`
	Flat       pgtype.Text `json:"flat"`
}

type Verification struct {
	ID         int32            `json:"id"`
	Token      string           `json:"token"`
	Customerid int32            `json:"customerid"`
	Expire     pgtype.Timestamp `json:"expire"`
	Deletetime pgtype.Timestamp `json:"deletetime"`
}
