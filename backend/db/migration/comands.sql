-- ========================================
-- 1. ОБНОВЛЕНИЕ БРЕНДОВ
-- ========================================
UPDATE public.products
SET firm = CASE firm
    WHEN '361' THEN '361°'
    WHEN 'adidas' THEN 'Adidas'
    WHEN 'anta' THEN 'ANTA'
    WHEN 'arcteryx' THEN 'Arcteryx'
    WHEN 'asics' THEN 'ASICS'
    WHEN 'atry' THEN 'Atry'
    WHEN 'balenciaga' THEN 'Balenciaga'
    WHEN 'birkenstock' THEN 'Birkenstock'
    WHEN 'camel' THEN 'CAMEL'
    WHEN 'carhartt' THEN 'Carhartt WIP'
    WHEN 'casio' THEN 'CASIO'
    WHEN 'cat' THEN 'CAT'
    WHEN 'champion' THEN 'Champion'
    WHEN 'chanel' THEN 'CHANEL'
    WHEN 'clarks' THEN 'Clarks'
    WHEN 'clot' THEN 'CLOT'
    WHEN 'coach' THEN 'COACH'
    WHEN 'columbia' THEN 'Columbia'
    WHEN 'converse' THEN 'Converse'
    WHEN 'crocs' THEN 'Crocs'
    WHEN 'diesel' THEN 'DIESEL'
    WHEN 'dior' THEN 'DIOR'
    WHEN 'disney' THEN 'Disney'
    WHEN 'doraemon' THEN 'Doraemon'
    WHEN 'ferragamo' THEN 'Ferragamo'
    WHEN 'fila' THEN 'FILA'
    WHEN 'gucci' THEN 'GUCCI'
    WHEN 'hermes' THEN 'HERMES'
    WHEN 'hanqiaoriji' THEN 'HANQIAORIJI'
    WHEN 'jordan' THEN 'Jordan'
    WHEN 'keen' THEN 'Keen'
    WHEN 'LiNing' THEN 'LINING'
    WHEN 'lululemon' THEN 'Lululemon'
    WHEN 'mizuno' THEN 'Mizuno'
    WHEN 'mlb' THEN 'MLB'
    WHEN 'nike' THEN 'Nike'
    when 'occupy' then 'OCCUPY'
    when 'on' then 'ON'
    WHEN 'peak' THEN 'PEAK'
    WHEN 'puma' THEN 'PUMA'
    WHEN 'reebok' THEN 'Reebok'
    WHEN 'salomon' THEN 'SALOMON'
    WHEN 'skechers' THEN 'Skechers'
    WHEN 'supreme' THEN 'Supreme'
    WHEN 'swarovski' THEN 'Swarovski'
    WHEN 'timberland' THEN 'Timberland'
    WHEN 'ugg' THEN 'UGG'
    WHEN 'vans' THEN 'Vans'
    WHEN 'yeezy' THEN 'YEEZY'
    ELSE firm
END
WHERE firm IN (
    '361', 'adidas', 'anta', 'arcteryx', 'asics', 'atry', 'balenciaga', 
    'birkenstock', 'camel', 'carhartt', 'casio', 'cat', 'champion', 
    'chanel', 'clarks', 'clot', 'coach', 'columbia', 'converse', 'crocs',
    'diesel', 'dior', 'disney', 'doraemon', 'ferragamo', 'fila', 'gucci',
    'hermes', 'jordan', 'keen', 'lining', 'lululemon', 'mizuno', 'mlb',
    'nike', 'peak', 'puma', 'reebok', 'salomon', 'skechers', 'supreme',
    'swarovski', 'timberland', 'ugg', 'vans', 'yeezy','on', 'occupy', 'hanqiaoriji'
);

-- ========================================
-- 2. ДОБАВЛЕНИЕ ТИПОВ ДЛЯ ВСЕХ КАТЕГОРИЙ
-- ========================================

-- Clothes (category_id = 3)
INSERT INTO product_types (category_id, type_name, enum_key) VALUES
(3, 'Футболки', 't-shirt'),
(3, 'Худи', 'hoodie'),
(3, 'Свитеры', 'sweater'),
(3, 'Куртки', 'jacket'),
(3, 'Пуховики', 'puffer'),
(3, 'Парки', 'parka'),
(3, 'Ветровки', 'windbreaker'),
(3, 'Бомберы', 'bomber'),
(3, 'Рубашки', 'shirt'),
(3, 'Штаны', 'pants'),
(3, 'Брюки', 'trousers'),
(3, 'Джинсы', 'jeans'),
(3, 'Шорты', 'shorts'),
(3, 'Лосины', 'leggings'),
(3, 'Шапки', 'hat'),
(3, 'Кепки', 'cap'),
(3, 'Бейсболки', 'baseball'),
(3, 'Платья', 'dress'),
(3, 'Юбки', 'skirt'),
(3, 'Сарафаны', 'sundress'),
(3, 'Ремни', 'belt'),
(3, 'Перчатки', 'gloves'),
(3, 'Шарфы', 'scarf'),
(3, 'Носки', 'socks'),
(3, 'Спортивная', 'sport'),
(3, 'Тренировочная', 'training'),
(3, 'Беговая', 'running'),
(3, 'Домашняя', 'loungewear'),
(3, 'Пижамы', 'pajama'),
(3, 'Халаты', 'robe'),
(3, 'Купальники', 'swimwear'),
(3, 'Кроссовки', 'sneakers'),
(3, 'Ботинки', 'boots'),
(3, 'Туфли', 'shoes'),
(3, 'Другое', 'other')
ON CONFLICT (category_id, enum_key) DO NOTHING;

-- Merch (category_id = 2)
INSERT INTO product_types (category_id, type_name, enum_key) VALUES
(2, 'Кепки', 'hat'),
(2, 'Игрушки', 'toys'),
(2, 'Сумки', 'bag'),
(2, 'Ремни', 'belts'),
(2, 'Серьги', 'earrings'),
(2, 'Перчатки', 'gloves'),
(2, 'Шарфы', 'scarves'),
(2, 'Головные уборы', 'hats'),
(2, 'Тренировка', 'training'),
(2, 'Ботинки', 'boots'),
(2, 'Ожерелья', 'necklaces'),
(2, 'Часы', 'watches'),
(2, 'Кольца', 'rings'),
(2, 'Браслеты', 'bracelets'),
(2, 'Брелоки', 'keychains'),
(2, 'Очки', 'eyewear'),
(2, 'Сумки через плечо', 'shoulder'),
(2, 'Путешествия', 'travel'),
(2, 'Открытый воздух', 'outdoors'),
(2, 'Плоская подошва', 'flats'),
(2, 'Сандалии', 'sandals'),
(2, 'Сумки crossbody', 'crossbody'),
(2, 'Баскетбол', 'basketball'),
(2, 'Бег', 'running'),
(2, 'Рюкзаки', 'backpack'),
(2, 'Кошельки', 'wallets'),
(2, 'Другое', 'other')
ON CONFLICT (category_id, enum_key) DO NOTHING;

-- Toys (category_id = 4)
INSERT INTO product_types (category_id, type_name, enum_key) VALUES
(4, 'Фигурки', 'figures'),
(4, 'Карты', 'cards'),
(4, 'Куклы', 'dolls'),
(4, 'Мягкие игрушки', 'plush'),
(4, 'Настольные игры', 'boardgames'),
(4, 'Конструкторы', 'building'),
(4, 'Машинки', 'cars'),
(4, 'Роботы', 'robots'),
(4, 'Пазлы', 'puzzles'),
(4, 'Трансформеры', 'transformers'),
(4, 'Лего', 'lego'),
(4, 'Поп ит', 'popit'),
(4, 'Слаймы', 'slime'),
(4, 'Кинетический песок', 'sand'),
(4, 'Раскраски', 'coloring'),
(4, 'Книги', 'books'),
(4, 'Развивающие', 'educational'),
(4, 'Детское творчество', 'creativity'),
(4, 'Спортивные', 'sports'),
(4, 'Радиоуправляемые', 'rc'),
(4, 'Электронные', 'electronic'),
(4, 'Детские коврики', 'mats'),
(4, 'Палатки', 'tents'),
(4, 'Оружие', 'weapons'),
(4, 'Наборы для опытов', 'experiments'),
(4, 'Мозаика', 'mosaic'),
(4, 'Сборные модели', 'models'),
(4, 'Железная дорога', 'railway'),
(4, 'Батуты', 'trampolines'),
(4, 'Другое', 'other')
ON CONFLICT (category_id, enum_key) DO NOTHING;

-- ========================================
-- 3. ФУНКЦИЯ ДЛЯ CLOTHES
-- ========================================
CREATE OR REPLACE FUNCTION auto_update_clothes_types()
RETURNS TABLE(product_id INTEGER, product_name TEXT, old_type TEXT, new_type TEXT) AS
$func_clothes$
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
            WHEN product_rec.name ILIKE '%футболк%' OR product_rec.name ILIKE '%t-shirt%' OR 
                 product_rec.name ILIKE '%t shirt%' OR product_rec.name ILIKE '%tshirt%' OR
                 product_rec.name ILIKE '%майк%' OR product_rec.name ILIKE '%поло%' THEN 't-shirt'
            WHEN product_rec.name ILIKE '%худи%' OR product_rec.name ILIKE '%hoodie%' OR
                 product_rec.name ILIKE '%толстовк%' OR product_rec.name ILIKE '%свитшот%' THEN 'hoodie'
            WHEN product_rec.name ILIKE '%рубашк%' OR product_rec.name ILIKE '%shirt%' THEN 'shirt'
            WHEN product_rec.name ILIKE '%свитер%' OR product_rec.name ILIKE '%sweater%' THEN 'sweater'
            WHEN product_rec.name ILIKE '%куртк%' OR product_rec.name ILIKE '%jacket%' THEN 'jacket'
            WHEN product_rec.name ILIKE '%пуховик%' OR product_rec.name ILIKE '%puffer%' THEN 'puffer'
            WHEN product_rec.name ILIKE '%парк%' OR product_rec.name ILIKE '%parka%' THEN 'parka'
            WHEN product_rec.name ILIKE '%ветровк%' OR product_rec.name ILIKE '%windbreaker%' THEN 'windbreaker'
            WHEN product_rec.name ILIKE '%бомбер%' OR product_rec.name ILIKE '%bomber%' THEN 'bomber'
            WHEN product_rec.name ILIKE '%штаны%' OR product_rec.name ILIKE '%pants%' THEN 'pants'
            WHEN product_rec.name ILIKE '%брюк%' OR product_rec.name ILIKE '%trousers%' THEN 'trousers'
            WHEN product_rec.name ILIKE '%джинс%' OR product_rec.name ILIKE '%jeans%' THEN 'jeans'
            WHEN product_rec.name ILIKE '%шорт%' OR product_rec.name ILIKE '%shorts%' THEN 'shorts'
            WHEN product_rec.name ILIKE '%лосин%' OR product_rec.name ILIKE '%leggings%' THEN 'leggings'
            WHEN product_rec.name ILIKE '%шапк%' OR product_rec.name ILIKE '%hat%' THEN 'hat'
            WHEN product_rec.name ILIKE '%кепк%' OR product_rec.name ILIKE '%cap%' THEN 'cap'
            WHEN product_rec.name ILIKE '%бейсболк%' OR product_rec.name ILIKE '%baseball%' THEN 'baseball'
            WHEN product_rec.name ILIKE '%плать%' OR product_rec.name ILIKE '%dress%' THEN 'dress'
            WHEN product_rec.name ILIKE '%юбк%' OR product_rec.name ILIKE '%skirt%' THEN 'skirt'
            WHEN product_rec.name ILIKE '%сарафан%' OR product_rec.name ILIKE '%sundress%' THEN 'sundress'
            WHEN product_rec.name ILIKE '%ремень%' OR product_rec.name ILIKE '%belt%' THEN 'belt'
            WHEN product_rec.name ILIKE '%перчатк%' OR product_rec.name ILIKE '%gloves%' THEN 'gloves'
            WHEN product_rec.name ILIKE '%шарф%' OR product_rec.name ILIKE '%scarf%' THEN 'scarf'
            WHEN product_rec.name ILIKE '%носк%' OR product_rec.name ILIKE '%socks%' THEN 'socks'
            WHEN product_rec.name ILIKE '%спортивн%' OR product_rec.name ILIKE '%sport%' THEN 'sport'
            WHEN product_rec.name ILIKE '%тренировочн%' OR product_rec.name ILIKE '%training%' THEN 'training'
            WHEN product_rec.name ILIKE '%бегов%' OR product_rec.name ILIKE '%running%' THEN 'running'
            WHEN product_rec.name ILIKE '%домашн%' OR product_rec.name ILIKE '%loungewear%' THEN 'loungewear'
            WHEN product_rec.name ILIKE '%пижам%' OR product_rec.name ILIKE '%pajama%' THEN 'pajama'
            WHEN product_rec.name ILIKE '%халат%' OR product_rec.name ILIKE '%robe%' THEN 'robe'
            WHEN product_rec.name ILIKE '%купальник%' OR product_rec.name ILIKE '%swimwear%' THEN 'swimwear'
            WHEN product_rec.name ILIKE '%кроссовк%' OR product_rec.name ILIKE '%sneakers%' THEN 'sneakers'
            WHEN product_rec.name ILIKE '%ботинк%' OR product_rec.name ILIKE '%boots%' THEN 'boots'
            WHEN product_rec.name ILIKE '%туфл%' OR product_rec.name ILIKE '%shoes%' THEN 'shoes'
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
    
    RAISE NOTICE 'Обновлено товаров в clothes: %', updated_count;
    RETURN QUERY SELECT * FROM update_results_clothes;
    DROP TABLE update_results_clothes;
END;
$func_clothes$ LANGUAGE plpgsql;

-- ========================================
-- 4. ФУНКЦИЯ ДЛЯ MERCH
-- ========================================
CREATE OR REPLACE FUNCTION auto_update_merch_types()
RETURNS TABLE(product_id INTEGER, product_name TEXT, old_type TEXT, new_type TEXT) AS
$func_merch$
DECLARE
    merch_cat_id INTEGER := 2;
    product_rec RECORD;
    target_type_id INTEGER;
    target_type_enum TEXT;
    old_type_name TEXT;
    updated_count INTEGER := 0;
BEGIN
    CREATE TEMP TABLE update_results_merch (product_id INTEGER, product_name TEXT, old_type TEXT, new_type TEXT);
    
    FOR product_rec IN 
        SELECT p.id, p.name, p.type, pt.type_name as current_type, pt.enum_key
        FROM products p
        JOIN product_types pt ON p.type = pt.id
        WHERE p.category = merch_cat_id
    LOOP
        old_type_name := product_rec.current_type;
        
        target_type_enum := CASE
            WHEN product_rec.name ILIKE '%кепк%' OR product_rec.name ILIKE '%hat%' OR
                 product_rec.name ILIKE '%шапк%' OR product_rec.name ILIKE '%бейсболк%' THEN 'hat'
            WHEN product_rec.name ILIKE '%игрушк%' OR product_rec.name ILIKE '%toys%' THEN 'toys'
            WHEN product_rec.name ILIKE '%сумк%' OR product_rec.name ILIKE '%bag%' THEN 'bag'
            WHEN product_rec.name ILIKE '%ремень%' OR product_rec.name ILIKE '%belt%' THEN 'belts'
            WHEN product_rec.name ILIKE '%серьг%' OR product_rec.name ILIKE '%earring%' THEN 'earrings'
            WHEN product_rec.name ILIKE '%перчатк%' OR product_rec.name ILIKE '%gloves%' THEN 'gloves'
            WHEN product_rec.name ILIKE '%шарф%' OR product_rec.name ILIKE '%scarf%' THEN 'scarves'
            WHEN product_rec.name ILIKE '%тренировк%' OR product_rec.name ILIKE '%training%' THEN 'training'
            WHEN product_rec.name ILIKE '%ботинк%' OR product_rec.name ILIKE '%boots%' THEN 'boots'
            WHEN product_rec.name ILIKE '%ожерель%' OR product_rec.name ILIKE '%necklace%' THEN 'necklaces'
            WHEN product_rec.name ILIKE '%час%' OR product_rec.name ILIKE '%watch%' THEN 'watches'
            WHEN product_rec.name ILIKE '%кольц%' OR product_rec.name ILIKE '%ring%' THEN 'rings'
            WHEN product_rec.name ILIKE '%браслет%' OR product_rec.name ILIKE '%bracelet%' THEN 'bracelets'
            WHEN product_rec.name ILIKE '%брелок%' OR product_rec.name ILIKE '%keychain%' THEN 'keychains'
            WHEN product_rec.name ILIKE '%очк%' OR product_rec.name ILIKE '%glass%' THEN 'eyewear'
            WHEN product_rec.name ILIKE '%плеч%' OR product_rec.name ILIKE '%shoulder%' THEN 'shoulder'
            WHEN product_rec.name ILIKE '%путешеств%' OR product_rec.name ILIKE '%travel%' THEN 'travel'
            WHEN product_rec.name ILIKE '%открыт%воздух%' OR product_rec.name ILIKE '%outdoors%' THEN 'outdoors'
            WHEN product_rec.name ILIKE '%плоск%подошв%' OR product_rec.name ILIKE '%flats%' THEN 'flats'
            WHEN product_rec.name ILIKE '%сандал%' OR product_rec.name ILIKE '%sandals%' THEN 'sandals'
            WHEN product_rec.name ILIKE '%crossbody%' THEN 'crossbody'
            WHEN product_rec.name ILIKE '%баскетбол%' OR product_rec.name ILIKE '%basketball%' THEN 'basketball'
            WHEN product_rec.name ILIKE '%бег%' OR product_rec.name ILIKE '%running%' THEN 'running'
            WHEN product_rec.name ILIKE '%рюкзак%' OR product_rec.name ILIKE '%backpack%' THEN 'backpack'
            WHEN product_rec.name ILIKE '%кошелек%' OR product_rec.name ILIKE '%wallet%' THEN 'wallets'
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
    
    RAISE NOTICE 'Обновлено товаров в merch: %', updated_count;
    RETURN QUERY SELECT * FROM update_results_merch;
    DROP TABLE update_results_merch;
END;
$func_merch$ LANGUAGE plpgsql;

-- ========================================
-- 5. ФУНКЦИЯ ДЛЯ TOYS
-- ========================================
CREATE OR REPLACE FUNCTION auto_update_toys_types()
RETURNS TABLE(product_id INTEGER, product_name TEXT, old_type TEXT, new_type TEXT) AS
$func_toys$
DECLARE
    toys_cat_id INTEGER := 4;
    product_rec RECORD;
    target_type_id INTEGER;
    target_type_enum TEXT;
    old_type_name TEXT;
    updated_count INTEGER := 0;
BEGIN
    CREATE TEMP TABLE update_results_toys (product_id INTEGER, product_name TEXT, old_type TEXT, new_type TEXT);
    
    FOR product_rec IN 
        SELECT p.id, p.name, p.type, pt.type_name as current_type, pt.enum_key
        FROM products p
        JOIN product_types pt ON p.type = pt.id
        WHERE p.category = toys_cat_id
    LOOP
        old_type_name := product_rec.current_type;
        
        target_type_enum := CASE
            WHEN product_rec.name ILIKE '%фигурк%' OR product_rec.name ILIKE '%figure%' THEN 'figures'
            WHEN product_rec.name ILIKE '%карт%' OR product_rec.name ILIKE '%cards%' THEN 'cards'
            WHEN product_rec.name ILIKE '%кукл%' OR product_rec.name ILIKE '%doll%' THEN 'dolls'
            WHEN product_rec.name ILIKE '%мягк%' OR product_rec.name ILIKE '%plush%' THEN 'plush'
            WHEN product_rec.name ILIKE '%настольн%' OR product_rec.name ILIKE '%board%' THEN 'boardgames'
            WHEN product_rec.name ILIKE '%конструктор%' OR product_rec.name ILIKE '%building%' THEN 'building'
            WHEN product_rec.name ILIKE '%машинк%' OR product_rec.name ILIKE '%cars%' THEN 'cars'
            WHEN product_rec.name ILIKE '%робот%' OR product_rec.name ILIKE '%robot%' THEN 'robots'
            WHEN product_rec.name ILIKE '%пазл%' OR product_rec.name ILIKE '%puzzle%' THEN 'puzzles'
            WHEN product_rec.name ILIKE '%трансформер%' OR product_rec.name ILIKE '%transform%' THEN 'transformers'
            WHEN product_rec.name ILIKE '%лего%' OR product_rec.name ILIKE '%lego%' THEN 'lego'
            WHEN product_rec.name ILIKE '%поп ит%' OR product_rec.name ILIKE '%popit%' THEN 'popit'
            WHEN product_rec.name ILIKE '%слайм%' OR product_rec.name ILIKE '%slime%' THEN 'slime'
            WHEN product_rec.name ILIKE '%песок%' OR product_rec.name ILIKE '%sand%' THEN 'sand'
            WHEN product_rec.name ILIKE '%раскраск%' OR product_rec.name ILIKE '%coloring%' THEN 'coloring'
            WHEN product_rec.name ILIKE '%книг%' OR product_rec.name ILIKE '%book%' THEN 'books'
            WHEN product_rec.name ILIKE '%развива%' OR product_rec.name ILIKE '%educational%' THEN 'educational'
            WHEN product_rec.name ILIKE '%творчеств%' OR product_rec.name ILIKE '%creativity%' THEN 'creativity'
            WHEN product_rec.name ILIKE '%спортивн%' OR product_rec.name ILIKE '%sports%' THEN 'sports'
            WHEN product_rec.name ILIKE '%радиоуправл%' OR product_rec.name ILIKE '%rc%' THEN 'rc'
            WHEN product_rec.name ILIKE '%электронн%' OR product_rec.name ILIKE '%electronic%' THEN 'electronic'
            WHEN product_rec.name ILIKE '%коврик%' OR product_rec.name ILIKE '%mats%' THEN 'mats'
            WHEN product_rec.name ILIKE '%палатк%' OR product_rec.name ILIKE '%tent%' THEN 'tents'
            WHEN product_rec.name ILIKE '%оружи%' OR product_rec.name ILIKE '%weapon%' THEN 'weapons'
            WHEN product_rec.name ILIKE '%опыт%' OR product_rec.name ILIKE '%experiment%' THEN 'experiments'
            WHEN product_rec.name ILIKE '%мозаик%' OR product_rec.name ILIKE '%mosaic%' THEN 'mosaic'
            WHEN product_rec.name ILIKE '%сборн%модел%' OR product_rec.name ILIKE '%model%' THEN 'models'
            WHEN product_rec.name ILIKE '%железн%дорог%' OR product_rec.name ILIKE '%railway%' THEN 'railway'
            WHEN product_rec.name ILIKE '%батут%' OR product_rec.name ILIKE '%trampoline%' THEN 'trampolines'
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
    
    RAISE NOTICE 'Обновлено товаров в toys: %', updated_count;
    RETURN QUERY SELECT * FROM update_results_toys;
    DROP TABLE update_results_toys;
END;
$func_toys$ LANGUAGE plpgsql;

-- ========================================
-- 6. ЗАПУСК ВСЕХ ФУНКЦИЙ
-- ========================================
DO $$
BEGIN
    PERFORM auto_update_clothes_types();
    PERFORM auto_update_merch_types();
    PERFORM auto_update_toys_types();
END $$;

-- ========================================
-- 7. УДАЛЕНИЕ НЕИСПОЛЬЗУЕМЫХ ТИПОВ
-- ========================================
DELETE FROM product_types WHERE category_id = 3 AND enum_key != 'other'
AND NOT EXISTS (SELECT 1 FROM products WHERE products.type = product_types.id);

DELETE FROM product_types WHERE category_id = 2 AND enum_key != 'other'
AND NOT EXISTS (SELECT 1 FROM products WHERE products.type = product_types.id);

DELETE FROM product_types WHERE category_id = 4 AND enum_key != 'other'
AND NOT EXISTS (SELECT 1 FROM products WHERE products.type = product_types.id);

DELETE FROM product_types WHERE category_id = 1 AND enum_key != 'other'
AND NOT EXISTS (SELECT 1 FROM products WHERE products.type = product_types.id);
