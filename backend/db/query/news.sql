-- news_blocks.sql

-- ============================================
-- NEWS BLOCKS - BASIC CRUD
-- ============================================

-- name: GetNewsBlocks :many
SELECT * FROM news_blocks 
ORDER BY sort_order ASC, id ASC;

-- name: GetActiveNewsBlocks :many
SELECT * FROM news_blocks 
WHERE is_active = true 
ORDER BY sort_order ASC, id ASC
LIMIT 10;

-- name: GetNewsBlockByID :one
SELECT * FROM news_blocks WHERE id = $1;

-- name: CreateNewsBlock :one
INSERT INTO news_blocks (
    title, cover_image_url, cover_alt_text, 
    is_active, published_at, sort_order
)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateNewsBlock :one
UPDATE news_blocks 
SET 
    title = COALESCE($2, title),
    cover_image_url = COALESCE($3, cover_image_url),
    cover_alt_text = COALESCE($4, cover_alt_text),
    is_active = COALESCE($5, is_active),
    published_at = COALESCE($6, published_at),
    sort_order = COALESCE($7, sort_order),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteNewsBlock :exec
DELETE FROM news_blocks WHERE id = $1;

-- name: CountActiveNewsBlocks :one
SELECT COUNT(*) FROM news_blocks WHERE is_active = true;

-- name: ReorderNewsBlock :exec
UPDATE news_blocks 
SET sort_order = $2, updated_at = NOW()
WHERE id = $1;

-- ============================================
-- NEWS BLOCKS - STATISTICS
-- ============================================

-- name: IncrementNewsBlockViews :exec
UPDATE news_blocks 
SET views_count = views_count + 1 
WHERE id = $1;

-- name: ToggleNewsBlockLike :exec
UPDATE news_blocks 
SET likes_count = likes_count + 1 
WHERE id = $1;

-- ============================================
-- NEWS BLOCKS - PUBLIC API (FILTERS, SEARCH, PAGINATION)
-- ============================================
-- name: GetNewsList :many
SELECT 
    nb.id,
    nb.title,
    nb.cover_image_url,
    nb.cover_alt_text,
    nb.is_active,
    nb.published_at,
    nb.created_at,
    nb.updated_at,
    nb.views_count,
    nb.likes_count,
    nb.sort_order,
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'id', ni.id,
                'news_block_id', ni.news_block_id,
                'item_type', ni.item_type,
                'content', ni.content,
                'image_url', ni.image_url,
                'link_url', ni.link_url,
                'layout', ni.layout,
                'sort_order', ni.sort_order,
                'created_at', ni.created_at,
                'updated_at', ni.updated_at
            ) ORDER BY ni.sort_order ASC
        ) FROM news_items ni 
        WHERE ni.news_block_id = nb.id),
        '[]'::json
    ) as items
FROM news_blocks nb
WHERE nb.is_active = true
    AND (
        @search::text = '' 
        OR nb.title ILIKE '%' || @search || '%' 
        OR EXISTS (
            SELECT 1 FROM news_items ni 
            WHERE ni.news_block_id = nb.id 
            AND ni.content ILIKE '%' || @search || '%'
        )
    )
ORDER BY 
    CASE 
        WHEN @sort_by::text = 'published_at' AND @sort_order::text = 'asc' THEN nb.published_at 
    END ASC,
    CASE 
        WHEN @sort_by::text = 'published_at' AND @sort_order::text = 'desc' THEN nb.published_at 
    END DESC,
    CASE 
        WHEN @sort_by::text = 'views_count' AND @sort_order::text = 'asc' THEN nb.views_count 
    END ASC,
    CASE 
        WHEN @sort_by::text = 'views_count' AND @sort_order::text = 'desc' THEN nb.views_count 
    END DESC,
    CASE 
        WHEN @sort_by::text = 'likes_count' AND @sort_order::text = 'asc' THEN nb.likes_count 
    END ASC,
    CASE 
        WHEN @sort_by::text = 'likes_count' AND @sort_order::text = 'desc' THEN nb.likes_count 
    END DESC,
    nb.published_at DESC
LIMIT @limitVal OFFSET @offsetVal;

-- name: GetNewsListCount :one
SELECT COUNT(*)
FROM news_blocks nb
WHERE nb.is_active = true
    AND (
        @search::text = '' 
        OR nb.title ILIKE '%' || @search || '%' 
        OR EXISTS (
            SELECT 1 FROM news_items ni 
            WHERE ni.news_block_id = nb.id 
            AND ni.content ILIKE '%' || @search || '%'
        )
    );

-- name: GetNewsBlockWithItems :one
SELECT 
    nb.id,
    nb.title,
    nb.cover_image_url,
    nb.cover_alt_text,
    nb.is_active,
    nb.published_at,
    nb.created_at,
    nb.updated_at,
    nb.views_count,
    nb.likes_count,
    nb.sort_order,
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'id', ni.id,
                'news_block_id', ni.news_block_id,
                'item_type', ni.item_type,
                'content', ni.content,
                'image_url', ni.image_url,
                'link_url', ni.link_url,
                'layout', ni.layout,
                'sort_order', ni.sort_order,
                'created_at', ni.created_at,
                'updated_at', ni.updated_at
            ) ORDER BY ni.sort_order ASC
        ) FROM news_items ni 
        WHERE ni.news_block_id = nb.id),
        '[]'::json
    ) as items
FROM news_blocks nb
WHERE nb.id = @id AND nb.is_active = true;

-- name: GetRelatedNews :many
SELECT *
FROM news_blocks
WHERE is_active = true 
    AND id != @id
ORDER BY published_at DESC
LIMIT @limitVal;

-- ============================================
-- NEWS ITEMS
-- ============================================

-- name: GetNewsItemsByBlock :many
SELECT * FROM news_items 
WHERE news_block_id = $1 
ORDER BY sort_order ASC, id ASC;

-- name: GetNewsItemByID :one
SELECT * FROM news_items WHERE id = $1;

-- name: CreateNewsItem :one
INSERT INTO news_items (
    news_block_id, item_type, content, image_url, link_url, layout, sort_order
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: UpdateNewsItem :one
UPDATE news_items 
SET 
    item_type = COALESCE($2, item_type),
    content = COALESCE($3, content),
    image_url = COALESCE($4, image_url),
    link_url = COALESCE($5, link_url),
    layout = COALESCE($6, layout),
    sort_order = COALESCE($7, sort_order),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteNewsItem :exec
DELETE FROM news_items WHERE id = $1;

-- name: DeleteNewsItemsByBlock :exec
DELETE FROM news_items WHERE news_block_id = $1;

-- name: ReorderNewsItem :exec
UPDATE news_items 
SET sort_order = $2, updated_at = NOW()
WHERE id = $1;