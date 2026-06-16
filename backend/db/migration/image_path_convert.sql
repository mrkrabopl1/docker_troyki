
-- ========== 2. МИГРАЦИЯ ==========
-- ========== МИГРАЦИЯ (ВСЕ 51673 ЗАПИСИ) ==========
UPDATE products 
SET image_path = REPLACE(REPLACE(image_path, '\', '/'), 'newFirms', 'products')
WHERE image_path LIKE E'newFirms\\\\%';

-- ========== ПРОВЕРКА ==========
SELECT COUNT(*) AS remaining 
FROM products 
WHERE image_path LIKE E'newFirms\\\\%';
-- Должно быть 0

SELECT COUNT(*) AS converted 
FROM products 
WHERE image_path LIKE 'products/%';