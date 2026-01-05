/**
 * 주문 카드 컴포넌트
 */

import type { Ticket, CookStation } from '../types';
import { extractTicketId } from '../context/KDSContext';

interface OrderCardProps {
  order: Ticket;
  onStartCooking: (ticketId: string) => void;
  onMarkComplete: (ticketId: string) => void;
  onPrintOrder: (ticketId: string) => void;
}

// 경과 시간 계산
function getElapsedTime(createdAt: string): string {
  if (!createdAt) return '0분';

  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) {
    return `${diffMins}분`;
  } else {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}시간 ${mins}분`;
  }
}

// 주방 아이템 필터링
function filterKitchenItems(items: any[]): any[] {
  if (!Array.isArray(items)) return [];

  const kitchenStations: CookStation[] = ['KITCHEN', 'GRILL', 'FRY', 'COLD_STATION'];
  return items.filter((item) => {
    const cookStation = item.cook_station || 'KITCHEN';
    return kitchenStations.includes(cookStation as CookStation);
  });
}

export function OrderCard({ order, onStartCooking, onMarkComplete, onPrintOrder }: OrderCardProps) {
  const ticketId = extractTicketId(order);
  const elapsedTime = getElapsedTime(order.created_at);
  const kitchenItems = filterKitchenItems(order.items);

  // 주방 아이템이 없으면 렌더링하지 않음
  if (kitchenItems.length === 0) {
    return null;
  }

  // 상태별 스타일 결정
  const dbStatus = (order.status || '').toUpperCase();
  let cardClass = 'order-card';
  let statusBadge = '대기';
  let statusColor = '#f39c12';

  if (dbStatus === 'COOKING') {
    cardClass += ' cooking';
    statusBadge = '조리중';
    statusColor = '#e74c3c';
  } else if (['DONE', 'COMPLETED'].includes(dbStatus)) {
    cardClass += ' completed';
    statusBadge = '완료';
    statusColor = '#27ae60';
  }

  const isCooking = dbStatus === 'COOKING';
  const isDone = ['DONE', 'COMPLETED'].includes(dbStatus);

  const moreItemsCount = kitchenItems.length > 4 ? kitchenItems.length - 4 : 0;

  return (
    <div className={cardClass} data-ticket-id={ticketId}>
      <div className="card-header">
        <div className="table-info">
          <span className="table-number">테이블 {order.table_number || 'N/A'}</span>
          <span className="ticket-id">#{ticketId}</span>
        </div>
        <div className="status-info">
          <span className="elapsed-time">{elapsedTime}</span>
          <span className="status-badge" style={{ background: statusColor }}>
            {statusBadge}
          </span>
        </div>
      </div>

      <div className="card-body">
        <div className="order-items">
          {kitchenItems.slice(0, 4).map((item, index) => (
            <div key={item.id || index} className="order-item">
              <span className="item-name">{item.menuName || item.menu_name || '메뉴'}</span>
              <span className="item-quantity">×{item.quantity || 1}</span>
              <span className="item-station">[{item.cook_station || 'KITCHEN'}]</span>
            </div>
          ))}
          {moreItemsCount > 0 && <div className="more-items">+{moreItemsCount}개 더</div>}
        </div>
      </div>

      <div className="card-actions">
        <div className="action-top-row">
          <button
            className="action-btn start-btn"
            onClick={() => onStartCooking(ticketId)}
            disabled={isCooking || isDone}
          >
            🔥 {isCooking ? '조리중' : '시작'}
          </button>
          <button
            className="action-btn complete-btn"
            onClick={() => onMarkComplete(ticketId)}
            disabled={isDone}
          >
            ✅ 완료
          </button>
        </div>
        <div className="action-bottom-row">
          <button className="action-btn print-btn" onClick={() => onPrintOrder(ticketId)}>
            🖨️ 출력
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderCard;
