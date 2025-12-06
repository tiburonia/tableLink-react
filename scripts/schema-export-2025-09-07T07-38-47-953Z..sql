--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (84ade85)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;-+
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    discount_type character varying(20) NOT NULL,
    discount_value integer NOT NULL,
    min_order_price integer,
    max_discount_value integer,
    store_id integer,
    valid_from timestamp without time zone,
    valid_until timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coupons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coupons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coupons_id_seq OWNED BY public.coupons.id;


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorites (
    id integer NOT NULL,
    user_id integer NOT NULL,
    store_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.favorites_id_seq OWNED BY public.favorites.id;


--
-- Name: global_regular_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.global_regular_levels (
    id integer NOT NULL,
    level character varying(20) NOT NULL,
    min_orders integer,
    min_spent integer,
    min_reviews integer,
    benefits jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: global_regular_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.global_regular_levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: global_regular_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.global_regular_levels_id_seq OWNED BY public.global_regular_levels.id;


--
-- Name: guest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guest (
    id integer NOT NULL,
    phone character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: guest_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.guest_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: guest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.guest_id_seq OWNED BY public.guest.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(30) NOT NULL,
    title character varying(100) NOT NULL,
    message text NOT NULL,
    metadata jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: order_adjustments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_adjustments (
    id integer NOT NULL,
    order_id integer NOT NULL,
    ticket_id integer,
    item_id integer,
    scope character varying(10) NOT NULL,
    kind character varying(20) NOT NULL,
    method character varying(20) NOT NULL,
    code character varying(50),
    amount_signed integer NOT NULL,
    meta jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: order_adjustments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_adjustments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_adjustments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_adjustments_id_seq OWNED BY public.order_adjustments.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    menu_id integer NOT NULL,
    menu_name character varying(100),
    quantity integer DEFAULT 1 NOT NULL,
    unit_price integer DEFAULT 0,
    total_price integer NOT NULL,
    item_status character varying(20) DEFAULT 'PENDING'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cook_station character varying(50)
);


--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: order_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_tickets (
    id integer NOT NULL,
    order_id integer NOT NULL,
    batch_no integer NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    version integer DEFAULT 1 NOT NULL,
    print_status character varying(20) DEFAULT 'WAITING'::character varying,
    display_status character varying(20) DEFAULT 'VISIBLE'::character varying,
    payment_type character varying(20) DEFAULT 'POSTPAID'::character varying NOT NULL
);


--
-- Name: order_tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_tickets_id_seq OWNED BY public.order_tickets.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    store_id integer NOT NULL,
    user_id integer,
    guest_id integer,
    source character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'OPEN'::character varying NOT NULL,
    payment_status character varying(20) DEFAULT 'UNPAID'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    " total_price" integer DEFAULT 0,
    CONSTRAINT chk_user_or_guest CHECK ((((user_id IS NOT NULL) AND (guest_id IS NULL)) OR ((user_id IS NULL) AND (guest_id IS NOT NULL))))
);


--
-- Name: ordrers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ordrers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ordrers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ordrers_id_seq OWNED BY public.orders.id;


--
-- Name: payment_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_details (
    id integer NOT NULL,
    payment_id integer NOT NULL,
    detail_key character varying(50) NOT NULL,
    detail_value character varying(255) NOT NULL
);


--
-- Name: payment_details_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_details_id_seq OWNED BY public.payment_details.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    order_id integer NOT NULL,
    ticket_id integer,
    method character varying(20) NOT NULL,
    amount integer NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    transaction_id character varying(100),
    provider_response jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    paid_at timestamp without time zone
);


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: refunds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refunds (
    id integer NOT NULL,
    payment_id integer NOT NULL,
    refund_amount integer NOT NULL,
    reason character varying(100),
    status character varying(20) DEFAULT 'REQUESTED'::character varying,
    transaction_id character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    processed_at timestamp without time zone
);


--
-- Name: refunds_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refunds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refunds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refunds_id_seq OWNED BY public.refunds.id;


--
-- Name: reservations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservations (
    id integer NOT NULL,
    store_id integer NOT NULL,
    table_id integer,
    user_id integer,
    reserved_at timestamp without time zone NOT NULL,
    party_size integer NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: reservations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reservations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reservations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reservations_id_seq OWNED BY public.reservations.id;


--
-- Name: review_repiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_repiles (
    id integer NOT NULL,
    review_id integer NOT NULL,
    owner_id integer NOT NULL,
    content text NOT NULL,
    status character varying(20) DEFAULT 'VISIBLE'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_At" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: review_repiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_repiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_repiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_repiles_id_seq OWNED BY public.review_repiles.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    order_id integer NOT NULL,
    store_id integer NOT NULL,
    rating integer NOT NULL,
    content text,
    images jsonb,
    status character varying(20) DEFAULT 'VISIBLE'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer NOT NULL,
    CONSTRAINT chk_raiting CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: store_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_addresses (
    id integer NOT NULL,
    store_id integer NOT NULL,
    road_address character varying(200),
    jibun_address character varying(200),
    detail_address character varying(100),
    postal_code character varying(20),
    sido character varying(50),
    sigungu character varying(50),
    eupmyeondong character varying(50),
    legal_code character varying(20),
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    geom public.geometry(Point,4326) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: store_addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.store_addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: store_addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.store_addresses_id_seq OWNED BY public.store_addresses.id;


--
-- Name: store_info; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_info (
    store_id integer NOT NULL,
    name character varying(50) NOT NULL,
    category character varying(50),
    store_tel_number integer,
    rating_average integer DEFAULT 0,
    review_count integer DEFAULT 0,
    favoratite_count integer DEFAULT 0
);


--
-- Name: store_info_store_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.store_info_store_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: store_info_store_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.store_info_store_id_seq OWNED BY public.store_info.store_id;


--
-- Name: store_menu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_menu (
    id integer NOT NULL,
    store_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    price integer NOT NULL,
    cook_station character varying(50) NOT NULL
);


--
-- Name: store_menu_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.store_menu_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: store_menu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.store_menu_id_seq OWNED BY public.store_menu.id;


--
-- Name: store_point_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_point_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    store_id integer NOT NULL,
    change_type character varying(20) NOT NULL,
    amount integer NOT NULL,
    balance_after integer NOT NULL,
    reason text,
    related_order_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: store_point_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.store_point_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: store_point_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.store_point_logs_id_seq OWNED BY public.store_point_logs.id;


--
-- Name: store_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_points (
    id integer NOT NULL,
    user_id integer NOT NULL,
    store_id integer NOT NULL,
    balance integer DEFAULT 0,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: store_points_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.store_points_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: store_points_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.store_points_id_seq OWNED BY public.store_points.id;


--
-- Name: store_regular_customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_regular_customers (
    id integer NOT NULL,
    user_id integer NOT NULL,
    store_id integer NOT NULL,
    level_id integer,
    visist_count integer DEFAULT 0,
    total_spent integer DEFAULT 0,
    last_visit timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: store_regular_customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.store_regular_customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: store_regular_customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.store_regular_customers_id_seq OWNED BY public.store_regular_customers.id;


--
-- Name: store_regular_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_regular_events (
    id integer NOT NULL,
    user_id integer NOT NULL,
    store_id integer NOT NULL,
    event_type character varying(20) NOT NULL,
    metadata jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: store_regular_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.store_regular_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: store_regular_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.store_regular_events_id_seq OWNED BY public.store_regular_events.id;


--
-- Name: store_regular_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_regular_levels (
    id integer NOT NULL,
    store_id integer NOT NULL,
    level character varying(20) NOT NULL,
    min_orders integer,
    min_spent integer,
    benefits jsonb
);


--
-- Name: store_regular_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.store_regular_levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: store_regular_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.store_regular_levels_id_seq OWNED BY public.store_regular_levels.id;


--
-- Name: store_tables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_tables (
    id integer NOT NULL,
    store_id integer NOT NULL,
    table_name character varying(50) NOT NULL,
    capacity integer DEFAULT 2 NOT NULL,
    status character varying(20) DEFAULT 'AVAILABLE'::character varying NOT NULL,
    qr_code character varying(255),
    pos_session_id integer,
    x_coord integer,
    y_coord integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: store_tables_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.store_tables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: store_tables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.store_tables_id_seq OWNED BY public.store_tables.id;


--
-- Name: stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stores (
    id integer NOT NULL,
    name character varying(50),
    is_open boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: stores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stores_id_seq OWNED BY public.stores.id;


--
-- Name: user_coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_coupons (
    id integer NOT NULL,
    coupon_id integer NOT NULL,
    user_id integer NOT NULL,
    issued_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone,
    status character varying(20) DEFAULT 'AVAILABLE'::character varying
);


--
-- Name: user_coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_coupons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_coupons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_coupons_id_seq OWNED BY public.user_coupons.id;


--
-- Name: user_global_regulars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_global_regulars (
    user_id integer NOT NULL,
    level_id integer,
    total_orders integer DEFAULT 0,
    total_spent integer DEFAULT 0,
    total_reviews integer DEFAULT 0,
    last_update timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    user_id character varying(50) NOT NULL,
    password character varying(50) NOT NULL,
    name character varying(50) NOT NULL,
    phone character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: coupons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons ALTER COLUMN id SET DEFAULT nextval('public.coupons_id_seq'::regclass);


--
-- Name: favorites id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites ALTER COLUMN id SET DEFAULT nextval('public.favorites_id_seq'::regclass);


--
-- Name: global_regular_levels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_regular_levels ALTER COLUMN id SET DEFAULT nextval('public.global_regular_levels_id_seq'::regclass);


--
-- Name: guest id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest ALTER COLUMN id SET DEFAULT nextval('public.guest_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: order_adjustments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_adjustments ALTER COLUMN id SET DEFAULT nextval('public.order_adjustments_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: order_tickets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_tickets ALTER COLUMN id SET DEFAULT nextval('public.order_tickets_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.ordrers_id_seq'::regclass);


--
-- Name: payment_details id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_details ALTER COLUMN id SET DEFAULT nextval('public.payment_details_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: refunds id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds ALTER COLUMN id SET DEFAULT nextval('public.refunds_id_seq'::regclass);


--
-- Name: reservations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations ALTER COLUMN id SET DEFAULT nextval('public.reservations_id_seq'::regclass);


--
-- Name: review_repiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_repiles ALTER COLUMN id SET DEFAULT nextval('public.review_repiles_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: store_addresses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_addresses ALTER COLUMN id SET DEFAULT nextval('public.store_addresses_id_seq'::regclass);


--
-- Name: store_info store_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_info ALTER COLUMN store_id SET DEFAULT nextval('public.store_info_store_id_seq'::regclass);


--
-- Name: store_menu id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_menu ALTER COLUMN id SET DEFAULT nextval('public.store_menu_id_seq'::regclass);


--
-- Name: store_point_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_point_logs ALTER COLUMN id SET DEFAULT nextval('public.store_point_logs_id_seq'::regclass);


--
-- Name: store_points id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_points ALTER COLUMN id SET DEFAULT nextval('public.store_points_id_seq'::regclass);


--
-- Name: store_regular_customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_regular_customers ALTER COLUMN id SET DEFAULT nextval('public.store_regular_customers_id_seq'::regclass);


--
-- Name: store_regular_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_regular_events ALTER COLUMN id SET DEFAULT nextval('public.store_regular_events_id_seq'::regclass);


--
-- Name: store_regular_levels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_regular_levels ALTER COLUMN id SET DEFAULT nextval('public.store_regular_levels_id_seq'::regclass);


--
-- Name: store_tables id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_tables ALTER COLUMN id SET DEFAULT nextval('public.store_tables_id_seq'::regclass);


--
-- Name: stores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores ALTER COLUMN id SET DEFAULT nextval('public.stores_id_seq'::regclass);


--
-- Name: user_coupons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_coupons ALTER COLUMN id SET DEFAULT nextval('public.user_coupons_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: store_regular_levels UK_store_regular_level; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_regular_levels
    ADD CONSTRAINT "UK_store_regular_level" UNIQUE (store_id, level);


--
-- Name: favorites UQ_favorite; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT "UQ_favorite" UNIQUE (user_id, store_id);


--
-- Name: reviews UQ_review_order; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "UQ_review_order" UNIQUE (order_id);


--
-- Name: store_regular_customers UQ_store_regular_customer; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_regular_customers
    ADD CONSTRAINT "UQ_store_regular_customer" UNIQUE (user_id, store_id);


--
-- Name: store_regular_levels constraint_2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_regular_levels
    ADD CONSTRAINT constraint_2 PRIMARY KEY (id);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: global_regular_levels global_regular_levels_level_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_regular_levels
    ADD CONSTRAINT global_regular_levels_level_key UNIQUE (level);


--
-- Name: global_regular_levels global_regular_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_regular_levels
    ADD CONSTRAINT global_regular_levels_pkey PRIMARY KEY (id);


--
-- Name: guest guest_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest
    ADD CONSTRAINT guest_phone_key UNIQUE (phone);


--
-- Name: guest guest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest
    ADD CONSTRAINT guest_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_adjustments order_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_adjustments
    ADD CONSTRAINT order_adjustments_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_tickets order_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_tickets
    ADD CONSTRAINT order_tickets_pkey PRIMARY KEY (id);


--
-- Name: orders ordrers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT ordrers_pkey PRIMARY KEY (id);


--
-- Name: payment_details payment_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_details
    ADD CONSTRAINT payment_details_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);


--
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);


--
-- Name: review_repiles review_repiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_repiles
    ADD CONSTRAINT review_repiles_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: store_addresses store_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_addresses
    ADD CONSTRAINT store_addresses_pkey PRIMARY KEY (id);


--
-- Name: store_addresses store_addresses_store_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_addresses
    ADD CONSTRAINT store_addresses_store_id_key UNIQUE (store_id);


--
-- Name: store_info store_info_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_info
    ADD CONSTRAINT store_info_pkey PRIMARY KEY (store_id);


--
-- Name: store_menu store_menu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_menu
    ADD CONSTRAINT store_menu_pkey PRIMARY KEY (id);


--
-- Name: store_point_logs store_point_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_point_logs
    ADD CONSTRAINT store_point_logs_pkey PRIMARY KEY (id);


--
-- Name: store_points store_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_points
    ADD CONSTRAINT store_points_pkey PRIMARY KEY (id);


--
-- Name: store_points store_points_user_id_store_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_points
    ADD CONSTRAINT store_points_user_id_store_id_key UNIQUE (user_id, store_id);


--
-- Name: store_regular_customers store_regular_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_regular_customers
    ADD CONSTRAINT store_regular_customers_pkey PRIMARY KEY (id);


--
-- Name: store_regular_events store_regular_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_regular_events
    ADD CONSTRAINT store_regular_events_pkey PRIMARY KEY (id);


--
-- Name: store_tables store_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_tables
    ADD CONSTRAINT store_tables_pkey PRIMARY KEY (id);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: user_coupons user_coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_coupons
    ADD CONSTRAINT user_coupons_pkey PRIMARY KEY (id);


--
-- Name: user_global_regulars user_global_regulars_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_global_regulars
    ADD CONSTRAINT user_global_regulars_pkey PRIMARY KEY (user_id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_id_key UNIQUE (user_id);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id, is_read);


--
-- Name: idx_regular_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regular_events_type ON public.store_regular_events USING btree (event_type);


--
-- Name: idx_regular_events_user_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regular_events_user_store ON public.store_regular_events USING btree (user_id, store_id);


--
-- Name: idx_store_geom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_geom ON public.store_addresses USING gist (geom);


--
-- Name: idx_store_legal_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_legal_code ON public.store_addresses USING btree (legal_code);


--
-- Name: user_coupons FK_coupon_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_coupons
    ADD CONSTRAINT "FK_coupon_id" FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;


--
-- Name: orders FK_guest_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "FK_guest_id" FOREIGN KEY (guest_id) REFERENCES public.guest(id) ON DELETE SET NULL;


--
-- Name: order_adjustments FK_item_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_adjustments
    ADD CONSTRAINT "FK_item_id" FOREIGN KEY (item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- Name: order_items FK_menu_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "FK_menu_id" FOREIGN KEY (menu_id) REFERENCES public.store_menu(id);


--
-- Name: order_tickets FK_order_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_tickets
    ADD CONSTRAINT "FK_order_id" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_adjustments FK_order_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_adjustments
    ADD CONSTRAINT "FK_order_id" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: payments FK_order_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_order_id" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: reviews FK_order_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "FK_order_id" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: review_repiles FK_owner_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_repiles
    ADD CONSTRAINT "FK_owner_id" FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payment_details FK_payment_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_details
    ADD CONSTRAINT "FK_payment_id" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;


--
-- Name: refunds FK_payment_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT "FK_payment_id" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;


--
-- Name: store_tables FK_pos_session_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_tables
    ADD CONSTRAINT "FK_pos_session_id" FOREIGN KEY (pos_session_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: review_repiles FK_review_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_repiles
    ADD CONSTRAINT "FK_review_id" FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: store_menu FK_store_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_menu
    ADD CONSTRAINT "FK_store_id" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: orders FK_store_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "FK_store_id" FOREIGN KEY (store_id) REFERENCES public.stores(id);


--
-- Name: store_info FK_store_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_info
    ADD CONSTRAINT "FK_store_id" FOREIGN KEY (store_id) REFERENCES public.stores(id);


--
-- Name: store_tables FK_store_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_tables
    ADD CONSTRAINT "FK_store_id" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: reservations FK_store_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT "FK_store_id" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: reviews FK_store_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "FK_store_id" FOREIGN KEY (id) REFERENCES public.stores(id);


--
-- Name: favorites FK_store_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT "FK_store_id" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: store_regular_levels FK_store_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_regular_levels
    ADD CONSTRAINT "FK_store_id" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: reservations FK_table_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT "FK_table_id" FOREIGN KEY (table_id) REFERENCES public.store_tables(id);


--
-- Name: order_items FK_ticket_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "FK_ticket_id" FOREIGN KEY (ticket_id) REFERENCES public.order_tickets(id);


--
-- Name: order_adjustments FK_ticket_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_adjustments
    ADD CONSTRAINT "FK_ticket_id" FOREIGN KEY (ticket_id) REFERENCES public.guest(id) ON DELETE CASCADE;


--
-- Name: payments FK_ticket_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_ticket_id" FOREIGN KEY (ticket_id) REFERENCES public.order_tickets(id) ON DELETE CASCADE;


--
-- Name: orders FK_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "FK_user_id" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reservations FK_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT "FK_user_id" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reviews FK_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "FK_user_id" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: favorites FK_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT "FK_user_id" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_coupons FK_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_coupons
    ADD CONSTRAINT "FK_user_id" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: store_regular_customers FK_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_regular_customers
    ADD CONSTRAINT "FK_user_id" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: coupons coupons_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id);


--
-- Name: store_regular_customers fk_store_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_regular_customers
    ADD CONSTRAINT fk_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: store_addresses store_addresses_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_addresses
    ADD CONSTRAINT store_addresses_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: store_point_logs store_point_logs_related_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_point_logs
    ADD CONSTRAINT store_point_logs_related_order_id_fkey FOREIGN KEY (related_order_id) REFERENCES public.orders(id);


--
-- Name: store_point_logs store_point_logs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_point_logs
    ADD CONSTRAINT store_point_logs_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id);


--
-- Name: store_point_logs store_point_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_point_logs
    ADD CONSTRAINT store_point_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: store_points store_points_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_points
    ADD CONSTRAINT store_points_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: store_points store_points_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_points
    ADD CONSTRAINT store_points_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: store_regular_events store_regular_events_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_regular_events
    ADD CONSTRAINT store_regular_events_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: store_regular_events store_regular_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_regular_events
    ADD CONSTRAINT store_regular_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_global_regulars user_global_regulars_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_global_regulars
    ADD CONSTRAINT user_global_regulars_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.global_regular_levels(id);


--
-- Name: user_global_regulars user_global_regulars_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_global_regulars
    ADD CONSTRAINT user_global_regulars_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

