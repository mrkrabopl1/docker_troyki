-- queries/lines.sql

-- name: GetLinesWithStatsAndDiscounts :many
SELECT 
    l.id,
    l.brand_id,
    l.name,
    l.slug,
    l.description,
    l.image_path,
    l.season,
    l.year,
    l.is_active,
    l.sort_order,
    l.created_at,
    l.updated_at,
    b.name as brand_name,
    b.slug as brand_slug,
    COALESCE(COUNT(p.id), 0) as total_products,
    COALESCE((
        SELECT MAX(d.discount_percent) 
        FROM discount d 
        JOIN products p2 ON d.productid = p2.id 
        WHERE p2.line_id = l.id
    ), 0) as discount_percent
FROM brand_lines l
LEFT JOIN brands b ON l.brand_id = b.id
LEFT JOIN products p ON p.line_id = l.id AND p.status = 'active'
WHERE 
    (@name::text = '' OR l.name ILIKE '%' || @name::text || '%')
    AND (
        array_length(@brand_ids::int[], 1) IS NULL 
        OR @brand_ids::int[] = ARRAY[]::int[] 
        OR l.brand_id = ANY(@brand_ids::int[])
    )
GROUP BY l.id, b.name, b.slug
ORDER BY 
    CASE 
        WHEN @sort_type::int = 1 THEN l.name 
        WHEN @sort_type::int = 2 THEN l.name 
    END ASC,
    CASE 
        WHEN @sort_type::int = 2 THEN l.name 
    END DESC,
    CASE 
        WHEN @sort_type::int = 3 THEN l.sort_order 
    END ASC,
    CASE 
        WHEN @sort_type::int = 4 THEN l.sort_order 
    END DESC,
    CASE 
        WHEN @sort_type::int = 5 THEN COUNT(p.id) 
    END ASC,
    CASE 
        WHEN @sort_type::int = 6 THEN COUNT(p.id) 
    END DESC,
    CASE 
        WHEN @sort_type::int = 7 THEN l.created_at 
    END ASC,
    CASE 
        WHEN @sort_type::int = 8 THEN l.created_at 
    END DESC,
    CASE 
        WHEN @sort_type::int = 9 THEN l.is_active::int 
    END ASC,
    CASE 
        WHEN @sort_type::int = 10 THEN l.is_active::int 
    END DESC,
    CASE 
        WHEN @sort_type::int = 11 THEN (
            SELECT MAX(d.discount_percent) 
            FROM discount d 
            JOIN products p2 ON d.productid = p2.id 
            WHERE p2.line_id = l.id
        )
    END ASC NULLS LAST,
    CASE 
        WHEN @sort_type::int = 12 THEN (
            SELECT MAX(d.discount_percent) 
            FROM discount d 
            JOIN products p2 ON d.productid = p2.id 
            WHERE p2.line_id = l.id
        )
    END DESC NULLS LAST,
    CASE 
        WHEN @sort_type::int = 13 THEN b.name 
    END ASC,
    CASE 
        WHEN @sort_type::int = 14 THEN b.name 
    END DESC,
    l.sort_order ASC,
    l.id ASC
LIMIT @limit_val::integer OFFSET @offset_val::integer;

-- name: CountLines :one
SELECT 
    COUNT(*) as total_lines,
    COUNT(CASE WHEN l.is_active = true THEN 1 END) as total_active_lines
FROM brand_lines l
WHERE 
    (@name::text = '' OR l.name ILIKE '%' || @name::text || '%')
    AND (
        array_length(@brand_ids::int[], 1) IS NULL 
        OR @brand_ids::int[] = ARRAY[]::int[] 
        OR l.brand_id = ANY(@brand_ids::int[])
    );

-- name: GetLineByID :one
SELECT 
    l.*,
    b.name as brand_name,
    b.slug as brand_slug
FROM brand_lines l
JOIN brands b ON l.brand_id = b.id
WHERE l.id = @id;

-- name: CreateBrandLine :one
INSERT INTO brand_lines (
    brand_id,
    name,
    slug,
    description,
    image_path,
    season,
    year,
    is_active,
    sort_order
) VALUES (
    @brand_id,
    @name,
    @slug,
    @description,
    @image_path,
    @season,
    @year,
    COALESCE(@is_active, true),
    COALESCE(@sort_order, 0)
)
RETURNING id,
    brand_id,
    name,
    slug,
    description,
    image_path,
    season,
    year,
    is_active,
    sort_order,
    created_at,
    updated_at;

-- name: UpdateLine :exec
UPDATE brand_lines SET
    name = COALESCE(@name::text, name),
    slug = COALESCE(@slug::text, slug),
    description = COALESCE(@description::text, description),
    image_path = COALESCE(@image_path::text, image_path),
    season = COALESCE(@season::text, season),
    year = COALESCE(@year::int, year),
    is_active = COALESCE(@is_active::bool, is_active),
    sort_order = COALESCE(@sort_order::int, sort_order),
    updated_at = NOW()
WHERE id = @id;

-- name: DeleteLine :exec
DELETE FROM brand_lines WHERE id = @id;

-- name: GetLineIdsBySearch :many
SELECT id FROM brand_lines
WHERE (@search::text = '' OR name ILIKE '%' || @search::text || '%');

-- name: BulkUpdateLineSortOrder :exec
UPDATE brand_lines 
SET sort_order = @sort_order, updated_at = NOW()
WHERE id = ANY(@ids::int[]);

-- name: BulkUpdateLineActive :exec
UPDATE brand_lines 
SET is_active = @is_active, updated_at = NOW()
WHERE id = ANY(@ids::int[]);

-- name: GetAllLines :many
SELECT 
    l.id, l.brand_id, l.name, l.slug, l.description, 
    l.image_path, l.season, l.year, l.is_active, 
    l.sort_order, l.created_at, l.updated_at,
    b.name as brand_name
FROM brand_lines l
JOIN brands b ON l.brand_id = b.id
WHERE (
    array_length(@brand_ids::int[], 1) IS NULL 
    OR @brand_ids::int[] = ARRAY[]::int[] 
    OR l.brand_id = ANY(@brand_ids::int[])
)
AND l.is_active = true
ORDER BY l.sort_order ASC, l.name ASC;