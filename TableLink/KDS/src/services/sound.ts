/**
 * KDS 사운드 관리 모듈
 * - 알림 사운드 재생
 * - Web Audio API 활용
 * - 사운드 설정 관리
 */

class KDSSoundManager {
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = true;

  /**
   * 사운드 초기화
   */
  initialize(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // 로컬 저장소에서 사운드 설정 확인
      this.soundEnabled = !localStorage.getItem('kds-sound-disabled');

      console.log('✅ 사운드 시스템 초기화 완료');
    } catch (error) {
      console.warn('⚠️ 사운드 초기화 실패:', error);
    }
  }

  /**
   * 새 주문 사운드
   */
  playNewOrderSound(): void {
    if (!this.soundEnabled) return;
    this.playBeep(800, 200);
  }

  /**
   * 아이템 완료 사운드
   */
  playItemCompleteSound(): void {
    if (!this.soundEnabled) return;
    this.playBeep(600, 100);
  }

  /**
   * 주문 완료 사운드
   */
  playOrderCompleteSound(): void {
    if (!this.soundEnabled) return;
    this.playBeep(400, 300);
  }

  /**
   * 출력 사운드
   */
  playPrintSound(): void {
    if (!this.soundEnabled) return;
    this.playBeep(500, 150);
  }

  /**
   * 비프음 재생
   */
  private playBeep(frequency: number, duration: number): void {
    if (!this.audioContext || !this.soundEnabled) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('⚠️ 사운드 재생 실패:', error);
    }
  }

  /**
   * 사운드 토글
   */
  toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('kds-sound-disabled', this.soundEnabled ? '' : 'true');

    console.log(`🔊 사운드 ${this.soundEnabled ? '활성화' : '비활성화'}`);
    return this.soundEnabled;
  }

  /**
   * 사운드 활성화 상태 반환
   */
  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * 사운드 활성화 설정
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    localStorage.setItem('kds-sound-disabled', enabled ? '' : 'true');
  }

  /**
   * AudioContext 재개 (브라우저 정책 대응)
   */
  async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const kdsSoundManager = new KDSSoundManager();
export default kdsSoundManager;
