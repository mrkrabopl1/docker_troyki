-- name: CreateCollection :one
INSERT INTO collections (
    slug, name, description, type, settings, is_active
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetCollectionByID :one
SELECT * FROM collections WHERE id = $1;

-- name: GetCollectionBySlug :one
SELECT * FROM collections WHERE slug = $1 AND is_active = true;

-- name: GetAllCollections :many
SELECT * FROM collections;

-- name: GetActiveCollections :many
SELECT * FROM collections WHERE is_active = true;

-- name: UpdateCollection :one
UPDATE collections SET
    slug = COALESCE($2, slug),
    name = COALESCE($3, name),
    description = COALESCE($4, description),
    type = COALESCE($5, type),
    settings = COALESCE($6, settings),
    is_active = COALESCE($7, is_active),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeleteCollection :exec
DELETE FROM collections WHERE id = $1;

-- name: AddProductsToCollection :exec
INSERT INTO collection_products (collection_id, product_id)
SELECT @collection_id, unnest(@product_ids::int[])
ON CONFLICT (collection_id, product_id) DO NOTHING;

-- name: RemoveProductsFromCollection :exec
DELETE FROM collection_products 
WHERE collection_id = @collection_id AND product_id = ANY(@product_ids::int[]);

-- name: GetCollectionProductIDs :many
SELECT product_id FROM collection_products 
WHERE collection_id = $1;


-- name: ClearCollectionProducts :exec
DELETE FROM collection_products WHERE collection_id = $1;

-- name: GetCollectionProductCount :one
SELECT COUNT(*)::int FROM collection_products WHERE collection_id = $1;

-- name: GetCollectionWithProducts :many
SELECT 
    c.*,
    p.id as product_id,
    p.name as product_name,
    p.minprice,
    p.image_path
FROM collections c
LEFT JOIN collection_products cp ON c.id = cp.collection_id
LEFT JOIN products p ON cp.product_id = p.id
WHERE c.id = $1 AND c.is_active = true;


-- name: GetManualCollectionProducts :many
SELECT
    p.id as global_id,
    p.image_path,
    p.name,
    b.name as firm,
    p.type,
    p.sizes as sizes_jsonb,
    p.minprice,
    p.maxprice,
    COALESCE(
        (SELECT discount_percent::int FROM discount d WHERE d.productid = p.id ORDER BY discount_percent DESC LIMIT 1),
        0
    )::int AS discount_percent,
    COALESCE(
        (SELECT original_price::int FROM discount d WHERE d.productid = p.id ORDER BY discount_percent DESC LIMIT 1),
        0
    )::int AS original_price,
    COALESCE(
        (SELECT discounted_price::int FROM discount d WHERE d.productid = p.id ORDER BY discount_percent DESC LIMIT 1),
        0
    )::int AS discounted_price,
    COALESCE(
        (SELECT min_price::int FROM discount d WHERE d.productid = p.id ORDER BY discount_percent DESC LIMIT 1),
        p.minprice
    )::int AS min_price,
    COALESCE(
        (SELECT max_price::int FROM discount d WHERE d.productid = p.id ORDER BY discount_percent DESC LIMIT 1),
        p.maxprice
    )::int AS max_price,
    EXISTS (
        SELECT 1 
        FROM store_house sh 
        WHERE sh.productid = p.id 
        AND sh.quantity > 0
    ) AS in_store
FROM products p
JOIN collection_products cp ON p.id = cp.product_id
JOIN brands b ON p.brand_id = b.id AND b.is_active = true
WHERE cp.collection_id = $1
ORDER BY cp.created_at ASC
LIMIT $2 OFFSET $3;



-- name: GetFullFiltersForCollection :one
WITH 
collection_products_base AS (
    SELECT p.id
    FROM products p
    INNER JOIN collection_products cp ON p.id = cp.product_id
    WHERE cp.collection_id = sqlc.arg(collection_id)::int
        AND p.status = 'active'
),
filtered_products_by_collection AS (
    SELECT p.id
    FROM products p
    WHERE p.status = 'active'
        AND (CASE WHEN COALESCE(array_length(sqlc.arg(collection_type_ids)::int[], 1), 0) = 0 
                  THEN TRUE 
                  ELSE p.type = ANY(sqlc.arg(collection_type_ids)::int[]) END)
        AND (CASE WHEN COALESCE(array_length(sqlc.arg(collection_category_ids)::int[], 1), 0) = 0 
                  THEN TRUE 
                  ELSE p.category = ANY(sqlc.arg(collection_category_ids)::int[]) END)
        AND (CASE WHEN COALESCE(array_length(sqlc.arg(collection_brand_ids)::int[], 1), 0) = 0 
                  THEN TRUE 
                  ELSE p.brand_id = ANY(sqlc.arg(collection_brand_ids)::int[]) END)
        AND (CASE WHEN COALESCE(array_length(sqlc.arg(collection_line_ids)::int[], 1), 0) = 0 
                  THEN TRUE 
                  ELSE p.line_id = ANY(sqlc.arg(collection_line_ids)::int[]) END)
        AND (CASE WHEN COALESCE(array_length(sqlc.arg(collection_body_types)::text[], 1), 0) = 0 
                  THEN TRUE 
                  ELSE p.bodytype::text = ANY(sqlc.arg(collection_body_types)::text[]) END)
        AND (CASE WHEN sqlc.arg(collection_price_min)::int = 0 
                  THEN TRUE 
                  ELSE p.maxprice >= sqlc.arg(collection_price_min) END)
        AND (CASE WHEN sqlc.arg(collection_price_max)::int = 0 
                  THEN TRUE 
                  ELSE p.minprice <= sqlc.arg(collection_price_max) END)
        AND (CASE WHEN COALESCE(array_length(sqlc.arg(collection_sizes)::text[], 1), 0) = 0 
                  THEN TRUE 
                  ELSE EXISTS (
                      SELECT 1 FROM product_sizes ps 
                      WHERE ps.product_id = p.id 
                        AND ps.size_key = ANY(sqlc.arg(collection_sizes)::text[]) 
                        AND ps.price > 0
                  ) END)
        AND (CASE WHEN sqlc.arg(collection_in_store)::boolean = false 
                  THEN TRUE 
                  ELSE EXISTS (
                      SELECT 1 FROM store_house sh 
                      WHERE sh.productid = p.id 
                        AND sh.quantity > 0
                  ) END)
        AND (CASE WHEN COALESCE(array_length(sqlc.arg(collection_rule_ids)::int[], 1), 0) = 0 
                  THEN TRUE 
                  ELSE EXISTS (
                      SELECT 1 FROM discount d 
                      WHERE d.productid = p.id 
                        AND d.rule_id = ANY(sqlc.arg(collection_rule_ids)::int[]) 
                        AND d.discount_percent > 0
                  ) END)
),
combined_products AS (
    SELECT id FROM collection_products_base
    UNION
    SELECT id FROM filtered_products_by_collection
)
SELECT
    -- Sizes
    (SELECT COALESCE(jsonb_object_agg(size_key, cnt), '{}'::jsonb)
     FROM (SELECT ps.size_key, COUNT(*) AS cnt
           FROM product_sizes ps
           WHERE ps.product_id IN (SELECT id FROM combined_products) AND ps.price > 0
           GROUP BY ps.size_key) s
    ) AS sizes,
    -- Bodytypes
    (SELECT COALESCE(jsonb_object_agg(bodytype::text, count), '{}'::jsonb)
     FROM (SELECT p.bodytype, COUNT(*) AS count
           FROM products p
           WHERE p.id IN (SELECT id FROM combined_products) AND p.bodytype IS NOT NULL
           GROUP BY p.bodytype) bt
    ) AS bodytypes,
    -- Min price
    (SELECT COALESCE(MIN(minprice), 0) FROM products WHERE id IN (SELECT id FROM combined_products)) AS min_price,
    -- Max price
    (SELECT COALESCE(MAX(maxprice), 0) FROM products WHERE id IN (SELECT id FROM combined_products)) AS max_price,
    -- Firms
    (SELECT COALESCE(jsonb_object_agg(name, cnt), '{}'::jsonb)
     FROM (SELECT b.name, COUNT(*) AS cnt
           FROM products p
           JOIN brands b ON p.brand_id = b.id
           WHERE p.id IN (SELECT id FROM combined_products)
           GROUP BY b.name) f
    ) AS firms,
    -- Product types
    (SELECT COALESCE(jsonb_agg(DISTINCT type), '[]'::jsonb)
     FROM products
     WHERE id IN (SELECT id FROM combined_products) AND type IS NOT NULL
    ) AS product_types,
    -- Categories
    (SELECT COALESCE(jsonb_agg(DISTINCT category), '[]'::jsonb)
     FROM products
     WHERE id IN (SELECT id FROM combined_products) AND category IS NOT NULL
    ) AS categories,
    -- Discount rules
    (SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', dr.id, 
            'name', dr.name, 
            'discount_type', dr.discount_type, 
            'discount_value', dr.discount_value, 
            'priority', dr.priority
        )
     ), '[]'::jsonb)
     FROM discount_rules dr
     WHERE dr.is_active = true 
       AND dr.starts_at <= NOW() 
       AND (dr.ends_at IS NULL OR dr.ends_at > NOW())
       AND dr.id IN (
           SELECT DISTINCT d.rule_id 
           FROM discount d 
           WHERE d.productid IN (SELECT id FROM combined_products) 
             AND d.discount_percent > 0
       )
    ) AS discount_rules;



-- name: GetFullFiltersForManualCollection :one
WITH 
collection_products_base AS (
    SELECT p.id
    FROM products p
    INNER JOIN collection_products cp ON p.id = cp.product_id
    WHERE cp.collection_id = sqlc.arg(collection_id)::int
        AND p.status = 'active'
)
SELECT
    -- Sizes
    (SELECT COALESCE(jsonb_object_agg(size_key, cnt), '{}'::jsonb)
     FROM (SELECT ps.size_key, COUNT(*) AS cnt
           FROM product_sizes ps
           WHERE ps.product_id IN (SELECT id FROM collection_products_base) 
             AND ps.price > 0
           GROUP BY ps.size_key) s
    ) AS sizes,
    -- Bodytypes
    (SELECT COALESCE(jsonb_object_agg(bodytype::text, count), '{}'::jsonb)
     FROM (SELECT p.bodytype, COUNT(*) AS count
           FROM products p
           WHERE p.id IN (SELECT id FROM collection_products_base) 
             AND p.bodytype IS NOT NULL
           GROUP BY p.bodytype) bt
    ) AS bodytypes,
    -- Min price
    (SELECT COALESCE(MIN(minprice), 0) 
     FROM products 
     WHERE id IN (SELECT id FROM collection_products_base)
    ) AS min_price,
    -- Max price
    (SELECT COALESCE(MAX(maxprice), 0) 
     FROM products 
     WHERE id IN (SELECT id FROM collection_products_base)
    ) AS max_price,
    -- Firms
    (SELECT COALESCE(jsonb_object_agg(name, cnt), '{}'::jsonb)
     FROM (SELECT b.name, COUNT(*) AS cnt
           FROM products p
           JOIN brands b ON p.brand_id = b.id
           WHERE p.id IN (SELECT id FROM collection_products_base)
           GROUP BY b.name) f
    ) AS firms,
    -- Product types
    (SELECT COALESCE(jsonb_agg(DISTINCT type), '[]'::jsonb)
     FROM products
     WHERE id IN (SELECT id FROM collection_products_base) 
       AND type IS NOT NULL
    ) AS product_types,
    -- Categories
    (SELECT COALESCE(jsonb_agg(DISTINCT category), '[]'::jsonb)
     FROM products
     WHERE id IN (SELECT id FROM collection_products_base) 
       AND category IS NOT NULL
    ) AS categories,
    -- Discount rules
    (SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', dr.id, 
            'name', dr.name, 
            'discount_type', dr.discount_type, 
            'discount_value', dr.discount_value, 
            'priority', dr.priority
        )
     ), '[]'::jsonb)
     FROM discount_rules dr
     WHERE dr.is_active = true 
       AND dr.starts_at <= NOW() 
       AND (dr.ends_at IS NULL OR dr.ends_at > NOW())
       AND dr.id IN (
           SELECT DISTINCT d.rule_id 
           FROM discount d 
           WHERE d.productid IN (SELECT id FROM collection_products_base) 
             AND d.discount_percent > 0
       )
    ) AS discount_rules;    


-- name: GetProductsForCollectionByFiltersPaginateFull :many
SELECT * FROM (
    -- Часть 1: ВСЕ товары из коллекции (БЕЗ ФИЛЬТРОВ!)
    SELECT 
        p.id, 
        p.name, 
        p.image_path,
        b.name as firm,
        COALESCE(
            (SELECT discount_percent::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            0
        )::int AS discount_percent,
        COALESCE(
            (SELECT original_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            0
        )::int AS original_price,
        COALESCE(
            (SELECT discounted_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            p.minprice
        )::int AS discounted_price,
        COALESCE(
            (SELECT min_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            p.minprice
        )::int AS min_price,
        COALESCE(
            (SELECT max_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            p.maxprice
        )::int AS max_price,
        EXISTS (
            SELECT 1 FROM discount d WHERE d.productid = p.id
        ) AS has_discount,
        EXISTS (
            SELECT 1 FROM store_house sh 
            WHERE sh.productid = p.id AND sh.quantity > 0
        ) AS in_store,
        -- Подзапрос для правила скидки
        COALESCE(
            (
                SELECT dr2.discount_value::int
                FROM discount_rule_items dri
                JOIN discount_rules dr2 ON dr2.id = dri.rule_id
                    AND dr2.is_active = true
                    AND dr2.starts_at <= NOW()
                    AND (dr2.ends_at IS NULL OR dr2.ends_at >= NOW())
                WHERE (
                    (dri.item_type = 'brand' AND dri.item_id = p.brand_id)
                    OR (dri.item_type = 'line' AND dri.item_id = p.line_id)
                    OR (dri.item_type = 'product' AND dri.item_id = p.id)
                )
                AND NOT EXISTS (
                    SELECT 1 FROM discount d WHERE d.productid = p.id
                )
                ORDER BY dr2.priority DESC
                LIMIT 1
            ),
            0
        )::int AS discount_value,
        COALESCE(
            (
                SELECT dr2.name::text
                FROM discount_rule_items dri
                JOIN discount_rules dr2 ON dr2.id = dri.rule_id
                    AND dr2.is_active = true
                    AND dr2.starts_at <= NOW()
                    AND (dr2.ends_at IS NULL OR dr2.ends_at >= NOW())
                WHERE (
                    (dri.item_type = 'brand' AND dri.item_id = p.brand_id)
                    OR (dri.item_type = 'line' AND dri.item_id = p.line_id)
                    OR (dri.item_type = 'product' AND dri.item_id = p.id)
                )
                AND NOT EXISTS (
                    SELECT 1 FROM discount d WHERE d.productid = p.id
                )
                ORDER BY dr2.priority DESC
                LIMIT 1
            ),
            ''
        )::text AS discount_rule_name,
        0 as priority
    FROM products p
    INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
    LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
    WHERE 
        p.status = 'active'
        AND (p.line_id IS NULL OR bl.id IS NOT NULL)
        AND EXISTS (
            SELECT 1 
            FROM collection_products cp 
            WHERE cp.collection_id = @collection_id::int 
            AND cp.product_id = p.id
        )
    
    UNION ALL
    
    -- Часть 2: Товары по фильтрам (ИСКЛЮЧАЯ коллекцию)
    SELECT 
        p.id, 
        p.name, 
        p.image_path,
        b.name as firm,
        COALESCE(
            (SELECT discount_percent::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            0
        )::int AS discount_percent,
        COALESCE(
            (SELECT original_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            0
        )::int AS original_price,
        COALESCE(
            (SELECT discounted_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            p.minprice
        )::int AS discounted_price,
        COALESCE(
            (SELECT min_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            p.minprice
        )::int AS min_price,
        COALESCE(
            (SELECT max_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            p.maxprice
        )::int AS max_price,
        EXISTS (
            SELECT 1 FROM discount d WHERE d.productid = p.id
        ) AS has_discount,
        EXISTS (
            SELECT 1 FROM store_house sh 
            WHERE sh.productid = p.id AND sh.quantity > 0
        ) AS in_store,
        COALESCE(
            (
                SELECT dr2.discount_value::int
                FROM discount_rule_items dri
                JOIN discount_rules dr2 ON dr2.id = dri.rule_id
                    AND dr2.is_active = true
                    AND dr2.starts_at <= NOW()
                    AND (dr2.ends_at IS NULL OR dr2.ends_at >= NOW())
                WHERE (
                    (dri.item_type = 'brand' AND dri.item_id = p.brand_id)
                    OR (dri.item_type = 'line' AND dri.item_id = p.line_id)
                    OR (dri.item_type = 'product' AND dri.item_id = p.id)
                )
                AND NOT EXISTS (
                    SELECT 1 FROM discount d WHERE d.productid = p.id
                )
                ORDER BY dr2.priority DESC
                LIMIT 1
            ),
            0
        )::int AS discount_value,
        COALESCE(
            (
                SELECT dr2.name::text
                FROM discount_rule_items dri
                JOIN discount_rules dr2 ON dr2.id = dri.rule_id
                    AND dr2.is_active = true
                    AND dr2.starts_at <= NOW()
                    AND (dr2.ends_at IS NULL OR dr2.ends_at >= NOW())
                WHERE (
                    (dri.item_type = 'brand' AND dri.item_id = p.brand_id)
                    OR (dri.item_type = 'line' AND dri.item_id = p.line_id)
                    OR (dri.item_type = 'product' AND dri.item_id = p.id)
                )
                AND NOT EXISTS (
                    SELECT 1 FROM discount d WHERE d.productid = p.id
                )
                ORDER BY dr2.priority DESC
                LIMIT 1
            ),
            ''
        )::text AS discount_rule_name,
        1 as priority
    FROM products p
    INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
    LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
    WHERE 
        p.status = 'active'
        AND (p.line_id IS NULL OR bl.id IS NOT NULL)
        -- ИСКЛЮЧАЕМ товары из коллекции
        AND NOT EXISTS (
            SELECT 1 
            FROM collection_products cp 
            WHERE cp.collection_id = @collection_id::int 
            AND cp.product_id = p.id
        )
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
            @name::text IS NULL 
            OR @name::text = ''
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
            sqlc.narg('minprice')::int IS NULL 
            OR p.maxprice >= sqlc.narg('minprice')::int
        )
        AND (
            sqlc.narg('maxprice')::int IS NULL 
            OR p.minprice <= sqlc.narg('maxprice')::int
        )
        -- С ценой
        AND (
            @with_price::boolean IS NULL 
            OR @with_price::boolean = false 
            OR p.minprice > 0
        )
        -- Скидки (ИСПРАВЛЕНО!)
        AND (
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
            (array_length(@rule_ids::int[], 1) IS NULL OR array_length(@rule_ids::int[], 1) = 0)
        )
        -- Наличие на складе
        AND (
            @in_store::boolean IS NULL 
            OR @in_store::boolean = false 
            OR EXISTS (
                SELECT 1 FROM store_house sh 
                WHERE sh.productid = p.id AND sh.quantity > 0
            )
        )
) AS combined
ORDER BY
    priority ASC,
    CASE WHEN @sort_type::int = 1 THEN name END ASC,
    CASE WHEN @sort_type::int = 2 THEN name END DESC,
    CASE WHEN @sort_type::int = 3 THEN min_price END ASC,
    CASE WHEN @sort_type::int = 4 THEN min_price END DESC,
    CASE WHEN @sort_type::int NOT IN (1,2,3,4) THEN name END ASC,
    id ASC
LIMIT CASE WHEN @limitval::integer > 0 THEN @limitval::integer ELSE 50 END
OFFSET CASE WHEN @offsetval::integer > 0 THEN @offsetval::integer ELSE 0 END;

-- name: GetProductsForCollectionByFiltersPaginateBase :many
SELECT 
    id, 
    name, 
    image_path,
    firm,
    minprice, 
    maxprice, 
    status
FROM (
    -- Часть 1: ВСЕ товары из коллекции (БЕЗ ФИЛЬТРОВ!)
    SELECT 
        p.id, 
        p.name, 
        p.image_path,
        b.name as firm,
        p.minprice, 
        p.maxprice, 
        p.status,
        0 as priority
    FROM products p
    INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
    WHERE p.status = 'active'
    AND EXISTS (
        SELECT 1 
        FROM collection_products cp 
        WHERE cp.collection_id = @collection_id::int 
        AND cp.product_id = p.id
    )

    UNION ALL

    -- Часть 2: Товары по фильтрам
    SELECT 
        p.id, 
        p.name, 
        p.image_path,
        b.name as firm,
        p.minprice, 
        p.maxprice, 
        p.status,
        1 as priority
    FROM products p
    INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
    LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
    WHERE 
        p.status = 'active'
        AND (p.line_id IS NULL OR bl.id IS NOT NULL)
        -- ИСКЛЮЧАЕМ товары из коллекции
        AND NOT EXISTS (
            SELECT 1 
            FROM collection_products cp 
            WHERE cp.collection_id = @collection_id::int 
            AND cp.product_id = p.id
        )
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
            @name::text IS NULL 
            OR @name::text = ''
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
            sqlc.narg('minprice')::int IS NULL 
            OR p.maxprice >= sqlc.narg('minprice')::int
        )
        AND (
            sqlc.narg('maxprice')::int IS NULL 
            OR p.minprice <= sqlc.narg('maxprice')::int
        )
        -- С ценой
        AND (
            @with_price::boolean IS NULL 
            OR @with_price::boolean = false 
            OR p.minprice > 0
        )
) AS combined
ORDER BY
    priority ASC,
    CASE WHEN @sort_type::int = 1 THEN name END ASC,
    CASE WHEN @sort_type::int = 2 THEN name END DESC,
    CASE WHEN @sort_type::int = 3 THEN minprice END ASC,
    CASE WHEN @sort_type::int = 4 THEN minprice END DESC,
    CASE WHEN @sort_type::int NOT IN (1,2,3,4) THEN name END ASC,
    id ASC
LIMIT CASE WHEN @limitval::integer > 0 THEN @limitval::integer ELSE 50 END
OFFSET CASE WHEN @offsetval::integer > 0 THEN @offsetval::integer ELSE 0 END;

-- name: CountProductsForCollectionByFiltersFull :one
SELECT COUNT(*)::int
FROM products p
INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
WHERE 
    p.status = 'active'
    AND (p.line_id IS NULL OR bl.id IS NOT NULL)
    -- 👇 УСЛОВИЕ ДЛЯ HYBRID: ИЛИ фильтры, ИЛИ коллекция
    AND (
        (
            -- Фильтры (ВСЕ УСЛОВИЯ ОПЦИОНАЛЬНЫ!)
            -- Размеры
            (COALESCE(array_length(@sizes::text[], 1), 0) = 0 OR EXISTS (
                SELECT 1 FROM jsonb_object_keys(p.sizes) AS size_key
                WHERE size_key = ANY(@sizes::text[])
                AND (p.sizes->size_key->>'price')::numeric > 0
            ))
            -- Поиск
            AND (@name::text IS NULL OR @name::text = '' OR p.name ILIKE '%' || @name::text || '%' OR p.article ILIKE '%' || @name::text || '%')
            -- Категории
            AND (COALESCE(array_length(@categories::int[], 1), 0) = 0 OR p.category = ANY(@categories::int[]))
            -- Типы продуктов
            AND (COALESCE(array_length(@product_types::int[], 1), 0) = 0 OR p.type = ANY(@product_types::int[]))
            -- Бренды
            AND (COALESCE(array_length(@firms::int[], 1), 0) = 0 OR p.brand_id = ANY(@firms::int[]))
            -- Линии
            AND (COALESCE(array_length(@lines::int[], 1), 0) = 0 OR p.line_id = ANY(@lines::int[]))
            -- Bodytype
            AND (COALESCE(array_length(@bodytypes::text[], 1), 0) = 0 OR p.bodytype = ANY(@bodytypes::body_enum[]))
            -- Цена
            AND (sqlc.narg('minprice')::int IS NULL OR p.maxprice >= sqlc.narg('minprice')::int)
            AND (sqlc.narg('maxprice')::int IS NULL OR p.minprice <= sqlc.narg('maxprice')::int)
            -- С ценой
            AND (@with_price::boolean IS NULL OR @with_price::boolean = false OR p.minprice > 0)
            -- Скидки (опционально)
            AND (
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
                (array_length(@rule_ids::int[], 1) IS NULL OR array_length(@rule_ids::int[], 1) = 0)
            )
            -- ❌ УБРАНО жесткое условие наличия на складе
            -- AND EXISTS (SELECT 1 FROM store_house sh WHERE sh.productid = p.id AND sh.quantity > 0)
            -- Вместо этого - опциональный фильтр по складу
            AND (
                @in_store::boolean IS NULL 
                OR @in_store::boolean = false 
                OR EXISTS (SELECT 1 FROM store_house sh WHERE sh.productid = p.id AND sh.quantity > 0)
            )
        )
        OR
        -- 👇 ИЛИ товары из коллекции (тоже без жестких условий)
        (
            @collection_id::int > 0
            AND EXISTS (
                SELECT 1 
                FROM collection_products cp 
                WHERE cp.collection_id = @collection_id::int 
                AND cp.product_id = p.id
            )
        )
    );

-- name: GetProductsForCollectionPaginateFull :many
SELECT * FROM (
    -- Часть 1: ВСЕ товары из коллекции (С ФИЛЬТРАМИ!)
    SELECT 
        p.id, 
        p.name, 
        p.image_path,
        b.name as firm,
        COALESCE(
            (SELECT discount_percent::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            0
        )::int AS discount_percent,
        COALESCE(
            (SELECT original_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            0
        )::int AS original_price,
        COALESCE(
            (SELECT discounted_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            p.minprice
        )::int AS discounted_price,
        COALESCE(
            (SELECT min_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            p.minprice
        )::int AS min_price,
        COALESCE(
            (SELECT max_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            p.maxprice
        )::int AS max_price,
        EXISTS (
            SELECT 1 FROM discount d WHERE d.productid = p.id
        ) AS has_discount,
        EXISTS (
            SELECT 1 FROM store_house sh 
            WHERE sh.productid = p.id AND sh.quantity > 0
        ) AS in_store,
        COALESCE(dr.discount_value, 0)::int AS discount_value,
        COALESCE(dr.name, '')::text AS discount_rule_name,
        0 as priority
    FROM products p
    INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
    LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
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
            AND NOT EXISTS (
                SELECT 1 FROM discount d WHERE d.productid = p.id
            )
        ORDER BY dr2.priority DESC
        LIMIT 1
    ) dr ON true
    WHERE 
        p.status = 'active'
        AND (p.line_id IS NULL OR bl.id IS NOT NULL)
        -- ТОВАРЫ ИЗ КОЛЛЕКЦИИ
        AND EXISTS (
            SELECT 1 
            FROM collection_products cp 
            WHERE cp.collection_id = @collection_id::int 
            AND cp.product_id = p.id
        )
        -- ОБЩИЕ ФИЛЬТРЫ
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
            @name::text IS NULL 
            OR @name::text = ''
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
            sqlc.narg('minprice')::int IS NULL 
            OR p.maxprice >= sqlc.narg('minprice')::int
        )
        AND (
            sqlc.narg('maxprice')::int IS NULL 
            OR p.minprice <= sqlc.narg('maxprice')::int
        )
        -- С ценой
        AND (
            @with_price::boolean IS NULL 
            OR @with_price::boolean = false 
            OR p.minprice > 0
        )
        -- Скидки
        AND (
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
            (array_length(@rule_ids::int[], 1) IS NULL OR array_length(@rule_ids::int[], 1) = 0)
        )
        -- Наличие на складе
        AND (
            @in_store::boolean IS NULL 
            OR @in_store::boolean = false 
            OR EXISTS (
                SELECT 1 FROM store_house sh 
                WHERE sh.productid = p.id AND sh.quantity > 0
            )
        )
    
    UNION ALL
    
    -- Часть 2: Товары по фильтрам (ИСКЛЮЧАЯ коллекцию)
    SELECT 
        p.id, 
        p.name, 
        p.image_path,
        b.name as firm,
        COALESCE(
            (SELECT discount_percent::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            0
        )::int AS discount_percent,
        COALESCE(
            (SELECT original_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            0
        )::int AS original_price,
        COALESCE(
            (SELECT discounted_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            p.minprice
        )::int AS discounted_price,
        COALESCE(
            (SELECT min_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            p.minprice
        )::int AS min_price,
        COALESCE(
            (SELECT max_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
            p.maxprice
        )::int AS max_price,
        EXISTS (
            SELECT 1 FROM discount d WHERE d.productid = p.id
        ) AS has_discount,
        EXISTS (
            SELECT 1 FROM store_house sh 
            WHERE sh.productid = p.id AND sh.quantity > 0
        ) AS in_store,
        COALESCE(dr.discount_value, 0)::int AS discount_value,
        COALESCE(dr.name, '')::text AS discount_rule_name,
        1 as priority
    FROM products p
    INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
    LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
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
            AND NOT EXISTS (
                SELECT 1 FROM discount d WHERE d.productid = p.id
            )
        ORDER BY dr2.priority DESC
        LIMIT 1
    ) dr ON true
    WHERE 
        p.status = 'active'
        AND (p.line_id IS NULL OR bl.id IS NOT NULL)
        -- ИСКЛЮЧАЕМ товары из коллекции
        AND NOT EXISTS (
            SELECT 1 
            FROM collection_products cp 
            WHERE cp.collection_id = @collection_id::int 
            AND cp.product_id = p.id
        )
        -- ТЕ ЖЕ САМЫЕ ОБЩИЕ ФИЛЬТРЫ
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
            @name::text IS NULL 
            OR @name::text = ''
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
            sqlc.narg('minprice')::int IS NULL 
            OR p.maxprice >= sqlc.narg('minprice')::int
        )
        AND (
            sqlc.narg('maxprice')::int IS NULL 
            OR p.minprice <= sqlc.narg('maxprice')::int
        )
        -- С ценой
        AND (
            @with_price::boolean IS NULL 
            OR @with_price::boolean = false 
            OR p.minprice > 0
        )
        -- Скидки
        AND (
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
            (array_length(@rule_ids::int[], 1) IS NULL OR array_length(@rule_ids::int[], 1) = 0)
        )
        -- Наличие на складе
        AND (
            @in_store::boolean IS NULL 
            OR @in_store::boolean = false 
            OR EXISTS (
                SELECT 1 FROM store_house sh 
                WHERE sh.productid = p.id AND sh.quantity > 0
            )
        )
) AS combined
ORDER BY
    priority ASC,
    CASE WHEN @sort_type::int = 1 THEN name END ASC,
    CASE WHEN @sort_type::int = 2 THEN name END DESC,
    CASE WHEN @sort_type::int = 3 THEN min_price END ASC,
    CASE WHEN @sort_type::int = 4 THEN min_price END DESC,
    CASE WHEN @sort_type::int NOT IN (1,2,3,4) THEN name END ASC,
    id ASC
LIMIT CASE WHEN @limitval::integer > 0 THEN @limitval::integer ELSE 50 END
OFFSET CASE WHEN @offsetval::integer > 0 THEN @offsetval::integer ELSE 0 END;

-- name: CountProductsForCollectionFull :one
SELECT COUNT(*)::int
FROM (
    -- Часть 1: Товары ИЗ коллекции
    SELECT p.id
    FROM products p
    INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
    LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
    WHERE 
        p.status = 'active'
        AND (p.line_id IS NULL OR bl.id IS NOT NULL)
        AND EXISTS (
            SELECT 1 
            FROM collection_products cp 
            WHERE cp.collection_id = @collection_id::int 
            AND cp.product_id = p.id
        )
        -- ОБЩИЕ ФИЛЬТРЫ
        AND (COALESCE(array_length(@sizes::text[], 1), 0) = 0 OR EXISTS (
            SELECT 1 FROM jsonb_object_keys(p.sizes) AS size_key
            WHERE size_key = ANY(@sizes::text[])
            AND (p.sizes->size_key->>'price')::numeric > 0
        ))
        AND (@name::text IS NULL OR @name::text = '' OR p.name ILIKE '%' || @name::text || '%' OR p.article ILIKE '%' || @name::text || '%')
        AND (COALESCE(array_length(@categories::int[], 1), 0) = 0 OR p.category = ANY(@categories::int[]))
        AND (COALESCE(array_length(@product_types::int[], 1), 0) = 0 OR p.type = ANY(@product_types::int[]))
        AND (COALESCE(array_length(@firms::int[], 1), 0) = 0 OR p.brand_id = ANY(@firms::int[]))
        AND (COALESCE(array_length(@lines::int[], 1), 0) = 0 OR p.line_id = ANY(@lines::int[]))
        AND (COALESCE(array_length(@bodytypes::text[], 1), 0) = 0 OR p.bodytype = ANY(@bodytypes::body_enum[]))
        AND (sqlc.narg('minprice')::int IS NULL OR p.maxprice >= sqlc.narg('minprice')::int)
        AND (sqlc.narg('maxprice')::int IS NULL OR p.minprice <= sqlc.narg('maxprice')::int)
        AND (@with_price::boolean IS NULL OR @with_price::boolean = false OR p.minprice > 0)
        AND (
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
            (array_length(@rule_ids::int[], 1) IS NULL OR array_length(@rule_ids::int[], 1) = 0)
        )
        AND (
            @in_store::boolean IS NULL 
            OR @in_store::boolean = false 
            OR EXISTS (
                SELECT 1 FROM store_house sh 
                WHERE sh.productid = p.id AND sh.quantity > 0
            )
        )
    
    UNION ALL
    
    -- Часть 2: Товары НЕ из коллекции
    SELECT p.id
    FROM products p
    INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
    LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
    WHERE 
        p.status = 'active'
        AND (p.line_id IS NULL OR bl.id IS NOT NULL)
        AND NOT EXISTS (
            SELECT 1 
            FROM collection_products cp 
            WHERE cp.collection_id = @collection_id::int 
            AND cp.product_id = p.id
        )
        -- ТЕ ЖЕ САМЫЕ ОБЩИЕ ФИЛЬТРЫ
        AND (COALESCE(array_length(@sizes::text[], 1), 0) = 0 OR EXISTS (
            SELECT 1 FROM jsonb_object_keys(p.sizes) AS size_key
            WHERE size_key = ANY(@sizes::text[])
            AND (p.sizes->size_key->>'price')::numeric > 0
        ))
        AND (@name::text IS NULL OR @name::text = '' OR p.name ILIKE '%' || @name::text || '%' OR p.article ILIKE '%' || @name::text || '%')
        AND (COALESCE(array_length(@categories::int[], 1), 0) = 0 OR p.category = ANY(@categories::int[]))
        AND (COALESCE(array_length(@product_types::int[], 1), 0) = 0 OR p.type = ANY(@product_types::int[]))
        AND (COALESCE(array_length(@firms::int[], 1), 0) = 0 OR p.brand_id = ANY(@firms::int[]))
        AND (COALESCE(array_length(@lines::int[], 1), 0) = 0 OR p.line_id = ANY(@lines::int[]))
        AND (COALESCE(array_length(@bodytypes::text[], 1), 0) = 0 OR p.bodytype = ANY(@bodytypes::body_enum[]))
        AND (sqlc.narg('minprice')::int IS NULL OR p.maxprice >= sqlc.narg('minprice')::int)
        AND (sqlc.narg('maxprice')::int IS NULL OR p.minprice <= sqlc.narg('maxprice')::int)
        AND (@with_price::boolean IS NULL OR @with_price::boolean = false OR p.minprice > 0)
        AND (
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
            (array_length(@rule_ids::int[], 1) IS NULL OR array_length(@rule_ids::int[], 1) = 0)
        )
        AND (
            @in_store::boolean IS NULL 
            OR @in_store::boolean = false 
            OR EXISTS (
                SELECT 1 FROM store_house sh 
                WHERE sh.productid = p.id AND sh.quantity > 0
            )
        )
) AS combined;


-- name: GetManualProductsPaginate :many
SELECT 
    p.id, 
    p.name, 
    p.image_path,
    b.name as firm,
    COALESCE(
        (SELECT discount_percent::int FROM discount d WHERE d.productid = p.id LIMIT 1),
        0
    )::int AS discount_percent,
    COALESCE(
        (SELECT original_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
        0
    )::int AS original_price,
    COALESCE(
        (SELECT discounted_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
        p.minprice
    )::int AS discounted_price,
    COALESCE(
        (SELECT min_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
        p.minprice
    )::int AS min_price,
    COALESCE(
        (SELECT max_price::int FROM discount d WHERE d.productid = p.id LIMIT 1),
        p.maxprice
    )::int AS max_price,
    EXISTS (
        SELECT 1 FROM discount d WHERE d.productid = p.id
    ) AS has_discount,
    EXISTS (
        SELECT 1 FROM store_house sh 
        WHERE sh.productid = p.id AND sh.quantity > 0
    ) AS in_store,
    COALESCE(
        (
            SELECT dr2.discount_value::int
            FROM discount_rule_items dri
            JOIN discount_rules dr2 ON dr2.id = dri.rule_id
                AND dr2.is_active = true
                AND dr2.starts_at <= NOW()
                AND (dr2.ends_at IS NULL OR dr2.ends_at >= NOW())
            WHERE (
                (dri.item_type = 'brand' AND dri.item_id = p.brand_id)
                OR (dri.item_type = 'line' AND dri.item_id = p.line_id)
                OR (dri.item_type = 'product' AND dri.item_id = p.id)
            )
            AND NOT EXISTS (
                SELECT 1 FROM discount d WHERE d.productid = p.id
            )
            ORDER BY dr2.priority DESC
            LIMIT 1
        ),
        0
    )::int AS discount_value,
    COALESCE(
        (
            SELECT dr2.name::text
            FROM discount_rule_items dri
            JOIN discount_rules dr2 ON dr2.id = dri.rule_id
                AND dr2.is_active = true
                AND dr2.starts_at <= NOW()
                AND (dr2.ends_at IS NULL OR dr2.ends_at >= NOW())
            WHERE (
                (dri.item_type = 'brand' AND dri.item_id = p.brand_id)
                OR (dri.item_type = 'line' AND dri.item_id = p.line_id)
                OR (dri.item_type = 'product' AND dri.item_id = p.id)
            )
            AND NOT EXISTS (
                SELECT 1 FROM discount d WHERE d.productid = p.id
            )
            ORDER BY dr2.priority DESC
            LIMIT 1
        ),
        ''
    )::text AS discount_rule_name
FROM products p
INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
WHERE 
    p.status = 'active'
    AND (p.line_id IS NULL OR bl.id IS NOT NULL)
    -- ТОЛЬКО МАНУАЛЬНЫЕ ПРОДУКТЫ (из коллекции)
    AND EXISTS (
        SELECT 1 
        FROM collection_products cp 
        WHERE cp.collection_id = @collection_id::int 
        AND cp.product_id = p.id
    )
    -- ВСЕ ФИЛЬТРЫ
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
        @name::text IS NULL 
        OR @name::text = ''
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
        sqlc.narg('minprice')::int IS NULL 
        OR p.maxprice >= sqlc.narg('minprice')::int
    )
    AND (
        sqlc.narg('maxprice')::int IS NULL 
        OR p.minprice <= sqlc.narg('maxprice')::int
    )
    -- С ценой
    AND (
        @with_price::boolean IS NULL 
        OR @with_price::boolean = false 
        OR p.minprice > 0
    )
    -- Скидки
    AND (
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
        (array_length(@rule_ids::int[], 1) IS NULL OR array_length(@rule_ids::int[], 1) = 0)
    )
    -- Наличие на складе
    AND (
        @in_store::boolean IS NULL 
        OR @in_store::boolean = false 
        OR EXISTS (
            SELECT 1 FROM store_house sh 
            WHERE sh.productid = p.id AND sh.quantity > 0
        )
    )
ORDER BY
    CASE WHEN @sort_type::int = 1 THEN p.name END ASC,
    CASE WHEN @sort_type::int = 2 THEN p.name END DESC,
    -- Используем p.minprice вместо min_price (алиаса)
    CASE WHEN @sort_type::int = 3 THEN p.minprice END ASC,
    CASE WHEN @sort_type::int = 4 THEN p.minprice END DESC,
    CASE WHEN @sort_type::int NOT IN (1,2,3,4) THEN p.name END ASC,
    p.id ASC
LIMIT CASE WHEN @limitval::integer > 0 THEN @limitval::integer ELSE 50 END
OFFSET CASE WHEN @offsetval::integer > 0 THEN @offsetval::integer ELSE 0 END;

-- name: CountManualProductsByFilters :one
SELECT COUNT(*)::int
FROM products p
INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
WHERE 
    p.status = 'active'
    AND (p.line_id IS NULL OR bl.id IS NOT NULL)
    -- 👇 ТОЛЬКО МАНУАЛЬНЫЕ ПРОДУКТЫ (из коллекции)
    AND EXISTS (
        SELECT 1 
        FROM collection_products cp 
        WHERE cp.collection_id = @collection_id::int 
        AND cp.product_id = p.id
    )
    -- 👇 ВСЕ ФИЛЬТРЫ
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
        @name::text IS NULL 
        OR @name::text = ''
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
        sqlc.narg('minprice')::int IS NULL 
        OR p.maxprice >= sqlc.narg('minprice')::int
    )
    AND (
        sqlc.narg('maxprice')::int IS NULL 
        OR p.minprice <= sqlc.narg('maxprice')::int
    )
    -- С ценой
    AND (
        @with_price::boolean IS NULL 
        OR @with_price::boolean = false 
        OR p.minprice > 0
    )
    -- Скидки
    AND (
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
        (array_length(@rule_ids::int[], 1) IS NULL OR array_length(@rule_ids::int[], 1) = 0)
    )
    -- Наличие на складе
    AND (
        @in_store::boolean IS NULL 
        OR @in_store::boolean = false 
        OR EXISTS (
            SELECT 1 FROM store_house sh 
            WHERE sh.productid = p.id AND sh.quantity > 0
        )
    );