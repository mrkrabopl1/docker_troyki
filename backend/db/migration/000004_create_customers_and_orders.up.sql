-- ============================================
-- Клиенты и заказы
-- ============================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.customers (
    id SERIAL PRIMARY KEY,
    name TEXT,
    secondName TEXT,
    mail TEXT NOT NULL UNIQUE,
    pass BYTEA NOT NULL,
    phone TEXT,
    town TEXT,
    index TEXT,
    sendMail BOOLEAN DEFAULT FALSE,
    street TEXT,
    region TEXT,
    home TEXT,
    flat TEXT,
    coordinates INTEGER[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.verification (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    CustomerID INTEGER NOT NULL REFERENCES customers(id),
    expire TIMESTAMP NOT NULL,
    deleteTime TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.unregistercustomer (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    secondName TEXT,
    mail TEXT NOT NULL,
    phone TEXT NOT NULL,
    town TEXT NOT NULL,
    index TEXT NOT NULL,
    sendMail BOOLEAN,
    street TEXT,
    settlement TEXT,
    region TEXT,
    deliveryComment TEXT,
    house TEXT,
    flat TEXT,
    coordinates TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    CustomerID INTEGER REFERENCES customers(id),
    UnregisterCustomerID INTEGER REFERENCES unregistercustomer(id),
    OrderDate DATE NOT NULL DEFAULT CURRENT_DATE,
    Status public.status_enum NOT NULL DEFAULT 'pending',
    Hash TEXT NOT NULL,
    DeliveryPrice INTEGER NOT NULL DEFAULT 0,
    DeliveryComment TEXT,
    DeliveryType public.delivery_enum NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orderitems (
    id SERIAL PRIMARY KEY,
    OrderID INTEGER NOT NULL REFERENCES orders(id),
    ProductId INTEGER NOT NULL,
    Quantity INTEGER NOT NULL CHECK (Quantity > 0),
    Price INTEGER NOT NULL,
    Image_path TEXT NOT NULL,
    Name TEXT NOT NULL,
    Size TEXT
);

CREATE TABLE IF NOT EXISTS public.orderAddress (
    id SERIAL PRIMARY KEY,
    OrderID INTEGER NOT NULL UNIQUE REFERENCES orders(id),
    town TEXT NOT NULL,
    index TEXT NOT NULL,
    sendMail BOOLEAN,
    street TEXT,
    region TEXT,
    deliveryComment TEXT,
    house TEXT,
    flat TEXT,
    coordinates TEXT[] NOT NULL
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

-- Индексы
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(CustomerID);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(OrderDate);
CREATE INDEX IF NOT EXISTS idx_orderitems_order ON orderitems(OrderID);
CREATE INDEX IF NOT EXISTS idx_customers_mail ON customers(mail);

COMMIT;