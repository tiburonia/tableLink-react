function renderMyPage() {

  // 마이페이지 화면 HTML 삽입
  main.innerHTML =`
  <h1>TableLink</h1>
  <br><br>
  <h3>myPage</h3>
  <br>
  <div id = 'orderList'>
  <h2>주문내역</h2>
  </div>
  <br><br>
  <div id = 'reservationList'>
  <h2>예약내역</h2>
  </div>
  <br><br>
  <button id='info'>내 계정</button> 
  <button id='back'>뒤로가기</button>
  `

  // 버튼 및 입력 요소 선택
  const orderList = document.querySelector('#orderList');
  const reservationList = document.querySelector('#reservationList');
  const info = document.querySelector('#info');
  const back = document.querySelector('#back');

  //주문내역 렌더링


  //예약내역 렌더링


  //내 계정 화면 렌더링 
  info.addEventListener('click', () => {
   renderMyAccount() // 내 계정 화면 렌더링 함수
  })

  //뒤로가기 버튼 클릭 이벤트
  back.addEventListener('click', () => {
    renderMain()
  })
  

  
  
}

window.renderMyPage = renderMyPage