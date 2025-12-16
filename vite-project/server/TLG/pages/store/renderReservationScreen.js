//예약하기 버튼 클릭 실행
let renderReservationScreen = function(store) {
  main.innerHTML = `
  <h1>TableLink</h1>
  <br>
  <h4>예약하기 - ${store.name}</h4>
  <label>예약 날짜: <input type="date" id="resDate"></label><br><br>
  <label>예약 시간: <input type="time" id="resTime"></label><br><br>
  <label>인원 수: <input type="number" id="resPeople" min="1" value="1">
  </label>                    <br><br>
  <button id="submitReservation">예약 완료</button>
  <button id="back">뒤로가기</button>
`;

  const submitBtn = document.querySelector('#submitReservation');
  const backBtn = document.querySelector('#back');

  submitBtn.addEventListener('click', () => {
    const date = document.querySelector('#resDate').value;
    const time = document.querySelector('#resTime').value;
    const people = document.querySelector('#resPeople').value;

    if (!date || !time || !people) {
      alert('모든 항목을 입력해주세요.');
      return;
    }

    // 예약 정보 객체 구성
    const reservation = {
      store: store.name || store.title || '알 수 없는 매장',
      date: `${date} ${time}`,
      people: Number(people)
      // 예약한 날짜 및 시간 저장 -> 아직 미구현
      
    };

    // 예약 내역 저장 (users만 저장해도 되고, 참조 유지되면 userInfo도 반영됨)
    users[userInfo.id].reservationList.push(reservation);

    alert(`예약 완료!\n${store.name}\n${date} ${time} / ${people}명`);
    renderStore(store); // 매장 상세 페이지로 복귀
  });

  backBtn.addEventListener('click', () => {
    renderStore(store);
  });
};