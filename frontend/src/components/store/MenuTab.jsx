
import React from 'react';
import { useQuery } from '@tanstack/react-query';

export default function MenuTab({ storeId }) {
  const { data: menu, isLoading } = useQuery({
    queryKey: ['menu', storeId],
    queryFn: async () => {
      const response = await fetch(`/api/stores/${storeId}/menu`);
      if (!response.ok) throw new Error('메뉴를 불러올 수 없습니다');
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="tab-loading">메뉴를 불러오는 중...</div>;
  }

  if (!menu || menu.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <p>등록된 메뉴가 없습니다</p>
      </div>
    );
  }

  // 카테고리별로 그룹화
  const menuByCategory = menu.reduce((acc, item) => {
    const category = item.category || '기타';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <div className="menu-tab">
      {Object.entries(menuByCategory).map(([category, items]) => (
        <div key={category} className="menu-category">
          <h3 className="category-title">{category}</h3>
          <div className="menu-list">
            {items.map((item) => (
              <div key={item.id} className="menu-item">
                <div className="menu-info">
                  <h4>{item.name}</h4>
                  <p className="menu-desc">{item.description}</p>
                  <div className="menu-footer">
                    <span className="menu-price">{item.price.toLocaleString()}원</span>
                    {item.cook_station && (
                      <span className="cook-station">{item.cook_station}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
