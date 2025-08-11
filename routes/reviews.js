const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');
const { updateStoreRating } = require('./stores');

// 매장별 리뷰 조회 API (TLM용)
router.get('/stores/:storeId/reviews', async (req, res) => {
  try {
    const { storeId } = req.params;
    const limit = req.query.limit || 100;

    console.log(`=== 📖 매장 ${storeId} 리뷰 조회 API 시작 (reviews 테이블 JOIN) ===`);

    const query = `
      SELECT 
        r.id,
        r.rating as score,
        r.review_text as content,
        r.order_date,
        r.created_at,
        u.name as user_name,
        u.id as user_id
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2
    `;

    console.log('🔍 실행할 SQL 쿼리:', query);
    console.log('🔍 쿼리 파라미터 - storeId:', storeId, '(타입:', typeof storeId, '), limit:', limit);

    const result = await pool.query(query, [storeId, limit]);

    console.log('🔍 데이터베이스 쿼리 결과:', result.rows.length + '개 리뷰 발견');
    console.log('📊 조회된 리뷰 상세:', result.rows);

    const reviews = result.rows.map(row => ({
      id: row.id,
      score: row.score,
      content: row.content,
      date: new Date(row.created_at).toLocaleDateString('ko-KR'),
      orderDate: row.order_date,
      user: row.user_name,
      userId: row.user_id
    }));

    console.log(`✅ 매장 ${storeId} 리뷰 ${reviews.length}개 처리 완료`);

    const responseData = {
      success: true,
      storeId: parseInt(storeId),
      total: reviews.length,
      reviews: reviews
    };

    console.log('📤 클라이언트로 전송할 최종 데이터:', JSON.stringify(responseData, null, 2));

    res.json(responseData);

  } catch (error) {
    console.error('❌ 매장 리뷰 조회 실패:', error);
    console.error('❌ 오류 스택:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: '리뷰 조회 실패: ' + error.message
    });
  }
});

// 최근 리뷰 조회 API (TLM용)
router.get('/reviews/recent/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const limit = req.query.limit || 5;

    console.log(`⭐ 매장 ${storeId} 최근 리뷰 조회 (최대 ${limit}개)`);

    const result = await pool.query(`
      SELECT 
        r.id, r.rating, r.review_text, r.created_at,
        u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2
    `, [storeId, limit]);

    const reviews = result.rows.map(row => ({
      id: row.id,
      rating: row.rating,
      review_text: row.review_text,
      created_at: row.created_at,
      user_name: row.user_name
    }));

    console.log(`✅ 매장 ${storeId} 최근 리뷰 ${reviews.length}개 조회 완료`);



// orders 테이블 기반 리뷰 제출 API
router.post('/submit-from-orders', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { 
      userId, 
      storeId, 
      storeName, 
      orderId,
      rating, 
      reviewText, 
      orderDate 
    } = req.body;

    console.log('📝 orders 기반 리뷰 등록 요청:', {
      userId, storeId, storeName, orderId, rating
    });

    await client.query('BEGIN');

    // 이미 해당 주문에 대한 리뷰가 있는지 확인
    const existingReview = await client.query(
      'SELECT id FROM reviews WHERE user_id = $1 AND store_id = $2 AND order_id = $3',
      [userId, storeId, orderId]
    );

    if (existingReview.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        error: '이미 리뷰를 작성한 주문입니다' 
      });
    }

    // 리뷰 저장
    const reviewResult = await client.query(`
      INSERT INTO reviews (
        user_id, store_id, order_id, rating, review_text, order_date, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, created_at
    `, [
      userId,
      storeId, 
      orderId,
      rating,
      reviewText,
      orderDate
    ]);

    const newReview = reviewResult.rows[0];

    await client.query('COMMIT');

    console.log('✅ orders 기반 리뷰 등록 완료:', newReview.id);

    res.json({
      success: true,
      message: '리뷰가 성공적으로 등록되었습니다',
      review: {
        id: newReview.id,
        userId: userId,
        storeId: storeId,
        storeName: storeName,
        orderId: orderId,
        rating: rating,
        content: reviewText,
        createdAt: newReview.created_at
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ orders 기반 리뷰 등록 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '리뷰 등록 실패: ' + error.message 
    });
  } finally {
    client.release();
  }
});

    res.json({
      success: true,
      reviews: reviews
    });

  } catch (error) {
    console.error('❌ 최근 리뷰 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '최근 리뷰 조회 실패' 
    });
  }
});

// 리뷰 미리보기 API (매장 상세 페이지용)
router.get('/reviews/preview/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const limit = 3; // 미리보기는 3개만

    console.log(`👁️ 매장 ${storeId} 리뷰 미리보기 조회`);

    const result = await pool.query(`
      SELECT 
        r.id, r.rating, r.review_text, r.created_at,
        u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2
    `, [parseInt(storeId), limit]);

    const reviews = result.rows.map(row => ({
      id: row.id,
      rating: row.rating,
      content: row.review_text,
      date: new Date(row.created_at).toLocaleDateString('ko-KR'),
      user: row.user_name
    }));

    console.log(`✅ 매장 ${storeId} 리뷰 미리보기 ${reviews.length}개 조회 완료`);

    res.json({
      success: true,
      reviews: reviews
    });

  } catch (error) {
    console.error('❌ 리뷰 미리보기 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '리뷰 미리보기 조회 실패' 
    });
  }
});

// 리뷰 제출 API
router.post('/reviews/submit', async (req, res) => {
  const { userId, storeId, storeName, orderIndex, rating, reviewText, orderDate } = req.body;

  console.log('📝 리뷰 등록 요청 받음:', { userId, storeId, orderIndex, rating, reviewText });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const user = userResult.rows[0];
    const orderList = user.order_list || [];

    if (orderIndex >= orderList.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '존재하지 않는 주문입니다' });
    }

    const existingReview = await client.query(
      'SELECT id FROM reviews WHERE user_id = $1 AND order_index = $2',
      [userId, orderIndex]
    );

    if (existingReview.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '이미 리뷰를 작성한 주문입니다' });
    }

    const reviewResult = await client.query(`
      INSERT INTO reviews (user_id, store_id, order_index, rating, review_text, order_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at
    `, [userId, storeId, orderIndex, rating, reviewText, orderDate]);

    const newReviewId = reviewResult.rows[0].id;
    const createdAt = reviewResult.rows[0].created_at;

    orderList[orderIndex].reviewId = newReviewId;
    await client.query(
      'UPDATE users SET order_list = $1 WHERE id = $2',
      [JSON.stringify(orderList), userId]
    );

    await updateStoreRating(storeId);

    await client.query('COMMIT');

    const responseReview = {
      id: newReviewId,
      score: rating,
      content: reviewText,
      date: new Date(createdAt).toLocaleDateString('ko-KR'),
      orderDate: orderDate,
      user: user.name || `사용자${userId}`,
      userId: userId
    };

    res.json({
      success: true,
      message: '리뷰가 성공적으로 등록되었습니다',
      review: responseReview
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 리뷰 등록 실패:', error);
    res.status(500).json({ error: '리뷰 등록 실패: ' + error.message });
  } finally {
    client.release();
  }
});

// 리뷰 수정 API
router.put('/reviews/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const { content, score, userId } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const reviewResult = await client.query(
      'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    if (reviewResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: '수정 권한이 없습니다' });
    }

    const updateResult = await client.query(`
      UPDATE reviews 
      SET review_text = $1, rating = $2, created_at = NOW()
      WHERE id = $3 AND user_id = $4
      RETURNING store_id
    `, [content, score, reviewId, userId]);

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '리뷰 수정 실패' });
    }

    const storeId = updateResult.rows[0].store_id;
    await updateStoreRating(storeId);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: '리뷰가 수정되었습니다',
      review: updateResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 리뷰 수정 실패:', error);
    res.status(500).json({ error: '리뷰 수정 실패: ' + error.message });
  } finally {
    client.release();
  }
});

// 사용자별 리뷰 내역 조회 API
router.get('/users/:userId/reviews', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit || 10;

    console.log(`📖 사용자 ${userId} 리뷰 내역 조회 (최대 ${limit}개)`);

    const query = `
      SELECT 
        r.id,
        r.rating as score,
        r.review_text as content,
        r.order_date,
        r.created_at,
        r.store_id,
        s.name as store_name,
        s.category as store_category
      FROM reviews r
      JOIN stores s ON r.store_id = s.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2
    `;

    console.log('🔍 실행할 SQL 쿼리:', query);
    console.log('🔍 쿼리 파라미터 - userId:', userId, 'limit:', limit);

    const result = await pool.query(query, [userId, limit]);

    console.log('🔍 데이터베이스 쿼리 결과:', result.rows.length + '개 리뷰 발견');

    const reviews = result.rows.map(row => ({
      id: row.id,
      score: row.score,
      content: row.content,
      date: new Date(row.created_at).toLocaleDateString('ko-KR'),
      orderDate: row.order_date,
      storeId: row.store_id,
      storeName: row.store_name,
      storeCategory: row.store_category
    }));

    console.log(`✅ 사용자 ${userId} 리뷰 ${reviews.length}개 처리 완료`);

    res.json({
      success: true,
      userId: userId,
      total: reviews.length,
      reviews: reviews
    });

  } catch (error) {
    console.error('❌ 사용자 리뷰 내역 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '리뷰 내역 조회 실패: ' + error.message
    });
  }
});

// 주문별 리뷰 작성 여부 확인 API
router.get('/check-order-review/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`🔍 주문 ${orderId} 리뷰 작성 여부 확인`);

    const result = await pool.query(`
      SELECT id FROM reviews WHERE order_id = $1
    `, [parseInt(orderId)]);

    const hasReview = result.rows.length > 0;

    console.log(`✅ 주문 ${orderId} 리뷰 작성 여부: ${hasReview ? '작성됨' : '미작성'}`);

    res.json({
      success: true,
      hasReview: hasReview,
      reviewId: hasReview ? result.rows[0].id : null
    });

  } catch (error) {
    console.error('❌ 리뷰 작성 여부 확인 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '리뷰 작성 여부 확인 실패' 
    });
  }
});

// 리뷰 삭제 API
router.delete('/reviews/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const { userId } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const deleteResult = await client.query(`
      DELETE FROM reviews 
      WHERE id = $1 AND user_id = $2
      RETURNING store_id, order_index
    `, [reviewId, userId]);

    if (deleteResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: '삭제 권한이 없거나 리뷰를 찾을 수 없습니다' });
    }

    const deletedReview = deleteResult.rows[0];

    const userResult = await client.query('SELECT order_list FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length > 0) {
      const orderList = userResult.rows[0].order_list || [];
      if (orderList[deletedReview.order_index]) {
        delete orderList[deletedReview.order_index].reviewId;
        await client.query(
          'UPDATE users SET order_list = $1 WHERE id = $2',
          [JSON.stringify(orderList), userId]
        );
      }
    }

    await updateStoreRating(deletedReview.store_id);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: '리뷰가 삭제되었습니다',
      storeId: deletedReview.store_id
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 리뷰 삭제 실패:', error);
    res.status(500).json({ error: '리뷰 삭제 실패: ' + error.message });
  } finally {
    client.release();
  }
});

module.exports = router;