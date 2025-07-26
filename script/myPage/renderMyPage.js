async function renderMyPage() {
  try {
    const response = await fetch('/api/users/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userInfo.id })
    });

    if (!response.ok) throw new Error('사용자 정보 조회 실패');
    const data = await response.json();
    const currentUserInfo = data.user;

    main.innerHTML = `
      <header>
        <h1>📄 마이페이지</h1>
      </header>

      <main id="content">
        <section class="section-card">
          <h2>📦 주문내역</h2>
          <div id="orderList"></div>
        </section>

        <section class="section-card">
          <h2>📅 예약내역</h2>
          <div id="reservationList"></div>
        </section>

        <section class="section-card">
          <h2>🎁 쿠폰 리스트</h2>
          <div id="couponList"></div>
        </section>

        <button id="info" class="solid-button">내 계정 보기</button>
      </main>

      <nav id="bottomBar">
        <button onclick="renderMain()">🏠</button>
        <button onclick="renderSearch()">🔍</button>
        <button onclick="renderMap()">📍</button>
        <button onclick="renderMyPage()">👤</button>
      </nav>

      <style>
        #main {
          font-family: sans-serif;
          background: #f8f9fb;
          overflow: hidden; /* 전체 스크롤 방지 */
        }
        
        header {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          max-width: 430px;
          height: 80px;
          background: white;
          border-bottom: 1px solid #ddd;
          display: flex;
          align-items: center;
          z-index: 1001;
        }
        
        header h1 {
          margin: 20px;
          font-size: 24px;
        }
        
        #content {
          position: absolute;
          top: 80px;       /* 헤더 높이만큼 */
          bottom: 60px;    /* 바텀 바 높이만큼 */
          left: 0;
          width: 100%;
          max-width: 430px;
          overflow-y: auto;  /* 여기만 스크롤 */
          padding: 0 18px;
          box-sizing: border-box;
          background: #f8f9fb;
          z-index: 1;
        }
        
        .section-card {
          background: white;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 18px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
        }
        .section-card h2 {
          margin-bottom: 10px;
          font-size: 18px;
          font-weight: 600;
        }
        .solid-button {
          width: 100%;
          padding: 12px 0;
          font-size: 16px;
          background: #297efc;
          color: white;
          border: none;
          border-radius: 10px;
          margin: 20px 0 80px 0; /* 바텀바 여백 확보 */
          cursor: pointer;
        }
        #bottomBar {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          max-width: 430px;
          height: 60px;
          background: white;
          border-top: 1px solid #ccc;
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 1000;
        }
        .order-item {
          background: #fff;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          border: 1px solid #f0f0f0;
        }
        .order-info {
          margin-bottom: 8px;
        }
        .review-section {
          display: flex;
          justify-content: flex-end;
        }
        .review-btn {
          background: #297efc;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .review-btn:hover {
          background: #2266d9;
        }
        .review-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
        }
        .review-modal-content {
          background: white;
          padding: 20px;
          border-radius: 12px;
          width: 90%;
          max-width: 400px;
          max-height: 80%;
          overflow-y: auto;
        }
        .star-rating {
          display: flex;
          gap: 5px;
          margin: 10px 0;
        }
        .star {
          font-size: 24px;
          cursor: pointer;
          color: #ddd;
          transition: color 0.2s;
        }
        .star.active {
          color: #ffbf00;
        }
        .review-textarea {
          width: 100%;
          height: 100px;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 8px;
          font-size: 14px;
          resize: vertical;
        }
        .modal-buttons {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }
        .modal-btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        .submit-btn {
          background: #297efc;
          color: white;
        }
        .cancel-btn {
          background: #f0f0f0;
          color: #333;
        }
      </style>
    `;

    // DOM 요소 선택
    const orderList = document.querySelector('#orderList');
    const reservationList = document.querySelector('#reservationList');
    const couponList = document.querySelector('#couponList');
    const info = document.querySelector('#info');

    // 주문내역
    if (currentUserInfo.orderList?.length > 0) {
      currentUserInfo.orderList.forEach((order, index) => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'order-item';
        const items = order.items.map(i => `${i.name}(${i.qty}개)`).join(', ');
        
        // 이미 리뷰를 작성했는지 확인
        const hasReview = order.reviewId ? true : false;
        
        orderDiv.innerHTML = `
          <div class="order-info">
            • <strong>${order.store}</strong><br>
            ${items}<br>
            총 ${order.total.toLocaleString()}원<br>
            📅 ${order.date}<br>
          </div>
          <div class="review-section">
            ${hasReview ? 
              `<p style="color: #297efc; font-size: 14px;">✅ 리뷰 작성 완료</p>` :
              `<button class="review-btn" data-order-index="${index}">📝 리뷰 작성하기</button>`
            }
          </div>
          <br>
        `;
        orderList.appendChild(orderDiv);
      });
    } else {
      orderList.innerHTML = `<p>주문 내역이 없습니다.</p>`;
    }

    // 예약내역
    if (currentUserInfo.reservationList?.length > 0) {
      currentUserInfo.reservationList.forEach(res => {
        const p = document.createElement('p');
        p.innerHTML = `
          • <strong>${res.store}</strong><br>
          ${res.date} / ${res.people}명<br><br>
        `;
        reservationList.appendChild(p);
      });
    } else {
      reservationList.innerHTML = `<p>예약 내역이 없습니다.</p>`;
    }

    // 쿠폰내역
    if (!currentUserInfo.coupons?.unused?.length) {
      couponList.innerHTML = `<p>보유한 쿠폰이 없습니다.</p>`;
    } else {
      currentUserInfo.coupons.unused.forEach(coupon => {
        const p = document.createElement('p');
        p.innerHTML = `
          • <strong>${coupon.name}</strong><br>
          할인율: ${coupon.discountValue}${coupon.discountType === 'percent' ? '%' : '원'}<br>
          유효기간: ${coupon.validUntil}<br><br>
        `;
        couponList.appendChild(p);
      });
    }

    info.addEventListener('click', () => renderMyAccount());

    // 리뷰 작성 버튼 이벤트 리스너
    document.querySelectorAll('.review-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const orderIndex = parseInt(e.target.getAttribute('data-order-index'));
        const order = currentUserInfo.orderList[orderIndex];
        showReviewModal(order, orderIndex);
      });
    });

  } catch (error) {
    console.error('마이페이지 로딩 실패:', error);
    main.innerHTML = `
      <h1>TableLink</h1>
      <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
      <button onclick="renderMain()">메인으로 돌아가기</button>
    `;
  }
}

// 리뷰 작성 모달 표시
function showReviewModal(order, orderIndex) {
  const modal = document.createElement('div');
  modal.className = 'review-modal';
  modal.innerHTML = `
    <div class="review-modal-content">
      <h3>리뷰 작성</h3>
      <p><strong>매장:</strong> ${order.store}</p>
      <p><strong>주문:</strong> ${order.items.map(i => `${i.name}(${i.qty}개)`).join(', ')}</p>
      
      <div>
        <label>평점:</label>
        <div class="star-rating">
          <span class="star" data-rating="1">★</span>
          <span class="star" data-rating="2">★</span>
          <span class="star" data-rating="3">★</span>
          <span class="star" data-rating="4">★</span>
          <span class="star" data-rating="5">★</span>
        </div>
      </div>
      
      <div>
        <label>리뷰 내용:</label>
        <textarea class="review-textarea" placeholder="음식과 서비스에 대한 솔직한 후기를 남겨주세요..."></textarea>
      </div>
      
      <div class="modal-buttons">
        <button class="modal-btn cancel-btn">취소</button>
        <button class="modal-btn submit-btn">리뷰 등록</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  let selectedRating = 0;
  
  // 별점 선택 이벤트
  modal.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', (e) => {
      selectedRating = parseInt(e.target.getAttribute('data-rating'));
      updateStarDisplay(modal, selectedRating);
    });
  });
  
  // 취소 버튼
  modal.querySelector('.cancel-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // 등록 버튼
  modal.querySelector('.submit-btn').addEventListener('click', async () => {
    const reviewText = modal.querySelector('.review-textarea').value.trim();
    
    if (selectedRating === 0) {
      alert('평점을 선택해주세요.');
      return;
    }
    
    if (reviewText === '') {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }
    
    try {
      await submitReview(order, orderIndex, selectedRating, reviewText);
      document.body.removeChild(modal);
      renderMyPage(); // 페이지 새로고침
    } catch (error) {
      alert('리뷰 등록에 실패했습니다.');
      console.error('리뷰 등록 오류:', error);
    }
  });
  
  // 모달 배경 클릭 시 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// 별점 표시 업데이트
function updateStarDisplay(modal, rating) {
  const stars = modal.querySelectorAll('.star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

// 리뷰 서버 전송
async function submitReview(order, orderIndex, rating, reviewText) {
  const reviewData = {
    userId: userInfo.id,
    storeId: order.storeId,
    storeName: order.store,
    orderIndex: orderIndex,
    rating: rating,
    reviewText: reviewText,
    orderDate: order.date
  };
  
  const response = await fetch('/api/reviews/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reviewData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '리뷰 등록 실패');
  }
  
  return response.json();
}

window.renderMyPage = renderMyPage;
