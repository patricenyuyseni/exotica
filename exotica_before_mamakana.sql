--
-- PostgreSQL database dump
--

\restrict nQLSXO7VWSLb51yHbJC4vh8r88r87ztMBmUgw3XgnP7ztAWhgusPZtQtsflKCNK

-- Dumped from database version 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)
-- Dumped by pg_dump version 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    product_id uuid,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    product_id uuid,
    price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    subtotal numeric(10,2) NOT NULL,
    shipping numeric(10,2) DEFAULT 0,
    tax numeric(10,2) DEFAULT 0,
    total numeric(10,2) NOT NULL,
    payment_status text DEFAULT 'pending'::text,
    order_status text DEFAULT 'pending'::text,
    shipping_address jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: product_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    url text NOT NULL,
    alt text,
    "position" integer DEFAULT 0
);


ALTER TABLE public.product_images OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    category_id uuid,
    price numeric(10,2) NOT NULL,
    compare_at_price numeric(10,2),
    image text NOT NULL,
    images text[],
    stock_quantity integer DEFAULT 0,
    sku text NOT NULL,
    rating numeric(2,1) DEFAULT 0,
    review_count integer DEFAULT 0,
    featured boolean DEFAULT false,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    product_id uuid,
    rating integer NOT NULL,
    title text,
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    password_hash text NOT NULL,
    role text DEFAULT 'customer'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: wishlists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wishlists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    product_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.wishlists OWNER TO postgres;

--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_items (id, user_id, product_id, quantity, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, slug, description, created_at, updated_at) FROM stdin;
752a9164-312a-44cd-8912-093978c75934	Exotic Botanicals	exotic-botanicals	Rare botanicals and plant extracts	2026-09-23 03:17:21.835531+01	2026-09-23 03:17:21.835531+01
a256c91f-4523-4ce4-91c7-60645436bebe	Herbal Blends	herbal-blends	Curated herbal blends	2026-09-23 03:17:21.835531+01	2026-09-23 03:17:21.835531+01
befe8a13-13d6-436e-a5d6-982811afca5b	Aromatic Products	aromatic-products	Premium aromatic products	2026-09-23 03:17:21.835531+01	2026-09-23 03:17:21.835531+01
49f96cef-8be4-4d84-9c4f-76410750d971	Lifestyle Accessories	lifestyle-accessories	Luxury lifestyle accessories	2026-09-23 03:17:21.835531+01	2026-09-23 03:17:21.835531+01
323aa540-698e-49ce-8fc1-941702202fbb	Fleurs CBD	fleurs-cbd	\N	2026-09-25 16:27:53.658462+01	2026-09-25 16:27:53.658462+01
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, price, quantity, created_at) FROM stdin;
a63cca8a-5cb3-48b7-b085-c1613f59dfce	97fc6e80-8158-4ab1-81fa-9eb3978893e7	ed540a4e-364c-4f0a-b525-ea5c1bbdc57e	149.99	2	2026-09-23 15:39:51.77668+01
12b24254-4156-485e-8ed7-a332b2757476	97fc6e80-8158-4ab1-81fa-9eb3978893e7	9d491fb7-8f7d-4552-94c1-b6840b0afb1b	129.99	1	2026-09-23 15:39:51.77668+01
4c25f3db-6ef3-4b7e-a09d-71151578b6bc	97fc6e80-8158-4ab1-81fa-9eb3978893e7	9411e49d-c61e-42e3-b707-ed1dc8b51875	300.00	1	2026-09-23 15:39:51.77668+01
afae181a-874a-4133-a4fb-b86a591a5a01	d7c9e713-cb75-45fb-a0ec-1a8c3828a8f0	9d491fb7-8f7d-4552-94c1-b6840b0afb1b	129.99	1	2026-09-23 15:44:53.863051+01
00690c13-caf0-47af-aa11-0d8ffe26aefc	d7c9e713-cb75-45fb-a0ec-1a8c3828a8f0	899d45ac-326d-48d9-895c-b6399b10f68d	199.99	1	2026-09-23 15:44:53.863051+01
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, user_id, subtotal, shipping, tax, total, payment_status, order_status, shipping_address, created_at, updated_at) FROM stdin;
97fc6e80-8158-4ab1-81fa-9eb3978893e7	\N	729.97	0.00	0.00	729.97	pending	processing	{"name": "Patrice Flezybb", "email": "patriceflezy123@gmail.com", "notes": "nb", "phone": "+237680642599"}	2026-09-23 15:39:51.77668+01	2026-09-23 15:39:51.77668+01
d7c9e713-cb75-45fb-a0ec-1a8c3828a8f0	\N	329.98	0.00	0.00	329.98	pending	processing	{"name": "slow", "email": "patriceflezy123@gmail.com", "notes": "dd", "phone": "680642599"}	2026-09-23 15:44:53.863051+01	2026-09-23 15:44:53.863051+01
\.


--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_images (id, product_id, url, alt, "position") FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, slug, description, category_id, price, compare_at_price, image, images, stock_quantity, sku, rating, review_count, featured, active, created_at, updated_at) FROM stdin;
74d2432f-7058-4f96-b2d2-2e82b4886a1d	Purple Nebula	purple-nebula	Fragrant nebula-inspired aroma.	befe8a13-13d6-436e-a5d6-982811afca5b	89.99	\N	/images/products/purple-nebula.jpg	{/images/products/purple-nebula.jpg}	30	EX-PURP-002	4.6	12	f	t	2026-09-23 03:17:21.871517+01	2026-09-23 03:17:21.871517+01
892b4310-c391-4b26-8fc1-85298bb9a8d0	Tropical Mist	tropical-mist	Refreshing tropical botanical mist.	a256c91f-4523-4ce4-91c7-60645436bebe	59.99	\N	/images/products/tropical-mist.jpg	{/images/products/tropical-mist.jpg}	100	EX-TROP-004	4.5	5	f	t	2026-09-23 03:17:21.871517+01	2026-09-23 03:17:21.871517+01
6e89ca31-30d5-4173-9421-7c8aa3492bfc	Cosmic Dream	cosmic-dream	Dreamlike aromatic experience.	befe8a13-13d6-436e-a5d6-982811afca5b	119.99	\N	/images/products/cosmic-dream.jpg	{/images/products/cosmic-dream.jpg}	40	EX-COSM-006	4.4	6	f	t	2026-09-23 03:17:21.871517+01	2026-09-23 03:17:21.871517+01
7542aca4-201d-41db-b2b7-7c039cf0533c	maryjane	maryjane	indoor	\N	200.00	\N	/images/products/1790140338763-1050b6c8-7627-417c-be34-46966dfe8d89.jpeg	{/images/products/1790140338763-1050b6c8-7627-417c-be34-46966dfe8d89.jpeg}	5	rrr	0.0	0	f	t	2026-09-23 06:12:18.794747+01	2026-09-23 06:12:18.794747+01
ed540a4e-364c-4f0a-b525-ea5c1bbdc57e	Velvet Sunset	velvet-sunset	Velvet-smooth exotic extract.	752a9164-312a-44cd-8912-093978c75934	149.99	179.99	/images/products/velvet-sunset.jpg	{/images/products/velvet-sunset.jpg}	18	EX-VELV-005	4.7	16	t	t	2026-09-23 03:17:21.871517+01	2026-09-23 15:39:51.77668+01
9411e49d-c61e-42e3-b707-ed1dc8b51875	monrock	monrock	sativa indica	\N	300.00	\N	/images/products/1790140995881-03d61757-ede6-4607-979b-f73f9d065868.jpeg	{/images/products/1790140995881-03d61757-ede6-4607-979b-f73f9d065868.jpeg}	6	wx	0.0	0	f	t	2026-09-23 06:23:15.920143+01	2026-09-23 15:39:51.77668+01
9d491fb7-8f7d-4552-94c1-b6840b0afb1b	Moonlight	moonlight	A luminous exotic botanical blend.	752a9164-312a-44cd-8912-093978c75934	129.99	159.99	/images/products/moonlight.jpg	{/images/products/moonlight.jpg}	48	EX-MOON-001	4.8	24	t	t	2026-09-23 03:17:21.871517+01	2026-09-23 15:44:53.863051+01
899d45ac-326d-48d9-895c-b6399b10f68d	Golden Mirage	golden-mirage	Golden notes of luxury and warmth.	49f96cef-8be4-4d84-9c4f-76410750d971	199.99	249.99	/images/products/golden-mirage.jpg	{/images/products/golden-mirage.jpg}	14	EX-GOLD-003	4.9	8	t	t	2026-09-23 03:17:21.871517+01	2026-09-23 15:44:53.863051+01
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, user_id, product_id, rating, title, comment, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, phone, password_hash, role, created_at, updated_at) FROM stdin;
6a85d71e-7005-42bc-bdc8-371f4d647ce1	DB Test	dbtest@example.com	\N	test-hash	customer	2026-09-23 04:19:44.836201+01	2026-09-23 04:19:44.836201+01
9102d940-73b9-4db7-956b-7f1c892226f1	Patrice New	patrice-new-2026@example.com	\N	$2a$10$0qQhEFvaa1YGZSNM3ITVyO6ICqxlt0Sg3f8seJhYGmHYUflnJVHzS	customer	2026-09-23 05:05:42.409245+01	2026-09-23 05:05:42.409245+01
621a01c2-fe9a-4d87-a58e-f152547cd227	Patrice Flezy	patriceflezy123@gmail.com	\N	$2a$10$84Lhqj7PMLCGI54BKx7A/.pEugSEKDUvEEqiJ/LjqNdoplm8Suy66	admin	2026-09-23 05:07:58.319848+01	2026-09-23 05:07:58.319848+01
293d347a-ce1b-4af6-bb99-bcd14e642ff8	slow	leafyleafy281@gmail.com	\N	$2a$10$5LaX54sJN8lzRbiWMiBF.eMSSZ6sfKZClE1DSIJxUtTUDNeXOPHzS	customer	2026-09-23 15:58:29.701068+01	2026-09-23 15:58:29.701068+01
\.


--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wishlists (id, user_id, product_id, created_at) FROM stdin;
\.


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- Name: idx_products_sku; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_sku ON public.products USING btree (sku);


--
-- Name: idx_products_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_slug ON public.products USING btree (slug);


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: reviews reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: wishlists wishlists_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: wishlists wishlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict nQLSXO7VWSLb51yHbJC4vh8r88r87ztMBmUgw3XgnP7ztAWhgusPZtQtsflKCNK

