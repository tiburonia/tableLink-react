let savedCart = {
  order: {},
  store: null
};


const saveCartBtn = function(currentOrder, store) {


  if (Object.keys(currentOrder).length === 0) {
    alert('저장할 주문이 없습니다.');
    return;
  }

  savedCart = {
    order: { ...currentOrder },
    store
  };

  renderMain(); // 메인화면 복귀

  // 장바구니 위젯 표시
  renderCartWidget()
  
}

