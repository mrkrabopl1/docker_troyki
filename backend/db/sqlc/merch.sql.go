// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.26.0
// source: merch.sql

package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const getCointIdByName = `-- name: GetCointIdByName :many
SELECT firm,
    COUNT(id) count
FROM snickers
WHERE name ILIKE '%' || CAST($1 AS text) || '%'
GROUP BY $1
`

type GetCointIdByNameRow struct {
	Firm  string `json:"firm"`
	Count int64  `json:"count"`
}

func (q *Queries) GetCointIdByName(ctx context.Context, dollar_1 string) ([]GetCointIdByNameRow, error) {
	rows, err := q.db.Query(ctx, getCointIdByName, dollar_1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetCointIdByNameRow
	for rows.Next() {
		var i GetCointIdByNameRow
		if err := rows.Scan(&i.Firm, &i.Count); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const getFiltersByString = `-- name: GetFiltersByString :one
WITH firm_counts AS (
    SELECT s.firm, COUNT(s.id) AS firm_count
    FROM snickers AS s
    WHERE s.name ILIKE '%' || $1::text || '%'
    GROUP BY s.firm
)
SELECT
    COUNT(s."3.5") AS size_35,
    COUNT(s."4") AS size_4,
    COUNT(s."4.5") AS size_45,
    COUNT(s."5") AS size_5,
    COUNT(s."5.5") AS size_55,
    COUNT(s."6") AS size_6,
    COUNT(s."6.5") AS size_65,
    COUNT(s."7") AS size_7,
    COUNT(s."7.5") AS size_75,
    COUNT(s."8") AS size_8,
    COUNT(s."8.5") AS size_85,
    COUNT(s."9") AS size_9,
    COUNT(s."9.5") AS size_95,
    COUNT(s."10") AS size_10,
    COUNT(s."10.5") AS size_105,
    COUNT(s."11") AS size_11,
    COUNT(s."11.5") AS size_115,
    COUNT(s."12") AS size_12,
    COUNT(s."12.5") AS size_125,
    COUNT(s."13") AS size_13,
    MIN(s.minprice) AS min,
    MAX(s.maxprice) AS max,
    jsonb_object_agg(COALESCE(fc.firm, 'Unknown'), fc.firm_count) AS firm_count_map
FROM snickers AS s
LEFT JOIN firm_counts fc ON s.firm = fc.firm
WHERE s.name ILIKE '%' || $1::text || '%'
`

type GetFiltersByStringRow struct {
	Size35       int64       `json:"size_35"`
	Size4        int64       `json:"size_4"`
	Size45       int64       `json:"size_45"`
	Size5        int64       `json:"size_5"`
	Size55       int64       `json:"size_55"`
	Size6        int64       `json:"size_6"`
	Size65       int64       `json:"size_65"`
	Size7        int64       `json:"size_7"`
	Size75       int64       `json:"size_75"`
	Size8        int64       `json:"size_8"`
	Size85       int64       `json:"size_85"`
	Size9        int64       `json:"size_9"`
	Size95       int64       `json:"size_95"`
	Size10       int64       `json:"size_10"`
	Size105      int64       `json:"size_105"`
	Size11       int64       `json:"size_11"`
	Size115      int64       `json:"size_115"`
	Size12       int64       `json:"size_12"`
	Size125      int64       `json:"size_125"`
	Size13       int64       `json:"size_13"`
	Min          interface{} `json:"min"`
	Max          interface{} `json:"max"`
	FirmCountMap []byte      `json:"firm_count_map"`
}

func (q *Queries) GetFiltersByString(ctx context.Context, dollar_1 string) (GetFiltersByStringRow, error) {
	row := q.db.QueryRow(ctx, getFiltersByString, dollar_1)
	var i GetFiltersByStringRow
	err := row.Scan(
		&i.Size35,
		&i.Size4,
		&i.Size45,
		&i.Size5,
		&i.Size55,
		&i.Size6,
		&i.Size65,
		&i.Size7,
		&i.Size75,
		&i.Size8,
		&i.Size85,
		&i.Size9,
		&i.Size95,
		&i.Size10,
		&i.Size105,
		&i.Size11,
		&i.Size115,
		&i.Size12,
		&i.Size125,
		&i.Size13,
		&i.Min,
		&i.Max,
		&i.FirmCountMap,
	)
	return i, err
}

const getFirms = `-- name: GetFirms :many
SELECT firm,
    array_agg(DISTINCT line) AS array_of_data
FROM "snickers"
GROUP BY firm
`

type GetFirmsRow struct {
	Firm        string      `json:"firm"`
	ArrayOfData interface{} `json:"array_of_data"`
}

func (q *Queries) GetFirms(ctx context.Context) ([]GetFirmsRow, error) {
	rows, err := q.db.Query(ctx, getFirms)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetFirmsRow
	for rows.Next() {
		var i GetFirmsRow
		if err := rows.Scan(&i.Firm, &i.ArrayOfData); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const getSnickersByFirmName = `-- name: GetSnickersByFirmName :many
SELECT name,
    image_path,
    snickers.id,
    value,
    article
FROM snickers
    LEFT JOIN discount ON snickers.id = productid
WHERE firm = $1
`

type GetSnickersByFirmNameRow struct {
	Name      string      `json:"name"`
	ImagePath string      `json:"image_path"`
	ID        int32       `json:"id"`
	Value     []byte      `json:"value"`
	Article   pgtype.Text `json:"article"`
}

func (q *Queries) GetSnickersByFirmName(ctx context.Context, firm string) ([]GetSnickersByFirmNameRow, error) {
	rows, err := q.db.Query(ctx, getSnickersByFirmName, firm)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetSnickersByFirmNameRow
	for rows.Next() {
		var i GetSnickersByFirmNameRow
		if err := rows.Scan(
			&i.Name,
			&i.ImagePath,
			&i.ID,
			&i.Value,
			&i.Article,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const getSnickersByIds = `-- name: GetSnickersByIds :many
SELECT snickers.minPrice,
    snickers.id,
    image_path,
    name,
    firm,
    maxdiscprice
FROM snickers
    LEFT JOIN discount ON snickers.id = productid
WHERE snickers.id = ANY($1::int32[])
`

type GetSnickersByIdsRow struct {
	Minprice     int32       `json:"minprice"`
	ID           int32       `json:"id"`
	ImagePath    string      `json:"image_path"`
	Name         string      `json:"name"`
	Firm         string      `json:"firm"`
	Maxdiscprice pgtype.Int4 `json:"maxdiscprice"`
}

func (q *Queries) GetSnickersByIds(ctx context.Context, dollar_1 []interface{}) ([]GetSnickersByIdsRow, error) {
	rows, err := q.db.Query(ctx, getSnickersByIds, dollar_1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetSnickersByIdsRow
	for rows.Next() {
		var i GetSnickersByIdsRow
		if err := rows.Scan(
			&i.Minprice,
			&i.ID,
			&i.ImagePath,
			&i.Name,
			&i.Firm,
			&i.Maxdiscprice,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const getSnickersByLineName = `-- name: GetSnickersByLineName :many
SELECT line,
    array_agg(id) AS id,
    array_agg(image_path) AS image_path,
    array_agg(name) AS name_data
FROM snickers
WHERE line = $1
GROUP BY line
`

type GetSnickersByLineNameRow struct {
	Line      string      `json:"line"`
	ID        interface{} `json:"id"`
	ImagePath interface{} `json:"image_path"`
	NameData  interface{} `json:"name_data"`
}

func (q *Queries) GetSnickersByLineName(ctx context.Context, line string) ([]GetSnickersByLineNameRow, error) {
	rows, err := q.db.Query(ctx, getSnickersByLineName, line)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetSnickersByLineNameRow
	for rows.Next() {
		var i GetSnickersByLineNameRow
		if err := rows.Scan(
			&i.Line,
			&i.ID,
			&i.ImagePath,
			&i.NameData,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const getSnickersByName = `-- name: GetSnickersByName :many
SELECT snickers.minPrice,
    snickers.id,
    image_path,
    name,
    firm,
    maxdiscprice
FROM snickers
    LEFT JOIN discount ON snickers.id = productid
WHERE name ILIKE '%' || $1::text || '%'
LIMIT $2
`

type GetSnickersByNameParams struct {
	Column1 string `json:"column_1"`
	Limit   int32  `json:"limit"`
}

type GetSnickersByNameRow struct {
	Minprice     int32       `json:"minprice"`
	ID           int32       `json:"id"`
	ImagePath    string      `json:"image_path"`
	Name         string      `json:"name"`
	Firm         string      `json:"firm"`
	Maxdiscprice pgtype.Int4 `json:"maxdiscprice"`
}

func (q *Queries) GetSnickersByName(ctx context.Context, arg GetSnickersByNameParams) ([]GetSnickersByNameRow, error) {
	rows, err := q.db.Query(ctx, getSnickersByName, arg.Column1, arg.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetSnickersByNameRow
	for rows.Next() {
		var i GetSnickersByNameRow
		if err := rows.Scan(
			&i.Minprice,
			&i.ID,
			&i.ImagePath,
			&i.Name,
			&i.Firm,
			&i.Maxdiscprice,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const getSnickersInfoById = `-- name: GetSnickersInfoById :one
SELECT info,
    image_path,
    name,
    value,
    article,
    description,
    date
FROM snickers
    LEFT JOIN discount ON snickers.id = productid
WHERE snickers.id = $1
`

type GetSnickersInfoByIdRow struct {
	Info        []byte      `json:"info"`
	ImagePath   string      `json:"image_path"`
	Name        string      `json:"name"`
	Value       []byte      `json:"value"`
	Article     pgtype.Text `json:"article"`
	Description pgtype.Text `json:"description"`
	Date        pgtype.Text `json:"date"`
}

func (q *Queries) GetSnickersInfoById(ctx context.Context, id int32) (GetSnickersInfoByIdRow, error) {
	row := q.db.QueryRow(ctx, getSnickersInfoById, id)
	var i GetSnickersInfoByIdRow
	err := row.Scan(
		&i.Info,
		&i.ImagePath,
		&i.Name,
		&i.Value,
		&i.Article,
		&i.Description,
		&i.Date,
	)
	return i, err
}

const getSnickersWithDiscount = `-- name: GetSnickersWithDiscount :many
SELECT snickers.minPrice,
    snickers.qId,
    snickers.id,
    image_path,
    name,
    firm,
    maxdiscprice
FROM snickers
    JOIN discount ON snickers.id = productid
`

type GetSnickersWithDiscountRow struct {
	Minprice     int32       `json:"minprice"`
	Qid          string      `json:"qid"`
	ID           int32       `json:"id"`
	ImagePath    string      `json:"image_path"`
	Name         string      `json:"name"`
	Firm         string      `json:"firm"`
	Maxdiscprice pgtype.Int4 `json:"maxdiscprice"`
}

func (q *Queries) GetSnickersWithDiscount(ctx context.Context) ([]GetSnickersWithDiscountRow, error) {
	rows, err := q.db.Query(ctx, getSnickersWithDiscount)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetSnickersWithDiscountRow
	for rows.Next() {
		var i GetSnickersWithDiscountRow
		if err := rows.Scan(
			&i.Minprice,
			&i.Qid,
			&i.ID,
			&i.ImagePath,
			&i.Name,
			&i.Firm,
			&i.Maxdiscprice,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const getSoloCollection = `-- name: GetSoloCollection :many
SELECT COALESCE(discount.minprice, snickers.minprice) AS minprice,
    snickers.id,
    image_path,
    name,
    firm,
    maxdiscprice
FROM snickers
    LEFT JOIN discount ON snickers.id = productid
WHERE firm = $1
    OR line = $2
LIMIT $3 OFFSET $4
`

type GetSoloCollectionParams struct {
	Firm   string `json:"firm"`
	Line   string `json:"line"`
	Limit  int32  `json:"limit"`
	Offset int32  `json:"offset"`
}

type GetSoloCollectionRow struct {
	Minprice     int32       `json:"minprice"`
	ID           int32       `json:"id"`
	ImagePath    string      `json:"image_path"`
	Name         string      `json:"name"`
	Firm         string      `json:"firm"`
	Maxdiscprice pgtype.Int4 `json:"maxdiscprice"`
}

func (q *Queries) GetSoloCollection(ctx context.Context, arg GetSoloCollectionParams) ([]GetSoloCollectionRow, error) {
	rows, err := q.db.Query(ctx, getSoloCollection,
		arg.Firm,
		arg.Line,
		arg.Limit,
		arg.Offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetSoloCollectionRow
	for rows.Next() {
		var i GetSoloCollectionRow
		if err := rows.Scan(
			&i.Minprice,
			&i.ID,
			&i.ImagePath,
			&i.Name,
			&i.Firm,
			&i.Maxdiscprice,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}
