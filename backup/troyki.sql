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
-- Name: delivery_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.delivery_enum AS ENUM (
    'own',
    'express',
    'cdek'
);


ALTER TYPE public.delivery_enum OWNER TO postgres;

--
-- Name: status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_enum AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.status_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name text NOT NULL,
    secondname text,
    mail text NOT NULL,
    phone text NOT NULL,
    country text NOT NULL,
    town text NOT NULL,
    postindex integer
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: discount; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.discount (
    id integer NOT NULL,
    productid integer NOT NULL,
    value json NOT NULL,
    minprice integer,
    maxdiscprice integer
);


ALTER TABLE public.discount OWNER TO postgres;

--
-- Name: discount_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.discount_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.discount_id_seq OWNER TO postgres;

--
-- Name: discount_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.discount_id_seq OWNED BY public.discount.id;


--
-- Name: main_page; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_page (
    id integer NOT NULL,
    imagepath text NOT NULL,
    maintext text NOT NULL,
    subtext text,
    line text NOT NULL
);


ALTER TABLE public.main_page OWNER TO postgres;

--
-- Name: main_page_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.main_page_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.main_page_id_seq OWNER TO postgres;

--
-- Name: main_page_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.main_page_id_seq OWNED BY public.main_page.id;


--
-- Name: orderitems; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orderitems (
    orderitemid integer NOT NULL,
    orderid integer,
    productid integer,
    quantity integer,
    size text
);


ALTER TABLE public.orderitems OWNER TO postgres;

--
-- Name: orderitems_orderitemid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orderitems_orderitemid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orderitems_orderitemid_seq OWNER TO postgres;

--
-- Name: orderitems_orderitemid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orderitems_orderitemid_seq OWNED BY public.orderitems.orderitemid;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    customerid integer NOT NULL,
    orderdate date NOT NULL,
    status public.status_enum NOT NULL,
    deliveryprice integer NOT NULL,
    deliverytype public.delivery_enum NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: preorder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preorder (
    id integer NOT NULL,
    hashurl text NOT NULL,
    updatetime date
);


ALTER TABLE public.preorder OWNER TO postgres;

--
-- Name: preorder_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.preorder_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preorder_id_seq OWNER TO postgres;

--
-- Name: preorder_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preorder_id_seq OWNED BY public.preorder.id;


--
-- Name: preorderitems; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preorderitems (
    id integer NOT NULL,
    orderid integer NOT NULL,
    productid integer NOT NULL,
    quantity integer NOT NULL,
    size text
);


ALTER TABLE public.preorderitems OWNER TO postgres;

--
-- Name: preorderitems_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.preorderitems_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preorderitems_id_seq OWNER TO postgres;

--
-- Name: preorderitems_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preorderitems_id_seq OWNED BY public.preorderitems.id;


--
-- Name: snickers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.snickers (
    id integer NOT NULL,
    name text NOT NULL,
    info json NOT NULL,
    firm text NOT NULL,
    line text NOT NULL,
    image_path text NOT NULL,
    minprice integer NOT NULL,
    maxprice integer NOT NULL,
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


ALTER TABLE public.snickers OWNER TO postgres;

--
-- Name: snickers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.snickers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.snickers_id_seq OWNER TO postgres;

--
-- Name: snickers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.snickers_id_seq OWNED BY public.snickers.id;


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: discount id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount ALTER COLUMN id SET DEFAULT nextval('public.discount_id_seq'::regclass);


--
-- Name: main_page id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_page ALTER COLUMN id SET DEFAULT nextval('public.main_page_id_seq'::regclass);


--
-- Name: orderitems orderitemid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderitems ALTER COLUMN orderitemid SET DEFAULT nextval('public.orderitems_orderitemid_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: preorder id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preorder ALTER COLUMN id SET DEFAULT nextval('public.preorder_id_seq'::regclass);


--
-- Name: preorderitems id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preorderitems ALTER COLUMN id SET DEFAULT nextval('public.preorderitems_id_seq'::regclass);


--
-- Name: snickers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.snickers ALTER COLUMN id SET DEFAULT nextval('public.snickers_id_seq'::regclass);


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, secondname, mail, phone, country, town, postindex) FROM stdin;
1	mbjmbm	bjmbmb	mjbmbj		Russia	bjmbmbm	100000
2	fdgfdg	gfdgdfg	gg		Russia	gfdgfd	100000
3	sadasda	dsadasd	dfasdsa		Russia	sdaad	100000
4	sadasda	dsadasd	dfasdsa		Russia	sdaad	100000
5	gdfgd	gfdgd	fgdf	+7 433 333-33-33	Russia	dfgd	100000
\.


--
-- Data for Name: discount; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.discount (id, productid, value, minprice, maxdiscprice) FROM stdin;
1	2	{"11":9000,"10":9000}	45000	55000
\.


--
-- Data for Name: main_page; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_page (id, imagepath, maintext, subtext, line) FROM stdin;
3	images/other/ajWallpaper.jpg	AIR JORDAN 1	BIGGEST COLLECTION	air_jordan_1
\.


--
-- Data for Name: orderitems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orderitems (orderitemid, orderid, productid, quantity, size) FROM stdin;
1	1	1	1	8.5
2	2	1	1	8.5
3	3	1	1	8.5
4	4	1	1	8.5
5	5	1	1	8.5
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, customerid, orderdate, status, deliveryprice, deliverytype) FROM stdin;
1	1	2024-04-15	pending	0	cdek
2	2	2024-04-15	pending	0	cdek
3	3	2024-04-15	pending	0	cdek
4	4	2024-04-15	pending	0	cdek
5	5	2024-04-15	pending	0	cdek
\.


--
-- Data for Name: preorder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.preorder (id, hashurl, updatetime) FROM stdin;
3	4813640782846292612	2024-03-31
4	1887319013292738177	2024-03-31
5	17283722994387712414	2024-03-31
6	2071487324261688568	2024-03-31
7	17897361412742827080	2024-03-31
8	8761347422993042187	2024-04-07
9	2844343160687925067	2024-04-15
10	8236596514471157672	2024-04-24
\.


--
-- Data for Name: preorderitems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.preorderitems (id, orderid, productid, quantity, size) FROM stdin;
26	7	3	5	9.5
4	3	2	1	9.5
5	4	2	1	9.5
6	5	2	1	9.5
7	6	2	1	9.5
32	8	4	2	9.5
33	9	1	1	8.5
34	9	4	1	12
35	9	4	1	10
36	10	2	3	undefined
\.


--
-- Data for Name: snickers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.snickers (id, name, info, firm, line, image_path, minprice, maxprice, "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13") FROM stdin;
1	Air Jordan 1 Low True Blue	{"5":1000000,"5.5":1000000,"9":100000}	nike	air_jordan_1	images/nike/jordan/ajm1/lowTrueBlue	100000	1000000	\N	\N	\N	1000000	1000000	\N	\N	\N	\N	\N	\N	100000	\N	\N	\N	\N	\N	\N	\N	\N
2	Air Jordan 1 Low White Wolf	{"10":55000,"11":54000,"12":54000,"8.5":50000,"9":50000}	nike	air_jordan_1	images/nike/jordan/ajm1/lowWhiteWolf	50000	55000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	50000	50000	\N	55000	\N	54000	\N	54000	\N	\N
3	Air Jordan 1 Height Blue	{"10":55000,"11":54000,"12":54000,"8.5":50000,"9":50000}	nike	air_jordan_1	images/nike/jordan/ajm1/retroHeightBlue	50000	55000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	50000	50000	\N	55000	\N	54000	\N	54000	\N	\N
4	Air Jordan 1 Low Travis Scot	{"10":55000,"11":54000,"12":54000,"8.5":50000,"9":50000}	nike	air_jordan_1	images/nike/jordan/ajm1/retroLowTravisScot	50000	55000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	50000	50000	\N	55000	\N	54000	\N	54000	\N	\N
5	Men's Steroid Derby in Brown	{"10":55000,"11":54000,"12":54000,"8.5":50000,"9":50000}	balanciaga	derby	images/balanciaga/derby/brown	50000	55000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	50000	50000	\N	55000	\N	54000	\N	54000	\N	\N
6	Air Jordan 1 Height Green	{"10":22000,"5":20000,"7":20000}	nike	air_jordan_1	images/nike/jordan/ajm1/green	20000	22000	\N	\N	\N	20000	\N	\N	\N	20000	\N	\N	\N	\N	\N	22000	\N	\N	\N	\N	\N	\N
7	Air Jordan 1 Low Tie Dye	{"11":54000,"12":54000}	nike	air_jordan_1	images/nike/jordan/ajm1/lowTieDye	54000	54000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	54000	\N	54000	\N	\N
\.


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 5, true);


--
-- Name: discount_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.discount_id_seq', 1, true);


--
-- Name: main_page_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_page_id_seq', 3, true);


--
-- Name: orderitems_orderitemid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orderitems_orderitemid_seq', 5, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 5, true);


--
-- Name: preorder_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.preorder_id_seq', 10, true);


--
-- Name: preorderitems_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.preorderitems_id_seq', 36, true);


--
-- Name: snickers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.snickers_id_seq', 14, true);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: discount discount_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount
    ADD CONSTRAINT discount_pkey PRIMARY KEY (id);


--
-- Name: main_page main_page_imagepath_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_page
    ADD CONSTRAINT main_page_imagepath_key UNIQUE (imagepath);


--
-- Name: main_page main_page_maintext_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_page
    ADD CONSTRAINT main_page_maintext_key UNIQUE (maintext);


--
-- Name: main_page main_page_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_page
    ADD CONSTRAINT main_page_pkey PRIMARY KEY (id);


--
-- Name: orderitems orderitems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderitems
    ADD CONSTRAINT orderitems_pkey PRIMARY KEY (orderitemid);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: preorder preorder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preorder
    ADD CONSTRAINT preorder_pkey PRIMARY KEY (id);


--
-- Name: preorderitems preorderitems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preorderitems
    ADD CONSTRAINT preorderitems_pkey PRIMARY KEY (id);


--
-- Name: snickers snickers_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.snickers
    ADD CONSTRAINT snickers_name_key UNIQUE (name);


--
-- Name: snickers snickers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.snickers
    ADD CONSTRAINT snickers_pkey PRIMARY KEY (id);


--
-- Name: orders orders_customerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customerid_fkey FOREIGN KEY (customerid) REFERENCES public.customers(id);


--
-- Name: preorderitems preorderitems_orderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preorderitems
    ADD CONSTRAINT preorderitems_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.preorder(id);


--
-- PostgreSQL database dump complete
--

