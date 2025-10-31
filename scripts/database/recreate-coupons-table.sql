
-- coupons 테이블 재생성 스크립트

-- 기존 테이블 삭제 (있다면)
DROP TABLE IF EXISTS user_coupons CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;

-- coupons 테이블 생성
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL,
    discount_value INTEGER NOT NULL,
    min_order_price INTEGER,
    max_discount_value INTEGER,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- user_coupons 테이블 생성 (사용자별 쿠폰 발급 내역)
CREATE TABLE user_coupons (
    id SERIAL PRIMARY KEY,
    coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    used_at TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_coupons_store_id ON coupons(store_id);
CREATE INDEX idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX idx_user_coupons_coupon_id ON user_coupons(coupon_id);
CREATE INDEX idx_user_coupons_status ON user_coupons(status);

COMMENT ON TABLE coupons IS '쿠폰 마스터 테이블';
COMMENT ON TABLE user_coupons IS '사용자별 쿠폰 발급 및 사용 내역';
