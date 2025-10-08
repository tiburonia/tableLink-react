--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (165f042)
-- Dumped by pg_dump version 16.9

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO neondb_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: neondb_owner
--

COMMENT ON SCHEMA public IS '';


--
-- Name: test; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA test;


ALTER SCHEMA test OWNER TO neondb_owner;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: handle_order_session_close(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.handle_order_session_close() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- session_status가 OPEN에서 CLOSE로 변경되었을 때 로그만 기록
  IF (OLD.session_status IS NULL OR OLD.session_status = 'OPEN') AND NEW.session_status = 'CLOSE' THEN
    RAISE NOTICE 'TLL/POS 세션 종료 감지: 주문 % (매장: %, 테이블: %) %->% - store_tables는 각 API에서 처리됨', 
                 NEW.id, NEW.store_id, NEW.table_num, OLD.session_status, NEW.session_status;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_order_session_close() OWNER TO neondb_owner;

--
-- Name: FUNCTION handle_order_session_close(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.handle_order_session_close() IS '주문 세션 종료 시 테이블 해제 처리 함수';


--
-- Name: notify_kds_item_change(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.notify_kds_item_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  store_id_val integer;
BEGIN
  -- order_items에서 store_id 가져오기
  SELECT o.store_id INTO store_id_val
  FROM orders o
  JOIN order_tickets ot ON o.id = ot.order_id
  WHERE ot.id = COALESCE(NEW.ticket_id, OLD.ticket_id);

  PERFORM pg_notify(
    'kds_item_events',
    json_build_object(
      'action', TG_OP,
      'item_id', COALESCE(NEW.id, OLD.id),
      'ticket_id', COALESCE(NEW.ticket_id, OLD.ticket_id),
      'store_id', store_id_val,
      'menu_name', COALESCE(NEW.menu_name, OLD.menu_name),
      'item_status', COALESCE(NEW.item_status, OLD.item_status),
      'cook_station', COALESCE(NEW.cook_station, OLD.cook_station),
      'timestamp', CURRENT_TIMESTAMP
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.notify_kds_item_change() OWNER TO neondb_owner;

--
-- Name: FUNCTION notify_kds_item_change(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.notify_kds_item_change() IS 'KDS 아이템 변경 실시간 알림 함수';


--
-- Name: notify_kds_order_change(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.notify_kds_order_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  PERFORM pg_notify(
    'kds_order_events',
    json_build_object(
      'action', TG_OP,
      'order_id', COALESCE(NEW.id, OLD.id),
      'store_id', COALESCE(NEW.store_id, OLD.store_id),
      'table_num', COALESCE(NEW.table_num, OLD.table_num),
      'status', COALESCE(NEW.session_status, OLD.session_status),
      'timestamp', CURRENT_TIMESTAMP
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.notify_kds_order_change() OWNER TO neondb_owner;

--
-- Name: FUNCTION notify_kds_order_change(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.notify_kds_order_change() IS 'KDS 주문 변경 실시간 알림 함수';


--
-- Name: notify_kds_payment_change(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.notify_kds_payment_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  store_id_val integer;
  table_number_val integer;
  ticket_ids_array integer[];
BEGIN
  -- payments에서 order_id를 통해 orders 테이블에서 store_id와 table_num 가져오기
  SELECT o.store_id, o.table_num INTO store_id_val, table_number_val
  FROM orders o
  WHERE o.id = COALESCE(NEW.order_id, OLD.order_id);

  -- payment_details에서 해당 payment의 ticket_id들 가져오기
  SELECT ARRAY_AGG(pd.ticket_id) INTO ticket_ids_array
  FROM payment_details pd
  WHERE pd.payment_id = COALESCE(NEW.id, OLD.id);

  PERFORM pg_notify(
    'kds_payment_events',
    json_build_object(
      'action', TG_OP,
      'payment_id', COALESCE(NEW.id, OLD.id),
      'order_id', COALESCE(NEW.order_id, OLD.order_id),
      'ticket_ids', COALESCE(ticket_ids_array, ARRAY[]::integer[]),
      'store_id', store_id_val,
      'table_number', table_number_val,
      'final_amount', COALESCE(NEW.amount, OLD.amount),
      'status', COALESCE(NEW.status, OLD.status),
      'timestamp', CURRENT_TIMESTAMP
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.notify_kds_payment_change() OWNER TO neondb_owner;

--
-- Name: FUNCTION notify_kds_payment_change(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.notify_kds_payment_change() IS 'KDS 결제 변경 실시간 알림 함수 (새 스키마 호환)';


--
-- Name: notify_kds_ticket_change(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.notify_kds_ticket_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  store_id_val integer;
BEGIN
  -- order_tickets에서 store_id 가져오기
  SELECT o.store_id INTO store_id_val
  FROM orders o
  WHERE o.id = COALESCE(NEW.order_id, OLD.order_id);

  PERFORM pg_notify(
    'kds_ticket_events',
    json_build_object(
      'action', TG_OP,
      'ticket_id', COALESCE(NEW.id, OLD.id),
      'order_id', COALESCE(NEW.order_id, OLD.order_id),
      'store_id', store_id_val,
      'status', COALESCE(NEW.status, OLD.status),
      'display_status', COALESCE(NEW.display_status, OLD.display_status),
      'timestamp', CURRENT_TIMESTAMP
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.notify_kds_ticket_change() OWNER TO neondb_owner;

--
-- Name: FUNCTION notify_kds_ticket_change(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.notify_kds_ticket_change() IS 'KDS 티켓 변경 실시간 알림 함수';


--
-- Name: update_table_status_on_session_close(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.update_table_status_on_session_close() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- session_status가 OPEN에서 CLOSED로 변경된 경우
    IF OLD.session_status = 'OPEN' AND NEW.session_status = 'CLOSED' THEN
        -- processing_order_id가 이 주문 ID와 같은 테이블을 AVAILABLE로 변경
        UPDATE store_tables 
        SET 
            status = 'AVAILABLE',
            processing_order_id = NULL
        WHERE 
            store_id = NEW.store_id 
            AND processing_order_id = NEW.id;
            
        -- 로그용
        RAISE NOTICE 'Table with processing_order_id % at store % set to AVAILABLE due to session close (OPEN->CLOSED)', 
                     NEW.id, NEW.store_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_table_status_on_session_close() OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: administrative_areas; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.administrative_areas (
    code character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    level character varying(20) NOT NULL,
    parent_code character varying(10),
    geom public.geometry(Polygon,4326),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.administrative_areas OWNER TO neondb_owner;

--
-- Name: coupons; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.coupons OWNER TO neondb_owner;

--
-- Name: coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.coupons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coupons_id_seq OWNER TO neondb_owner;

--
-- Name: coupons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.coupons_id_seq OWNED BY public.coupons.id;


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.favorites (
    id integer NOT NULL,
    user_id integer NOT NULL,
    store_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.favorites OWNER TO neondb_owner;

--
-- Name: favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.favorites_id_seq OWNER TO neondb_owner;

--
-- Name: favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.favorites_id_seq OWNED BY public.favorites.id;


--
-- Name: global_regular_levels; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.global_regular_levels OWNER TO neondb_owner;

--
-- Name: global_regular_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.global_regular_levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.global_regular_levels_id_seq OWNER TO neondb_owner;

--
-- Name: global_regular_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.global_regular_levels_id_seq OWNED BY public.global_regular_levels.id;


--
-- Name: guests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.guests (
    id integer NOT NULL,
    phone character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.guests OWNER TO neondb_owner;

--
-- Name: guest_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.guest_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guest_id_seq OWNER TO neondb_owner;

--
-- Name: guest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.guest_id_seq OWNED BY public.guests.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(30) NOT NULL,
    title character varying(100) NOT NULL,
    message text NOT NULL,
    metadata jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    sent_source character varying(20) DEFAULT 'TLL'::character varying,
    read_at timestamp without time zone
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: order_adjustments; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.order_adjustments OWNER TO neondb_owner;

--
-- Name: order_adjustments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.order_adjustments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_adjustments_id_seq OWNER TO neondb_owner;

--
-- Name: order_adjustments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.order_adjustments_id_seq OWNED BY public.order_adjustments.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: neondb_owner
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
    cook_station character varying(50),
    cancel_reason text,
    store_id integer NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    options jsonb,
    order_id integer NOT NULL,
    CONSTRAINT chk_item_status CHECK (((item_status)::text = ANY ((ARRAY['PENDING'::character varying, 'COOKING'::character varying, 'DONE'::character varying, 'CANCELED'::character varying])::text[])))
);


ALTER TABLE public.order_items OWNER TO neondb_owner;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO neondb_owner;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: order_tickets; Type: TABLE; Schema: public; Owner: neondb_owner
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
    payment_type character varying(20) DEFAULT 'POSTPAID'::character varying NOT NULL,
    source character varying(20) NOT NULL,
    store_id integer NOT NULL,
    table_num integer,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    printed_at timestamp without time zone,
    paid_status character varying DEFAULT 'UNPAID'::character varying
);


ALTER TABLE public.order_tickets OWNER TO neondb_owner;

--
-- Name: COLUMN order_tickets.printed_at; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.order_tickets.printed_at IS 'KDS에서 출력된 시간';


--
-- Name: order_tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.order_tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_tickets_id_seq OWNER TO neondb_owner;

--
-- Name: order_tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.order_tickets_id_seq OWNED BY public.order_tickets.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    store_id integer NOT NULL,
    user_id integer,
    guest_phone character varying,
    source character varying(20) NOT NULL,
    session_status character varying(20) DEFAULT 'OPEN'::character varying NOT NULL,
    payment_status character varying(20) DEFAULT 'UNPAID'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total_price integer DEFAULT 0,
    table_num integer,
    session_ended boolean DEFAULT false,
    session_ended_at timestamp without time zone,
    is_mixed boolean DEFAULT false
);


ALTER TABLE public.orders OWNER TO neondb_owner;

--
-- Name: ordrers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ordrers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ordrers_id_seq OWNER TO neondb_owner;

--
-- Name: ordrers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ordrers_id_seq OWNED BY public.orders.id;


--
-- Name: payment_details; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payment_details (
    id integer NOT NULL,
    payment_id integer NOT NULL,
    order_id integer NOT NULL,
    ticket_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payment_details OWNER TO neondb_owner;

--
-- Name: payment_details_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.payment_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_details_id_seq OWNER TO neondb_owner;

--
-- Name: payment_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.payment_details_id_seq OWNED BY public.payment_details.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    order_id integer NOT NULL,
    method character varying(20) NOT NULL,
    amount integer NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    transaction_id character varying(100),
    provider_response jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    paid_at timestamp without time zone
);


ALTER TABLE public.payments OWNER TO neondb_owner;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO neondb_owner;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: pending_payments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pending_payments (
    id integer NOT NULL,
    order_id character varying(100) NOT NULL,
    payment_key character varying(200),
    user_id character varying(50) NOT NULL,
    store_id integer NOT NULL,
    table_number integer DEFAULT 1 NOT NULL,
    order_data jsonb NOT NULL,
    amount integer NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_pk integer NOT NULL,
    CONSTRAINT pending_payments_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'SUCCESS'::character varying, 'FAIL'::character varying, 'CANCELED'::character varying])::text[])))
);


ALTER TABLE public.pending_payments OWNER TO neondb_owner;

--
-- Name: pending_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pending_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pending_payments_id_seq OWNER TO neondb_owner;

--
-- Name: pending_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pending_payments_id_seq OWNED BY public.pending_payments.id;


--
-- Name: refunds; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.refunds OWNER TO neondb_owner;

--
-- Name: refunds_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.refunds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refunds_id_seq OWNER TO neondb_owner;

--
-- Name: refunds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.refunds_id_seq OWNED BY public.refunds.id;


--
-- Name: reservations; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.reservations OWNER TO neondb_owner;

--
-- Name: reservations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.reservations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservations_id_seq OWNER TO neondb_owner;

--
-- Name: reservations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.reservations_id_seq OWNED BY public.reservations.id;


--
-- Name: review_repiles; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.review_repiles OWNER TO neondb_owner;

--
-- Name: review_repiles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.review_repiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_repiles_id_seq OWNER TO neondb_owner;

--
-- Name: review_repiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.review_repiles_id_seq OWNED BY public.review_repiles.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.reviews OWNER TO neondb_owner;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_id_seq OWNER TO neondb_owner;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: store_addresses; Type: TABLE; Schema: public; Owner: neondb_owner
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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    sido_code character varying(10),
    sigungu_code character varying(10),
    emd_code character varying(10)
);


ALTER TABLE public.store_addresses OWNER TO neondb_owner;

--
-- Name: store_addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.store_addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.store_addresses_id_seq OWNER TO neondb_owner;

--
-- Name: store_addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.store_addresses_id_seq OWNED BY public.store_addresses.id;


--
-- Name: store_hours; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.store_hours (
    id integer NOT NULL,
    store_id integer NOT NULL,
    day_of_week smallint NOT NULL,
    open_time time without time zone,
    close_time time without time zone,
    is_closed boolean DEFAULT false NOT NULL,
    is_24hours boolean DEFAULT false NOT NULL,
    description character varying(100),
    priority smallint DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT store_hours_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


ALTER TABLE public.store_hours OWNER TO neondb_owner;

--
-- Name: store_hours_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.store_hours_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.store_hours_id_seq OWNER TO neondb_owner;

--
-- Name: store_hours_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.store_hours_id_seq OWNED BY public.store_hours.id;


--
-- Name: store_info; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.store_info (
    store_id integer NOT NULL,
    name character varying(50) NOT NULL,
    category character varying(50),
    store_tel_number integer,
    rating_average integer DEFAULT 0,
    review_count integer DEFAULT 0,
    favoratite_count integer DEFAULT 0,
    amenities jsonb
);


ALTER TABLE public.store_info OWNER TO neondb_owner;

--
-- Name: store_info_store_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.store_info_store_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.store_info_store_id_seq OWNER TO neondb_owner;

--
-- Name: store_info_store_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.store_info_store_id_seq OWNED BY public.store_info.store_id;


--
-- Name: store_menu; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.store_menu (
    id integer NOT NULL,
    store_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    price integer NOT NULL,
    cook_station character varying(50) NOT NULL
);


ALTER TABLE public.store_menu OWNER TO neondb_owner;

--
-- Name: store_menu_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.store_menu_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.store_menu_id_seq OWNER TO neondb_owner;

--
-- Name: store_menu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.store_menu_id_seq OWNED BY public.store_menu.id;


--
-- Name: store_point_logs; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.store_point_logs OWNER TO neondb_owner;

--
-- Name: store_point_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.store_point_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.store_point_logs_id_seq OWNER TO neondb_owner;

--
-- Name: store_point_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.store_point_logs_id_seq OWNED BY public.store_point_logs.id;


--
-- Name: store_points; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.store_points (
    id integer NOT NULL,
    user_id integer NOT NULL,
    store_id integer NOT NULL,
    balance integer DEFAULT 0,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.store_points OWNER TO neondb_owner;

--
-- Name: store_points_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.store_points_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.store_points_id_seq OWNER TO neondb_owner;

--
-- Name: store_points_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.store_points_id_seq OWNED BY public.store_points.id;


--
-- Name: store_regular_customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.store_regular_customers (
    id integer NOT NULL,
    user_id integer NOT NULL,
    store_id integer NOT NULL,
    level_id integer,
    visit_count integer DEFAULT 0,
    total_spent integer DEFAULT 0,
    last_visit timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.store_regular_customers OWNER TO neondb_owner;

--
-- Name: store_regular_customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.store_regular_customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.store_regular_customers_id_seq OWNER TO neondb_owner;

--
-- Name: store_regular_customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.store_regular_customers_id_seq OWNED BY public.store_regular_customers.id;


--
-- Name: store_regular_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.store_regular_events (
    id integer NOT NULL,
    user_id integer NOT NULL,
    store_id integer NOT NULL,
    event_type character varying(20) NOT NULL,
    metadata jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.store_regular_events OWNER TO neondb_owner;

--
-- Name: store_regular_events_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.store_regular_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.store_regular_events_id_seq OWNER TO neondb_owner;

--
-- Name: store_regular_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.store_regular_events_id_seq OWNED BY public.store_regular_events.id;


--
-- Name: store_regular_levels; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.store_regular_levels (
    id integer NOT NULL,
    store_id integer NOT NULL,
    level character varying(20) NOT NULL,
    min_orders integer,
    min_spent integer,
    benefits jsonb
);


ALTER TABLE public.store_regular_levels OWNER TO neondb_owner;

--
-- Name: store_regular_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.store_regular_levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.store_regular_levels_id_seq OWNER TO neondb_owner;

--
-- Name: store_regular_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.store_regular_levels_id_seq OWNED BY public.store_regular_levels.id;


--
-- Name: store_tables; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.store_tables (
    id integer NOT NULL,
    store_id integer NOT NULL,
    table_name character varying(50) NOT NULL,
    capacity integer DEFAULT 2 NOT NULL,
    status character varying(20) DEFAULT 'AVAILABLE'::character varying NOT NULL,
    qr_code character varying(255),
    x_coord integer,
    y_coord integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    processing_order_id integer,
    spare_processing_order_id integer
);


ALTER TABLE public.store_tables OWNER TO neondb_owner;

--
-- Name: store_tables_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.store_tables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.store_tables_id_seq OWNER TO neondb_owner;

--
-- Name: store_tables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.store_tables_id_seq OWNED BY public.store_tables.id;


--
-- Name: stores; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stores (
    id integer NOT NULL,
    name character varying(50),
    is_open boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.stores OWNER TO neondb_owner;

--
-- Name: stores_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stores_id_seq OWNER TO neondb_owner;

--
-- Name: stores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stores_id_seq OWNED BY public.stores.id;


--
-- Name: table_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.table_orders (
    id integer NOT NULL,
    table_id integer NOT NULL,
    order_id integer NOT NULL,
    linked_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    unlinked_at timestamp without time zone
);


ALTER TABLE public.table_orders OWNER TO neondb_owner;

--
-- Name: table_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.table_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.table_orders_id_seq OWNER TO neondb_owner;

--
-- Name: table_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.table_orders_id_seq OWNED BY public.table_orders.id;


--
-- Name: user_coupons; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_coupons (
    id integer NOT NULL,
    coupon_id integer NOT NULL,
    user_id integer NOT NULL,
    issued_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone,
    status character varying(20) DEFAULT 'AVAILABLE'::character varying,
    used_at timestamp without time zone
);


ALTER TABLE public.user_coupons OWNER TO neondb_owner;

--
-- Name: user_coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_coupons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_coupons_id_seq OWNER TO neondb_owner;

--
-- Name: user_coupons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_coupons_id_seq OWNED BY public.user_coupons.id;


--
-- Name: user_global_regulars; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_global_regulars (
    user_id integer NOT NULL,
    level_id integer,
    total_orders integer DEFAULT 0,
    total_spent integer DEFAULT 0,
    total_reviews integer DEFAULT 0,
    last_update timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_global_regulars OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    user_id character varying(50) NOT NULL,
    user_pw character varying(50) NOT NULL,
    name character varying(50) NOT NULL,
    phone character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    email character varying(50),
    address text,
    birth date,
    gender character varying(10)
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: test1; Type: TABLE; Schema: test; Owner: neondb_owner
--

CREATE TABLE test.test1 (
    id integer NOT NULL
);


ALTER TABLE test.test1 OWNER TO neondb_owner;

--
-- Name: test1_id_seq; Type: SEQUENCE; Schema: test; Owner: neondb_owner
--

ALTER TABLE test.test1 ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME test.test1_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: coupons id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coupons ALTER COLUMN id SET DEFAULT nextval('public.coupons_id_seq'::regclass);


--
-- Name: favorites id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.favorites ALTER COLUMN id SET DEFAULT nextval('public.favorites_id_seq'::regclass);


--
-- Name: global_regular_levels id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.global_regular_levels ALTER COLUMN id SET DEFAULT nextval('public.global_regular_levels_id_seq'::regclass);


--
-- Name: guests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.guests ALTER COLUMN id SET DEFAULT nextval('public.guest_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: order_adjustments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_adjustments ALTER COLUMN id SET DEFAULT nextval('public.order_adjustments_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: order_tickets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_tickets ALTER COLUMN id SET DEFAULT nextval('public.order_tickets_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.ordrers_id_seq'::regclass);


--
-- Name: payment_details id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_details ALTER COLUMN id SET DEFAULT nextval('public.payment_details_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: pending_payments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pending_payments ALTER COLUMN id SET DEFAULT nextval('public.pending_payments_id_seq'::regclass);


--
-- Name: refunds id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.refunds ALTER COLUMN id SET DEFAULT nextval('public.refunds_id_seq'::regclass);


--
-- Name: reservations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reservations ALTER COLUMN id SET DEFAULT nextval('public.reservations_id_seq'::regclass);


--
-- Name: review_repiles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.review_repiles ALTER COLUMN id SET DEFAULT nextval('public.review_repiles_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: store_addresses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.store_addresses ALTER COLUMN id SET DEFAULT nextval('public.store_addresses_id_seq'::regclass);


--
-- Name: store_hours id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.store_hours ALTER COLUMN id SET DEFAULT nextval('public.store_hours_id_seq'::regclass);


--
-- Name: store_info store_id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.store_info ALTER COLUMN store_id SET DEFAULT nextval('public.store_info_store_id_seq'::regclass);


--
-- Name: store_menu id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.store_menu ALTER COLUMN id SET DEFAULT nextval('public.store_menu_id_seq'::regclass);


--
-- Name: store_point_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.store_point_logs ALTER COLUMN id SET DEFAULT nextval('public.store_point_logs_id_seq'::regclass);


--
-- Name: store_points id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.store_points ALTER COLUMN id SET DEFAULT nextval('public.store_points_id_seq'::regclass);


--
-- Name: store_regular_customers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER 