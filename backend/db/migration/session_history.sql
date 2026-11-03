-- BEGIN;

-- -- 0. На всякий случай — расширение для gen_random_uuid()
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -- 1. Переименовываем creationTime → first_seen_at + меняем тип
-- ALTER TABLE public.uniquecustomers
--     RENAME COLUMN "creationtime" TO first_seen_at;

-- ALTER TABLE public.uniquecustomers
--     ALTER COLUMN first_seen_at TYPE TIMESTAMPTZ
--     USING first_seen_at::timestamptz;

-- -- 2. Добавляем новые колонки (nullable — заполним ниже)
-- ALTER TABLE public.uniquecustomers
--     ADD COLUMN session_id   TEXT,
--     ADD COLUMN visitor_id   UUID,
--     ADD COLUMN last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     ADD COLUMN ip_hash      TEXT,
--     ADD COLUMN user_agent   TEXT;

-- -- 3. Заполняем существующие строки
-- UPDATE public.uniquecustomers
-- SET session_id   = gen_random_uuid()::text,
--     visitor_id   = gen_random_uuid(),
--     last_seen_at = first_seen_at
-- WHERE session_id IS NULL;

-- -- 4. NOT NULL после заполнения
-- ALTER TABLE public.uniquecustomers
--     ALTER COLUMN session_id SET NOT NULL,
--     ALTER COLUMN visitor_id SET NOT NULL;

-- -- 5. Убираем history (если нужно перенести — см. блок 4 ниже, до DROP)
-- ALTER TABLE public.uniquecustomers DROP COLUMN IF EXISTS history;

-- -- 6. Индексы
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_uniquecustomers_session
--     ON public.uniquecustomers(session_id);
-- CREATE INDEX IF NOT EXISTS idx_uniquecustomers_visitor
--     ON public.uniquecustomers(visitor_id);
-- CREATE INDEX IF NOT EXISTS idx_uniquecustomers_ip_hash
--     ON public.uniquecustomers(ip_hash) WHERE ip_hash IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_uniquecustomers_first
--     ON public.uniquecustomers(first_seen_at);
-- CREATE INDEX IF NOT EXISTS idx_uniquecustomers_last
--     ON public.uniquecustomers(last_seen_at);

-- COMMIT;


-- CREATE TABLE IF NOT EXISTS public.product_view_events (
--     id           BIGSERIAL PRIMARY KEY,
--     product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
--     session_id   TEXT    NOT NULL REFERENCES uniquecustomers(session_id) ON DELETE CASCADE,
--     customer_id  INTEGER REFERENCES customers(id) ON DELETE SET NULL,
--     event_type   VARCHAR(20) NOT NULL DEFAULT 'view'
--         CHECK (event_type IN ('view','click','add_to_cart','purchase')),
--     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- CREATE INDEX IF NOT EXISTS idx_pve_session
--     ON public.product_view_events(session_id, created_at);
-- CREATE INDEX IF NOT EXISTS idx_pve_product
--     ON public.product_view_events(product_id, created_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_pve_customer
--     ON public.product_view_events(customer_id, created_at DESC)
--     WHERE customer_id IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_pve_type_time
--     ON public.product_view_events(event_type, created_at DESC);


TRUNCATE TABLE public.product_view_events, public.uniquecustomers RESTART IDENTITY CASCADE;