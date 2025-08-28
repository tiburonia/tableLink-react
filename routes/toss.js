const express = require('express');
const router = express.Router();

// 토스페이먼츠 샌드박스 설정
const TOSS_CLIENT_KEY = process.env.TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
const TOSS_API_URL = 'https://api.tosspayments.com/v1/payments';

// 클라이언트 키 제공
router.get('/client-key', (req, res) => {
  res.json({ 
    success: true,
    clientKey: TOSS_CLIENT_KEY 
  });
});

// 결제 성공 처리 (POST)
router.post('/success', async (req, res) => {
  try {
    const { paymentKey, orderId, amount } = req.body;

    console.log('✅ 토스페이먼츠 결제 승인 요청:', { paymentKey, orderId, amount });

    // 토스페이먼츠 결제 승인
    const response = await fetch(`${TOSS_API_URL}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount
      })
    });

    const paymentData = await response.json();

    if (response.ok) {
      console.log('✅ 토스페이먼츠 결제 승인 성공:', paymentData.paymentKey);

      res.json({
        success: true,
        paymentKey,
        orderId,
        paymentData
      });
    } else {
      console.error('❌ 토스페이먼츠 결제 승인 실패:', paymentData);
      res.status(400).json({
        success: false,
        error: paymentData.message || '결제 승인에 실패했습니다.'
      });
    }

  } catch (error) {
    console.error('❌ 토스페이먼츠 결제 승인 에러:', error);
    res.status(500).json({
      success: false,
      error: '결제 승인 처리 중 오류가 발생했습니다.'
    });
  }
});

// 결제 실패 처리 (POST)
router.post('/fail', (req, res) => {
  const { code, message, orderId } = req.body;

  console.log('❌ 토스페이먼츠 결제 실패:', { code, message, orderId });

  res.json({
    success: false,
    error: message || '결제가 실패했습니다.'
  });
});

// GET 방식 성공 콜백 (리다이렉트용)
router.get('/success', async (req, res) => {
  try {
    const { paymentKey, orderId, amount } = req.query;

    console.log('✅ 토스페이먼츠 결제 성공 콜백:', { paymentKey, orderId, amount });

    // 성공 페이지로 리다이렉트
    res.redirect(`/toss-success.html?paymentKey=${paymentKey}&orderId=${orderId}&amount=${amount}`);

  } catch (error) {
    console.error('❌ 토스페이먼츠 결제 승인 실패:', error);
    res.redirect(`/toss-fail.html?message=${encodeURIComponent(error.message)}`);
  }
});

// GET 방식 실패 콜백 (리다이렉트용)
router.get('/fail', async (req, res) => {
  try {
    const { code, message, orderId } = req.query;

    console.log('❌ 토스페이먼츠 결제 실패:', { code, message, orderId });

    res.redirect(`/toss-fail.html?code=${code}&message=${encodeURIComponent(message)}&orderId=${orderId}`);

  } catch (error) {
    console.error('❌ 토스페이먼츠 실패 콜백 처리 실패:', error);
    res.redirect('/toss-fail.html?message=' + encodeURIComponent('결제 처리 중 오류가 발생했습니다.'));
  }
});

module.exports = router;