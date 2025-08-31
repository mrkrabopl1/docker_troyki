-- name: GetMerchFirms :many
SELECT 
    firm,
    array_agg(DISTINCT line) AS collections
FROM (
    SELECT firm, line FROM snickers WHERE line IS NOT NULL
    UNION ALL
    SELECT firm, line FROM soloMerch WHERE line IS NOT NULL
    UNION ALL
    SELECT firm, line FROM clothes WHERE line IS NOT NULL
) AS combined_products
GROUP BY firm
ORDER BY firm;
-- name: GetMerchProductsByFirmName :many
(
    -- Товары из таблицы snickers
    SELECT 
        s.name,
        s.image_path,
        s.id,
        COALESCE(d.minprice, s.minprice) AS value,  -- Используем minprice как value
        s.article,
        s.type
    FROM snickers s
    LEFT JOIN discount d ON s.id = d.productid  -- Связь по snickers_id
    WHERE s.firm = $1
)
UNION ALL
(
    -- Товары из таблицы soloMerch
    SELECT 
        sm.name,
        sm.image_path,
        sm.id,
        COALESCE(d.minprice, sm.minprice) AS value,  -- Используем price как value
        sm.article,
        sm.type
    FROM solomerch sm
    LEFT JOIN discount d ON sm.id = d.productid  -- Связь по solo_merch_id
    WHERE sm.firm = $1
)
UNION ALL
(
    -- Товары из таблицы soloMerch
    SELECT 
        cl.name,
        cl.image_path,
        cl.id,
        COALESCE(d.minprice, cl.minprice) AS value,  -- Используем price как value
        cl.article,
        cl.type
    FROM clothes cl
    LEFT JOIN discount d ON cl.id = d.productid  -- Связь по solo_merch_id
    WHERE cl.firm = $1
)
ORDER BY name;  --


-- name: InsertDiscounts :one
INSERT INTO public.discount (
    productid,
    value,
    minprice,
    maxdiscprice
)
SELECT 
    unnest(@product_ids::int[]),
    unnest(@discount_values::json[]),
    NULLIF(unnest(@min_prices::int[]), 0),
    NULLIF(unnest(@max_disc_prices::int[]), 0)
RETURNING id;



-- name: SelectMainCategories :one
SELECT enum_range(NULL::main_categories);

-- name: GetMerchByLineName :many
SELECT name,
    image_path,
    soloMerch.id,
    value,
    article,
    type
FROM soloMerch
    LEFT JOIN discount ON soloMerch.id = productid 
WHERE firm = $1;
WITH 
firm_counts_snickers AS (
    SELECT s.firm, COUNT(s.id) AS firm_count
    FROM snickers AS s
    WHERE s.name ILIKE '%' || $1::text || '%'
    GROUP BY s.firm
),
firm_counts_soloMerch AS (
    SELECT sm.firm, COUNT(sm.id) AS firm_count
    FROM soloMerch AS sm
    WHERE sm.name ILIKE '%' || $1::text || '%'
    GROUP BY sm.firm
),
firm_counts_clothes AS (
    SELECT cl.firm, COUNT(cl.id) AS firm_count
    FROM clothes AS cl
    WHERE cl.name ILIKE '%' || $1::text || '%'
    GROUP BY cl.firm
),
combined_firm_counts AS (
    SELECT firm, SUM(firm_count) AS firm_count
    FROM (
        SELECT firm, firm_count FROM firm_counts_snickers
        UNION ALL
        SELECT firm, firm_count FROM firm_counts_soloMerch
        UNION ALL
        SELECT firm, firm_count FROM firm_counts_clothes
    ) AS combined
    GROUP BY firm
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
    LEAST(MIN(s.minprice), MIN(sm.minprice)) AS min,
    GREATEST(MAX(s.maxprice), MAX(sm.minprice)) AS max,
    jsonb_object_agg(COALESCE(cfc.firm, 'Unknown'), cfc.firm_count) AS firm_count_map,
    s.type
FROM snickers AS s
FULL OUTER JOIN soloMerch AS sm ON 1=0  -- Это нужно чтобы объединить результаты обоих таблиц без реального соединения
LEFT JOIN combined_firm_counts cfc ON s.firm = cfc.firm OR sm.firm = cfc.firm
WHERE s.name ILIKE '%' || $1::text || '%' OR sm.name ILIKE '%' || $1::text || '%';
-- name: GetMerchCountIdByName :many
SELECT firm, SUM(count) as count
FROM (

    SELECT firm, COUNT(id) as count
    FROM snickers
    WHERE name ILIKE '%' || $1::text || '%'
    GROUP BY firm
    
    UNION ALL

    SELECT firm, COUNT(id) as count
    FROM solomerch
    WHERE name ILIKE '%' || $1::text || '%'
    GROUP BY firm
) combined_results
GROUP BY firm
ORDER BY count DESC;


-- name: GetMerchCollection :many
SELECT * FROM (
    SELECT 
        COALESCE(d.minprice, s.minprice) AS minprice,
        p.global_id,
        s.image_path,
        s.name,
        s.firm,
        d.maxdiscprice,
        s.type,
        COUNT(*) OVER() AS total_count
    FROM snickers s
    JOIN product_registry p ON s.id = p.internal_id AND p.source_table = 'snickers'
    LEFT JOIN discount d ON s.id = d.productId 
    WHERE s.firm = $1 OR s.line = $2

    UNION ALL

    SELECT 
        COALESCE(d.minprice, sm.minprice) AS minprice,
        p.global_id,
        sm.image_path,
        sm.name,
        sm.firm,
        d.maxdiscprice,
        sm.type,
        COUNT(*) OVER() AS total_count
    FROM solomerch sm
    JOIN product_registry p ON sm.id = p.internal_id AND p.source_table = 'solomerch'
    LEFT JOIN discount d ON sm.id = d.productId
    WHERE sm.firm = $1 OR sm.line = $2

    UNION ALL

    SELECT 
        COALESCE(d.minprice, cl.minprice) AS minprice,
        p.global_id,
        cl.image_path,
        cl.name,
        cl.firm,
        d.maxdiscprice,
        cl.type ,
        COUNT(*) OVER() AS total_count
    FROM clothes cl
    JOIN product_registry p ON cl.id = p.internal_id AND p.source_table = 'clothes'
    LEFT JOIN discount d ON cl.id = d.productId
    WHERE cl.firm = $1 OR cl.line = $2
) AS combined_results
ORDER BY 
    CASE WHEN COALESCE(minprice, 0) > 0 THEN 0 ELSE 1 END
LIMIT $3 OFFSET $4;

-- name: GetProductsByName :many
SELECT 
    s.minprice,
    p.global_id,
    s.image_path,
    s.name,
    s.firm,
    d.maxdiscprice,
    s.type
FROM snickers s
JOIN product_registry p ON s.id = p.internal_id AND p.source_table = 'snickers'
LEFT JOIN discount d ON s.id = d.productId 
WHERE s.name ILIKE '%' || $1::text || '%'
UNION ALL
SELECT 
    sm.minprice,
    p.global_id,
    sm.image_path,
    sm.name,
    sm.firm,
    d.maxdiscprice,
    sm.type
FROM solomerch sm
   JOIN product_registry p ON sm.id = p.internal_id AND p.source_table = 'solomerch'
LEFT JOIN discount d ON sm.id = d.productId 
WHERE sm.name ILIKE '%' || $1::text || '%'
UNION ALL
SELECT 
    cl.minprice,
    p.global_id,
    cl.image_path,
    cl.name,
    cl.firm,
    d.maxdiscprice,
    cl.type
FROM clothes cl
   JOIN product_registry p ON cl.id = p.internal_id AND p.source_table = 'clothes'
LEFT JOIN discount d ON cl.id = d.productId 
WHERE cl.name ILIKE '%' || $1::text || '%'
ORDER BY minprice ASC
LIMIT $2;
-- name: GetProductsByIds :many
SELECT 
    s.minprice,
    pr.global_id,  -- Используем global_id вместо s.id
    s.image_path,
    s.name,
    s.firm,
    d.maxdiscprice,
    s.type
FROM snickers s
JOIN product_registry pr ON pr.internal_id = s.id AND pr.source_table = 'snickers'
LEFT JOIN discount d ON s.id = d.productId 
WHERE pr.global_id = ANY($1::integer[])

UNION ALL

SELECT 
    sm.minprice,
    pr.global_id,  -- Используем global_id вместо sm.id
    sm.image_path,
    sm.name,
    sm.firm,
    d.maxdiscprice,
    sm.type
FROM solomerch sm
JOIN product_registry pr ON pr.internal_id = sm.id AND pr.source_table = 'solomerch'
LEFT JOIN discount d ON sm.id = d.productId 
WHERE pr.global_id = ANY($1::integer[])

UNION ALL

SELECT 
    cl.minprice,
    pr.global_id,  -- Используем global_id вместо cl.id
    cl.image_path,
    cl.name,
    cl.firm,
    d.maxdiscprice,
    cl.type
FROM clothes cl
JOIN product_registry pr ON pr.internal_id = cl.id AND pr.source_table = 'clothes'
LEFT JOIN discount d ON cl.id = d.productId 
WHERE pr.global_id = ANY($1::integer[])
ORDER BY minprice ASC;
-- name: GetMerchWithDiscount :many
SELECT 
    s.minprice,
    s.qId,
    s.id,
    s.image_path,
    s.name,
    s.firm,
    d.maxdiscprice,
    s.type
FROM snickers s
LEFT JOIN discount d ON s.id = d.productId  -- LEFT JOIN вместо JOIN

UNION ALL

-- Данные из таблицы solomerch
SELECT 
    sm.minprice,
    sm.qId,
    sm.id,
    sm.image_path,
    sm.name,
    sm.firm,
    d.maxdiscprice,
    sm.type
FROM solomerch sm
LEFT JOIN discount d ON sm.id = d.productId  -- LEFT JOIN вместо JOIN

UNION ALL

-- Данные из таблицы clothes
SELECT 
    cl.minprice,
    cl.qId,
    cl.id,
    cl.image_path,
    cl.name,
    cl.firm,
    d.maxdiscprice,
    cl.type
FROM clothes cl
LEFT JOIN discount d ON cl.id = d.productId
ORDER BY minprice ASC;

-- name: GetMerchCountOfCollectionsOrFirms :one
SELECT 
    (SELECT COUNT(id) FROM snickers WHERE snickers.firm = $1 OR snickers.line = $2) +
     (SELECT COUNT(id) FROM clothes WHERE clothes.firm = $1 OR clothes.line = $2) +
    (SELECT COUNT(id) FROM soloMerch WHERE soloMerch.firm = $1 OR soloMerch.line = $2) AS total_count;
    
-- name: GetMerchCollectionWithCount :many
WITH combined_products AS (
    -- Data from snickers
    SELECT 
        COALESCE(d.minprice, s.minprice) AS minprice,
        s.id,
        s.image_path,
        s.name,
        s.firm,
        d.maxdiscprice,
        COUNT(*) OVER () AS total_count,
        s.type
    FROM snickers s
    LEFT JOIN discount d ON s.id = d.productId
    WHERE s.firm = $1 OR s.line = $2
    
    UNION ALL
    
    -- Data from solomerch
    SELECT 
        COALESCE(d.minprice, sm.minprice) AS minprice,
        sm.id,
        sm.image_path,
        sm.name,
        sm.firm,
        d.maxdiscprice,
        NULL::bigint AS total_count,
        sm.type
    FROM solomerch sm
    LEFT JOIN discount d ON sm.id = d.productId
    WHERE sm.firm = $1 OR sm.line = $2
      UNION ALL
    
    -- Data from solomerch
    SELECT 
        COALESCE(d.minprice, sm.minprice) AS minprice,
        cl.id,
        cl.image_path,
        cl.name,
        cl.firm,
        d.maxdiscprice,
        NULL::bigint AS total_count,
        cl.type 
    FROM clothes cl
    LEFT JOIN discount d ON cl.id = d.productId
    WHERE cl.firm = $1 OR cl.line = $2
)
SELECT 
    minprice,
    id,
    image_path,
    name,
    firm,
    maxdiscprice,
    type,
    FIRST_VALUE(total_count) OVER () AS total_count
FROM combined_products
ORDER BY name
LIMIT $3 OFFSET $4;

-- name: GetClothesInfoById :one
SELECT
    info,
    image_path,
    name,
    article,
    clothes.minprice,
    description,
    date,
    image_count,
    discount.value AS discount_value
FROM clothes
    LEFT JOIN discount ON clothes.id = productid
WHERE clothes.id = $1;

-- name: GetSoloMerchInfoById :one
SELECT
    image_path,
    name,
    article,
    solomerch.minprice,
    description,
    date,
    image_count,
    discount.value AS discount_value
FROM solomerch
    LEFT JOIN discount ON solomerch.id = productid
WHERE solomerch.id = $1;

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
-- name: GetProductSource :one
SELECT source_table, internal_id 
FROM product_registry 
WHERE global_id = $1;
-- name: GetSnickersByLineName :many
SELECT line,
    array_agg(id) AS id,
    array_agg(image_path) AS image_path,
    array_agg(name) AS name_data
FROM snickers
WHERE line = $1
GROUP BY line;
-- name: GetCombinedFiltersByString :one
WITH combined_products AS (
    -- Data from snickers (only shoe sizes)
    SELECT 
        s.minprice AS minprice,
        s.maxprice AS maxprice,
        s.firm,
        s."3.5", s."4", s."4.5", s."5", s."5.5", 
        s."6", s."6.5", s."7", s."7.5", s."8", 
        s."8.5", s."9", s."9.5", s."10", s."10.5", 
        s."11", s."11.5", s."12", s."12.5", s."13",
        NULL AS "XS", -- These will always be NULL for snickers
        NULL AS "S",
        NULL AS "M",
        NULL AS "L",
        NULL AS "XL",
        NULL AS "XXL"
    FROM snickers s
    WHERE s.name ILIKE '%' || $1::text || '%'
    
    UNION ALL
    
    -- Data from solomerch (no size columns)
    SELECT 
        sm.minprice AS minprice,
        sm.minprice AS maxprice,
        sm.firm,
        NULL, NULL, NULL, NULL, NULL, 
        NULL, NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL, NULL, NULL
    FROM solomerch sm
    WHERE sm.name ILIKE '%' || $1::text || '%'
    
    UNION ALL
    
    -- Data from clothes (only clothing sizes)
    SELECT 
        cl.minprice AS minprice,
        cl.maxprice AS maxprice,
        cl.firm,
        NULL, NULL, NULL, NULL, NULL, 
        NULL, NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL, NULL,
        cl."XS",
        cl."S",
        cl."M",
        cl."L",
        cl."XL",
        cl."XXL"
    FROM clothes cl
    WHERE cl.name ILIKE '%' || $1::text || '%'
),
firm_counts AS (
    SELECT firm, COUNT(*) AS firm_count
    FROM combined_products
    GROUP BY firm
)
SELECT
    -- Shoe sizes (only from snickers)
    COUNT(NULLIF(cp."3.5", 0)) AS "3.5",
    COUNT(NULLIF(cp."4", 0)) AS "4",
    COUNT(NULLIF(cp."4.5", 0)) AS "4.5",
    COUNT(NULLIF(cp."5", 0)) AS "5",
    COUNT(NULLIF(cp."5.5", 0)) AS "5.5",
    COUNT(NULLIF(cp."6", 0)) AS "6",
    COUNT(NULLIF(cp."6.5", 0)) AS "6.5",
    COUNT(NULLIF(cp."7", 0)) AS "7",
    COUNT(NULLIF(cp."7.5", 0)) AS "7.5",
    COUNT(NULLIF(cp."8", 0)) AS "8",
    COUNT(NULLIF(cp."8.5", 0)) AS "8.5",
    COUNT(NULLIF(cp."9", 0)) AS "9",
    COUNT(NULLIF(cp."9.5", 0)) AS "9.5",
    COUNT(NULLIF(cp."10", 0)) AS "10",
    COUNT(NULLIF(cp."10.5", 0)) AS "10.5",
    COUNT(NULLIF(cp."11", 0)) AS "11",
    COUNT(NULLIF(cp."11.5", 0)) AS "11.5",
    COUNT(NULLIF(cp."12", 0)) AS "12",
    COUNT(NULLIF(cp."12.5", 0)) AS "12.5",
    COUNT(NULLIF(cp."13", 0)) AS "13",
    
    -- Clothing sizes (only from clothes)
    COUNT(NULLIF(cp."XS", 0)) AS "XS",
    COUNT(NULLIF(cp."S", 0)) AS "S",
    COUNT(NULLIF(cp."M", 0)) AS "M",
    COUNT(NULLIF(cp."L", 0)) AS "L",
    COUNT(NULLIF(cp."XL", 0)) AS "XL",
    COUNT(NULLIF(cp."XXL", 0)) AS "XXL",
    
    -- Price ranges
    MIN(cp.minprice) AS min_price,
    MAX(cp.maxprice) AS max_price,
    
    -- Firm counts
    jsonb_object_agg(COALESCE(fc.firm, 'Unknown'), fc.firm_count) FILTER (WHERE fc.firm IS NOT NULL) AS firm_count_map
FROM combined_products cp
LEFT JOIN firm_counts fc ON cp.firm = fc.firm
GROUP BY 1;
-- name: GetMerchFiltersByString :one
WITH combined_products AS (
    -- Данные из snickers
  
    
    -- Данные из solomerch
    SELECT 
        sm.minprice AS minprice,
        sm.minprice AS maxprice, -- Для solomerch используем price для обоих значений
        sm.firm,
        NULL, NULL, NULL, NULL, NULL, 
        NULL, NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL, NULL
    FROM solomerch sm
    WHERE sm.name ILIKE '%' || $1::text || '%'
),
firm_counts AS (
    SELECT firm, COUNT(*) AS firm_count
    FROM combined_products
    GROUP BY firm
)
SELECT

    MIN(cp.minprice) AS min_price,
    MAX(cp.maxprice) AS max_price,
    jsonb_object_agg(COALESCE(fc.firm, 'Unknown'), fc.firm_count) AS firm_count_map
FROM combined_products cp
LEFT JOIN firm_counts fc ON cp.firm = fc.firm;
-- name: GetFiltersByString :one
WITH combined_products AS (
    -- Данные из snickers
    SELECT 
        pr.global_id,
        s.firm,
        s.minprice,
        s.maxprice,
        s."3.5", s."4", s."4.5", s."5", s."5.5", 
        s."6", s."6.5", s."7", s."7.5", s."8", 
        s."8.5", s."9", s."9.5", s."10", s."10.5", 
        s."11", s."11.5", s."12", s."12.5", s."13",
        NULL::integer AS "XS",
        NULL::integer AS "S",
        NULL::integer AS "M",
        NULL::integer AS "L",
        NULL::integer AS "XL",
        NULL::integer AS "XXL",
        s.type 
    FROM snickers s
    JOIN product_registry pr ON pr.internal_id = s.id AND pr.source_table = 'snickers'
    WHERE s.name ILIKE '%' || $1::text || '%'
    
    UNION ALL
    
    -- Данные из solomerch
    SELECT 
        pr.global_id,
        sm.firm,
        sm.minprice,
        sm.minprice,
        NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer, 
        NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        sm.type
    FROM solomerch sm
    JOIN product_registry pr ON pr.internal_id = sm.id AND pr.source_table = 'solomerch'
    WHERE sm.name ILIKE '%' || $1::text || '%'
    
    UNION ALL
    
    -- Данные из clothes
    SELECT 
        pr.global_id,
        cl.firm,
        cl.minprice,
        cl.maxprice,
        NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer, 
        NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        cl.XS,
        cl.S,
        cl.M,
        cl.L,
        cl.XL,
        cl.XXL,
        cl.type
    FROM clothes cl
     JOIN product_registry pr ON pr.internal_id = cl.id AND pr.source_table = 'clothes'
    WHERE cl.name ILIKE '%' || $1::text || '%'
),
firm_counts AS (
    SELECT firm, COUNT(global_id) AS firm_count
    FROM combined_products
    GROUP BY firm
)
SELECT
    COUNT(NULLIF(cp."3.5", 0)) AS "3.5",
    COUNT(NULLIF(cp."4", 0)) AS "4",
    COUNT(NULLIF(cp."4.5", 0)) AS "4.5",
    COUNT(NULLIF(cp."5", 0)) AS "5",
    COUNT(NULLIF(cp."5.5", 0)) AS "5.5",
    COUNT(NULLIF(cp."6", 0)) AS "6",
    COUNT(NULLIF(cp."6.5", 0)) AS "6.5",
    COUNT(NULLIF(cp."7", 0)) AS "7",
    COUNT(NULLIF(cp."7.5", 0)) AS "7.5",
    COUNT(NULLIF(cp."8", 0)) AS "8",
    COUNT(NULLIF(cp."8.5", 0)) AS "8.5",
    COUNT(NULLIF(cp."9", 0)) AS "9",
    COUNT(NULLIF(cp."9.5", 0)) AS "9.5",
    COUNT(NULLIF(cp."10", 0)) AS "10",
    COUNT(NULLIF(cp."10.5", 0)) AS "10.5",
    COUNT(NULLIF(cp."11", 0)) AS "11",
    COUNT(NULLIF(cp."11.5", 0)) AS "11.5",
    COUNT(NULLIF(cp."12", 0)) AS "12",
    COUNT(NULLIF(cp."12.5", 0)) AS "12.5",
    COUNT(NULLIF(cp."13", 0)) AS "13",
    COUNT(NULLIF(cp."XS", 0)) AS "XS",
    COUNT(NULLIF(cp."S", 0)) AS "S",
    COUNT(NULLIF(cp."M", 0)) AS "M",
    COUNT(NULLIF(cp."L", 0)) AS "L",
    COUNT(NULLIF(cp."XL", 0)) AS "XL",
    COUNT(NULLIF(cp."XXL", 0)) AS "XXL",
    MIN(cp.minprice) AS min,
    MAX(cp.maxprice) AS max,
    jsonb_object_agg(COALESCE(fc.firm, 'Unknown'), fc.firm_count) AS firm_count_map
FROM combined_products cp
LEFT JOIN firm_counts fc ON cp.firm = fc.firm
GROUP BY ();  
-- name: GetCountIdByName :many
SELECT firm,
    COUNT(id) count
FROM snickers
WHERE name ILIKE '%' || CAST($1 AS text) || '%'
GROUP BY $1;
-- name: GetProductsInfoById :one
SELECT info,
    image_path,
    name,
    discount.value AS value,
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
    maxdiscprice,
    type
FROM snickers
    LEFT JOIN discount ON snickers.id = productid
WHERE name ILIKE '%' || $1::text || '%'
LIMIT $2;
-- name: GetSnickersByIds :many
SELECT 
    COALESCE(d.minprice, s.minprice) AS price,
    s.id,
    s.image_path, 
    s.name, 
    s.firm, 
    d.maxdiscprice
FROM snickers s
LEFT JOIN discount d ON s.id = d.productid 
WHERE s.id = ANY($1::int[]);





-- name: GetProductsWithDiscount :many
SELECT 
    snickers.type,
    snickers.minPrice,
    snickers.id,
    snickers.image_path,
    snickers.name,
    snickers.firm,
    discount.maxdiscprice,
    discount.value AS discount_value
FROM snickers
JOIN discount ON snickers.id = discount.productid

UNION ALL

SELECT 
    clothes.type,
    clothes.minPrice,
    clothes.id,
    clothes.image_path,
    clothes.name,
    clothes.firm,  -- если в clothes нет firm
    discount.maxdiscprice,  -- если в clothes нет maxdiscprice
    discount.value AS discount_value
FROM clothes
JOIN discount ON clothes.id = discount.productid

UNION ALL

SELECT 
    solomerch.DeliveryType,
    solomerch.minPrice,
    solomerch.id,
    solomerch.image_path,
    solomerch.name,
    solomerch.firm,
    discount.maxdiscprice,
    discount.value AS discount_value
FROM solomerch
JOIN discount ON solomerch.id = discount.productid;

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

-- name: GetFullProductsInfoByIds :many
SELECT 
    s.minprice,
    s.maxprice,
    pr.global_id,
    s.image_path,
    s.name,
    s.firm,
    d.maxdiscprice,
    s.type,
    s."3.5", s."4", s."4.5", s."5", s."5.5", 
    s."6", s."6.5", s."7", s."7.5", s."8", 
    s."8.5", s."9", s."9.5", s."10", s."10.5", 
    s."11", s."11.5", s."12", s."12.5", s."13",
    NULL::integer AS "XS",
    NULL::integer AS "S",
    NULL::integer AS "M",
    NULL::integer AS "L",
    NULL::integer AS "XL",
    NULL::integer AS "XXL"
FROM snickers s
JOIN product_registry pr ON pr.internal_id = s.id AND pr.source_table = 'snickers'
LEFT JOIN discount d ON s.id = d.productid
WHERE pr.global_id = ANY($1::integer[])

UNION ALL

SELECT 
    sm.minprice,
    sm.minprice AS maxprice,
    pr.global_id,
    sm.image_path,
    sm.name,
    sm.firm,
    d.maxdiscprice,
    sm.type,
    NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer, 
    NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
    NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
    NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
    NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer
FROM solomerch sm
JOIN product_registry pr ON pr.internal_id = sm.id AND pr.source_table = 'solomerch'
LEFT JOIN discount d ON sm.id = d.productid
WHERE pr.global_id = ANY($1::integer[])

UNION ALL

SELECT 
    cl.minprice,
    cl.maxprice,
    pr.global_id,
    cl.image_path,
    cl.name,
    cl.firm,
    d.maxdiscprice,
    cl.type,
    NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer, 
    NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
    NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
    NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
    cl.xs::integer AS "XS",
    cl.s::integer AS "S",
    cl.m::integer AS "M",
    cl.l::integer AS "L",
    cl.xl::integer AS "XL",
    cl.xxl::integer AS "XXL"
FROM clothes cl
JOIN product_registry pr ON pr.internal_id = cl.id AND pr.source_table = 'clothes'
LEFT JOIN discount d ON cl.id = d.productid
WHERE pr.global_id = ANY($1::integer[])
ORDER BY minprice ASC;



-- name: GetFiltersFromSnickers :one
WITH combined_products AS (
    -- Данные из snickers
    SELECT 
        pr.global_id,
        s.firm,
        s.minprice,
        s.maxprice,
        s."3.5", s."4", s."4.5", s."5", s."5.5", 
        s."6", s."6.5", s."7", s."7.5", s."8", 
        s."8.5", s."9", s."9.5", s."10", s."10.5", 
        s."11", s."11.5", s."12", s."12.5", s."13",
        s.type
    FROM snickers s
    JOIN product_registry pr ON pr.internal_id = s.id AND pr.source_table = 'snickers'
     WHERE 
        s.name ILIKE '%' || @name::text || '%' 
        AND (@min_price::numeric IS NULL OR s.minprice >= @min_price)  -- Фильтр по мин. цене
        AND (@max_price::numeric IS NULL OR s.maxprice <= @max_price)   -- Фильтр по макс. цене

),
firm_counts AS (
    SELECT firm, COUNT(global_id) AS firm_count
    FROM combined_products
    GROUP BY firm
)
SELECT
    COUNT(NULLIF(cp."3.5", 0)) AS "3.5",
    COUNT(NULLIF(cp."4", 0)) AS "4",
    COUNT(NULLIF(cp."4.5", 0)) AS "4.5",
    COUNT(NULLIF(cp."5", 0)) AS "5",
    COUNT(NULLIF(cp."5.5", 0)) AS "5.5",
    COUNT(NULLIF(cp."6", 0)) AS "6",
    COUNT(NULLIF(cp."6.5", 0)) AS "6.5",
    COUNT(NULLIF(cp."7", 0)) AS "7",
    COUNT(NULLIF(cp."7.5", 0)) AS "7.5",
    COUNT(NULLIF(cp."8", 0)) AS "8",
    COUNT(NULLIF(cp."8.5", 0)) AS "8.5",
    COUNT(NULLIF(cp."9", 0)) AS "9",
    COUNT(NULLIF(cp."9.5", 0)) AS "9.5",
    COUNT(NULLIF(cp."10", 0)) AS "10",
    COUNT(NULLIF(cp."10.5", 0)) AS "10.5",
    COUNT(NULLIF(cp."11", 0)) AS "11",
    COUNT(NULLIF(cp."11.5", 0)) AS "11.5",
    COUNT(NULLIF(cp."12", 0)) AS "12",
    COUNT(NULLIF(cp."12.5", 0)) AS "12.5",
    COUNT(NULLIF(cp."13", 0)) AS "13",
    MIN(cp.minprice)::float AS min,
    MAX(cp.maxprice)::float AS max,
    jsonb_object_agg(COALESCE(fc.firm, 'Unknown'), fc.firm_count) AS firm_count_map
FROM combined_products cp
LEFT JOIN firm_counts fc ON cp.firm = fc.firm
GROUP BY ();  


-- name: GetFiltersFromClothes :one
WITH combined_products AS (
    SELECT 
        pr.global_id,
        cl.firm,
        cl.minprice,
        cl.maxprice,
        NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer, 
        NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        NULL::integer, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
    cl.xs::integer AS "XS",
    cl.s::integer AS "S",
    cl.m::integer AS "M",
    cl.l::integer AS "L",
    cl.xl::integer AS "XL",
    cl.xxl::integer AS "XXL",
        cl.type
    FROM clothes cl
     JOIN product_registry pr ON pr.internal_id = cl.id AND pr.source_table = 'clothes'
    WHERE cl.name ILIKE '%' || @name::text || '%'
        AND (@min_price::numeric IS NULL OR cl.minprice >= @min_price)  -- Фильтр по мин. цене
        AND (@max_price::numeric IS NULL OR cl.maxprice <= @max_price)      -- Фильтр по макс. цене
),
firm_counts AS (
    SELECT firm, COUNT(global_id) AS firm_count
    FROM combined_products
    GROUP BY firm
)
SELECT
       COUNT(NULLIF(cp."XS", 0)) AS "XS",
    COUNT(NULLIF(cp."S", 0)) AS "S",
    COUNT(NULLIF(cp."M", 0)) AS "M",
    COUNT(NULLIF(cp."L", 0)) AS "L",
    COUNT(NULLIF(cp."XL", 0)) AS "XL",
    COUNT(NULLIF(cp."XXL", 0)) AS "XXL",
    MIN(cp.minprice)::float AS min,
    MAX(cp.maxprice)::float AS max,
    jsonb_object_agg(COALESCE(fc.firm, 'Unknown'), fc.firm_count) AS firm_count_map
FROM combined_products cp
LEFT JOIN firm_counts fc ON cp.firm = fc.firm
GROUP BY (); 

-- name: GetFiltersFromMerchByType :one
WITH combined_products AS (
    SELECT 
        pr.global_id,
        sm.firm,
        sm.minprice,
        sm.minprice AS maxprice,  -- Исправлено: дублирование minprice
        sm.type
    FROM solomerch sm
    JOIN product_registry pr ON pr.internal_id = sm.id AND pr.source_table = 'solomerch'
    WHERE sm.name ILIKE '%' || @name::text || '%'
      AND (@min_price::numeric IS NULL OR sm.minprice >= @min_price)  -- Исправлено: s → sm
),
firm_counts AS (
    SELECT firm, COUNT(global_id) AS firm_count
    FROM combined_products
    GROUP BY firm
)
SELECT
    MIN(cp.minprice)::float AS min,
    MAX(cp.maxprice)::float AS max,
    jsonb_object_agg(COALESCE(fc.firm, 'Unknown'), fc.firm_count) AS firm_count_map
FROM combined_products cp
LEFT JOIN firm_counts fc ON cp.firm = fc.firm;

-- name: GetCategoryByTypeId :one
SELECT 
    pt.category AS product_category,
    pt.type_name AS type_name,
    pt.enum_value AS type_enum
FROM 
    product_types pt
WHERE 
    pt.id = @type_id;

-- name: GetTypeIDByCategoryAndName :one
SELECT id 
FROM product_types
WHERE category = @category::product_source_enum 
AND enum_value = @type_name;
-- name: ClearDiscounts :exec
DELETE FROM discount;