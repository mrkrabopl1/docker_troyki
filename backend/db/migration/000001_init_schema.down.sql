DROP TABLE IF EXISTS public.preorderitems;
DROP TABLE IF EXISTS public.product_colors;
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
DROP TABLE IF EXISTS public.colors;
DROP TABLE IF EXISTS public.discount;
DROP TABLE IF EXISTS public.product_colors;
DROP TABLE IF EXISTS public.store_house;
DROP TABLE IF EXISTS public.products;
DROP TABLE IF EXISTS public.product_types;
DROP TABLE IF EXISTS public.product_categories;
-- И только потом удаляем типы
DROP TYPE IF EXISTS public.delivery_enum;
DROP TYPE IF EXISTS public.status_enum;
DROP TYPE IF EXISTS public.clothes_enum;
DROP TYPE IF EXISTS public.merch_enum;
DROP TYPE IF EXISTS public.body_enum;
DROP TYPE IF EXISTS public.snickers_enum;
DROP TYPE IF EXISTS public.product_source_enum;