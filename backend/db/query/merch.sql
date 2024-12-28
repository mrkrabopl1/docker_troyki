-- name: GetFirms :many
SELECT firm,
    array_agg(DISTINCT line) AS array_of_data
FROM "snickers"
GROUP BY firm;
-- name: GetSnickersByFirmName :many
SELECT name,
    image_path,
    snickers.id,
    value
FROM snickers
    LEFT JOIN discount ON snickers.id = productid
WHERE firm = $1;
-- name: GetSnickersByLineName :many
SELECT line,
    array_agg(id) AS id,
    array_agg(image_path) AS image_path,
    array_agg(name) AS name_data
FROM snickers
WHERE line = $1
GROUP BY line;
-- name: GetFiltersByString :many
SELECT MIN(minprice) min,
    MAX(maxprice) max,
    COUNT("3.5") name_data2,
    COUNT("4") name_data3,
    COUNT("4.5") name_data4,
    COUNT("5") name_data5,
    COUNT("5.5") name_data6,
    COUNT("6") name_data7,
    COUNT("6.5") name_data8,
    COUNT("7") name_data9,
    COUNT("7.5") name_data10,
    COUNT("8") name_data11,
    COUNT("8.5") name_data12,
    COUNT("9") name_data13,
    COUNT("9.5") name_data163,
    COUNT("10") name_data14,
    COUNT("10.5") name_data15,
    COUNT("11") name_data16,
    COUNT("11.5") name_data17,
    COUNT("12") name_data18,
    COUNT("12.5") name_data19,
    COUNT("13") name_data20
FROM snickers
WHERE name ILIKE '%' || CAST($1 AS text) || '%';
-- name: GetCointIdByName :many
SELECT firm,
    COUNT(id) count
FROM snickers
WHERE name ILIKE '%' || CAST($1 AS text) || '%'
GROUP BY $1;
-- name: GetSnickersInfoById :one
SELECT info,
    image_path,
    name,
    value
FROM snickers
    LEFT JOIN discount ON snickers.id = productid
WHERE snickers.id = $1;
-- name: GetSoloCollection :many
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
LIMIT $3 OFFSET $4;
-- name: GetCollections :many
SELECT COALESCE(discount.minprice, snickers.minprice) AS minprice,
    snickers.id,
    image_path,
    name,
    firm,
    maxdiscprice
FROM snickers
    LEFT JOIN discount ON snickers.id = productid
WHERE firm = ANY(CAST($1 AS text []))
    OR line = $2
LIMIT $3 OFFSET $4;
-- name: GetSnickersByName :many
SELECT snickers.minPrice,
    snickers.id,
    image_path,
    name,
    firm,
    maxdiscprice
FROM snickers
    LEFT JOIN discount ON snickers.id = productid
WHERE name ILIKE '%' || $1::text || '%'
LIMIT $2;
-- name: GetSnickersByIds :many
SELECT snickers.minPrice,
    snickers.id,
    image_path,
    name,
    firm,
    maxdiscprice
FROM snickers
    LEFT JOIN discount ON snickers.id = productid
WHERE snickers.id = ANY($1);