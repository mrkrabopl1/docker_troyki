-- ========== 1. Смотрим сколько типов пустые ==========
SELECT 
    pt.id,
    pt.type_name,
    pt.enum_key,
    pc.name AS category_name,
    COUNT(p.id) AS product_count
FROM product_types pt
JOIN product_categories pc ON pt.category_id = pc.id
LEFT JOIN products p ON p.type = pt.id
GROUP BY pt.id, pt.type_name, pt.enum_key, pc.name
HAVING COUNT(p.id) = 0
ORDER BY pc.name, pt.type_name;

-- ========== 2. Удаляем пустые типы ==========
DELETE FROM product_types
WHERE id IN (
    SELECT pt.id
    FROM product_types pt
    LEFT JOIN products p ON p.type = pt.id
    WHERE p.id IS NULL
);

-- ========== 3. Проверяем что осталось ==========
SELECT 
    pc.name AS category,
    COUNT(pt.id) AS types_count
FROM product_categories pc
LEFT JOIN product_types pt ON pt.category_id = pc.id
GROUP BY pc.id, pc.name
ORDER BY pc.name;