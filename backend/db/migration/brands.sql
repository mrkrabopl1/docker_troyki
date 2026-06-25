BEGIN;

-- Удаляем внешние ключи
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_brand;
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_line;

-- Очищаем ТОЛЬКО таблицы брендов (без CASCADE!)
DELETE FROM brand_lines;
DELETE FROM brands;

-- Убираем уникальность
ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_slug_key;

-- Вставляем бренды
INSERT INTO brands (name, slug, created_at, updated_at)
SELECT DISTINCT 
    TRIM(firm),
    LOWER(REGEXP_REPLACE(TRIM(firm), '[^a-z0-9]+', '-', 'gi')),
    NOW(),
    NOW()
FROM products
WHERE firm IS NOT NULL AND TRIM(firm) != '';

-- Удаляем дубликаты slug
DELETE FROM brands a USING brands b
WHERE a.id > b.id AND a.slug = b.slug;

-- Обновляем brand_id
UPDATE products p
SET brand_id = b.id
FROM brands b
WHERE p.firm = b.name;

-- Вставляем линейки
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
  AND TRIM(p.line) != '';

-- Удаляем дубликаты в линейках
DELETE FROM brand_lines a USING brand_lines b
WHERE a.id > b.id AND a.brand_id = b.brand_id AND a.slug = b.slug;

-- Обновляем line_id
UPDATE products p
SET line_id = bl.id
FROM brand_lines bl
WHERE p.brand_id = bl.brand_id 
  AND p.line = bl.name;

-- Возвращаем ограничения
ALTER TABLE brands ADD CONSTRAINT brands_slug_key UNIQUE (slug);
ALTER TABLE products ADD CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;
ALTER TABLE products ADD CONSTRAINT fk_products_line FOREIGN KEY (line_id) REFERENCES brand_lines(id) ON DELETE SET NULL;

COMMIT;