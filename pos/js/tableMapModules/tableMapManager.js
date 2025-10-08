
/**
 * 테이블맵 관리 및 이벤트 처리 모듈
 */
const TableMapManager = {
    sseConnection: null,

    /**
     * 테이블 선택
     */
    async selectTable(tableNumber) {
        try {
            console.log(`🪑 테이블 ${tableNumber} 선택`);

            const hasTLLIntegration = await TableMapDataProcessor.checkTLLIntegration(
                POSCore.storeId,
                tableNumber,
            );

            if (!hasTLLIntegration) {
                console.log(`📱 테이블 ${tableNumber}은 TLL 미연동 - 비회원 POS 주문 모드`);
                POSCore.showOrderScreen(tableNumber);
                return;
            }

            const response = await fetch(
                `/api/pos/stores/${POSCore.storeId}/table/${tableNumber}/session-status`,
            );
            const data = await response.json();

            if (data.success && data.hasActiveSession) {
                POSCore.showOrderScreen(tableNumber);
            } else {
                await this.startNewSession(tableNumber);
            }
        } catch (error) {
            console.error("❌ 테이블 선택 실패:", error);
            alert("테이블 정보를 불러올 수 없습니다.");
        }
    },

   

    /**
     * 실시간 업데이트 시작 (SSE 방식)
     */
    startRealtimeUpdates(storeId) {
        this.initSSE(storeId);
    },

    /**
     * SSE 연결 초기화
     */
    initSSE(storeId) {
        try {
            console.log(`📡 POS SSE 연결 시작: 매장 ${storeId}`);

            if (this.sseConnection) {
                this.sseConnection.close();
                this.sseConnection = null;
            }

            this.sseConnection = new EventSource(`/api/sse/pos/${storeId}`);

            this.sseConnection.onopen = () => {
                console.log(`✅ POS SSE 연결 성공: 매장 ${storeId}`);
            };

            this.sseConnection.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📡 POS SSE 메시지 수신:', data.type);

                    switch (data.type) {
                        case 'connected':
                            console.log('🔗 POS SSE 연결 확인:', data.topic);
                            break;
                        case 'heartbeat':
                            break;
                        case 'table_update':
                            this.handleTableUpdate(data.data);
                            break;
                        default:
                            console.log('📨 POS SSE 기타 메시지:', data);
                    }
                } catch (error) {
                    console.error('❌ POS SSE 메시지 파싱 실패:', error);
                }
            };

            this.sseConnection.onerror = (error) => {
                console.error('❌ POS SSE 연결 오류:', error);

                setTimeout(() => {
                    if (this.sseConnection && this.sseConnection.readyState === EventSource.CLOSED) {
                        console.log('🔄 POS SSE 재연결 시도...');
                        this.initSSE(storeId);
                    }
                }, 3000);
            };

            this.sseConnection.addEventListener('close', () => {
                console.log('📡 POS SSE 연결 종료');
            });

        } catch (error) {
            console.error('❌ POS SSE 초기화 실패:', error);

            setTimeout(() => {
                this.initSSE(storeId);
            }, 30000);
        }
    },

    /**
     * 테이블 업데이트 처리
     */
    async handleTableUpdate(updateData) {
        try {
            console.log(`🔄 테이블 업데이트 수신: ${updateData.tables?.length || 0}개 테이블`);

            const tables = await TableMapDataProcessor.loadTables(updateData.storeId);
            this.updateTableGrid(tables);

        } catch (error) {
            console.error('❌ 테이블 업데이트 처리 실패:', error);
        }
    },

    /**
     * SSE 연결 종료
     */
    closeSSE() {
        if (this.sseConnection) {
            this.sseConnection.close();
            this.sseConnection = null;
            console.log('📡 POS SSE 연결 수동 종료');
        }
    },

    /**
     * 테이블 그리드 업데이트
     */
    updateTableGrid(tables) {
        const tableGrid = document.getElementById("tableGrid");
        if (tableGrid) {
            tableGrid.innerHTML = tables
                .map((table) => TableMapRenderer.renderTableCard(table))
                .join("");
        }
    },

    /**
     * 시간 업데이트 시작
     */
    startTimeUpdate() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });

            const timeElement = document.getElementById("currentTime");
            if (timeElement) {
                timeElement.textContent = timeString;
            }
        };

        updateTime();
        setInterval(updateTime, 1000);
    }
};

window.TableMapManager = TableMapManager;
