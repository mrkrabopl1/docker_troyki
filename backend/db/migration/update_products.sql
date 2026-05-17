-- -- Добавляем поля для мягкого удаления
-- ALTER TABLE public.products 
-- ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

-- ALTER TABLE public.products 
-- ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- ALTER TABLE public.products 
-- ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- -- Добавляем CHECK constraint для status
-- ALTER TABLE public.products 
-- DROP CONSTRAINT IF EXISTS products_status_check;

-- ALTER TABLE public.products 
-- ADD CONSTRAINT products_status_check 
-- CHECK (status IN ('active', 'archived', 'deleted', 'draft'));

-- -- Индексы для быстрого поиска
-- CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
-- CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON public.products(deleted_at);
-- CREATE INDEX IF NOT EXISTS idx_products_archived_at ON public.products(archived_at);


ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON public.products(updated_at);


-- -- Проверяем и обновляем внешние ключи
-- DO $$ 
-- BEGIN
--     -- product_colors
--     IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
--                WHERE constraint_name = 'product_colors_product_id_fkey' 
--                AND table_name = 'product_colors') THEN
--         ALTER TABLE product_colors 
--         DROP CONSTRAINT product_colors_product_id_fkey;
--     END IF;
    
--     ALTER TABLE product_colors 
--     ADD CONSTRAINT product_colors_product_id_fkey 
--     FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    
--     -- store_house
--     IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
--                WHERE constraint_name = 'store_house_productid_fkey' 
--                AND table_name = 'store_house') THEN
--         ALTER TABLE store_house 
--         DROP CONSTRAINT store_house_productid_fkey;
--     END IF;
    
--     ALTER TABLE store_house 
--     ADD CONSTRAINT store_house_productid_fkey 
--     FOREIGN KEY (productid) REFERENCES products(id) ON DELETE CASCADE;
    
--     -- discount
--     IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
--                WHERE constraint_name = 'discount_productid_fkey' 
--                AND table_name = 'discount') THEN
--         ALTER TABLE discount 
--         DROP CONSTRAINT discount_productid_fkey;
--     END IF;
    
--     ALTER TABLE discount 
--     ADD CONSTRAINT discount_productid_fkey 
--     FOREIGN KEY (productid) REFERENCES products(id) ON DELETE CASCADE;
-- END $$;