function myPage() {

  // 마이페이지 화면 HTML 삽입
  main.innerHTML =`
  <h1>TableLink</h1>
  <br>
  <h4>myPage</h4>
  <br><br><br>
  <div id = 'orderList'>
  <p>주문내역</p>
  </div>'
  <br><br>
  <div id = 'reservationList'>
  <p>예약내역</p>
  </div>
  <br><br>
  <button id= 'info'>회원정보></button> 
  <button id='back'>뒤로가기</button>
  `

  // 버튼 및 입력 요소 선택
  const orderList = document.querySelector('#orderList');
  const reservationList = document.querySelector('#reservationList');
  const info = document.querySelector('#info');
  const back = document.querySelector('#back');


  
  orderList.append()
}