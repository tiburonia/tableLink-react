
/**
 * 이벤트 기반 통신 모듈
 * - 서비스 간 느슨한 결합을 위한 이벤트 버스
 * - 결제, KDS, 알림 등 도메인 간 통신 담당
 */

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * 이벤트 리스너 등록
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * 이벤트 리스너 제거
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * 이벤트 발생 (동기)
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`이벤트 처리 오류 [${event}]:`, error);
      }
    });
  }

  /**
   * 이벤트 발생 (비동기)
   */
  async emitAsync(event, data) {
    if (!this.listeners.has(event)) return [];
    
    const callbacks = this.listeners.get(event);
    const results = [];
    
    for (const callback of callbacks) {
      try {
        const result = await callback(data);
        results.push(result);
      } catch (error) {
        console.error(`비동기 이벤트 처리 오류 [${event}]:`, error);
        results.push({ error: error.message });
      }
    }
    
    return results;
  }

  /**
   * 한 번만 실행되는 리스너 등록
   */
  once(event, callback) {
    const onceCallback = (data) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  /**
   * 모든 리스너 제거
   */
  clear() {
    this.listeners.clear();
  }
}

// 전역 이벤트 버스 인스턴스
const eventBus = new EventBus();

module.exports = eventBus;
