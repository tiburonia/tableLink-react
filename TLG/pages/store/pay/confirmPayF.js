
async function confirmPay(orderData, pointsUsed, store, currentOrder, finalAmount, couponId = null, couponDiscount = 0) {
  console.log('💳 결제 확인 처리 시작');
  console.log('주문 데이터:', orderData);
  console.log('사용 포인트:', pointsUsed);
  console.log('최종 금액:', finalAmount);
  console.log('쿠폰 ID:', couponId);
  console.log('쿠폰 할인:', couponDiscount);

  try {
    // 결제 처리 API 호출
    const response = await fetch('/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userInfo.id,
        storeId: orderData.storeId,
        tableNumber: orderData.tableNum,
        items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.qty,
          price: item.price,
          totalPrice: item.totalPrice
        })),
        totalAmount: orderData.total,
        pointsUsed: pointsUsed || 0,
        couponId: couponId,
        couponDiscount: couponDiscount || 0,
        finalAmount: finalAmount
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '결제 처리에 실패했습니다.');
    }

    const result = await response.json();
    console.log('✅ 결제 성공:', result);

    // 성공 페이지 렌더링
    main.innerHTML = `
      <div class="payment-success-container">
        <div class="success-content">
          <div class="success-icon">✅</div>
          <h1 class="success-title">결제 완료!</h1>
          <p class="success-message">주문이 성공적으로 접수되었습니다.</p>
          
          <div class="order-summary-card">
            <div class="summary-header">
              <h3>주문 내역</h3>
              <span class="order-number">주문번호: ${result.orderId || 'N/A'}</span>
            </div>
            <div class="summary-details">
              <div class="store-info">
                <strong>${orderData.store}</strong>
                <span>테이블 ${orderData.table}</span>
              </div>
              <div class="items-list">
                ${orderData.items.map(item => 
                  `<div class="item-row">
                    <span class="item-name">${item.name} × ${item.qty}</span>
                    <span class="item-price">${item.totalPrice.toLocaleString()}원</span>
                  </div>`
                ).join('')}
              </div>
              <div class="payment-details">
                <div class="detail-row">
                  <span>주문 금액</span>
                  <span>${orderData.total.toLocaleString()}원</span>
                </div>
                ${pointsUsed > 0 ? `
                  <div class="detail-row discount">
                    <span>포인트 사용</span>
                    <span>-${pointsUsed.toLocaleString()}원</span>
                  </div>
                ` : ''}
                ${couponDiscount > 0 ? `
                  <div class="detail-row discount">
                    <span>쿠폰 할인</span>
                    <span>-${couponDiscount.toLocaleString()}원</span>
                  </div>
                ` : ''}
                <div class="detail-row final">
                  <span>최종 결제 금액</span>
                  <span>${finalAmount.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          </div>

          <div class="points-earned-card">
            <div class="points-icon">🎉</div>
            <div class="points-info">
              <h4>포인트 적립</h4>
              <p>${Math.floor(finalAmount * 0.1).toLocaleString()}P가 적립되었습니다!</p>
            </div>
          </div>

          <div class="action-buttons">
            <button id="goToMain" class="btn primary">메인으로</button>
            <button id="goToMyPage" class="btn secondary">주문내역 보기</button>
          </div>
        </div>
      </div>

      <style>
        * {
          box-sizing: border-box;
        }

        .payment-success-container {
          height: 100vh;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 20px;
          box-sizing: border-box;
        }

        .success-content {
          max-width: 500px;
          width: 100%;
          text-align: center;
          padding: 20px;
          margin: 0 auto;
          min-height: calc(100vh - 40px);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .success-icon {
          font-size: 80px;
          margin-bottom: 20px;
          animation: bounce 1s ease-in-out;
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
            transform: translate3d(0, -10px, 0);
          }
          70% {
            animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
            transform: translate3d(0, -5px, 0);
          }
          90% {
            transform: translate3d(0,-1px,0);
          }
        }

        .success-title {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 12px 0;
        }

        .success-message {
          font-size: 16px;
          color: #64748b;
          margin: 0 0 30px 0;
          line-height: 1.6;
        }

        .order-summary-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(226, 232, 240, 0.8);
          text-align: left;
        }

        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f1f5f9;
        }

        .summary-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }

        .order-number {
          background: #f1f5f9;
          color: #475569;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .store-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .store-info strong {
          color: #1e293b;
          font-size: 16px;
        }

        .store-info span {
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
        }

        .items-list {
          margin-bottom: 16px;
        }

        .item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .item-row:last-child {
          border-bottom: none;
        }

        .item-name {
          color: #1e293b;
          font-weight: 500;
        }

        .item-price {
          color: #3b82f6;
          font-weight: 600;
        }

        .payment-details {
          border-top: 2px solid #f1f5f9;
          padding-top: 16px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
          color: #475569;
        }

        .detail-row.discount {
          color: #059669;
          font-weight: 600;
        }

        .detail-row.final {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
          margin-top: 8px;
        }

        .points-earned-card {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 30px;
          color: white;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        }

        .points-icon {
          font-size: 32px;
        }

        .points-info h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 700;
        }

        .points-info p {
          margin: 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn {
          padding: 16px 24px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .btn.primary {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(5, 150, 105, 0.25);
        }

        .btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(5, 150, 105, 0.35);
        }

        .btn.secondary {
          background: white;
          color: #475569;
          border: 2px solid #e2e8f0;
        }

        .btn.secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .btn:active {
          transform: translateY(0);
        }

        @media (max-width: 480px) {
          .payment-success-container {
            padding: 12px;
          }
          
          .success-content {
            padding: 16px;
          }
          
          .order-summary-card {
            padding: 20px;
          }
          
          .success-title {
            font-size: 28px;
          }
          
          .success-icon {
            font-size: 60px;
          }
        }
      </style>
    `;

    // 버튼 이벤트 리스너
    document.getElementById('goToMain').addEventListener('click', () => {
      renderMap();
    });

    document.getElementById('goToMyPage').addEventListener('click', () => {
      renderMyPage();
    });

    console.log('✅ 결제 성공 페이지 렌더링 완료');

  } catch (error) {
    console.error('❌ 결제 처리 실패:', error);
    
    // 에러 페이지 렌더링
    main.innerHTML = `
      <div class="payment-error-container">
        <div class="error-content">
          <div class="error-icon">❌</div>
          <h1 class="error-title">결제 실패</h1>
          <p class="error-message">${error.message || '결제 처리 중 오류가 발생했습니다.'}</p>
          
          <div class="action-buttons">
            <button id="retryPayment" class="btn primary">다시 시도</button>
            <button id="backToOrder" class="btn secondary">주문 화면으로</button>
          </div>
        </div>
      </div>

      <style>
        .payment-error-container {
          height: 100vh;
          background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 20px;
          box-sizing: border-box;
        }

        .error-content {
          max-width: 400px;
          width: 100%;
          text-align: center;
          background: white;
          border-radius: 16px;
          padding: 40px 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          margin: 0 auto;
          min-height: calc(100vh - 40px);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .error-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .error-title {
          font-size: 28px;
          font-weight: 700;
          color: #dc2626;
          margin: 0 0 12px 0;
        }

        .error-message {
          font-size: 16px;
          color: #64748b;
          margin: 0 0 30px 0;
          line-height: 1.6;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn {
          padding: 16px 24px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .btn.primary {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
        }

        .btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(220, 38, 38, 0.3);
        }

        .btn.secondary {
          background: white;
          color: #475569;
          border: 2px solid #e2e8f0;
        }

        .btn.secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
      </style>
    `;

    // 에러 페이지 버튼 이벤트
    document.getElementById('retryPayment')?.addEventListener('click', () => {
      renderPay(currentOrder, store, orderData.tableNum);
    });

    document.getElementById('backToOrder')?.addEventListener('click', () => {
      renderOrderScreen(store, orderData.tableNum);
    });
  }
}

window.confirmPay = confirmPay;
