-- name: CreateBanner :one
INSERT INTO banners (title, image_url, collection_id, is_active)
VALUES ($1, $2, $3, $4)
RETURNING id, title, image_url, collection_id, is_active, created_at, updated_at;


-- name: GetBannerByID :one
SELECT 
    b.id,
    b.title,
    b.image_url,
    b.collection_id,
    b.is_active,
    b.created_at,
    b.updated_at,
    c.slug as collection_slug
FROM banners b
INNER JOIN collections c ON b.collection_id = c.id
WHERE b.id = $1;

-- name: GetActiveBanners :many
SELECT 
    b.id,
    b.title,
    b.image_url,
    b.collection_id,
    c.slug as collection_slug
FROM banners b
INNER JOIN collections c ON b.collection_id = c.id
WHERE b.is_active = true
ORDER BY b.sort_order ASC, b.id ASC;

-- name: GetAllBanners :many
SELECT 
    b.id,
    b.title,
    b.image_url,
    b.collection_id,
    b.is_active,
    b.created_at,
    b.updated_at,
    c.slug as collection_slug
FROM banners b
INNER JOIN collections c ON b.collection_id = c.id
ORDER BY b.sort_order ASC, b.id ASC;

-- name: UpdateBanner :exec
UPDATE banners 
SET 
    title = COALESCE($2, title),
    image_url = COALESCE($3, image_url),
    collection_id = COALESCE($4, collection_id),
    is_active = COALESCE($5, is_active),
    updated_at = NOW()
WHERE id = $1;

-- name: UpdateBannerImage :exec
UPDATE banners 
SET image_url = $2, updated_at = NOW()
WHERE id = $1;

-- name: DeleteBanner :exec
DELETE FROM banners WHERE id = $1;

-- name: CountActiveBanners :one
SELECT COUNT(*) FROM banners WHERE is_active = true;