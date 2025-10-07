
import React from 'react';
import { useParams } from 'react-router-dom';

export default function OrderPage() {
  const { storeId } = useParams();

  return (
    <div className="order-page">
      <h1>주문 페이지</h1>
      <p>Store ID: {storeId}</p>
    </div>
  );
}
