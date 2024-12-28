// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.26.0
// source: user.sql

package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const checkCustomerExistence = `-- name: CheckCustomerExistence :one
SELECT EXISTS (
        SELECT 1
        FROM unregistercustomer
        WHERE id = $1
            AND mail = $2
    )
`

type CheckCustomerExistenceParams struct {
	ID   int32  `json:"id"`
	Mail string `json:"mail"`
}

func (q *Queries) CheckCustomerExistence(ctx context.Context, arg CheckCustomerExistenceParams) (bool, error) {
	row := q.db.QueryRow(ctx, checkCustomerExistence, arg.ID, arg.Mail)
	var exists bool
	err := row.Scan(&exists)
	return exists, err
}

const checkMail = `-- name: CheckMail :one
SELECT EXISTS (
        SELECT 1
        FROM customers
        WHERE mail = $1
    )
`

func (q *Queries) CheckMail(ctx context.Context, mail string) (bool, error) {
	row := q.db.QueryRow(ctx, checkMail, mail)
	var exists bool
	err := row.Scan(&exists)
	return exists, err
}

const createCustomer = `-- name: CreateCustomer :one
INSERT INTO customers (pass, mail)
VALUES ($1, $2)
RETURNING id
`

type CreateCustomerParams struct {
	Pass []byte `json:"pass"`
	Mail string `json:"mail"`
}

func (q *Queries) CreateCustomer(ctx context.Context, arg CreateCustomerParams) (int32, error) {
	row := q.db.QueryRow(ctx, createCustomer, arg.Pass, arg.Mail)
	var id int32
	err := row.Scan(&id)
	return id, err
}

const deleteFromVerifivation = `-- name: DeleteFromVerifivation :exec
DELETE FROM verification
WHERE id = $1
`

func (q *Queries) DeleteFromVerifivation(ctx context.Context, id int32) error {
	_, err := q.db.Exec(ctx, deleteFromVerifivation, id)
	return err
}

const deleteVerification = `-- name: DeleteVerification :exec
DELETE FROM verification
WHERE id = $1
`

func (q *Queries) DeleteVerification(ctx context.Context, id int32) error {
	_, err := q.db.Exec(ctx, deleteVerification, id)
	return err
}

const getBaseCustomerData = `-- name: GetBaseCustomerData :one
SELECT id,
    pass
FROM customers
WHERE mail = $1
`

type GetBaseCustomerDataRow struct {
	ID   int32  `json:"id"`
	Pass []byte `json:"pass"`
}

func (q *Queries) GetBaseCustomerData(ctx context.Context, mail string) (GetBaseCustomerDataRow, error) {
	row := q.db.QueryRow(ctx, getBaseCustomerData, mail)
	var i GetBaseCustomerDataRow
	err := row.Scan(&i.ID, &i.Pass)
	return i, err
}

const getCustomerData = `-- name: GetCustomerData :one
SELECT name,
    secondname,
    mail,
    phone
FROM customers
WHERE id = $1
`

type GetCustomerDataRow struct {
	Name       pgtype.Text `json:"name"`
	Secondname pgtype.Text `json:"secondname"`
	Mail       string      `json:"mail"`
	Phone      pgtype.Text `json:"phone"`
}

func (q *Queries) GetCustomerData(ctx context.Context, id int32) (GetCustomerDataRow, error) {
	row := q.db.QueryRow(ctx, getCustomerData, id)
	var i GetCustomerDataRow
	err := row.Scan(
		&i.Name,
		&i.Secondname,
		&i.Mail,
		&i.Phone,
	)
	return i, err
}

const getCustomerId = `-- name: GetCustomerId :one
SELECT id
FROM customers
WHERE mail = $1
`

func (q *Queries) GetCustomerId(ctx context.Context, mail string) (int32, error) {
	row := q.db.QueryRow(ctx, getCustomerId, mail)
	var id int32
	err := row.Scan(&id)
	return id, err
}

const getPassword = `-- name: GetPassword :one
SELECT pass
FROM customers
WHERE id = $1
`

func (q *Queries) GetPassword(ctx context.Context, id int32) ([]byte, error) {
	row := q.db.QueryRow(ctx, getPassword, id)
	var pass []byte
	err := row.Scan(&pass)
	return pass, err
}

const getUnregisterCustomer = `-- name: GetUnregisterCustomer :one
SELECT name,
    secondname,
    mail,
    phone,
    town,
    street,
    region,
    index,
    house,
    flat
FROM unregistercustomer
WHERE id = $1
`

type GetUnregisterCustomerRow struct {
	Name       string      `json:"name"`
	Secondname pgtype.Text `json:"secondname"`
	Mail       string      `json:"mail"`
	Phone      string      `json:"phone"`
	Town       string      `json:"town"`
	Street     string      `json:"street"`
	Region     string      `json:"region"`
	Index      string      `json:"index"`
	House      pgtype.Text `json:"house"`
	Flat       pgtype.Text `json:"flat"`
}

func (q *Queries) GetUnregisterCustomer(ctx context.Context, id int32) (GetUnregisterCustomerRow, error) {
	row := q.db.QueryRow(ctx, getUnregisterCustomer, id)
	var i GetUnregisterCustomerRow
	err := row.Scan(
		&i.Name,
		&i.Secondname,
		&i.Mail,
		&i.Phone,
		&i.Town,
		&i.Street,
		&i.Region,
		&i.Index,
		&i.House,
		&i.Flat,
	)
	return i, err
}

const getVerification = `-- name: GetVerification :one
SELECT id,
    expire,
    customerid
FROM verification
WHERE token = $1
`

type GetVerificationRow struct {
	ID         int32            `json:"id"`
	Expire     pgtype.Timestamp `json:"expire"`
	Customerid int32            `json:"customerid"`
}

func (q *Queries) GetVerification(ctx context.Context, token string) (GetVerificationRow, error) {
	row := q.db.QueryRow(ctx, getVerification, token)
	var i GetVerificationRow
	err := row.Scan(&i.ID, &i.Expire, &i.Customerid)
	return i, err
}

const insertVerification = `-- name: InsertVerification :exec
INSERT INTO verification (token, expire, customerId, deleteTime)
VALUES ($1, $2, $3, $4)
`

type InsertVerificationParams struct {
	Token      string           `json:"token"`
	Expire     pgtype.Timestamp `json:"expire"`
	Customerid int32            `json:"customerid"`
	Deletetime pgtype.Timestamp `json:"deletetime"`
}

func (q *Queries) InsertVerification(ctx context.Context, arg InsertVerificationParams) error {
	_, err := q.db.Exec(ctx, insertVerification,
		arg.Token,
		arg.Expire,
		arg.Customerid,
		arg.Deletetime,
	)
	return err
}

const selectHistoryFromUniqueCustomer = `-- name: SelectHistoryFromUniqueCustomer :one
SELECT history
FROM uniquecustomers
WHERE id = $1
`

func (q *Queries) SelectHistoryFromUniqueCustomer(ctx context.Context, id int32) ([]int32, error) {
	row := q.db.QueryRow(ctx, selectHistoryFromUniqueCustomer, id)
	var history []int32
	err := row.Scan(&history)
	return history, err
}

const setUnregisterCustomer = `-- name: SetUnregisterCustomer :one
INSERT INTO unregistercustomer (
        name,
        secondname,
        mail,
        phone,
        town,
        street,
        region,
        index,
        house,
        flat
    )
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING id
`

type SetUnregisterCustomerParams struct {
	Name       string      `json:"name"`
	Secondname pgtype.Text `json:"secondname"`
	Mail       string      `json:"mail"`
	Phone      string      `json:"phone"`
	Town       string      `json:"town"`
	Street     string      `json:"street"`
	Region     string      `json:"region"`
	Index      string      `json:"index"`
	House      pgtype.Text `json:"house"`
	Flat       pgtype.Text `json:"flat"`
}

func (q *Queries) SetUnregisterCustomer(ctx context.Context, arg SetUnregisterCustomerParams) (int32, error) {
	row := q.db.QueryRow(ctx, setUnregisterCustomer,
		arg.Name,
		arg.Secondname,
		arg.Mail,
		arg.Phone,
		arg.Town,
		arg.Street,
		arg.Region,
		arg.Index,
		arg.House,
		arg.Flat,
	)
	var id int32
	err := row.Scan(&id)
	return id, err
}

const updateCustomerPass = `-- name: UpdateCustomerPass :exec
UPDATE customers
SET pass = $1
WHERE id = $2
`

type UpdateCustomerPassParams struct {
	Pass []byte `json:"pass"`
	ID   int32  `json:"id"`
}

func (q *Queries) UpdateCustomerPass(ctx context.Context, arg UpdateCustomerPassParams) error {
	_, err := q.db.Exec(ctx, updateCustomerPass, arg.Pass, arg.ID)
	return err
}

const updateUniqueCustomerHistry = `-- name: UpdateUniqueCustomerHistry :exec
UPDATE uniquecustomers
SET history = $1
WHERE id = $2
`

type UpdateUniqueCustomerHistryParams struct {
	History []int32 `json:"history"`
	ID      int32   `json:"id"`
}

func (q *Queries) UpdateUniqueCustomerHistry(ctx context.Context, arg UpdateUniqueCustomerHistryParams) error {
	_, err := q.db.Exec(ctx, updateUniqueCustomerHistry, arg.History, arg.ID)
	return err
}