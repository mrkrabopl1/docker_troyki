BEGIN;

INSERT INTO brands (name, slug, created_at, updated_at)
SELECT DISTINCT 
    TRIM(firm),
    LOWER(REGEXP_REPLACE(TRIM(firm), '[^a-z0-9]+', '-', 'gi')),
    NOW(),
    NOW()
FROM products
WHERE firm IS NOT NULL AND TRIM(firm) != ''
ON CONFLICT (name) DO NOTHING;

UPDATE products p
SET brand_id = b.id
FROM brands b
WHERE p.firm = b.name;

INSERT INTO brand_lines (brand_id, name, slug, created_at, updated_at)
SELECT DISTINCT 
    p.brand_id,
    TRIM(p.line),
    LOWER(REGEXP_REPLACE(TRIM(p.line), '[^a-z0-9]+', '-', 'gi')),
    NOW(),
    NOW()
FROM products p
WHERE p.brand_id IS NOT NULL
  AND p.line IS NOT NULL 
  AND TRIM(p.line) != ''
ON CONFLICT (brand_id, name) DO NOTHING;

UPDATE products p
SET line_id = bl.id
FROM brand_lines bl
WHERE p.brand_id = bl.brand_id 
  AND p.line = bl.name;



COMMIT;