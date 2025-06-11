let createCoupon = function(type) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const expireDate = new Date(today);
  expireDate.setDate(today.getDate() + 14);

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

  return null; // 정의되지 않은 type이면 null
};
