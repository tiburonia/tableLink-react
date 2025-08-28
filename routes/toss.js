
const express = require('express');
const router = express.Router();

// 토스페이먼츠 클라이언트 키 제공
router.get('/client-key', async (req, res) => {
  try {
    res.json({
      success: true,
      clientKey: process.env.TOSS_CLIENT_KEY
    });
  } catch (error) {
    console.error('❌ 토스페이먼츠 클라이언트 키 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '클라이언트 키 조회 실패'
    });
  }
});

// 토스페이먼츠 결제 성공 콜백
router.get('/success', async (req, res) => {
  try {
    const { paymentKey, orderId, amount } = req.query;
    
    console.log('✅ 토스페이먼츠 결제 성공 콜백:', { paymentKey, orderId, amount });

    // 결제 승인 API 호출
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: parseInt(amount)
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '결제 승인 실패');
    }

    console.log('✅ 토스페이먼츠 결제 승인 완료:', result.paymentKey);

    // 성공 페이지로 리다이렉트
    res.redirect(`/?payment=success&paymentKey=${paymentKey}&orderId=${orderId}`);

  } catch (error) {
    console.error('❌ 토스페이먼츠 결제 승인 실패:', error);
    res.redirect(`/?payment=fail&message=${encodeURIComponent(error.message)}`);
  }
});

// 토스페이먼츠 결제 실패 콜백
router.get('/fail', async (req, res) => {
  try {
    const { code, message, orderId } = req.query;
    
    console.log('❌ 토스페이먼츠 결제 실패:', { code, message, orderId });

    res.redirect(`/?payment=fail&code=${code}&message=${encodeURIComponent(message)}&orderId=${orderId}`);

  } catch (error) {
    console.error('❌ 토스페이먼츠 실패 콜백 처리 실패:', error);
    res.redirect('/?payment=fail&message=' + encodeURIComponent('결제 처리 중 오류가 발생했습니다.'));
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// 토스페이먼츠 샌드박스 설정
const TOSS_CLIENT_KEY = process.env.TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
const TOSS_API_URL = 'https://api.tosspayments.com/v1/payments';

// 클라이언트 키 제공
router.get('/client-key', (req, res) => {
  res.json({ clientKey: TOSS_CLIENT_KEY });
});

// 결제 성공 처리
router.post('/success', async (req, res) => {
  try {
    const { paymentKey, orderId, amount } = req.body;

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
      console.log('✅ 토스페이먼츠 결제 승인 성공:', paymentData);
      
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

// 결제 실패 처리
router.post('/fail', (req, res) => {
  const { code, message, orderId } = req.body;
  
  console.log('❌ 토스페이먼츠 결제 실패:', { code, message, orderId });
  
  res.json({
    success: false,
    error: message || '결제가 실패했습니다.'
  });
});

module.exports = router;
