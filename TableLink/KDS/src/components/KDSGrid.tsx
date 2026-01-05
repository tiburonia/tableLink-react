/**
 * KDS 그리드 컴포넌트
 * - 티켓 카드들을 그리드 형태로 표시
 * - COOKING 상태 우선, ticket_id 순서로 정렬
 */

import { useMemo } from 'react';
import type { Ticket, CookStation } from '../types';
import { extractTicketId } from '../context/KDSContext';
import OrderCard from './OrderCard';
import EmptySlot from './EmptySlot';
import SettingsSlot from './SettingsSlot';

interface KDSGridProps {
  tickets: Ticket[];
  onStartCooking: (ticketId: string) => void;
  onMarkComplete: (ticketId: string) => void;
  onPrintOrder: (ticketId: string) => void;
  onShowSettings: () => void;
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

// 슬롯 배치 계획
function planSlotAssignments(orders: Ticket[]): Map<number, Ticket> {
  const assignments = new Map<number, Ticket>();

  if (orders.length === 0) {
    return assignments;
  }

  // 주방 관련 주문만 필터링
  const kitchenOrders = orders.filter((order) => {
    const kitchenItems = filterKitchenItems(order.items);
    return kitchenItems.length > 0;
  });

  // 정렬: COOKING 상태 최우선 + ticket_id 기준 오름차순
  const sortedOrders = [...kitchenOrders].sort((a, b) => {
    const statusA = (a.status || '').toUpperCase();
    const statusB = (b.status || '').toUpperCase();

    // COOKING 상태 최우선 배치
    const isCookingA = statusA === 'COOKING';
    const isCookingB = statusB === 'COOKING';

    if (isCookingA && !isCookingB) return -1;
    if (!isCookingA && isCookingB) return 1;

    // 동일 상태 내에서는 ticket_id 기준 오름차순 정렬
    const getOrderTicketId = (order: Ticket): number => {
      if (order.ticket_id && !isNaN(parseInt(String(order.ticket_id)))) {
        return parseInt(String(order.ticket_id));
      }
      if (order.id && !isNaN(parseInt(String(order.id)))) {
        return parseInt(String(order.id));
      }
      if (order.check_id && !isNaN(parseInt(String(order.check_id)))) {
        return parseInt(String(order.check_id));
      }
      return 999999;
    };

    const idA = getOrderTicketId(a);
    const idB = getOrderTicketId(b);

    return idA - idB;
  });

  // 1번 슬롯부터 순차적으로 배치
  let slotIndex = 1;

  sortedOrders.forEach((order) => {
    if (slotIndex <= 9) {
      assignments.set(slotIndex, order);
      slotIndex++;
    }
  });

  return assignments;
}

export function KDSGrid({
  tickets,
  onStartCooking,
  onMarkComplete,
  onPrintOrder,
  onShowSettings,
}: KDSGridProps) {
  // 슬롯 배치 계산 (메모이제이션)
  const slotAssignments = useMemo(() => planSlotAssignments(tickets), [tickets]);

  // 10개 슬롯 렌더링 (1-9: 주문 카드, 10: 설정)
  const slots = [];

  for (let i = 1; i <= 10; i++) {
    if (i === 10) {
      // 10번 슬롯은 설정
      slots.push(
        <div key={i} className="grid-slot" data-slot={i}>
          <SettingsSlot onShowSettings={onShowSettings} />
        </div>
      );
    } else {
      const assignedOrder = slotAssignments.get(i);

      if (assignedOrder) {
        const ticketId = extractTicketId(assignedOrder);
        slots.push(
          <div key={`${i}-${ticketId}`} className="grid-slot" data-slot={i}>
            <OrderCard
              order={assignedOrder}
              onStartCooking={onStartCooking}
              onMarkComplete={onMarkComplete}
              onPrintOrder={onPrintOrder}
            />
          </div>
        );
      } else {
        slots.push(
          <div key={i} className="grid-slot" data-slot={i}>
            <EmptySlot slotNumber={i} />
          </div>
        );
      }
    }
  }

  return (
    <main className="kds-main">
      <div className="kds-grid" id="kdsGrid">
        {slots}
      </div>
    </main>
  );
}

export default KDSGrid;
