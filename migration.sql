--
-- PostgreSQL database dump
--

-- Dumped from database version 16.1
-- Dumped by pg_dump version 16.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: admin_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.admin_role_enum AS ENUM (
    'admin',
    'superadmin'
);


--
-- Name: body_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.body_enum AS ENUM (
    'child',
    'woman',
    'man',
    'unisex'
);


--
-- Name: delivery_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.delivery_enum AS ENUM (
    'own',
    'express',
    'cdek',
    'curier'
);


--
-- Name: news_item_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.news_item_type_enum AS ENUM (
    'header',
    'text',
    'image'
);


--
-- Name: status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_enum AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: auto_update_clothes_types(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_update_clothes_types() RETURNS TABLE(product_id integer, product_name text, old_type text, new_type text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    clothes_cat_id INTEGER;
    product_rec RECORD;
    target_type_id INTEGER;
    target_type_enum TEXT;
    old_type_name TEXT;
    updated_count INTEGER := 0;
BEGIN
    SELECT id INTO clothes_cat_id FROM product_categories WHERE enum_key = 'clothes';
    IF clothes_cat_id IS NULL THEN 
        RAISE EXCEPTION 'Category "clothes" not found';
    END IF;
    
    CREATE TEMP TABLE update_results_clothes (product_id INTEGER, product_name TEXT, old_type TEXT, new_type TEXT);
    
    FOR product_rec IN 
        SELECT p.id, p.name, p.type, pt.type_name as current_type, pt.enum_key
        FROM products p
        JOIN product_types pt ON p.type = pt.id
        WHERE p.category = clothes_cat_id
    LOOP
        old_type_name := product_rec.current_type;
        
        target_type_enum := CASE
            WHEN product_rec.name ILIKE '%╤Д╤Г╤В╨▒╨╛╨╗╨║%' OR product_rec.name ILIKE '%t-shirt%' OR 
                 product_rec.name ILIKE '%t shirt%' OR product_rec.name ILIKE '%tshirt%' OR
                 product_rec.name ILIKE '%╨╝╨░╨╣╨║%' OR product_rec.name ILIKE '%╨┐╨╛╨╗╨╛%' THEN 't-shirt'
            WHEN product_rec.name ILIKE '%╤Е╤Г╨┤╨╕%' OR product_rec.name ILIKE '%hoodie%' OR
                 product_rec.name ILIKE '%╤В╨╛╨╗╤Б╤В╨╛╨▓╨║%' OR product_rec.name ILIKE '%╤Б╨▓╨╕╤В╤И╨╛╤В%' THEN 'hoodie'
            WHEN product_rec.name ILIKE '%╤А╤Г╨▒╨░╤И╨║%' OR product_rec.name ILIKE '%shirt%' THEN 'shirt'
            WHEN product_rec.name ILIKE '%╤Б╨▓╨╕╤В╨╡╤А%' OR product_rec.name ILIKE '%sweater%' THEN 'sweater'
            WHEN product_rec.name ILIKE '%╨║╤Г╤А╤В╨║%' OR product_rec.name ILIKE '%jacket%' THEN 'jacket'
            WHEN product_rec.name ILIKE '%╨┐╤Г╤Е╨╛╨▓╨╕╨║%' OR product_rec.name ILIKE '%puffer%' THEN 'puffer'
            WHEN product_rec.name ILIKE '%╨┐╨░╤А╨║%' OR product_rec.name ILIKE '%parka%' THEN 'parka'
            WHEN product_rec.name ILIKE '%╨▓╨╡╤В╤А╨╛╨▓╨║%' OR product_rec.name ILIKE '%windbreaker%' THEN 'windbreaker'
            WHEN product_rec.name ILIKE '%╨▒╨╛╨╝╨▒╨╡╤А%' OR product_rec.name ILIKE '%bomber%' THEN 'bomber'
            WHEN product_rec.name ILIKE '%╤И╤В╨░╨╜╤Л%' OR product_rec.name ILIKE '%pants%' THEN 'pants'
            WHEN product_rec.name ILIKE '%╨▒╤А╤О╨║%' OR product_rec.name ILIKE '%trousers%' THEN 'trousers'
            WHEN product_rec.name ILIKE '%╨┤╨╢╨╕╨╜╤Б%' OR product_rec.name ILIKE '%jeans%' THEN 'jeans'
            WHEN product_rec.name ILIKE '%╤И╨╛╤А╤В%' OR product_rec.name ILIKE '%shorts%' THEN 'shorts'
            WHEN product_rec.name ILIKE '%╨╗╨╛╤Б╨╕╨╜%' OR product_rec.name ILIKE '%leggings%' THEN 'leggings'
            WHEN product_rec.name ILIKE '%╤И╨░╨┐╨║%' OR product_rec.name ILIKE '%hat%' THEN 'hat'
            WHEN product_rec.name ILIKE '%╨║╨╡╨┐╨║%' OR product_rec.name ILIKE '%cap%' THEN 'cap'
            WHEN product_rec.name ILIKE '%╨▒╨╡╨╣╤Б╨▒╨╛╨╗╨║%' OR product_rec.name ILIKE '%baseball%' THEN 'baseball'
            WHEN product_rec.name ILIKE '%╨┐╨╗╨░╤В╤М%' OR product_rec.name ILIKE '%dress%' THEN 'dress'
            WHEN product_rec.name ILIKE '%╤О╨▒╨║%' OR product_rec.name ILIKE '%skirt%' THEN 'skirt'
            WHEN product_rec.name ILIKE '%╤Б╨░╤А╨░╤Д╨░╨╜%' OR product_rec.name ILIKE '%sundress%' THEN 'sundress'
            WHEN product_rec.name ILIKE '%╤А╨╡╨╝╨╡╨╜╤М%' OR product_rec.name ILIKE '%belt%' THEN 'belt'
            WHEN product_rec.name ILIKE '%╨┐╨╡╤А╤З╨░╤В╨║%' OR product_rec.name ILIKE '%gloves%' THEN 'gloves'
            WHEN product_rec.name ILIKE '%╤И╨░╤А╤Д%' OR product_rec.name ILIKE '%scarf%' THEN 'scarf'
            WHEN product_rec.name ILIKE '%╨╜╨╛╤Б╨║%' OR product_rec.name ILIKE '%socks%' THEN 'socks'
            WHEN product_rec.name ILIKE '%╤Б╨┐╨╛╤А╤В╨╕╨▓╨╜%' OR product_rec.name ILIKE '%sport%' THEN 'sport'
            WHEN product_rec.name ILIKE '%╤В╤А╨╡╨╜╨╕╤А╨╛╨▓╨╛╤З╨╜%' OR product_rec.name ILIKE '%training%' THEN 'training'
            WHEN product_rec.name ILIKE '%╨▒╨╡╨│╨╛╨▓%' OR product_rec.name ILIKE '%running%' THEN 'running'
            WHEN product_rec.name ILIKE '%╨┤╨╛╨╝╨░╤И╨╜%' OR product_rec.name ILIKE '%loungewear%' THEN 'loungewear'
            WHEN product_rec.name ILIKE '%╨┐╨╕╨╢╨░╨╝%' OR product_rec.name ILIKE '%pajama%' THEN 'pajama'
            WHEN product_rec.name ILIKE '%╤Е╨░╨╗╨░╤В%' OR product_rec.name ILIKE '%robe%' THEN 'robe'
            WHEN product_rec.name ILIKE '%╨║╤Г╨┐╨░╨╗╤М╨╜╨╕╨║%' OR product_rec.name ILIKE '%swimwear%' THEN 'swimwear'
            WHEN product_rec.name ILIKE '%╨║╤А╨╛╤Б╤Б╨╛╨▓╨║%' OR product_rec.name ILIKE '%sneakers%' THEN 'sneakers'
            WHEN product_rec.name ILIKE '%╨▒╨╛╤В╨╕╨╜╨║%' OR product_rec.name ILIKE '%boots%' THEN 'boots'
            WHEN product_rec.name ILIKE '%╤В╤Г╤Д╨╗%' OR product_rec.name ILIKE '%shoes%' THEN 'shoes'
            ELSE 'other'
        END;
        
        SELECT id INTO target_type_id FROM product_types 
        WHERE category_id = clothes_cat_id AND enum_key = target_type_enum;
        
        IF target_type_id IS NOT NULL AND product_rec.type != target_type_id THEN
            UPDATE products SET type = target_type_id WHERE id = product_rec.id;
            updated_count := updated_count + 1;
            INSERT INTO update_results_clothes VALUES (product_rec.id, product_rec.name, old_type_name, target_type_enum);
        END IF;
    END LOOP;
    
    RAISE NOTICE '╨Ю╨▒╨╜╨╛╨▓╨╗╨╡╨╜╨╛ ╤В╨╛╨▓╨░╤А╨╛╨▓ ╨▓ clothes: %', updated_count;
    RETURN QUERY SELECT * FROM update_results_clothes;
    DROP TABLE update_results_clothes;
END;
$$;


--
-- Name: auto_update_merch_types(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_update_merch_types() RETURNS TABLE(product_id integer, product_name text, old_type text, new_type text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    merch_cat_id INTEGER;  -- ╨г╨▒╤А╨░╨╗╨╕ := 2
    product_rec RECORD;
    target_type_id INTEGER;
    target_type_enum TEXT;
    old_type_name TEXT;
    updated_count INTEGER := 0;
BEGIN
    -- ╨Ф╨╕╨╜╨░╨╝╨╕╤З╨╡╤Б╨║╨╕ ╨┐╨╛╨╗╤Г╤З╨░╨╡╨╝ ID ╨║╨░╤В╨╡╨│╨╛╤А╨╕╨╕ merch
    SELECT id INTO merch_cat_id FROM product_categories WHERE enum_key = 'merch';
    IF merch_cat_id IS NULL THEN 
        RAISE EXCEPTION 'Category "merch" not found';
    END IF;
    
    CREATE TEMP TABLE update_results_merch (product_id INTEGER, product_name TEXT, old_type TEXT, new_type TEXT);
    
    FOR product_rec IN 
        SELECT p.id, p.name, p.type, pt.type_name as current_type, pt.enum_key
        FROM products p
        JOIN product_types pt ON p.type = pt.id
        WHERE p.category = merch_cat_id
    LOOP
        old_type_name := product_rec.current_type;
        
        target_type_enum := CASE
            WHEN product_rec.name ILIKE '%╨║╨╡╨┐╨║%' OR product_rec.name ILIKE '%hat%' OR
                 product_rec.name ILIKE '%╤И╨░╨┐╨║%' OR product_rec.name ILIKE '%╨▒╨╡╨╣╤Б╨▒╨╛╨╗╨║%' THEN 'hat'
            WHEN product_rec.name ILIKE '%╨╕╨│╤А╤Г╤И╨║%' OR product_rec.name ILIKE '%toys%' THEN 'toys'
            WHEN product_rec.name ILIKE '%╤Б╤Г╨╝╨║%' OR product_rec.name ILIKE '%bag%' THEN 'bag'
            WHEN product_rec.name ILIKE '%╤А╨╡╨╝╨╡╨╜╤М%' OR product_rec.name ILIKE '%belt%' THEN 'belts'
            WHEN product_rec.name ILIKE '%╤Б╨╡╤А╤М╨│%' OR product_rec.name ILIKE '%earring%' THEN 'earrings'
            WHEN product_rec.name ILIKE '%╨┐╨╡╤А╤З╨░╤В╨║%' OR product_rec.name ILIKE '%gloves%' THEN 'gloves'
            WHEN product_rec.name ILIKE '%╤И╨░╤А╤Д%' OR product_rec.name ILIKE '%scarf%' THEN 'scarves'
            WHEN product_rec.name ILIKE '%╤В╤А╨╡╨╜╨╕╤А╨╛╨▓╨║%' OR product_rec.name ILIKE '%training%' THEN 'training'
            WHEN product_rec.name ILIKE '%╨▒╨╛╤В╨╕╨╜╨║%' OR product_rec.name ILIKE '%boots%' THEN 'boots'
            WHEN product_rec.name ILIKE '%╨╛╨╢╨╡╤А╨╡╨╗╤М%' OR product_rec.name ILIKE '%necklace%' THEN 'necklaces'
            WHEN product_rec.name ILIKE '%╤З╨░╤Б%' OR product_rec.name ILIKE '%watch%' THEN 'watches'
            WHEN product_rec.name ILIKE '%╨║╨╛╨╗╤М╤Ж%' OR product_rec.name ILIKE '%ring%' THEN 'rings'
            WHEN product_rec.name ILIKE '%╨▒╤А╨░╤Б╨╗╨╡╤В%' OR product_rec.name ILIKE '%bracelet%' THEN 'bracelets'
            WHEN product_rec.name ILIKE '%╨▒╤А╨╡╨╗╨╛╨║%' OR product_rec.name ILIKE '%keychain%' THEN 'keychains'
            WHEN product_rec.name ILIKE '%╨╛╤З╨║%' OR product_rec.name ILIKE '%glass%' THEN 'eyewear'
            WHEN product_rec.name ILIKE '%╨┐╨╗╨╡╤З%' OR product_rec.name ILIKE '%shoulder%' THEN 'shoulder'
            WHEN product_rec.name ILIKE '%╨┐╤Г╤В╨╡╤И╨╡╤Б╤В╨▓%' OR product_rec.name ILIKE '%travel%' THEN 'travel'
            WHEN product_rec.name ILIKE '%╨╛╤В╨║╤А╤Л╤В%╨▓╨╛╨╖╨┤╤Г╤Е%' OR product_rec.name ILIKE '%outdoors%' THEN 'outdoors'
            WHEN product_rec.name ILIKE '%╨┐╨╗╨╛╤Б╨║%╨┐╨╛╨┤╨╛╤И╨▓%' OR product_rec.name ILIKE '%flats%' THEN 'flats'
            WHEN product_rec.name ILIKE '%╤Б╨░╨╜╨┤╨░╨╗%' OR product_rec.name ILIKE '%sandals%' THEN 'sandals'
            WHEN product_rec.name ILIKE '%crossbody%' THEN 'crossbody'
            WHEN product_rec.name ILIKE '%╨▒╨░╤Б╨║╨╡╤В╨▒╨╛╨╗%' OR product_rec.name ILIKE '%basketball%' THEN 'basketball'
            WHEN product_rec.name ILIKE '%╨▒╨╡╨│%' OR product_rec.name ILIKE '%running%' THEN 'running'
            WHEN product_rec.name ILIKE '%╤А╤О╨║╨╖╨░╨║%' OR product_rec.name ILIKE '%backpack%' THEN 'backpack'
            WHEN product_rec.name ILIKE '%╨║╨╛╤И╨╡╨╗╨╡╨║%' OR product_rec.name ILIKE '%wallet%' THEN 'wallets'
            ELSE 'other'
        END;
        
        SELECT id INTO target_type_id FROM product_types 
        WHERE category_id = merch_cat_id AND enum_key = target_type_enum;
        
        IF target_type_id IS NOT NULL AND product_rec.type != target_type_id THEN
            UPDATE products SET type = target_type_id WHERE id = product_rec.id;
            updated_count := updated_count + 1;
            INSERT INTO update_results_merch VALUES (product_rec.id, product_rec.name, old_type_name, target_type_enum);
        END IF;
    END LOOP;
    
    RAISE NOTICE '╨Ю╨▒╨╜╨╛╨▓╨╗╨╡╨╜╨╛ ╤В╨╛╨▓╨░╤А╨╛╨▓ ╨▓ merch: %', updated_count;
    RETURN QUERY SELECT * FROM update_results_merch;
    DROP TABLE update_results_merch;
END;
$$;


--
-- Name: auto_update_toys_types(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_update_toys_types() RETURNS TABLE(product_id integer, product_name text, old_type text, new_type text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    toys_cat_id INTEGER;  -- ╨г╨▒╤А╨░╨╗╨╕ := 4
    product_rec RECORD;
    target_type_id INTEGER;
    target_type_enum TEXT;
    old_type_name TEXT;
    updated_count INTEGER := 0;
BEGIN
    -- ╨Ф╨╕╨╜╨░╨╝╨╕╤З╨╡╤Б╨║╨╕ ╨┐╨╛╨╗╤Г╤З╨░╨╡╨╝ ID ╨║╨░╤В╨╡╨│╨╛╤А╨╕╨╕ toys
    SELECT id INTO toys_cat_id FROM product_categories WHERE enum_key = 'toys';
    IF toys_cat_id IS NULL THEN 
        RAISE EXCEPTION 'Category "toys" not found';
    END IF;
    
    CREATE TEMP TABLE update_results_toys (product_id INTEGER, product_name TEXT, old_type TEXT, new_type TEXT);
    
    FOR product_rec IN 
        SELECT p.id, p.name, p.type, pt.type_name as current_type, pt.enum_key
        FROM products p
        JOIN product_types pt ON p.type = pt.id
        WHERE p.category = toys_cat_id
    LOOP
        old_type_name := product_rec.current_type;
        
        target_type_enum := CASE
            WHEN product_rec.name ILIKE '%╤Д╨╕╨│╤Г╤А╨║%' OR product_rec.name ILIKE '%figure%' THEN 'figures'
            WHEN product_rec.name ILIKE '%╨║╨░╤А╤В%' OR product_rec.name ILIKE '%cards%' THEN 'cards'
            WHEN product_rec.name ILIKE '%╨║╤Г╨║╨╗%' OR product_rec.name ILIKE '%doll%' THEN 'dolls'
            WHEN product_rec.name ILIKE '%╨╝╤П╨│╨║%' OR product_rec.name ILIKE '%plush%' THEN 'plush'
            WHEN product_rec.name ILIKE '%╨╜╨░╤Б╤В╨╛╨╗╤М╨╜%' OR product_rec.name ILIKE '%board%' THEN 'boardgames'
            WHEN product_rec.name ILIKE '%╨║╨╛╨╜╤Б╤В╤А╤Г╨║╤В╨╛╤А%' OR product_rec.name ILIKE '%building%' THEN 'building'
            WHEN product_rec.name ILIKE '%╨╝╨░╤И╨╕╨╜╨║%' OR product_rec.name ILIKE '%cars%' THEN 'cars'
            WHEN product_rec.name ILIKE '%╤А╨╛╨▒╨╛╤В%' OR product_rec.name ILIKE '%robot%' THEN 'robots'
            WHEN product_rec.name ILIKE '%╨┐╨░╨╖╨╗%' OR product_rec.name ILIKE '%puzzle%' THEN 'puzzles'
            WHEN product_rec.name ILIKE '%╤В╤А╨░╨╜╤Б╤Д╨╛╤А╨╝╨╡╤А%' OR product_rec.name ILIKE '%transform%' THEN 'transformers'
            WHEN product_rec.name ILIKE '%╨╗╨╡╨│╨╛%' OR product_rec.name ILIKE '%lego%' THEN 'lego'
            WHEN product_rec.name ILIKE '%╨┐╨╛╨┐ ╨╕╤В%' OR product_rec.name ILIKE '%popit%' THEN 'popit'
            WHEN product_rec.name ILIKE '%╤Б╨╗╨░╨╣╨╝%' OR product_rec.name ILIKE '%slime%' THEN 'slime'
            WHEN product_rec.name ILIKE '%╨┐╨╡╤Б╨╛╨║%' OR product_rec.name ILIKE '%sand%' THEN 'sand'
            WHEN product_rec.name ILIKE '%╤А╨░╤Б╨║╤А╨░╤Б╨║%' OR product_rec.name ILIKE '%coloring%' THEN 'coloring'
            WHEN product_rec.name ILIKE '%╨║╨╜╨╕╨│%' OR product_rec.name ILIKE '%book%' THEN 'books'
            WHEN product_rec.name ILIKE '%╤А╨░╨╖╨▓╨╕╨▓╨░%' OR product_rec.name ILIKE '%educational%' THEN 'educational'
            WHEN product_rec.name ILIKE '%╤В╨▓╨╛╤А╤З╨╡╤Б╤В╨▓%' OR product_rec.name ILIKE '%creativity%' THEN 'creativity'
            WHEN product_rec.name ILIKE '%╤Б╨┐╨╛╤А╤В╨╕╨▓╨╜%' OR product_rec.name ILIKE '%sports%' THEN 'sports'
            WHEN product_rec.name ILIKE '%╤А╨░╨┤╨╕╨╛╤Г╨┐╤А╨░╨▓╨╗%' OR product_rec.name ILIKE '%rc%' THEN 'rc'
            WHEN product_rec.name ILIKE '%╤Н╨╗╨╡╨║╤В╤А╨╛╨╜╨╜%' OR product_rec.name ILIKE '%electronic%' THEN 'electronic'
            WHEN product_rec.name ILIKE '%╨║╨╛╨▓╤А╨╕╨║%' OR product_rec.name ILIKE '%mats%' THEN 'mats'
            WHEN product_rec.name ILIKE '%╨┐╨░╨╗╨░╤В╨║%' OR product_rec.name ILIKE '%tent%' THEN 'tents'
            WHEN product_rec.name ILIKE '%╨╛╤А╤Г╨╢╨╕%' OR product_rec.name ILIKE '%weapon%' THEN 'weapons'
            WHEN product_rec.name ILIKE '%╨╛╨┐╤Л╤В%' OR product_rec.name ILIKE '%experiment%' THEN 'experiments'
            WHEN product_rec.name ILIKE '%╨╝╨╛╨╖╨░╨╕╨║%' OR product_rec.name ILIKE '%mosaic%' THEN 'mosaic'
            WHEN product_rec.name ILIKE '%╤Б╨▒╨╛╤А╨╜%╨╝╨╛╨┤╨╡╨╗%' OR product_rec.name ILIKE '%model%' THEN 'models'
            WHEN product_rec.name ILIKE '%╨╢╨╡╨╗╨╡╨╖╨╜%╨┤╨╛╤А╨╛╨│%' OR product_rec.name ILIKE '%railway%' THEN 'railway'
            WHEN product_rec.name ILIKE '%╨▒╨░╤В╤Г╤В%' OR product_rec.name ILIKE '%trampoline%' THEN 'trampolines'
            ELSE 'other'
        END;
        
        SELECT id INTO target_type_id FROM product_types 
        WHERE category_id = toys_cat_id AND enum_key = target_type_enum;
        
        IF target_type_id IS NOT NULL AND product_rec.type != target_type_id THEN
            UPDATE products SET type = target_type_id WHERE id = product_rec.id;
            updated_count := updated_count + 1;
            INSERT INTO update_results_toys VALUES (product_rec.id, product_rec.name, old_type_name, target_type_enum);
        END IF;
    END LOOP;
    
    RAISE NOTICE '╨Ю╨▒╨╜╨╛╨▓╨╗╨╡╨╜╨╛ ╤В╨╛╨▓╨░╤А╨╛╨▓ ╨▓ toys: %', updated_count;
    RETURN QUERY SELECT * FROM update_results_toys;
    DROP TABLE update_results_toys;
END;
$$;


--
-- Name: fill_product_sizes_from_products(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fill_product_sizes_from_products() RETURNS void
    LANGUAGE plpgsql
    AS $$

BEGIN

    -- ╨Ю╤З╨╕╤Й╨░╨╡╨╝ ╤В╨░╨▒╨╗╨╕╤Ж╤Г

    TRUNCATE public.product_sizes;

    

    -- ╨Ч╨░╨┐╨╛╨╗╨╜╤П╨╡╨╝ ╨╕╨╖ products.sizes

    INSERT INTO public.product_sizes (product_id, size_key, price, quantity)

    SELECT

        p.id,

        key,

        (value->>'price')::NUMERIC,

        COALESCE((value->>'quantity')::INTEGER, 0)

    FROM public.products p,

    LATERAL jsonb_each(p.sizes)

    WHERE (value->>'price')::NUMERIC > 0;

    

    RAISE NOTICE 'product_sizes ╨╖╨░╨┐╨╛╨╗╨╜╨╡╨╜╨░. ╨Т╤Б╨╡╨│╨╛ ╨╖╨░╨┐╨╕╤Б╨╡╨╣: %', (SELECT COUNT(*) FROM public.product_sizes);

END;

$$;


--
-- Name: sync_product_sizes_from_products(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_product_sizes_from_products() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    -- ╨г╨┤╨░╨╗╤П╨╡╨╝ ╤Б╤В╨░╤А╤Л╨╡ ╨╖╨░╨┐╨╕╤Б╨╕ ╨┤╨╗╤П ╤Н╤В╨╛╨│╨╛ ╤В╨╛╨▓╨░╤А╨░

    DELETE FROM public.product_sizes WHERE product_id = NEW.id;



    -- ╨Т╤Б╤В╨░╨▓╨╗╤П╨╡╨╝ ╨╜╨╛╨▓╤Л╨╡ ╤А╨░╨╖╨╝╨╡╤А╤Л ╨╕╨╖ JSONB (╨▒╨╡╨╖ in_stock)

    INSERT INTO public.product_sizes (product_id, size_key, price, quantity)

    SELECT

        NEW.id,

        key,

        (value->>'price')::NUMERIC,

        COALESCE((value->>'quantity')::INTEGER, 0)

    FROM jsonb_each(NEW.sizes)

    WHERE (value->>'price')::NUMERIC > 0;



    RETURN NEW;

END;

$$;


--
-- Name: sync_store_house_from_products(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_store_house_from_products() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    -- ╨г╨┤╨░╨╗╤П╨╡╨╝ ╨▓╤Б╨╡ ╤Б╤В╨░╤А╤Л╨╡ ╨╖╨░╨┐╨╕╤Б╨╕ ╨┤╨╗╤П ╤Н╤В╨╛╨│╨╛ ╤В╨╛╨▓╨░╤А╨░

    DELETE FROM public.store_house WHERE productid = NEW.id;

    

    -- ╨Т╤Б╤В╨░╨▓╨╗╤П╨╡╨╝ ╤В╨╛╨╗╤М╨║╨╛ ╤А╨░╨╖╨╝╨╡╤А╤Л ╤Б quantity > 0

    INSERT INTO public.store_house (productid, size, quantity)

    SELECT

        NEW.id,

        key,

        COALESCE((value->>'quantity')::INTEGER, 0)

    FROM jsonb_each(NEW.sizes)

    WHERE COALESCE((value->>'quantity')::INTEGER, 0) > 0;

    

    RETURN NEW;

END;

$$;


--
-- Name: sync_store_house_to_product_sizes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_store_house_to_product_sizes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    -- ╨Ю╨▒╨╜╨╛╨▓╨╗╤П╨╡╨╝ quantity ╨▓ product_sizes

    UPDATE public.product_sizes

    SET quantity = NEW.quantity

    WHERE product_id = NEW.productid 

      AND size_key = NEW.size;

    

    -- ╨Х╤Б╨╗╨╕ ╨╖╨░╨┐╨╕╤Б╨╕ ╨╜╨╡╤В - ╤Б╨╛╨╖╨┤╨░╨╡╨╝ (╤Б ╤Ж╨╡╨╜╨╛╨╣ ╨╕╨╖ products.sizes)

    IF NOT FOUND THEN

        INSERT INTO public.product_sizes (product_id, size_key, price, quantity)

        SELECT 

            NEW.productid,

            NEW.size,

            COALESCE(

                (SELECT (value->>'price')::NUMERIC 

                 FROM public.products p,

                 LATERAL jsonb_each(p.sizes) 

                 WHERE p.id = NEW.productid AND key = NEW.size),

                0

            ),

            NEW.quantity

        WHERE EXISTS (

            SELECT 1 FROM public.products 

            WHERE id = NEW.productid 

            AND sizes ? NEW.size

        );

    END IF;

    

    RETURN NEW;

END;

$$;


--
-- Name: update_brands_lines_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_brands_lines_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO brands_stats (brand_id, lines_count, updated_at)
    VALUES (COALESCE(NEW.brand_id, OLD.brand_id), 
            (SELECT COUNT(*) FROM brand_lines WHERE brand_id = COALESCE(NEW.brand_id, OLD.brand_id)),
            NOW())
    ON CONFLICT (brand_id) 
    DO UPDATE SET
        lines_count = EXCLUDED.lines_count,
        updated_at = EXCLUDED.updated_at;
    RETURN NULL;
END;
$$;


--
-- Name: update_brands_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_brands_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- ╨Я╨╡╤А╨╡╤Б╤З╨╡╤В ╤Б╤В╨░╤В╨╕╤Б╤В╨╕╨║╨╕ ╨┤╨╗╤П ╨╖╨░╤В╤А╨╛╨╜╤Г╤В╨╛╨│╨╛ ╨▒╤А╨╡╨╜╨┤╨░
    WITH stats AS (
        SELECT 
            COALESCE(p.brand_id, NEW.brand_id, OLD.brand_id) as brand_id,
            COUNT(p.id) as total_products,
            COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_products,
            COUNT(CASE WHEN p.status != 'active' THEN 1 END) as inactive_products,
            COUNT(CASE WHEN pc.enum_key = 'sneakers' THEN 1 END) as sneakers_count,
            COUNT(CASE WHEN pc.enum_key = 'merch' THEN 1 END) as merch_count,
            COUNT(CASE WHEN pc.enum_key = 'clothes' THEN 1 END) as clothes_count,
            COUNT(CASE WHEN pc.enum_key = 'toys' THEN 1 END) as toys_count
        FROM products p
        LEFT JOIN product_categories pc ON p.category = pc.id
        WHERE p.brand_id = COALESCE(NEW.brand_id, OLD.brand_id)
        GROUP BY p.brand_id
    )
    INSERT INTO brands_stats (brand_id, total_products, active_products, inactive_products, 
                              sneakers_count, merch_count, clothes_count, toys_count, updated_at)
    SELECT 
        brand_id, total_products, active_products, inactive_products,
        sneakers_count, merch_count, clothes_count, toys_count, NOW()
    FROM stats
    ON CONFLICT (brand_id) 
    DO UPDATE SET
        total_products = EXCLUDED.total_products,
        active_products = EXCLUDED.active_products,
        inactive_products = EXCLUDED.inactive_products,
        sneakers_count = EXCLUDED.sneakers_count,
        merch_count = EXCLUDED.merch_count,
        clothes_count = EXCLUDED.clothes_count,
        toys_count = EXCLUDED.toys_count,
        updated_at = EXCLUDED.updated_at;
    
    RETURN NULL;
END;
$$;


--
-- Name: update_discount_on_size_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_discount_on_size_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

DECLARE

    v_product_id INTEGER;

    v_min_price INTEGER;

    v_max_price INTEGER;

    v_value JSONB;

    v_discount_percent INTEGER;

    v_original_price INTEGER;

    v_discounted_price INTEGER;

BEGIN

    -- ╨Ю╨┐╤А╨╡╨┤╨╡╨╗╤П╨╡╨╝ ID ╤В╨╛╨▓╨░╤А╨░

    IF TG_OP = 'DELETE' THEN

        v_product_id = OLD.product_id;

    ELSE

        v_product_id = NEW.product_id;

    END IF;



    -- ╨Я╨╛╨╗╤Г╤З╨░╨╡╨╝ ╨░╨║╤В╤Г╨░╨╗╤М╨╜╤Л╨╡ ╨┤╨░╨╜╨╜╤Л╨╡ ╨┐╨╛ ╤А╨░╨╖╨╝╨╡╤А╨░╨╝ (╤Г╨▒╨╕╤А╨░╨╡╨╝ in_stock)

    SELECT 

        COALESCE(MIN(price)::INTEGER, 0),

        COALESCE(MAX(price)::INTEGER, 0),

        COALESCE(jsonb_object_agg(size_key, price), '{}'::jsonb)

    INTO 

        v_min_price,

        v_max_price,

        v_value

    FROM product_sizes

    WHERE product_id = v_product_id

      AND quantity > 0;  -- ╨в╨╛╨╗╤М╨║╨╛ ╤В╨╡, ╤З╤В╨╛ ╨╡╤Б╤В╤М ╨▓ ╨╜╨░╨╗╨╕╤З╨╕╨╕



    -- ╨Я╨╛╨╗╤Г╤З╨░╨╡╨╝ ╤В╨╡╨║╤Г╤Й╨╕╨╣ ╨┐╤А╨╛╤Ж╨╡╨╜╤В ╤Б╨║╨╕╨┤╨║╨╕

    SELECT COALESCE(discount_percent, 0)

    INTO v_discount_percent

    FROM discount

    WHERE productid = v_product_id;



    -- ╨Х╤Б╨╗╨╕ ╤Б╨║╨╕╨┤╨║╨╕ ╨╜╨╡╤В, ╤Б╨╛╨╖╨┤╨░╨╡╨╝ ╨╖╨░╨┐╨╕╤Б╤М

    IF NOT FOUND THEN

        INSERT INTO discount (

            productid,

            value,

            discount_percent,

            original_price,

            discounted_price,

            min_price,

            max_price,

            created_at,

            updated_at

        ) VALUES (

            v_product_id,

            v_value,

            0,

            v_min_price,

            v_min_price,

            v_min_price,

            v_max_price,

            NOW(),

            NOW()

        );

    ELSE

        -- ╨Ю╨▒╨╜╨╛╨▓╨╗╤П╨╡╨╝ ╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╤Г╤О ╨╖╨░╨┐╨╕╤Б╤М

        v_discounted_price = v_min_price - (v_min_price * v_discount_percent / 100);

        

        UPDATE discount

        SET 

            value = v_value,

            original_price = v_min_price,

            discounted_price = v_discounted_price,

            min_price = v_min_price,

            max_price = v_max_price,

            updated_at = NOW()

        WHERE productid = v_product_id;

    END IF;



    -- ╨Ю╨▒╨╜╨╛╨▓╨╗╤П╨╡╨╝ ╤В╨╛╨▓╨░╤А

    UPDATE products

    SET 

        minprice = v_min_price,

        maxprice = v_max_price,

        updated_at = NOW()

    WHERE id = v_product_id;



    RETURN NULL;

END;

$$;


--
-- Name: update_product_stock(integer, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_product_stock(p_product_id integer, p_size_key text, p_quantity integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$

DECLARE

    current_qty INTEGER;

BEGIN

    -- ╨Я╨╛╨╗╤Г╤З╨░╨╡╨╝ ╤В╨╡╨║╤Г╤Й╨╡╨╡ ╨║╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╤Б ╨▒╨╗╨╛╨║╨╕╤А╨╛╨▓╨║╨╛╨╣ ╤Б╤В╤А╨╛╨║╨╕

    SELECT COALESCE((sizes->p_size_key->>'quantity')::integer, 0)

    INTO current_qty

    FROM products

    WHERE id = p_product_id

    FOR UPDATE;

    

    -- ╨Я╤А╨╛╨▓╨╡╤А╤П╨╡╨╝ ╨╜╨░╨╗╨╕╤З╨╕╨╡ ╨┤╨╛╤Б╤В╨░╤В╨╛╤З╨╜╨╛╨│╨╛ ╨║╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨░

    IF current_qty < p_quantity THEN

        RETURN FALSE;

    END IF;

    

    -- ╨Ю╨▒╨╜╨╛╨▓╨╗╤П╨╡╨╝ ╨╛╤Б╤В╨░╤В╨╛╨║

    UPDATE products

    SET sizes = jsonb_set(

        sizes,

        ARRAY[p_size_key, 'quantity'],

        to_jsonb(GREATEST(current_qty - p_quantity, 0))

    ),

    updated_at = NOW()

    WHERE id = p_product_id;

    

    RETURN TRUE;

END;

$$;


--
-- Name: update_products_status_on_brand_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_products_status_on_brand_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.is_active = false AND OLD.is_active = true THEN
        UPDATE products 
        SET status = 'draft', updated_at = NOW()
        WHERE brand_id = NEW.id AND status = 'active';
    END IF;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_invites (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    role public.admin_role_enum DEFAULT 'admin'::public.admin_role_enum NOT NULL,
    token character varying(64) NOT NULL,
    invited_by integer,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    used_by integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: admin_invites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_invites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_invites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_invites_id_seq OWNED BY public.admin_invites.id;


--
-- Name: admin_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_logs (
    id integer NOT NULL,
    admin_id integer NOT NULL,
    action character varying(50) NOT NULL,
    entity_type character varying(50),
    entity_id integer,
    details text,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: admin_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_logs_id_seq OWNED BY public.admin_logs.id;


--
-- Name: admin_password_resets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_password_resets (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    token character varying(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: admin_password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_password_resets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_password_resets_id_seq OWNED BY public.admin_password_resets.id;


--
-- Name: admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash bytea NOT NULL,
    name character varying(100) NOT NULL,
    role public.admin_role_enum DEFAULT 'admin'::public.admin_role_enum NOT NULL,
    is_active boolean DEFAULT true,
    last_login_at timestamp with time zone,
    last_login_ip inet,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banners (
    id integer NOT NULL,
    title character varying(255),
    image_url character varying(500) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    collection_id integer NOT NULL
);


--
-- Name: banners_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.banners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: banners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.banners_id_seq OWNED BY public.banners.id;


--
-- Name: brand_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brand_lines (
    id integer NOT NULL,
    brand_id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    season character varying(50),
    year integer,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    image_path text
);


--
-- Name: brand_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.brand_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: brand_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.brand_lines_id_seq OWNED BY public.brand_lines.id;


--
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    image_path text,
    description text,
    website character varying(500),
    country character varying(100),
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    founded_year integer
);


--
-- Name: brands_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: brands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.brands_id_seq OWNED BY public.brands.id;


--
-- Name: brands_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands_stats (
    brand_id integer NOT NULL,
    total_products integer DEFAULT 0,
    active_products integer DEFAULT 0,
    inactive_products integer DEFAULT 0,
    sneakers_count integer DEFAULT 0,
    merch_count integer DEFAULT 0,
    clothes_count integer DEFAULT 0,
    toys_count integer DEFAULT 0,
    lines_count integer DEFAULT 0,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: collection_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.collection_products (
    collection_id integer NOT NULL,
    product_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.collections (
    id integer NOT NULL,
    slug character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type character varying(50) DEFAULT 'dynamic'::character varying NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: collections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.collections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: collections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.collections_id_seq OWNED BY public.collections.id;


--
-- Name: colors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.colors (
    id integer NOT NULL,
    enum_key character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    hex_code character varying(9) NOT NULL
);


--
-- Name: colors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.colors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: colors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.colors_id_seq OWNED BY public.colors.id;


--
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_addresses (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    town text NOT NULL,
    street text,
    house text,
    flat text,
    postal_code text,
    region text,
    coordinates double precision[],
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: customer_addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_addresses_id_seq OWNED BY public.customer_addresses.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name text,
    secondname text,
    mail text NOT NULL,
    pass bytea NOT NULL,
    phone text,
    town text,
    index text,
    sendmail boolean DEFAULT false,
    street text,
    region text,
    home text,
    flat text,
    coordinates integer[],
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: discount; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount (
    id integer NOT NULL,
    productid integer NOT NULL,
    value jsonb NOT NULL,
    min_price integer DEFAULT 0 NOT NULL,
    discounted_price integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    rule_id integer,
    discount_percent integer DEFAULT 0,
    original_price integer DEFAULT 0 NOT NULL,
    max_price integer DEFAULT 0 NOT NULL
);


--
-- Name: discount_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.discount_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: discount_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.discount_id_seq OWNED BY public.discount.id;


--
-- Name: discount_rule_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount_rule_items (
    id integer NOT NULL,
    rule_id integer NOT NULL,
    item_type character varying(20) NOT NULL,
    item_id integer NOT NULL,
    CONSTRAINT discount_rule_items_item_type_check CHECK (((item_type)::text = ANY ((ARRAY['brand'::character varying, 'line'::character varying, 'product'::character varying])::text[])))
);


--
-- Name: discount_rule_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.discount_rule_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: discount_rule_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.discount_rule_items_id_seq OWNED BY public.discount_rule_items.id;


--
-- Name: discount_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount_rules (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    discount_type character varying(20) NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    starts_at timestamp with time zone DEFAULT now() NOT NULL,
    ends_at timestamp with time zone,
    is_active boolean DEFAULT true,
    priority integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT discount_rules_discount_type_check CHECK (((discount_type)::text = ANY ((ARRAY['percentage'::character varying, 'fixed_amount'::character varying])::text[])))
);


--
-- Name: discount_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.discount_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: discount_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.discount_rules_id_seq OWNED BY public.discount_rules.id;


--
-- Name: instagram_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instagram_posts (
    id integer NOT NULL,
    image_url character varying(500) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: instagram_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.instagram_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: instagram_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.instagram_posts_id_seq OWNED BY public.instagram_posts.id;


--
-- Name: news_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_blocks (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    cover_image_url character varying(500),
    cover_alt_text character varying(255),
    is_active boolean DEFAULT true,
    published_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    views_count integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    sort_order integer DEFAULT 0
);


--
-- Name: TABLE news_blocks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.news_blocks IS '╨Ю╤Б╨╜╨╛╨▓╨╜╤Л╨╡ ╨▒╨╗╨╛╨║╨╕ ╨╜╨╛╨▓╨╛╤Б╤В╨╡╨╣';


--
-- Name: COLUMN news_blocks.cover_image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news_blocks.cover_image_url IS '╨Ч╨░╨│╨╗╨░╨▓╨╜╨╛╨╡ ╨╕╨╖╨╛╨▒╤А╨░╨╢╨╡╨╜╨╕╨╡/╨╛╨▒╨╗╨╛╨╢╨║╨░ ╨▒╨╗╨╛╨║╨░';


--
-- Name: COLUMN news_blocks.views_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news_blocks.views_count IS '╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨┐╤А╨╛╤Б╨╝╨╛╤В╤А╨╛╨▓';


--
-- Name: COLUMN news_blocks.likes_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news_blocks.likes_count IS '╨Ъ╨╛╨╗╨╕╤З╨╡╤Б╤В╨▓╨╛ ╨╗╨░╨╣╨║╨╛╨▓';


--
-- Name: news_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.news_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: news_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.news_blocks_id_seq OWNED BY public.news_blocks.id;


--
-- Name: news_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_items (
    id integer NOT NULL,
    news_block_id integer NOT NULL,
    item_type public.news_item_type_enum NOT NULL,
    content text,
    image_url character varying(500),
    link_url character varying(500),
    layout character varying(20) DEFAULT 'horizontal'::character varying,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT news_items_layout_check CHECK (((layout)::text = ANY ((ARRAY['horizontal'::character varying, 'vertical'::character varying])::text[])))
);


--
-- Name: TABLE news_items; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.news_items IS '╨н╨╗╨╡╨╝╨╡╨╜╤В╤Л ╨║╨╛╨╜╤В╨╡╨╜╤В╨░ ╨▓╨╜╤Г╤В╤А╨╕ ╨▒╨╗╨╛╨║╨░ ╨╜╨╛╨▓╨╛╤Б╤В╨╡╨╣';


--
-- Name: news_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.news_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: news_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.news_items_id_seq OWNED BY public.news_items.id;


--
-- Name: newsletter_subscribers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_subscribers (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    verification_token character varying(64) NOT NULL,
    token_expires_at timestamp without time zone NOT NULL,
    verified_at timestamp without time zone,
    subscribed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address character varying(45),
    user_agent text,
    CONSTRAINT newsletter_subscribers_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'unsubscribed'::character varying])::text[])))
);


--
-- Name: newsletter_subscribers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.newsletter_subscribers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: newsletter_subscribers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.newsletter_subscribers_id_seq OWNED BY public.newsletter_subscribers.id;


--
-- Name: order_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_events (
    id bigint NOT NULL,
    order_id integer NOT NULL,
    event_type character varying(50) NOT NULL,
    old_status character varying(50),
    new_status character varying(50),
    reason text,
    reason_code character varying(50),
    changed_by_admin integer,
    changed_by_type character varying(20) DEFAULT 'admin'::character varying NOT NULL,
    ip_address inet,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_events_id_seq OWNED BY public.order_events.id;


--
-- Name: orderaddress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orderaddress (
    id integer NOT NULL,
    orderid integer NOT NULL,
    town text NOT NULL,
    index text NOT NULL,
    sendmail boolean,
    street text,
    region text,
    deliverycomment text,
    house text,
    flat text,
    coordinates double precision[] NOT NULL
);


--
-- Name: orderaddress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orderaddress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orderaddress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orderaddress_id_seq OWNED BY public.orderaddress.id;


--
-- Name: orderitems; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orderitems (
    id integer NOT NULL,
    orderid integer NOT NULL,
    productid integer NOT NULL,
    quantity integer NOT NULL,
    price integer NOT NULL,
    image_path text NOT NULL,
    name text NOT NULL,
    size text,
    CONSTRAINT orderitems_quantity_check CHECK ((quantity > 0))
);


--
-- Name: orderitems_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orderitems_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orderitems_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orderitems_id_seq OWNED BY public.orderitems.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    customerid integer,
    unregistercustomerid integer,
    orderdate date DEFAULT CURRENT_DATE NOT NULL,
    status public.status_enum DEFAULT 'pending'::public.status_enum NOT NULL,
    hash text NOT NULL,
    deliveryprice integer DEFAULT 0 NOT NULL,
    deliverycomment text,
    deliverytype public.delivery_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: page_widgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_widgets (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(100) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true,
    collection_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: page_widgets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.page_widgets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: page_widgets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.page_widgets_id_seq OWNED BY public.page_widgets.id;


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_resets (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    token character varying(64) NOT NULL,
    user_type character varying(20) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT password_resets_user_type_check CHECK (((user_type)::text = ANY ((ARRAY['customer'::character varying, 'admin'::character varying])::text[])))
);


--
-- Name: password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_resets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_resets_id_seq OWNED BY public.password_resets.id;


--
-- Name: preorder; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preorder (
    id integer NOT NULL,
    hashurl text NOT NULL,
    updatetime date
);


--
-- Name: preorder_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.preorder_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: preorder_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.preorder_id_seq OWNED BY public.preorder.id;


--
-- Name: preorderaddress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preorderaddress (
    id integer NOT NULL,
    town text NOT NULL,
    index text NOT NULL,
    sendmail boolean,
    street text,
    region text,
    house text,
    orderid integer NOT NULL,
    flat text,
    coordinates text[] NOT NULL
);


--
-- Name: preorderaddress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.preorderaddress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: preorderaddress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.preorderaddress_id_seq OWNED BY public.preorderaddress.id;


--
-- Name: preorderitems; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preorderitems (
    id integer NOT NULL,
    orderid integer NOT NULL,
    productid integer NOT NULL,
    quantity integer NOT NULL,
    price integer NOT NULL,
    image_path text NOT NULL,
    name text NOT NULL,
    size text
);


--
-- Name: preorderitems_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.preorderitems_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: preorderitems_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.preorderitems_id_seq OWNED BY public.preorderitems.id;


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_categories (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    enum_key character varying(50) NOT NULL,
    image_path text
);


--
-- Name: product_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_categories_id_seq OWNED BY public.product_categories.id;


--
-- Name: product_colors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_colors (
    product_id integer NOT NULL,
    color_id integer NOT NULL
);


--
-- Name: product_sizes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_sizes (
    product_id integer NOT NULL,
    size_key text NOT NULL,
    price numeric NOT NULL,
    quantity integer DEFAULT 0
);


--
-- Name: product_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_types (
    id integer NOT NULL,
    category_id integer NOT NULL,
    type_name character varying(50) NOT NULL,
    enum_key character varying(50) NOT NULL
);


--
-- Name: product_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_types_id_seq OWNED BY public.product_types.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id integer NOT NULL,
    qid text NOT NULL,
    name text NOT NULL,
    image_path text NOT NULL,
    minprice integer NOT NULL,
    maxprice integer NOT NULL,
    type integer NOT NULL,
    category integer NOT NULL,
    article text NOT NULL,
    date text,
    description text,
    bodytype public.body_enum DEFAULT 'man'::public.body_enum NOT NULL,
    image_count integer DEFAULT 1 NOT NULL,
    sizes jsonb,
    brand_id integer NOT NULL,
    line_id integer,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    deleted_at timestamp with time zone,
    archived_at timestamp with time zone,
    updated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT products_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'archived'::character varying, 'deleted'::character varying, 'draft'::character varying])::text[])))
);


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: promo_code_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_code_usage (
    id integer NOT NULL,
    promo_code_id integer NOT NULL,
    order_id integer NOT NULL,
    customer_id integer,
    discount_amount integer NOT NULL,
    used_at timestamp with time zone DEFAULT now(),
    promo_code_snapshot jsonb NOT NULL
);


--
-- Name: promo_code_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.promo_code_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: promo_code_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.promo_code_usage_id_seq OWNED BY public.promo_code_usage.id;


--
-- Name: promo_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_codes (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(255),
    description text,
    discount_type character varying(20) NOT NULL,
    discount_value integer NOT NULL,
    applies_to character varying(20) DEFAULT 'global'::character varying NOT NULL,
    collection_id integer,
    min_order integer DEFAULT 0,
    max_order integer DEFAULT 0,
    max_discount integer DEFAULT 0,
    starts_at timestamp with time zone DEFAULT now() NOT NULL,
    ends_at timestamp with time zone,
    usage_limit integer DEFAULT 0,
    per_user_limit integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    issued_to_customer_id integer,
    CONSTRAINT promo_codes_applies_to_check CHECK (((applies_to)::text = ANY ((ARRAY['global'::character varying, 'collection'::character varying])::text[]))),
    CONSTRAINT promo_codes_discount_type_check CHECK (((discount_type)::text = ANY ((ARRAY['percent'::character varying, 'fixed'::character varying])::text[]))),
    CONSTRAINT promo_collection_check CHECK (((((applies_to)::text = 'global'::text) AND (collection_id IS NULL)) OR (((applies_to)::text = 'collection'::text) AND (collection_id IS NOT NULL))))
);


--
-- Name: promo_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.promo_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: promo_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.promo_codes_id_seq OWNED BY public.promo_codes.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version bigint NOT NULL,
    dirty boolean NOT NULL
);


--
-- Name: store_house; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_house (
    id integer NOT NULL,
    productid integer NOT NULL,
    size text NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT store_house_quantity_check CHECK ((quantity >= 0))
);


--
-- Name: store_house_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.store_house_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: store_house_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.store_house_id_seq OWNED BY public.store_house.id;


--
-- Name: uniquecustomers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.uniquecustomers (
    id integer NOT NULL,
    creationtime date DEFAULT CURRENT_DATE NOT NULL,
    history integer[] NOT NULL
);


--
-- Name: uniquecustomers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.uniquecustomers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: uniquecustomers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.uniquecustomers_id_seq OWNED BY public.uniquecustomers.id;


--
-- Name: unregistercustomer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unregistercustomer (
    id integer NOT NULL,
    name text NOT NULL,
    secondname text,
    mail text NOT NULL,
    phone text NOT NULL,
    town text NOT NULL,
    index text NOT NULL,
    sendmail boolean,
    street text,
    settlement text,
    region text,
    deliverycomment text,
    house text,
    flat text,
    coordinates text[],
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: unregistercustomer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unregistercustomer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unregistercustomer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unregistercustomer_id_seq OWNED BY public.unregistercustomer.id;


--
-- Name: verification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification (
    id integer NOT NULL,
    token text NOT NULL,
    customerid integer NOT NULL,
    expire timestamp without time zone NOT NULL,
    deletetime timestamp without time zone NOT NULL
);


--
-- Name: verification_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.verification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: verification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.verification_id_seq OWNED BY public.verification.id;


--
-- Name: admin_invites id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_invites ALTER COLUMN id SET DEFAULT nextval('public.admin_invites_id_seq'::regclass);


--
-- Name: admin_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs ALTER COLUMN id SET DEFAULT nextval('public.admin_logs_id_seq'::regclass);


--
-- Name: admin_password_resets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_password_resets ALTER COLUMN id SET DEFAULT nextval('public.admin_password_resets_id_seq'::regclass);


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: banners id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners ALTER COLUMN id SET DEFAULT nextval('public.banners_id_seq'::regclass);


--
-- Name: brand_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_lines ALTER COLUMN id SET DEFAULT nextval('public.brand_lines_id_seq'::regclass);


--
-- Name: brands id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands ALTER COLUMN id SET DEFAULT nextval('public.brands_id_seq'::regclass);


--
-- Name: collections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collections ALTER COLUMN id SET DEFAULT nextval('public.collections_id_seq'::regclass);


--
-- Name: colors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colors ALTER COLUMN id SET DEFAULT nextval('public.colors_id_seq'::regclass);


--
-- Name: customer_addresses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_addresses ALTER COLUMN id SET DEFAULT nextval('public.customer_addresses_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: discount id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount ALTER COLUMN id SET DEFAULT nextval('public.discount_id_seq'::regclass);


--
-- Name: discount_rule_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_rule_items ALTER COLUMN id SET DEFAULT nextval('public.discount_rule_items_id_seq'::regclass);


--
-- Name: discount_rules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_rules ALTER COLUMN id SET DEFAULT nextval('public.discount_rules_id_seq'::regclass);


--
-- Name: instagram_posts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instagram_posts ALTER COLUMN id SET DEFAULT nextval('public.instagram_posts_id_seq'::regclass);


--
-- Name: news_blocks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_blocks ALTER COLUMN id SET DEFAULT nextval('public.news_blocks_id_seq'::regclass);


--
-- Name: news_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_items ALTER COLUMN id SET DEFAULT nextval('public.news_items_id_seq'::regclass);


--
-- Name: newsletter_subscribers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers ALTER COLUMN id SET DEFAULT nextval('public.newsletter_subscribers_id_seq'::regclass);


--
-- Name: order_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_events ALTER COLUMN id SET DEFAULT nextval('public.order_events_id_seq'::regclass);


--
-- Name: orderaddress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orderaddress ALTER COLUMN id SET DEFAULT nextval('public.orderaddress_id_seq'::regclass);


--
-- Name: orderitems id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orderitems ALTER COLUMN id SET DEFAULT nextval('public.orderitems_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: page_widgets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_widgets ALTER COLUMN id SET DEFAULT nextval('public.page_widgets_id_seq'::regclass);


--
-- Name: password_resets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets ALTER COLUMN id SET DEFAULT nextval('public.password_resets_id_seq'::regclass);


--
-- Name: preorder id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preorder ALTER COLUMN id SET DEFAULT nextval('public.preorder_id_seq'::regclass);


--
-- Name: preorderaddress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preorderaddress ALTER COLUMN id SET DEFAULT nextval('public.preorderaddress_id_seq'::regclass);


--
-- Name: preorderitems id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preorderitems ALTER COLUMN id SET DEFAULT nextval('public.preorderitems_id_seq'::regclass);


--
-- Name: product_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories ALTER COLUMN id SET DEFAULT nextval('public.product_categories_id_seq'::regclass);


--
-- Name: product_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_types ALTER COLUMN id SET DEFAULT nextval('public.product_types_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: promo_code_usage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_code_usage ALTER COLUMN id SET DEFAULT nextval('public.promo_code_usage_id_seq'::regclass);


--
-- Name: promo_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes ALTER COLUMN id SET DEFAULT nextval('public.promo_codes_id_seq'::regclass);


--
-- Name: store_house id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_house ALTER COLUMN id SET DEFAULT nextval('public.store_house_id_seq'::regclass);


--
-- Name: uniquecustomers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uniquecustomers ALTER COLUMN id SET DEFAULT nextval('public.uniquecustomers_id_seq'::regclass);


--
-- Name: unregistercustomer id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unregistercustomer ALTER COLUMN id SET DEFAULT nextval('public.unregistercustomer_id_seq'::regclass);


--
-- Name: verification id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification ALTER COLUMN id SET DEFAULT nextval('public.verification_id_seq'::regclass);


--
-- Name: admin_invites admin_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_invites
    ADD CONSTRAINT admin_invites_pkey PRIMARY KEY (id);


--
-- Name: admin_invites admin_invites_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_invites
    ADD CONSTRAINT admin_invites_token_key UNIQUE (token);


--
-- Name: admin_logs admin_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_password_resets admin_password_resets_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_password_resets
    ADD CONSTRAINT admin_password_resets_email_unique UNIQUE (email);


--
-- Name: admin_password_resets admin_password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_password_resets
    ADD CONSTRAINT admin_password_resets_pkey PRIMARY KEY (id);


--
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: brand_lines brand_lines_brand_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_lines
    ADD CONSTRAINT brand_lines_brand_id_name_key UNIQUE (brand_id, name);


--
-- Name: brand_lines brand_lines_brand_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_lines
    ADD CONSTRAINT brand_lines_brand_id_slug_key UNIQUE (brand_id, slug);


--
-- Name: brand_lines brand_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_lines
    ADD CONSTRAINT brand_lines_pkey PRIMARY KEY (id);


--
-- Name: brands brands_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_name_key UNIQUE (name);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: brands brands_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_slug_key UNIQUE (slug);


--
-- Name: brands_stats brands_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands_stats
    ADD CONSTRAINT brands_stats_pkey PRIMARY KEY (brand_id);


--
-- Name: collection_products collection_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_products
    ADD CONSTRAINT collection_products_pkey PRIMARY KEY (collection_id, product_id);


--
-- Name: collections collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (id);


--
-- Name: collections collections_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_slug_key UNIQUE (slug);


--
-- Name: colors colors_enum_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colors
    ADD CONSTRAINT colors_enum_key_key UNIQUE (enum_key);


--
-- Name: colors colors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colors
    ADD CONSTRAINT colors_pkey PRIMARY KEY (id);


--
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- Name: customers customers_mail_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_mail_key UNIQUE (mail);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: discount discount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount
    ADD CONSTRAINT discount_pkey PRIMARY KEY (id);


--
-- Name: discount discount_productid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount
    ADD CONSTRAINT discount_productid_key UNIQUE (productid);


--
-- Name: discount_rule_items discount_rule_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_rule_items
    ADD CONSTRAINT discount_rule_items_pkey PRIMARY KEY (id);


--
-- Name: discount_rule_items discount_rule_items_rule_id_item_type_item_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_rule_items
    ADD CONSTRAINT discount_rule_items_rule_id_item_type_item_id_key UNIQUE (rule_id, item_type, item_id);


--
-- Name: discount_rules discount_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_rules
    ADD CONSTRAINT discount_rules_pkey PRIMARY KEY (id);


--
-- Name: instagram_posts instagram_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instagram_posts
    ADD CONSTRAINT instagram_posts_pkey PRIMARY KEY (id);


--
-- Name: news_blocks news_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_blocks
    ADD CONSTRAINT news_blocks_pkey PRIMARY KEY (id);


--
-- Name: news_items news_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_items
    ADD CONSTRAINT news_items_pkey PRIMARY KEY (id);


--
-- Name: newsletter_subscribers newsletter_subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_email_key UNIQUE (email);


--
-- Name: newsletter_subscribers newsletter_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id);


--
-- Name: newsletter_subscribers newsletter_subscribers_verification_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_verification_token_key UNIQUE (verification_token);


--
-- Name: order_events order_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_events
    ADD CONSTRAINT order_events_pkey PRIMARY KEY (id);


--
-- Name: orderaddress orderaddress_orderid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orderaddress
    ADD CONSTRAINT orderaddress_orderid_key UNIQUE (orderid);


--
-- Name: orderaddress orderaddress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orderaddress
    ADD CONSTRAINT orderaddress_pkey PRIMARY KEY (id);


--
-- Name: orderitems orderitems_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orderitems
    ADD CONSTRAINT orderitems_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: page_widgets page_widgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_widgets
    ADD CONSTRAINT page_widgets_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: preorder preorder_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preorder
    ADD CONSTRAINT preorder_pkey PRIMARY KEY (id);


--
-- Name: preorderaddress preorderaddress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preorderaddress
    ADD CONSTRAINT preorderaddress_pkey PRIMARY KEY (id);


--
-- Name: preorderitems preorderitems_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preorderitems
    ADD CONSTRAINT preorderitems_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_enum_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_enum_key_key UNIQUE (enum_key);


--
-- Name: product_categories product_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_name_key UNIQUE (name);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: product_colors product_colors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_colors
    ADD CONSTRAINT product_colors_pkey PRIMARY KEY (product_id, color_id);


--
-- Name: product_sizes product_sizes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_sizes
    ADD CONSTRAINT product_sizes_pkey PRIMARY KEY (product_id, size_key);


--
-- Name: product_types product_types_category_id_enum_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_types
    ADD CONSTRAINT product_types_category_id_enum_key_key UNIQUE (category_id, enum_key);


--
-- Name: product_types product_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_types
    ADD CONSTRAINT product_types_pkey PRIMARY KEY (id);


--
-- Name: products products_article_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_article_key UNIQUE (article);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: promo_code_usage promo_code_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_code_usage
    ADD CONSTRAINT promo_code_usage_pkey PRIMARY KEY (id);


--
-- Name: promo_codes promo_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_code_key UNIQUE (code);


--
-- Name: promo_codes promo_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: store_house store_house_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_house
    ADD CONSTRAINT store_house_pkey PRIMARY KEY (id);


--
-- Name: store_house store_house_productid_size_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_house
    ADD CONSTRAINT store_house_productid_size_key UNIQUE (productid, size);


--
-- Name: uniquecustomers uniquecustomers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uniquecustomers
    ADD CONSTRAINT uniquecustomers_pkey PRIMARY KEY (id);


--
-- Name: unregistercustomer unregistercustomer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unregistercustomer
    ADD CONSTRAINT unregistercustomer_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: idx_admin_invites_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_invites_email ON public.admin_invites USING btree (email) WHERE (used_at IS NULL);


--
-- Name: idx_admin_invites_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_invites_expires ON public.admin_invites USING btree (expires_at) WHERE (used_at IS NULL);


--
-- Name: idx_admin_invites_invited_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_invites_invited_by ON public.admin_invites USING btree (invited_by);


--
-- Name: idx_admin_logs_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_logs_admin ON public.admin_logs USING btree (admin_id);


--
-- Name: idx_admin_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_logs_created ON public.admin_logs USING btree (created_at);


--
-- Name: idx_admins_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admins_email ON public.admins USING btree (email);


--
-- Name: idx_banners_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banners_active ON public.banners USING btree (is_active);


--
-- Name: idx_banners_collection_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banners_collection_id ON public.banners USING btree (collection_id);


--
-- Name: idx_banners_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banners_is_active ON public.banners USING btree (is_active);


--
-- Name: idx_banners_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banners_sort_order ON public.banners USING btree (sort_order);


--
-- Name: idx_brand_lines_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brand_lines_brand ON public.brand_lines USING btree (brand_id);


--
-- Name: idx_brand_lines_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brand_lines_brand_id ON public.brand_lines USING btree (brand_id);


--
-- Name: idx_brands_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brands_created_at ON public.brands USING btree (created_at);


--
-- Name: idx_brands_id_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brands_id_active ON public.brands USING btree (id, is_active) WHERE (is_active = true);


--
-- Name: idx_brands_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brands_name ON public.brands USING btree (name);


--
-- Name: idx_brands_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brands_slug ON public.brands USING btree (slug);


--
-- Name: idx_brands_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brands_sort_order ON public.brands USING btree (sort_order);


--
-- Name: idx_brands_stats_active_products; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brands_stats_active_products ON public.brands_stats USING btree (active_products);


--
-- Name: idx_brands_stats_total_products; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brands_stats_total_products ON public.brands_stats USING btree (total_products);


--
-- Name: idx_collection_products_collection; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_collection_products_collection ON public.collection_products USING btree (collection_id);


--
-- Name: idx_collection_products_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_collection_products_product ON public.collection_products USING btree (product_id);


--
-- Name: idx_collections_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_collections_active ON public.collections USING btree (is_active);


--
-- Name: idx_collections_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_collections_slug ON public.collections USING btree (slug);


--
-- Name: idx_collections_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_collections_type ON public.collections USING btree (type);


--
-- Name: idx_customer_addresses_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_addresses_customer ON public.customer_addresses USING btree (customer_id);


--
-- Name: idx_customer_addresses_default; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_customer_addresses_default ON public.customer_addresses USING btree (customer_id) WHERE (is_default = true);


--
-- Name: idx_customers_mail; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_mail ON public.customers USING btree (mail);


--
-- Name: idx_discount_max_price; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discount_max_price ON public.discount USING btree (max_price);


--
-- Name: idx_discount_min_price; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discount_min_price ON public.discount USING btree (min_price);


--
-- Name: idx_discount_percent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discount_percent ON public.discount USING btree (discount_percent) WHERE (discount_percent > 0);


--
-- Name: idx_discount_productid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discount_productid ON public.discount USING btree (productid);


--
-- Name: idx_discount_rule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discount_rule_id ON public.discount USING btree (rule_id);


--
-- Name: idx_discount_rule_items_type_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discount_rule_items_type_id ON public.discount_rule_items USING btree (item_type, item_id);


--
-- Name: idx_discount_rules_active_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discount_rules_active_dates ON public.discount_rules USING btree (is_active, starts_at, ends_at) WHERE (is_active = true);


--
-- Name: idx_instagram_posts_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instagram_posts_active ON public.instagram_posts USING btree (is_active);


--
-- Name: idx_news_blocks_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_blocks_active ON public.news_blocks USING btree (is_active);


--
-- Name: idx_news_blocks_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_blocks_published ON public.news_blocks USING btree (published_at DESC);


--
-- Name: idx_news_blocks_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_blocks_sort ON public.news_blocks USING btree (sort_order);


--
-- Name: idx_news_items_block; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_items_block ON public.news_items USING btree (news_block_id);


--
-- Name: idx_news_items_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_items_sort ON public.news_items USING btree (sort_order);


--
-- Name: idx_newsletter_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers USING btree (email);


--
-- Name: idx_newsletter_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_token ON public.newsletter_subscribers USING btree (verification_token);


--
-- Name: idx_order_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_events_created_at ON public.order_events USING btree (created_at);


--
-- Name: idx_order_events_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_events_order_id ON public.order_events USING btree (order_id);


--
-- Name: idx_order_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_events_type ON public.order_events USING btree (event_type);


--
-- Name: idx_orderitems_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orderitems_order ON public.orderitems USING btree (orderid);


--
-- Name: idx_orderitems_product_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orderitems_product_order ON public.orderitems USING btree (productid, orderid);


--
-- Name: idx_orders_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_customer ON public.orders USING btree (customerid);


--
-- Name: idx_orders_customer_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_customer_status ON public.orders USING btree (customerid, status);


--
-- Name: idx_orders_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_date ON public.orders USING btree (orderdate);


--
-- Name: idx_page_widgets_collection_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_widgets_collection_id ON public.page_widgets USING btree (collection_id);


--
-- Name: idx_page_widgets_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_widgets_is_active ON public.page_widgets USING btree (is_active);


--
-- Name: idx_page_widgets_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_widgets_sort_order ON public.page_widgets USING btree (sort_order);


--
-- Name: idx_password_resets_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_resets_email ON public.password_resets USING btree (email);


--
-- Name: idx_password_resets_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_resets_token ON public.password_resets USING btree (token);


--
-- Name: idx_preorder_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preorder_hash ON public.preorder USING btree (hashurl);


--
-- Name: idx_preorderitems_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preorderitems_order ON public.preorderitems USING btree (orderid);


--
-- Name: idx_preorderitems_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preorderitems_product ON public.preorderitems USING btree (productid);


--
-- Name: idx_product_sizes_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_sizes_product_id ON public.product_sizes USING btree (product_id);


--
-- Name: idx_product_sizes_quantity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_sizes_quantity ON public.product_sizes USING btree (quantity) WHERE (quantity > 0);


--
-- Name: idx_product_sizes_size_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_sizes_size_key ON public.product_sizes USING btree (size_key);


--
-- Name: idx_products_archived_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_archived_at ON public.products USING btree (archived_at);


--
-- Name: idx_products_article; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_article ON public.products USING btree (article);


--
-- Name: idx_products_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_brand ON public.products USING btree (brand_id);


--
-- Name: idx_products_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_brand_id ON public.products USING btree (brand_id);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category);


--
-- Name: idx_products_category_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category_status ON public.products USING btree (category, status);


--
-- Name: idx_products_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_deleted ON public.products USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: idx_products_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_deleted_at ON public.products USING btree (deleted_at);


--
-- Name: idx_products_line_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_line_id ON public.products USING btree (line_id);


--
-- Name: idx_products_name_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_name_search ON public.products USING gin (to_tsvector('russian'::regconfig, name));


--
-- Name: idx_products_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_name_trgm ON public.products USING gin (name public.gin_trgm_ops);


--
-- Name: idx_products_qid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_qid ON public.products USING btree (qid);


--
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_status ON public.products USING btree (status);


--
-- Name: idx_products_status_category_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_status_category_type ON public.products USING btree (status, category, type) WHERE ((status)::text = 'active'::text);


--
-- Name: idx_products_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_type ON public.products USING btree (type);


--
-- Name: idx_products_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_updated_at ON public.products USING btree (updated_at);


--
-- Name: idx_promo_codes_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promo_codes_code ON public.promo_codes USING btree (code) WHERE (is_active = true);


--
-- Name: idx_promo_codes_collection; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promo_codes_collection ON public.promo_codes USING btree (collection_id) WHERE ((applies_to)::text = 'collection'::text);


--
-- Name: idx_promo_codes_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promo_codes_dates ON public.promo_codes USING btree (starts_at, ends_at) WHERE (is_active = true);


--
-- Name: idx_promo_codes_issued_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promo_codes_issued_to ON public.promo_codes USING btree (issued_to_customer_id) WHERE (issued_to_customer_id IS NOT NULL);


--
-- Name: idx_promo_usage_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promo_usage_code ON public.promo_code_usage USING btree (promo_code_id);


--
-- Name: idx_promo_usage_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promo_usage_customer ON public.promo_code_usage USING btree (customer_id);


--
-- Name: idx_promo_usage_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promo_usage_order ON public.promo_code_usage USING btree (order_id);


--
-- Name: idx_store_house_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_house_product ON public.store_house USING btree (productid);


--
-- Name: brands brand_status_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER brand_status_change AFTER UPDATE OF is_active ON public.brands FOR EACH ROW EXECUTE FUNCTION public.update_products_status_on_brand_change();


--
-- Name: products trg_sync_product_sizes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_product_sizes AFTER INSERT OR UPDATE OF sizes ON public.products FOR EACH ROW EXECUTE FUNCTION public.sync_product_sizes_from_products();


--
-- Name: store_house trg_sync_store_house; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_store_house AFTER INSERT OR UPDATE OF quantity ON public.store_house FOR EACH ROW EXECUTE FUNCTION public.sync_store_house_to_product_sizes();


--
-- Name: products trg_sync_store_house_from_products; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_store_house_from_products AFTER INSERT OR UPDATE OF sizes ON public.products FOR EACH ROW EXECUTE FUNCTION public.sync_store_house_from_products();


--
-- Name: brand_lines trigger_brand_lines_stats; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_brand_lines_stats AFTER INSERT OR DELETE OR UPDATE ON public.brand_lines FOR EACH ROW EXECUTE FUNCTION public.update_brands_lines_count();


--
-- Name: products trigger_products_stats; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_products_stats AFTER INSERT OR DELETE OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_brands_stats();


--
-- Name: product_sizes trigger_update_discount_on_size_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_discount_on_size_delete AFTER DELETE ON public.product_sizes FOR EACH ROW EXECUTE FUNCTION public.update_discount_on_size_change();


--
-- Name: product_sizes trigger_update_discount_on_size_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_discount_on_size_insert AFTER INSERT ON public.product_sizes FOR EACH ROW EXECUTE FUNCTION public.update_discount_on_size_change();


--
-- Name: product_sizes trigger_update_discount_on_size_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_discount_on_size_update AFTER UPDATE ON public.product_sizes FOR EACH ROW EXECUTE FUNCTION public.update_discount_on_size_change();


--
-- Name: admin_invites admin_invites_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_invites
    ADD CONSTRAINT admin_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.admins(id) ON DELETE SET NULL;


--
-- Name: admin_invites admin_invites_used_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_invites
    ADD CONSTRAINT admin_invites_used_by_fkey FOREIGN KEY (used_by) REFERENCES public.admins(id) ON DELETE SET NULL;


--
-- Name: admin_logs admin_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE CASCADE;


--
-- Name: brand_lines brand_lines_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_lines
    ADD CONSTRAINT brand_lines_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: brands_stats brands_stats_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands_stats
    ADD CONSTRAINT brands_stats_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: collection_products collection_products_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_products
    ADD CONSTRAINT collection_products_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON DELETE CASCADE;


--
-- Name: collection_products collection_products_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_products
    ADD CONSTRAINT collection_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: customer_addresses customer_addresses_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: discount discount_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount
    ADD CONSTRAINT discount_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: discount discount_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount
    ADD CONSTRAINT discount_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.discount_rules(id);


--
-- Name: discount_rule_items discount_rule_items_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_rule_items
    ADD CONSTRAINT discount_rule_items_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.discount_rules(id) ON DELETE CASCADE;


--
-- Name: banners fk_banners_collection; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT fk_banners_collection FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON DELETE CASCADE;


--
-- Name: brand_lines fk_brand_lines_brand; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_lines
    ADD CONSTRAINT fk_brand_lines_brand FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: products fk_products_brand; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;


--
-- Name: products fk_products_line; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_line FOREIGN KEY (line_id) REFERENCES public.brand_lines(id) ON DELETE SET NULL;


--
-- Name: news_items news_items_news_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_items
    ADD CONSTRAINT news_items_news_block_id_fkey FOREIGN KEY (news_block_id) REFERENCES public.news_blocks(id) ON DELETE CASCADE;


--
-- Name: order_events order_events_changed_by_admin_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_events
    ADD CONSTRAINT order_events_changed_by_admin_fkey FOREIGN KEY (changed_by_admin) REFERENCES public.admins(id) ON DELETE SET NULL;


--
-- Name: order_events order_events_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_events
    ADD CONSTRAINT order_events_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orderaddress orderaddress_orderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orderaddress
    ADD CONSTRAINT orderaddress_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.orders(id);


--
-- Name: orderitems orderitems_orderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orderitems
    ADD CONSTRAINT orderitems_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.orders(id);


--
-- Name: orders orders_customerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customerid_fkey FOREIGN KEY (customerid) REFERENCES public.customers(id);


--
-- Name: orders orders_unregistercustomerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_unregistercustomerid_fkey FOREIGN KEY (unregistercustomerid) REFERENCES public.unregistercustomer(id);


--
-- Name: preorderaddress preorderaddress_orderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preorderaddress
    ADD CONSTRAINT preorderaddress_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.preorder(id);


--
-- Name: preorderitems preorderitems_orderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preorderitems
    ADD CONSTRAINT preorderitems_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.preorder(id);


--
-- Name: product_colors product_colors_color_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_colors
    ADD CONSTRAINT product_colors_color_id_fkey FOREIGN KEY (color_id) REFERENCES public.colors(id) ON DELETE CASCADE;


--
-- Name: product_colors product_colors_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_colors
    ADD CONSTRAINT product_colors_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_sizes product_sizes_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_sizes
    ADD CONSTRAINT product_sizes_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_types product_types_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_types
    ADD CONSTRAINT product_types_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_categories(id) ON DELETE CASCADE;


--
-- Name: products products_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;


--
-- Name: products products_category_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_fkey FOREIGN KEY (category) REFERENCES public.product_categories(id);


--
-- Name: products products_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_line_id_fkey FOREIGN KEY (line_id) REFERENCES public.brand_lines(id) ON DELETE SET NULL;


--
-- Name: products products_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_type_fkey FOREIGN KEY (type) REFERENCES public.product_types(id);


--
-- Name: promo_code_usage promo_code_usage_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_code_usage
    ADD CONSTRAINT promo_code_usage_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: promo_code_usage promo_code_usage_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_code_usage
    ADD CONSTRAINT promo_code_usage_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: promo_codes promo_codes_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON DELETE CASCADE;


--
-- Name: promo_codes promo_codes_issued_to_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_issued_to_customer_id_fkey FOREIGN KEY (issued_to_customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: store_house store_house_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_house
    ADD CONSTRAINT store_house_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: verification verification_customerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_customerid_fkey FOREIGN KEY (customerid) REFERENCES public.customers(id);


--
-- PostgreSQL database dump complete
--

