-- ============================================
-- Миграция: Создание таблиц брендов и линеек
-- ============================================

BEGIN;

-- Создаем функцию для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создаем таблицу брендов
CREATE TABLE IF NOT EXISTS public.brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    logo_path TEXT,
    image_path TEXT,
    description TEXT,
    website VARCHAR(500),
    country VARCHAR(100),
    founded_year INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    sort_order INTEGER DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем таблицу линеек брендов
CREATE TABLE IF NOT EXISTS public.brand_lines (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    image_path TEXT,
    season VARCHAR(50),
    year INTEGER,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_brand_line UNIQUE (brand_id, name)
);

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);
CREATE INDEX IF NOT EXISTS idx_brand_lines_brand_id ON brand_lines(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_lines_slug ON brand_lines(slug);
CREATE INDEX IF NOT EXISTS idx_brand_lines_season ON brand_lines(season);

-- Добавляем триггеры
DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at 
    BEFORE UPDATE ON brands 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brand_lines_updated_at ON brand_lines;
CREATE TRIGGER update_brand_lines_updated_at 
    BEFORE UPDATE ON brand_lines 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Добавляем колонки в products
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'brand_id') THEN
        ALTER TABLE public.products ADD COLUMN brand_id INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'line_id') THEN
        ALTER TABLE public.products ADD COLUMN line_id INTEGER;
    END IF;
END $$;

-- Переносим бренды
INSERT INTO brands (name, slug, created_at, updated_at)
SELECT DISTINCT 
    TRIM(firm),
    LOWER(REGEXP_REPLACE(TRIM(firm), '[^a-z0-9]+', '-', 'gi')),
    NOW(),
    NOW()
FROM products
WHERE firm IS NOT NULL AND TRIM(firm) != ''
ON CONFLICT (name) DO NOTHING;

-- Обновляем brand_id в products
UPDATE products p
SET brand_id = b.id
FROM brands b
WHERE p.firm = b.name;

-- Переносим линейки
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

-- Обновляем line_id в products
UPDATE products p
SET line_id = bl.id
FROM brand_lines bl
WHERE p.brand_id = bl.brand_id 
  AND p.line = bl.name;

-- Добавляем внешние ключи
ALTER TABLE products ADD CONSTRAINT fk_products_brand 
FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;

ALTER TABLE products ADD CONSTRAINT fk_products_line 
FOREIGN KEY (line_id) REFERENCES brand_lines(id) ON DELETE SET NULL;

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_line_id ON products(line_id);

-- Проверка результата
DO $$
DECLARE
    missing_brands INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_brands
    FROM products 
    WHERE brand_id IS NULL AND firm IS NOT NULL;
    
    IF missing_brands > 0 THEN
        RAISE NOTICE 'Внимание: % продуктов без бренда', missing_brands;
    ELSE
        RAISE NOTICE 'Все продукты успешно связаны с брендами';
    END IF;
END $$;

-- COMMIT;-- ============================================
-- Миграция: Создание таблиц брендов и линеек
-- ============================================

BEGIN;

-- Создаем функцию для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создаем таблицу брендов
CREATE TABLE IF NOT EXISTS public.brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    logo_path TEXT,
    image_path TEXT,
    description TEXT,
    website VARCHAR(500),
    country VARCHAR(100),
    founded_year INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    sort_order INTEGER DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем таблицу линеек брендов
CREATE TABLE IF NOT EXISTS public.brand_lines (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    image_path TEXT,
    season VARCHAR(50),
    year INTEGER,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_brand_line UNIQUE (brand_id, name)
);

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);
CREATE INDEX IF NOT EXISTS idx_brand_lines_brand_id ON brand_lines(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_lines_slug ON brand_lines(slug);
CREATE INDEX IF NOT EXISTS idx_brand_lines_season ON brand_lines(season);

-- Добавляем триггеры
DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at 
    BEFORE UPDATE ON brands 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brand_lines_updated_at ON brand_lines;
CREATE TRIGGER update_brand_lines_updated_at 
    BEFORE UPDATE ON brand_lines 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Добавляем колонки в products
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'brand_id') THEN
        ALTER TABLE public.products ADD COLUMN brand_id INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'line_id') THEN
        ALTER TABLE public.products ADD COLUMN line_id INTEGER;
    END IF;
END $$;

-- Переносим бренды
INSERT INTO brands (name, slug, created_at, updated_at)
SELECT DISTINCT 
    TRIM(firm),
    LOWER(REGEXP_REPLACE(TRIM(firm), '[^a-z0-9]+', '-', 'gi')),
    NOW(),
    NOW()
FROM products
WHERE firm IS NOT NULL AND TRIM(firm) != ''
ON CONFLICT (name) DO NOTHING;

-- Обновляем brand_id в products
UPDATE products p
SET brand_id = b.id
FROM brands b
WHERE p.firm = b.name;

-- Переносим линейки
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

-- Обновляем line_id в products
UPDATE products p
SET line_id = bl.id
FROM brand_lines bl
WHERE p.brand_id = bl.brand_id 
  AND p.line = bl.name;

-- Добавляем внешние ключи
ALTER TABLE products ADD CONSTRAINT fk_products_brand 
FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;

ALTER TABLE products ADD CONSTRAINT fk_products_line 
FOREIGN KEY (line_id) REFERENCES brand_lines(id) ON DELETE SET NULL;

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_line_id ON products(line_id);

-- Проверка результата
DO $$
DECLARE
    missing_brands INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_brands
    FROM products 
    WHERE brand_id IS NULL AND firm IS NOT NULL;
    
    IF missing_brands > 0 THEN
        RAISE NOTICE 'Внимание: % продуктов без бренда', missing_brands;
    ELSE
        RAISE NOTICE 'Все продукты успешно связаны с брендами';
    END IF;
END $$;

-- COMMIT;