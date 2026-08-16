DELETE FROM products WHERE brand_id IS NULL;

ALTER TABLE public.products 
ALTER COLUMN brand_id SET NOT NULL;