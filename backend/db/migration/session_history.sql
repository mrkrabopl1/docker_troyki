-- ============================================================
-- MIGRATION: uniquecustomers + product_view_events + fonts + site_settings
-- ============================================================

BEGIN;

-- 0. Расширение для gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. uniquecustomers: переименование + новые колонки
-- ============================================================

-- 1.1. creationTime → first_seen_at + тип TIMESTAMPTZ
ALTER TABLE public.uniquecustomers
    RENAME COLUMN "creationtime" TO first_seen_at;

ALTER TABLE public.uniquecustomers
    ALTER COLUMN first_seen_at TYPE TIMESTAMPTZ
    USING first_seen_at::timestamptz;

-- 1.2. Новые колонки (nullable — заполним ниже)
ALTER TABLE public.uniquecustomers
    ADD COLUMN session_id   TEXT,
    ADD COLUMN visitor_id   UUID,
    ADD COLUMN last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN ip_hash      TEXT,
    ADD COLUMN user_agent   TEXT;

-- 1.3. Заполнить существующие строки
UPDATE public.uniquecustomers
SET session_id   = gen_random_uuid()::text,
    visitor_id   = gen_random_uuid(),
    last_seen_at = first_seen_at
WHERE session_id IS NULL;

-- 1.4. NOT NULL после заполнения
ALTER TABLE public.uniquecustomers
    ALTER COLUMN session_id SET NOT NULL,
    ALTER COLUMN visitor_id SET NOT NULL;

-- 1.5. Убрать history (если есть)
ALTER TABLE public.uniquecustomers DROP COLUMN IF EXISTS history;

-- 1.6. Индексы
CREATE UNIQUE INDEX IF NOT EXISTS idx_uniquecustomers_session
    ON public.uniquecustomers(session_id);
CREATE INDEX IF NOT EXISTS idx_uniquecustomers_visitor
    ON public.uniquecustomers(visitor_id);
CREATE INDEX IF NOT EXISTS idx_uniquecustomers_ip_hash
    ON public.uniquecustomers(ip_hash) WHERE ip_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_uniquecustomers_first
    ON public.uniquecustomers(first_seen_at);
CREATE INDEX IF NOT EXISTS idx_uniquecustomers_last
    ON public.uniquecustomers(last_seen_at);

COMMIT;

-- ============================================================
-- 2. product_view_events
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_view_events (
    id           BIGSERIAL PRIMARY KEY,
    product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    session_id   TEXT    NOT NULL REFERENCES uniquecustomers(session_id) ON DELETE CASCADE,
    customer_id  INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    event_type   VARCHAR(20) NOT NULL DEFAULT 'view'
        CHECK (event_type IN ('view','click','add_to_cart','purchase')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pve_session
    ON public.product_view_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pve_product
    ON public.product_view_events(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pve_customer
    ON public.product_view_events(customer_id, created_at DESC)
    WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pve_type_time
    ON public.product_view_events(event_type, created_at DESC);

-- ============================================================
-- 3. fonts (сразу с UNIQUE (slug, weight, style))
-- ============================================================

CREATE TABLE IF NOT EXISTS fonts (
    id         SERIAL PRIMARY KEY,
    family     VARCHAR(100) NOT NULL,
    slug       VARCHAR(100) NOT NULL,
    url        TEXT NOT NULL,
    weight     SMALLINT NOT NULL DEFAULT 400
               CHECK (weight BETWEEN 100 AND 900 AND weight % 100 = 0),
    style      VARCHAR(10) NOT NULL DEFAULT 'normal'
               CHECK (style IN ('normal', 'italic')),
    is_active  BOOLEAN NOT NULL DEFAULT true,
    version    INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fonts_slug_weight_style_key UNIQUE (slug, weight, style)
);

CREATE INDEX IF NOT EXISTS idx_fonts_family
    ON fonts (family) WHERE is_active = true;

-- ============================================================
-- 4. site_settings (singleton)
-- ============================================================

CREATE TABLE IF NOT EXISTS site_settings (
    id              INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),

    logo_url        TEXT NOT NULL DEFAULT '/troyki_logo.svg',
    logo_alt        VARCHAR(255) NOT NULL DEFAULT 'TROYKI_BENCH',
    logo_version    INT NOT NULL DEFAULT 0,

    font_body_id    INT REFERENCES fonts(id) ON DELETE SET NULL,
    font_display_id INT REFERENCES fonts(id) ON DELETE SET NULL,

    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Начальная строка
INSERT INTO site_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;