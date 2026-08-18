-- Основная таблица коллекций
CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'dynamic', -- 'dynamic' | 'manual' | 'hybrid'
    settings JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Связь коллекций с товарами (для ручного режима)
CREATE TABLE collection_products (
    collection_id INT REFERENCES collections(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection_id, product_id)
);

-- Индексы для производительности
CREATE INDEX idx_collections_slug ON collections(slug);
CREATE INDEX idx_collections_type ON collections(type);
CREATE INDEX idx_collections_active ON collections(is_active);
CREATE INDEX idx_collection_products_collection ON collection_products(collection_id);
CREATE INDEX idx_collection_products_product ON collection_products(product_id);


-- Обновляем структуру таблицы page_widgets
-- Удаляем старые поля если они есть
ALTER TABLE page_widgets 
DROP COLUMN IF EXISTS settings CASCADE,
DROP COLUMN IF EXISTS filters CASCADE,
DROP COLUMN IF EXISTS collection_slug CASCADE;


-- Добавляем поле collection_slug если его нет
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='page_widgets' AND column_name='collection_id') THEN
        ALTER TABLE page_widgets ADD COLUMN collection_id INT;
    END IF;
END $$;
-- Добавляем created_at если его нет
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='page_widgets' AND column_name='created_at') THEN
        ALTER TABLE page_widgets ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Добавляем updated_at если его нет
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='page_widgets' AND column_name='updated_at') THEN
        ALTER TABLE page_widgets ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;
-- Создаем индекс для быстрого поиска по коллекции
CREATE INDEX idx_page_widgets_collection_id ON page_widgets(collection_id);
CREATE INDEX idx_page_widgets_sort_order ON page_widgets(sort_order);
CREATE INDEX idx_page_widgets_is_active ON page_widgets(is_active);











-- 1. Добавляем collection_id если его нет
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='banners' AND column_name='collection_id') THEN
        ALTER TABLE public.banners ADD COLUMN collection_id INT;
    END IF;
END $$;

-- 2. Удаляем старые поля если они есть
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='banners' AND column_name='link_url') THEN
        ALTER TABLE public.banners DROP COLUMN link_url CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='banners' AND column_name='conditions') THEN
        ALTER TABLE public.banners DROP COLUMN conditions CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='banners' AND column_name='filters') THEN
        ALTER TABLE public.banners DROP COLUMN filters CASCADE;
    END IF;
END $$;

-- 3. Делаем collection_id NOT NULL
ALTER TABLE public.banners ALTER COLUMN collection_id SET NOT NULL;

-- 4. Добавляем внешний ключ
ALTER TABLE public.banners 
ADD CONSTRAINT fk_banners_collection 
FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON DELETE CASCADE;

-- 5. Создаем индексы
CREATE INDEX IF NOT EXISTS idx_banners_collection_id ON public.banners(collection_id);
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_sort_order ON public.banners(sort_order);


TRUNCATE TABLE public.banners, public.page_widgets RESTART IDENTITY CASCADE;




-- Удаляем поле link_url из таблицы page_widgets
ALTER TABLE page_widgets 
DROP COLUMN IF EXISTS link_url CASCADE;

-- Обновляем запросы (если есть триггеры или функции, использующие это поле)
-- Проверяем, что поле действительно удалено
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='page_widgets' AND column_name='link_url') THEN
        RAISE NOTICE 'Поле link_url все еще существует в таблице page_widgets';
    ELSE
        RAISE NOTICE 'Поле link_url успешно удалено из таблицы page_widgets';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.instagram_posts (
    id SERIAL PRIMARY KEY,
    image_url VARCHAR(500) NOT NULL,          
    is_active BOOLEAN DEFAULT TRUE,           
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска активных постов
CREATE INDEX idx_instagram_posts_active ON instagram_posts(is_active);



-- ============================================================
-- 1. Удаляем in_stock из JSONB sizes в products
-- ============================================================
UPDATE public.products
SET sizes = (
    SELECT jsonb_object_agg(
        key,
        jsonb_build_object(
            'price', value->'price',
            'quantity', 0  -- обнуляем quantity
        )
    )
    FROM jsonb_each(sizes)
)
WHERE sizes IS NOT NULL;

-- ============================================================
-- 2. Удаляем колонку in_stock из product_sizes
-- ============================================================
ALTER TABLE public.product_sizes DROP COLUMN IF EXISTS in_stock;

-- ============================================================
-- 3. Обнуляем quantity в store_house
-- ============================================================
UPDATE public.store_house SET quantity = 0;




-- Индексы
CREATE INDEX IF NOT EXISTS idx_product_sizes_product_id ON public.product_sizes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sizes_size_key ON public.product_sizes(size_key);
CREATE INDEX IF NOT EXISTS idx_product_sizes_quantity ON public.product_sizes(quantity) WHERE quantity > 0;

-- ============================================================
-- 2. Функция синхронизации при изменении products.sizes
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_product_sizes_from_products()
RETURNS TRIGGER AS $$
BEGIN
    -- Удаляем старые размеры для этого товара
    DELETE FROM public.product_sizes WHERE product_id = NEW.id;
    
    -- Вставляем новые размеры из JSONB
    INSERT INTO public.product_sizes (product_id, size_key, price, quantity)
    SELECT
        NEW.id,
        key,
        (value->>'price')::NUMERIC,
        COALESCE((value->>'quantity')::INTEGER, 0)
    FROM jsonb_each(NEW.sizes)
    WHERE (value->>'price')::NUMERIC > 0;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. Триггер на изменение products.sizes
-- ============================================================
DROP TRIGGER IF EXISTS trg_sync_product_sizes ON public.products;
CREATE TRIGGER trg_sync_product_sizes
AFTER INSERT OR UPDATE OF sizes ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.sync_product_sizes_from_products();

-- ============================================================
-- 4. Функция для ПЕРВОНАЧАЛЬНОГО заполнения product_sizes из products
-- ============================================================
CREATE OR REPLACE FUNCTION public.fill_product_sizes_from_products()
RETURNS void AS $$
BEGIN
    -- Очищаем таблицу
    TRUNCATE public.product_sizes;
    
    -- Заполняем из products.sizes
    INSERT INTO public.product_sizes (product_id, size_key, price, quantity)
    SELECT
        p.id,
        key,
        (value->>'price')::NUMERIC,
        COALESCE((value->>'quantity')::INTEGER, 0)
    FROM public.products p,
    LATERAL jsonb_each(p.sizes)
    WHERE (value->>'price')::NUMERIC > 0;
    
    RAISE NOTICE 'product_sizes заполнена. Всего записей: %', (SELECT COUNT(*) FROM public.product_sizes);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. ВЫПОЛНЯЕМ ПЕРВОНАЧАЛЬНОЕ ЗАПОЛНЕНИЕ
-- ============================================================
SELECT public.fill_product_sizes_from_products();

-- ============================================================
-- 6. Индексы
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status_category_type
ON public.products(status, category, type) WHERE status = 'active';

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_trgm
ON public.products USING gin(name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_discount_productid ON public.discount(productid);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_discount_rule_id ON public.discount(rule_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brands_id_active ON public.brands(id, is_active) WHERE is_active = true;


-- ============================================================
-- 1. Удаляем старые функции и триггеры
-- ============================================================
DROP FUNCTION IF EXISTS public.sync_product_sizes() CASCADE;
DROP FUNCTION IF EXISTS public.sync_store_house_to_product_sizes() CASCADE;
DROP FUNCTION IF EXISTS public.sync_product_sizes_from_products() CASCADE;

DROP TRIGGER IF EXISTS trg_sync_sizes ON public.products;
DROP TRIGGER IF EXISTS trg_sync_store_house ON public.store_house;
DROP TRIGGER IF EXISTS trg_sync_product_sizes ON public.products;

-- ============================================================
-- 2. Функция синхронизации при изменении products.sizes
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_product_sizes_from_products()
RETURNS TRIGGER AS $$
BEGIN
    -- Удаляем старые записи для этого товара
    DELETE FROM public.product_sizes WHERE product_id = NEW.id;

    -- Вставляем новые размеры из JSONB (без in_stock)
    INSERT INTO public.product_sizes (product_id, size_key, price, quantity)
    SELECT
        NEW.id,
        key,
        (value->>'price')::NUMERIC,
        COALESCE((value->>'quantity')::INTEGER, 0)
    FROM jsonb_each(NEW.sizes)
    WHERE (value->>'price')::NUMERIC > 0;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. Функция синхронизации при изменении store_house
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_store_house_to_product_sizes()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем quantity в product_sizes
    UPDATE public.product_sizes
    SET quantity = NEW.quantity
    WHERE product_id = NEW.productid 
      AND size_key = NEW.size;
    
    -- Если записи нет - создаем (с ценой из products.sizes)
    IF NOT FOUND THEN
        INSERT INTO public.product_sizes (product_id, size_key, price, quantity)
        SELECT 
            NEW.productid,
            NEW.size,
            COALESCE(
                (SELECT (value->>'price')::NUMERIC 
                 FROM public.products p,
                 LATERAL jsonb_each(p.sizes) 
                 WHERE p.id = NEW.productid AND key = NEW.size),
                0
            ),
            NEW.quantity
        WHERE EXISTS (
            SELECT 1 FROM public.products 
            WHERE id = NEW.productid 
            AND sizes ? NEW.size
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. Создаем триггеры
-- ============================================================
CREATE TRIGGER trg_sync_product_sizes
AFTER INSERT OR UPDATE OF sizes ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.sync_product_sizes_from_products();

CREATE TRIGGER trg_sync_store_house
AFTER INSERT OR UPDATE OF quantity ON public.store_house
FOR EACH ROW
EXECUTE FUNCTION public.sync_store_house_to_product_sizes();



-- Функция синхронизации store_house из products.sizes
CREATE OR REPLACE FUNCTION public.sync_store_house_from_products()
RETURNS TRIGGER AS $$
BEGIN
    -- Удаляем все старые записи для этого товара
    DELETE FROM public.store_house WHERE productid = NEW.id;
    
    -- Вставляем только размеры с quantity > 0
    INSERT INTO public.store_house (productid, size, quantity)
    SELECT
        NEW.id,
        key,
        COALESCE((value->>'quantity')::INTEGER, 0)
    FROM jsonb_each(NEW.sizes)
    WHERE COALESCE((value->>'quantity')::INTEGER, 0) > 0;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер на INSERT и UPDATE в products.sizes
DROP TRIGGER IF EXISTS trg_sync_store_house_from_products ON public.products;
CREATE TRIGGER trg_sync_store_house_from_products
AFTER INSERT OR UPDATE OF sizes ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.sync_store_house_from_products();

-- Очищаем store_house
TRUNCATE public.store_house;

-- Заполняем store_house из products (только quantity > 0)
INSERT INTO public.store_house (productid, size, quantity)
SELECT
    p.id,
    key,
    COALESCE((value->>'quantity')::INTEGER, 0)
FROM public.products p,
LATERAL jsonb_each(p.sizes)
WHERE COALESCE((value->>'quantity')::INTEGER, 0) > 0;

