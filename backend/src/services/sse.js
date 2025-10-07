
/**
 * Server-Sent Events (SSE) 허브
 * 연결 수 제한, 타임아웃, 하트비트 포함
 */

class SSEHub {
  constructor() {
    this.subscribers = new Map(); // topic -> Set<connection>
    this.connections = new Map(); // res -> connectionInfo
    this.maxConnectionsPerTopic = 100;
    this.heartbeatInterval = 20000; // 20초
    this.connectionTimeout = 300000; // 5분
    
    // 주기적 정리 작업
    setInterval(() => this.cleanup(), 60000); // 1분마다
  }

  /**
   * 구독자 추가
   */
  add(topic, res) {
    // 연결 수 제한 확인
    const topicSubscribers = this.subscribers.get(topic) || new Set();
    if (topicSubscribers.size >= this.maxConnectionsPerTopic) {
      res.status(503).json({
        error: {
          code: 'TOO_MANY_CONNECTIONS',
          message: `토픽 ${topic}의 최대 연결 수(${this.maxConnectionsPerTopic})를 초과했습니다`
        }
      });
      return false;
    }

    // SSE 헤더 설정
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // 초기 연결 메시지
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      topic,
      timestamp: new Date().toISOString()
    })}\n\n`);

    // 구독자 목록에 추가
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic).add(res);

    // 연결 정보 저장
    const connectionInfo = {
      topic,
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
      heartbeatTimer: null
    };
    this.connections.set(res, connectionInfo);

    // 하트비트 시작
    this.startHeartbeat(res, connectionInfo);

    // 연결 종료 핸들러
    res.on('close', () => {
      this.remove(res);
    });

    res.on('error', (error) => {
      console.error('❌ SSE 연결 에러:', error);
      this.remove(res);
    });

    console.log(`📡 SSE 연결 추가: ${topic} (현재 ${topicSubscribers.size + 1}개 연결)`);
    return true;
  }

  /**
   * 구독자 제거
   */
  remove(res) {
    const connectionInfo = this.connections.get(res);
    if (!connectionInfo) return;

    const { topic, heartbeatTimer } = connectionInfo;

    // 하트비트 타이머 정리
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }

    // 구독자 목록에서 제거
    const topicSubscribers = this.subscribers.get(topic);
    if (topicSubscribers) {
      topicSubscribers.delete(res);
      if (topicSubscribers.size === 0) {
        this.subscribers.delete(topic);
      }
    }

    // 연결 정보 제거
    this.connections.delete(res);

    console.log(`📡 SSE 연결 제거: ${topic} (현재 ${topicSubscribers ? topicSubscribers.size : 0}개 연결)`);
  }

  /**
   * 메시지 브로드캐스트
   */
  broadcast(topic, data) {
    const subscribers = this.subscribers.get(topic);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const message = `data: ${JSON.stringify(data)}\n\n`;
    const deadConnections = [];

    subscribers.forEach(res => {
      try {
        res.write(message);
        
        // 마지막 하트비트 시간 업데이트
        const connectionInfo = this.connections.get(res);
        if (connectionInfo) {
          connectionInfo.lastHeartbeat = Date.now();
        }
      } catch (error) {
        console.error('❌ SSE 브로드캐스트 에러:', error);
        deadConnections.push(res);
      }
    });

    // 죽은 연결 정리
    deadConnections.forEach(res => this.remove(res));

    console.log(`📡 SSE 브로드캐스트: ${topic} -> ${subscribers.size - deadConnections.length}개 연결`);
  }

  /**
   * 하트비트 시작
   */
  startHeartbeat(res, connectionInfo) {
    connectionInfo.heartbeatTimer = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        })}\n\n`);
        
        connectionInfo.lastHeartbeat = Date.now();
      } catch (error) {
        console.error('❌ 하트비트 전송 실패:', error);
        this.remove(res);
      }
    }, this.heartbeatInterval);
  }

  /**
   * 주기적 정리 작업
   */
  cleanup() {
    const now = Date.now();
    const deadConnections = [];

    this.connections.forEach((connectionInfo, res) => {
      // 타임아웃된 연결 찾기
      if (now - connectionInfo.lastHeartbeat > this.connectionTimeout) {
        deadConnections.push(res);
      }
    });

    // 타임아웃된 연결 정리
    deadConnections.forEach(res => {
      console.log('🧹 타임아웃된 SSE 연결 정리');
      this.remove(res);
    });

    if (deadConnections.length > 0) {
      console.log(`🧹 SSE 정리 완료: ${deadConnections.length}개 연결 제거`);
    }
  }

  /**
   * 상태 정보 반환
   */
  getStats() {
    const stats = {
      totalConnections: this.connections.size,
      topics: {}
    };

    this.subscribers.forEach((subscribers, topic) => {
      stats.topics[topic] = subscribers.size;
    });

    return stats;
  }
}

// 싱글톤 인스턴스
const sseHub = new SSEHub();

module.exports = sseHub;
