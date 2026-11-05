-- name: GetSiteSettings :one
SELECT id, logo_url, logo_alt, logo_version,
       font_body_id, font_display_id,
       updated_at
FROM site_settings
WHERE id = 1;
-- name: UpdateSiteLogo :one
UPDATE site_settings SET
    logo_url     = @logo_url,
    logo_alt     = @logo_alt,
    logo_version = logo_version + 1,
    updated_at   = now()
WHERE id = 1
RETURNING id, logo_url, logo_alt, logo_version, updated_at;

-- name: UpdateSiteLogoAlt :one
UPDATE site_settings SET
    logo_alt   = @logo_alt,
    updated_at = now()
WHERE id = 1
RETURNING id, logo_url, logo_alt, logo_version, updated_at;