
INSERT INTO colors (enum_key, name, hex_code) 
        VALUES ('red', 'Красный', '#FF0000'),
('green', 'Зеленый', '#00FF00'),
('blue', 'Синий', '#0000FF'),
('yellow', 'Желтый', '#FFFF00'),
('black', 'Черный', '#000000'),
('white', 'Белый', '#FFFFFF'),
('orange', 'Оранжевый', '#FFA500'),
('purple', 'Фиолетовый', '#800080'),
('pink', 'Розовый', '#FFC0CB'),
('brown', 'Коричневый', '#A52A2A'),
('gray', 'Серый', '#808080'),
('beige', 'Бежевый', '#F5F5DC'),
('navy', 'Темно-синий', '#000080'),
('turquoise', 'Бирюзовый', '#40E0D0'),
('gold', 'Золотой', '#FFD700'),
('silver', 'Серебряный', '#C0C0C0'),
('multicolor', 'Разноцветный', '#FFFFFF'),
('transparent', 'Прозрачный', '#FFFFFF00')
        ON CONFLICT (enum_key) DO NOTHING;



INSERT INTO product_categories (name, enum_key, image_path) VALUES
('Кроссовки', 'sneakers', 'sneakers.svg'),
('Мерч', 'merch', 'merch.svg'),
('Одежда', 'clothes', 'clothes.svg'),
('Игрушки', 'toys', 'toys.svg') ON CONFLICT (enum_key) DO NOTHING;

INSERT INTO product_types (category_id, type_name, enum_key) VALUES
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'Скейтбординг', 'skateboarding'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'Другое', 'other'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'Другое', 'other'),
((SELECT id FROM product_categories WHERE enum_key = 'clothes'), 'Другое', 'other'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'Бутсы', 'cleats'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'Ботинки', 'boots'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'Открытый воздух', 'outdoors'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'Ботинки', 'boots'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'Сандалии', 'sandals'),
((SELECT id FROM product_categories WHERE enum_key = 'clothes'), 'Путешествия', 'travel'),
((SELECT id FROM product_categories WHERE enum_key = 'clothes'), 'Тренировка', 'training'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'Тренировка', 'training'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'Бег', 'running'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'Открытый воздух', 'outdoors'),
((SELECT id FROM product_categories WHERE enum_key = 'clothes'), 'Открытый воздух', 'outdoors'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'Плоская подошва', 'flats'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'Каблуки', 'heels'),
((SELECT id FROM product_categories WHERE enum_key = 'toys'), 'Другое', 'other'),
((SELECT id FROM product_categories WHERE enum_key = 'clothes'), 'Ботинки', 'boots'),
((SELECT id FROM product_categories WHERE enum_key = 'toys'), 'Бутсы', 'cleats'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'Тренировка', 'training'),
((SELECT id FROM product_categories WHERE enum_key = 'clothes'), 'Бег', 'running'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'Рюкзак', 'backpack'),
((SELECT id FROM product_categories WHERE enum_key = 'toys'), 'Бег', 'running'),
((SELECT id FROM product_categories WHERE enum_key = 'toys'), 'Рюкзак', 'backpack'),
((SELECT id FROM product_categories WHERE enum_key = 'toys'), 'Путешествия', 'travel'),
((SELECT id FROM product_categories WHERE enum_key = 'toys'), 'Скейтбординг', 'skateboarding'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'Путешествия', 'travel'),
((SELECT id FROM product_categories WHERE enum_key = 'clothes'), 'Скейтбординг', 'skateboarding'),
((SELECT id FROM product_categories WHERE enum_key = 'toys'), 'Тренировка', 'training'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'dance-shoes', 'dance-shoes'),
((SELECT id FROM product_categories WHERE enum_key = 'clothes'), 'Бутсы', 'cleats'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'Бег', 'running'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'Сандалии', 'sandals'),
((SELECT id FROM product_categories WHERE enum_key = 'clothes'), 'Каблуки', 'heels'),
((SELECT id FROM product_categories WHERE enum_key = 'toys'), 'Ботинки', 'boots') ON CONFLICT (category_id, enum_key) DO NOTHING;




