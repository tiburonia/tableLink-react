const express = require('express');
const router = express.Router();

// 토스페이먼츠 샌드박스 설정 - 환경변수에서 키 가져오기
const TOSS_CLIENT_KEY = process.env.TOSS_CLIENT_KEY;
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
const TOSS_API_URL = 'https://api.tosspayments.com/v1/payments';

// 키가 설정되지 않은 경우 경고
if (!TOSS_CLIENT_KEY || !TOSS_SECRET_KEY) {
  console.warn('⚠️ 토스페이먼츠 API 키가 환경변수에 설정되지 않았습니다.');
  console.warn('TOSS_CLIENT_KEY와 TOSS_SECRET_KEY 환경변수를 설정해주세요.');
}

// 클라이언트 키 제공
router.get('/client-key', (req, res) => {
  if (!TOSS_CLIENT_KEY) {
    return res.status(500).json({ 
      success: false,
      error: '토스페이먼츠 클라이언트 키가 설정되지 않았습니다.' 
    });
  }

  res.json({ 
    success: true,
    clientKey: TOSS_CLIENT_KEY 
  });
});

// 결제 승인 처리 (POST) - 프론트엔드에서 사용
router.post('/confirm', async (req, res) => {
  try {
    const { paymentKey, orderId, amount } = req.body;

    console.log('✅ 토스페이먼츠 결제 승인 요청 (/confirm):', { paymentKey, orderId, amount });

    // 키 검증
    if (!TOSS_SECRET_KEY) {
      console.error('❌ 토스페이먼츠 시크릿 키가 설정되지 않음');
      return res.status(500).json({
        success: false,
        error: '토스페이먼츠 설정이 완료되지 않았습니다.'
      });
    }

    console.log('🔑 사용 중인 시크릿 키 (앞 4자리):', TOSS_SECRET_KEY.substring(0, 4) + '...');

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
      console.log('✅ 토스페이먼츠 결제 승인 성공 (/confirm):', paymentData.paymentKey);

      res.json({
        success: true,
        paymentKey,
        orderId,
        paymentData,
        approvedAt: paymentData.approvedAt,
        method: paymentData.method,
        totalAmount: paymentData.totalAmount
      });
    } else {
      console.error('❌ 토스페이먼츠 결제 승인 실패 (/confirm):', paymentData);
      res.status(400).json({
        success: false,
        error: paymentData.message || '결제 승인에 실패했습니다.'
      });
    }

  } catch (error) {
    console.error('❌ 토스페이먼츠 결제 승인 에러 (/confirm):', error);
    res.status(500).json({
      success: false,
      error: '결제 승인 처리 중 오류가 발생했습니다.'
    });
  }
});

// 결제 성공 처리 (POST)
router.post('/success', async (req, res) => {
  try {
    const { paymentKey, orderId, amount } = req.body;

    console.log('✅ 토스페이먼츠 결제 승인 요청:', { paymentKey, orderId, amount });

    // 키 검증
    if (!TOSS_SECRET_KEY) {
      console.error('❌ 토스페이먼츠 시크릿 키가 설정되지 않음');
      return res.status(500).json({
        success: false,
        error: '토스페이먼츠 설정이 완료되지 않았습니다.'
      });
    }

    console.log('🔑 사용 중인 시크릿 키 (앞 4자리):', TOSS_SECRET_KEY.substring(0, 4) + '...');

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

    // 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      console.error('❌ 필수 파라미터 누락:', { paymentKey, orderId, amount });
      return res.redirect(`/toss-fail.html?message=${encodeURIComponent('결제 정보가 올바르지 않습니다.')}`);
    }

    // 토스페이먼츠 결제 승인 처리
    try {
      console.log('🔄 서버에서 토스페이먼츠 결제 승인 처리 시작');

      const response = await fetch(`${TOSS_API_URL}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: parseInt(amount)
        })
      });

      const paymentData = await response.json();

      if (response.ok) {
        console.log('✅ 서버에서 토스페이먼츠 결제 승인 성공:', paymentData.paymentKey);

        // postMessage 기반 결제 완료 처리 페이지
        const postMessagePageHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>결제 완료</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .success { color: #4CAF50; font-size: 24px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="success">✅ 결제가 완료되었습니다</div>
            <p>잠시 후 자동으로 처리됩니다...</p>
            <script>
                // 결제 완료 데이터
                const paymentData = {
                    type: 'TOSS_PAYMENT_SUCCESS',
                    paymentKey: '${paymentKey}',
                    orderId: '${orderId}',
                    amount: ${amount},
                    confirmed: true,
                    timestamp: Date.now()
                };

                console.log('📨 결제 완료 postMessage 전송:', paymentData);

                // 모든 가능한 부모에게 메시지 전송
                function sendToParent() {
                    try {
                        if (window.opener && !window.opener.closed) {
                            window.opener.postMessage(paymentData, '*');
                            console.log('📨 opener에게 전송 완료');
                        }
                    } catch (e) {
                        console.log('opener 전송 실패:', e);
                    }

                    try {
                        if (window.parent && window.parent !== window) {
                            window.parent.postMessage(paymentData, '*');
                            console.log('📨 parent에게 전송 완료');
                        }
                    } catch (e) {
                        console.log('parent 전송 실패:', e);
                    }

                    try {
                        if (window.top && window.top !== window) {
                            window.top.postMessage(paymentData, '*');
                            console.log('📨 top에게 전송 완료');
                        }
                    } catch (e) {
                        console.log('top 전송 실패:', e);
                    }
                }

                // 즉시 전송 및 반복 전송
                sendToParent();
                
                // 1초마다 3번 더 전송 (확실히 받도록)
                let sendCount = 0;
                const sendInterval = setInterval(() => {
                    sendToParent();
                    sendCount++;
                    if (sendCount >= 3) {
                        clearInterval(sendInterval);
                        // 5초 후 창 닫기 시도
                        setTimeout(() => {
                            try {
                                window.close();
                            } catch (e) {
                                console.log('창 닫기 실패:', e);
                            }
                        }, 2000);
                    }
                }, 1000);
            </script>
        </body>
        </html>
        `;

        console.log('🔄 서버에서 postMessage 기반 성공 페이지 응답');
        res.send(postMessagePageHtml);
      } else {
        console.error('❌ 서버에서 토스페이먼츠 결제 승인 실패:', paymentData);
        res.redirect(`/toss-fail.html?message=${encodeURIComponent(paymentData.message || '결제 승인에 실패했습니다.')}`);
      }
    } catch (confirmError) {
      console.error('❌ 서버에서 결제 승인 처리 실패:', confirmError);
      res.redirect(`/toss-fail.html?message=${encodeURIComponent('결제 승인 처리 중 오류가 발생했습니다.')}`);
    }

  } catch (error) {
    console.error('❌ 토스페이먼츠 성공 콜백 처리 실패:', error);
    res.redirect(`/toss-fail.html?message=${encodeURIComponent('결제 처리 중 오류가 발생했습니다.')}`);
  }
});

// GET 방식 실패 콜백 (리다이렉트용)
router.get('/fail', async (req, res) => {
  try {
    const { code, message, orderId } = req.query;

    console.log('❌ 토스페이먼츠 결제 실패:', { code, message, orderId });

    // postMessage 기반 결제 실패 처리 페이지
    const postMessagePageHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>결제 실패</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #f44336; font-size: 24px; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="error">❌ 결제가 실패했습니다</div>
        <p>${message || '결제 처리 중 오류가 발생했습니다.'}</p>
        <script>
            // 결제 실패 데이터
            const failureData = {
                type: 'TOSS_PAYMENT_FAILURE',
                code: '${code || ''}',
                message: '${message || '결제가 실패했습니다.'}',
                orderId: '${orderId || ''}',
                timestamp: Date.now()
            };

            console.log('📨 결제 실패 postMessage 전송:', failureData);

            // 모든 가능한 부모에게 메시지 전송
            function sendToParent() {
                try {
                    if (window.opener && !window.opener.closed) {
                        window.opener.postMessage(failureData, '*');
                    }
                } catch (e) {
                    console.log('opener 전송 실패:', e);
                }

                try {
                    if (window.parent && window.parent !== window) {
                        window.parent.postMessage(failureData, '*');
                    }
                } catch (e) {
                    console.log('parent 전송 실패:', e);
                }

                try {
                    if (window.top && window.top !== window) {
                        window.top.postMessage(failureData, '*');
                    }
                } catch (e) {
                    console.log('top 전송 실패:', e);
                }
            }

            // 즉시 전송 및 반복 전송
            sendToParent();
            
            let sendCount = 0;
            const sendInterval = setInterval(() => {
                sendToParent();
                sendCount++;
                if (sendCount >= 3) {
                    clearInterval(sendInterval);
                    setTimeout(() => {
                        try {
                            window.close();
                        } catch (e) {
                            console.log('창 닫기 실패:', e);
                        }
                    }, 2000);
                }
            }, 1000);
        </script>
    </body>
    </html>
    `;

    console.log('🔄 서버에서 postMessage 기반 실패 페이지 응답');
    res.send(postMessagePageHtml);

  } catch (error) {
    console.error('❌ 토스페이먼츠 실패 콜백 처리 실패:', error);
    res.redirect('/toss-fail.html?message=' + encodeURIComponent('결제 처리 중 오류가 발생했습니다.'));
  }
});

module.exports = router;