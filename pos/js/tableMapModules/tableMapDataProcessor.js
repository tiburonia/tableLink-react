/**
 * 데이터 처리 및 로딩 담당 모듈 (간소화 버전)
 * - API 응답을 최소한의 변환만 수행
 * - 렌더링 로직은 renderer에서 직접 처리
 */
const TableMapDataProcessor = {
    /**
     * 테이블 정보 로드 (API 응답 그대로 사용)
     */
    async loadTables(storeId) {
        try {
            const response = await fetch(`/api/pos/store/${storeId}/tables`);
            const data = await response.json();

            if (!data.success || !data.tables || data.tables.length === 0) {
                console.log("❌ 등록된 테이블이 없습니다.");
                return [];
            }

            // API 응답 데이터를 그대로 사용 (정렬만 추가)
            const tables = data.tables.sort((a, b) => a.tableNumber - b.tableNumber);
            
            console.log(`✅ 테이블 ${tables.length}개 로드 완료`);
            return tables;
            
        } catch (error) {
            console.error("❌ 테이블 정보 로드 실패:", error);
            return [];
        }
    }
};

window.TableMapDataProcessor = TableMapDataProcessor;
