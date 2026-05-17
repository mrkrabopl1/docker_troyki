BEGIN;
CREATE TYPE public.status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.delivery_enum AS ENUM ('own', 'express', 'cdek', 'curier');
CREATE TYPE public.body_enum AS ENUM ('child', 'woman', 'man', 'unisex');
CREATE TYPE public.admin_role_enum AS ENUM ('admin', 'superadmin');
CREATE TABLE IF NOT EXISTS public.colors (
    id SERIAL PRIMARY KEY,
    enum_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    hex_code VARCHAR(9) NOT NULL
);
-- Категории
CREATE TABLE IF NOT EXISTS public.product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    enum_key VARCHAR(50) NOT NULL UNIQUE,
    image_path TEXT
);
-- Типы товаров
CREATE TABLE IF NOT EXISTS public.product_types (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
    type_name VARCHAR(50) NOT NULL,
    enum_key VARCHAR(50) NOT NULL,
    UNIQUE(category_id, enum_key)
);
-- Начальные данные
INSERT INTO public.colors (enum_key, name, hex_code)
VALUES ('red', 'Красный', '#FF0000'),
    ('blue', 'Синий', '#0000FF'),
    ('black', 'Черный', '#000000'),
    ('white', 'Белый', '#FFFFFF') ON CONFLICT (enum_key) DO NOTHING;
INSERT INTO public.product_categories (name, enum_key, image_path)
VALUES ('Кроссовки', 'sneakers', 'sneakers.svg'),
    ('Одежда', 'clothes', 'clothes.svg') ON CONFLICT (enum_key) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    qId TEXT NOT NULL,
    name TEXT NOT NULL,
    image_path TEXT NOT NULL,
    minprice INTEGER NOT NULL,
    maxprice INTEGER NOT NULL,
    type INTEGER NOT NULL REFERENCES product_types(id),
    category INTEGER NOT NULL REFERENCES product_categories(id),
    article TEXT NOT NULL UNIQUE,
    date TEXT,
    description TEXT,
    bodytype public.body_enum NOT NULL DEFAULT 'man',
    image_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sizes JSONB
);
CREATE TABLE IF NOT EXISTS public.product_colors (
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color_id INTEGER NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, color_id)
);
-- Только эти две таблицы для массовых скидок
-- Все поля, которые обязательные, делаем NOT NULL
CREATE TABLE IF NOT EXISTS public.discount_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    discount_type VARCHAR(20) NOT NULL,
    discount_value INTEGER NOT NULL,
    -- процент * 100 (3000 = 30.00%)
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.discount_rule_items (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER NOT NULL REFERENCES discount_rules(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('brand', 'line', 'product')),
    item_id INTEGER NOT NULL,
    UNIQUE(rule_id, item_type, item_id)
);
CREATE TABLE IF NOT EXISTS public.discount (
    id SERIAL PRIMARY KEY,
    productid INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    minprice INTEGER NOT NULL DEFAULT 0,
    maxdiscprice INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.store_house (
    id SERIAL PRIMARY KEY,
    productid INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(productid, size)
);
-- Индексы
CREATE INDEX IF NOT EXISTS idx_products_qid ON products(qId);
CREATE INDEX IF NOT EXISTS idx_products_article ON products(article);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_store_house_product ON store_house(productid);
CREATE TABLE IF NOT EXISTS public.customers (
    id SERIAL PRIMARY KEY,
    name TEXT,
    secondName TEXT,
    mail TEXT NOT NULL UNIQUE,
    pass BYTEA NOT NULL,
    phone TEXT,
    town TEXT,
    index TEXT,
    sendMail BOOLEAN DEFAULT FALSE,
    street TEXT,
    region TEXT,
    home TEXT,
    flat TEXT,
    coordinates INTEGER [],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.verification (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    CustomerID INTEGER NOT NULL REFERENCES customers(id),
    expire TIMESTAMP NOT NULL,
    deleteTime TIMESTAMP NOT NULL
);
CREATE TABLE IF NOT EXISTS public.unregistercustomer (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    secondName TEXT,
    mail TEXT NOT NULL,
    phone TEXT NOT NULL,
    town TEXT NOT NULL,
    index TEXT NOT NULL,
    sendMail BOOLEAN,
    street TEXT,
    settlement TEXT,
    region TEXT,
    deliveryComment TEXT,
    house TEXT,
    flat TEXT,
    coordinates TEXT [],
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE public.uniquecustomers (
    id serial PRIMARY KEY NOT NULL,
    creationTime DATE NOT NULL DEFAULT CURRENT_DATE,
    history INTEGER [] NOT NULL
);
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    CustomerID INTEGER REFERENCES customers(id),
    UnregisterCustomerID INTEGER REFERENCES unregistercustomer(id),
    OrderDate DATE NOT NULL DEFAULT CURRENT_DATE,
    Status public.status_enum NOT NULL DEFAULT 'pending',
    Hash TEXT NOT NULL,
    DeliveryPrice INTEGER NOT NULL DEFAULT 0,
    DeliveryComment TEXT,
    DeliveryType public.delivery_enum NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.orderitems (
    id SERIAL PRIMARY KEY,
    OrderID INTEGER NOT NULL REFERENCES orders(id),
    ProductId INTEGER NOT NULL,
    Quantity INTEGER NOT NULL CHECK (Quantity > 0),
    Price INTEGER NOT NULL,
    Image_path TEXT NOT NULL,
    Name TEXT NOT NULL,
    Size TEXT
);
CREATE TABLE IF NOT EXISTS public.orderAddress (
    id SERIAL PRIMARY KEY,
    OrderID INTEGER NOT NULL UNIQUE REFERENCES orders(id),
    town TEXT NOT NULL,
    index TEXT NOT NULL,
    sendMail BOOLEAN,
    street TEXT,
    region TEXT,
    deliveryComment TEXT,
    house TEXT,
    flat TEXT,
    coordinates TEXT [] NOT NULL
);
CREATE TABLE IF NOT EXISTS public.preorder (
    id serial PRIMARY KEY NOT NULL,
    hashUrl TEXT NOT NULL,
    updateTime DATE
);
CREATE TABLE IF NOT EXISTS public.preorderitems (
    id serial PRIMARY KEY NOT NULL,
    OrderID INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    Price integer NOT NULL,
    Image_path TEXT NOT NULL,
    Name TEXT NOT NULL,
    Size TEXT,
    FOREIGN KEY (OrderID) REFERENCES public.preorder(id)
);
CREATE TABLE IF NOT EXISTS public.preorderAddress (
    id serial PRIMARY KEY NOT NULL,
    town TEXT NOT NULL,
    index TEXT NOT NULL,
    sendMail BOOLEAN,
    street TEXT,
    region TEXT,
    house TEXT,
    OrderID integer NOT NULL,
    flat TEXT,
    coordinates TEXT [] NOT NULL,
    FOREIGN KEY (OrderID) REFERENCES public.preorder(id)
);
-- Индексы
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(CustomerID);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(OrderDate);
CREATE INDEX IF NOT EXISTS idx_orderitems_order ON orderitems(OrderID);
CREATE INDEX IF NOT EXISTS idx_customers_mail ON customers(mail);
CREATE TABLE IF NOT EXISTS public.admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash BYTEA NOT NULL,
    name VARCHAR(100) NOT NULL,
    role admin_role_enum NOT NULL DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at);
CREATE TABLE customer_password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Для админов
CREATE TABLE admin_password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Подписка на новости
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'verified', 'unsubscribed')
    ),
    verification_token VARCHAR(64) NOT NULL UNIQUE,
    token_expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);
-- Сброс паролей
CREATE TABLE IF NOT EXISTS public.password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'admin')),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Индексы
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_token ON newsletter_subscribers(verification_token);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
CREATE TABLE IF NOT EXISTS public.brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    image_path TEXT,
    description TEXT,
    website VARCHAR(500),
    country VARCHAR(100),
    sort_order INTEGER NOT NULL DEFAULT 0,
    founded_year INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.brand_lines (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    image_path TEXT,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    season VARCHAR(50),
    year INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(brand_id, name)
);
-- Добавляем колонки с NOT NULL
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS line_id INTEGER REFERENCES brand_lines(id) ON DELETE SET NULL;

-- Добавляем уникальность на комбинацию
ALTER TABLE public.products
ADD CONSTRAINT unique_brand_line_combination UNIQUE (brand_id, line_id);
-- Перенос данных из firm и line
INSERT INTO brands (name, slug)
SELECT DISTINCT firm,
    LOWER(REGEXP_REPLACE(firm, '[^a-z0-9]+', '-', 'gi'))
FROM products
WHERE firm IS NOT NULL ON CONFLICT (name) DO NOTHING;
UPDATE products
SET brand_id = brands.id
FROM brands
WHERE products.firm = brands.name;
-- Индексы
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brand_lines_brand ON brand_lines(brand_id);
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.products
ADD CONSTRAINT products_status_check CHECK (
        status IN ('active', 'archived', 'deleted', 'draft')
    );
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_deleted ON products(deleted_at)
WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_name_search ON public.products USING gin(to_tsvector('russian', name));
-- Составные индексы
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category, status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(CustomerID, Status);
CREATE INDEX IF NOT EXISTS idx_orderitems_product_order ON orderitems(ProductId, OrderID);
-- Индексы для preorder
CREATE INDEX IF NOT EXISTS idx_preorder_hash ON preorder(hashUrl);
CREATE INDEX IF NOT EXISTS idx_preorderitems_order ON preorderitems(OrderID);
CREATE INDEX IF NOT EXISTS idx_preorderitems_product ON preorderitems(ProductId);
TRUNCATE brands CASCADE;
-- 2. Переносим бренды (уже не будет дубликатов)
INSERT INTO brands (name, slug, created_at, updated_at)
SELECT DISTINCT TRIM(firm),
    LOWER(
        REGEXP_REPLACE(TRIM(firm), '[^a-z0-9]+', '-', 'gi')
    ),
    NOW(),
    NOW()
FROM products
WHERE firm IS NOT NULL
    AND TRIM(firm) != '';
-- 3. Обновляем brand_id в products
UPDATE products p
SET brand_id = b.id
FROM brands b
WHERE p.firm = b.name;
-- 4. Переносим линейки
INSERT INTO brand_lines (brand_id, name, slug, created_at, updated_at)
SELECT DISTINCT p.brand_id,
    TRIM(p.line),
    LOWER(
        REGEXP_REPLACE(TRIM(p.line), '[^a-z0-9]+', '-', 'gi')
    ),
    NOW(),
    NOW()
FROM products p
WHERE p.brand_id IS NOT NULL
    AND p.line IS NOT NULL
    AND TRIM(p.line) != '';
-- 5. Обновляем line_id в products
UPDATE products p
SET line_id = bl.id
FROM brand_lines bl
WHERE p.brand_id = bl.brand_id
    AND p.line = bl.name;
-- 6. Добавляем внешние ключи
ALTER TABLE products
ADD CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE
SET NULL;
ALTER TABLE products
ADD CONSTRAINT fk_products_line FOREIGN KEY (line_id) REFERENCES brand_lines(id) ON DELETE
SET NULL;
CREATE TABLE brands_stats (
    brand_id INT PRIMARY KEY REFERENCES brands(id) ON DELETE CASCADE,
    total_products INT DEFAULT 0,
    active_products INT DEFAULT 0,
    inactive_products INT DEFAULT 0,
    sneakers_count INT DEFAULT 0,
    merch_count INT DEFAULT 0,
    clothes_count INT DEFAULT 0,
    toys_count INT DEFAULT 0,
    lines_count INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);
COMMIT;