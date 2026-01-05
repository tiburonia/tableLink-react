/**
 * 빈 슬롯 컴포넌트
 */

interface EmptySlotProps {
  slotNumber: number;
}

export function EmptySlot({ slotNumber }: EmptySlotProps) {
  return (
    <div className="empty-slot">
      <div className="slot-number">{slotNumber}</div>
      <div className="slot-text">대기중</div>
    </div>
  );
}

export default EmptySlot;
