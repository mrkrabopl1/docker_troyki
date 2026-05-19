-- UPDATE public.products
-- SET firm = CASE firm
--     WHEN '361' THEN '361°'
--     WHEN '404mob gang' THEN '404MOB GANG'
--     WHEN '7 sevfun' THEN '7 SEVFUN'
--     WHEN '88rising' THEN '88rising'
--     WHEN 'a chock' THEN 'A Chock'
--     WHEN 'a square root' THEN 'A SQUARE ROOT'
--     WHEN 'a.b.x' THEN 'A.B.X'
--     WHEN 'a02' THEN 'A02'
--     WHEN 'anta' THEN 'ANTA'
--     WHEN 'aajf' THEN 'AAJF'
--     WHEN 'acuc' THEN 'ACUC'
--     WHEN 'adidas' THEN 'Adidas'
--     WHEN 'agsdon' THEN 'agsdon'
--     WHEN 'aokang' THEN 'AOKANG'
--     WHEN 'arcteryx' THEN 'Arcteryx'
--     WHEN 'asics' THEN 'ASICS'
--     WHEN 'atry' THEN 'Atry'
--     WHEN 'auldey' THEN 'AULDEY'
--     WHEN 'baggl' THEN 'BAGGL'
--     WHEN 'balenciaga' THEN 'Balenciaga'
--     WHEN 'baleno' THEN 'BALENO'
--     WHEN 'bandai' THEN 'bandai'
--     WHEN 'banpresto' THEN 'banpresto'
--     WHEN 'barbie' THEN 'Barbie'
--     WHEN 'barbour' THEN 'barbour'
--     WHEN 'beaster' THEN 'BEASTER'
--     WHEN 'beerus' THEN 'Beerus'
--     WHEN 'beneunder' THEN 'beneunder'
--     WHEN 'benmyshower' THEN 'BENMYSHOWER'
--     WHEN 'bingfei' THEN 'bingfei'
--     WHEN 'birkenstock' THEN 'Birkenstock'
--     WHEN 'bjhg' THEN 'BJHG'
--     WHEN 'burberry' THEN 'Burberry'
--     WHEN 'camel' THEN 'CAMEL'
--     WHEN 'caramella' THEN 'Caramella'
--     WHEN 'cardanro' THEN 'CARDANRO'
--     WHEN 'carhartt' THEN 'Carhartt WIP'
--     WHEN 'cartelo' THEN 'cartelo'
--     WHEN 'casio' THEN 'CASIO'
--     WHEN 'cat' THEN 'CAT'
--     WHEN 'champion' THEN 'Champion'
--     WHEN 'chanel' THEN 'CHANEL'
--     WHEN 'clarks' THEN 'Clarks'
--     WHEN 'clot' THEN 'CLOT'
--     WHEN 'cmfy' THEN 'CMFY'
--     WHEN 'coach' THEN 'COACH'
--     WHEN 'columbia' THEN 'Columbia'
--     WHEN 'comowa' THEN 'COMOWA'
--     WHEN 'converse' THEN 'Converse'
--     WHEN 'cooraree' THEN 'Cooraree'
--     WHEN 'crocs' THEN 'Crocs'
--     WHEN 'dand' THEN 'DAND'
--     WHEN 'danqin' THEN 'Danqin'
--     WHEN 'deerway' THEN 'DEERWAY'
--     WHEN 'devanro' THEN 'Devanro'
--     WHEN 'dickies' THEN 'Dickies'
--     WHEN 'diesel' THEN 'DIESEL'
--     WHEN 'dior' THEN 'DIOR'
--     WHEN 'disney' THEN 'Disney'
--     WHEN 'doraemon' THEN 'Doraemon'
--     WHEN 'dounkol' THEN 'Dounkol'
--     WHEN 'dzp' THEN 'DZP'
--     WHEN 'ecco' THEN 'Ecco'
--     WHEN 'elle' THEN 'ELLE'
--     WHEN 'enfantin' THEN 'ENFANTIN'
--     WHEN 'eptison' THEN 'EPTISON'
--     WHEN 'er' THEN 'ER'
--     WHEN 'erke' THEN 'erke'
--     WHEN 'eusu' THEN 'EUSU'
--     WHEN 'f426' THEN 'F426'
--     WHEN 'fairwhale' THEN 'FAIRWHALE'
--     WHEN 'fastfish' THEN 'FASTFISH'
--     WHEN 'feiyue' THEN 'feiyue'
--     WHEN 'ferragamo' THEN 'Ferragamo'
--     WHEN 'fila' THEN 'FILA'
--     WHEN 'firemonkey' THEN 'FireMonkey'
--     WHEN 'fornines' THEN 'FORNINES'
--     WHEN 'fpa' THEN 'fpa'
--     WHEN 'gbxm' THEN 'GBXM'
--     WHEN 'gelanlu' THEN 'GELANLU'
--     WHEN 'genanx' THEN 'GENANX'
--     WHEN 'givenchy' THEN 'Givenchy'
--     WHEN 'golf' THEN 'GOLF'
--     WHEN 'golfcross' THEN 'GOLFCROSS'
--     WHEN 'gucci' THEN 'GUCCI'
--     WHEN 'gudud' THEN 'GUDUD'
--     WHEN 'guuka' THEN 'Guuka'
--     WHEN 'gwaf' THEN 'GWAF'
--     WHEN 'gxg' THEN 'GXG'
--     WHEN 'handaiwei' THEN 'handaiwei'
--     WHEN 'hanqiaoriji' THEN 'HANQIAORIJI'
--     WHEN 'hermes' THEN 'HERMES'
--     WHEN 'hla' THEN 'HLA'
--     WHEN 'huanai' THEN 'huanai'
--     WHEN 'huanqiu' THEN 'HUANQIU'
--     WHEN 'iots' THEN 'IOTS'
--     WHEN 'jacquemus' THEN 'Jacquemus'
--     WHEN 'jaguar' THEN 'JAGUAR'
--     WHEN 'jasonwood' THEN 'JASONWOOD'
--     WHEN 'jeanswest' THEN 'jeanswest'
--     WHEN 'jeep' THEN 'JEEP SPIRIT'
--     WHEN 'jellycat' THEN 'jellycat'
--     WHEN 'jifeishi' THEN 'jifeishi'
--     WHEN 'jkem' THEN 'JKEM'
--     WHEN 'jordan' THEN 'Jordan'
--     WHEN 'josiny' THEN 'JOSINY'
--     WHEN 'kaltendin' THEN 'Kaltendin'
--     WHEN 'kangol' THEN 'kangol'
--     WHEN 'kappa' THEN 'kappa'
--     WHEN 'kelme' THEN 'KELME'
--     WHEN 'keen' THEN 'Keen'
--     WHEN 'kenmont' THEN 'KENMONT'
--     WHEN 'khadgar' THEN 'Khadgar'
--     WHEN 'killwinner' THEN 'KILLWINNER'
--     WHEN 'kith' THEN 'KITH'
--     WHEN 'lacoste' THEN 'lacoste'
--     WHEN 'lanza' THEN 'Lanza'
--     WHEN 'lee' THEN 'lee'
--     WHEN 'lilbetter' THEN 'Lilbetter'
--     WHEN 'lingjie' THEN 'LINGJIE'
--     WHEN 'lining' THEN 'LiNing'
--     WHEN 'LINING' THEN 'LiNing'
--     WHEN 'lululemon' THEN 'Lululemon'
--     WHEN 'longchamp' THEN 'longchamp'
--     WHEN 'loox' THEN 'LOOX!'
--     WHEN 'maserati' THEN 'Maserati'
--     WHEN 'melsmao' THEN 'MELSMAO'
--     WHEN 'merrell' THEN 'MERRELL'
--     WHEN 'mexican' THEN 'MEXICAN'
--     WHEN 'miiow' THEN 'MIIOW'
--     WHEN 'minifocus' THEN 'minifocus'
--     WHEN 'miniso' THEN 'MINISO'
--     WHEN 'mizuno' THEN 'Mizuno'
--     WHEN 'mlb' THEN 'MLB'
--     WHEN 'mover' THEN 'MOVER'
--     WHEN 'mpux' THEN 'MPUX'
--     WHEN 'mulinsen' THEN 'Mulinsen'
--     WHEN 'mustkoo' THEN 'MUSTKOO'
--     WHEN 'muykuy' THEN 'MUYKUY'
--     WHEN 'nike' THEN 'Nike'
--     WHEN 'nothomme' THEN 'NOTHOMME'
--     WHEN 'occupy' THEN 'OCCUPY'
--     WHEN 'on' THEN 'On'
--     WHEN 'ON' THEN 'On'
--     WHEN 'opox' THEN 'OPOX'
--     WHEN 'palace' THEN 'palace'
--     WHEN 'peak' THEN 'PEAK'
--     WHEN 'potdemiel' THEN 'potdemiel'
--     WHEN 'prada' THEN 'PRADA'
--     WHEN 'pressure' THEN 'PRESSURE'
--     WHEN 'puma' THEN 'PUMA'
--     WHEN 'qiaodan' THEN 'qiaodan'
--     WHEN 'qnxeey' THEN 'Qnxeey'
--     WHEN 'qianfangdahuangye' THEN 'QIANFANGDAHUANGYE'
--     WHEN 'rass' THEN 'RASS'
--     WHEN 'rastaclat' THEN 'Rastaclat'
--     WHEN 'recoleta' THEN 'RECOLETA'
--     WHEN 'reebok' THEN 'Reebok'
--     WHEN 'renben' THEN 'renben'
--     WHEN 'represent' THEN 'REPRESENT'
--     WHEN 'rigorer' THEN 'RIGORER'
--     WHEN 'ringlove' THEN 'Ringlove'
--     WHEN 'robinhood' THEN 'ROBINHOOD'
--     WHEN 'salomon' THEN 'SALOMON'
--     WHEN 'sandknit' THEN 'SandKnit'
--     WHEN 'skechers' THEN 'Skechers'
--     WHEN 'skmei' THEN 'SKMEI'
--     WHEN 'sleepywalk' THEN 'sleepywalk'
--     WHEN 'smfk' THEN 'SMFK'
--     WHEN 'sockkey' THEN 'SOCKKEY'
--     WHEN 'soie' THEN 'SOIE'
--     WHEN 'sprayground' THEN 'SPRAYGROUND'
--     WHEN 'spyder' THEN 'SPYDER'
--     WHEN 'stussy' THEN 'Stussy'
--     WHEN 'suamoment' THEN 'Suamoment'
--     WHEN 'sunsetmonent' THEN 'SUNSETMONENT'
--     WHEN 'supreme' THEN 'Supreme'
--     WHEN 'swarovski' THEN 'Swarovski'
--     WHEN 'teenmix' THEN 'teenmix'
--     WHEN 'telent' THEN 'TELENT'
--     WHEN 'thrasher' THEN 'Thrasher'
--     WHEN 'timberland' THEN 'Timberland'
--     WHEN 'tkb' THEN 'Tkb'
--     WHEN 'tonlion' THEN 'Tonlion'
--     WHEN 'tucano' THEN 'TUCANO'
--     WHEN 'ugg' THEN 'UGG'
--     WHEN 'unthemed' THEN 'UNthemed'
--     WHEN 'us8acc' THEN 'US8ACC'
--     WHEN 'ux' THEN 'ux'
--     WHEN 'uzis' THEN 'UZIS'
--     WHEN 'vans' THEN 'Vans'
--     WHEN 'veidoorn' THEN 'VEIDOORN'
--     WHEN 'warrior' THEN 'WARRIOR'
--     WHEN 'whoosis' THEN 'WHOOSIS'
--     WHEN 'wodonble' THEN 'WODONBLE'
--     WHEN 'wuji' THEN 'WUJI'
--     WHEN 'xinyinsu' THEN 'XINYINSU'
--     WHEN 'xtep' THEN 'XTEP'
--     WHEN 'yaya' THEN 'yaya'
--     WHEN 'yeezy' THEN 'YEEZY'
--     WHEN 'yichen' THEN 'YICHEN'
--     WHEN 'yoasobi' THEN 'YOASOBI'
--     WHEN 'zanc' THEN 'ZANC'
--     WHEN 'zippo' THEN 'ZIPPO'
--     ELSE firm
-- END
-- WHERE firm IN (
--     '361',  '404mob gang', '7 sevfun', '88rising','adidas', 'a chock', 'a square root', 
--     'a.b.x', 'a02', 'aajf', 'acuc', 'agsdon','anta', 'aokang', 'arcteryx', 'asics', 'atry', 
--     'auldey','baggl', 'balenciaga', 'baleno', 'bandai', 'banpresto', 'barbie', 'barbour', 
--     'beaster', 'beerus', 'beneunder', 'benmyshower', 'bingfei', 'birkenstock', 'bjhg', 
--     'burberry', 'camel', 'caramella', 'cardanro', 'carhartt', 'cartelo', 'casio', 'cat', 
--     'champion', 'chanel', 'clarks', 'clot', 'cmfy', 'coach', 'columbia', 'comowa', 
--     'converse', 'cooraree', 'crocs', 'dand', 'danqin', 'deerway', 'devanro', 'dickies', 
--     'diesel', 'dior', 'disney', 'doraemon', 'dounkol', 'dzp', 'ecco', 'elle', 'enfantin', 
--     'eptison', 'er', 'erke', 'eusu', 'f426', 'fairwhale', 'fastfish', 'feiyue', 
--     'ferragamo', 'fila', 'firemonkey', 'fornines', 'fpa', 'gbxm', 'gelanlu', 'genanx', 
--     'givenchy', 'golf', 'golfcross', 'gucci', 'gudud', 'guuka', 'gwaf', 'gxg', 'iots',
--     'handaiwei', 'hanqiaoriji', 'hermes', 'hla', 'huanai', 'huanqiu', 'jacquemus', 
--     'jaguar', 'jasonwood', 'jeanswest', 'jeep', 'jellycat', 'jifeishi', 'jkem', 'jordan', 
--     'josiny', 'kaltendin', 'kangol', 'kappa', 'kelme', 'keen', 'kenmont', 'khadgar', 
--     'killwinner', 'kith', 'lacoste', 'lanza', 'lee', 'lilbetter', 'lingjie', 'lining', 'LINING',
--     'lululemon', 'longchamp', 'loox', 'maserati', 'melsmao', 'merrell', 'mexican', 
--     'miiow', 'minifocus', 'miniso', 'mizuno', 'mlb', 'mover', 'mpux', 'mulinsen', 
--     'mustkoo', 'muykuy', 'nike', 'nothomme', 'occupy', 'on','ON', 'opox', 'palace', 'peak', 
--     'potdemiel', 'prada', 'pressure', 'puma','qianfangdahuangye', 'qiaodan', 'qnxeey', 'rass', 'rastaclat', 
--     'recoleta', 'reebok', 'renben', 'represent', 'rigorer', 'ringlove', 'robinhood', 
--     'salomon', 'sandknit', 'skechers', 'skmei', 'sleepywalk', 'smfk', 'sockkey', 'soie', 
--     'sprayground', 'spyder', 'stussy', 'suamoment', 'sunsetmonent', 'supreme', 
--     'swarovski', 'teenmix', 'telent', 'thrasher', 'timberland', 'tkb', 'tonlion', 
--     'tucano', 'ugg', 'unthemed', 'us8acc', 'ux', 'uzis', 'vans', 'veidoorn', 'warrior', 
--     'whoosis', 'wodonble', 'wuji', 'xinyinsu', 'xtep', 'yaya', 'yeezy', 'yichen', 
--     'yoasobi', 'zanc', 'zippo'
-- );
-- -- ========================================
-- -- 2. ДОБАВЛЕНИЕ ТИПОВ ДЛЯ ВСЕХ КАТЕГОРИЙ
-- -- ========================================

-- -- Clothes (category_id = 3)
-- WITH cat_ids AS (
--     SELECT id, enum_key FROM product_categories 
--     WHERE enum_key IN ('clothes', 'merch', 'toys')
-- )
-- INSERT INTO product_types (category_id, type_name, enum_key) VALUES
-- -- Clothes
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Футболки', 't-shirt'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Худи', 'hoodie'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Свитеры', 'sweater'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Куртки', 'jacket'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Пуховики', 'puffer'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Парки', 'parka'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Ветровки', 'windbreaker'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Бомберы', 'bomber'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Рубашки', 'shirt'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Штаны', 'pants'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Брюки', 'trousers'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Джинсы', 'jeans'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Шорты', 'shorts'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Лосины', 'leggings'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Шапки', 'hat'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Кепки', 'cap'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Бейсболки', 'baseball'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Платья', 'dress'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Юбки', 'skirt'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Сарафаны', 'sundress'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Ремни', 'belt'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Перчатки', 'gloves'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Шарфы', 'scarf'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Носки', 'socks'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Спортивная', 'sport'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Тренировочная', 'training'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Беговая', 'running'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Домашняя', 'loungewear'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Пижамы', 'pajama'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Халаты', 'robe'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Купальники', 'swimwear'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Кроссовки', 'sneakers'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Ботинки', 'boots'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Туфли', 'shoes'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'clothes'), 'Другое', 'other'),
-- -- Merch
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Кепки', 'hat'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Игрушки', 'toys'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Сумки', 'bag'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Ремни', 'belts'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Серьги', 'earrings'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Перчатки', 'gloves'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Шарфы', 'scarves'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Головные уборы', 'hats'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Тренировка', 'training'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Ботинки', 'boots'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Ожерелья', 'necklaces'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Часы', 'watches'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Кольца', 'rings'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Браслеты', 'bracelets'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Брелоки', 'keychains'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Очки', 'eyewear'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Сумки через плечо', 'shoulder'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Путешествия', 'travel'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Открытый воздух', 'outdoors'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Плоская подошва', 'flats'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Сандалии', 'sandals'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Сумки crossbody', 'crossbody'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Баскетбол', 'basketball'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Бег', 'running'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Рюкзаки', 'backpack'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Кошельки', 'wallets'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'merch'), 'Другое', 'other'),
-- -- Toys
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Фигурки', 'figures'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Карты', 'cards'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Куклы', 'dolls'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Мягкие игрушки', 'plush'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Настольные игры', 'boardgames'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Конструкторы', 'building'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Машинки', 'cars'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Роботы', 'robots'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Пазлы', 'puzzles'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Трансформеры', 'transformers'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Лего', 'lego'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Поп ит', 'popit'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Слаймы', 'slime'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Кинетический песок', 'sand'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Раскраски', 'coloring'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Книги', 'books'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Развивающие', 'educational'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Детское творчество', 'creativity'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Спортивные', 'sports'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Радиоуправляемые', 'rc'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Электронные', 'electronic'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Детские коврики', 'mats'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Палатки', 'tents'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Оружие', 'weapons'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Наборы для опытов', 'experiments'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Мозаика', 'mosaic'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Сборные модели', 'models'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Железная дорога', 'railway'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Батуты', 'trampolines'),
-- ((SELECT id FROM cat_ids WHERE enum_key = 'toys'), 'Другое', 'other')
-- ON CONFLICT (category_id, enum_key) DO NOTHING;
-- -- ========================================
-- -- 3. ФУНКЦИЯ ДЛЯ CLOTHES
-- -- ========================================
-- CREATE OR REPLACE FUNCTION auto_update_clothes_types()
-- RETURNS TABLE(product_id INTEGER, product_name TEXT, old_type TEXT, new_type TEXT) AS
-- $func_clothes$
-- DECLARE
--     clothes_cat_id INTEGER;
--     product_rec RECORD;
--     target_type_id INTEGER;
--     target_type_enum TEXT;
--     old_type_name TEXT;
--     updated_count INTEGER := 0;
-- BEGIN
--     SELECT id INTO clothes_cat_id FROM product_categories WHERE enum_key = 'clothes';
--     IF clothes_cat_id IS NULL THEN 
--         RAISE EXCEPTION 'Category "clothes" not found';
--     END IF;
    
--     CREATE TEMP TABLE update_results_clothes (product_id INTEGER, product_name TEXT, old_type TEXT, new_type TEXT);
    
--     FOR product_rec IN 
--         SELECT p.id, p.name, p.type, pt.type_name as current_type, pt.enum_key
--         FROM products p
--         JOIN product_types pt ON p.type = pt.id
--         WHERE p.category = clothes_cat_id
--     LOOP
--         old_type_name := product_rec.current_type;
        
--         target_type_enum := CASE
--             WHEN product_rec.name ILIKE '%футболк%' OR product_rec.name ILIKE '%t-shirt%' OR 
--                  product_rec.name ILIKE '%t shirt%' OR product_rec.name ILIKE '%tshirt%' OR
--                  product_rec.name ILIKE '%майк%' OR product_rec.name ILIKE '%поло%' THEN 't-shirt'
--             WHEN product_rec.name ILIKE '%худи%' OR product_rec.name ILIKE '%hoodie%' OR
--                  product_rec.name ILIKE '%толстовк%' OR product_rec.name ILIKE '%свитшот%' THEN 'hoodie'
--             WHEN product_rec.name ILIKE '%рубашк%' OR product_rec.name ILIKE '%shirt%' THEN 'shirt'
--             WHEN product_rec.name ILIKE '%свитер%' OR product_rec.name ILIKE '%sweater%' THEN 'sweater'
--             WHEN product_rec.name ILIKE '%куртк%' OR product_rec.name ILIKE '%jacket%' THEN 'jacket'
--             WHEN product_rec.name ILIKE '%пуховик%' OR product_rec.name ILIKE '%puffer%' THEN 'puffer'
--             WHEN product_rec.name ILIKE '%парк%' OR product_rec.name ILIKE '%parka%' THEN 'parka'
--             WHEN product_rec.name ILIKE '%ветровк%' OR product_rec.name ILIKE '%windbreaker%' THEN 'windbreaker'
--             WHEN product_rec.name ILIKE '%бомбер%' OR product_rec.name ILIKE '%bomber%' THEN 'bomber'
--             WHEN product_rec.name ILIKE '%штаны%' OR product_rec.name ILIKE '%pants%' THEN 'pants'
--             WHEN product_rec.name ILIKE '%брюк%' OR product_rec.name ILIKE '%trousers%' THEN 'trousers'
--             WHEN product_rec.name ILIKE '%джинс%' OR product_rec.name ILIKE '%jeans%' THEN 'jeans'
--             WHEN product_rec.name ILIKE '%шорт%' OR product_rec.name ILIKE '%shorts%' THEN 'shorts'
--             WHEN product_rec.name ILIKE '%лосин%' OR product_rec.name ILIKE '%leggings%' THEN 'leggings'
--             WHEN product_rec.name ILIKE '%шапк%' OR product_rec.name ILIKE '%hat%' THEN 'hat'
--             WHEN product_rec.name ILIKE '%кепк%' OR product_rec.name ILIKE '%cap%' THEN 'cap'
--             WHEN product_rec.name ILIKE '%бейсболк%' OR product_rec.name ILIKE '%baseball%' THEN 'baseball'
--             WHEN product_rec.name ILIKE '%плать%' OR product_rec.name ILIKE '%dress%' THEN 'dress'
--             WHEN product_rec.name ILIKE '%юбк%' OR product_rec.name ILIKE '%skirt%' THEN 'skirt'
--             WHEN product_rec.name ILIKE '%сарафан%' OR product_rec.name ILIKE '%sundress%' THEN 'sundress'
--             WHEN product_rec.name ILIKE '%ремень%' OR product_rec.name ILIKE '%belt%' THEN 'belt'
--             WHEN product_rec.name ILIKE '%перчатк%' OR product_rec.name ILIKE '%gloves%' THEN 'gloves'
--             WHEN product_rec.name ILIKE '%шарф%' OR product_rec.name ILIKE '%scarf%' THEN 'scarf'
--             WHEN product_rec.name ILIKE '%носк%' OR product_rec.name ILIKE '%socks%' THEN 'socks'
--             WHEN product_rec.name ILIKE '%спортивн%' OR product_rec.name ILIKE '%sport%' THEN 'sport'
--             WHEN product_rec.name ILIKE '%тренировочн%' OR product_rec.name ILIKE '%training%' THEN 'training'
--             WHEN product_rec.name ILIKE '%бегов%' OR product_rec.name ILIKE '%running%' THEN 'running'
--             WHEN product_rec.name ILIKE '%домашн%' OR product_rec.name ILIKE '%loungewear%' THEN 'loungewear'
--             WHEN product_rec.name ILIKE '%пижам%' OR product_rec.name ILIKE '%pajama%' THEN 'pajama'
--             WHEN product_rec.name ILIKE '%халат%' OR product_rec.name ILIKE '%robe%' THEN 'robe'
--             WHEN product_rec.name ILIKE '%купальник%' OR product_rec.name ILIKE '%swimwear%' THEN 'swimwear'
--             WHEN product_rec.name ILIKE '%кроссовк%' OR product_rec.name ILIKE '%sneakers%' THEN 'sneakers'
--             WHEN product_rec.name ILIKE '%ботинк%' OR product_rec.name ILIKE '%boots%' THEN 'boots'
--             WHEN product_rec.name ILIKE '%туфл%' OR product_rec.name ILIKE '%shoes%' THEN 'shoes'
--             ELSE 'other'
--         END;
        
--         SELECT id INTO target_type_id FROM product_types 
--         WHERE category_id = clothes_cat_id AND enum_key = target_type_enum;
        
--         IF target_type_id IS NOT NULL AND product_rec.type != target_type_id THEN
--             UPDATE products SET type = target_type_id WHERE id = product_rec.id;
--             updated_count := updated_count + 1;
--             INSERT INTO update_results_clothes VALUES (product_rec.id, product_rec.name, old_type_name, target_type_enum);
--         END IF;
--     END LOOP;
    
--     RAISE NOTICE 'Обновлено товаров в clothes: %', updated_count;
--     RETURN QUERY SELECT * FROM update_results_clothes;
--     DROP TABLE update_results_clothes;
-- END;
-- $func_clothes$ LANGUAGE plpgsql;

-- -- ========================================
-- -- 4. ФУНКЦИЯ ДЛЯ MERCH
-- -- ========================================
-- CREATE OR REPLACE FUNCTION auto_update_merch_types()
-- RETURNS TABLE(product_id INTEGER, product_name TEXT, old_type TEXT, new_type TEXT) AS
-- $func_merch$
-- DECLARE
--     merch_cat_id INTEGER;  -- Убрали := 2
--     product_rec RECORD;
--     target_type_id INTEGER;
--     target_type_enum TEXT;
--     old_type_name TEXT;
--     updated_count INTEGER := 0;
-- BEGIN
--     -- Динамически получаем ID категории merch
--     SELECT id INTO merch_cat_id FROM product_categories WHERE enum_key = 'merch';
--     IF merch_cat_id IS NULL THEN 
--         RAISE EXCEPTION 'Category "merch" not found';
--     END IF;
    
--     CREATE TEMP TABLE update_results_merch (product_id INTEGER, product_name TEXT, old_type TEXT, new_type TEXT);
    
--     FOR product_rec IN 
--         SELECT p.id, p.name, p.type, pt.type_name as current_type, pt.enum_key
--         FROM products p
--         JOIN product_types pt ON p.type = pt.id
--         WHERE p.category = merch_cat_id
--     LOOP
--         old_type_name := product_rec.current_type;
        
--         target_type_enum := CASE
--             WHEN product_rec.name ILIKE '%кепк%' OR product_rec.name ILIKE '%hat%' OR
--                  product_rec.name ILIKE '%шапк%' OR product_rec.name ILIKE '%бейсболк%' THEN 'hat'
--             WHEN product_rec.name ILIKE '%игрушк%' OR product_rec.name ILIKE '%toys%' THEN 'toys'
--             WHEN product_rec.name ILIKE '%сумк%' OR product_rec.name ILIKE '%bag%' THEN 'bag'
--             WHEN product_rec.name ILIKE '%ремень%' OR product_rec.name ILIKE '%belt%' THEN 'belts'
--             WHEN product_rec.name ILIKE '%серьг%' OR product_rec.name ILIKE '%earring%' THEN 'earrings'
--             WHEN product_rec.name ILIKE '%перчатк%' OR product_rec.name ILIKE '%gloves%' THEN 'gloves'
--             WHEN product_rec.name ILIKE '%шарф%' OR product_rec.name ILIKE '%scarf%' THEN 'scarves'
--             WHEN product_rec.name ILIKE '%тренировк%' OR product_rec.name ILIKE '%training%' THEN 'training'
--             WHEN product_rec.name ILIKE '%ботинк%' OR product_rec.name ILIKE '%boots%' THEN 'boots'
--             WHEN product_rec.name ILIKE '%ожерель%' OR product_rec.name ILIKE '%necklace%' THEN 'necklaces'
--             WHEN product_rec.name ILIKE '%час%' OR product_rec.name ILIKE '%watch%' THEN 'watches'
--             WHEN product_rec.name ILIKE '%кольц%' OR product_rec.name ILIKE '%ring%' THEN 'rings'
--             WHEN product_rec.name ILIKE '%браслет%' OR product_rec.name ILIKE '%bracelet%' THEN 'bracelets'
--             WHEN product_rec.name ILIKE '%брелок%' OR product_rec.name ILIKE '%keychain%' THEN 'keychains'
--             WHEN product_rec.name ILIKE '%очк%' OR product_rec.name ILIKE '%glass%' THEN 'eyewear'
--             WHEN product_rec.name ILIKE '%плеч%' OR product_rec.name ILIKE '%shoulder%' THEN 'shoulder'
--             WHEN product_rec.name ILIKE '%путешеств%' OR product_rec.name ILIKE '%travel%' THEN 'travel'
--             WHEN product_rec.name ILIKE '%открыт%воздух%' OR product_rec.name ILIKE '%outdoors%' THEN 'outdoors'
--             WHEN product_rec.name ILIKE '%плоск%подошв%' OR product_rec.name ILIKE '%flats%' THEN 'flats'
--             WHEN product_rec.name ILIKE '%сандал%' OR product_rec.name ILIKE '%sandals%' THEN 'sandals'
--             WHEN product_rec.name ILIKE '%crossbody%' THEN 'crossbody'
--             WHEN product_rec.name ILIKE '%баскетбол%' OR product_rec.name ILIKE '%basketball%' THEN 'basketball'
--             WHEN product_rec.name ILIKE '%бег%' OR product_rec.name ILIKE '%running%' THEN 'running'
--             WHEN product_rec.name ILIKE '%рюкзак%' OR product_rec.name ILIKE '%backpack%' THEN 'backpack'
--             WHEN product_rec.name ILIKE '%кошелек%' OR product_rec.name ILIKE '%wallet%' THEN 'wallets'
--             ELSE 'other'
--         END;
        
--         SELECT id INTO target_type_id FROM product_types 
--         WHERE category_id = merch_cat_id AND enum_key = target_type_enum;
        
--         IF target_type_id IS NOT NULL AND product_rec.type != target_type_id THEN
--             UPDATE products SET type = target_type_id WHERE id = product_rec.id;
--             updated_count := updated_count + 1;
--             INSERT INTO update_results_merch VALUES (product_rec.id, product_rec.name, old_type_name, target_type_enum);
--         END IF;
--     END LOOP;
    
--     RAISE NOTICE 'Обновлено товаров в merch: %', updated_count;
--     RETURN QUERY SELECT * FROM update_results_merch;
--     DROP TABLE update_results_merch;
-- END;
-- $func_merch$ LANGUAGE plpgsql;

-- -- ========================================
-- -- 5. ФУНКЦИЯ ДЛЯ TOYS
-- -- ========================================
-- CREATE OR REPLACE FUNCTION auto_update_toys_types()
-- RETURNS TABLE(product_id INTEGER, product_name TEXT, old_type TEXT, new_type TEXT) AS
-- $func_toys$
-- DECLARE
--     toys_cat_id INTEGER;  -- Убрали := 4
--     product_rec RECORD;
--     target_type_id INTEGER;
--     target_type_enum TEXT;
--     old_type_name TEXT;
--     updated_count INTEGER := 0;
-- BEGIN
--     -- Динамически получаем ID категории toys
--     SELECT id INTO toys_cat_id FROM product_categories WHERE enum_key = 'toys';
--     IF toys_cat_id IS NULL THEN 
--         RAISE EXCEPTION 'Category "toys" not found';
--     END IF;
    
--     CREATE TEMP TABLE update_results_toys (product_id INTEGER, product_name TEXT, old_type TEXT, new_type TEXT);
    
--     FOR product_rec IN 
--         SELECT p.id, p.name, p.type, pt.type_name as current_type, pt.enum_key
--         FROM products p
--         JOIN product_types pt ON p.type = pt.id
--         WHERE p.category = toys_cat_id
--     LOOP
--         old_type_name := product_rec.current_type;
        
--         target_type_enum := CASE
--             WHEN product_rec.name ILIKE '%фигурк%' OR product_rec.name ILIKE '%figure%' THEN 'figures'
--             WHEN product_rec.name ILIKE '%карт%' OR product_rec.name ILIKE '%cards%' THEN 'cards'
--             WHEN product_rec.name ILIKE '%кукл%' OR product_rec.name ILIKE '%doll%' THEN 'dolls'
--             WHEN product_rec.name ILIKE '%мягк%' OR product_rec.name ILIKE '%plush%' THEN 'plush'
--             WHEN product_rec.name ILIKE '%настольн%' OR product_rec.name ILIKE '%board%' THEN 'boardgames'
--             WHEN product_rec.name ILIKE '%конструктор%' OR product_rec.name ILIKE '%building%' THEN 'building'
--             WHEN product_rec.name ILIKE '%машинк%' OR product_rec.name ILIKE '%cars%' THEN 'cars'
--             WHEN product_rec.name ILIKE '%робот%' OR product_rec.name ILIKE '%robot%' THEN 'robots'
--             WHEN product_rec.name ILIKE '%пазл%' OR product_rec.name ILIKE '%puzzle%' THEN 'puzzles'
--             WHEN product_rec.name ILIKE '%трансформер%' OR product_rec.name ILIKE '%transform%' THEN 'transformers'
--             WHEN product_rec.name ILIKE '%лего%' OR product_rec.name ILIKE '%lego%' THEN 'lego'
--             WHEN product_rec.name ILIKE '%поп ит%' OR product_rec.name ILIKE '%popit%' THEN 'popit'
--             WHEN product_rec.name ILIKE '%слайм%' OR product_rec.name ILIKE '%slime%' THEN 'slime'
--             WHEN product_rec.name ILIKE '%песок%' OR product_rec.name ILIKE '%sand%' THEN 'sand'
--             WHEN product_rec.name ILIKE '%раскраск%' OR product_rec.name ILIKE '%coloring%' THEN 'coloring'
--             WHEN product_rec.name ILIKE '%книг%' OR product_rec.name ILIKE '%book%' THEN 'books'
--             WHEN product_rec.name ILIKE '%развива%' OR product_rec.name ILIKE '%educational%' THEN 'educational'
--             WHEN product_rec.name ILIKE '%творчеств%' OR product_rec.name ILIKE '%creativity%' THEN 'creativity'
--             WHEN product_rec.name ILIKE '%спортивн%' OR product_rec.name ILIKE '%sports%' THEN 'sports'
--             WHEN product_rec.name ILIKE '%радиоуправл%' OR product_rec.name ILIKE '%rc%' THEN 'rc'
--             WHEN product_rec.name ILIKE '%электронн%' OR product_rec.name ILIKE '%electronic%' THEN 'electronic'
--             WHEN product_rec.name ILIKE '%коврик%' OR product_rec.name ILIKE '%mats%' THEN 'mats'
--             WHEN product_rec.name ILIKE '%палатк%' OR product_rec.name ILIKE '%tent%' THEN 'tents'
--             WHEN product_rec.name ILIKE '%оружи%' OR product_rec.name ILIKE '%weapon%' THEN 'weapons'
--             WHEN product_rec.name ILIKE '%опыт%' OR product_rec.name ILIKE '%experiment%' THEN 'experiments'
--             WHEN product_rec.name ILIKE '%мозаик%' OR product_rec.name ILIKE '%mosaic%' THEN 'mosaic'
--             WHEN product_rec.name ILIKE '%сборн%модел%' OR product_rec.name ILIKE '%model%' THEN 'models'
--             WHEN product_rec.name ILIKE '%железн%дорог%' OR product_rec.name ILIKE '%railway%' THEN 'railway'
--             WHEN product_rec.name ILIKE '%батут%' OR product_rec.name ILIKE '%trampoline%' THEN 'trampolines'
--             ELSE 'other'
--         END;
        
--         SELECT id INTO target_type_id FROM product_types 
--         WHERE category_id = toys_cat_id AND enum_key = target_type_enum;
        
--         IF target_type_id IS NOT NULL AND product_rec.type != target_type_id THEN
--             UPDATE products SET type = target_type_id WHERE id = product_rec.id;
--             updated_count := updated_count + 1;
--             INSERT INTO update_results_toys VALUES (product_rec.id, product_rec.name, old_type_name, target_type_enum);
--         END IF;
--     END LOOP;
    
--     RAISE NOTICE 'Обновлено товаров в toys: %', updated_count;
--     RETURN QUERY SELECT * FROM update_results_toys;
--     DROP TABLE update_results_toys;
-- END;
-- $func_toys$ LANGUAGE plpgsql;

-- -- ========================================
-- -- 6. ЗАПУСК ВСЕХ ФУНКЦИЙ
-- -- ========================================
-- DO $$
-- BEGIN
--     PERFORM auto_update_clothes_types();
--     PERFORM auto_update_merch_types();
--     PERFORM auto_update_toys_types();
-- END $$;

-- -- ========================================
-- -- 7. УДАЛЕНИЕ НЕИСПОЛЬЗУЕМЫХ ТИПОВ
-- -- ========================================
-- DELETE FROM product_types WHERE category_id = 3 AND enum_key != 'other'
-- AND NOT EXISTS (SELECT 1 FROM products WHERE products.type = product_types.id);

-- DELETE FROM product_types WHERE category_id = 2 AND enum_key != 'other'
-- AND NOT EXISTS (SELECT 1 FROM products WHERE products.type = product_types.id);

-- DELETE FROM product_types WHERE category_id = 4 AND enum_key != 'other'
-- AND NOT EXISTS (SELECT 1 FROM products WHERE products.type = product_types.id);

-- DELETE FROM product_types WHERE category_id = 1 AND enum_key != 'other'
-- AND NOT EXISTS (SELECT 1 FROM products WHERE products.type = product_types.id);


-- DELETE FROM public.products 
-- WHERE id NOT IN (
--     SELECT MIN(id) 
--     FROM public.products 
--     GROUP BY article
-- );

-- -- 4. (Опционально) Очищаем NULL article если есть
-- DELETE FROM public.products WHERE article IS NULL;

-- DELETE FROM public.products WHERE firm = '';
-- ALTER TABLE brands 
-- ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- -- Добавляем колонку is_active в brand_lines
-- ALTER TABLE brand_lines 
-- ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;


-- CREATE TABLE public.uniquecustomers (
-- 		id serial PRIMARY KEY NOT NULL,
-- 		creationTime DATE NOT NULL DEFAULT CURRENT_DATE,
-- 		history INTEGER[] NOT NULL
-- );

-- ALTER TABLE public.brands 
-- RENAME COLUMN logo_path TO image_path;

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_brand_id ON products(brand_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status ON products(status);

-- -- Для брендов (для поиска и сортировки)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brands_name ON brands(name);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brands_sort_order ON brands(sort_order);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brands_created_at ON brands(created_at);

-- -- Для brand_lines
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brand_lines_brand_id ON brand_lines(brand_id);









-- -- Индексы для быстрой сортировки
-- CREATE INDEX idx_brands_stats_total_products ON brands_stats(total_products);
-- CREATE INDEX idx_brands_stats_active_products ON brands_stats(active_products);

-- -- Триггеры для автоматического обновления
-- CREATE OR REPLACE FUNCTION update_brands_stats()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- Пересчет статистики для затронутого бренда
--     WITH stats AS (
--         SELECT 
--             COALESCE(p.brand_id, NEW.brand_id, OLD.brand_id) as brand_id,
--             COUNT(p.id) as total_products,
--             COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_products,
--             COUNT(CASE WHEN p.status != 'active' THEN 1 END) as inactive_products,
--             COUNT(CASE WHEN pc.enum_key = 'sneakers' THEN 1 END) as sneakers_count,
--             COUNT(CASE WHEN pc.enum_key = 'merch' THEN 1 END) as merch_count,
--             COUNT(CASE WHEN pc.enum_key = 'clothes' THEN 1 END) as clothes_count,
--             COUNT(CASE WHEN pc.enum_key = 'toys' THEN 1 END) as toys_count
--         FROM products p
--         LEFT JOIN product_categories pc ON p.category = pc.id
--         WHERE p.brand_id = COALESCE(NEW.brand_id, OLD.brand_id)
--         GROUP BY p.brand_id
--     )
--     INSERT INTO brands_stats (brand_id, total_products, active_products, inactive_products, 
--                               sneakers_count, merch_count, clothes_count, toys_count, updated_at)
--     SELECT 
--         brand_id, total_products, active_products, inactive_products,
--         sneakers_count, merch_count, clothes_count, toys_count, NOW()
--     FROM stats
--     ON CONFLICT (brand_id) 
--     DO UPDATE SET
--         total_products = EXCLUDED.total_products,
--         active_products = EXCLUDED.active_products,
--         inactive_products = EXCLUDED.inactive_products,
--         sneakers_count = EXCLUDED.sneakers_count,
--         merch_count = EXCLUDED.merch_count,
--         clothes_count = EXCLUDED.clothes_count,
--         toys_count = EXCLUDED.toys_count,
--         updated_at = EXCLUDED.updated_at;
    
--     RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Триггеры на изменения в products
-- CREATE TRIGGER trigger_products_stats
-- AFTER INSERT OR UPDATE OR DELETE ON products
-- FOR EACH ROW EXECUTE FUNCTION update_brands_stats();

-- -- Триггеры на изменения в brand_lines
-- CREATE OR REPLACE FUNCTION update_brands_lines_count()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     INSERT INTO brands_stats (brand_id, lines_count, updated_at)
--     VALUES (COALESCE(NEW.brand_id, OLD.brand_id), 
--             (SELECT COUNT(*) FROM brand_lines WHERE brand_id = COALESCE(NEW.brand_id, OLD.brand_id)),
--             NOW())
--     ON CONFLICT (brand_id) 
--     DO UPDATE SET
--         lines_count = EXCLUDED.lines_count,
--         updated_at = EXCLUDED.updated_at;
--     RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trigger_brand_lines_stats
-- AFTER INSERT OR UPDATE OR DELETE ON brand_lines
-- FOR EACH ROW EXECUTE FUNCTION update_brands_lines_count();



-- INSERT INTO brands_stats (brand_id, total_products, active_products, inactive_products, 
--                           sneakers_count, merch_count, clothes_count, toys_count, lines_count, updated_at)
-- SELECT 
--     b.id,
--     COUNT(DISTINCT p.id),
--     COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END),
--     COUNT(DISTINCT CASE WHEN p.status != 'active' THEN p.id END),
--     COUNT(DISTINCT CASE WHEN pc.enum_key = 'sneakers' THEN p.id END),
--     COUNT(DISTINCT CASE WHEN pc.enum_key = 'merch' THEN p.id END),
--     COUNT(DISTINCT CASE WHEN pc.enum_key = 'clothes' THEN p.id END),
--     COUNT(DISTINCT CASE WHEN pc.enum_key = 'toys' THEN p.id END),
--     COUNT(DISTINCT bl.id),
--     NOW()
-- FROM brands b
-- LEFT JOIN products p ON b.id = p.brand_id
-- LEFT JOIN product_categories pc ON p.category = pc.id
-- LEFT JOIN brand_lines bl ON b.id = bl.brand_id
-- GROUP BY b.id
-- ON CONFLICT (brand_id) DO UPDATE SET
--     total_products = EXCLUDED.total_products,
--     active_products = EXCLUDED.active_products,
--     inactive_products = EXCLUDED.inactive_products,
--     sneakers_count = EXCLUDED.sneakers_count,
--     merch_count = EXCLUDED.merch_count,
--     clothes_count = EXCLUDED.clothes_count,
--     toys_count = EXCLUDED.toys_count,
--     lines_count = EXCLUDED.lines_count,
--     updated_at = EXCLUDED.updated_at;

-- CREATE TABLE IF NOT EXISTS public.discount_rules (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     description TEXT,
--     discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
--     discount_value DECIMAL(10,2) NOT NULL,
--     starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     ends_at TIMESTAMPTZ,
--     is_active BOOLEAN DEFAULT true,
--     priority INTEGER DEFAULT 0,
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- CREATE TABLE IF NOT EXISTS public.discount_rule_items (
--     id SERIAL PRIMARY KEY,
--     rule_id INTEGER NOT NULL REFERENCES discount_rules(id) ON DELETE CASCADE,
--     item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('brand', 'line', 'product')),
--     item_id INTEGER NOT NULL,
--     UNIQUE(rule_id, item_type, item_id)
-- );


-- ALTER TABLE brand_lines ADD CONSTRAINT brand_lines_brand_id_slug_key UNIQUE(brand_id, slug);

-- DO $$
-- BEGIN
--     IF NOT EXISTS (
--         SELECT 1 FROM pg_constraint 
--         WHERE conrelid = 'products'::regclass 
--           AND contype = 'u' 
--           AND conname = 'products_article_key'
--     ) THEN
--         ALTER TABLE products ADD CONSTRAINT products_article_key UNIQUE(article);
--     END IF;
-- END $$;

-- ALTER TABLE products DROP COLUMN IF EXISTS firm;
-- ALTER TABLE products DROP COLUMN IF EXISTS line;


-- ALTER TABLE products 
-- ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
-- ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ALTER TABLE discount 
-- ADD COLUMN rule_id INTEGER REFERENCES discount_rules(id);

-- ALTER TABLE brands 
-- ADD COLUMN founded_year INTEGER;

-- ALTER TABLE brand_lines 
-- ADD COLUMN image_path TEXT;

-- линии удаляются вместе с брендом
-- ALTER TABLE brand_lines
--   ADD CONSTRAINT fk_brand_lines_brand
--   FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

-- -- товары НЕ удаляются – бренд удалить нельзя, пока есть товары
-- ALTER TABLE products
--   ADD CONSTRAINT fk_products_brand
--   FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT;




CREATE TABLE IF NOT EXISTS public.admin_invites (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    role admin_role_enum NOT NULL DEFAULT 'admin',
    token VARCHAR(64) UNIQUE NOT NULL,
    invited_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    used_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ Главный индекс: только одно активное приглашение на email
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_invites_active_email 
ON admin_invites (email) 
WHERE used_at IS NULL AND expires_at > NOW();

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_admin_invites_token 
ON admin_invites(token) 
WHERE used_at IS NULL AND expires_at > NOW();

CREATE INDEX IF NOT EXISTS idx_admin_invites_email 
ON admin_invites(email) 
WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_invites_expires 
ON admin_invites(expires_at) 
WHERE used_at IS NULL;

-- Индекс для поиска приглашений конкретного админа
CREATE INDEX IF NOT EXISTS idx_admin_invites_invited_by 
ON admin_invites(invited_by);