-- queries/fonts.sql

-- name: GetAllFonts :many
SELECT id, family, slug, url, weight, style, is_active, version, updated_at
FROM fonts
ORDER BY family, weight, style;

-- name: GetFontByID :one
SELECT id, family, slug, url, weight, style, is_active, version, updated_at
FROM fonts
WHERE id = @id;

-- name: GetFontsByFamily :many
SELECT id, family, slug, url, weight, style, is_active, version, updated_at
FROM fonts
WHERE family = @family AND is_active = true
ORDER BY weight, style;

-- name: CreateFont :one
INSERT INTO fonts (family, slug, url, weight, style, is_active)
VALUES (@family, @slug, @url, @weight, @style, COALESCE(@is_active::bool, true))
ON CONFLICT (slug, weight, style) DO UPDATE
SET url        = EXCLUDED.url,
    family     = EXCLUDED.family,
    is_active  = true,
    updated_at = now()
RETURNING id, family, slug, url, weight, style, is_active, version, updated_at;

-- name: UpdateFont :one
UPDATE fonts SET
    family     = COALESCE(@family::text, family),
    url        = COALESCE(@url::text, url),
    weight     = COALESCE(@weight::smallint, weight),
    style      = COALESCE(@style::text, style),
    is_active  = COALESCE(@is_active::bool, is_active),
    version    = version + 1,
    updated_at = now()
WHERE id = @id
RETURNING id, family, slug, url, weight, style, is_active, version, updated_at;

-- name: DeleteFont :exec
DELETE FROM fonts WHERE id = @id;


-- name: SetFontRole :one
UPDATE site_settings SET
    font_body_id    = @font_body_id,
    font_display_id = @font_display_id,
    updated_at      = now()
WHERE id = 1
RETURNING id, logo_url, logo_alt, logo_version,
          font_body_id, font_display_id,
          updated_at;