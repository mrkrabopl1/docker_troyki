CREATE TABLE public.promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255),
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percent', 'fixed', 'free_shipping')),
    discount_value INTEGER NOT NULL,          -- для percent: 30 = 30%, для fixed: сумма в копейках
    min_order_amount INTEGER DEFAULT 0,       -- минимальная сумма корзины для применения (в копейках)
    max_discount_amount INTEGER DEFAULT 0,    -- максимальная сумма скидки (в копейках), 0 = без ограничения
    applies_to VARCHAR(20) DEFAULT 'all' CHECK (applies_to IN ('all', 'categories', 'brands', 'products')),
    applies_to_ids TEXT,                      -- строка ID через запятую, например '1,2,3'
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    usage_limit INTEGER DEFAULT 0,            -- общее количество использований, 0 = без ограничений
    per_user_limit INTEGER DEFAULT 0,         -- сколько раз на одного пользователя, 0 = без ограничений
    is_active BOOLEAN DEFAULT TRUE,
    is_combinable BOOLEAN DEFAULT FALSE,      -- можно ли комбинировать с другими
    priority INTEGER DEFAULT 0,               -- приоритет (выше = важнее)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_promo_codes_code ON promo_codes(code) WHERE is_active = TRUE;
CREATE INDEX idx_promo_codes_dates ON promo_codes(starts_at, ends_at) WHERE is_active = TRUE;


CREATE TABLE public.promo_code_usage (
    id SERIAL PRIMARY KEY,
    promo_code_id INTEGER NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    discount_amount INTEGER NOT NULL,          -- фактическая скидка в копейках
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_promo_usage_code ON promo_code_usage(promo_code_id);
CREATE INDEX idx_promo_usage_order ON promo_code_usage(order_id);
CREATE INDEX idx_promo_usage_customer ON promo_code_usage(customer_id);

