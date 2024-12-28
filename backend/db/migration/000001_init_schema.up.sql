--
-- PostgreSQL database dump
--

-- Dumped from database version 16.1
-- Dumped by pg_dump version 16.1

-- Started on 2024-11-17 01:07:06

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
-- TOC entry 888 (class 1247 OID 33822)
-- Name: delivery_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.delivery_enum AS ENUM (
    'own',
    'express',
    'cdek'
);


ALTER TYPE public.delivery_enum OWNER TO postgres;

--
-- TOC entry 885 (class 1247 OID 33815)
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
-- TOC entry 226 (class 1259 OID 25465)
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name text,
    secondname text,
    mail text NOT NULL,
    pass bytea NOT NULL,
    phone text,
    country text,
    town text,
    sendmail boolean,
    postindex integer
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 25464)
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
-- TOC entry 4959 (class 0 OID 0)
-- Dependencies: 225
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- TOC entry 222 (class 1259 OID 25380)
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
-- TOC entry 221 (class 1259 OID 25379)
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
-- TOC entry 4960 (class 0 OID 0)
-- Dependencies: 221
-- Name: discount_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.discount_id_seq OWNED BY public.discount.id;


--
-- TOC entry 220 (class 1259 OID 25278)
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
-- TOC entry 219 (class 1259 OID 25277)
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
-- TOC entry 4961 (class 0 OID 0)
-- Dependencies: 219
-- Name: main_page_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.main_page_id_seq OWNED BY public.main_page.id;


--
-- TOC entry 234 (class 1259 OID 33849)
-- Name: orderitems; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orderitems (
    id integer NOT NULL,
    orderid integer,
    productid integer,
    quantity integer,
    size text
);


ALTER TABLE public.orderitems OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 33848)
-- Name: orderitems_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orderitems_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orderitems_id_seq OWNER TO postgres;

--
-- TOC entry 4962 (class 0 OID 0)
-- Dependencies: 233
-- Name: orderitems_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orderitems_id_seq OWNED BY public.orderitems.id;


--
-- TOC entry 232 (class 1259 OID 33830)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    customerid integer,
    unregistercustomerid integer,
    orderdate date NOT NULL,
    status public.status_enum NOT NULL,
    hash text NOT NULL,
    deliveryprice integer NOT NULL,
    deliverytype public.delivery_enum NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 33829)
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
-- TOC entry 4963 (class 0 OID 0)
-- Dependencies: 231
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- TOC entry 216 (class 1259 OID 25222)
-- Name: preorder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preorder (
    id integer NOT NULL,
    hashurl text NOT NULL,
    updatetime date
);


ALTER TABLE public.preorder OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 25221)
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
-- TOC entry 4964 (class 0 OID 0)
-- Dependencies: 215
-- Name: preorder_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preorder_id_seq OWNED BY public.preorder.id;


--
-- TOC entry 218 (class 1259 OID 25232)
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
-- TOC entry 217 (class 1259 OID 25231)
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
-- TOC entry 4965 (class 0 OID 0)
-- Dependencies: 217
-- Name: preorderitems_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preorderitems_id_seq OWNED BY public.preorderitems.id;


--
-- TOC entry 224 (class 1259 OID 25400)
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
-- TOC entry 223 (class 1259 OID 25399)
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
-- TOC entry 4966 (class 0 OID 0)
-- Dependencies: 223
-- Name: snickers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.snickers_id_seq OWNED BY public.snickers.id;


--
-- TOC entry 236 (class 1259 OID 33884)
-- Name: uniquecustomers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.uniquecustomers (
    id integer NOT NULL,
    creationtime date NOT NULL,
    history integer[] NOT NULL
);


ALTER TABLE public.uniquecustomers OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 33883)
-- Name: uniquecustomers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.uniquecustomers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.uniquecustomers_id_seq OWNER TO postgres;

--
-- TOC entry 4967 (class 0 OID 0)
-- Dependencies: 235
-- Name: uniquecustomers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.uniquecustomers_id_seq OWNED BY public.uniquecustomers.id;


--
-- TOC entry 230 (class 1259 OID 25581)
-- Name: unregistercustomer; Type: TABLE; Schema: public; Owner: postgres
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
    street text NOT NULL,
    region text NOT NULL,
    house text,
    flat text
);


ALTER TABLE public.unregistercustomer OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 25580)
-- Name: unregistercustomer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unregistercustomer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unregistercustomer_id_seq OWNER TO postgres;

--
-- TOC entry 4968 (class 0 OID 0)
-- Dependencies: 229
-- Name: unregistercustomer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unregistercustomer_id_seq OWNED BY public.unregistercustomer.id;


--
-- TOC entry 228 (class 1259 OID 25525)
-- Name: verification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification (
    id integer NOT NULL,
    token text NOT NULL,
    customerid integer NOT NULL,
    expire timestamp without time zone NOT NULL,
    deletetime timestamp without time zone NOT NULL
);


ALTER TABLE public.verification OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 25524)
-- Name: verification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.verification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.verification_id_seq OWNER TO postgres;

--
-- TOC entry 4969 (class 0 OID 0)
-- Dependencies: 227
-- Name: verification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.verification_id_seq OWNED BY public.verification.id;


--
-- TOC entry 4749 (class 2604 OID 33892)
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- TOC entry 4747 (class 2604 OID 33893)
-- Name: discount id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount ALTER COLUMN id SET DEFAULT nextval('public.discount_id_seq'::regclass);


--
-- TOC entry 4746 (class 2604 OID 33894)
-- Name: main_page id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_page ALTER COLUMN id SET DEFAULT nextval('public.main_page_id_seq'::regclass);


--
-- TOC entry 4753 (class 2604 OID 33895)
-- Name: orderitems id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderitems ALTER COLUMN id SET DEFAULT nextval('public.orderitems_id_seq'::regclass);


--
-- TOC entry 4752 (class 2604 OID 33896)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 4744 (class 2604 OID 33897)
-- Name: preorder id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preorder ALTER COLUMN id SET DEFAULT nextval('public.preorder_id_seq'::regclass);


--
-- TOC entry 4745 (class 2604 OID 33898)
-- Name: preorderitems id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preorderitems ALTER COLUMN id SET DEFAULT nextval('public.preorderitems_id_seq'::regclass);


--
-- TOC entry 4748 (class 2604 OID 33899)
-- Name: snickers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.snickers ALTER COLUMN id SET DEFAULT nextval('public.snickers_id_seq'::regclass);


--
-- TOC entry 4754 (class 2604 OID 33900)
-- Name: uniquecustomers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uniquecustomers ALTER COLUMN id SET DEFAULT nextval('public.uniquecustomers_id_seq'::regclass);


--
-- TOC entry 4751 (class 2604 OID 33901)
-- Name: unregistercustomer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unregistercustomer ALTER COLUMN id SET DEFAULT nextval('public.unregistercustomer_id_seq'::regclass);


--
-- TOC entry 4750 (class 2604 OID 33902)
-- Name: verification id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification ALTER COLUMN id SET DEFAULT nextval('public.verification_id_seq'::regclass);


-- --
-- -- TOC entry 4943 (class 0 OID 25465)
-- -- Dependencies: 226
-- -- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
-- --

-- COPY public.customers (id, name, secondname, mail, pass, phone, country, town, sendmail, postindex) FROM stdin;
-- 10	\N	\N	mr.krabopl12@gmail.com	E\\'x2432612431302464664d77796a4d3645494c686f30577471716c564d4f79616a337543317a526553464f484f5a554a5045593636422e58356e45336d'	\N	\N	\N	\N	\N
-- \.


-- --
-- -- TOC entry 4939 (class 0 OID 25380)
-- -- Dependencies: 222
-- -- Data for Name: discount; Type: TABLE DATA; Schema: public; Owner: postgres
-- --

-- COPY public.discount (id, productid, value, minprice, maxdiscprice) FROM stdin;
-- 1	2	{"11":9000,"10":9000}	45000	55000
-- \.


-- --
-- -- TOC entry 4937 (class 0 OID 25278)
-- -- Dependencies: 220
-- -- Data for Name: main_page; Type: TABLE DATA; Schema: public; Owner: postgres
-- --

-- COPY public.main_page (id, imagepath, maintext, subtext, line) FROM stdin;
-- 3	images/other/ajWallpaper.jpg	AIR JORDAN 1	BIGGEST COLLECTION	air_jordan_1
-- \.


-- --
-- -- TOC entry 4951 (class 0 OID 33849)
-- -- Dependencies: 234
-- -- Data for Name: orderitems; Type: TABLE DATA; Schema: public; Owner: postgres
-- --

-- COPY public.orderitems (id, orderid, productid, quantity, size) FROM stdin;
-- 1	8	6	1	5
-- 2	9	2	1	9
-- 3	10	2	2	9
-- 4	10	1	1	5
-- 5	11	6	1	5
-- 6	12	4	1	9
-- 7	13	2	1	9
-- \.


-- --
-- -- TOC entry 4949 (class 0 OID 33830)
-- -- Dependencies: 232
-- -- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
-- --

-- COPY public.orders (id, customerid, unregistercustomerid, orderdate, status, hash, deliveryprice, deliverytype) FROM stdin;
-- 1	\N	22	2024-09-18	pending	�	0	cdek
-- 2	\N	23	2024-09-18	pending	�	0	cdek
-- 3	\N	24	2024-09-18	pending	�	0	cdek
-- 4	\N	25	2024-09-18	pending	12919204649437011380	0	cdek
-- 5	\N	26	2024-09-18	pending	9715676527209906170	0	cdek
-- 6	\N	27	2024-09-18	pending	10528061264627473507	0	cdek
-- 7	\N	28	2024-09-22	pending	15912836620971578055	0	cdek
-- 8	\N	29	2024-09-22	pending	1047631889588549322	0	cdek
-- 9	\N	30	2024-10-02	pending	5853440040955056072	0	cdek
-- 10	\N	31	2024-10-03	pending	11732960460243543611	0	cdek
-- 11	\N	32	2024-10-03	pending	6397576190031649164	0	cdek
-- 12	\N	33	2024-10-04	pending	15977230700576485143	0	cdek
-- 13	\N	34	2024-10-07	pending	10379035026957912413	0	cdek
-- \.


-- --
-- -- TOC entry 4933 (class 0 OID 25222)
-- -- Dependencies: 216
-- -- Data for Name: preorder; Type: TABLE DATA; Schema: public; Owner: postgres
-- --

-- COPY public.preorder (id, hashurl, updatetime) FROM stdin;
-- 3	4813640782846292612	2024-03-31
-- 4	1887319013292738177	2024-03-31
-- 5	17283722994387712414	2024-03-31
-- 6	2071487324261688568	2024-03-31
-- 7	17897361412742827080	2024-03-31
-- 8	8761347422993042187	2024-04-07
-- 9	2844343160687925067	2024-04-15
-- 10	8236596514471157672	2024-04-24
-- 11	16400479080907136680	2024-05-11
-- 12	16123210519479166572	2024-05-11
-- 13	5199192159676583522	2024-05-11
-- 14	3358144692680906263	2024-05-11
-- 15	5330693346617611404	2024-05-11
-- 16	9420778233015733007	2024-05-12
-- 17	13039954890468557735	2024-05-12
-- 18	15329980161034323603	2024-06-01
-- 19	1976445589107228193	2024-06-09
-- 20	7405655724624033303	2024-08-24
-- 21	3588027643744252533	2024-09-07
-- 22	8848349779066855632	2024-09-07
-- 23	4729056159714339828	2024-09-13
-- 24	8119777878567283696	2024-09-13
-- 25	12406467394005462666	2024-09-22
-- 26	1236436784791902816	2024-09-22
-- 27	10344029893500593498	2024-09-29
-- 28	11152587329296023262	2024-09-29
-- 29	9168208009864181569	2024-09-29
-- 30	3026181130546710020	2024-09-29
-- 31	3394072397276280787	2024-09-29
-- 32	12206773206206096361	2024-09-29
-- 33	9733692396089873121	2024-09-29
-- 34	7096071768759793325	2024-09-29
-- 35	20324405111975925	2024-09-29
-- 36	94955387719868172	2024-10-02
-- 37	11456767394876218914	2024-10-03
-- 38	16065590701833177299	2024-10-03
-- 39	13171605599694761	2024-10-04
-- 40	17791235634266715526	2024-10-07
-- 41	3183617207686978407	2024-10-07
-- 42	2710099235244691351	2024-10-21
-- 43	12678222272571372595	2024-10-22
-- 44	8804782976349979594	2024-10-31
-- \.


-- --
-- -- TOC entry 4935 (class 0 OID 25232)
-- -- Dependencies: 218
-- -- Data for Name: preorderitems; Type: TABLE DATA; Schema: public; Owner: postgres
-- --

-- COPY public.preorderitems (id, orderid, productid, quantity, size) FROM stdin;
-- 26	7	3	5	9.5
-- 4	3	2	1	9.5
-- 5	4	2	1	9.5
-- 6	5	2	1	9.5
-- 7	6	2	1	9.5
-- 73	26	4	2	9
-- 76	26	7	1	11
-- 77	27	7	1	11
-- 78	27	6	1	5
-- 32	8	4	2	9.5
-- 33	9	1	1	8.5
-- 34	9	4	1	12
-- 35	9	4	1	10
-- 36	10	2	3	undefined
-- 79	28	6	12	5
-- 37	11	6	7	undefined
-- 38	12	6	1	undefined
-- 39	13	6	1	undefined
-- 40	14	6	1	undefined
-- 43	15	4	2	9
-- 44	16	4	1	9
-- 45	17	4	1	10
-- 47	19	4	1	9
-- 80	29	6	6	5
-- 81	30	6	1	5
-- 82	31	6	1	5
-- 83	32	6	2	5
-- 84	32	4	1	11
-- 85	33	4	1	11
-- 86	33	2	1	9
-- 52	23	6	6	5
-- 89	35	1	1	5
-- 92	38	2	1	9
-- 94	34	6	1	5
-- 96	41	2	1	9
-- 98	42	6	1	7
-- 99	42	4	1	9
-- 100	43	4	1	9
-- 97	42	6	5	5
-- 101	42	2	1	9
-- 102	42	2	1	10
-- 103	42	2	1	11
-- 104	42	2	1	12
-- 105	44	2	5	9
-- \.


-- --
-- -- TOC entry 4941 (class 0 OID 25400)
-- -- Dependencies: 224
-- -- Data for Name: snickers; Type: TABLE DATA; Schema: public; Owner: postgres
-- --

-- COPY public.snickers (id, name, info, firm, line, image_path, minprice, maxprice, "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13") FROM stdin;
-- 1	Air Jordan 1 Low True Blue	{"5":1000000,"5.5":1000000,"9":100000}	nike	air_jordan_1	images/nike/jordan/ajm1/lowTrueBlue	100000	1000000	\N	\N	\N	1000000	1000000	\N	\N	\N	\N	\N	\N	100000	\N	\N	\N	\N	\N	\N	\N	\N
-- 2	Air Jordan 1 Low White Wolf	{"10":55000,"11":54000,"12":54000,"8.5":50000,"9":50000}	nike	air_jordan_1	images/nike/jordan/ajm1/lowWhiteWolf	50000	55000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	50000	50000	\N	55000	\N	54000	\N	54000	\N	\N
-- 3	Air Jordan 1 Height Blue	{"10":55000,"11":54000,"12":54000,"8.5":50000,"9":50000}	nike	air_jordan_1	images/nike/jordan/ajm1/retroHeightBlue	50000	55000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	50000	50000	\N	55000	\N	54000	\N	54000	\N	\N
-- 4	Air Jordan 1 Low Travis Scot	{"10":55000,"11":54000,"12":54000,"8.5":50000,"9":50000}	nike	air_jordan_1	images/nike/jordan/ajm1/retroLowTravisScot	50000	55000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	50000	50000	\N	55000	\N	54000	\N	54000	\N	\N
-- 5	Men's Steroid Derby in Brown	{"10":55000,"11":54000,"12":54000,"8.5":50000,"9":50000}	balanciaga	derby	images/balanciaga/derby/brown	50000	55000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	50000	50000	\N	55000	\N	54000	\N	54000	\N	\N
-- 6	Air Jordan 1 Height Green	{"10":22000,"5":20000,"7":20000}	nike	air_jordan_1	images/nike/jordan/ajm1/green	20000	22000	\N	\N	\N	20000	\N	\N	\N	20000	\N	\N	\N	\N	\N	22000	\N	\N	\N	\N	\N	\N
-- 7	Air Jordan 1 Low Tie Dye	{"11":54000,"12":54000}	nike	air_jordan_1	images/nike/jordan/ajm1/lowTieDye	54000	54000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	54000	\N	54000	\N	\N
-- \.


-- --
-- -- TOC entry 4953 (class 0 OID 33884)
-- -- Dependencies: 236
-- -- Data for Name: uniquecustomers; Type: TABLE DATA; Schema: public; Owner: postgres
-- --

-- COPY public.uniquecustomers (id, creationtime, history) FROM stdin;
-- 25	2024-10-28	{6}
-- 26	2024-10-31	{}
-- 27	2024-10-31	{2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2}
-- 2	2024-10-09	{}
-- 1	2024-10-08	{1,4,2,1}
-- 3	2024-10-12	{6,4,1,1,3}
-- 4	2024-10-12	{}
-- 5	2024-10-13	{}
-- 6	2024-10-13	{}
-- 7	2024-10-13	{}
-- 8	2024-10-13	{2}
-- 9	2024-10-13	{}
-- 10	2024-10-19	{}
-- 11	2024-10-19	{}
-- 13	2024-10-20	{}
-- 12	2024-10-20	{6}
-- 14	2024-10-20	{6,2,6,4,4,6}
-- 15	2024-10-20	{}
-- 28	2024-10-31	{3,3,3,3,2,2,2,2,6,1,5,4,1,6,2,2}
-- 29	2024-10-31	{2,2,5}
-- 30	2024-11-11	{}
-- 31	2024-11-11	{}
-- 16	2024-10-20	{1,6,6,6,6,6,6,6,6,6,6,6}
-- 17	2024-10-21	{4,4,6,6,6,6,6}
-- 18	2024-10-22	{4,4,4,4}
-- 19	2024-10-23	{6,2}
-- 20	2024-10-23	{6}
-- 21	2024-10-28	{}
-- 22	2024-10-28	{}
-- 23	2024-10-28	{}
-- 24	2024-10-28	{6}
-- \.


-- --
-- -- TOC entry 4947 (class 0 OID 25581)
-- -- Dependencies: 230
-- -- Data for Name: unregistercustomer; Type: TABLE DATA; Schema: public; Owner: postgres
-- --

-- COPY public.unregistercustomer (id, name, secondname, mail, phone, town, index, sendmail, street, region, house, flat) FROM stdin;
-- 1	Александр		mr.krabopl12@gmail.com	+7 965 318-14-98	Москва	499	\N	Жебрунова	Москва		
-- 2	Александр		mr.krabopl12@gmail.com	+7 965 318-14-98	Москва	499	\N	Жебрунова	Москва		
-- 3	Александр		mr.krabopl12@gmail.com	+7 965 318-14-98	Москва	499	\N	Жебрунова	Москва		
-- 4	fdsfsdf		sdfsdfsdf	89653181498	dsfsdfsd	sdfsdf	\N	dsf	dsfsdf	ss	dfsdfsdf
-- 5	s8121996	sadad	mr.krabopl12@gmail.com	+7 965 318-14-98	dasd	sad	\N	ads	asd		asd
-- 6	s8121996	sadad	mr.krabopl12@gmail.com	+7 965 318-14-98	dasd	sad	\N	ads	asd		asd
-- 7	dasdafadf	asfdfs	mr.krabopl12@gmail.com	+7 965 318-14-98	sdfsdf	dsfsdf	\N	dsfsdf	sdfsdf		
-- 8	dasdafadf	asfdfs	mr.krabopl12@gmail.com	+7 965 318-14-98	sdfsdf	dsfsdf	\N	dsfsdf	sdfsdf		
-- 9	dasdafadf	asfdfs	mr.krabopl12@gmail.com	+7 965 318-14-98	sdfsdf	dsfsdf	\N	dsfsdf	sdfsdf		
-- 10	gfdgdh	fghfhfgh	mr.krabopl12@gmail.com	+7 965 318-14-98			\N				
-- 11	gdssg	sfgdg	mr.krabopl12@gmail.com	+7 965 318-14-98	gdfdfg	gfdgd	\N	dfgdg	gfdgd		
-- 12	gdssg	sfgdg	mr.krabopl12@gmail.com	+7 965 318-14-98	gdfdfg	gfdgd	\N	dfgdg	gfdgd		
-- 13	gdssg		mr.krabopl12@gmail.com	+7 965 318-15-98	gdfdfg	gfdgd	\N	tretert	gfdgd		
-- 14	gdssg		mr.krabopl12@gmail.com	+7 965 318-15-98	gdfdfg	gfdgd	\N	tretert	gfdgd		
-- 15	gdssg		mr.krabopl12@gmail.com	+7 965 318-15-98	gdfdfg	gfdgd	\N	tretert	gfdgd		
-- 16	gdssg		mr.krabopl12@gmail.com	+7 965 318-15-98	gdfdfg	gfdgd	\N	tretert	gfdgd		
-- 17	gdssg		mr.krabopl12@gmail.com	+7 965 318-14-98	gdfdfg	gfdgd	\N		gfdgd		
-- 18	gdssg		mr.krabopl12@gmail.com	+7 965 318-14-98	gdfdfg	gfdgd	\N	fghfgh	gfdgd		
-- 19	gdssg		mr.krabopl12@gmail.com	+7 965 318-14-98	gdfdfg	gfdgd	\N	fghfgh	gfdgd		
-- 20	sdadas	sadasd	mrewqreewr@gmail.com	+7 839 247-32-84	asdasd	sadasd	\N	dasaaaaaa	sadsad	ddddddddddd	33
-- 21	fsdlfknsdlkfn	sddddddd	mrewewrk@gmail.com	+7 876 543-76-57	sdddddddddd	sssssssssss	\N	sssssssssssssss	ssssssssss	sswe	22
-- 22	ddddddddddd	dddddddd	werewrwer@gmail.com	+7 432 432-43-24	ddddddddd	ddddddddd	\N	dd	ddddddddd	d	2
-- 23	dffffffffffffffff	sddddddddddd	dkdlfkdsflkj@gmail.com	+7 333 333-33-33	sdfffffffff	fsdfffffffffffff	\N	dsffffffffffff	sdffffffffff	dsffff	22
-- 24	dffffffffffffffff		dkdlfkdsflkj@gmail.com	+7 333 333-33-33	sdfffffffff	fsdfffffffffffff	\N	dfafsdfsdf	sdffffffffff	dsffff	22
-- 25	dffffffffffffffff		dkdlfkdsflkj@gmail.com	+7 333 333-33-33	sdfffffffff	fsdfffffffffffff	\N	gfdg	sdffffffffff	dsffff	22
-- 26	dffffffffffffffff		dkdlfkdsflkj@gmail.com	+7 321 312-43-42	sdfffffffff	fsdfffffffffffff	\N	resrew	sdffffffffff	dsffff	22
-- 27	dffffffffffffffff		dkdlfkdsflkj@gmail.com	+7 333 333-33-33	sdfffffffff	fsdfffffffffffff	\N	rewrwe	sdffffffffff	dsffff	22
-- 28	asdghjlk;l	esrdfghjkl	jfyfkfglujh@gmail.com	+7 235 467-89-99	mnbk	kjbk	\N	hhjbhknl	jhgk	vbmn,./	ghjk
-- 29	asdghjlk;l		jfyfkfglujh@gmail.com	+7 543 534-54-35	mnbk	kjbk	\N	erwerwerwe	jhgk	vbmn,./	ghjk
-- 30	Dmdkmfskf	dkaldkas;l	mr.krabopl12@gmail.com	+7 232 432-43-24	dsfsdf	12	\N	sdf	df	dsf	dsf
-- 31	fdsfsd	dsfdsf	mr.krabopl12@gmail.com	+7 534 534-54-35	fds	dsf	\N	dsf	dsf	sdf	sdf
-- 32	aaaaaaaaaa	aaaaaaaaaaaaa	mr.keeerabopl12@gmail.com	+7 985 435-34-54	aaaaaaaaaaa	aaaaaaaaaaaaaaaaaa	\N	dsadsadasd	aaaaaaaaaaaa	azxzxcxz	asdasdasdsad
-- 33	eqweqw	wqeqwe	msdasd@gmail.com	+7 965 318-14-98	wqeqw	wqe	\N	qwe	wqe	qwe	wqe
-- 34	fdhs	lkkvcj	dskajd@mail.com	+7 965 318-14-98	jfdjfsp	pdsfopsdf	\N	fpgfppdf	fodspfoidsp	odda	fiiii
-- \.


-- --
-- -- TOC entry 4945 (class 0 OID 25525)
-- -- Dependencies: 228
-- -- Data for Name: verification; Type: TABLE DATA; Schema: public; Owner: postgres
-- --

-- COPY public.verification (id, token, customerid, expire, deletetime) FROM stdin;
-- 11	X_Afp7JFH_HEhrAOiM8abI-PsaNUg4rBOS2zzFnDWgU=	10	2024-08-20 23:38:02	2024-09-19 23:08:02
-- 12	VcRXOuYaLRSVUapL5s5LaJevIahXkTlEHCAzC1feJBc=	10	2024-08-20 23:38:47	2024-09-19 23:08:47
-- 13	u3XVWT-RVdGbHITEqUxI2hwLjgWH4yI0VKxpEJx0h54=	10	2024-08-20 23:41:41	2024-09-19 23:11:41
-- 18	f7vnAKQL_9q57Nvqh_FEZbaYS7uw7ZLDa7Zp6OLkgbE=	10	2024-08-21 00:23:04	2024-09-19 23:53:04
-- \.


-- --
-- -- TOC entry 4970 (class 0 OID 0)
-- -- Dependencies: 225
-- -- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
-- --

-- SELECT pg_catalog.setval('public.customers_id_seq', 10, true);


-- --
-- -- TOC entry 4971 (class 0 OID 0)
-- -- Dependencies: 221
-- -- Name: discount_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
-- --

-- SELECT pg_catalog.setval('public.discount_id_seq', 1, true);


-- --
-- -- TOC entry 4972 (class 0 OID 0)
-- -- Dependencies: 219
-- -- Name: main_page_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
-- --

-- SELECT pg_catalog.setval('public.main_page_id_seq', 3, true);


-- --
-- -- TOC entry 4973 (class 0 OID 0)
-- -- Dependencies: 233
-- -- Name: orderitems_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
-- --

-- SELECT pg_catalog.setval('public.orderitems_id_seq', 7, true);


-- --
-- -- TOC entry 4974 (class 0 OID 0)
-- -- Dependencies: 231
-- -- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
-- --

-- SELECT pg_catalog.setval('public.orders_id_seq', 13, true);


-- --
-- -- TOC entry 4975 (class 0 OID 0)
-- -- Dependencies: 215
-- -- Name: preorder_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
-- --

-- SELECT pg_catalog.setval('public.preorder_id_seq', 44, true);


-- --
-- -- TOC entry 4976 (class 0 OID 0)
-- -- Dependencies: 217
-- -- Name: preorderitems_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
-- --

-- SELECT pg_catalog.setval('public.preorderitems_id_seq', 105, true);


-- --
-- -- TOC entry 4977 (class 0 OID 0)
-- -- Dependencies: 223
-- -- Name: snickers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
-- --

-- SELECT pg_catalog.setval('public.snickers_id_seq', 14, true);


-- --
-- -- TOC entry 4978 (class 0 OID 0)
-- -- Dependencies: 235
-- -- Name: uniquecustomers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
-- --

-- SELECT pg_catalog.setval('public.uniquecustomers_id_seq', 31, true);


-- --
-- -- TOC entry 4979 (class 0 OID 0)
-- -- Dependencies: 229
-- -- Name: unregistercustomer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
-- --

-- SELECT pg_catalog.setval('public.unregistercustomer_id_seq', 34, true);


-- --
-- -- TOC entry 4980 (class 0 OID 0)
-- -- Dependencies: 227
-- -- Name: verification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
-- --

-- SELECT pg_catalog.setval('public.verification_id_seq', 28, true);


-- --
-- -- TOC entry 4772 (class 2606 OID 25472)
-- -- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.customers
--     ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


-- --
-- -- TOC entry 4766 (class 2606 OID 25387)
-- -- Name: discount discount_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.discount
--     ADD CONSTRAINT discount_pkey PRIMARY KEY (id);


-- --
-- -- TOC entry 4760 (class 2606 OID 25287)
-- -- Name: main_page main_page_imagepath_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.main_page
--     ADD CONSTRAINT main_page_imagepath_key UNIQUE (imagepath);


-- --
-- -- TOC entry 4762 (class 2606 OID 25289)
-- -- Name: main_page main_page_maintext_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.main_page
--     ADD CONSTRAINT main_page_maintext_key UNIQUE (maintext);


-- --
-- -- TOC entry 4764 (class 2606 OID 25285)
-- -- Name: main_page main_page_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.main_page
--     ADD CONSTRAINT main_page_pkey PRIMARY KEY (id);


-- --
-- -- TOC entry 4780 (class 2606 OID 33856)
-- -- Name: orderitems orderitems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.orderitems
--     ADD CONSTRAINT orderitems_pkey PRIMARY KEY (id);


-- --
-- -- TOC entry 4778 (class 2606 OID 33837)
-- -- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.orders
--     ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


-- --
-- -- TOC entry 4756 (class 2606 OID 25229)
-- -- Name: preorder preorder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.preorder
--     ADD CONSTRAINT preorder_pkey PRIMARY KEY (id);


-- --
-- -- TOC entry 4758 (class 2606 OID 25239)
-- -- Name: preorderitems preorderitems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.preorderitems
--     ADD CONSTRAINT preorderitems_pkey PRIMARY KEY (id);


-- --
-- -- TOC entry 4768 (class 2606 OID 25409)
-- -- Name: snickers snickers_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.snickers
--     ADD CONSTRAINT snickers_name_key UNIQUE (name);


-- --
-- -- TOC entry 4770 (class 2606 OID 25407)
-- -- Name: snickers snickers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.snickers
--     ADD CONSTRAINT snickers_pkey PRIMARY KEY (id);


-- --
-- -- TOC entry 4782 (class 2606 OID 33891)
-- -- Name: uniquecustomers uniquecustomers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.uniquecustomers
--     ADD CONSTRAINT uniquecustomers_pkey PRIMARY KEY (id);


-- --
-- -- TOC entry 4776 (class 2606 OID 25588)
-- -- Name: unregistercustomer unregistercustomer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.unregistercustomer
--     ADD CONSTRAINT unregistercustomer_pkey PRIMARY KEY (id);


-- --
-- -- TOC entry 4774 (class 2606 OID 25532)
-- -- Name: verification verification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.verification
--     ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


-- --
-- -- TOC entry 4787 (class 2606 OID 33857)
-- -- Name: orderitems orderitems_orderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.orderitems
--     ADD CONSTRAINT orderitems_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.orders(id);


-- --
-- -- TOC entry 4788 (class 2606 OID 33862)
-- -- Name: orderitems orderitems_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.orderitems
--     ADD CONSTRAINT orderitems_productid_fkey FOREIGN KEY (productid) REFERENCES public.snickers(id);


-- --
-- -- TOC entry 4785 (class 2606 OID 33838)
-- -- Name: orders orders_customerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.orders
--     ADD CONSTRAINT orders_customerid_fkey FOREIGN KEY (customerid) REFERENCES public.customers(id);


-- --
-- -- TOC entry 4786 (class 2606 OID 33843)
-- -- Name: orders orders_unregistercustomerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.orders
--     ADD CONSTRAINT orders_unregistercustomerid_fkey FOREIGN KEY (unregistercustomerid) REFERENCES public.unregistercustomer(id);


-- --
-- -- TOC entry 4783 (class 2606 OID 25240)
-- -- Name: preorderitems preorderitems_orderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.preorderitems
--     ADD CONSTRAINT preorderitems_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.preorder(id);


-- --
-- -- TOC entry 4784 (class 2606 OID 25533)
-- -- Name: verification verification_customerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --

-- ALTER TABLE ONLY public.verification
--     ADD CONSTRAINT verification_customerid_fkey FOREIGN KEY (customerid) REFERENCES public.customers(id);


-- -- Completed on 2024-11-17 01:07:07

-- --
-- -- PostgreSQL database dump complete
-- --

