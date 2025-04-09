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
    article text,
    date text,
    description text,
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


CREATE INDEX idx_qId ON public.snickers(qId);


CREATE TABLE IF NOT EXISTS public.discount (
 	   id serial PRIMARY KEY NOT NULL ,
       productid INT NOT NULL,
       value JSON NOT NULL,
       minprice INT ,
       maxdiscprice INT,
       FOREIGN KEY (productID) REFERENCES public.snickers(id)
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
		flat TEXT
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
		phone TEXT NOT NULL,
		town TEXT NOT NULL,
		index TEXT NOT NULL,
		sendMail BOOLEAN,
		street TEXT NOT NULL,
		region TEXT NOT NULL,
		house TEXT,
		flat TEXT
);

CREATE TABLE public.uniquecustomers (
		id serial PRIMARY KEY NOT NULL,
		creationTime DATE NOT NULL,
		history INTEGER[] NOT NULL
);

CREATE TYPE  public.status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE  public.delivery_enum AS ENUM ('own', 'express', 'cdek');
CREATE TABLE public.orders (
			id serial PRIMARY KEY,
			CustomerID INT,
			UnregisterCustomerID INT,
			OrderDate DATE  NOT NULL DEFAULT CURRENT_DATE,
			Status status_enum  NOT NULL,
			Hash TEXT  NOT NULL,
			DeliveryPrice INT  NOT NULL,
			DeliveryType delivery_enum  NOT NULL,
			FOREIGN KEY (CustomerID) REFERENCES public.customers(id),
			FOREIGN KEY (UnregisterCustomerID) REFERENCES public.unregistercustomer(id)
);

CREATE TABLE public.orderitems (
	id serial PRIMARY KEY NOT NULL,
	OrderID integer NOT NULL,
	ProductID INT  NOT NULL,
	Quantity integer NOT NULL,
	Size text,
	FOREIGN KEY (OrderID) REFERENCES public.orders(id),
	FOREIGN KEY (ProductID) REFERENCES snickers(id)
);

CREATE TABLE IF NOT EXISTS public.preorder (
			id serial PRIMARY KEY NOT NULL ,
			hashUrl TEXT NOT NULL,
			updateTime DATE
);
CREATE TABLE IF NOT EXISTS public.preorderitems (
				id serial PRIMARY KEY NOT NULL ,
				OrderID INT NOT NULL,
				ProductID INT NOT NULL,
				Quantity INT NOT NULL,
				Size TEXT,
				FOREIGN KEY (OrderID) REFERENCES public.preorder(id),
				FOREIGN KEY (ProductID) REFERENCES public.snickers(id)
);