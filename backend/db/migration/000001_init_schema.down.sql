DROP TABLE IF EXISTS public.preorderitems;
DROP TABLE IF EXISTS public.orderitems;
DROP TABLE IF EXISTS public.preorderaddress;
DROP TABLE IF EXISTS public.orderaddress;
DROP TABLE IF EXISTS public.preorder;
DROP TABLE IF EXISTS public.orders;
DROP TABLE IF EXISTS public.verification;
DROP TABLE IF EXISTS public.unregistercustomer;
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS public.uniquecustomers;

-- Затем удаляем таблицы, на которые ссылались внешние ключи
DROP TABLE IF EXISTS public.discount;
DROP TABLE IF EXISTS public.snickers;
DROP TABLE IF EXISTS public.solomerch;
DROP TABLE IF EXISTS public.clothes;
DROP TABLE IF EXISTS public.product_registry; 
DROP TABLE IF EXISTS public.product_types;
-- И только потом удаляем типы
DROP TYPE IF EXISTS public.delivery_enum;
DROP TYPE IF EXISTS public.status_enum;
DROP TYPE IF EXISTS public.clothes_enum;
DROP TYPE IF EXISTS public.merch_enum;
DROP TYPE IF EXISTS public.body_enum;
DROP TYPE IF EXISTS public.snickers_enum;
DROP TYPE IF EXISTS public.product_source_enum;