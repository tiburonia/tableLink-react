
class SSEService {
  constructor() {
    this.subscribers = new Map(); // topic -> Set<res>
  }

  add(topic, res) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic).add(res);
    
    // 연결 종료 시 정리
    res.on('close', () => {
      this.remove(res);
    });
    
    console.log(`📡 SSE 구독 추가: ${topic}, 총 구독자: ${this.subscribers.get(topic).size}`);
  }

  remove(res) {
    for (const [topic, subscribers] of this.subscribers.entries()) {
      if (subscribers.has(res)) {
        subscribers.delete(res);
        console.log(`📡 SSE 구독 제거: ${topic}, 남은 구독자: ${subscribers.size}`);
        
        if (subscribers.size === 0) {
          this.subscribers.delete(topic);
        }
        break;
      }
    }
  }

  broadcast(topic, data) {
    const subscribers = this.subscribers.get(topic);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const message = `data: ${JSON.stringify(data)}\n\n`;
    const deadConnections = new Set();

    for (const res of subscribers) {
      try {
        res.write(message);
      } catch (error) {
        console.error(`❌ SSE 전송 실패:`, error.message);
        deadConnections.add(res);
      }
    }

    // 끊어진 연결 정리
    for (const deadRes of deadConnections) {
      subscribers.delete(deadRes);
    }

    console.log(`📡 SSE 브로드캐스트: ${topic}, 전송됨: ${subscribers.size - deadConnections.size}/${subscribers.size + deadConnections.size}`);
  }

  getStats() {
    const stats = {};
    for (const [topic, subscribers] of this.subscribers.entries()) {
      stats[topic] = subscribers.size;
    }
    return stats;
  }
}

module.exports = new SSEService();
