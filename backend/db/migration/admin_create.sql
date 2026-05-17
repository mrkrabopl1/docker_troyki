-- -- ============================================
-- -- ENUM для ролей админов
-- -- ============================================
-- CREATE TYPE admin_role_enum AS ENUM ('admin', 'superadmin');

-- -- ============================================
-- -- Таблица админов (чисто и просто)
-- -- ============================================
-- CREATE TABLE public.admins (
--     id SERIAL PRIMARY KEY,
--     email VARCHAR(255) NOT NULL UNIQUE,
--     password_hash BYTEA NOT NULL,
--     name VARCHAR(100) NOT NULL,
--     role admin_role_enum NOT NULL DEFAULT 'admin',
--     is_active BOOLEAN DEFAULT true,
--     last_login_at TIMESTAMPTZ,
--     last_login_ip INET,
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- -- Индексы
-- CREATE INDEX idx_admins_email ON public.admins(email);
-- CREATE INDEX idx_admins_role ON public.admins(role);



-- -- ============================================
-- -- Логи действий админов (без JSONB перемудрений)
-- -- ============================================
-- CREATE TABLE public.admin_logs (
--     id SERIAL PRIMARY KEY,
--     admin_id INT NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
--     action VARCHAR(50) NOT NULL,     -- 'create_product', 'update_order', 'delete_product'
--     entity_type VARCHAR(50),         -- 'product', 'order', 'discount', 'banner'
--     entity_id INT,
--     details TEXT,                    -- человекочитаемое описание: "Изменил цену товара X с 1000 на 1200"
--     ip_address INET,
--     created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- CREATE INDEX idx_admin_logs_admin_id ON public.admin_logs(admin_id);
-- CREATE INDEX idx_admin_logs_created_at ON public.admin_logs(created_at);
-- CREATE INDEX idx_admin_logs_action ON public.admin_logs(action);


-- CREATE UNIQUE INDEX IF NOT EXISTS idx_products_article ON public.products(article);
-- CREATE INDEX IF NOT EXISTS idx_orderitems_productid ON public.orderitems(ProductId);
-- CREATE INDEX IF NOT EXISTS idx_orderitems_orderid ON public.orderitems(OrderID);

-- -- Индекс для preorderitems
-- CREATE INDEX IF NOT EXISTS idx_preorderitems_productid ON public.preorderitems(ProductId);
-- CREATE INDEX IF NOT EXISTS idx_preorderitems_orderid ON public.preorderitems(OrderID);


-- CREATE INDEX idx_products_name_search 
-- ON public.products USING gin(to_tsvector('simple', name));