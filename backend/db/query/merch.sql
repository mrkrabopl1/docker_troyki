-- name: GetMerchFirms :many
SELECT 
    firm,
    array_agg(DISTINCT line) AS collections
FROM (
    SELECT firm, line FROM products WHERE line IS NOT NULL
) AS combined_products
GROUP BY firm
ORDER BY firm;
-- name: GetMerchProductsByFirmName :many
SELECT 
    p.name,
    p.image_path,
    p.id,
    COALESCE(d.minprice, p.minprice) AS value,
    p.article,
    p.type
FROM products p
LEFT JOIN discount d ON p.id = d.productid
WHERE p.firm = $1
ORDER BY p.name;

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




-- name: GetMerchCollection :many
SELECT 
    COALESCE(d.minprice, p.minprice) AS minprice,
    p.id AS global_id,
    p.image_path,
    p.name,
    p.firm,
    d.maxdiscprice,
    st.productid,
    p.type,
    COUNT(*) OVER() AS total_count
FROM products p
LEFT JOIN discount d ON p.id = d.productid
LEFT JOIN store_house st ON p.id = st.productid
WHERE p.firm = $1 OR p.line = $2
ORDER BY 
    CASE WHEN COALESCE(COALESCE(d.minprice, p.minprice), 0) > 0 THEN 0 ELSE 1 END
LIMIT $3 OFFSET $4;

-- name: GetProductsByName :many
SELECT 
    p.id as global_id,
    p.image_path,
    p.name,
    p.firm,
    p.minprice,
    p.maxprice,
    d.maxdiscprice,
    p.type,
    p.article,
    p.type,
    p.category
FROM products p
LEFT JOIN discount d ON p.id = d.productid 
WHERE p.name ILIKE '%' || $1::text || '%'
ORDER BY 
    CASE WHEN COALESCE(p.minprice, 0) > 0 THEN 0 ELSE 1 END,
    p.name
LIMIT $2;
-- name: GetProductsByIds :many
SELECT 
    p.minprice,
    p.id as global_id,  -- Теперь id products это global_id
    p.image_path,
    p.name,
    p.firm,
    d.maxdiscprice,
    p.type,
    p.article
FROM products p
LEFT JOIN discount d ON p.id = d.productid 
WHERE p.id = ANY($1::integer[])
ORDER BY p.minprice ASC;
-- name: GetMerchWithDiscount :many
SELECT 
    p.minprice,
    p.qId,
    p.id,
    p.image_path,
    p.name,
    p.firm,
    d.maxdiscprice,
    p.type
FROM products p
LEFT JOIN discount d ON p.id = d.productid
ORDER BY p.minprice ASC;

-- name: GetMerchCountOfCollectionsOrFirms :one
SELECT COUNT(*) AS total_count
FROM products
WHERE firm = $1 OR line = $2;
-- name: GetMerchCollectionWithCount :many
SELECT 
    COALESCE(d.minprice, p.minprice) AS minprice,
    p.id,
    p.image_path,
    p.name,
    p.firm,
    d.maxdiscprice,
    p.type,
    COUNT(*) OVER () AS total_count
FROM products p
LEFT JOIN discount d ON p.id = d.productid
WHERE p.firm = $1 OR p.line = $2
ORDER BY p.name
LIMIT $3 OFFSET $4;


-- name: GetFirms :many
SELECT 
    firm,
    array_agg(DISTINCT line) AS array_of_data
FROM products
GROUP BY firm
ORDER BY firm;
-- name: GetSnickersByFirmName :many
SELECT name,
    image_path,
    products.id,
    value,
    article
FROM    products
    LEFT JOIN discount ON products.id = productid
WHERE firm = $1;

-- name: GetProductsByLineName :many
SELECT line,
    array_agg(id) AS id,
    array_agg(image_path) AS image_path,
    array_agg(name) AS name_data
FROM products
WHERE line = $1
GROUP BY line;
-- name: GetCombinedFiltersByString :one
WITH product_data AS (
    SELECT 
        p.minprice,
        p.maxprice,
        p.firm,
        p.sizes
    FROM products p
    WHERE p.name ILIKE '%' || $1::text || '%'
),
firm_counts AS (
    SELECT firm, COUNT(*) AS firm_count
    FROM product_data
    GROUP BY firm
),
size_counts AS (
    SELECT 
        size_key,
        COUNT(*) as size_count
    FROM product_data pd
    CROSS JOIN LATERAL jsonb_object_keys(pd.sizes) as size_key
    WHERE (pd.sizes -> size_key -> 'price')::numeric > 0
    GROUP BY size_key
)
SELECT
    -- Все размеры в виде JSON объекта с количеством
    jsonb_object_agg(size_key, size_count) as sizes,
    
    -- Диапазон цен
    MIN(minprice) AS min_price,
    MAX(maxprice) AS max_price,
    
    -- Количество товаров по брендам
    jsonb_object_agg(COALESCE(fc.firm, 'Unknown'), fc.firm_count) AS firm_count_map
FROM product_data pd
CROSS JOIN size_counts sc
LEFT JOIN firm_counts fc ON pd.firm = fc.firm
GROUP BY ();


-- name: GetProductsByNameCategoryAndType :many
 SELECT 
        p.id as global_id,
        p.firm,
        p.minprice,
        p.maxprice,
        p.sizes,
        p.bodytype
    FROM products p
    WHERE 
        (sqlc.narg('type')::int IS NULL OR p.type = sqlc.narg('type')::int) AND
         (sqlc.narg('category')::int IS NULL OR p.category = sqlc.narg('category')) AND
        (sqlc.narg('name')::text IS NULL OR p.name ILIKE '%' || sqlc.narg('name')::text || '%');


-- name: GetFiltersByNameCategoryAndType :one
WITH product_data AS (
    SELECT 
        p.id as global_id,
        p.firm,
        p.minprice,
        p.maxprice,
        p.sizes,
        p.bodytype,
        p.type as product_type_id
    FROM products p
    WHERE 
        (sqlc.narg('type')::int IS NULL OR p.type = sqlc.narg('type')::int) AND
         (sqlc.narg('category')::int IS NULL OR p.category = sqlc.narg('category')) AND
        (sqlc.narg('name')::text IS NULL OR p.name ILIKE '%' || sqlc.narg('name')::text || '%')
),
size_data AS (
    SELECT 
        size_key,
        COUNT(*) as count
    FROM product_data
    CROSS JOIN LATERAL jsonb_object_keys(sizes) as size_key
    WHERE (sizes -> size_key -> 'price')::numeric > 0
    GROUP BY size_key
),
firm_counts AS (
    SELECT firm, COUNT(*) AS firm_count
    FROM product_data
    GROUP BY firm
),
bodytype_counts AS (
    SELECT 
        bodytype,
        COUNT(*) as count
    FROM product_data
    GROUP BY bodytype
),
price_range AS (
    SELECT 
        COALESCE(MIN(minprice), 0) AS min_price,
        COALESCE(MAX(maxprice), 0) AS max_price
    FROM product_data
),
type_data AS (
    SELECT 
        product_type_id,
        COUNT(*) as type_count
    FROM product_data
    -- Optional: Join to a 'product_types' table to get the type name
    -- INNER JOIN product_types pt ON pt.id = product_data.product_type_id
    GROUP BY product_type_id
)
SELECT
    -- Все размеры в виде JSON объекта
    COALESCE(
        (SELECT jsonb_object_agg(size_key, count) FROM size_data),
        '{}'::jsonb
    ) as sizes,
    
    -- Статистика по типам тела
    COALESCE(
        (SELECT jsonb_object_agg(bodytype::text, count) FROM bodytype_counts),
        '{}'::jsonb
    ) as bodytypes,
    
    -- Минимальная и максимальная цена
    (SELECT min_price FROM price_range) as min_price,
    (SELECT max_price FROM price_range) as max_price,
    
    -- Статистика по брендам
    COALESCE(
        (SELECT jsonb_object_agg(COALESCE(firm, 'Unknown'), firm_count) FROM firm_counts),
        '{}'::jsonb
    ) as firms,
     COALESCE(
        (SELECT jsonb_agg(product_type_id) FROM type_data),
        '[]'::jsonb
    ) as product_types;
-- name: GetCountIdByName :many
SELECT firm,
    COUNT(id) count
FROM products
WHERE name ILIKE '%' || CAST($1 AS text) || '%'
GROUP BY $1;
-- name: GetProductsInfoById :one
SELECT sizes,
    image_path,
    name,
    discount.value AS value,
    COALESCE(
        jsonb_object_agg(st.size, st.quantity) FILTER (WHERE st.size IS NOT NULL),
        '{}'::jsonb
    ) as store_info,
    article,
    description,
    line,
    type,
    date,
    firm,
    image_count
FROM products
    LEFT JOIN discount ON products.id = productid
    LEFT JOIN store_house st ON products.id = st.productid
WHERE products.id = $1
GROUP BY products.id, discount.value;
-- name: GetSoloCollection :many
SELECT COALESCE(discount.minprice, products.minprice) AS minprice,
    products.id,
    image_path,
    name,
    firm,
    maxdiscprice
FROM products
    LEFT JOIN discount ON products.id = productid
WHERE firm = $1
    OR line = $2
LIMIT $3 OFFSET $4;


-- name: GetProductsWithDiscount :many
SELECT 
    p.type,
    p.minprice,
    p.id,
    p.image_path,
    p.name,
    p.firm,
    d.maxdiscprice,          -- из таблицы discount
    d.value AS discount_value -- из таблицы discount
FROM products p
JOIN discount d ON p.id = d.productid;  

-- name: GetCountOfCollectionsOrFirms :one
SELECT COUNT(products.id) AS count 
FROM products
WHERE firm = $1
    OR line = $2;
    
-- name: GetSoloCollectionWithCount :many    
SELECT COALESCE(discount.minprice, products.minprice) AS minprice,
    products.id,
    image_path,
    name,
    firm,
    maxdiscprice,
    COUNT(*) OVER () AS total_count
FROM products
    LEFT JOIN discount ON products.id = productid
WHERE firm = $1
    OR line = $2
LIMIT $3 OFFSET $4;

-- name: GetFullProductsInfoByIds :many
SELECT 
    p.minprice,
    p.maxprice,
    p.id as global_id,
    p.image_path,
    p.name,
    p.firm,
    d.maxdiscprice,
    p.type,
    p.sizes as sizes_jsonb  -- Все размеры в JSONB формате
FROM products p
LEFT JOIN discount d ON p.id = d.productid
WHERE p.id = ANY($1::integer[])
ORDER BY p.minprice ASC;


-- name: GetProductsByFiltersNewTest :many
SELECT 
    p.id,
    p.name,
    d.maxdiscprice,
    p.image_path
FROM products p
LEFT JOIN discount d ON p.id = d.productid
WHERE 
    -- Размеры (самое сложное условие оставляем как есть)
    (COALESCE(array_length(@sizes::text[], 1), 0) = 0 OR EXISTS (
        SELECT 1
        FROM jsonb_object_keys(p.sizes) AS size_key
        WHERE size_key = ANY(@sizes::text[])
        AND (p.sizes -> size_key ->> 'price')::numeric > 0
    ))
    AND(@name::text IS NULL OR @name::text = '' OR p.name ILIKE '%' || @name::text || '%')
    -- Простые условия для массивов
    AND (COALESCE(array_length(@categories::int[], 1), 0) = 0 OR p.category = ANY(@categories::int[]))
    AND (COALESCE(array_length(@product_types::int[], 1), 0) = 0 OR p.type = ANY(@product_types::int[]))
    AND (COALESCE(array_length(@firms::text[], 1), 0) = 0 OR p.firm = ANY(@firms::text[]))
    AND (COALESCE(array_length(@bodytypes::text[], 1), 0) = 0 OR p.bodytype = ANY(@bodytypes::body_enum[]))
    -- Условия для цен
    AND (sqlc.narg('minprice')::int IS NULL OR p.minprice >= sqlc.narg('minprice')::int)
    AND (sqlc.narg('maxprice')::int IS NULL OR p.maxprice <= sqlc.narg('maxprice')::int);
-- name: GetCategories :many
SELECT 
    pc.name,
    pc.id,
    pc.image_path
FROM 
    product_categories pc;

-- name: GetCategoriesWithTypes :many
SELECT 
    pc.id as category_id,
    pc.enum_key as category_key,
    pc.name as category_name,
    pc.image_path as image_path,
    pt.id as type_id, 
    pt.enum_key as type_key,
    pt.type_name as type_name
FROM product_categories pc
LEFT JOIN product_types pt ON pc.id = pt.category_id
ORDER BY pc.name, pt.type_name;
-- name: GetProductsByFilters :many
SELECT 
    p.id,
    p.name,
    p.image_path,
    p.firm,
    p.minprice,
    p.maxprice,
    d.maxdiscprice,
    COUNT(*) OVER() AS total_count
FROM products p
LEFT JOIN discount d ON p.id = d.productid
LEFT JOIN store_house sh ON p.id = sh.productid
WHERE 
    -- Размеры (самое сложное условие оставляем как есть)
    (COALESCE(array_length(@sizes::text[], 1), 0) = 0 OR EXISTS (
        SELECT 1
        FROM jsonb_object_keys(p.sizes) AS size_key
        WHERE size_key = ANY(@sizes::text[])
        AND (p.sizes -> size_key ->> 'price')::numeric > 0
    ))
     AND(@name::text IS NULL OR @name::text = '' OR p.name ILIKE '%' || @name::text || '%')
    -- Простые условия для массивов
    AND (COALESCE(array_length(@categories::int[], 1), 0) = 0 OR p.category = ANY(@categories::int[]))
    AND (COALESCE(array_length(@product_types::int[], 1), 0) = 0 OR p.type = ANY(@product_types::int[]))
    AND (COALESCE(array_length(@firms::text[], 1), 0) = 0 OR p.firm = ANY(@firms::text[]))
    AND (COALESCE(array_length(@bodytypes::text[], 1), 0) = 0 OR p.bodytype = ANY(@bodytypes::body_enum[]))
    -- Условия для цен
    AND (sqlc.narg('minprice')::int IS NULL OR p.maxprice >= sqlc.narg('minprice')::int)
    AND (sqlc.narg('maxprice')::int IS NULL OR p.minprice <= sqlc.narg('maxprice')::int)
    AND (@has_discount::boolean IS NULL OR @has_discount::boolean = false OR d.id IS NOT NULL)
    AND (@in_store::boolean IS NULL OR @in_store::boolean = false OR (sh.id IS NOT NULL AND sh.quantity > 0))
    AND (@with_price::boolean IS NULL OR @with_price::boolean = false OR  p.minprice > 0)

ORDER BY 
    CASE WHEN @sort_type::int = 1 THEN p.name END ASC,
    CASE WHEN @sort_type::int = 2 THEN p.name END DESC,
    
    -- Сортировка по цене
    CASE WHEN @sort_type::int = 3 THEN p.minprice END ASC,
    CASE WHEN @sort_type::int = 4 THEN p.minprice END DESC,
    
    -- Сортировка по умолчанию
    CASE WHEN @sort_type::int NOT IN (1,2,3,4) THEN p.name END ASC,
    -- Стабильная сортировка
    p.id ASC
LIMIT CASE WHEN @limitVal::integer > 0 THEN @limitVal::integer ELSE 50 END
OFFSET CASE WHEN @offsetVal::integer > 0 THEN @offsetVal::integer ELSE 0 END;

-- name: BulkInsertDiscounts :exec
INSERT INTO discount (productid, value, minprice, maxdiscprice)
SELECT 
    unnest(@product_ids::integer[]),
    unnest(@discount_values::jsonb[]),
    unnest(@min_prices::integer[]),
    unnest(@max_disc_prices::integer[])
ON CONFLICT (productid) 
DO UPDATE SET 
    value = EXCLUDED.value,
    minprice = EXCLUDED.minprice,
    maxdiscprice = EXCLUDED.maxdiscprice,
    updated_at = NOW();

-- name: GetProductsBasicInfo :many
SELECT 
    id,
    minprice,
    maxprice,
    sizes
FROM products 
WHERE id = ANY(@product_ids::int[]);


-- name: ClearDiscounts :exec
DELETE FROM discount;


-- name: GetMainPageInfo :many
SELECT 
    p.category,
    COUNT(*) OVER (PARTITION BY p.category) as category_product_count,
    p.id,
    p.firm,
    p.name,
    p.minprice,
    p.maxprice,
    p.image_path,
    p.bodytype
FROM (
    SELECT 
        p.id,
        p.firm,
        p.name,
        p.minprice,
        p.maxprice,
        p.image_path,
        p.bodytype,
        p.category,
        ROW_NUMBER() OVER (PARTITION BY p.category ORDER BY p.id) as row_num
    FROM products p
    WHERE p.minprice IS NOT NULL AND p.minprice > 0
) p
WHERE p.row_num <= sqlc.arg('products_per_category')::int
ORDER BY p.category, p.row_num;

