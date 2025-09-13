
/**
 * KDS 사운드 관리 모듈
 * - 알림 사운드 재생
 * - Web Audio API 활용
 * - 사운드 설정 관리
 */

(function() {
  'use strict';

  console.log('🔊 KDS 사운드 모듈 로드');

  // =================== 사운드 관리 ===================
  window.KDSSoundManager = {
    audioContext: null,
    soundEnabled: true,

    /**
     * 사운드 초기화
     */
    initialize() {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 로컬 저장소에서 사운드 설정 확인
        this.soundEnabled = !localStorage.getItem('kds-sound-disabled');
        
        console.log('✅ 사운드 시스템 초기화 완료');
      } catch (error) {
        console.warn('⚠️ 사운드 초기화 실패:', error);
      }
    },

    /**
     * 새 주문 사운드
     */
    playNewOrderSound() {
      if (!this.soundEnabled) return;
      this.playBeep(800, 200);
    },

    /**
     * 아이템 완료 사운드
     */
    playItemCompleteSound() {
      if (!this.soundEnabled) return;
      this.playBeep(600, 100);
    },

    /**
     * 주문 완료 사운드
     */
    playOrderCompleteSound() {
      if (!this.soundEnabled) return;
      this.playBeep(400, 300);
    },

    /**
     * 비프음 재생
     */
    playBeep(frequency, duration) {
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
    },

    /**
     * 사운드 토글
     */
    toggleSound() {
      this.soundEnabled = !this.soundEnabled;
      localStorage.setItem('kds-sound-disabled', this.soundEnabled ? '' : 'true');
      
      const icon = document.getElementById('soundIcon');
      if (icon) {
        icon.textContent = this.soundEnabled ? '🔊' : '🔇';
      }
      
      console.log(`🔊 사운드 ${this.soundEnabled ? '활성화' : '비활성화'}`);
      return this.soundEnabled;
    },

    /**
     * 사운드 상태 확인
     */
    isSoundEnabled() {
      return this.soundEnabled;
    },

    /**
     * 알림 사운드 (출력 등)
     */
    playNotificationSound() {
      if (!this.soundEnabled) return;
      this.playBeep(1000, 150);
    }
  };

  console.log('✅ KDS 사운드 모듈 로드 완료');
})();
