/**
 * KDS 타입 정의
 */

// 아이템 상태
export type ItemStatus = 'ordered' | 'pending' | 'preparing' | 'ready' | 'served' | 'COOKING' | 'COMPLETED' | 'DONE';

// 티켓 상태
export type TicketStatus = 'PENDING' | 'COOKING' | 'DONE' | 'COMPLETED' | 'SERVED';

// 조리 스테이션
export type CookStation = 'KITCHEN' | 'GRILL' | 'FRY' | 'DRINK' | 'COLD_STATION';

// 주문 아이템
export interface OrderItem {
  id: number | string;
  menuName?: string;
  menu_name?: string;
  quantity: number;
  status?: ItemStatus;
  item_status?: ItemStatus;
  cook_station?: CookStation;
  options?: string;
  notes?: string;
}

// 티켓 (주문)
export interface Ticket {
  id?: number | string;
  ticket_id?: number | string;
  check_id?: number | string;
  order_id?: number | string;
  batch_no?: number;
  table_number?: string | number;
  table_num?: string | number;
  customer_name?: string;
  status: TicketStatus;
  items: OrderItem[];
  source?: 'POS' | 'TLG' | 'ONLINE';
  created_at: string;
  updated_at?: string;
  _printRequested?: boolean;
}

// 탭 타입
export type TabType = 'active' | 'completed';

// KDS 상태
export interface KDSState {
  storeId: string | null;
  currentTab: TabType;
  tickets: Map<string, Ticket>;
  isConnected: boolean;
  soundEnabled: boolean;
}

// WebSocket 이벤트 데이터
export interface KDSUpdateData {
  type: string;
  data: Ticket | OrderItem | any;
  source?: string;
}

// API 응답
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  orders?: Ticket[];
  error?: string;
}

// 슬롯 배치
export interface SlotAssignment {
  [slotNumber: number]: Ticket;
}

// 사용자 정보
export interface UserInfo {
  id?: string;
  token?: string;
  storeId?: string;
}
