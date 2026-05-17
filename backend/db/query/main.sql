-- name: CreateBanner :one
INSERT INTO banners (title, image_url, link_url, is_active)
VALUES ($1, $2, $3, $4)
RETURNING id, title, image_url, link_url, is_active, created_at, updated_at;

-- name: GetBannerByID :one
SELECT id, title, image_url, link_url, is_active, created_at, updated_at
FROM banners
WHERE id = $1;

-- name: GetActiveBanners :many
SELECT id, title, image_url, link_url
FROM banners
WHERE is_active = true
ORDER BY id ASC;

-- name: GetAllBanners :many
SELECT id, title, image_url, link_url, is_active, created_at, updated_at
FROM banners
ORDER BY id DESC;

-- name: UpdateBanner :exec
UPDATE banners 
SET 
    title = COALESCE($2, title),
    image_url = COALESCE($3, image_url),
    link_url = COALESCE($4, link_url),
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