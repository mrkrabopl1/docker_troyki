-- name: CreatePromoCode :one
INSERT INTO promo_codes (
    code,
    name,
    description,
    discount_type,
    discount_value,
    applies_to,
    collection_id,
    min_order,
    max_order,
    max_discount,
    starts_at,
    ends_at,
    usage_limit,
    per_user_limit,
    is_active
) VALUES (
    @code,
    @name,
    @description,
    @discount_type,
    @discount_value,
    @applies_to,
    @collection_id,
    @min_order,
    @max_order,
    @max_discount,
    @starts_at,
    @ends_at,
    @usage_limit,
    @per_user_limit,
    @is_active
) RETURNING *;

-- name: GetPromoCodeByID :one
SELECT 
    pc.*,
    c.slug as collection_slug,
    c.name as collection_name,
    COALESCE(
        (SELECT COUNT(*) FROM promo_code_usage WHERE promo_code_id = pc.id),
        0
    )::bigint as usage_count
FROM promo_codes pc
LEFT JOIN collections c ON pc.collection_id = c.id
WHERE pc.id = @id;

-- name: GetPromoCodeByCode :one
SELECT 
    pc.*,
    c.slug as collection_slug,
    c.name as collection_name,
    COALESCE(
        (SELECT COUNT(*) FROM promo_code_usage WHERE promo_code_id = pc.id),
        0
    ) as usage_count
FROM promo_codes pc
LEFT JOIN collections c ON pc.collection_id = c.id
WHERE pc.code = @code;

-- name: ListPromoCodes :many
SELECT 
    pc.*,
    c.slug as collection_slug,
    c.name as collection_name,
    COALESCE(
        (SELECT COUNT(*) FROM promo_code_usage WHERE promo_code_id = pc.id),
        0
    ) as usage_count
FROM promo_codes pc
LEFT JOIN collections c ON pc.collection_id = c.id
ORDER BY pc.id DESC;

-- name: UpdatePromoCode :one
UPDATE promo_codes
SET
    name = COALESCE(sqlc.narg('name'), name),
    description = COALESCE(sqlc.narg('description'), description),
    discount_type = COALESCE(sqlc.narg('discount_type'), discount_type),
    discount_value = COALESCE(sqlc.narg('discount_value'), discount_value),
    applies_to = COALESCE(sqlc.narg('applies_to'), applies_to),
    collection_id = COALESCE(sqlc.narg('collection_id'), collection_id),
    min_order = COALESCE(sqlc.narg('min_order'), min_order),
    max_order = COALESCE(sqlc.narg('max_order'), max_order),
    max_discount = COALESCE(sqlc.narg('max_discount'), max_discount),
    starts_at = COALESCE(sqlc.narg('starts_at'), starts_at),
    ends_at = sqlc.narg('ends_at'),
    usage_limit = COALESCE(sqlc.narg('usage_limit'), usage_limit),
    per_user_limit = COALESCE(sqlc.narg('per_user_limit'), per_user_limit),
    is_active = COALESCE(sqlc.narg('is_active'), is_active),
    updated_at = NOW()
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DeletePromoCode :exec
DELETE FROM promo_codes WHERE id = @id;

-- name: GetPromoCodeUsageStats :one
SELECT 
    COUNT(*) as total_uses,
    COALESCE(SUM(discount_amount), 0) as total_discount,
    COUNT(DISTINCT customer_id) as unique_customers
FROM promo_code_usage
WHERE promo_code_id = @id;

-- name: ValidatePromoCode :one
SELECT 
    pc.*,
    c.slug as collection_slug,
    c.name as collection_name,
    COALESCE(
        (SELECT COUNT(*) FROM promo_code_usage WHERE promo_code_id = pc.id),
        0
    ) as usage_count
FROM promo_codes pc
LEFT JOIN collections c ON pc.collection_id = c.id
WHERE pc.code = @code
  AND pc.is_active = true
  AND NOW() BETWEEN pc.starts_at AND COALESCE(pc.ends_at, 'infinity')
  AND (pc.usage_limit = 0 OR (
      SELECT COUNT(*) FROM promo_code_usage WHERE promo_code_id = pc.id
  ) < pc.usage_limit)
LIMIT 1;

-- name: CheckPromoCodeUsageByCustomer :one
SELECT COUNT(*) as used_count
FROM promo_code_usage
WHERE promo_code_id = @promo_code_id 
  AND customer_id = @customer_id;

-- name: CreatePromoCodeUsage :one
INSERT INTO promo_code_usage (
    promo_code_id,
    order_id,
    customer_id,
    discount_amount,
    promo_code_snapshot
) VALUES (
    @promo_code_id,
    @order_id,
    @customer_id,
    @discount_amount,
    @promo_code_snapshot
) RETURNING *;

-- name: GetPromoCodeUsageByOrder :one
SELECT 
    pu.*,
    pc.code,
    pc.name,
    pc.discount_type,
    pc.discount_value,
    pu.promo_code_snapshot
FROM promo_code_usage pu
JOIN promo_codes pc ON pu.promo_code_id = pc.id
WHERE pu.order_id = @order_id
LIMIT 1;

-- name: ListPromoCodesWithFilters :many
SELECT 
    pc.*,
    c.slug as collection_slug,
    c.name as collection_name,
    COALESCE(
        (SELECT COUNT(*) FROM promo_code_usage WHERE promo_code_id = pc.id),
        0
    ) as usage_count
FROM promo_codes pc
LEFT JOIN collections c ON pc.collection_id = c.id
WHERE 
    (@code IS NULL OR pc.code ILIKE '%' || @code || '%')
    AND (@is_active IS NULL OR pc.is_active = @is_active)
    AND (@applies_to IS NULL OR pc.applies_to = @applies_to)
    AND (pc.starts_at >= @starts_from OR @starts_from IS NULL)
    AND (pc.starts_at <= @starts_to OR @starts_to IS NULL)
ORDER BY 
    CASE WHEN @sort_by = 'created_at' THEN pc.created_at END DESC,
    CASE WHEN @sort_by = 'code' THEN pc.code END,
    CASE WHEN @sort_by = 'discount_value' THEN pc.discount_value END,
    pc.id DESC
LIMIT @limitVal
OFFSET @offsetVal;

-- name: CountPromoCodesWithFilters :one
SELECT COUNT(*) as total
FROM promo_codes pc
LEFT JOIN collections c ON pc.collection_id = c.id
WHERE 
    (@code IS NULL OR pc.code ILIKE '%' || @code || '%')
    AND (@is_active IS NULL OR pc.is_active = @is_active)
    AND (@applies_to IS NULL OR pc.applies_to = @applies_to)
    AND (pc.starts_at >= @starts_from OR @starts_from IS NULL)
    AND (pc.starts_at <= @starts_to OR @starts_to IS NULL);

-- name: GetActivePromoCodes :many
SELECT 
    pc.*,
    c.slug as collection_slug,
    c.name as collection_name,
    COALESCE(
        (SELECT COUNT(*) FROM promo_code_usage WHERE promo_code_id = pc.id),
        0
    ) as usage_count
FROM promo_codes pc
LEFT JOIN collections c ON pc.collection_id = c.id
WHERE pc.is_active = true
  AND NOW() BETWEEN pc.starts_at AND COALESCE(pc.ends_at, 'infinity')
  AND (pc.usage_limit = 0 OR (
      SELECT COUNT(*) FROM promo_code_usage WHERE promo_code_id = pc.id
  ) < pc.usage_limit)
ORDER BY pc.id DESC;

-- name: DeactivateExpiredPromoCodes :exec
UPDATE promo_codes
SET is_active = false,
    updated_at = NOW()
WHERE is_active = true
  AND ends_at IS NOT NULL
  AND ends_at < NOW();