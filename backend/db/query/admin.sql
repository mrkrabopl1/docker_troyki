-- name: GetAdminByEmail :one
SELECT id,
    email,
    password_hash,
    name,
    role,
    is_active,
    last_login_at,
    last_login_ip,
    created_at
FROM admins
WHERE email = $1
LIMIT 1;
-- name: GetAdminByID :one
SELECT id,
    email,
    password_hash,
    name,
    role,
    is_active,
    last_login_at,
    last_login_ip,
    created_at
FROM admins
WHERE id = $1
LIMIT 1;
-- name: UpdateAdminLastLogin :exec
UPDATE admins
SET last_login_at = NOW(),
    last_login_ip = $2
WHERE id = $1;
-- name: ListAdmins :many
SELECT id,
    email,
    name,
    role,
    is_active,
    last_login_at,
    created_at
FROM admins
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;
-- name: UpdateAdminRole :exec
UPDATE admins
SET role = $2
WHERE id = $1;
-- name: UpdateAdminStatus :exec
UPDATE admins
SET is_active = $2
WHERE id = $1;
-- name: DeleteAdmin :exec
DELETE FROM admins
WHERE id = $1;
-- name: DeleteAdminByEmail :exec
DELETE FROM admins
WHERE email = $1;
-- name: CreateAdminLog :exec
INSERT INTO admin_logs (
        admin_id,
        action,
        entity_type,
        entity_id,
        details,
        ip_address
    )
VALUES ($1, $2, $3, $4, $5, $6);
-- name: GetAdminLogs :many
SELECT al.id,
    al.admin_id,
    a.email as admin_email,
    a.name as admin_name,
    al.action,
    al.entity_type,
    al.entity_id,
    al.details,
    al.ip_address,
    al.created_at
FROM admin_logs al
    LEFT JOIN admins a ON al.admin_id = a.id
WHERE (
        sqlc.narg('admin_id')::int IS NULL
        OR al.admin_id = sqlc.narg('admin_id')
    )
    AND (
        sqlc.narg('action')::text IS NULL
        OR al.action = sqlc.narg('action')
    )
    AND (
        sqlc.narg('date_from')::timestamptz IS NULL
        OR al.created_at >= sqlc.narg('date_from')
    )
    AND (
        sqlc.narg('date_to')::timestamptz IS NULL
        OR al.created_at <= sqlc.narg('date_to')
    )
ORDER BY al.created_at DESC
LIMIT $1 OFFSET $2;
-- name: GetAdminStats :one
SELECT COUNT(*) as total_admins,
    COUNT(
        CASE
            WHEN role = 'superadmin' THEN 1
        END
    ) as superadmins,
    COUNT(
        CASE
            WHEN role = 'admin' THEN 1
        END
    ) as regular_admins,
    COUNT(
        CASE
            WHEN is_active = true THEN 1
        END
    ) as active_admins
FROM admins;
-- name: UpdateAdminPassword :exec
UPDATE admins
SET password_hash = $2,
    updated_at = NOW()
WHERE id = $1;
-- name: DeleteOldPasswordResetTokens :exec
DELETE FROM admin_password_resets
WHERE expires_at < NOW()
    OR used_at IS NOT NULL;
-- name: DeleteOldPasswordResetTokenByEmail :exec
DELETE FROM admin_password_resets
WHERE email = $1
    AND (
        expires_at < NOW()
        OR used_at IS NOT NULL
    );
-- name: CreateAdminPasswordResetToken :exec
INSERT INTO admin_password_resets (email, token, expires_at)
VALUES ($1, $2, NOW() + INTERVAL '1 hour') ON CONFLICT (email) DO
UPDATE
SET token = EXCLUDED.token,
    expires_at = NOW() + INTERVAL '1 hour',
    used_at = NULL;
-- name: GetAdminPasswordResetToken :one
SELECT *
FROM admin_password_resets
WHERE token = $1
    AND used_at IS NULL
    AND expires_at > NOW()
LIMIT 1;
-- name: UpdateAdminPasswordByEmail :exec
UPDATE admins
SET password_hash = $2,
    updated_at = NOW()
WHERE email = $1;
-- name: MarkAdminPasswordResetTokenUsed :exec
UPDATE admin_password_resets
SET used_at = NOW()
WHERE id = $1;
-- name: GetAdminByResetToken :one
SELECT a.id,
    a.email,
    a.name,
    a.role,
    a.is_active
FROM admin_password_resets r
    JOIN admins a ON a.email = r.email
WHERE r.token = $1
    AND r.expires_at > NOW()
    AND r.used_at IS NULL
    AND a.is_active = true;
-- name: GetAdminDashboardStats :one
WITH product_stats AS (
    SELECT COALESCE(COUNT(DISTINCT p.id), 0)::int as total_products,
        COALESCE(COUNT(DISTINCT p.brand_id), 0)::int as total_firms,
        COALESCE(COUNT(DISTINCT p.category), 0)::int as total_categories
    FROM products p
),
order_stats AS (
    SELECT COALESCE(
            COUNT(
                CASE
                    WHEN o.status = 'pending' THEN 1
                END
            ),
            0
        )::int as pending_orders,
        COALESCE(
            COUNT(
                CASE
                    WHEN o.status = 'approved' THEN 1
                END
            ),
            0
        )::int as approved_orders,
        COALESCE(
            COUNT(
                CASE
                    WHEN o.status = 'rejected' THEN 1
                END
            ),
            0
        )::int as rejected_orders,
        COALESCE(COUNT(*), 0)::int as total_orders,
        COALESCE(SUM(oi.price * oi.quantity), 0)::int as total_revenue
    FROM orders o
        LEFT JOIN orderitems oi ON o.id = oi.orderid
        AND o.status = 'approved'
),
user_stats AS (
    SELECT COALESCE(COUNT(DISTINCT c.id), 0)::int as registered_users,
        (
            SELECT COALESCE(COUNT(*), 0)::int
            FROM uniquecustomers
        ) as unique_visitors,
        COALESCE(COUNT(DISTINCT u.id), 0)::int as unregistered_customers,
        COALESCE(
            COUNT(
                DISTINCT CASE
                    WHEN c.id IS NOT NULL
                    AND c.created_at >= NOW() - INTERVAL '30 days' THEN c.id
                END
            ),
            0
        )::int as new_users_30d
    FROM customers c
        FULL JOIN unregistercustomer u ON false
),
stock_stats AS (
    SELECT COALESCE(COUNT(DISTINCT sh.productid), 0)::int as products_in_stock,
        COALESCE(SUM(sh.quantity), 0)::int as total_items_in_stock,
        COALESCE(
            COUNT(
                CASE
                    WHEN sh.quantity = 0 THEN 1
                END
            ),
            0
        )::int as out_of_stock_items
    FROM store_house sh
),
discount_stats AS (
    SELECT COALESCE(COUNT(DISTINCT d.productid), 0)::int as products_on_discount,
        COALESCE(COUNT(*), 0)::int as active_discounts
    FROM discount d
),
recent_activity AS (
    SELECT COALESCE(COUNT(*), 0)::int as orders_last_7_days
    FROM orders o
    WHERE o.orderdate >= CURRENT_DATE - INTERVAL '7 days'
)
SELECT ps.total_products,
    ps.total_firms,
    ps.total_categories,
    os.pending_orders,
    os.approved_orders,
    os.rejected_orders,
    os.total_orders,
    os.total_revenue,
    us.registered_users,
    us.unique_visitors,
    us.unregistered_customers,
    us.new_users_30d,
    ss.products_in_stock,
    ss.total_items_in_stock,
    ss.out_of_stock_items,
    ds.products_on_discount,
    ds.active_discounts,
    ra.orders_last_7_days
FROM product_stats ps,
    order_stats os,
    user_stats us,
    stock_stats ss,
    discount_stats ds,
    recent_activity ra;
-- name: BulkUpdateBrandActive :exec
UPDATE brands
SET is_active = @active,
    updated_at = NOW()
WHERE id = ANY(@ids::int []);
-- name: BulkUpdateBrandSortOrder :exec
UPDATE brands
SET sort_order = @sort_order,
    updated_at = NOW()
WHERE id = ANY(@ids::int []);
-- name: GetAllProductsForAdmin :many
SELECT p.id,
    p.qId,
    p.name,
    b.name as firm,
    bl.name as line,
    p.image_path,
    p.minprice,
    p.maxprice,
    p.type,
    p.category,
    p.article,
    p.date,
    p.bodytype,
    p.image_count,
    p.updated_at,
    p.sizes,
    p.status,
    pc.name as category_name,
    pt.type_name as type_name,
    -- Наличие на складе
    COALESCE(
        (
            SELECT SUM(sh.quantity)
            FROM store_house sh
            WHERE sh.productid = p.id
        ),
        0
    ) as total_quantity,
    -- Активная скидка
    (
        SELECT jsonb_build_object(
                'value',
                d.value,
                'minprice',
                d.minprice,
                'maxdiscprice',
                d.maxdiscprice
            )
        FROM discount d
        WHERE d.productid = p.id
        LIMIT 1
    ) as discount
FROM products p
    LEFT JOIN product_categories pc ON p.category = pc.id
    LEFT JOIN product_types pt ON p.type = pt.id
    JOIN brands b ON p.brand_id = b.id
    LEFT JOIN brand_lines bl ON p.line_id = bl.id
WHERE p.status != 'deleted'
ORDER BY p.id OFFSET $1
LIMIT $2;
-- name: GetAllFiltersForAdmin :one
WITH all_products AS (
    SELECT p.id,
        p.brand_id,
        p.line_id,
        b.name as firm,
        p.minprice,
        p.maxprice,
        p.sizes,
        p.bodytype,
        p.type as product_type_id,
        p.category as category_id,
        p.status
    FROM products p
        JOIN brands b ON p.brand_id = b.id
    WHERE p.status != 'deleted'
),
size_data AS (
    SELECT size_key,
        COUNT(*) as count
    FROM all_products
        CROSS JOIN LATERAL jsonb_object_keys(sizes) as size_key
    WHERE (sizes->size_key->>'price')::numeric > 0
    GROUP BY size_key
),
firm_counts AS (
    SELECT firm,
        COUNT(*) AS firm_count
    FROM all_products
    WHERE firm IS NOT NULL
    GROUP BY firm
),
bodytype_counts AS (
    SELECT bodytype,
        COUNT(*) as count
    FROM all_products
    GROUP BY bodytype
),
price_range AS (
    SELECT COALESCE(MIN(minprice), 0) AS min_price,
        COALESCE(MAX(maxprice), 0) AS max_price
    FROM all_products
),
type_data AS (
    SELECT product_type_id,
        COUNT(*) as type_count,
        (
            SELECT type_name
            FROM product_types
            WHERE id = product_type_id
        ) as type_name
    FROM all_products
    GROUP BY product_type_id
),
category_data AS (
    SELECT category_id,
        COUNT(*) as category_count,
        (
            SELECT name
            FROM product_categories
            WHERE id = category_id
        ) as category_name
    FROM all_products
    GROUP BY category_id
),
status_counts AS (
    SELECT COUNT(*) as total_products,
        COUNT(
            CASE
                WHEN status = 'active' THEN 1
            END
        ) as active_products,
        COUNT(
            CASE
                WHEN status = 'archived' THEN 1
            END
        ) as archived_products,
        COUNT(
            CASE
                WHEN status = 'draft' THEN 1
            END
        ) as draft_products
    FROM all_products
),
discount_rules_applied AS (
    SELECT DISTINCT
        dr.id,
        dr.name,
        dr.discount_type,
        dr.discount_value,
        dr.priority
    FROM all_products ap
    JOIN discount_rule_items dri ON (
        (dri.item_type = 'brand' AND dri.item_id = ap.brand_id) OR
        (dri.item_type = 'line'   AND dri.item_id = ap.line_id) OR
        (dri.item_type = 'product' AND dri.item_id = ap.id)
    )
    JOIN discount_rules dr ON dr.id = dri.rule_id
    WHERE dr.is_active = true
        AND dr.starts_at <= NOW()
        AND (dr.ends_at IS NULL OR dr.ends_at > NOW())
)
SELECT -- Все размеры
    COALESCE(
        (
            SELECT jsonb_object_agg(size_key, count)
            FROM size_data
        ),
        '{}'::jsonb
    ) as sizes,
    -- Статистика по типам тела
    COALESCE(
        (
            SELECT jsonb_object_agg(bodytype::text, count)
            FROM bodytype_counts
        ),
        '{}'::jsonb
    ) as bodytypes,
    -- Ценовой диапазон
    (
        SELECT min_price
        FROM price_range
    ) as min_price,
    (
        SELECT max_price
        FROM price_range
    ) as max_price,
    -- Статистика по брендам
    COALESCE(
        (
            SELECT jsonb_object_agg(firm, firm_count)
            FROM firm_counts
        ),
        '{}'::jsonb
    ) as firms,
    -- Типы товаров
    COALESCE(
        (
            SELECT jsonb_agg(
                    product_type_id
                )
            FROM type_data
        ),
        '[]'::jsonb
    ) AS product_types,
    -- Категории товаров
    COALESCE(
        (
            SELECT jsonb_agg(
                    jsonb_build_object(
                        'category_id',
                        category_id,
                        'category_name',
                        category_name,
                        'count',
                        category_count
                    )
                )
            FROM category_data
        ),
        '[]'::jsonb
    ) as categories,
    -- Статистика по статусам
    (
        SELECT total_products
        FROM status_counts
    ) as total_products,
    (
        SELECT active_products
        FROM status_counts
    ) as active_products,
    (
        SELECT archived_products
        FROM status_counts
    ) as archived_products,
    (
        SELECT draft_products
        FROM status_counts
    ) as draft_products,
    -- Правила скидок
    COALESCE(
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'name', name,
                    'discount_type', discount_type,
                    'discount_value', discount_value,
                    'priority', priority
                )
            ) FROM discount_rules_applied
        ),
        '[]'::jsonb
    ) as discount_rules;


-- name: GetDiscountRuleByID :one
SELECT id
FROM discount_rules
WHERE id = @id::int;
-- name: UpdateProductPrice :exec
UPDATE products
SET sizes = @sizes::jsonb,
    minprice = @minprice::int,
    maxprice = @maxprice::int,
    updated_at = NOW()
WHERE id = @id::int;
-- name: GetProductsWithSizesByIDs :many
SELECT p.id,
    p.sizes,
    p.minprice,
    p.maxprice
FROM products p
WHERE p.id = ANY(@product_ids::int [])
    AND p.status != 'deleted';
-- name: GetProductIDsForAdminByFilters :many
SELECT p.id
FROM products p
    JOIN brands b ON p.brand_id = b.id
    LEFT JOIN discount d ON p.id = d.productid
    LEFT JOIN store_house sh ON p.id = sh.productid
    LEFT JOIN brand_lines bl ON p.line_id = bl.id
WHERE p.status != 'deleted'
    AND (
        @status::text IS NULL
        OR @status::text = ''
        OR p.status = @status::text
    ) -- Размеры
    AND (
        COALESCE(array_length(@sizes::text [], 1), 0) = 0
        OR EXISTS (
            SELECT 1
            FROM jsonb_object_keys(p.sizes) AS size_key
            WHERE size_key = ANY(@sizes::text [])
                AND (p.sizes->size_key->>'price')::numeric > 0
        )
    ) -- Поиск
    AND (
        @name::text IS NULL
        OR @name::text = ''
        OR p.name ILIKE '%' || @name::text || '%'
        OR p.article ILIKE '%' || @name::text || '%'
    ) -- Категории
    AND (
        COALESCE(array_length(@categories::int [], 1), 0) = 0
        OR p.category = ANY(@categories::int [])
    ) -- Типы
    AND (
        COALESCE(array_length(@product_types::int [], 1), 0) = 0
        OR p.type = ANY(@product_types::int [])
    ) -- Фирмы (теперь по brand_id)
    AND (
        COALESCE(array_length(@firms::int [], 1), 0) = 0
        OR p.brand_id = ANY(@firms::int [])
    ) -- Линии (теперь по line_id)
    AND (
        COALESCE(array_length(@lines::int [], 1), 0) = 0
        OR p.line_id = ANY(@lines::int [])
    ) -- Типы тела
    AND (
        COALESCE(array_length(@bodytypes::text [], 1), 0) = 0
        OR p.bodytype = ANY(@bodytypes::body_enum [])
    ) -- Цены
    AND (
        sqlc.narg('minprice')::int IS NULL
        OR p.maxprice >= sqlc.narg('minprice')::int
    )
    AND (
        sqlc.narg('maxprice')::int IS NULL
        OR p.minprice <= sqlc.narg('maxprice')::int
    )
    AND (
        sqlc.narg('created_from')::timestamptz IS NULL
        OR p.created_at >= sqlc.narg('created_from')::timestamptz
    )
    AND (
        sqlc.narg('updated_from')::timestamptz IS NULL
        OR p.updated_at >= sqlc.narg('updated_from')::timestamptz
    ) -- Скидка
    AND (
        @has_discount::boolean IS NULL
        OR @has_discount::boolean = false
        OR d.id IS NOT NULL
    ) -- В наличии
    AND (
        @in_store::boolean IS NULL
        OR @in_store::boolean = false
        OR (
            sh.id IS NOT NULL
            AND sh.quantity > 0
        )
    ) -- Исключаем ID (если переданы)
    AND (
        COALESCE(array_length(@exclude_ids::int [], 1), 0) = 0
        OR p.id != ALL(@exclude_ids::int [])
    ) -- Цена > 0
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
    p.id ASC
LIMIT CASE
        WHEN @limitVal::integer > 0 THEN @limitVal::integer
        ELSE 50
    END OFFSET CASE
        WHEN @offsetVal::integer > 0 THEN @offsetVal::integer
        ELSE 0
    END;
-- name: GetProductsForAdminByFilters :many
SELECT p.id,
    p.name,
    p.image_path,
    b.name AS firm,
    p.type,
    p.category,
    p.minprice,
    p.maxprice,
    p.status,
    p.updated_at,
    -- Итоговый процент скидки: максимальный процент из всех размеров в discount
    COALESCE(
        (
            SELECT MAX((item.value->>'percent')::int)
            FROM jsonb_each(d.value) AS item
        ),
        0
    ) AS discount_percent,
    COUNT(*) FILTER (
        WHERE p.status = 'active'
    ) OVER() AS active_count,
    COUNT(*) OVER() AS total_count
FROM products p
    JOIN brands b ON p.brand_id = b.id
    LEFT JOIN brand_lines bl ON p.line_id = bl.id
    LEFT JOIN store_house sh ON p.id = sh.productid
    LEFT JOIN discount d ON p.id = d.productid
WHERE p.status != 'deleted' -- Статус
    AND (
        @status::text IS NULL
        OR @status::text = ''
        OR p.status = @status::text
    ) -- Размеры
    AND (
        COALESCE(array_length(@sizes::text [], 1), 0) = 0
        OR EXISTS (
            SELECT 1
            FROM jsonb_object_keys(p.sizes) AS size_key
            WHERE size_key = ANY(@sizes::text [])
                AND (p.sizes->size_key->>'price')::numeric > 0
        )
    ) -- Поиск
    AND (
        @name::text IS NULL
        OR @name::text = ''
        OR p.name ILIKE '%' || @name::text || '%'
        OR p.article ILIKE '%' || @name::text || '%'
    ) -- Категории
    AND (
        COALESCE(array_length(@categories::int [], 1), 0) = 0
        OR p.category = ANY(@categories::int [])
    ) -- Типы
    AND (
        COALESCE(array_length(@product_types::int [], 1), 0) = 0
        OR p.type = ANY(@product_types::int [])
    ) -- Фирмы
    AND (
        COALESCE(array_length(@firms::int [], 1), 0) = 0
        OR p.brand_id = ANY(@firms::int [])
    ) -- Линии
    AND (
        COALESCE(array_length(@lines::int [], 1), 0) = 0
        OR p.line_id = ANY(@lines::int [])
    ) -- Типы тела
    AND (
        COALESCE(array_length(@bodytypes::text [], 1), 0) = 0
        OR p.bodytype = ANY(@bodytypes::body_enum [])
    ) -- Цены
    AND (
        sqlc.narg('minprice')::int IS NULL
        OR p.maxprice >= sqlc.narg('minprice')::int
    )
    AND (
        sqlc.narg('maxprice')::int IS NULL
        OR p.minprice <= sqlc.narg('maxprice')::int
    )
    AND (
        sqlc.narg('created_from')::timestamptz IS NULL
        OR p.created_at >= sqlc.narg('created_from')::timestamptz
    )
    AND (
        sqlc.narg('updated_from')::timestamptz IS NULL
        OR p.updated_at >= sqlc.narg('updated_from')::timestamptz
    ) -- Скидка (наличие)
    AND (
        @has_discount::boolean IS NULL
        OR @has_discount::boolean = false
        OR d.productid IS NOT NULL
    ) -- В наличии
    AND (
        @in_store::boolean IS NULL
        OR @in_store::boolean = false
        OR (
            sh.id IS NOT NULL
            AND sh.quantity > 0
        )
    ) -- Цена > 0
    AND (
        @with_price::boolean IS NULL
        OR @with_price::boolean = false
        OR p.minprice > 0
    )
ORDER BY -- Сортировка по имени
    CASE
        WHEN @sort_type::int = 1 THEN p.name
    END ASC,
    CASE
        WHEN @sort_type::int = 2 THEN p.name
    END DESC,
    -- Сортировка по цене
    CASE
        WHEN @sort_type::int = 3 THEN p.minprice
    END ASC,
    CASE
        WHEN @sort_type::int = 4 THEN p.minprice
    END DESC,
    -- Сортировка по бренду
    CASE
        WHEN @sort_type::int = 5 THEN b.name
    END ASC,
    CASE
        WHEN @sort_type::int = 6 THEN b.name
    END DESC,
    -- Сортировка по скидке
    CASE
        WHEN @sort_type::int = 7 THEN COALESCE(
            (
                SELECT MAX((item.value->>'percent')::int)
                FROM jsonb_each(d.value) AS item
            ),
            0
        )
    END ASC,
    CASE
        WHEN @sort_type::int = 8 THEN COALESCE(
            (
                SELECT MAX((item.value->>'percent')::int)
                FROM jsonb_each(d.value) AS item
            ),
            0
        )
    END DESC,
    -- Сортировка по дате создания
    CASE
        WHEN @sort_type::int = 9 THEN p.created_at
    END ASC,
    CASE
        WHEN @sort_type::int = 10 THEN p.created_at
    END DESC,
    -- Сортировка по дате обновления
    CASE
        WHEN @sort_type::int = 11 THEN p.updated_at
    END ASC NULLS LAST,
    CASE
        WHEN @sort_type::int = 12 THEN p.updated_at
    END DESC NULLS LAST,
    -- Сортировка по статусу
    CASE
        WHEN @sort_type::int = 13 THEN p.status
    END ASC,
    CASE
        WHEN @sort_type::int = 14 THEN p.status
    END DESC,
    -- Вторичная сортировка по id для стабильности
    p.id ASC
LIMIT CASE
        WHEN @limitVal::integer > 0 THEN @limitVal::integer
        ELSE 50
    END OFFSET CASE
        WHEN @offsetVal::integer > 0 THEN @offsetVal::integer
        ELSE 0
    END;
-- name: GetAdminProductsInfoById :one
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
    p.status,
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
-- name: GetOrdersWithFilters :many
SELECT *
FROM (
        SELECT o.id,
            o.customerid,
            o.unregistercustomerid,
            o.orderdate,
            o.status,
            o.hash,
            o.deliveryprice,
            o.deliverytype,
            -- Оставляем как есть, без COALESCE
            o.created_at,
            COALESCE(c.name, uc.name, '')::text as customer_name,
            COALESCE(c.secondname, uc.secondname, '')::text as customer_secondname,
            COALESCE(c.mail, uc.mail, '')::text as customer_email,
            COALESCE(c.phone, uc.phone, '')::text as customer_phone,
            COALESCE(oa.town, '') as town,
            COALESCE(oa.street, '') as street,
            COALESCE(oa.house, '') as house,
            COALESCE(oa.flat, '') as flat,
            COUNT(oi.id) as items_count,
            COALESCE(SUM(oi.quantity * oi.price), 0) as total_amount
        FROM orders o
            LEFT JOIN customers c ON o.customerid = c.id
            LEFT JOIN unregistercustomer uc ON o.unregistercustomerid = uc.id
            LEFT JOIN orderaddress oa ON o.id = oa.orderid
            LEFT JOIN orderitems oi ON o.id = oi.orderid
        WHERE (
                sqlc.narg('status')::status_enum IS NULL
                OR o.status = sqlc.narg('status')
            )
            AND (
                sqlc.narg('delivery_type')::text = ''
                OR sqlc.narg('delivery_type') IS NULL
                OR o.deliverytype = sqlc.narg('delivery_type')::delivery_enum
            )
            AND (
                sqlc.narg('date_from')::date IS NULL
                OR o.orderdate >= sqlc.narg('date_from')
            )
            AND (
                sqlc.narg('date_to')::date IS NULL
                OR o.orderdate <= sqlc.narg('date_to')
            )
            AND (
                sqlc.narg('customer_id')::int IS NULL
                OR o.customerid = sqlc.narg('customer_id')
            )
            AND (
                sqlc.narg('search')::text IS NULL
                OR o.id::text LIKE '%' || sqlc.narg('search') || '%'
                OR c.name ILIKE '%' || sqlc.narg('search') || '%'
                OR c.mail ILIKE '%' || sqlc.narg('search') || '%'
                OR uc.name ILIKE '%' || sqlc.narg('search') || '%'
                OR uc.mail ILIKE '%' || sqlc.narg('search') || '%'
            )
        GROUP BY o.id,
            c.id,
            uc.id,
            oa.id
    ) AS filtered_orders
ORDER BY CASE
        WHEN @sort_by::text = 'date_desc' THEN orderdate
    END DESC,
    CASE
        WHEN @sort_by::text = 'date_asc' THEN orderdate
    END ASC,
    CASE
        WHEN @sort_by::text = 'amount_desc' THEN total_amount
    END DESC,
    CASE
        WHEN @sort_by::text = 'amount_asc' THEN total_amount
    END ASC,
    orderdate DESC;
-- name: GetOrderDetails :one
SELECT o.id,
    o.customerid,
    o.unregistercustomerid,
    o.orderdate,
    o.status,
    o.hash,
    o.deliveryprice,
    o.deliverytype,
    o.created_at,
    COALESCE(c.name, uc.name)::text as customer_name,
    COALESCE(c.secondname, uc.secondname)::text as customer_secondname,
    COALESCE(c.mail, uc.mail)::text as customer_email,
    COALESCE(c.phone, uc.phone)::text as customer_phone,
    oa.town,
    oa.index,
    oa.street,
    oa.house,
    oa.flat,
    oa.region,
    oa.coordinates,
    oa.deliverycomment,
    (
        SELECT json_agg(
                json_build_object(
                    'id',
                    oi.id,
                    'product_id',
                    oi.productid,
                    'quantity',
                    oi.quantity,
                    'price',
                    oi.price,
                    'name',
                    oi.name,
                    'size',
                    oi.size,
                    'image_path',
                    oi.image_path
                )
            )
        FROM orderitems oi
        WHERE oi.orderid = o.id
    ) as items
FROM orders o
    LEFT JOIN customers c ON o.customerid = c.id
    LEFT JOIN unregistercustomer uc ON o.unregistercustomerid = uc.id
    LEFT JOIN orderaddress oa ON o.id = oa.orderid
WHERE o.id = @order_id;
-- name: UpdateOrderStatus :exec
UPDATE orders
SET status = @status::status_enum
WHERE id = @order_id;
-- name: GetOrdersCount :one
SELECT COUNT(*) as total
FROM orders o
WHERE (
        sqlc.narg('status')::status_enum IS NULL
        OR o.status = sqlc.narg('status')
    )
    AND (
        sqlc.narg('delivery_type')::delivery_enum IS NULL
        OR o.deliverytype = sqlc.narg('delivery_type')
    )
    AND (
        sqlc.narg('date_from')::date IS NULL
        OR o.orderdate >= sqlc.narg('date_from')
    )
    AND (
        sqlc.narg('date_to')::date IS NULL
        OR o.orderdate <= sqlc.narg('date_to')
    );
-- ========== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ==========
-- name: GetCustomersList :many
SELECT id,
    name,
    secondname,
    mail,
    phone,
    town,
    index,
    street,
    region,
    home,
    flat,
    sendmail,
    created_at,
    (
        SELECT COUNT(*)
        FROM orders o
        WHERE o.customerid = c.id
    ) as orders_count,
    (
        SELECT COALESCE(SUM(oi.quantity * oi.price), 0)
        FROM orders o
            JOIN orderitems oi ON o.id = oi.orderid
        WHERE o.customerid = c.id
    ) as total_spent,
    (
        SELECT MAX(o.orderdate)
        FROM orders o
        WHERE o.customerid = c.id
    ) as last_order_date
FROM customers c
WHERE (
        sqlc.narg('search')::text IS NULL
        OR c.name ILIKE '%' || sqlc.narg('search') || '%'
        OR c.mail ILIKE '%' || sqlc.narg('search') || '%'
        OR c.phone ILIKE '%' || sqlc.narg('search') || '%'
    )
ORDER BY CASE
        WHEN @sort_by::text = 'name' THEN c.name
    END ASC,
    CASE
        WHEN @sort_by::text = 'date_desc' THEN c.created_at
    END DESC,
    CASE
        WHEN @sort_by::text = 'orders_desc' THEN orders_count
    END DESC,
    c.created_at DESC
LIMIT @limit_val OFFSET @offset_val;
-- name: GetCustomerDetails :one
SELECT c.*,
    json_agg(
        json_build_object(
            'id',
            o.id,
            'order_date',
            o.orderdate,
            'status',
            o.status,
            'total_amount',
            (
                SELECT COALESCE(SUM(oi.quantity * oi.price), 0)
                FROM orderitems oi
                WHERE oi.orderid = o.id
            ),
            'items_count',
            (
                SELECT COUNT(*)
                FROM orderitems oi
                WHERE oi.orderid = o.id
            )
        )
        ORDER BY o.orderdate DESC
    ) as orders_history
FROM customers c
    LEFT JOIN orders o ON c.id = o.customerid
WHERE c.id = @customer_id
GROUP BY c.id;
-- name: GetUnregisterCustomersList :many
SELECT id,
    name,
    secondname,
    mail,
    phone,
    town,
    index,
    street,
    settlement,
    region,
    house,
    flat,
    created_at,
    (
        SELECT COUNT(*)
        FROM orders o
        WHERE o.unregistercustomerid = uc.id
    ) as orders_count
FROM unregistercustomer uc
WHERE (
        sqlc.narg('search')::text IS NULL
        OR uc.name ILIKE '%' || sqlc.narg('search') || '%'
        OR uc.mail ILIKE '%' || sqlc.narg('search') || '%'
        OR uc.phone ILIKE '%' || sqlc.narg('search') || '%'
    )
ORDER BY uc.created_at DESC
LIMIT @limit_val OFFSET @offset_val;
-- name: GetCustomersCount :one
SELECT COUNT(*)
FROM customers;
-- name: GetUnregisterCustomersCount :one
SELECT COUNT(*)
FROM unregistercustomer;
-- ========== АДМИНИСТРАТОРЫ ==========
-- name: GetAdminsList :many
SELECT id,
    email,
    name,
    role,
    is_active,
    last_login_at,
    last_login_ip,
    created_at
FROM admins
WHERE (
        sqlc.narg('role')::admin_role_enum IS NULL
        OR role = sqlc.narg('role')
    )
    AND (
        sqlc.narg('is_active')::boolean IS NULL
        OR is_active = sqlc.narg('is_active')
    )
    AND (
        sqlc.narg('search')::text IS NULL
        OR email ILIKE '%' || sqlc.narg('search') || '%'
        OR name ILIKE '%' || sqlc.narg('search') || '%'
    )
ORDER BY created_at DESC
LIMIT @limit_val OFFSET @offset_val;
-- name: CreateAdmin :one
INSERT INTO admins (email, password_hash, name, role, is_active)
VALUES (@email, @password_hash, @name, @role, @is_active)
RETURNING id,
    email,
    name,
    role,
    is_active,
    created_at;
-- name: UpdateAdmin :exec
UPDATE admins
SET name = COALESCE(sqlc.narg('name'), name),
    role = COALESCE(sqlc.narg('role'), role),
    is_active = COALESCE(sqlc.narg('is_active'), is_active),
    updated_at = NOW()
WHERE id = @admin_id;
-- ========== ЛОГИ АДМИНИСТРАТОРОВ ==========
-- name: GetAdminLogsCount :one
SELECT COUNT(*)
FROM admin_logs al
WHERE (
        sqlc.narg('admin_id')::int IS NULL
        OR al.admin_id = sqlc.narg('admin_id')
    )
    AND (
        sqlc.narg('action')::text IS NULL
        OR al.action = sqlc.narg('action')
    )
    AND (
        sqlc.narg('entity_type')::text IS NULL
        OR al.entity_type = sqlc.narg('entity_type')
    );
-- ========== СТАТИСТИКА ДЛЯ ДАШБОРДА ==========
-- name: GetDashboardStats :one
SELECT (
        SELECT COUNT(*)
        FROM orders
    ) as total_orders,
    (
        SELECT COUNT(*)
        FROM orders
        WHERE status = 'pending'
    ) as pending_orders,
    (
        SELECT COUNT(*)
        FROM orders
        WHERE status = 'approved'
    ) as approved_orders,
    (
        SELECT COUNT(*)
        FROM orders
        WHERE orderdate = CURRENT_DATE
    ) as today_orders,
    (
        SELECT COUNT(*)
        FROM customers
    ) as total_customers,
    (
        SELECT COUNT(*)
        FROM customers
        WHERE created_at::date = CURRENT_DATE
    ) as today_customers,
    (
        SELECT COALESCE(SUM(oi.quantity * oi.price), 0)
        FROM orders o
            JOIN orderitems oi ON o.id = oi.orderid
        WHERE o.orderdate = CURRENT_DATE
    ) as today_revenue,
    (
        SELECT COALESCE(SUM(oi.quantity * oi.price), 0)
        FROM orders o
            JOIN orderitems oi ON o.id = oi.orderid
        WHERE o.orderdate >= DATE_TRUNC('month', CURRENT_DATE)
    ) as month_revenue,
    (
        SELECT COUNT(*)
        FROM products
        WHERE status = 'active'
    ) as active_products,
    (
        SELECT COUNT(*)
        FROM products
        WHERE status = 'archived'
    ) as archived_products;
-- name: GetRecentOrders :many
SELECT o.id,
    o.orderdate,
    o.status,
    o.deliverytype,
    COALESCE(c.name, uc.name)::text as customer_name,
    (
        SELECT COALESCE(SUM(oi.quantity * oi.price), 0)
        FROM orderitems oi
        WHERE oi.orderid = o.id
    ) as total_amount
FROM orders o
    LEFT JOIN customers c ON o.customerid = c.id
    LEFT JOIN unregistercustomer uc ON o.unregistercustomerid = uc.id
ORDER BY o.created_at DESC
LIMIT 10;
-- name: GetRecentActivity :many
SELECT al.id,
    al.action,
    al.entity_type,
    al.entity_id,
    al.created_at,
    a.name as admin_name
FROM admin_logs al
    JOIN admins a ON al.admin_id = a.id
ORDER BY al.created_at DESC
LIMIT 20;
-- name: GetAdminBanners :many
SELECT id,
    title,
    image_url,
    link_url,
    is_active,
    created_at
FROM banners;
-- name: DeleteBrand :exec
DELETE FROM brands
WHERE id = $1;
-- name: CreateAdminInvite :one
INSERT INTO admin_invites (email, role, token, invited_by, expires_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;
-- name: GetAdminInviteByToken :one
SELECT *
FROM admin_invites
WHERE token = $1
    AND used_at IS NULL
    AND expires_at > NOW()
LIMIT 1;
-- name: MarkInviteAsUsed :exec
UPDATE admin_invites
SET used_at = NOW(),
    used_by = $2,
    updated_at = NOW()
WHERE token = $1
    AND used_at IS NULL
    AND expires_at > NOW();



-- name: CreateOrderEvent :exec
INSERT INTO order_events (
    order_id,
    event_type,
    old_status,
    new_status,
    reason,
    reason_code,
    changed_by_admin,
    changed_by_type,
    ip_address
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
);

-- name: GetOrderEvents :many
SELECT 
    oe.*,
    a.name as admin_name,
    a.email as admin_email
FROM order_events oe
LEFT JOIN admins a ON oe.changed_by_admin = a.id
WHERE oe.order_id = $1
ORDER BY oe.created_at DESC;

-- name: GetOrderStatusHistory :many
SELECT * FROM order_events 
WHERE order_id = $1 AND event_type = 'status_change'
ORDER BY created_at DESC;

-- name: MarkProductsAsDeleted :exec
UPDATE products 
SET status = 'deleted', 
    deleted_at = NOW() 
WHERE id = ANY($1::int[]);

-- queries/products.sql

-- name: GetProductsWithoutImages :many
SELECT 
    p.id,
    p.name,
    p.article,
    p.image_path,
    p.status,
    p.image_count,
    b.name as firm,
    b.slug as brand_slug
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.image_path IS NOT NULL 
  AND p.image_path != ''
  AND p.status != 'deleted'
ORDER BY p.id;





-- name: CreatePageWidget :one
INSERT INTO page_widgets (
    name,
    type,
    sort_order,
    is_active,
    settings,
    link_url
) VALUES (
    $1, $2, $3, $4, $5, $6
)
RETURNING *;

-- name: GetPageWidget :one
SELECT * FROM page_widgets
WHERE id = $1;

-- name: GetActivePageWidgets :many
SELECT * FROM page_widgets
WHERE is_active = true
ORDER BY sort_order ASC, id ASC;

-- name: GetAllPageWidgets :many
SELECT * FROM page_widgets
ORDER BY sort_order ASC, id ASC;

-- name: UpdatePageWidget :one
UPDATE page_widgets
SET
    name = COALESCE(sqlc.narg('name')::text, name),
    type = COALESCE(sqlc.narg('type')::text, type),
    sort_order = COALESCE(sqlc.narg('sort_order')::int, sort_order),
    is_active = COALESCE(sqlc.narg('is_active')::bool, is_active),
    settings = COALESCE(sqlc.narg('settings')::jsonb, settings),
    link_url = COALESCE(sqlc.narg('link_url')::text, link_url)
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DeletePageWidget :exec
DELETE FROM page_widgets
WHERE id = $1;

-- name: ReorderPageWidgets :exec
UPDATE page_widgets
SET sort_order = new_order
FROM (VALUES 
    (@id::int, @new_order::int)
) AS new_sort(id, new_order)
WHERE page_widgets.id = new_sort.id;

-- name: CountPageWidgets :one
SELECT COUNT(*) FROM page_widgets;




-- name: GetBestDiscountsForProducts :many
SELECT 
    p.id as product_id,
    -- Выбираем лучшую скидку по приоритету
    COALESCE(
        pd.discount_value, 
        bd.discount_value, 
        ld.discount_value, 
        0
    ) as discount_value,
    COALESCE(
        pd.discount_type, 
        bd.discount_type, 
        ld.discount_type, 
        'percentage'
    ) as discount_type,
    COALESCE(
        pd.rule_id, 
        bd.rule_id, 
        ld.rule_id, 
        0
    ) as rule_id,
    COALESCE(
        pd.priority, 
        bd.priority, 
        ld.priority, 
        0
    ) as priority
FROM products p
-- Скидка на конкретный товар (самый высокий приоритет)
LEFT JOIN (
    SELECT DISTINCT ON (dri.item_id) 
        dri.item_id as product_id,
        dr.discount_value,
        dr.discount_type,
        dr.id as rule_id,
        dr.priority
    FROM discount_rule_items dri
    JOIN discount_rules dr ON dr.id = dri.rule_id
    WHERE dri.item_type = 'product'
      AND dr.is_active = true
      AND dr.starts_at <= NOW()
      AND (dr.ends_at IS NULL OR dr.ends_at >= NOW())
    ORDER BY dri.item_id, dr.priority DESC
) pd ON pd.product_id = p.id
-- Скидка на бренд
LEFT JOIN (
    SELECT DISTINCT ON (dri.item_id) 
        dri.item_id as brand_id,
        dr.discount_value,
        dr.discount_type,
        dr.id as rule_id,
        dr.priority
    FROM discount_rule_items dri
    JOIN discount_rules dr ON dr.id = dri.rule_id
    WHERE dri.item_type = 'brand'
      AND dr.is_active = true
      AND dr.starts_at <= NOW()
      AND (dr.ends_at IS NULL OR dr.ends_at >= NOW())
    ORDER BY dri.item_id, dr.priority DESC
) bd ON bd.brand_id = p.brand_id
-- Скидка на линию
LEFT JOIN (
    SELECT DISTINCT ON (dri.item_id) 
        dri.item_id as line_id,
        dr.discount_value,
        dr.discount_type,
        dr.id as rule_id,
        dr.priority
    FROM discount_rule_items dri
    JOIN discount_rules dr ON dr.id = dri.rule_id
    WHERE dri.item_type = 'line'
      AND dr.is_active = true
      AND dr.starts_at <= NOW()
      AND (dr.ends_at IS NULL OR dr.ends_at >= NOW())
    ORDER BY dri.item_id, dr.priority DESC
) ld ON ld.line_id = p.line_id
WHERE p.id = ANY($1::int[])
  AND (
      pd.product_id IS NOT NULL 
      OR bd.brand_id IS NOT NULL 
      OR ld.line_id IS NOT NULL
  );



-- name: GetProductIDsByBrandForAdmin :many
SELECT id FROM products
WHERE brand_id = $1;


-- name: GetProductIDsByLineForAdmin :many
SELECT id FROM products
WHERE line_id = $1;  