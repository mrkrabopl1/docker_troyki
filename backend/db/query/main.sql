-- name: GetMainPageBanners :many
SELECT 
    id,
    title,
    subtitle,
    description,
    image_url,
    button_text,
    button_url
FROM homepage_blocks
ORDER BY id ASC;