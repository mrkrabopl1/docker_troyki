CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA "public";

CREATE SEQUENCE "public"."admin_password_resets_id_seq";

ALTER SEQUENCE "public"."admin_password_resets_id_seq" OWNED BY "public"."admin_password_resets"."id";

CREATE SEQUENCE "public"."order_events_id_seq";

ALTER SEQUENCE "public"."order_events_id_seq" OWNED BY "public"."order_events"."id";

CREATE SEQUENCE "public"."page_widgets_id_seq";

ALTER SEQUENCE "public"."page_widgets_id_seq" OWNED BY "public"."page_widgets"."id";

SET check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.sync_product_sizes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- ?????????????? ???????????? ???????????? ?????? ?????????? ????????????
    DELETE FROM public.product_sizes WHERE product_id = NEW.id;

    -- ?????????????????? ?????????? ?????????????? ???? JSONB, ???????????? ???????? ???????? > 0, ???????? ?? ?????????????? ?? ???????????????????? > 0
    INSERT INTO public.product_sizes (product_id, size_key, price, in_stock, quantity)
    SELECT
        NEW.id,
        key,
        (value->>'price')::NUMERIC,
        COALESCE((value->>'in_stock')::BOOLEAN, false),
        COALESCE((value->>'quantity')::INTEGER, 0)
    FROM jsonb_each(NEW.sizes)
    WHERE (value->>'price')::NUMERIC > 0
      AND COALESCE((value->>'in_stock')::BOOLEAN, false) = true
      AND COALESCE((value->>'quantity')::INTEGER, 0) > 0;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_products_status_on_brand_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.is_active = false AND OLD.is_active = true THEN
        UPDATE products 
        SET status = 'draft', updated_at = NOW()
        WHERE brand_id = NEW.id AND status = 'active';
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE TABLE "public"."admin_password_resets" (
  "id" integer NOT NULL DEFAULT nextval('admin_password_resets_id_seq'::regclass),
  "email" character varying(255) NOT NULL,
  "token" character varying(64) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."order_events" (
  "id" bigint NOT NULL DEFAULT nextval('order_events_id_seq'::regclass),
  "order_id" integer NOT NULL,
  "event_type" character varying(50) NOT NULL,
  "old_status" character varying(50),
  "new_status" character varying(50),
  "reason" text,
  "reason_code" character varying(50),
  "changed_by_admin" integer,
  "changed_by_type" character varying(20) NOT NULL DEFAULT 'admin'::character varying,
  "ip_address" inet,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "public"."page_widgets" (
  "id" integer NOT NULL DEFAULT nextval('page_widgets_id_seq'::regclass),
  "name" character varying(255) NOT NULL,
  "type" character varying(100) NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "settings" jsonb,
  "link_url" character varying(500) NOT NULL
);

CREATE TABLE "public"."product_sizes" (
  "product_id" integer NOT NULL,
  "size_key" text NOT NULL,
  "price" numeric NOT NULL,
  "in_stock" boolean DEFAULT true,
  "quantity" integer DEFAULT 0
);

ALTER TABLE "public"."discount" DROP COLUMN "minprice";

ALTER TABLE "public"."discount" DROP COLUMN "maxdiscprice";

ALTER TABLE "public"."discount" ADD COLUMN "min_price" integer NOT NULL DEFAULT 0;

ALTER TABLE "public"."discount" ADD COLUMN "discounted_price" integer NOT NULL DEFAULT 0;

ALTER TABLE "public"."discount" ADD COLUMN "discount_percent" integer DEFAULT 0;

ALTER TABLE "public"."discount" ADD COLUMN "original_price" integer NOT NULL DEFAULT 0;

ALTER TABLE "public"."discount" ADD COLUMN "max_price" integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX admin_password_resets_email_unique ON public.admin_password_resets USING btree (email);

CREATE UNIQUE INDEX admin_password_resets_pkey ON public.admin_password_resets USING btree (id);

CREATE INDEX idx_brands_id_active ON public.brands USING btree (id, is_active) WHERE (is_active = true);

CREATE INDEX idx_discount_max_price ON public.discount USING btree (max_price);

CREATE INDEX idx_discount_min_price ON public.discount USING btree (min_price);

CREATE INDEX idx_discount_percent ON public.discount USING btree (discount_percent) WHERE (discount_percent > 0);

CREATE INDEX idx_discount_productid ON public.discount USING btree (productid);

CREATE INDEX idx_discount_rule_id ON public.discount USING btree (rule_id);

CREATE INDEX idx_discount_rule_items_type_id ON public.discount_rule_items USING btree (item_type, item_id);

CREATE INDEX idx_discount_rules_active_dates ON public.discount_rules USING btree (is_active, starts_at, ends_at) WHERE (is_active = true);

CREATE INDEX idx_order_events_created_at ON public.order_events USING btree (created_at);

CREATE INDEX idx_order_events_order_id ON public.order_events USING btree (order_id);

CREATE INDEX idx_order_events_type ON public.order_events USING btree (event_type);

CREATE UNIQUE INDEX order_events_pkey ON public.order_events USING btree (id);

CREATE UNIQUE INDEX page_widgets_pkey ON public.page_widgets USING btree (id);

CREATE INDEX idx_product_sizes_product_id ON public.product_sizes USING btree (product_id);

CREATE INDEX idx_product_sizes_size_key ON public.product_sizes USING btree (size_key);

CREATE UNIQUE INDEX product_sizes_pkey ON public.product_sizes USING btree (product_id, size_key);

CREATE INDEX idx_products_name_trgm ON public.products USING gin (name gin_trgm_ops);

CREATE INDEX idx_products_status_category_type ON public.products USING btree (status, category, type) WHERE ((status)::text = 'active'::text);

ALTER TABLE "public"."admin_password_resets" ADD CONSTRAINT "admin_password_resets_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."order_events" ADD CONSTRAINT "order_events_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."page_widgets" ADD CONSTRAINT "page_widgets_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."product_sizes" ADD CONSTRAINT "product_sizes_pkey" PRIMARY KEY (product_id, size_key);

ALTER TABLE "public"."admin_password_resets" ADD CONSTRAINT "admin_password_resets_email_unique" UNIQUE (email);

ALTER TABLE "public"."order_events" ADD CONSTRAINT "order_events_changed_by_admin_fkey" FOREIGN KEY (changed_by_admin) REFERENCES admins(id) ON DELETE SET NULL;

ALTER TABLE "public"."order_events" ADD CONSTRAINT "order_events_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE "public"."product_sizes" ADD CONSTRAINT "product_sizes_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

CREATE TRIGGER brand_status_change AFTER UPDATE OF is_active ON public.brands FOR EACH ROW EXECUTE FUNCTION update_products_status_on_brand_change();

CREATE TRIGGER trg_sync_sizes AFTER INSERT OR UPDATE OF sizes ON public.products FOR EACH ROW EXECUTE FUNCTION sync_product_sizes();

