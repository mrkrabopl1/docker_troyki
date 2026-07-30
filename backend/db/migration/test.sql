SELECT COUNT(*) FROM products WHERE status = 'active' AND bodytype = 'child'::body_enum;



WITH 
collection_products_base AS (
    SELECT p.id
    FROM products p
    INNER JOIN collection_products cp ON p.id = cp.product_id
    WHERE cp.collection_id = 1  -- Укажите ID вашей коллекции
        AND p.status = 'active'
),
filtered_products_by_collection AS (
    SELECT p.id
    FROM products p
    WHERE p.status = 'active'
        AND p.bodytype::text = 'child'
)
SELECT 
    (SELECT COUNT(*) FROM collection_products_base) as hardcoded_count,
    (SELECT COUNT(*) FROM filtered_products_by_collection) as filtered_count,
    (SELECT COUNT(*) FROM (
        SELECT id FROM collection_products_base
        UNION
        SELECT id FROM filtered_products_by_collection
    ) combined) as total_count;