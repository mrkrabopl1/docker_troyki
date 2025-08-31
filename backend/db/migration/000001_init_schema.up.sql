CREATE TYPE  public.status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE  public.delivery_enum AS ENUM ('own', 'express', 'cdek','curier');
CREATE TYPE public.product_source_enum AS ENUM ('snickers', 'solomerch', 'clothes');
CREATE TYPE public.clothes_enum AS ENUM ('t-shirt', 'hoodie', 'sweatshirt', 'jacket', 'pants', 'shorts','other');
CREATE TYPE public.merch_enum AS ENUM ('hat', 'toys', 'bag','other');
CREATE TYPE public.snickers_enum AS ENUM ('slepowers','other');
CREATE TYPE public.body_enum AS ENUM ('child', 'woman', 'man');


CREATE TABLE product_registry (
    global_id SERIAL PRIMARY KEY,
    source_table public.product_source_enum  NOT NULL,
    internal_id INT NOT NULL,
    UNIQUE (source_table, internal_id)
);

CREATE TABLE product_types (
    id SERIAL PRIMARY KEY,
    category product_source_enum NOT NULL,  -- Категория из product_source_enum
    type_name VARCHAR(50) NOT NULL,         -- Название типа (дублирует значение из соответствующего ENUM)
    enum_value VARCHAR(50) NOT NULL,        -- Значение из соответствующего ENUM
    UNIQUE (category, enum_value)           -- Уникальная связка категория+значение
);

INSERT INTO product_types (category, type_name, enum_value) VALUES
-- Одежда (clothes_enum)
('clothes', 'Футболка', 't-shirt'),
('clothes', 'Худи', 'hoodie'),
('clothes', 'Свитшот', 'sweatshirt'),
('clothes', 'Куртка', 'jacket'),
('clothes', 'Штаны', 'pants'),
('clothes', 'Шорты', 'shorts'),
('clothes', 'Другое', 'other'),

-- Мерч (merch_enum)
('solomerch', 'Кепка', 'hat'),
('solomerch', 'Игрушки', 'toys'),
('solomerch', 'Сумка', 'bag'),
('solomerch', 'Другое', 'other'),

-- Кроссовки (snickers_enum)
('snickers', 'Слепауэрс', 'slepowers'),
('snickers', 'Другое', 'other');


CREATE TABLE public.snickers (
    id serial PRIMARY KEY NOT NULL,
    qId text  NOT NULL,
    name text NOT NULL,
    info json NOT NULL,
    firm text NOT NULL,
    line text NOT NULL,
    image_path text NOT NULL,
    minprice integer NOT NULL,
    maxprice integer NOT NULL,
    type INTEGER NOT NULL REFERENCES product_types(id),
    article text,
    date text,
    description text,
	bodytype public.body_enum NOT NULL DEFAULT 'man',
	image_count integer NOT NULL,
    "3.5" integer,
    "4" integer,
    "4.5" integer,
    "5" integer,
    "5.5" integer,
    "6" integer,
    "6.5" integer,
    "7" integer,
    "7.5" integer,
    "8" integer,
    "8.5" integer,
    "9" integer,
    "9.5" integer,
    "10" integer,
    "10.5" integer,
    "11" integer,
    "11.5" integer,
    "12" integer,
    "12.5" integer,
    "13" integer
);


CREATE TABLE public.solomerch (
    id serial PRIMARY KEY NOT NULL,
    qId text  NOT NULL,
    name text NOT NULL,
    firm text NOT NULL,
    line text ,
    image_path text NOT NULL,
	image_count integer NOT NULL,
    minprice integer NOT NULL,
    article text,
    type INTEGER NOT NULL REFERENCES product_types(id),
    date text,
    description text
);

CREATE TABLE public.clothes (
    id serial PRIMARY KEY NOT NULL,
    qId text  NOT NULL,
    name text NOT NULL,
    firm text NOT NULL,
	info json NOT NULL,
    line text ,
    image_path text NOT NULL,
	image_count integer NOT NULL,
    minprice integer NOT NULL,
	maxprice integer NOT NULL,
    article text,
	bodytype public.body_enum NOT NULL DEFAULT 'man',
    date text,
    description text,
    type INTEGER NOT NULL REFERENCES product_types(id),
    XS integer,
	S integer,
	M integer,
	L integer,
	XL integer,
	XXL integer
);

CREATE INDEX idx_qId ON public.snickers(qId);


CREATE TABLE IF NOT EXISTS public.discount (
    id serial PRIMARY KEY NOT NULL,
    productid INT NOT NULL,
    value JSON NOT NULL,
    minprice INT,
    maxdiscprice INT
);
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
	source_table  product_source_enum NOT NULL,
	Quantity integer NOT NULL,
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
				source_table  product_source_enum NOT NULL,
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

