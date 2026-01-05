CREATE TYPE  public.status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE  public.delivery_enum AS ENUM ('own', 'express', 'cdek','curier');
CREATE TYPE public.product_source_enum AS ENUM ('snickers', 'solomerch', 'clothes');
CREATE TYPE public.clothes_enum AS ENUM ('t-shirt', 'hoodie', 'sweatshirt', 'jacket', 'pants', 'shorts','other');
CREATE TYPE public.merch_enum AS ENUM ('hat', 'toys', 'bag','other');
CREATE TYPE public.snickers_enum AS ENUM ('slepowers','other');
CREATE TYPE public.body_enum AS ENUM ('child', 'woman', 'man');


CREATE TABLE colors (
    id SERIAL PRIMARY KEY,
    enum_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    hex_code VARCHAR(9) NOT NULL
);


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
    

CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
	image_path TEXT,
    name VARCHAR(50) NOT NULL UNIQUE,           -- Название категории (человекочитаемое)
    enum_key VARCHAR(50) NOT NULL UNIQUE        -- Ключ для ENUM (например, 'ELECTRONICS')
);

CREATE TABLE product_types (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
    type_name VARCHAR(50) NOT NULL,              -- Название типа (человекочитаемое)
    enum_key VARCHAR(50) NOT NULL,               -- Ключ для ENUM типа
    UNIQUE (category_id, enum_key)               -- Уникальная комбинация категория+тип
);

-- Индексы для производительности
CREATE INDEX idx_product_types_category ON product_types(category_id);
CREATE INDEX idx_product_types_enum_key ON product_types(enum_key);


INSERT INTO product_categories (name, enum_key, image_path) VALUES
('Одежда', 'clothes', 'clothes.svg'),
('Мерч', 'merch', 'merch.svg'),
('Кроссовки', 'sneakers', 'sneakers.svg'),
('toys', 'toys', 'toys.svg') ON CONFLICT (enum_key) DO NOTHING;

INSERT INTO product_types (category_id, type_name, enum_key) VALUES
((SELECT id FROM product_categories WHERE enum_key = 'clothes'), 'Другое', 'other'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'gloves', 'gloves'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'basketball', 'basketball'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'Другое', 'other'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'Скейтбординг', 'skateboarding'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'running', 'running'),
((SELECT id FROM product_categories WHERE enum_key = 'clothes'), 'running', 'running'),
((SELECT id FROM product_categories WHERE enum_key = 'clothes'), 'training', 'training'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'Другое', 'other'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'heels', 'heels'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'cleats', 'cleats'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'scarves', 'scarves'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'boots', 'boots'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'lifestyle', 'lifestyle'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'rings', 'rings'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'earrings', 'earrings'),
((SELECT id FROM product_categories WHERE enum_key = 'clothes'), 'basketball', 'basketball'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'hats', 'hats'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'training', 'training'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'outdoors', 'outdoors'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'boots', 'boots'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'eyewear', 'eyewear'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'belts', 'belts'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'necklaces', 'necklaces'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'Тапочки', 'slippers'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'sandals', 'sandals'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'bracelets', 'bracelets'),
((SELECT id FROM product_categories WHERE enum_key = 'clothes'), 'shoulder', 'shoulder'),
((SELECT id FROM product_categories WHERE enum_key = 'toys'), 'boots', 'boots'),
((SELECT id FROM product_categories WHERE enum_key = 'sneakers'), 'flats', 'flats'),
((SELECT id FROM product_categories WHERE enum_key = 'clothes'), 'travel', 'travel'),
((SELECT id FROM product_categories WHERE enum_key = 'merch'), 'sandals', 'sandals') ON CONFLICT (category_id, enum_key) DO NOTHING;

CREATE TABLE public.products (
    id serial PRIMARY KEY NOT NULL,
    qId text  NOT NULL,
    name text NOT NULL,
    firm text NOT NULL,
    line text NOT NULL,
    image_path text NOT NULL,
    minprice integer NOT NULL,
    maxprice integer NOT NULL,
    type INTEGER NOT NULL REFERENCES product_types(id),
	category INTEGER NOT NULL REFERENCES product_categories(id),
    article text NOT NULL,
    date text,
    description text,
	bodytype public.body_enum NOT NULL DEFAULT 'man',
	image_count integer NOT NULL,
    sizes JSONB
);
CREATE TABLE product_colors (
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color_id INT NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, color_id) 
);


     
    

CREATE INDEX idx_qId ON public.products(qId);


CREATE TABLE IF NOT EXISTS public.discount (
    id serial PRIMARY KEY NOT NULL,
    productid INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    value JSONB NOT NULL CHECK (jsonb_typeof(value) = 'object'),
    minprice INT NOT NULL CHECK (minprice >= 0),
    maxdiscprice INT CHECK (maxdiscprice >= 0),
	  created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    
    CONSTRAINT unique_product_discount UNIQUE (productid)
);



-- Индексы для производительности
CREATE INDEX idx_discount_productid ON discount(productid);
CREATE INDEX idx_discount_minprice ON discount(minprice);

CREATE TABLE IF NOT EXISTS public.store_house (
    id serial PRIMARY KEY NOT NULL,
    productid INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Уникальная комбинация товара и размера
    CONSTRAINT unique_product_size UNIQUE (productid, size)
);

-- Индексы
CREATE INDEX idx_store_house_productid ON store_house(productid);
CREATE INDEX idx_store_house_size ON store_house(size);

CREATE TABLE IF NOT EXISTS public.customers (
		id serial PRIMARY KEY NOT NULL ,
		name TEXT,
		secondName TEXT,
		mail TEXT NOT NULL,
		pass BYTEA NOT NULL,
		phone TEXT,
		town TEXT,
		index TEXT,
		sendMail BOOLEAN,
		street TEXT,
		region TEXT,
		home TEXT,
		flat TEXT,
		coordinates INTEGER[]
);


CREATE TABLE IF NOT EXISTS public.verification (
			id serial PRIMARY KEY NOT NULL ,
			token TEXT NOT NULL,
			CustomerID INT  NOT NULL,
			expire TIMESTAMP NOT NULL,
			deleteTime  TIMESTAMP NOT NULL,
			FOREIGN KEY (CustomerID) REFERENCES public.customers(id)
);

CREATE TABLE IF NOT EXISTS public.unregistercustomer (
		id serial PRIMARY KEY NOT NULL ,
		name TEXT NOT NULL,
		secondName TEXT,
		mail TEXT NOT NULL,
		phone TEXT NOT NULL
);


CREATE TABLE public.uniquecustomers (
		id serial PRIMARY KEY NOT NULL,
		creationTime DATE NOT NULL DEFAULT CURRENT_DATE,
		history INTEGER[] NOT NULL
);




CREATE TABLE public.orders (
			id serial PRIMARY KEY,
			CustomerID INT,
			UnregisterCustomerID INT,
			OrderDate DATE  NOT NULL DEFAULT CURRENT_DATE,
			Status status_enum  NOT NULL,
			Hash TEXT  NOT NULL,
			DeliveryPrice INT  NOT NULL,
			DeliveryType public.delivery_enum  NOT NULL,
			FOREIGN KEY (CustomerID) REFERENCES public.customers(id),
			FOREIGN KEY (UnregisterCustomerID) REFERENCES public.unregistercustomer(id)
);

CREATE TABLE public.orderitems (
	id serial PRIMARY KEY NOT NULL,
	OrderID integer NOT NULL,
	ProductId INT NOT NULL ,
	Quantity integer NOT NULL,
	Price integer NOT NULL,
		Image_path TEXT NOT NULL,
				Name TEXT NOT NULL,
	Size text,
	FOREIGN KEY (OrderID) REFERENCES public.orders(id)
);

CREATE TABLE IF NOT EXISTS public.preorder (
			id serial PRIMARY KEY NOT NULL ,
			hashUrl TEXT NOT NULL,
			updateTime DATE
);
CREATE TABLE IF NOT EXISTS public.preorderitems (
				id serial PRIMARY KEY NOT NULL ,
				OrderID INT NOT NULL,
				ProductId INT NOT NULL ,
				Quantity INT NOT NULL,
				Price integer NOT NULL,
				Image_path TEXT NOT NULL,
				Name TEXT NOT NULL,
				Size TEXT,
				FOREIGN KEY (OrderID) REFERENCES public.preorder(id)
);
CREATE TABLE IF NOT EXISTS public.orderAddress (
		id serial PRIMARY KEY NOT NULL ,
		town TEXT NOT NULL,
		index TEXT NOT NULL,
		sendMail BOOLEAN,
		street TEXT,
		region TEXT,
		house TEXT,
		OrderID integer NOT NULL,
		flat TEXT,
		coordinates TEXT[] NOT NULL,
		FOREIGN KEY (OrderID) REFERENCES public.orders(id)
);


CREATE TABLE IF NOT EXISTS public.preorderAddress (
    id serial PRIMARY KEY NOT NULL,
    town TEXT NOT NULL,
    index TEXT NOT NULL,
    sendMail BOOLEAN,
    street TEXT,
    region TEXT,
    house TEXT,
    OrderID integer NOT NULL,
    flat TEXT,
    coordinates TEXT[] NOT NULL,
    FOREIGN KEY (OrderID) REFERENCES public.preorder(id)
);

