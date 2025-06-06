//예약하기 버튼 클릭 실행
let renderReservationScreen = function (store) {
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

    alert(`예약 완료!\n${store.name}\n${date} ${time} / ${people}명`);
    renderStore(store); // 다시 매장 상세 페이지로 이동
  });

  backBtn.addEventListener('click', () => {
    renderStore(store);
  });
};