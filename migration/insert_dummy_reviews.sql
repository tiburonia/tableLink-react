-- Reviews 테이블 더미 데이터 생성
-- store_id: 2~501 (500개)
-- user_id: 1~10 (랜덤)
-- order_id: 10000번부터 시작 (UNIQUE 보장)

DO $$
DECLARE
    v_store_id INTEGER;
    v_user_id INTEGER;
    v_order_id INTEGER := 10000;
    v_rating INTEGER;
    v_review_count INTEGER;
    v_content TEXT;
    v_images JSONB;
    v_has_image BOOLEAN;
    
    -- 리뷰 내용 샘플
    review_contents TEXT[] := ARRAY[
        '음식이 정말 맛있었어요! 다음에 또 방문하고 싶습니다.',
        '분위기가 좋고 서비스도 친절했습니다.',
        '가격 대비 만족스러운 식사였습니다.',
        '메뉴가 다양하고 맛도 좋았어요.',
        '조용하고 깔끔한 인테리어가 마음에 들었습니다.',
        '친구들과 함께 가기 좋은 곳이에요.',
        '음식이 빨리 나와서 좋았습니다.',
        '재방문 의사 100%입니다!',
        '직원분들이 매우 친절하셨어요.',
        '가성비가 훌륭한 맛집입니다.',
        '특별한 날에 가기 좋은 레스토랑이에요.',
        '메뉴 추천이 정확했습니다.',
        '단골이 될 것 같아요!',
        '음식 양도 푸짐하고 맛있었습니다.',
        '깔끔한 맛이 인상적이었어요.',
        '조금 아쉬운 부분이 있었지만 전반적으로 괜찮았습니다.',
        '기대 이상이었어요! 강추합니다.',
        '웨이팅할 만한 가치가 있는 맛집입니다.',
        '특별 메뉴가 정말 맛있었어요.',
        '가족과 함께 가기 좋은 곳입니다.'
    ];
    
    -- 이미지 URL 샘플
    image_urls TEXT[] := ARRAY[
        'https://picsum.photos/400/300?random=1',
        'https://picsum.photos/400/300?random=2',
        'https://picsum.photos/400/300?random=3',
        'https://picsum.photos/400/300?random=4',
        'https://picsum.photos/400/300?random=5'
    ];
BEGIN
    RAISE NOTICE '리뷰 더미 데이터 생성 시작...';
    
    -- store_id 2부터 501까지 반복
    FOR v_store_id IN 2..501 LOOP
        -- 각 매장당 0~5개의 리뷰를 랜덤하게 생성
        v_review_count := floor(random() * 6)::INTEGER;
        
        -- 리뷰 생성
        FOR i IN 1..v_review_count LOOP
            -- 랜덤 값 생성
            v_user_id := floor(random() * 10 + 1)::INTEGER; -- 1~10
            v_rating := floor(random() * 5 + 1)::INTEGER; -- 1~5
            v_content := review_contents[floor(random() * array_length(review_contents, 1) + 1)::INTEGER];
            v_has_image := random() > 0.5; -- 50% 확률로 이미지 포함
            
            -- 이미지 JSONB 생성
            IF v_has_image THEN
                v_images := json_build_array(
                    image_urls[floor(random() * array_length(image_urls, 1) + 1)::INTEGER]
                )::JSONB;
            ELSE
                v_images := NULL;
            END IF;
            
            -- 리뷰 삽입
            INSERT INTO reviews (
                order_id,
                store_id,
                user_id,
                rating,
                content,
                images,
                status,
                created_at,
                updated_at
            ) VALUES (
                v_order_id,
                v_store_id,
                v_user_id,
                v_rating,
                v_content,
                v_images,
                'VISIBLE',
                NOW() - (random() * interval '90 days'), -- 최근 90일 내 랜덤
                NOW() - (random() * interval '90 days')
            );
            
            v_order_id := v_order_id + 1;
        END LOOP;
        
        -- 진행 상황 출력 (매 100개 매장마다)
        IF v_store_id % 100 = 0 THEN
            RAISE NOTICE '진행 중: %/500 매장 처리 완료', v_store_id - 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ 리뷰 더미 데이터 생성 완료!';
    RAISE NOTICE '총 % 개의 리뷰가 생성되었습니다.', v_order_id - 10000;
END $$;

-- 생성된 데이터 확인
SELECT 
    COUNT(*) as total_reviews,
    COUNT(DISTINCT store_id) as stores_with_reviews,
    AVG(rating)::NUMERIC(3,2) as avg_rating,
    MIN(created_at) as oldest_review,
    MAX(created_at) as newest_review
FROM reviews
WHERE order_id >= 10000;

-- 각 매장별 리뷰 수 분포 확인
SELECT 
    review_count,
    COUNT(*) as store_count
FROM (
    SELECT 
        store_id,
        COUNT(*) as review_count
    FROM reviews
    WHERE store_id BETWEEN 2 AND 501
    GROUP BY store_id
) as store_reviews
GROUP BY review_count
ORDER BY review_count;
