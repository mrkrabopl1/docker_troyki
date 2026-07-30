-- -- Основная таблица коллекций
-- CREATE TABLE collections (
--     id SERIAL PRIMARY KEY,
--     slug VARCHAR(255) UNIQUE NOT NULL,
--     name VARCHAR(255) NOT NULL,
--     description TEXT,
--     type VARCHAR(50) NOT NULL DEFAULT 'dynamic', -- 'dynamic' | 'manual' | 'hybrid'
--     settings JSONB NOT NULL DEFAULT '{}',
--     is_active BOOLEAN DEFAULT true,
--     sort_order INT NOT NULL DEFAULT 0,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Связь коллекций с товарами (для ручного режима)
-- CREATE TABLE collection_products (
--     collection_id INT REFERENCES collections(id) ON DELETE CASCADE,
--     product_id INT REFERENCES products(id) ON DELETE CASCADE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     PRIMARY KEY (collection_id, product_id)
-- );

-- -- Индексы для производительности
-- CREATE INDEX idx_collections_slug ON collections(slug);
-- CREATE INDEX idx_collections_type ON collections(type);
-- CREATE INDEX idx_collections_active ON collections(is_active);
-- CREATE INDEX idx_collection_products_collection ON collection_products(collection_id);
-- CREATE INDEX idx_collection_products_product ON collection_products(product_id);


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