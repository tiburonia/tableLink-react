let createCoupon = function(type) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10); // "2025-06-09"
  const expireDate = new Date(today);
  expireDate.setDate(today.getDate() + 14); // 2주 후

  if (type === "welcome") {
    return {
      id: Math.floor(Math.random() * 100000),
      name: "첫 주문 10% 할인",
      type: "welcome",
      discountType: "percent",
      discountValue: 10,
      minOrderAmount: 5000,
      validUntil: expireDate.toISOString().slice(0, 10),
      issuedAt: dateStr
    };
  }

  // 다른 쿠폰 타입도 여기에 추가 가능
}

const newCoupon = createCoupon("welcome");
userInfo.coupons.unused.push(newCoupon);
