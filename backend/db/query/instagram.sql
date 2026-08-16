-- name: GetInstagramPosts :many
SELECT id, image_url, is_active, created_at 
FROM instagram_posts 
WHERE is_active = true 
ORDER BY id DESC;

-- name: GetAdminInstagramPosts :many
SELECT id, image_url, is_active, created_at 
FROM instagram_posts 
ORDER BY id DESC;

-- name: CountInstagramPosts :one
SELECT COUNT(*) FROM instagram_posts WHERE is_active = true;

-- name: CreateInstagramPost :one
INSERT INTO instagram_posts (image_url, is_active) 
VALUES ($1, true) 
RETURNING id, image_url, is_active, created_at;

-- name: DeleteInstagramPost :exec
DELETE FROM instagram_posts WHERE id = $1;

-- name: ToggleInstagramPost :one
UPDATE instagram_posts 
SET is_active = NOT is_active 
WHERE id = $1 
RETURNING id, image_url, is_active, created_at;