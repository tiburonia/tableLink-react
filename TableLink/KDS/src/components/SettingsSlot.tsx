/**
 * 설정 슬롯 컴포넌트
 */

interface SettingsSlotProps {
  onShowSettings: () => void;
}

export function SettingsSlot({ onShowSettings }: SettingsSlotProps) {
  return (
    <div className="settings-slot" onClick={onShowSettings}>
      <div className="settings-icon">⚙️</div>
      <div className="settings-text">설정</div>
    </div>
  );
}

export default SettingsSlot;
