
import React from 'react';
import { useParams } from 'react-router-dom';

export default function StorePage() {
  const { storeId } = useParams();

  return (
    <div className="store-page">
      <h1>매장 상세 페이지</h1>
      <p>Store ID: {storeId}</p>
      <p>React로 구현 예정</p>
    </div>
  );
}
