function renderMyAccount() {
  const main = document.getElementById('main');



  // 쿠폰 정보 HTML 생성
  const couponHTML = userInfo.coupons.unused.length > 0
    ? userInfo.coupons.unused.map(c =>
      `• ${c.name} (${c.discountValue}${c.discountType === 'percent' ? '%' : '원'}) - 유효기간: ${c.validUntil}`
    ).join('<br>')
    : '보유한 쿠폰 없음';




  // 내 계정 정보 화면 HTML 삽입
  main.innerHTML = `
    <h2>내 계정 정보</h2>
    <ul>
      <li><strong>아이디:</strong> ${userInfo.id}</li>
      <li><strong>이름:</strong> ${userInfo.name}</li>
      <li><strong>전화번호:</strong> ${userInfo.phone}</li>
      <li><strong>이메일:</strong> ${userInfo.email}</li>
      <li><strong>주소:</strong> ${userInfo.address}</li>
      <li><strong>생년월일:</strong> ${userInfo.birth}</li>
      <li><strong>성별:</strong> ${userInfo.gender}</li>
      <li><strong>포인트:</strong> ${userInfo.point}</li>
      <li><strong>총 주문금액:</strong> ${userInfo.totalCost}</li>
      <li><strong>주문내역:</strong><br>
        ${userInfo.orderList.length > 0
      ? userInfo.orderList.map(o =>
        `• ${o.items.map(i => `
        ${i.name}(${i.qty}개)`).join(', ')} - ${o.total.toLocaleString()}원 (${o.date})`
      ).join('<br>')
      : '주문 내역 없음'}
      </li>
      <li><strong>사용가능한 쿠폰:</strong><br>
        ${couponHTML}
        </li>
      <li><strong>예약내역:</strong><br>
        ${userInfo.reservationList.length > 0
      ? userInfo.reservationList.map(r =>
        `• ${r.store} - ${r.date} (${r.people}명)`
      ).join('<br>')
      : '예약 내역 없음'}
      </li>
      <li><strong>즐겨찾기 매장:</strong><br>
        ${userInfo.favorites.length > 0
          ? userInfo.favorites.join('<br>')
          : '즐겨찾기 매장 없음'
          }
          </li>
    </ul>
    <button id="accountEdit">수정하기</button>
    <button id="backToMain">돌아가기</button>
    <button id= "admin">관리자</button>
  `;


  const accountEdit = document.getElementById('accountEdit');
  const backToMain = document.getElementById('backToMain');
  const admin = document.getElementById('admin');

  accountEdit.addEventListener('click', () => {
    // renderAccountEdit()  // 계정 수정 화면 렌더링 함수 => 아직 미구현
    alert('계정 수정 기능은 아직 준비 중입니다')
  });

  backToMain.addEventListener('click', () => {
    renderMyPage(); // 마이페이지 화면 렌더링 함수
  });

  admin.addEventListener('click', () => {
    console.log(JSON.stringify(users, null, 2))
    console.log(JSON.stringify(userInfo, null, 2))

    console
  })

  
}