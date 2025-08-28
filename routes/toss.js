
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
