-- SELECT COUNT(*) FROM products WHERE status = 'active' AND bodytype = 'child'::body_enum;



-- WITH 
-- collection_products_base AS (
--     SELECT p.id
--     FROM products p
--     INNER JOIN collection_products cp ON p.id = cp.product_id
--     WHERE cp.collection_id = 1  -- Укажите ID вашей коллекции
--         AND p.status = 'active'
-- ),
-- filtered_products_by_collection AS (
--     SELECT p.id
--     FROM products p
--     WHERE p.status = 'active'
--         AND p.bodytype::text = 'child'
-- )
-- SELECT 
--     (SELECT COUNT(*) FROM collection_products_base) as hardcoded_count,
--     (SELECT COUNT(*) FROM filtered_products_by_collection) as filtered_count,
--     (SELECT COUNT(*) FROM (
--         SELECT id FROM collection_products_base
--         UNION
--         SELECT id FROM filtered_products_by_collection
--     ) combined) as total_count;


-- -- 1. Проверяем продукты в коллекции 3 (без всяких фильтров)
-- SELECT COUNT(*) 
-- FROM collection_products cp 
-- WHERE cp.collection_id = 3;

-- -- 2. Проверяем продукты в коллекции 3 с активными продуктами
-- SELECT COUNT(DISTINCT p.id) 
-- FROM products p
-- INNER JOIN collection_products cp ON cp.product_id = p.id AND cp.collection_id = 3
-- WHERE p.status = 'active';

-- -- 3. Проверяем продукты в коллекции 3 с активными брендами
-- SELECT COUNT(DISTINCT p.id) 
-- FROM products p
-- INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
-- INNER JOIN collection_products cp ON cp.product_id = p.id AND cp.collection_id = 3
-- WHERE p.status = 'active';

-- -- 4. Проверяем продукты в коллекции 3 с brand_lines
-- SELECT COUNT(DISTINCT p.id) 
-- FROM products p
-- INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
-- LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
-- INNER JOIN collection_products cp ON cp.product_id = p.id AND cp.collection_id = 3
-- WHERE p.status = 'active'
-- AND (p.line_id IS NULL OR bl.id IS NOT NULL);

-- -- 5. Проверяем наличие на складе (самое жесткое условие!)
-- SELECT COUNT(DISTINCT p.id) 
-- FROM products p
-- INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
-- LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
-- INNER JOIN collection_products cp ON cp.product_id = p.id AND cp.collection_id = 3
-- INNER JOIN store_house sh ON sh.productid = p.id AND sh.quantity > 0
-- WHERE p.status = 'active'
-- AND (p.line_id IS NULL OR bl.id IS NOT NULL);



-- -- ============================================================
-- -- 1. Удаляем in_stock из JSONB sizes в products
-- -- ============================================================
-- UPDATE public.products
-- SET sizes = (
--     SELECT jsonb_object_agg(
--         key,
--         jsonb_build_object(
--             'price', value->'price',
--             'quantity', 0  -- обнуляем quantity
--         )
--     )
--     FROM jsonb_each(sizes)
-- )
-- WHERE sizes IS NOT NULL;

-- -- ============================================================
-- -- 2. Удаляем колонку in_stock из product_sizes
-- -- ============================================================
-- ALTER TABLE public.product_sizes DROP COLUMN IF EXISTS in_stock;

-- -- ============================================================
-- -- 3. Обнуляем quantity в store_house
-- -- ============================================================
-- UPDATE public.store_house SET quantity = 0;




-- -- Индексы
-- CREATE INDEX IF NOT EXISTS idx_product_sizes_product_id ON public.product_sizes(product_id);
-- CREATE INDEX IF NOT EXISTS idx_product_sizes_size_key ON public.product_sizes(size_key);
-- CREATE INDEX IF NOT EXISTS idx_product_sizes_quantity ON public.product_sizes(quantity) WHERE quantity > 0;

-- -- ============================================================
-- -- 2. Функция синхронизации при изменении products.sizes
-- -- ============================================================
-- CREATE OR REPLACE FUNCTION public.sync_product_sizes_from_products()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- Удаляем старые размеры для этого товара
--     DELETE FROM public.product_sizes WHERE product_id = NEW.id;
    
--     -- Вставляем новые размеры из JSONB
--     INSERT INTO public.product_sizes (product_id, size_key, price, quantity)
--     SELECT
--         NEW.id,
--         key,
--         (value->>'price')::NUMERIC,
--         COALESCE((value->>'quantity')::INTEGER, 0)
--     FROM jsonb_each(NEW.sizes)
--     WHERE (value->>'price')::NUMERIC > 0;
    
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- ============================================================
-- -- 3. Триггер на изменение products.sizes
-- -- ============================================================
-- DROP TRIGGER IF EXISTS trg_sync_product_sizes ON public.products;
-- CREATE TRIGGER trg_sync_product_sizes
-- AFTER INSERT OR UPDATE OF sizes ON public.products
-- FOR EACH ROW
-- EXECUTE FUNCTION public.sync_product_sizes_from_products();

-- -- ============================================================
-- -- 4. Функция для ПЕРВОНАЧАЛЬНОГО заполнения product_sizes из products
-- -- ============================================================
-- CREATE OR REPLACE FUNCTION public.fill_product_sizes_from_products()
-- RETURNS void AS $$
-- BEGIN
--     -- Очищаем таблицу
--     TRUNCATE public.product_sizes;
    
--     -- Заполняем из products.sizes
--     INSERT INTO public.product_sizes (product_id, size_key, price, quantity)
--     SELECT
--         p.id,
--         key,
--         (value->>'price')::NUMERIC,
--         COALESCE((value->>'quantity')::INTEGER, 0)
--     FROM public.products p,
--     LATERAL jsonb_each(p.sizes)
--     WHERE (value->>'price')::NUMERIC > 0;
    
--     RAISE NOTICE 'product_sizes заполнена. Всего записей: %', (SELECT COUNT(*) FROM public.product_sizes);
-- END;
-- $$ LANGUAGE plpgsql;

-- -- ============================================================
-- -- 5. ВЫПОЛНЯЕМ ПЕРВОНАЧАЛЬНОЕ ЗАПОЛНЕНИЕ
-- -- ============================================================
-- SELECT public.fill_product_sizes_from_products();

-- -- ============================================================
-- -- 6. Индексы
-- -- ============================================================
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status_category_type
-- ON public.products(status, category, type) WHERE status = 'active';

-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_trgm
-- ON public.products USING gin(name gin_trgm_ops);

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_discount_productid ON public.discount(productid);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_discount_rule_id ON public.discount(rule_id);

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brands_id_active ON public.brands(id, is_active) WHERE is_active = true;


-- -- ============================================================
-- -- 1. Удаляем старые функции и триггеры
-- -- ============================================================
-- DROP FUNCTION IF EXISTS public.sync_product_sizes() CASCADE;
-- DROP FUNCTION IF EXISTS public.sync_store_house_to_product_sizes() CASCADE;
-- DROP FUNCTION IF EXISTS public.sync_product_sizes_from_products() CASCADE;

-- DROP TRIGGER IF EXISTS trg_sync_sizes ON public.products;
-- DROP TRIGGER IF EXISTS trg_sync_store_house ON public.store_house;
-- DROP TRIGGER IF EXISTS trg_sync_product_sizes ON public.products;

-- -- ============================================================
-- -- 2. Функция синхронизации при изменении products.sizes
-- -- ============================================================
-- CREATE OR REPLACE FUNCTION public.sync_product_sizes_from_products()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- Удаляем старые записи для этого товара
--     DELETE FROM public.product_sizes WHERE product_id = NEW.id;

--     -- Вставляем новые размеры из JSONB (без in_stock)
--     INSERT INTO public.product_sizes (product_id, size_key, price, quantity)
--     SELECT
--         NEW.id,
--         key,
--         (value->>'price')::NUMERIC,
--         COALESCE((value->>'quantity')::INTEGER, 0)
--     FROM jsonb_each(NEW.sizes)
--     WHERE (value->>'price')::NUMERIC > 0;

--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- ============================================================
-- -- 3. Функция синхронизации при изменении store_house
-- -- ============================================================
-- CREATE OR REPLACE FUNCTION public.sync_store_house_to_product_sizes()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- Обновляем quantity в product_sizes
--     UPDATE public.product_sizes
--     SET quantity = NEW.quantity
--     WHERE product_id = NEW.productid 
--       AND size_key = NEW.size;
    
--     -- Если записи нет - создаем (с ценой из products.sizes)
--     IF NOT FOUND THEN
--         INSERT INTO public.product_sizes (product_id, size_key, price, quantity)
--         SELECT 
--             NEW.productid,
--             NEW.size,
--             COALESCE(
--                 (SELECT (value->>'price')::NUMERIC 
--                  FROM public.products p,
--                  LATERAL jsonb_each(p.sizes) 
--                  WHERE p.id = NEW.productid AND key = NEW.size),
--                 0
--             ),
--             NEW.quantity
--         WHERE EXISTS (
--             SELECT 1 FROM public.products 
--             WHERE id = NEW.productid 
--             AND sizes ? NEW.size
--         );
--     END IF;
    
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- ============================================================
-- -- 4. Создаем триггеры
-- -- ============================================================
-- CREATE TRIGGER trg_sync_product_sizes
-- AFTER INSERT OR UPDATE OF sizes ON public.products
-- FOR EACH ROW
-- EXECUTE FUNCTION public.sync_product_sizes_from_products();

-- CREATE TRIGGER trg_sync_store_house
-- AFTER INSERT OR UPDATE OF quantity ON public.store_house
-- FOR EACH ROW
-- EXECUTE FUNCTION public.sync_store_house_to_product_sizes();



-- -- Функция синхронизации store_house из products.sizes
-- CREATE OR REPLACE FUNCTION public.sync_store_house_from_products()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- Удаляем все старые записи для этого товара
--     DELETE FROM public.store_house WHERE productid = NEW.id;
    
--     -- Вставляем только размеры с quantity > 0
--     INSERT INTO public.store_house (productid, size, quantity)
--     SELECT
--         NEW.id,
--         key,
--         COALESCE((value->>'quantity')::INTEGER, 0)
--     FROM jsonb_each(NEW.sizes)
--     WHERE COALESCE((value->>'quantity')::INTEGER, 0) > 0;
    
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Создаем триггер на INSERT и UPDATE в products.sizes
-- DROP TRIGGER IF EXISTS trg_sync_store_house_from_products ON public.products;
-- CREATE TRIGGER trg_sync_store_house_from_products
-- AFTER INSERT OR UPDATE OF sizes ON public.products
-- FOR EACH ROW
-- EXECUTE FUNCTION public.sync_store_house_from_products();

-- -- Очищаем store_house
-- TRUNCATE public.store_house;

-- -- Заполняем store_house из products (только quantity > 0)
-- INSERT INTO public.store_house (productid, size, quantity)
-- SELECT
--     p.id,
--     key,
--     COALESCE((value->>'quantity')::INTEGER, 0)
-- FROM public.products p,
-- LATERAL jsonb_each(p.sizes)
-- WHERE COALESCE((value->>'quantity')::INTEGER, 0) > 0;

-- SELECT * FROM products WHERE article = 'MeNY';
-- SELECT 
--     column_name, 
--     is_nullable, 
--     data_type,
--     column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'products' 
-- AND column_name = 'brand_id';

-- WITH ids AS (
--     SELECT 
--         NULL::integer as cat_id,  -- Явно указываем тип integer
--         (SELECT id FROM product_types WHERE enum_key = 'boots' LIMIT 1) as typ_id,
--         NULL::integer as br_id,
--         NULL::integer as ln_id
-- )
-- SELECT p.id, p.name, p.image_path, p.type, p.category,
--        b.name as firm,
--        (SELECT enum_key FROM product_types WHERE id = p.type) as type_name,
--        (SELECT enum_key FROM product_categories WHERE id = p.category) as category_name
-- FROM products p
-- INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
-- LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
-- CROSS JOIN ids
-- WHERE 
--     p.status = 'active'
--     AND (p.line_id IS NULL OR bl.id IS NOT NULL)
--     AND (ids.cat_id IS NULL OR p.category = ids.cat_id)
--     AND (ids.typ_id IS NULL OR p.type = ids.typ_id)
--     AND (ids.br_id IS NULL OR p.brand_id = ids.br_id)
--     AND (ids.ln_id IS NULL OR p.line_id = ids.ln_id)
-- LIMIT 10;

-- WITH ids AS (
--     SELECT 
--         CASE 
--             WHEN '' = '' THEN NULL
--             ELSE (SELECT id FROM product_categories WHERE enum_key = 'sneakers' LIMIT 1)
--         END as cat_id,
--         CASE 
--             WHEN 'boots' = '' THEN NULL
--             ELSE (SELECT id FROM product_types WHERE enum_key = 'boots' LIMIT 1)
--         END as typ_id,
--         CASE 
--             WHEN '' = '' THEN NULL
--             ELSE (SELECT id FROM brands WHERE slug = '' LIMIT 1)
--         END as br_id,
--         CASE 
--             WHEN '' = '' THEN NULL
--             ELSE (SELECT id FROM brand_lines WHERE slug = '' LIMIT 1)
--         END as ln_id
-- )
-- SELECT p.id, p.name, p.image_path, p.type, p.category,
--        b.name as firm,
--        (SELECT enum_key FROM product_types WHERE id = p.type) as type_name,
--        (SELECT enum_key FROM product_categories WHERE id = p.category) as category_name
-- FROM products p
-- INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
-- LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
-- CROSS JOIN ids
-- WHERE 
--     p.status = 'active'
--     AND (p.line_id IS NULL OR bl.id IS NOT NULL)
--     AND (ids.cat_id IS NULL OR p.category = ids.cat_id)
--     AND (ids.typ_id IS NULL OR p.type = ids.typ_id)
--     AND (ids.br_id IS NULL OR p.brand_id = ids.br_id)
--     AND (ids.ln_id IS NULL OR p.line_id = ids.ln_id)
-- LIMIT 10;

-- ============================================
-- ТЕСТ 2: Фильтр по категории + типу
-- ============================================
-- Ожидаемый результат: Товары категории 'sneakers' и типа 'boots'
-- WITH ids AS (
--     SELECT 
--         CASE 
--             WHEN 'sneakers' = '' THEN NULL
--             ELSE (SELECT id FROM product_categories WHERE enum_key = 'sneakers')
--         END as cat_id,
--         CASE 
--             WHEN 'boots' = '' THEN NULL
--             ELSE (SELECT id FROM product_types WHERE enum_key = 'boots')
--         END as typ_id,
--         CASE 
--             WHEN '' = '' THEN NULL
--             ELSE (SELECT id FROM brands WHERE slug = '')
--         END as br_id,
--         CASE 
--             WHEN '' = '' THEN NULL
--             ELSE (SELECT id FROM brand_lines WHERE slug = '')
--         END as ln_id
-- )
-- SELECT p.id, p.name, p.image_path, p.type, p.category,
--        b.name as firm,
--        (SELECT enum_key FROM product_types WHERE id = p.type) as type_name,
--        (SELECT enum_key FROM product_categories WHERE id = p.category) as category_name
-- FROM products p
-- INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
-- LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
-- CROSS JOIN ids
-- WHERE 
--     p.status = 'active'
--     AND (p.line_id IS NULL OR bl.id IS NOT NULL)
--     AND (ids.cat_id IS NULL OR p.category = ids.cat_id)
--     AND (ids.typ_id IS NULL OR p.type = ids.typ_id)
--     AND (ids.br_id IS NULL OR p.brand_id = ids.br_id)
--     AND (ids.ln_id IS NULL OR p.line_id = ids.ln_id)
-- LIMIT 10;

-- -- ============================================
-- -- ТЕСТ 3: Проверка существования типа 'boots'
-- -- ============================================
-- SELECT id, enum_key, name 
-- FROM product_types 
-- WHERE enum_key = 'boots';

-- -- ============================================
-- -- ТЕСТ 4: Все товары без фильтров
-- -- ============================================
-- -- Ожидаемый результат: Все активные товары
-- WITH ids AS (
--     SELECT 
--         NULL as cat_id,
--         NULL as typ_id,
--         NULL as br_id,
--         NULL as ln_id
-- )
-- SELECT p.id, p.name, p.image_path, p.type, p.category,
--        b.name as firm,
--        (SELECT enum_key FROM product_types WHERE id = p.type) as type_name,
--        (SELECT enum_key FROM product_categories WHERE id = p.category) as category_name
-- FROM products p
-- INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
-- LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
-- CROSS JOIN ids
-- WHERE 
--     p.status = 'active'
--     AND (p.line_id IS NULL OR bl.id IS NOT NULL)
--     AND (ids.cat_id IS NULL OR p.category = ids.cat_id)
--     AND (ids.typ_id IS NULL OR p.type = ids.typ_id)
--     AND (ids.br_id IS NULL OR p.brand_id = ids.br_id)
--     AND (ids.ln_id IS NULL OR p.line_id = ids.ln_id)
-- LIMIT 10;

-- -- ============================================
-- -- ТЕСТ 5: Проверка на несуществующий тип
-- -- ============================================
-- -- Ожидаемый результат: Пустой результат (0 строк)
-- WITH ids AS (
--     SELECT 
--         CASE 
--             WHEN '' = '' THEN NULL
--             ELSE (SELECT id FROM product_categories WHERE enum_key = '')
--         END as cat_id,
--         CASE 
--             WHEN 'non_existent_type' = '' THEN NULL
--             ELSE (SELECT id FROM product_types WHERE enum_key = 'non_existent_type')
--         END as typ_id,
--         CASE 
--             WHEN '' = '' THEN NULL
--             ELSE (SELECT id FROM brands WHERE slug = '')
--         END as br_id,
--         CASE 
--             WHEN '' = '' THEN NULL
--             ELSE (SELECT id FROM brand_lines WHERE slug = '')
--         END as ln_id
-- )
-- SELECT p.id, p.name, p.image_path, p.type, p.category,
--        b.name as firm
-- FROM products p
-- INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
-- LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
-- CROSS JOIN ids
-- WHERE 
--     p.status = 'active'
--     AND (p.line_id IS NULL OR bl.id IS NOT NULL)
--     AND (ids.cat_id IS NULL OR p.category = ids.cat_id)
--     AND (ids.typ_id IS NULL OR p.type = ids.typ_id)
--     AND (ids.br_id IS NULL OR p.brand_id = ids.br_id)
--     AND (ids.ln_id IS NULL OR p.line_id = ids.ln_id);

-- -- ============================================
-- -- ТЕСТ 6: Полный фильтр (категория + тип + бренд + линия)
-- -- ============================================
-- WITH ids AS (
--     SELECT 
--         CASE 
--             WHEN 'sneakers' = '' THEN NULL
--             ELSE (SELECT id FROM product_categories WHERE enum_key = 'sneakers')
--         END as cat_id,
--         CASE 
--             WHEN 'boots' = '' THEN NULL
--             ELSE (SELECT id FROM product_types WHERE enum_key = 'boots')
--         END as typ_id,
--         CASE 
--             WHEN 'nike' = '' THEN NULL
--             ELSE (SELECT id FROM brands WHERE slug = 'nike')
--         END as br_id,
--         CASE 
--             WHEN 'air-max' = '' THEN NULL
--             ELSE (SELECT id FROM brand_lines WHERE slug = 'air-max')
--         END as ln_id
-- )
-- SELECT p.id, p.name, p.image_path, p.type, p.category,
--        b.name as firm,
--        bl.name as line_name
-- FROM products p
-- INNER JOIN brands b ON p.brand_id = b.id AND b.is_active = true
-- LEFT JOIN brand_lines bl ON p.line_id = bl.id AND bl.is_active = true
-- CROSS JOIN ids
-- WHERE 
--     p.status = 'active'
--     AND (p.line_id IS NULL OR bl.id IS NOT NULL)
--     AND (ids.cat_id IS NULL OR p.category = ids.cat_id)
--     AND (ids.typ_id IS NULL OR p.type = ids.typ_id)
--     AND (ids.br_id IS NULL OR p.brand_id = ids.br_id)
--     AND (ids.ln_id IS NULL OR p.line_id = ids.ln_id)
-- LIMIT 10;

-- -- Обновляем minprice и maxprice для всех товаров на основе данных из sizes
-- UPDATE products p
-- SET 
--     minprice = COALESCE(
--         (
--             SELECT MIN((value->>'price')::INTEGER)
--             FROM jsonb_each(p.sizes) AS sizes(key, value)
--             WHERE (value->>'price')::INTEGER > 0
--         ),
--         0
--     ),
--     maxprice = COALESCE(
--         (
--             SELECT MAX((value->>'price')::INTEGER)
--             FROM jsonb_each(p.sizes) AS sizes(key, value)
--             WHERE (value->>'price')::INTEGER > 0
--         ),
--         0
--     ),
--     updated_at = NOW()
-- WHERE p.sizes IS NOT NULL 
--   AND p.sizes != '{}'::jsonb;

-- -- Для товаров с NULL или пустым sizes - ставим 0
-- UPDATE products p
-- SET 
--     minprice = 0,
--     maxprice = 0,
--     updated_at = NOW()
-- WHERE p.sizes IS NULL 
--    OR p.sizes = '{}'::jsonb;


DELETE FROM discount 
WHERE discounted_price = 0;