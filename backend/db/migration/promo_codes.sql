DROP TABLE IF EXISTS public.promo_codes CASCADE;

CREATE TABLE public.promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255),
    description TEXT,
    
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value INTEGER NOT NULL,
    
    applies_to VARCHAR(20) NOT NULL DEFAULT 'global' CHECK (applies_to IN ('global', 'collection')),
    collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
    
    -- Упрощённые названия без 'amount'
    min_order INTEGER DEFAULT 0,
    max_order INTEGER DEFAULT 0,
    max_discount INTEGER DEFAULT 0,
    
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    usage_limit INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT promo_collection_check CHECK (
        (applies_to = 'global' AND collection_id IS NULL) OR
        (applies_to = 'collection' AND collection_id IS NOT NULL)
    )
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code) WHERE is_active = TRUE;
CREATE INDEX idx_promo_codes_dates ON promo_codes(starts_at, ends_at) WHERE is_active = TRUE;
CREATE INDEX idx_promo_codes_collection ON promo_codes(collection_id) WHERE applies_to = 'collection';




CREATE TABLE public.promo_code_usage (
    id SERIAL PRIMARY KEY,
    promo_code_id INTEGER NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    promo_code_snapshot JSONB,
    discount_amount INTEGER NOT NULL,          -- фактическая скидка в копейках
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_promo_usage_code ON promo_code_usage(promo_code_id);
CREATE INDEX idx_promo_usage_order ON promo_code_usage(order_id);
CREATE INDEX idx_promo_usage_customer ON promo_code_usage(customer_id);