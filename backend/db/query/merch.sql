-- name: GetMerchFirms :many
SELECT b.name as firm,
    array_agg(DISTINCT bl.name) AS collections
FROM brands b
    JOIN brand_lines bl ON bl.brand_id = b.id
WHERE b.is_active = true
    AND bl.is_active = true
    AND EXISTS (
        SELECT 1
        FROM products p
        WHERE p.brand_id = b.id
            AND p.line_id = bl.id
            AND p.status = 'active'
    )
GROUP BY b.name
ORDER BY b.name;
-- name: GetMerchProductsByFirmName :many
SELECT p.name,
    p.image_path,
    p.id,
    COALESCE(d.minprice, p.minprice) AS value,
    p.article,
    p.type
FROM products p
    LEFT JOIN discount d ON p.id = d.productid
    JOIN brands b ON p.brand_id = b.id
    AND b.is_active = true
WHERE b.name = $1
    AND p.status = 'active'
ORDER BY p.name;
-- name: InsertDiscounts :one
INSERT INTO public.discount (
        productid,
        value,
        minprice,
        maxdiscprice
    )
SELECT unnest(@product_ids::int []),
    unnest(@discount_values::json []),
    NULLIF(unnest(@min_prices::int []), 0),
    NULLIF(unnest(@max_disc_prices::int []), 0)
RETURNING id;
-- name: SelectMainCategories :one
SELECT enum_range(NULL::main_categories);
-- name: GetMerchCollection :many
SELECT COALESCE(d.minprice, p.minprice) AS minprice,
    p.id AS global_id,
    p.image_path,
    p.name,
    b.name as firm,
    d.maxdiscprice,
    st.productid,
    p.type,
    COUNT(*) OVER() AS total_count
FROM products p
    LEFT JOIN discount d ON p.id = d.productid
    LEFT JOIN store_house st ON p.id = st.productid
    JOIN brands b ON p.brand_id = b.id
    AND b.is_active = true
    LEFT JOIN brand_lines bl ON p.line_id = bl.id
    AND bl.is_active = true
WHERE (
        b.name = @firm
        OR bl.name = @line
    )
    AND p.status = 'active'
ORDER BY CASE
        WHEN COALESCE(COALESCE(d.minprice, p.minprice), 0) > 0 THEN 0
        ELSE 1
    END
LIMIT @limitVal OFFSET @offsetVal;
-- name: GetProductsByName :many
SELECT p.id as global_id,
    p.image_path,
    p.name,
    b.name as firm,
    p.minprice,
    p.maxprice,
    d.maxdiscprice,
    p.type,
    p.article,
    p.type,
    p.category
FROM products p
    LEFT JOIN discount d ON p.id = d.productid
    JOIN brands b ON p.brand_id = b.id
    AND b.is_active = true
WHERE (p.name ILIKE '%' || $1::text || '%')
    AND p.status = 'active'
ORDER BY CASE
        WHEN COALESCE(p.minprice, 0) > 0 THEN 0
        ELSE 1
    END,
    p.name
LIMIT $2;
-- name: GetProductsByIds :many
SELECT p.minprice,
    p.id as global_id,
    p.image_path,
    p.name,
    b.name as firm,
    d.maxdiscprice,
    p.type,
    p.article
FROM products p
    LEFT JOIN discount d ON p.id = d.productid
    JOIN brands b ON p.brand_id = b.id
    AND b.is_active = true
WHERE p.id = ANY($1::integer [])
    AND p.status = 'active'
ORDER BY p.minprice ASC;
-- name: GetMerchWithDiscount :many
SELECT p.minprice,
    p.qId,
    p.id,
    p.image_path,
    p.name,
    b.name as firm,
    d.maxdiscprice,
    p.type
FROM products p
    LEFT JOIN discount d ON p.id = d.productid
    JOIN brands b ON p.brand_id = b.id
    AND b.is_active = true
WHERE p.status = 'active'
ORDER BY p.minprice ASC;
-- name: GetMerchCountOfCollectionsOrFirms :one
SELECT COUNT(*) AS total_count
FROM products p
    JOIN brands b ON p.brand_id = b.id
    AND b.is_active = true
    LEFT JOIN brand_lines bl ON p.line_id = bl.id
    AND bl.is_active = true
WHERE (
        b.name = @firm
        OR bl.name = @line
    )
    AND p.status = 'active';
-- name: GetMerchCollectionWithCount :many
SELECT COALESCE(d.minprice, p.minprice) AS minprice,
    p.id,
    p.image_path,
    p.name,
    b.name as firm,
    d.maxdiscprice,
    p.type,
    COUNT(*) OVER () AS total_count
FROM products p
    LEFT JOIN discount d ON p.id = d.productid
    JOIN brands b ON p.brand_id = b.id
    AND b.is_active = true
    LEFT JOIN brand_lines bl ON p.line_id = bl.id
    AND bl.is_active = true
WHERE (
        b.name = @firm
        OR bl.name = @line
    )
    AND p.status = 'active'
ORDER BY p.name
LIMIT @limitVal OFFSET @offsetVal;
-- name: GetFirms :many
SELECT 
    b.id as brand_id,
    b.name as firm,
    b.slug as brand_slug,
    bl.id as line_id,
    bl.name as collection_name,
    bl.slug as collection_slug
FROM brands b
    LEFT JOIN brand_lines bl ON bl.brand_id = b.id AND bl.is_active = true
WHERE b.is_active = true
ORDER BY b.sort_order ASC, b.name ASC, bl.sort_order ASC, bl.name ASC;
-- name: GetSnickersByFirmName :many
SELECT p.name,
    p.image_path,
    p.id,
    COALESCE(d.minprice, p.minprice) AS value,
    p.article
FROM products p
    LEFT JOIN discount d ON p.id = d.productid
    JOIN brands b ON p.brand_id = b.id
    AND b.is_active = true
WHERE b.name = $1
    AND p.status = 'active';
-- name: GetProductByArticle :one
SELECT p.id,
    p.qid,
    p.name,
    b.name as firm,
    bl.name as line,
    p.image_path,
    p.sizes
FROM products p
    JOIN brands b ON p.brand_id = b.id
    LEFT JOIN brand_lines bl ON p.line_id = bl.id
WHERE p.article = $1
    AND p.status = 'active'
LIMIT 1;
-- name: GetProductsByLineName :many
SELECT bl.name as line,
    array_agg(p.id) AS id,
    array_agg(p.image_path) AS image_path,
    array_agg(p.name) AS name_data
FROM products p
    JOIN brand_lines bl ON p.line_id = bl.id
    AND bl.is_active = true
WHERE bl.name = $1
    AND p.status = 'active'
GROUP BY bl.name;
-- name: GetCombinedFiltersByString :one
WITH product_data AS (
    SELECT p.minprice,
        p.maxprice,
        b.name as firm,
        p.sizes
    FROM products p
        JOIN brands b ON p.brand_id = b.id
    WHERE p.name ILIKE '%' || $1::text || '%'
        AND p.status = 'active'
),
firm_counts AS (
    SELECT firm,
        COUNT(*) AS firm_count
    FROM product_data
    GROUP BY firm
),
size_counts AS (
    SELECT size_key,
        COUNT(*) as size_count
    FROM product_data pd
        CROSS JOIN LATERAL jsonb_object_keys(pd.sizes) as size_key
    WHERE (pd.sizes->size_key->'price')::numeric > 0
    GROUP BY size_key
)
SELECT COALESCE(
        jsonb_object_agg(size_key, size_count) FILTER (
            WHERE size_key IS NOT NULL
        ),
        '{}'::jsonb
    ) as sizes,
    MIN(minprice) AS min_price,
    MAX(maxprice) AS max_price,
    COALESCE(
        jsonb_object_agg(COALESCE(fc.firm, 'Unknown'), fc.firm_count) FILTER (
            WHERE fc.firm IS NOT NULL
        ),
        '{}'::jsonb
    ) AS firm_count_map
FROM product_data pd
    CROSS JOIN size_counts sc
    LEFT JOIN firm_counts fc ON pd.firm = fc.firm;
-- name: GetProductsByNameCategoryAndType :many
SELECT p.id as global_id,
    b.name as firm,
    p.minprice,
    p.maxprice,
    p.sizes,
    p.bodytype
FROM products p
    JOIN brands b ON p.brand_id = b.id
WHERE (
        sqlc.narg('type')::int IS NULL
        OR p.type = sqlc.narg('type')::int
    )
    AND p.status = 'active'
    AND (
        sqlc.narg('category')::int IS NULL
        OR p.category = sqlc.narg('category')
    )
    AND (
        sqlc.narg('name')::text IS NULL
        OR p.name ILIKE '%' || sqlc.narg('name')::text || '%'
    );
-- name: GetFiltersByNameCategoryAndType :one
WITH product_data AS (
    SELECT
        p.id as global_id,
        p.brand_id,
        p.line_id,
        b.name as firm,
        p.minprice,
        p.maxprice,
        p.sizes,
        p.bodytype,
        p.type as product_type_id
    FROM products p
    JOIN brands b ON p.brand_id = b.id AND b.is_active = true
    WHERE p.status = 'active'
        AND (sqlc.narg('type')::int IS NULL OR p.type = sqlc.narg('type')::int)
        AND (sqlc.narg('category')::int IS NULL OR p.category = sqlc.narg('category'))
        AND (sqlc.narg('name')::text IS NULL OR p.name ILIKE '%' || sqlc.narg('name')::text || '%')
),
size_data AS (
    SELECT size_key, COUNT(*) as count
    FROM product_data
    CROSS JOIN LATERAL jsonb_object_keys(sizes) as size_key
    WHERE (sizes->size_key->'price')::numeric > 0
    GROUP BY size_key
),
firm_counts AS (
    SELECT firm, COUNT(*) AS firm_count
    FROM product_data
    WHERE firm IS NOT NULL
    GROUP BY firm
),
bodytype_counts AS (
    SELECT bodytype, COUNT(*) as count
    FROM product_data
    GROUP BY bodytype
),
price_range AS (
    SELECT COALESCE(MIN(minprice), 0) AS min_price,
           COALESCE(MAX(maxprice), 0) AS max_price
    FROM product_data
),
type_data AS (
    SELECT product_type_id, COUNT(*) as type_count
    FROM product_data
    GROUP BY product_type_id
),
discount_rules_applied AS (
    SELECT DISTINCT
        dr.id,
        dr.name,
        dr.discount_type,
        dr.discount_value,
        dr.priority
    FROM product_data pd
    JOIN discount_rule_items dri ON (
        (dri.item_type = 'brand' AND dri.item_id = pd.brand_id) OR
        (dri.item_type = 'line'   AND dri.item_id = pd.line_id) OR
        (dri.item_type = 'product' AND dri.item_id = pd.global_id)
    )
    JOIN discount_rules dr ON dr.id = dri.rule_id
    WHERE dr.is_active = true
        AND dr.starts_at <= NOW()
        AND (dr.ends_at IS NULL OR dr.ends_at > NOW())
)
SELECT
    COALESCE(
        (SELECT jsonb_object_agg(size_key, count) FROM size_data),
        '{}'::jsonb
    ) as sizes,
    COALESCE(
        (SELECT jsonb_object_agg(bodytype::text, count) FROM bodytype_counts),
        '{}'::jsonb
    ) as bodytypes,
    (SELECT min_price FROM price_range) as min_price,
    (SELECT max_price FROM price_range) as max_price,
    COALESCE(
        (SELECT jsonb_object_agg(COALESCE(firm, 'Unknown'), firm_count) FROM firm_counts),
        '{}'::jsonb
    ) as firms,
    COALESCE(
        (SELECT jsonb_agg(product_type_id) FROM type_data),
        '[]'::jsonb
    ) as product_types,
    COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', name,
                'discount_type', discount_type,
                'discount_value', discount_value,
                'priority', priority
            )
         ) FROM discount_rules_applied),
        '[]'::jsonb
    ) as discount_rules;
-- name: GetCountIdByName :many
SELECT b.name as firm,
    COUNT(p.id) count
FROM products p
    JOIN brands b ON p.brand_id = b.id
    AND b.is_active = true
WHERE p.name ILIKE '%' || CAST($1 AS text) || '%'
    AND p.status = 'active'
GROUP BY b.name;
-- name: GetProductsInfoById :one
SELECT p.sizes,
    p.id AS id,
    p.image_path,
    p.name,
    d.value AS value,
    COALESCE(
        jsonb_object_agg(st.size, st.quantity) FILTER (
            WHERE st.size IS NOT NULL
        ),
        '{}'::jsonb
    ) as store_info,
    p.article,
    p.description,
    bl.name as line,
    p.type,
    p.category,
    p.date,
    b.name as firm,
    p.image_count
FROM products p
    LEFT JOIN discount d ON p.id = d.productid
    LEFT JOIN store_house st ON p.id = st.productid
    JOIN brands b ON p.brand_id = b.id
    LEFT JOIN brand_lines bl ON p.line_id = bl.id
WHERE p.id = $1
GROUP BY p.id,
    d.value,
    b.name,
    bl.name;
-- name: GetSoloCollection :many
SELECT COALESCE(d.minprice, p.minprice) AS minprice,
    p.id,
    p.image_path,
    p.name,
    b.name as firm,
    d.maxdiscprice
FROM products p
    LEFT JOIN discount d ON p.id = d.productid
    JOIN brands b ON p.brand_id = b.id
    AND b.is_active = true
    LEFT JOIN brand_lines bl ON p.line_id = bl.id
    AND bl.is_active = true
WHERE (
        b.name = $1
        OR bl.name = $2
    )
    AND p.status = 'active'
LIMIT $3 OFFSET $4;
-- name: GetProductsWithDiscount :many
SELECT p.type,
    p.minprice,
    p.id,
    p.image_path,
    p.name,
    b.name as firm,
    d.maxdiscprice,
    d.value AS discount_value
FROM products p
    JOIN discount d ON p.id = d.productid
    JOIN brands b ON p.brand_id = b.id
    AND b.is_active = true
WHERE p.status = 'active';
-- name: GetCountOfCollectionsOrFirms :one
SELECT COUNT(p.id) AS count
FROM products p
    JOIN brands b ON p.brand_id = b.id
    AND b.is_active = true
    LEFT JOIN brand_lines bl ON p.line_id = bl.id
    AND bl.is_active = true
WHERE (
        b.name = @firm
        OR bl.name = @line
    )
    AND p.status = 'active';
-- name: GetSoloCollectionWithCount :many    
SELECT COALESCE(d.minprice, p.minprice) AS minprice,
    p.id,
    p.image_path,
    p.name,
    b.name as firm,
    d.maxdiscprice,
    COUNT(*) OVER () AS total_count
FROM products p
    LEFT JOIN discount d ON p.id = d.productid
    JOIN brands b ON p.brand_id = b.id
    AND b.is_active = true
    LEFT JOIN brand_lines bl ON p.line_id = bl.id
    AND bl.is_active = true
WHERE b.name = @firm
    AND bl.name = @line
    AND p.status = 'active'
LIMIT @limitVal OFFSET @offsetVal;
-- name: GetFullProductsInfoByIds :many
SELECT p.minprice,
    p.maxprice,
    p.id as global_id,
    p.image_path,
    p.name,
    b.name as firm,
    d.maxdiscprice,
    p.type,
    p.sizes as sizes_jsonb
FROM products p
    LEFT JOIN discount d ON p.id = d.productid
    JOIN brands b ON p.brand_id = b.id
    AND b.is_active = true
WHERE p.id = ANY($1::integer [])
ORDER BY p.minprice ASC;
-- name: GetProductsByFiltersNewTest :many
SELECT p.id,
    p.name,
    d.maxdiscprice,
    p.image_path
FROM products p
    LEFT JOIN discount d ON p.id = d.productid
    JOIN brands b ON p.brand_id = b.id
    LEFT JOIN brand_lines bl ON p.line_id = bl.id
WHERE (
        COALESCE(array_length(@sizes::text [], 1), 0) = 0
        OR EXISTS (
            SELECT 1
            FROM jsonb_object_keys(p.sizes) AS size_key
            WHERE size_key = ANY(@sizes::text [])
                AND (p.sizes->size_key->>'price')::numeric > 0
        )
    )
    AND (
        @name::text IS NULL
        OR @name::text = ''
        OR p.name ILIKE '%' || @name::text || '%'
    )
    AND (
        COALESCE(array_length(@categories::int [], 1), 0) = 0
        OR p.category = ANY(@categories::int [])
    )
    AND (
        COALESCE(array_length(@product_types::int [], 1), 0) = 0
        OR p.type = ANY(@product_types::int [])
    )
    AND (
        COALESCE(array_length(@firms::int [], 1), 0) = 0
        OR p.brand_id = ANY(@firms::int [])
    )
    AND (
        COALESCE(array_length(@bodytypes::text [], 1), 0) = 0
        OR p.bodytype = ANY(@bodytypes::body_enum [])
    )
    AND (
        sqlc.narg('minprice')::int IS NULL
        OR p.minprice >= sqlc.narg('minprice')::int
    )
    AND (
        sqlc.narg('maxprice')::int IS NULL
        OR p.maxprice <= sqlc.narg('maxprice')::int
    );
-- name: GetCategories :many
SELECT pc.name,
    pc.id,
    pc.image_path
FROM product_categories pc;
-- name: GetCategoriesWithTypes :many
SELECT pc.id as category_id,
    pc.enum_key as category_key,
    pc.name as category_name,
    pc.image_path as image_path,
    pt.id as type_id,
    pt.enum_key as type_key,
    pt.type_name as type_name
FROM product_categories pc
    LEFT JOIN product_types pt ON pc.id = pt.category_id
ORDER BY pc.name,
    pt.type_name;


-- name: CountProductsByFilters :one
SELECT COUNT(*)
FROM products p
WHERE (
        COALESCE(array_length(@sizes::text[], 1), 0) = 0
        OR EXISTS (
            SELECT 1
            FROM jsonb_object_keys(p.sizes) AS size_key
            WHERE size_key = ANY(@sizes::text[])
              AND (p.sizes->size_key->>'price')::numeric > 0
        )
    )
    AND (
        @status::text IS NULL
        OR @status::text = ''
        OR p.status = @status::text
    )
    AND (
        @name::text IS NULL
        OR @name::text = ''
        OR p.name ILIKE '%' || @name::text || '%'
        OR p.article ILIKE '%' || @name::text || '%'
    )
    AND (
        COALESCE(array_length(@categories::int[], 1), 0) = 0
        OR p.category = ANY(@categories::int[])
    )
    AND (
        COALESCE(array_length(@product_types::int[], 1), 0) = 0
        OR p.type = ANY(@product_types::int[])
    )
    AND (
        COALESCE(array_length(@firms::int[], 1), 0) = 0
        OR p.brand_id = ANY(@firms::int[])
    )
    AND (
        COALESCE(array_length(@lines::int[], 1), 0) = 0
        OR p.line_id = ANY(@lines::int[])
    )
    AND (
        COALESCE(array_length(@bodytypes::text[], 1), 0) = 0
        OR p.bodytype = ANY(@bodytypes::body_enum[])
    )
    AND (
        sqlc.narg('minprice')::int IS NULL
        OR p.maxprice >= sqlc.narg('minprice')::int
    )
    AND (
        sqlc.narg('maxprice')::int IS NULL
        OR p.minprice <= sqlc.narg('maxprice')::int
    )
    AND (
        @has_discount::boolean IS NULL
        OR @has_discount::boolean = false
        OR EXISTS (
            SELECT 1
            FROM discount d
            WHERE d.productid = p.id
        )
        OR EXISTS (
            SELECT 1
            FROM discount_rule_items dri
            JOIN discount_rules dr2 ON dr2.id = dri.rule_id
                AND dr2.is_active = true
                AND dr2.starts_at <= NOW()
                AND (dr2.ends_at IS NULL OR dr2.ends_at >= NOW())
            WHERE (dri.item_type = 'brand'   AND dri.item_id = p.brand_id)
               OR (dri.item_type = 'line'    AND dri.item_id = p.line_id)
               OR (dri.item_type = 'product' AND dri.item_id = p.id)
        )
    )
    AND (
        @in_store::boolean IS NULL
        OR @in_store::boolean = false
        OR EXISTS (
            SELECT 1
            FROM store_house sh
            WHERE sh.productid = p.id
              AND sh.quantity > 0
        )
    )
    AND (
        @with_price::boolean IS NULL
        OR @with_price::boolean = false
        OR p.minprice > 0
    );

-- name: GetProductsByFiltersPaginate :many
SELECT p.id,
    p.name,
    p.image_path,
    b.name as firm,
    p.minprice,
    p.maxprice,
    p.status,
    COALESCE(d.maxdiscprice, 0) as maxdiscprice,
    COALESCE(dr.discount_value, 0) as discount_percent
FROM products p
    LEFT JOIN discount d ON p.id = d.productid
    LEFT JOIN store_house sh ON p.id = sh.productid
    JOIN brands b ON p.brand_id = b.id
    LEFT JOIN brand_lines bl ON p.line_id = bl.id
    LEFT JOIN LATERAL (
        SELECT dr2.discount_value,
            dr2.name
        FROM discount_rule_items dri
            JOIN discount_rules dr2 ON dr2.id = dri.rule_id
            AND dr2.is_active = true
            AND dr2.starts_at <= NOW()
            AND (
                dr2.ends_at IS NULL
                OR dr2.ends_at >= NOW()
            )
        WHERE (
                dri.item_type = 'brand'
                AND dri.item_id = p.brand_id
            )
            OR (
                dri.item_type = 'line'
                AND dri.item_id = p.line_id
            )
            OR (
                dri.item_type = 'product'
                AND dri.item_id = p.id
            )
            AND d.id IS NULL
        ORDER BY dr2.priority DESC
        LIMIT 1
    ) dr ON true
WHERE (
        COALESCE(array_length(@sizes::text [], 1), 0) = 0
        OR EXISTS (
            SELECT 1
            FROM jsonb_object_keys(p.sizes) AS size_key
            WHERE size_key = ANY(@sizes::text [])
                AND (p.sizes->size_key->>'price')::numeric > 0
        )
    )
    AND (
        @status::text IS NULL
        OR @status::text = ''
        OR p.status = @status::text
    )
    AND (
        @name::text IS NULL
        OR @name::text = ''
        OR p.name ILIKE '%' || @name::text || '%'
        OR p.article ILIKE '%' || @name::text || '%'
    )
    AND (
        COALESCE(array_length(@categories::int [], 1), 0) = 0
        OR p.category = ANY(@categories::int [])
    )
    AND (
        COALESCE(array_length(@product_types::int [], 1), 0) = 0
        OR p.type = ANY(@product_types::int [])
    )
    AND (
        COALESCE(array_length(@firms::int [], 1), 0) = 0
        OR p.brand_id = ANY(@firms::int [])
    )
    AND (
        COALESCE(array_length(@lines::int [], 1), 0) = 0
        OR p.line_id = ANY(@lines::int [])
    )
    AND (
        COALESCE(array_length(@bodytypes::text [], 1), 0) = 0
        OR p.bodytype = ANY(@bodytypes::body_enum [])
    )
    AND (
        sqlc.narg('minprice')::int IS NULL
        OR p.maxprice >= sqlc.narg('minprice')::int
    )
    AND (
        sqlc.narg('maxprice')::int IS NULL
        OR p.minprice <= sqlc.narg('maxprice')::int
    )
    AND (
        @has_discount::boolean IS NULL
        OR @has_discount::boolean = false
        OR d.id IS NOT NULL
        OR dr.discount_value IS NOT NULL
    )
    AND (
        @in_store::boolean IS NULL
        OR @in_store::boolean = false
        OR (
            sh.id IS NOT NULL
            AND sh.quantity > 0
        )
    )
    AND (
        @with_price::boolean IS NULL
        OR @with_price::boolean = false
        OR p.minprice > 0
    )
ORDER BY CASE
        WHEN @sort_type::int = 1 THEN p.name
    END ASC,
    CASE
        WHEN @sort_type::int = 2 THEN p.name
    END DESC,
    CASE
        WHEN @sort_type::int = 3 THEN p.minprice
    END ASC,
    CASE
        WHEN @sort_type::int = 4 THEN p.minprice
    END DESC,
    CASE
        WHEN @sort_type::int NOT IN (1, 2, 3, 4) THEN p.name
    END ASC,
    p.id ASC
LIMIT CASE
        WHEN @limitVal::integer > 0 THEN @limitVal::integer
        ELSE 50
    END OFFSET CASE
        WHEN @offsetVal::integer > 0 THEN @offsetVal::integer
        ELSE 0
    END;
-- name: GetProductsByFilters :many
SELECT p.id,
    p.name,
    p.image_path,
    b.name as firm,
    p.minprice,
    p.maxprice,
    p.status,
    COALESCE(d.maxdiscprice, 0) as maxdiscprice,
    COALESCE(dr.discount_value, 0) as discount_percent,
    COUNT(*) OVER() AS total_count
FROM products p
    LEFT JOIN discount d ON p.id = d.productid
    LEFT JOIN store_house sh ON p.id = sh.productid
    JOIN brands b ON p.brand_id = b.id
    LEFT JOIN brand_lines bl ON p.line_id = bl.id
    LEFT JOIN LATERAL (
        SELECT dr2.discount_value,
            dr2.name
        FROM discount_rule_items dri
            JOIN discount_rules dr2 ON dr2.id = dri.rule_id
            AND dr2.is_active = true
            AND dr2.starts_at <= NOW()
            AND (
                dr2.ends_at IS NULL
                OR dr2.ends_at >= NOW()
            )
        WHERE (
                dri.item_type = 'brand'
                AND dri.item_id = p.brand_id
            )
            OR (
                dri.item_type = 'line'
                AND dri.item_id = p.line_id
            )
            OR (
                dri.item_type = 'product'
                AND dri.item_id = p.id
            )
            AND d.id IS NULL
        ORDER BY dr2.priority DESC
        LIMIT 1
    ) dr ON true
WHERE (
        COALESCE(array_length(@sizes::text [], 1), 0) = 0
        OR EXISTS (
            SELECT 1
            FROM jsonb_object_keys(p.sizes) AS size_key
            WHERE size_key = ANY(@sizes::text [])
                AND (p.sizes->size_key->>'price')::numeric > 0
        )
    )
    AND (
        @status::text IS NULL
        OR @status::text = ''
        OR p.status = @status::text
    )
    AND (
        @name::text IS NULL
        OR @name::text = ''
        OR p.name ILIKE '%' || @name::text || '%'
        OR p.article ILIKE '%' || @name::text || '%'
    )
    AND (
        COALESCE(array_length(@categories::int [], 1), 0) = 0
        OR p.category = ANY(@categories::int [])
    )
    AND (
        COALESCE(array_length(@product_types::int [], 1), 0) = 0
        OR p.type = ANY(@product_types::int [])
    )
    AND (
        COALESCE(array_length(@firms::int [], 1), 0) = 0
        OR p.brand_id = ANY(@firms::int [])
    )
    AND (
        COALESCE(array_length(@lines::int [], 1), 0) = 0
        OR p.line_id = ANY(@lines::int [])
    )
    AND (
        COALESCE(array_length(@bodytypes::text [], 1), 0) = 0
        OR p.bodytype = ANY(@bodytypes::body_enum [])
    )
    AND (
        sqlc.narg('minprice')::int IS NULL
        OR p.maxprice >= sqlc.narg('minprice')::int
    )
    AND (
        sqlc.narg('maxprice')::int IS NULL
        OR p.minprice <= sqlc.narg('maxprice')::int
    )
    AND (
        @has_discount::boolean IS NULL
        OR @has_discount::boolean = false
        OR d.id IS NOT NULL
        OR dr.discount_value IS NOT NULL
    )
    AND (
        @in_store::boolean IS NULL
        OR @in_store::boolean = false
        OR (
            sh.id IS NOT NULL
            AND sh.quantity > 0
        )
    )
    AND (
        @with_price::boolean IS NULL
        OR @with_price::boolean = false
        OR p.minprice > 0
    )
ORDER BY CASE
        WHEN @sort_type::int = 1 THEN p.name
    END ASC,
    CASE
        WHEN @sort_type::int = 2 THEN p.name
    END DESC,
    CASE
        WHEN @sort_type::int = 3 THEN p.minprice
    END ASC,
    CASE
        WHEN @sort_type::int = 4 THEN p.minprice
    END DESC,
    CASE
        WHEN @sort_type::int NOT IN (1, 2, 3, 4) THEN p.name
    END ASC,
    p.id ASC
LIMIT CASE
        WHEN @limitVal::integer > 0 THEN @limitVal::integer
        ELSE 50
    END OFFSET CASE
        WHEN @offsetVal::integer > 0 THEN @offsetVal::integer
        ELSE 0
    END;



-- ============================================================
-- ПАГИНАЦИЯ (варианты)
-- ============================================================

-- name: GetProductsByFiltersPaginateBase :many
-- Самый лёгкий – без скидок, без склада
SELECT p.id, p.name, p.image_path,
       b.name as firm,
       p.minprice, p.maxprice, p.status
FROM products p
INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
WHERE 
    -- Только активные товары
    p.status = 'active'
    -- Если есть линия - она должна быть активна
    AND (p.line_id IS NULL OR bl.id IS NOT NULL)
    -- Размеры
    AND (
        COALESCE(array_length(@sizes::text[], 1), 0) = 0
        OR EXISTS (
            SELECT 1
            FROM jsonb_object_keys(p.sizes) AS size_key
            WHERE size_key = ANY(@sizes::text[])
              AND (p.sizes->size_key->>'price')::numeric > 0
        )
    )
    -- Поиск по имени/артикулу
    AND (
        @name::text IS NULL OR @name::text = ''
        OR p.name ILIKE '%' || @name::text || '%'
        OR p.article ILIKE '%' || @name::text || '%'
    )
    -- Категории
    AND (
        COALESCE(array_length(@categories::int[], 1), 0) = 0
        OR p.category = ANY(@categories::int[])
    )
    -- Типы продуктов
    AND (
        COALESCE(array_length(@product_types::int[], 1), 0) = 0
        OR p.type = ANY(@product_types::int[])
    )
    -- Бренды
    AND (
        COALESCE(array_length(@firms::int[], 1), 0) = 0
        OR p.brand_id = ANY(@firms::int[])
    )
    -- Линии
    AND (
        COALESCE(array_length(@lines::int[], 1), 0) = 0
        OR p.line_id = ANY(@lines::int[])
    )
    -- Bodytype
    AND (
        COALESCE(array_length(@bodytypes::text[], 1), 0) = 0
        OR p.bodytype = ANY(@bodytypes::body_enum[])
    )
    -- Цена
    AND (
        sqlc.narg('minprice')::int IS NULL OR p.maxprice >= sqlc.narg('minprice')::int
    )
    AND (
        sqlc.narg('maxprice')::int IS NULL OR p.minprice <= sqlc.narg('maxprice')::int
    )
    -- С ценой
    AND (
        @with_price::boolean IS NULL OR @with_price::boolean = false OR p.minprice > 0
    )
ORDER BY
    CASE WHEN @sort_type::int = 1 THEN p.name END ASC,
    CASE WHEN @sort_type::int = 2 THEN p.name END DESC,
    CASE WHEN @sort_type::int = 3 THEN p.minprice END ASC,
    CASE WHEN @sort_type::int = 4 THEN p.minprice END DESC,
    CASE WHEN @sort_type::int NOT IN (1,2,3,4) THEN p.name END ASC,
    p.id ASC
LIMIT CASE WHEN @limitval::integer > 0 THEN @limitval::integer ELSE 50 END
OFFSET CASE WHEN @offsetval::integer > 0 THEN @offsetval::integer ELSE 0 END;

-- name: GetProductsByFiltersPaginateWithDiscount :many
-- Только со скидками (LATERAL + discount)
SELECT p.id, p.name, p.image_path,
       b.name as firm,
       p.minprice, p.maxprice, p.status,
       COALESCE(d.maxdiscprice, 0) as maxdiscprice,
       COALESCE(dr.discount_value, 0) as discount_percent
FROM products p
INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
LEFT JOIN discount d ON p.id = d.productid
LEFT JOIN LATERAL (
    SELECT dr2.discount_value, dr2.name
    FROM discount_rule_items dri
    JOIN discount_rules dr2 ON dr2.id = dri.rule_id
        AND dr2.is_active = true
        AND dr2.starts_at <= NOW()
        AND (dr2.ends_at IS NULL OR dr2.ends_at >= NOW())
    WHERE (
            (dri.item_type = 'brand' AND dri.item_id = p.brand_id)
         OR (dri.item_type = 'line'  AND dri.item_id = p.line_id)
         OR (dri.item_type = 'product' AND dri.item_id = p.id)
        )
        AND d.id IS NULL
    ORDER BY dr2.priority DESC
    LIMIT 1
) dr ON true
WHERE 
    -- Только активные товары
    p.status = 'active'
    -- Если есть линия - она должна быть активна
    AND (p.line_id IS NULL OR bl.id IS NOT NULL)
    -- Размеры
    AND (
        COALESCE(array_length(@sizes::text[], 1), 0) = 0
        OR EXISTS (
            SELECT 1
            FROM jsonb_object_keys(p.sizes) AS size_key
            WHERE size_key = ANY(@sizes::text[])
              AND (p.sizes->size_key->>'price')::numeric > 0
        )
    )
    -- Поиск по имени/артикулу
    AND (
        @name::text IS NULL OR @name::text = ''
        OR p.name ILIKE '%' || @name::text || '%'
        OR p.article ILIKE '%' || @name::text || '%'
    )
    -- Категории
    AND (
        COALESCE(array_length(@categories::int[], 1), 0) = 0
        OR p.category = ANY(@categories::int[])
    )
    -- Типы продуктов
    AND (
        COALESCE(array_length(@product_types::int[], 1), 0) = 0
        OR p.type = ANY(@product_types::int[])
    )
    -- Бренды
    AND (
        COALESCE(array_length(@firms::int[], 1), 0) = 0
        OR p.brand_id = ANY(@firms::int[])
    )
    -- Линии
    AND (
        COALESCE(array_length(@lines::int[], 1), 0) = 0
        OR p.line_id = ANY(@lines::int[])
    )
    -- Bodytype
    AND (
        COALESCE(array_length(@bodytypes::text[], 1), 0) = 0
        OR p.bodytype = ANY(@bodytypes::body_enum[])
    )
    -- Цена
    AND (
        sqlc.narg('minprice')::int IS NULL OR p.maxprice >= sqlc.narg('minprice')::int
    )
    AND (
        sqlc.narg('maxprice')::int IS NULL OR p.minprice <= sqlc.narg('maxprice')::int
    )
    -- С ценой
    AND (
        @with_price::boolean IS NULL OR @with_price::boolean = false OR p.minprice > 0
    )
    -- фильтр по скидкам всегда активен, поэтому проверяем наличие
    AND (
        -- Если передан список правил, то требуем наличие скидки от одного из них
        (array_length(@rule_ids::int[], 1) > 0 AND EXISTS (
            SELECT 1
            FROM discount_rule_items dri2
            JOIN discount_rules dr2 ON dr2.id = dri2.rule_id
                AND dr2.is_active = true
                AND dr2.starts_at <= NOW()
                AND (dr2.ends_at IS NULL OR dr2.ends_at >= NOW())
            WHERE dri2.rule_id = ANY(@rule_ids::int[])
              AND (
                  (dri2.item_type = 'brand' AND dri2.item_id = p.brand_id) OR
                  (dri2.item_type = 'line'  AND dri2.item_id = p.line_id) OR
                  (dri2.item_type = 'product' AND dri2.item_id = p.id)
              )
        ))
        OR
        -- Если список не передан, то используем старую логику (прямая скидка или правило)
        (array_length(@rule_ids::int[], 1) = 0 AND (d.id IS NOT NULL OR dr.discount_value IS NOT NULL))
    )
ORDER BY
    CASE WHEN @sort_type::int = 1 THEN p.name END ASC,
    CASE WHEN @sort_type::int = 2 THEN p.name END DESC,
    CASE WHEN @sort_type::int = 3 THEN p.minprice END ASC,
    CASE WHEN @sort_type::int = 4 THEN p.minprice END DESC,
    CASE WHEN @sort_type::int NOT IN (1,2,3,4) THEN p.name END ASC,
    p.id ASC
LIMIT CASE WHEN @limitval::integer > 0 THEN @limitval::integer ELSE 50 END
OFFSET CASE WHEN @offsetval::integer > 0 THEN @offsetval::integer ELSE 0 END;

-- name: GetProductsByFiltersPaginateWithStore :many
-- Только со складом
SELECT p.id, p.name, p.image_path,
       b.name as firm,
       p.minprice, p.maxprice, p.status,
       (sh.id IS NOT NULL AND sh.quantity > 0) AS in_store
FROM products p
INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
LEFT JOIN store_house sh ON p.id = sh.productid
WHERE 
    -- Только активные товары
    p.status = 'active'
    -- Если есть линия - она должна быть активна
    AND (p.line_id IS NULL OR bl.id IS NOT NULL)
    -- Размеры
    AND (
        COALESCE(array_length(@sizes::text[], 1), 0) = 0
        OR EXISTS (
            SELECT 1
            FROM jsonb_object_keys(p.sizes) AS size_key
            WHERE size_key = ANY(@sizes::text[])
              AND (p.sizes->size_key->>'price')::numeric > 0
        )
    )
    -- Поиск по имени/артикулу
    AND (
        @name::text IS NULL OR @name::text = ''
        OR p.name ILIKE '%' || @name::text || '%'
        OR p.article ILIKE '%' || @name::text || '%'
    )
    -- Категории
    AND (
        COALESCE(array_length(@categories::int[], 1), 0) = 0
        OR p.category = ANY(@categories::int[])
    )
    -- Типы продуктов
    AND (
        COALESCE(array_length(@product_types::int[], 1), 0) = 0
        OR p.type = ANY(@product_types::int[])
    )
    -- Бренды
    AND (
        COALESCE(array_length(@firms::int[], 1), 0) = 0
        OR p.brand_id = ANY(@firms::int[])
    )
    -- Линии
    AND (
        COALESCE(array_length(@lines::int[], 1), 0) = 0
        OR p.line_id = ANY(@lines::int[])
    )
    -- Bodytype
    AND (
        COALESCE(array_length(@bodytypes::text[], 1), 0) = 0
        OR p.bodytype = ANY(@bodytypes::body_enum[])
    )
    -- Цена
    AND (
        sqlc.narg('minprice')::int IS NULL OR p.maxprice >= sqlc.narg('minprice')::int
    )
    AND (
        sqlc.narg('maxprice')::int IS NULL OR p.minprice <= sqlc.narg('maxprice')::int
    )
    -- С ценой
    AND (
        @with_price::boolean IS NULL OR @with_price::boolean = false OR p.minprice > 0
    )
    -- Наличие на складе
    AND (sh.id IS NOT NULL AND sh.quantity > 0)
ORDER BY
    CASE WHEN @sort_type::int = 1 THEN p.name END ASC,
    CASE WHEN @sort_type::int = 2 THEN p.name END DESC,
    CASE WHEN @sort_type::int = 3 THEN p.minprice END ASC,
    CASE WHEN @sort_type::int = 4 THEN p.minprice END DESC,
    CASE WHEN @sort_type::int NOT IN (1,2,3,4) THEN p.name END ASC,
    p.id ASC
LIMIT CASE WHEN @limitval::integer > 0 THEN @limitval::integer ELSE 50 END
OFFSET CASE WHEN @offsetval::integer > 0 THEN @offsetval::integer ELSE 0 END;

-- name: GetProductsByFiltersPaginateFull :many
-- Всё вместе: и скидки, и склад
SELECT p.id, p.name, p.image_path,
       b.name as firm,
       p.minprice, p.maxprice, p.status,
       COALESCE(d.maxdiscprice, 0) as maxdiscprice,
       COALESCE(dr.discount_value, 0) as discount_percent,
       (sh.id IS NOT NULL AND sh.quantity > 0) AS in_store
FROM products p
INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
LEFT JOIN discount d ON p.id = d.productid
LEFT JOIN store_house sh ON p.id = sh.productid
LEFT JOIN LATERAL (
    SELECT dr2.discount_value, dr2.name
    FROM discount_rule_items dri
    JOIN discount_rules dr2 ON dr2.id = dri.rule_id
        AND dr2.is_active = true
        AND dr2.starts_at <= NOW()
        AND (dr2.ends_at IS NULL OR dr2.ends_at >= NOW())
    WHERE (
            (dri.item_type = 'brand' AND dri.item_id = p.brand_id)
         OR (dri.item_type = 'line'  AND dri.item_id = p.line_id)
         OR (dri.item_type = 'product' AND dri.item_id = p.id)
        )
        AND d.id IS NULL
    ORDER BY dr2.priority DESC
    LIMIT 1
) dr ON true
WHERE 
    -- Только активные товары
    p.status = 'active'
    -- Если есть линия - она должна быть активна
    AND (p.line_id IS NULL OR bl.id IS NOT NULL)
    -- Размеры
    AND (
        COALESCE(array_length(@sizes::text[], 1), 0) = 0
        OR EXISTS (
            SELECT 1
            FROM jsonb_object_keys(p.sizes) AS size_key
            WHERE size_key = ANY(@sizes::text[])
              AND (p.sizes->size_key->>'price')::numeric > 0
        )
    )
    -- Поиск по имени/артикулу
    AND (
        @name::text IS NULL OR @name::text = ''
        OR p.name ILIKE '%' || @name::text || '%'
        OR p.article ILIKE '%' || @name::text || '%'
    )
    -- Категории
    AND (
        COALESCE(array_length(@categories::int[], 1), 0) = 0
        OR p.category = ANY(@categories::int[])
    )
    -- Типы продуктов
    AND (
        COALESCE(array_length(@product_types::int[], 1), 0) = 0
        OR p.type = ANY(@product_types::int[])
    )
    -- Бренды
    AND (
        COALESCE(array_length(@firms::int[], 1), 0) = 0
        OR p.brand_id = ANY(@firms::int[])
    )
    -- Линии
    AND (
        COALESCE(array_length(@lines::int[], 1), 0) = 0
        OR p.line_id = ANY(@lines::int[])
    )
    -- Bodytype
    AND (
        COALESCE(array_length(@bodytypes::text[], 1), 0) = 0
        OR p.bodytype = ANY(@bodytypes::body_enum[])
    )
    -- Цена
    AND (
        sqlc.narg('minprice')::int IS NULL OR p.maxprice >= sqlc.narg('minprice')::int
    )
    AND (
        sqlc.narg('maxprice')::int IS NULL OR p.minprice <= sqlc.narg('maxprice')::int
    )
    -- С ценой
    AND (
        @with_price::boolean IS NULL OR @with_price::boolean = false OR p.minprice > 0
    )
    -- Скидки
    AND (
        -- Если передан список правил, то требуем наличие скидки от одного из них
        (array_length(@rule_ids::int[], 1) > 0 AND EXISTS (
            SELECT 1
            FROM discount_rule_items dri2
            JOIN discount_rules dr2 ON dr2.id = dri2.rule_id
                AND dr2.is_active = true
                AND dr2.starts_at <= NOW()
                AND (dr2.ends_at IS NULL OR dr2.ends_at >= NOW())
            WHERE dri2.rule_id = ANY(@rule_ids::int[])
              AND (
                  (dri2.item_type = 'brand' AND dri2.item_id = p.brand_id) OR
                  (dri2.item_type = 'line'  AND dri2.item_id = p.line_id) OR
                  (dri2.item_type = 'product' AND dri2.item_id = p.id)
              )
        ))
        OR
        -- Если список не передан, то используем старую логику (прямая скидка или правило)
        (array_length(@rule_ids::int[], 1) = 0 AND (d.id IS NOT NULL OR dr.discount_value IS NOT NULL))
    )
    -- Наличие на складе
    AND (sh.id IS NOT NULL AND sh.quantity > 0)
ORDER BY
    CASE WHEN @sort_type::int = 1 THEN p.name END ASC,
    CASE WHEN @sort_type::int = 2 THEN p.name END DESC,
    CASE WHEN @sort_type::int = 3 THEN p.minprice END ASC,
    CASE WHEN @sort_type::int = 4 THEN p.minprice END DESC,
    CASE WHEN @sort_type::int NOT IN (1,2,3,4) THEN p.name END ASC,
    p.id ASC
LIMIT CASE WHEN @limitval::integer > 0 THEN @limitval::integer ELSE 50 END
OFFSET CASE WHEN @offsetval::integer > 0 THEN @offsetval::integer ELSE 0 END;

-- ============================================================
-- COUNT (варианты)
-- ============================================================

-- name: CountProductsByFiltersBase :one
SELECT COUNT(*)
FROM products p
INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
WHERE 
    -- Только активные товары
    p.status = 'active'
    -- Если есть линия - она должна быть активна
    AND (p.line_id IS NULL OR bl.id IS NOT NULL)
    -- Размеры
    AND (
        COALESCE(array_length(@sizes::text[], 1), 0) = 0
        OR EXISTS (
            SELECT 1
            FROM jsonb_object_keys(p.sizes) AS size_key
            WHERE size_key = ANY(@sizes::text[])
              AND (p.sizes->size_key->>'price')::numeric > 0
        )
    )
    -- Поиск по имени/артикулу
    AND (
        @name::text IS NULL OR @name::text = ''
        OR p.name ILIKE '%' || @name::text || '%'
        OR p.article ILIKE '%' || @name::text || '%'
    )
    -- Категории
    AND (
        COALESCE(array_length(@categories::int[], 1), 0) = 0
        OR p.category = ANY(@categories::int[])
    )
    -- Типы продуктов
    AND (
        COALESCE(array_length(@product_types::int[], 1), 0) = 0
        OR p.type = ANY(@product_types::int[])
    )
    -- Бренды
    AND (
        COALESCE(array_length(@firms::int[], 1), 0) = 0
        OR p.brand_id = ANY(@firms::int[])
    )
    -- Линии
    AND (
        COALESCE(array_length(@lines::int[], 1), 0) = 0
        OR p.line_id = ANY(@lines::int[])
    )
    -- Bodytype
    AND (
        COALESCE(array_length(@bodytypes::text[], 1), 0) = 0
        OR p.bodytype = ANY(@bodytypes::body_enum[])
    )
    -- Цена
    AND (
        sqlc.narg('minprice')::int IS NULL OR p.maxprice >= sqlc.narg('minprice')::int
    )
    AND (
        sqlc.narg('maxprice')::int IS NULL OR p.minprice <= sqlc.narg('maxprice')::int
    )
    -- С ценой
    AND (
        @with_price::boolean IS NULL OR @with_price::boolean = false OR p.minprice > 0
    );

-- name: CountProductsByFiltersWithDiscount :one
SELECT COUNT(*)
FROM products p
INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
WHERE 
    -- Только активные товары
    p.status = 'active'
    -- Если есть линия - она должна быть активна
    AND (p.line_id IS NULL OR bl.id IS NOT NULL)
    -- Размеры
    AND (
        COALESCE(array_length(@sizes::text[], 1), 0) = 0
        OR EXISTS (
            SELECT 1
            FROM jsonb_object_keys(p.sizes) AS size_key
            WHERE size_key = ANY(@sizes::text[])
              AND (p.sizes->size_key->>'price')::numeric > 0
        )
    )
    -- Поиск по имени/артикулу
    AND (
        @name::text IS NULL OR @name::text = ''
        OR p.name ILIKE '%' || @name::text || '%'
        OR p.article ILIKE '%' || @name::text || '%'
    )
    -- Категории
    AND (
        COALESCE(array_length(@categories::int[], 1), 0) = 0
        OR p.category = ANY(@categories::int[])
    )
    -- Типы продуктов
    AND (
        COALESCE(array_length(@product_types::int[], 1), 0) = 0
        OR p.type = ANY(@product_types::int[])
    )
    -- Бренды
    AND (
        COALESCE(array_length(@firms::int[], 1), 0) = 0
        OR p.brand_id = ANY(@firms::int[])
    )
    -- Линии
    AND (
        COALESCE(array_length(@lines::int[], 1), 0) = 0
        OR p.line_id = ANY(@lines::int[])
    )
    -- Bodytype
    AND (
        COALESCE(array_length(@bodytypes::text[], 1), 0) = 0
        OR p.bodytype = ANY(@bodytypes::body_enum[])
    )
    -- Цена
    AND (
        sqlc.narg('minprice')::int IS NULL OR p.maxprice >= sqlc.narg('minprice')::int
    )
    AND (
        sqlc.narg('maxprice')::int IS NULL OR p.minprice <= sqlc.narg('maxprice')::int
    )
    -- С ценой
    AND (
        @with_price::boolean IS NULL OR @with_price::boolean = false OR p.minprice > 0
    )
    -- Скидки
    AND (
        -- Вариант 1: передан список правил
        (array_length(@rule_ids::int[], 1) > 0 AND EXISTS (
            SELECT 1
            FROM discount_rule_items dri2
            WHERE dri2.rule_id = ANY(@rule_ids::int[])
              AND (
                  (dri2.item_type = 'brand' AND dri2.item_id = p.brand_id) OR
                  (dri2.item_type = 'line'  AND dri2.item_id = p.line_id) OR
                  (dri2.item_type = 'product' AND dri2.item_id = p.id)
              )
              AND EXISTS (
                  SELECT 1 FROM discount_rules dr2
                  WHERE dr2.id = dri2.rule_id
                    AND dr2.is_active = true
                    AND dr2.starts_at <= NOW()
                    AND (dr2.ends_at IS NULL OR dr2.ends_at >= NOW())
              )
        ))
        OR
        -- Вариант 2: список правил не передан – используем старую логику
        (array_length(@rule_ids::int[], 1) = 0 AND (
            EXISTS (SELECT 1 FROM discount d WHERE d.productid = p.id)
            OR EXISTS (
                SELECT 1
                FROM discount_rule_items dri
                JOIN discount_rules dr2 ON dr2.id = dri.rule_id
                    AND dr2.is_active = true
                    AND dr2.starts_at <= NOW()
                    AND (dr2.ends_at IS NULL OR dr2.ends_at >= NOW())
                WHERE (dri.item_type = 'brand' AND dri.item_id = p.brand_id)
                   OR (dri.item_type = 'line'  AND dri.item_id = p.line_id)
                   OR (dri.item_type = 'product' AND dri.item_id = p.id)
            )
        ))
    );

-- name: CountProductsByFiltersWithStore :one
SELECT COUNT(*)
FROM products p
INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
WHERE 
    -- Только активные товары
    p.status = 'active'
    -- Если есть линия - она должна быть активна
    AND (p.line_id IS NULL OR bl.id IS NOT NULL)
    -- Размеры
    AND (
        COALESCE(array_length(@sizes::text[], 1), 0) = 0
        OR EXISTS (
            SELECT 1
            FROM jsonb_object_keys(p.sizes) AS size_key
            WHERE size_key = ANY(@sizes::text[])
              AND (p.sizes->size_key->>'price')::numeric > 0
        )
    )
    -- Поиск по имени/артикулу
    AND (
        @name::text IS NULL OR @name::text = ''
        OR p.name ILIKE '%' || @name::text || '%'
        OR p.article ILIKE '%' || @name::text || '%'
    )
    -- Категории
    AND (
        COALESCE(array_length(@categories::int[], 1), 0) = 0
        OR p.category = ANY(@categories::int[])
    )
    -- Типы продуктов
    AND (
        COALESCE(array_length(@product_types::int[], 1), 0) = 0
        OR p.type = ANY(@product_types::int[])
    )
    -- Бренды
    AND (
        COALESCE(array_length(@firms::int[], 1), 0) = 0
        OR p.brand_id = ANY(@firms::int[])
    )
    -- Линии
    AND (
        COALESCE(array_length(@lines::int[], 1), 0) = 0
        OR p.line_id = ANY(@lines::int[])
    )
    -- Bodytype
    AND (
        COALESCE(array_length(@bodytypes::text[], 1), 0) = 0
        OR p.bodytype = ANY(@bodytypes::body_enum[])
    )
    -- Цена
    AND (
        sqlc.narg('minprice')::int IS NULL OR p.maxprice >= sqlc.narg('minprice')::int
    )
    AND (
        sqlc.narg('maxprice')::int IS NULL OR p.minprice <= sqlc.narg('maxprice')::int
    )
    -- С ценой
    AND (
        @with_price::boolean IS NULL OR @with_price::boolean = false OR p.minprice > 0
    )
    -- Наличие на складе
    AND EXISTS (
        SELECT 1 FROM store_house sh
        WHERE sh.productid = p.id AND sh.quantity > 0
    );

-- name: CountProductsByFiltersFull :one
SELECT COUNT(*)
FROM products p
INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
WHERE 
    -- Только активные товары
    p.status = 'active'
    -- Если есть линия - она должна быть активна
    AND (p.line_id IS NULL OR bl.id IS NOT NULL)
    -- Размеры
    AND (
        COALESCE(array_length(@sizes::text[], 1), 0) = 0
        OR EXISTS (
            SELECT 1
            FROM jsonb_object_keys(p.sizes) AS size_key
            WHERE size_key = ANY(@sizes::text[])
              AND (p.sizes->size_key->>'price')::numeric > 0
        )
    )
    -- Статус (если нужен фильтр по статусу - оставляем, но для пользователей всегда active)
    AND (
        @status::text IS NULL OR @status::text = '' OR p.status = @status::text
    )
    -- Поиск по имени/артикулу
    AND (
        @name::text IS NULL OR @name::text = ''
        OR p.name ILIKE '%' || @name::text || '%'
        OR p.article ILIKE '%' || @name::text || '%'
    )
    -- Категории
    AND (
        COALESCE(array_length(@categories::int[], 1), 0) = 0
        OR p.category = ANY(@categories::int[])
    )
    -- Типы продуктов
    AND (
        COALESCE(array_length(@product_types::int[], 1), 0) = 0
        OR p.type = ANY(@product_types::int[])
    )
    -- Бренды
    AND (
        COALESCE(array_length(@firms::int[], 1), 0) = 0
        OR p.brand_id = ANY(@firms::int[])
    )
    -- Линии
    AND (
        COALESCE(array_length(@lines::int[], 1), 0) = 0
        OR p.line_id = ANY(@lines::int[])
    )
    -- Bodytype
    AND (
        COALESCE(array_length(@bodytypes::text[], 1), 0) = 0
        OR p.bodytype = ANY(@bodytypes::body_enum[])
    )
    -- Цена
    AND (
        sqlc.narg('minprice')::int IS NULL OR p.maxprice >= sqlc.narg('minprice')::int
    )
    AND (
        sqlc.narg('maxprice')::int IS NULL OR p.minprice <= sqlc.narg('maxprice')::int
    )
    -- С ценой
    AND (
        @with_price::boolean IS NULL OR @with_price::boolean = false OR p.minprice > 0
    )
    -- Скидки
    AND (
        (array_length(@rule_ids::int[], 1) > 0 AND EXISTS (
            SELECT 1
            FROM discount_rule_items dri2
            WHERE dri2.rule_id = ANY(@rule_ids::int[])
              AND (
                  (dri2.item_type = 'brand' AND dri2.item_id = p.brand_id) OR
                  (dri2.item_type = 'line'  AND dri2.item_id = p.line_id) OR
                  (dri2.item_type = 'product' AND dri2.item_id = p.id)
              )
              AND EXISTS (
                  SELECT 1 FROM discount_rules dr2
                  WHERE dr2.id = dri2.rule_id
                    AND dr2.is_active = true
                    AND dr2.starts_at <= NOW()
                    AND (dr2.ends_at IS NULL OR dr2.ends_at >= NOW())
              )
        ))
        OR
        (array_length(@rule_ids::int[], 1) = 0 AND (
            EXISTS (SELECT 1 FROM discount d WHERE d.productid = p.id)
            OR EXISTS (
                SELECT 1
                FROM discount_rule_items dri
                JOIN discount_rules dr2 ON dr2.id = dri.rule_id
                    AND dr2.is_active = true
                    AND dr2.starts_at <= NOW()
                    AND (dr2.ends_at IS NULL OR dr2.ends_at >= NOW())
                WHERE (dri.item_type = 'brand' AND dri.item_id = p.brand_id)
                   OR (dri.item_type = 'line'  AND dri.item_id = p.line_id)
                   OR (dri.item_type = 'product' AND dri.item_id = p.id)
            )
        ))
    )
    -- Наличие на складе
    AND EXISTS (
        SELECT 1 FROM store_house sh
        WHERE sh.productid = p.id AND sh.quantity > 0
    );

-- name: DeleteDiscount :exec
DELETE FROM discount
WHERE productid = $1;
-- name: BulkInsertDiscounts :exec
INSERT INTO discount (productid, value, minprice, maxdiscprice)
SELECT unnest(@product_ids::integer []),
    unnest(@discount_values::jsonb []),
    unnest(@min_prices::integer []),
    unnest(@max_disc_prices::integer []) ON CONFLICT (productid) DO
UPDATE
SET value = EXCLUDED.value,
    minprice = EXCLUDED.minprice,
    maxdiscprice = EXCLUDED.maxdiscprice,
    updated_at = NOW();
-- name: GetProductsBasicInfo :many
SELECT id,
    minprice,
    maxprice,
    sizes
FROM products
WHERE id = ANY(@product_ids::int []);
-- name: CreateDiscountRule :one
INSERT INTO discount_rules (
        name,
        description,
        discount_type,
        discount_value,
        starts_at,
        ends_at,
        priority
    )
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;
-- name: UpdateDiscountRule :one
UPDATE discount_rules
SET name = COALESCE($2, name),
    description = COALESCE($3, description),
    discount_type = COALESCE($4, discount_type),
    discount_value = COALESCE($5, discount_value),
    starts_at = COALESCE($6, starts_at),
    ends_at = $7,
    priority = COALESCE($8, priority),
    updated_at = NOW()
WHERE id = $1
RETURNING *;
-- name: DeleteDiscountRule :exec
DELETE FROM discount_rules
WHERE id = $1;
-- name: GetDiscountRule :one
SELECT *
FROM discount_rules
WHERE id = $1;


-- name: GetAllActiveDiscountRules :many
SELECT *
FROM discount_rules
WHERE is_active = true
  AND starts_at <= NOW()
  AND (ends_at IS NULL OR ends_at >= NOW())
ORDER BY priority DESC, created_at DESC;
-- name: GetDiscountRules :many
SELECT *
FROM discount_rules
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;
-- name: GetDiscountRulesCount :one
SELECT COUNT(*)
FROM discount_rules;
-- name: GetActiveDiscountRules :many
SELECT *
FROM discount_rules
WHERE is_active = true
    AND starts_at <= NOW()
    AND (
        ends_at IS NULL
        OR ends_at >= NOW()
    )
ORDER BY priority DESC;
-- name: ToggleDiscountRule :one
UPDATE discount_rules
SET is_active = NOT is_active,
    updated_at = NOW()
WHERE id = $1
RETURNING *;
-- ============================================
-- DISCOUNT RULE ITEMS
-- ============================================
-- name: AddRuleItem :exec
INSERT INTO discount_rule_items (rule_id, item_type, item_id)
VALUES ($1, $2, $3) ON CONFLICT (rule_id, item_type, item_id) DO NOTHING;
-- name: RemoveRuleItem :exec
DELETE FROM discount_rule_items
WHERE rule_id = $1
    AND item_type = $2
    AND item_id = $3;
-- name: GetRuleItems :many
SELECT dri.*,
    CASE
        WHEN dri.item_type = 'brand' THEN b.name
        WHEN dri.item_type = 'line' THEN bl.name
        WHEN dri.item_type = 'product' THEN p.name
    END as item_name
FROM discount_rule_items dri
    LEFT JOIN brands b ON dri.item_type = 'brand'
    AND dri.item_id = b.id
    LEFT JOIN brand_lines bl ON dri.item_type = 'line'
    AND dri.item_id = bl.id
    LEFT JOIN products p ON dri.item_type = 'product'
    AND dri.item_id = p.id
WHERE dri.rule_id = $1
ORDER BY dri.item_type,
    dri.item_id;
-- name: GetRuleItemsByType :many
SELECT *
FROM discount_rule_items
WHERE rule_id = $1
    AND item_type = $2;
-- name: DeleteAllRuleItems :exec
DELETE FROM discount_rule_items
WHERE rule_id = $1;
-- name: BulkAddRuleItems :exec
INSERT INTO discount_rule_items (rule_id, item_type, item_id)
SELECT 
    @rule_id::int,
    @item_type::text,
    unnest(@item_ids::int[])
ON CONFLICT (rule_id, item_type, item_id) DO NOTHING;
-- name: GetDiscountRulesByEntity :many
SELECT dr.*
FROM discount_rules dr
    JOIN discount_rule_items dri ON dri.rule_id = dr.id
WHERE dri.item_type = $1
    AND dri.item_id = $2
ORDER BY dr.priority DESC,
    dr.created_at DESC;
-- name: ClearDiscounts :exec
DELETE FROM discount;
-- name: GetDiscounts :many
SELECT d.productid,
    p.name AS product_name,
    p.article,
    d.value,
    d.minprice,
    d.maxdiscprice,
    d.created_at,
    d.updated_at
FROM discount d
    JOIN products p ON d.productid = p.id
ORDER BY d.created_at DESC
LIMIT $1 OFFSET $2;
-- name: GetDiscountsCount :one
SELECT COUNT(*)
FROM discount;
-- name: GetDiscountByProductID :one
SELECT d.productid,
    p.name AS product_name,
    p.article,
    d.value,
    d.minprice,
    d.maxdiscprice,
    d.created_at,
    d.updated_at
FROM discount d
    JOIN products p ON d.productid = p.id
WHERE d.productid = $1;
-- name: GetMainPageInfo :many
SELECT p.category,
    COUNT(*) OVER (PARTITION BY p.category) as category_product_count,
    p.id,
    b.name as firm,
    p.name,
    p.minprice,
    p.maxprice,
    p.image_path,
    p.bodytype
FROM (
        SELECT p.id,
            p.brand_id,
            p.name,
            p.minprice,
            p.maxprice,
            p.image_path,
            p.bodytype,
            p.category,
            ROW_NUMBER() OVER (
                PARTITION BY p.category
                ORDER BY p.id
            ) as row_num
        FROM products p
        WHERE p.minprice IS NOT NULL
            AND p.minprice > 0
            AND p.status = 'active'
    ) p
    JOIN brands b ON p.brand_id = b.id
    AND b.is_active = true
WHERE p.row_num <= sqlc.arg('products_per_category')::int
ORDER BY p.category,
    p.row_num;
-- name: CheckProductExists :one
SELECT EXISTS(
        SELECT 1
        FROM products
        WHERE products.article = $1
    ) as article_exists,
    EXISTS(
        SELECT 1
        FROM products
        WHERE products.name = $2
            AND products.brand_id = $3
    ) as name_firm_exists;
-- name: CheckCategoryExists :one
SELECT EXISTS(
        SELECT 1
        FROM product_categories
        WHERE enum_key = $1
    ) as exists;
-- name: CheckCategoryExistsById :one
SELECT EXISTS(
        SELECT 1
        FROM product_categories
        WHERE id = $1
    ) as exists;
-- name: CheckTypeExists :one
SELECT EXISTS(
        SELECT 1
        FROM product_types pt
            JOIN product_categories pc ON pt.category_id = pc.id
        WHERE pt.enum_key = @type
            AND pc.enum_key = @category
    ) as exists;
-- name: GetCategoryAndTypeByIDs :one
SELECT pc.id as category_id,
    pc.enum_key as category_key,
    pt.id as type_id,
    pt.enum_key as type_key,
    b.slug as brand_key
FROM product_categories pc
    CROSS JOIN product_types pt
    CROSS JOIN brands b
WHERE pc.id = @category_id
    AND pt.id = @type_id
    AND b.id = @brand_id
LIMIT 1;

-- name: GetTypeByID :one
SELECT 
    pt.type_name,
    pt.enum_key as type_key
FROM product_types pt
WHERE  pt.id = @type_id
LIMIT 1;
-- name: CheckTypeExistsByIds :one
SELECT EXISTS(
        SELECT 1
        FROM product_types pt
            JOIN product_categories pc ON pt.category_id = pc.id
        WHERE pt.id = @type
            AND pc.id = @category
    ) as exists;
-- name: CreateProductWithIds :one
INSERT INTO products (
        qId,
        name,
        brand_id,
        line_id,
        image_path,
        minprice,
        maxprice,
        article,
        date,
        description,
        image_count,
        type,
        category,
        sizes,
        bodytype
    )
VALUES (
        @q_id,
        @name,
        @brand_id,
        @line_id,
        @image_path,
        @minprice,
        @maxprice,
        @article,
        @date,
        @description,
        @image_count,
        @type_id,
        -- Прямой ID типа
        @category_id,
        -- Прямой ID категории
        @sizes::jsonb,
        @bodytype
    )
RETURNING id,
    qId,
    name,
    brand_id,
    line_id,
    image_path,
    minprice,
    maxprice,
    article,
    date,
    description,
    image_count,
    type,
    category,
    sizes,
    bodytype;
-- name: CreateProduct :one
INSERT INTO products (
        qId,
        name,
        brand_id,
        line_id,
        image_path,
        minprice,
        maxprice,
        article,
        date,
        description,
        image_count,
        type,
        category,
        sizes,
        bodytype
    )
VALUES (
        CONCAT(
            @brand_id,
            '_',
            @type_key,
            '_',
            floor(
                extract(
                    epoch
                    from now()
                ) * 1000
            )::bigint
        ),
        @name,
        @brand_id,
        @line_id,
        @image_path,
        @minprice,
        @maxprice,
        @article,
        @date,
        @description,
        @image_count,
        (
            SELECT pt.id
            FROM product_types pt
                JOIN product_categories pc ON pt.category_id = pc.id
            WHERE pt.enum_key = @type_key
                AND pc.enum_key = @category_key
        ),
        (
            SELECT id
            FROM product_categories
            WHERE enum_key = @category_key
        ),
        @sizes::jsonb,
        @bodytype
    )
RETURNING id,
    qId,
    name,
    brand_id,
    line_id,
    image_path,
    minprice,
    maxprice,
    article,
    date,
    description,
    image_count,
    type,
    category,
    sizes,
    bodytype;
-- name: DeleteHardProduct :one
DELETE FROM products
WHERE id = $1
RETURNING id,
    qId,
    name,
    brand_id,
    article,
    image_path,
    image_count;
-- name: SoftDeleteProduct :exec
UPDATE products
SET status = 'deleted',
    deleted_at = NOW()
WHERE id = $1
    AND status = 'active';
-- name: ArchiveProduct :exec
UPDATE products
SET status = 'archived',
    archived_at = NOW()
WHERE id = $1
    AND status = 'active';
-- name: RestoreProduct :exec
UPDATE products
SET status = 'active',
    deleted_at = NULL,
    archived_at = NULL
WHERE id = $1
    AND (
        status = 'deleted'
        OR status = 'archived'
    );
-- name: DraftProduct :exec
UPDATE products
SET status = 'draft'
WHERE id = $1
    AND status = 'active';
-- name: UpdateProduct :exec
UPDATE products
SET -- Обязательные поля (NULL не принимают)
    name = COALESCE(@name, name),
    brand_id    = COALESCE(@brand_id, brand_id),   
    line_id     = @line_id, 
    article = COALESCE(@article, article),
    bodytype = COALESCE(@bodytype, bodytype),
    category = COALESCE(@category, category),
    type = COALESCE(@type, type),
    -- Числовые поля
    minprice = COALESCE(@minprice, minprice),
    maxprice = COALESCE(@maxprice, maxprice),
    image_count = COALESCE(@image_count, image_count),
    -- JSON поле
    sizes = COALESCE(@sizes::jsonb, sizes),
    description = @description
WHERE id = @id
RETURNING id;
-- name: CheckProductExistsById :one
SELECT EXISTS(
        SELECT 1
        FROM products
        WHERE id = $1
    ) as exists;
-- name: UpdateProductStatus :exec
UPDATE products
SET status = @status
WHERE id = @id;

-- name: UpdateProductImageCount :exec
UPDATE products
SET image_count = $1
WHERE id = $2;
-- name: BulkUpdateProductStatus :exec
UPDATE products
SET status = @status,
    updated_at = NOW()
WHERE id = ANY(@product_ids::int []);
-- name: CreateBrand :one
INSERT INTO brands (
        name,
        slug,
        image_path,
        description,
        website,
        country,
        founded_year,
        is_active,
        sort_order
    )
VALUES (
        @name,
        @slug,
        @image_path,
        @description,
        @website,
        @country,
        @founded_year,
        COALESCE(@is_active, true),
        COALESCE(@sort_order, 0)
    )
RETURNING id,
    name,
    slug,
    image_path,
    description,
    website,
    country,
    founded_year,
    is_active,
    sort_order,
    created_at,
    updated_at;
-- name: GetBrandById :one
SELECT id,
    name,
    slug,
    image_path,
    description,
    website,
    country,
    founded_year,
    is_active,
    sort_order,
    created_at,
    updated_at
FROM brands
WHERE id = $1;
-- name: GetBrandBySlug :one
SELECT id,
    name,
    slug,
    image_path,
    description,
    website,
    country,
    founded_year,
    is_active,
    sort_order,
    created_at,
    updated_at
FROM brands
WHERE slug = $1;
-- name: GetActiveBrands :many
SELECT id,
    name,
    slug,
    image_path,
    description,
    website,
    country,
    founded_year,
    is_active,
    sort_order,
    created_at,
    updated_at
FROM brands
WHERE is_active = true
ORDER BY sort_order ASC,
    name ASC;
-- name: GetAllBrands :many
SELECT id,
    name,
    slug,
    image_path,
    description,
    website,
    country,
    founded_year,
    is_active,
    sort_order,
    created_at,
    updated_at
FROM brands
ORDER BY sort_order ASC,
    name ASC;
-- name: UpdateBrand :exec
UPDATE brands
SET 
    name = CASE 
        WHEN sqlc.narg('name')::text IS NOT NULL AND sqlc.narg('name')::text != '' 
        THEN sqlc.narg('name')::text 
        ELSE name 
    END,
    slug = CASE 
        WHEN sqlc.narg('slug')::text IS NOT NULL AND sqlc.narg('slug')::text != '' 
        THEN sqlc.narg('slug')::text 
        ELSE slug 
    END,
    
    image_path = COALESCE(sqlc.narg('image_path')::text, image_path),
    description = COALESCE(sqlc.narg('description')::text, description),
    website = COALESCE(sqlc.narg('website')::text, website),
    country = COALESCE(sqlc.narg('country')::text, country),
    founded_year = COALESCE(sqlc.narg('founded_year')::integer, founded_year),
    
    is_active = CASE 
        WHEN sqlc.narg('is_active')::boolean IS NOT NULL 
        THEN sqlc.narg('is_active')::boolean 
        ELSE is_active 
    END,
    
    sort_order = CASE 
        WHEN sqlc.narg('sort_order')::integer IS NOT NULL 
        THEN sqlc.narg('sort_order')::integer 
        ELSE sort_order 
    END,
    
    updated_at = NOW()
WHERE id = sqlc.arg('id')
RETURNING id;
-- name: RestoreBrand :exec
UPDATE brands
SET is_active = true
WHERE id = $1
    AND is_active = false;
-- name: ActivateBrand :exec
UPDATE brands
SET is_active = true,
    updated_at = NOW()
WHERE id = $1;
-- name: DeactivateBrand :exec
UPDATE brands
SET is_active = false,
    updated_at = NOW()
WHERE id = $1;
-- name: CheckBrandExistsById :one
SELECT EXISTS(
        SELECT 1
        FROM brands
        WHERE id = $1
    ) as exists;
-- name: CheckBrandExistsBySlug :one
SELECT EXISTS(
        SELECT 1
        FROM brands
        WHERE slug = $1
    ) as exists;
-- name: GetBrandsWithProductCount :many
SELECT b.id,
    b.name,
    b.slug,
    b.image_path,
    b.is_active,
    b.sort_order,
    COUNT(p.id) as product_count
FROM brands b
    LEFT JOIN products p ON b.id = p.brand_id
    AND p.status = 'active'
GROUP BY b.id
ORDER BY b.sort_order ASC,
    b.name ASC;
-- name: CreateBrandLine :one
INSERT INTO brand_lines (
        brand_id,
        name,
        slug,
        description,
        image_path,
        season,
        year,
        is_active,
        sort_order
    )
VALUES (
        @brand_id,
        @name,
        @slug,
        @description,
        @image_path,
        @season,
        @year,
        COALESCE(@is_active, true),
        COALESCE(@sort_order, 0)
    )
RETURNING id,
    brand_id,
    name,
    slug,
    description,
    image_path,
    season,
    year,
    is_active,
    sort_order,
    created_at,
    updated_at;
-- name: GetBrandLineById :one
SELECT id,
    brand_id,
    name,
    slug,
    description,
    image_path,
    season,
    year,
    is_active,
    sort_order,
    created_at,
    updated_at
FROM brand_lines
WHERE id = $1;
-- name: GetBrandLinesByBrandId :many
SELECT id,
    brand_id,
    name,
    slug,
    description,
    image_path,
    season,
    year,
    is_active,
    sort_order,
    created_at,
    updated_at
FROM brand_lines
WHERE brand_id = $1
    AND is_active = true
ORDER BY sort_order ASC,
    name ASC;
-- name: GetAllBrandLinesByBrandId :many
SELECT id,
    brand_id,
    name,
    slug,
    description,
    image_path,
    season,
    year,
    is_active,
    sort_order,
    created_at,
    updated_at
FROM brand_lines
WHERE brand_id = $1
ORDER BY sort_order ASC,
    name ASC;
-- name: GetActiveBrandLines :many
SELECT bl.id,
    bl.brand_id,
    bl.name,
    bl.slug,
    bl.description,
    bl.image_path,
    bl.season,
    bl.year,
    bl.is_active,
    bl.sort_order,
    bl.created_at,
    bl.updated_at,
    b.name as brand_name,
    b.slug as brand_slug
FROM brand_lines bl
    JOIN brands b ON bl.brand_id = b.id
WHERE bl.is_active = true
    AND b.is_active = true
ORDER BY b.sort_order ASC,
    bl.sort_order ASC,
    bl.name ASC;
-- name: UpdateBrandLine :exec
UPDATE brand_lines
SET brand_id = COALESCE(@brand_id, brand_id),
    name = COALESCE(@name, name),
    slug = COALESCE(@slug, slug),
    description = @description,
    image_path = @image_path,
    season = @season,
    year = @year,
    is_active = COALESCE(@is_active, is_active),
    sort_order = COALESCE(@sort_order, sort_order),
    updated_at = NOW()
WHERE id = @id
RETURNING id;
-- name: DeleteBrandLine :one
DELETE FROM brand_lines
WHERE id = $1
RETURNING id,
    name,
    brand_id;
-- name: SoftDeleteBrandLine :exec
UPDATE brand_lines
SET is_active = false
WHERE id = $1
    AND is_active = true;
-- name: RestoreBrandLine :exec
UPDATE brand_lines
SET is_active = true
WHERE id = $1
    AND is_active = false;
-- name: ActivateBrandLine :exec
UPDATE brand_lines
SET is_active = true,
    updated_at = NOW()
WHERE id = $1;
-- name: DeactivateBrandLine :exec
UPDATE brand_lines
SET is_active = false,
    updated_at = NOW()
WHERE id = $1;
-- name: CheckBrandLineExistsById :one
SELECT EXISTS(
        SELECT 1
        FROM brand_lines
        WHERE id = $1
    ) as exists;
-- name: CheckBrandLineExistsBySlug :one
SELECT EXISTS(
        SELECT 1
        FROM brand_lines
        WHERE slug = $1
    ) as exists;
-- name: GetBrandLinesByBrandSlug :many
SELECT bl.id,
    bl.name,
    bl.slug,
    bl.description,
    bl.image_path,
    bl.season,
    bl.year,
    bl.is_active
FROM brand_lines bl
    JOIN brands b ON bl.brand_id = b.id
WHERE b.slug = $1
    AND bl.is_active = true
    AND b.is_active = true
ORDER BY bl.sort_order ASC,
    bl.name ASC;
-- name: GetBrandLinesWithProductCount :many
SELECT bl.id,
    bl.name,
    bl.slug,
    bl.is_active,
    bl.sort_order,
    COUNT(p.id) as product_count
FROM brand_lines bl
    LEFT JOIN products p ON bl.id = p.line_id
    AND p.status = 'active'
WHERE bl.brand_id = $1
GROUP BY bl.id
ORDER BY bl.sort_order ASC,
    bl.name ASC;
-- name: GetAllBrandsWithLines :many
SELECT b.id,
    b.name,
    COALESCE(
        json_agg(
            json_build_object(
                'id',
                bl.id,
                'name',
                bl.name,
                'slug',
                bl.slug
            )
            ORDER BY bl.sort_order,
                bl.name
        ) FILTER (
            WHERE bl.id IS NOT NULL
        ),
        '[]'::json
    ) AS lines
FROM brands b
    LEFT JOIN brand_lines bl ON b.id = bl.brand_id
GROUP BY b.id,
    b.name
ORDER BY b.sort_order,
    b.name;
-- name: GetBrandsWithStats :many
SELECT b.id,
    b.name,
    b.slug,
    b.country,
    b.is_active,
    b.sort_order,
    b.created_at,
    COALESCE(s.total_products, 0) as total_products,
    COALESCE(s.active_products, 0) as active_products,
    COALESCE(s.inactive_products, 0) as inactive_products,
    COALESCE(s.sneakers_count, 0) as sneakers_count,
    COALESCE(s.merch_count, 0) as merch_count,
    COALESCE(s.clothes_count, 0) as clothes_count,
    COALESCE(s.toys_count, 0) as toys_count,
    COALESCE(s.lines_count, 0) as lines_count,
    COALESCE(
        (
            SELECT json_agg(
                    json_build_object('id', bl.id, 'name', bl.name, 'slug', bl.slug)
                    ORDER BY bl.sort_order
                )
            FROM brand_lines bl
            WHERE bl.brand_id = b.id
        ),
        '[]'::json
    ) AS lines
FROM brands b
    LEFT JOIN brands_stats s ON b.id = s.brand_id
WHERE (
        @name::text = ''
        OR b.name ILIKE '%' || @name::text || '%'
    )
ORDER BY CASE
        WHEN @sort_type::int = 1 THEN b.name
    END ASC,
    CASE
        WHEN @sort_type::int = 2 THEN b.name
    END DESC,
    CASE
        WHEN @sort_type::int = 3 THEN b.sort_order
    END ASC,
    CASE
        WHEN @sort_type::int = 4 THEN b.sort_order
    END DESC,
    CASE
        WHEN @sort_type::int = 5 THEN COALESCE(s.total_products, 0)
    END ASC,
    CASE
        WHEN @sort_type::int = 6 THEN COALESCE(s.total_products, 0)
    END DESC,
    CASE
        WHEN @sort_type::int = 7 THEN b.created_at
    END ASC,
    CASE
        WHEN @sort_type::int = 8 THEN b.created_at
    END DESC,
    b.sort_order ASC,
    b.id ASC
LIMIT @limit_val::integer OFFSET @offset_val::integer;
-- name: CountBrands :one
SELECT 
    COUNT(*) AS total_brands,
    COUNT(*) FILTER (WHERE b.is_active) AS total_active_brands,
    COUNT(*) FILTER (WHERE NOT b.is_active) AS total_inactive_brands
FROM brands b
WHERE (
    @name::text = ''
    OR b.name ILIKE '%' || @name::text || '%'
);


-- name: GetBrandsIds :many
SELECT 
    b.id
FROM brands b
WHERE (
    @name::text = ''
    OR b.name ILIKE '%' || @name::text || '%'
);

-- name: GetBrandsWithStatsAndDiscountsWithTotalCount :many
SELECT b.id,
    b.name,
    b.slug,
    b.country,
    b.is_active,
    b.sort_order,
    b.created_at,
    COALESCE(s.total_products, 0) as total_products,
    COALESCE(s.active_products, 0) as active_products,
    COALESCE(s.inactive_products, 0) as inactive_products,
    COALESCE(s.sneakers_count, 0) as sneakers_count,
    COALESCE(s.merch_count, 0) as merch_count,
    COALESCE(s.clothes_count, 0) as clothes_count,
    COALESCE(s.toys_count, 0) as toys_count,
    COALESCE(s.lines_count, 0) as lines_count,
    COALESCE(bd.discount_value, 0) as brand_discount_percent,
    COALESCE(
        (
            SELECT json_agg(
                    json_build_object(
                        'id', bl.id,
                        'name', bl.name,
                        'slug', bl.slug,
                        'discount_percent', ld.discount_value
                    )
                    ORDER BY bl.sort_order
                )
            FROM brand_lines bl
                LEFT JOIN LATERAL (
                    SELECT dr2.discount_value
                    FROM discount_rules dr2
                        JOIN discount_rule_items dri2 ON dri2.rule_id = dr2.id
                    WHERE dri2.item_type = 'line'
                        AND dri2.item_id = bl.id
                        AND dr2.is_active = true
                        AND dr2.starts_at <= NOW()
                        AND (
                            dr2.ends_at IS NULL
                            OR dr2.ends_at >= NOW()
                        )
                    ORDER BY dr2.priority DESC
                    LIMIT 1
                ) ld ON true
            WHERE bl.brand_id = b.id
        ),
        '[]'::json
    ) AS lines,
    COUNT(*) OVER() AS total_count
FROM brands b
    LEFT JOIN brands_stats s ON b.id = s.brand_id
    LEFT JOIN LATERAL (
        SELECT dr.discount_value
        FROM discount_rules dr
            JOIN discount_rule_items dri ON dri.rule_id = dr.id
        WHERE dri.item_type = 'brand'
            AND dri.item_id = b.id
            AND dr.is_active = true
            AND dr.starts_at <= NOW()
            AND (
                dr.ends_at IS NULL
                OR dr.ends_at >= NOW()
            )
        ORDER BY dr.priority DESC
        LIMIT 1
    ) bd ON true
WHERE (
        @name::text = ''
        OR b.name ILIKE '%' || @name::text || '%'
    )
ORDER BY CASE
        WHEN @sort_type::int = 1 THEN b.name
    END ASC,
    CASE
        WHEN @sort_type::int = 2 THEN b.name
    END DESC,
    CASE
        WHEN @sort_type::int = 3 THEN b.sort_order
    END ASC,
    CASE
        WHEN @sort_type::int = 4 THEN b.sort_order
    END DESC,
    CASE
        WHEN @sort_type::int = 5 THEN COALESCE(s.total_products, 0)
    END ASC,
    CASE
        WHEN @sort_type::int = 6 THEN COALESCE(s.total_products, 0)
    END DESC,
    CASE
        WHEN @sort_type::int = 7 THEN b.created_at
    END ASC,
    CASE
        WHEN @sort_type::int = 8 THEN b.created_at
    END DESC,
    CASE
        WHEN @sort_type::int = 9 THEN COALESCE(s.lines_count, 0)
        ELSE 0
    END ASC,
    CASE
        WHEN @sort_type::int = 10 THEN COALESCE(s.lines_count, 0)
        ELSE 0
    END DESC,
    CASE
        WHEN @sort_type::int = 11 THEN b.is_active::int
        ELSE 0
    END ASC,
    CASE
        WHEN @sort_type::int = 12 THEN b.is_active::int
        ELSE 0
    END DESC,
    CASE
        WHEN @sort_type::int = 13 THEN bd.discount_value
        ELSE 0
    END ASC NULLS LAST,
    CASE
        WHEN @sort_type::int = 14 THEN bd.discount_value
        ELSE 0
    END DESC NULLS LAST,
    b.sort_order ASC,
    b.id ASC
LIMIT @limit_val::integer OFFSET @offset_val::integer;
-- name: GetBrandsWithStatsAndDiscounts :many
SELECT b.id,
    b.name,
    b.slug,
    b.country,
    b.is_active,
    b.sort_order,
    b.created_at,
    b.image_path,
    COALESCE(s.total_products, 0) as total_products,
    COALESCE(s.active_products, 0) as active_products,
    COALESCE(s.inactive_products, 0) as inactive_products,
    COALESCE(s.sneakers_count, 0) as sneakers_count,
    COALESCE(s.merch_count, 0) as merch_count,
    COALESCE(s.clothes_count, 0) as clothes_count,
    COALESCE(s.toys_count, 0) as toys_count,
    COALESCE(s.lines_count, 0) as lines_count,
    COALESCE(bd.discount_value, 0) as brand_discount_percent,
    COALESCE(
        (
            SELECT json_agg(
                    json_build_object(
                        'id',
                        bl.id,
                        'name',
                        bl.name,
                        'slug',
                        bl.slug,
                        'discount_percent',
                        ld.discount_value
                    )
                    ORDER BY bl.sort_order
                )
            FROM brand_lines bl
                LEFT JOIN LATERAL (
                    SELECT dr2.discount_value
                    FROM discount_rules dr2
                        JOIN discount_rule_items dri2 ON dri2.rule_id = dr2.id
                    WHERE dri2.item_type = 'line'
                        AND dri2.item_id = bl.id
                        AND dr2.is_active = true
                        AND dr2.starts_at <= NOW()
                        AND (
                            dr2.ends_at IS NULL
                            OR dr2.ends_at >= NOW()
                        )
                    ORDER BY dr2.priority DESC
                    LIMIT 1
                ) ld ON true
            WHERE bl.brand_id = b.id
        ),
        '[]'::json
    ) AS lines
FROM brands b
    LEFT JOIN brands_stats s ON b.id = s.brand_id
    LEFT JOIN LATERAL (
        SELECT dr.discount_value
        FROM discount_rules dr
            JOIN discount_rule_items dri ON dri.rule_id = dr.id
        WHERE dri.item_type = 'brand'
            AND dri.item_id = b.id
            AND dr.is_active = true
            AND dr.starts_at <= NOW()
            AND (
                dr.ends_at IS NULL
                OR dr.ends_at >= NOW()
            )
        ORDER BY dr.priority DESC
        LIMIT 1
    ) bd ON true
WHERE (
        @name::text = ''
        OR b.name ILIKE '%' || @name::text || '%'
    )
ORDER BY CASE
        WHEN @sort_type::int = 1 THEN b.name
    END ASC,
    CASE
        WHEN @sort_type::int = 2 THEN b.name
    END DESC,
    CASE
        WHEN @sort_type::int = 3 THEN b.sort_order
    END ASC,
    CASE
        WHEN @sort_type::int = 4 THEN b.sort_order
    END DESC,
    CASE
        WHEN @sort_type::int = 5 THEN COALESCE(s.total_products, 0)
    END ASC,
    CASE
        WHEN @sort_type::int = 6 THEN COALESCE(s.total_products, 0)
    END DESC,
    CASE
        WHEN @sort_type::int = 7 THEN b.created_at
    END ASC,
    CASE
        WHEN @sort_type::int = 8 THEN b.created_at
    END DESC,
    CASE
        WHEN @sort_type::int = 9 THEN COALESCE(s.lines_count, 0)
        ELSE 0
    END ASC,
    CASE
        WHEN @sort_type::int = 10 THEN COALESCE(s.lines_count, 0)
        ELSE 0
    END DESC,
    CASE
        WHEN @sort_type::int = 11 THEN b.is_active::int
        ELSE 0
    END ASC,
    CASE
        WHEN @sort_type::int = 12 THEN b.is_active::int
        ELSE 0
    END DESC,
    CASE
        WHEN @sort_type::int = 13 THEN bd.discount_value
        ELSE 0
    END ASC NULLS LAST,
    CASE
        WHEN @sort_type::int = 14 THEN bd.discount_value
        ELSE 0
    END DESC NULLS LAST,
    b.sort_order ASC,
    b.id ASC
LIMIT @limit_val::integer OFFSET @offset_val::integer;


-- name: GetBrandByIDWithDiscount :one
SELECT b.id,
    b.name,
    b.slug,
    b.country,
    b.website,
    b.description,
    b.image_path,
    b.is_active,
    b.sort_order,
    b.created_at,
    b.updated_at,
    COALESCE(p.total_products, 0) as total_products,
    COALESCE(p.active_products, 0) as active_products,
    COALESCE(p.inactive_products, 0) as inactive_products,
    COALESCE(p.sneakers_total, 0) as sneakers_total,
    COALESCE(p.sneakers_active, 0) as sneakers_active,
    COALESCE(p.sneakers_inactive, 0) as sneakers_inactive,
    COALESCE(p.merch_total, 0) as merch_total,
    COALESCE(p.merch_active, 0) as merch_active,
    COALESCE(p.merch_inactive, 0) as merch_inactive,
    COALESCE(p.clothes_total, 0) as clothes_total,
    COALESCE(p.clothes_active, 0) as clothes_active,
    COALESCE(p.clothes_inactive, 0) as clothes_inactive,
    COALESCE(p.toys_total, 0) as toys_total,
    COALESCE(p.toys_active, 0) as toys_active,
    COALESCE(p.toys_inactive, 0) as toys_inactive,
    -- Активная скидка на бренд
    (
        SELECT dr.discount_value
        FROM discount_rules dr
            JOIN discount_rule_items dri ON dri.rule_id = dr.id
        WHERE dri.item_type = 'brand'
            AND dri.item_id = b.id
            AND dr.is_active = true
            AND dr.starts_at <= NOW()
            AND (
                dr.ends_at IS NULL
                OR dr.ends_at >= NOW()
            )
        ORDER BY dr.priority DESC
        LIMIT 1
    ) as brand_discount_percent,
    (
        SELECT dr.name
        FROM discount_rules dr
            JOIN discount_rule_items dri ON dri.rule_id = dr.id
        WHERE dri.item_type = 'brand'
            AND dri.item_id = b.id
            AND dr.is_active = true
            AND dr.starts_at <= NOW()
            AND (
                dr.ends_at IS NULL
                OR dr.ends_at >= NOW()
            )
        ORDER BY dr.priority DESC
        LIMIT 1
    ) as brand_discount_name,
    COALESCE(
        (
            SELECT json_agg(
                    json_build_object(
                        'id',
                        bl.id,
                        'name',
                        bl.name,
                        'slug',
                        bl.slug,
                        'total_products',
                        COALESCE(lp.total_products, 0),
                        'active_products',
                        COALESCE(lp.active_products, 0),
                        'inactive_products',
                        COALESCE(lp.inactive_products, 0),
                        'discount_percent',
                        line_discount.discount_value,
                        'discount_name',
                        line_discount.discount_name
                    )
                    ORDER BY bl.sort_order
                )
            FROM brand_lines bl
                LEFT JOIN (
                    SELECT p.line_id,
                        COUNT(*) as total_products,
                        COUNT(
                            CASE
                                WHEN p.status = 'active' THEN 1
                            END
                        ) as active_products,
                        COUNT(
                            CASE
                                WHEN p.status != 'active' THEN 1
                            END
                        ) as inactive_products
                    FROM products p
                    WHERE p.brand_id = @brand_id::int
                    GROUP BY p.line_id
                ) lp ON lp.line_id = bl.id
                LEFT JOIN LATERAL (
                    SELECT dr2.discount_value,
                        dr2.name as discount_name
                    FROM discount_rules dr2
                        JOIN discount_rule_items dri2 ON dri2.rule_id = dr2.id
                    WHERE dri2.item_type = 'line'
                        AND dri2.item_id = bl.id
                        AND dr2.is_active = true
                        AND dr2.starts_at <= NOW()
                        AND (
                            dr2.ends_at IS NULL
                            OR dr2.ends_at >= NOW()
                        )
                    ORDER BY dr2.priority DESC
                    LIMIT 1
                ) line_discount ON true
            WHERE bl.brand_id = b.id
        ),
        '[]'::json
    ) AS lines
FROM brands b
    LEFT JOIN (
        SELECT brand_id,
            COUNT(*) as total_products,
            COUNT(
                CASE
                    WHEN status = 'active' THEN 1
                END
            ) as active_products,
            COUNT(
                CASE
                    WHEN status != 'active' THEN 1
                END
            ) as inactive_products,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'sneakers' THEN 1
                END
            ) as sneakers_total,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'sneakers'
                    AND p.status = 'active' THEN 1
                END
            ) as sneakers_active,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'sneakers'
                    AND p.status != 'active' THEN 1
                END
            ) as sneakers_inactive,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'merch' THEN 1
                END
            ) as merch_total,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'merch'
                    AND p.status = 'active' THEN 1
                END
            ) as merch_active,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'merch'
                    AND p.status != 'active' THEN 1
                END
            ) as merch_inactive,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'clothes' THEN 1
                END
            ) as clothes_total,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'clothes'
                    AND p.status = 'active' THEN 1
                END
            ) as clothes_active,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'clothes'
                    AND p.status != 'active' THEN 1
                END
            ) as clothes_inactive,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'toys' THEN 1
                END
            ) as toys_total,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'toys'
                    AND p.status = 'active' THEN 1
                END
            ) as toys_active,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'toys'
                    AND p.status != 'active' THEN 1
                END
            ) as toys_inactive
        FROM products p
            LEFT JOIN product_categories pc ON p.category = pc.id
        WHERE p.brand_id = @brand_id::int
        GROUP BY brand_id
    ) p ON p.brand_id = b.id
WHERE b.id = @brand_id::int;
-- name: GetBrandByID :one
SELECT b.id,
    b.name,
    b.slug,
    b.country,
    b.website,
    b.description,
    b.image_path,
    b.is_active,
    b.sort_order,
    b.created_at,
    b.updated_at,
    COALESCE(p.total_products, 0) as total_products,
    COALESCE(p.active_products, 0) as active_products,
    COALESCE(p.inactive_products, 0) as inactive_products,
    -- Статистика по категориям для всей фирмы
    COALESCE(p.sneakers_total, 0) as sneakers_total,
    COALESCE(p.sneakers_active, 0) as sneakers_active,
    COALESCE(p.sneakers_inactive, 0) as sneakers_inactive,
    COALESCE(p.merch_total, 0) as merch_total,
    COALESCE(p.merch_active, 0) as merch_active,
    COALESCE(p.merch_inactive, 0) as merch_inactive,
    COALESCE(p.clothes_total, 0) as clothes_total,
    COALESCE(p.clothes_active, 0) as clothes_active,
    COALESCE(p.clothes_inactive, 0) as clothes_inactive,
    COALESCE(p.toys_total, 0) as toys_total,
    COALESCE(p.toys_active, 0) as toys_active,
    COALESCE(p.toys_inactive, 0) as toys_inactive,
    COALESCE(
        (
            SELECT json_agg(
                    json_build_object(
                        'id',
                        bl.id,
                        'name',
                        bl.name,
                        'slug',
                        bl.slug,
                        'total_products',
                        COALESCE(lp.total_products, 0),
                        'active_products',
                        COALESCE(lp.active_products, 0),
                        'inactive_products',
                        COALESCE(lp.inactive_products, 0)
                    )
                    ORDER BY bl.sort_order
                )
            FROM brand_lines bl
                LEFT JOIN (
                    SELECT p.line_id,
                        COUNT(*) as total_products,
                        COUNT(
                            CASE
                                WHEN p.status = 'active' THEN 1
                            END
                        ) as active_products,
                        COUNT(
                            CASE
                                WHEN p.status != 'active' THEN 1
                            END
                        ) as inactive_products
                    FROM products p
                    WHERE p.brand_id = @brand_id::int
                    GROUP BY p.line_id
                ) lp ON lp.line_id = bl.id
            WHERE bl.brand_id = b.id
        ),
        '[]'::json
    ) AS lines
FROM brands b
    LEFT JOIN (
        SELECT brand_id,
            COUNT(*) as total_products,
            COUNT(
                CASE
                    WHEN status = 'active' THEN 1
                END
            ) as active_products,
            COUNT(
                CASE
                    WHEN status != 'active' THEN 1
                END
            ) as inactive_products,
            -- Sneakers
            COUNT(
                CASE
                    WHEN pc.enum_key = 'sneakers' THEN 1
                END
            ) as sneakers_total,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'sneakers'
                    AND p.status = 'active' THEN 1
                END
            ) as sneakers_active,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'sneakers'
                    AND p.status != 'active' THEN 1
                END
            ) as sneakers_inactive,
            -- Merch
            COUNT(
                CASE
                    WHEN pc.enum_key = 'merch' THEN 1
                END
            ) as merch_total,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'merch'
                    AND p.status = 'active' THEN 1
                END
            ) as merch_active,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'merch'
                    AND p.status != 'active' THEN 1
                END
            ) as merch_inactive,
            -- Clothes
            COUNT(
                CASE
                    WHEN pc.enum_key = 'clothes' THEN 1
                END
            ) as clothes_total,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'clothes'
                    AND p.status = 'active' THEN 1
                END
            ) as clothes_active,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'clothes'
                    AND p.status != 'active' THEN 1
                END
            ) as clothes_inactive,
            -- Toys
            COUNT(
                CASE
                    WHEN pc.enum_key = 'toys' THEN 1
                END
            ) as toys_total,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'toys'
                    AND p.status = 'active' THEN 1
                END
            ) as toys_active,
            COUNT(
                CASE
                    WHEN pc.enum_key = 'toys'
                    AND p.status != 'active' THEN 1
                END
            ) as toys_inactive
        FROM products p
            LEFT JOIN product_categories pc ON p.category = pc.id
        WHERE p.brand_id = @brand_id::int
        GROUP BY brand_id
    ) p ON p.brand_id = b.id
WHERE b.id = @brand_id::int;




-- name: GetAllActiveDiscounts :many
SELECT
    (COALESCE(
        CASE WHEN di.item_type = 'product' THEN di.item_id END,
        CASE WHEN di.item_type = 'brand'   THEN p_brand.id END,
        CASE WHEN di.item_type = 'line'    THEN p_line.id END
    ))::int AS product_id,
    dr.discount_value,
    dr.discount_type,
    dr.priority,
    dr.id AS rule_id
FROM discount_rule_items di
JOIN discount_rules dr ON di.rule_id = dr.id
LEFT JOIN products p_brand ON di.item_type = 'brand' AND p_brand.brand_id = di.item_id AND p_brand.status != 'deleted'
LEFT JOIN products p_line  ON di.item_type = 'line'  AND p_line.line_id  = di.item_id AND p_line.status != 'deleted'
WHERE dr.is_active = true
  AND dr.starts_at <= NOW()
  AND (dr.ends_at IS NULL OR dr.ends_at >= NOW())
  AND (
       (di.item_type = 'product')
    OR (di.item_type = 'brand'   AND p_brand.id IS NOT NULL)
    OR (di.item_type = 'line'    AND p_line.id IS NOT NULL)
  )
ORDER BY product_id, dr.priority DESC, dr.discount_value DESC;


-- name: BulkUpsertDiscount :exec
INSERT INTO discount (productid, value, minprice, maxdiscprice)
SELECT
    unnest(@product_ids::int[]),
    unnest(@values::jsonb[]),
    unnest(@min_prices::int[]),
    unnest(@max_disc_prices::int[])
ON CONFLICT (productid) DO UPDATE SET
    value = EXCLUDED.value,
    minprice = EXCLUDED.minprice,
    maxdiscprice = EXCLUDED.maxdiscprice,
    updated_at = NOW();

-- name: DeleteAllRuleBasedDiscounts :exec
DELETE FROM discount
WHERE value::text LIKE '%"rule_id"%';