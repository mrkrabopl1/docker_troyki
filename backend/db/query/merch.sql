-- name: GetFirms :many
SELECT firm,
    array_agg(DISTINCT line) AS array_of_data
FROM "snickers"
GROUP BY firm;
-- name: GetSnickersByFirmName :many
SELECT name,
    image_path,
    snickers.id,
    value,
    article
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
-- name: GetFiltersByString :one
WITH firm_counts AS (
    SELECT s.firm, COUNT(s.id) AS firm_count
    FROM snickers AS s
    WHERE s.name ILIKE '%' || $1::text || '%'
    GROUP BY s.firm
)
SELECT
    COUNT(s."3.5") AS "3.5",
    COUNT(s."4") AS "4",
    COUNT(s."4.5") AS "4.5",
    COUNT(s."5") AS "5",
    COUNT(s."5.5") AS "5.5",
    COUNT(s."6") AS "6",
    COUNT(s."6.5") AS "6.5",
    COUNT(s."7") AS "7",
    COUNT(s."7.5") AS "7.5",
    COUNT(s."8") AS "8",
    COUNT(s."8.5") AS "8.5",
    COUNT(s."9") AS "9",
    COUNT(s."9.5") AS "9.5",
    COUNT(s."10") AS "10",
    COUNT(s."10.5") AS "10.5",
    COUNT(s."11") AS "11",
    COUNT(s."11.5") AS "11.5",
    COUNT(s."12") AS "12",
    COUNT(s."12.5") AS "12.5",
    COUNT(s."13") AS "13",
    MIN(s.minprice) AS min,
    MAX(s.maxprice) AS max,
    jsonb_object_agg(COALESCE(fc.firm, 'Unknown'), fc.firm_count) AS firm_count_map
FROM snickers AS s
LEFT JOIN firm_counts fc ON s.firm = fc.firm
WHERE s.name ILIKE '%' || $1::text || '%';
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
    value,
    article,
    description,
    date,
    image_count
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
WHERE snickers.id = ANY($1::int32[]);
-- name: GetSnickersWithDiscount :many
SELECT snickers.minPrice,
    snickers.qId,
    snickers.id,
    image_path,
    name,
    firm,
    maxdiscprice
FROM snickers
    JOIN discount ON snickers.id = productid;

-- name: GetCountOfCollectionsOrFirms :one
SELECT COUNT(snickers.id) AS count 
FROM snickers
WHERE firm = $1
    OR line = $2;
    
-- name: GetSoloCollectionWithCount :many    
SELECT COALESCE(discount.minprice, snickers.minprice) AS minprice,
    snickers.id,
    image_path,
    name,
    firm,
    maxdiscprice,
    COUNT(*) OVER () AS total_count
FROM snickers
    LEFT JOIN discount ON snickers.id = productid
WHERE firm = $1
    OR line = $2
LIMIT $3 OFFSET $4;