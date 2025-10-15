/**
 * QR 페이지 View (비회원 TLL)
 * - 테이블 번호 확인 화면
 * - 네이티브 앱 스타일 UI
 */

export const qrView = {
    /**
     * QR 페이지 렌더링
     */
    render(tableNumber, storeName) {
        return `
            <div style="
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px;
            ">
                <!-- 상단 로고 영역 -->
                <div style="
                    margin-bottom: 40px;
                    text-align: center;
                ">
                    <div style="
                        font-size: 48px;
                        margin-bottom: 16px;
                    ">🍴</div>
                    <h1 style="
                        font-size: 28px;
                        font-weight: 700;
                        color: white;
                        margin: 0;
                        text-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    ">TableLink</h1>
                    <p style="
                        font-size: 14px;
                        color: rgba(255,255,255,0.9);
                        margin: 8px 0 0 0;
                    ">비회원 주문</p>
                </div>

                <!-- 메인 카드 -->
                <div style="
                    background: white;
                    border-radius: 24px;
                    padding: 32px 24px;
                    width: 100%;
                    max-width: 400px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                ">
                    <!-- 매장 정보 -->
                    <div style="
                        text-align: center;
                        margin-bottom: 32px;
                    ">
                        <div style="
                            font-size: 20px;
                            font-weight: 700;
                            color: #1d1d1f;
                            margin-bottom: 8px;
                        ">${storeName}</div>
                        <div style="
                            font-size: 14px;
                            color: #86868b;
                        ">매장 주문</div>
                    </div>

                    <!-- 테이블 번호 표시 -->
                    <div style="
                        background: linear-gradient(135deg, #f5f5f7 0%, #e8e8ed 100%);
                        border-radius: 16px;
                        padding: 24px;
                        text-align: center;
                        margin-bottom: 24px;
                    ">
                        <div style="
                            font-size: 14px;
                            color: #86868b;
                            margin-bottom: 8px;
                        ">테이블 번호</div>
                        <div style="
                            font-size: 56px;
                            font-weight: 800;
                            color: #667eea;
                            line-height: 1;
                        ">${tableNumber}</div>
                    </div>

                    <!-- 안내 메시지 -->
                    <div style="
                        background: #f5f5f7;
                        border-radius: 12px;
                        padding: 16px;
                        margin-bottom: 24px;
                    ">
                        <div style="
                            font-size: 14px;
                            color: #1d1d1f;
                            line-height: 1.5;
                        ">
                            ✨ 회원가입 없이 바로 주문하세요<br>
                            📱 주문 내역은 실시간으로 확인 가능합니다<br>
                            💳 결제는 주문 완료 후 진행됩니다
                        </div>
                    </div>

                    <!-- 시작 버튼 -->
                    <button
                        onclick="window.guestQrController.startOrder()"
                        style="
                            width: 100%;
                            height: 56px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            border-radius: 16px;
                            font-size: 17px;
                            font-weight: 600;
                            cursor: pointer;
                            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                            transition: all 0.2s;
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.5)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)';"
                    >
                        메뉴 보기
                    </button>
                </div>

                <!-- 하단 도움말 -->
                <div style="
                    margin-top: 24px;
                    text-align: center;
                    color: rgba(255,255,255,0.8);
                    font-size: 12px;
                ">
                    문제가 있으신가요? 직원을 호출해주세요 🙋
                </div>
            </div>
        `;
    },

    /**
     * 에러 화면 렌더링
     */
    renderError(message) {
        return `
            <div style="
                min-height: 100vh;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px;
            ">
                <div style="
                    background: white;
                    border-radius: 24px;
                    padding: 32px 24px;
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                ">
                    <div style="font-size: 64px; margin-bottom: 16px;">⚠️</div>
                    <h2 style="
                        font-size: 20px;
                        font-weight: 700;
                        color: #1d1d1f;
                        margin: 0 0 16px 0;
                    ">오류가 발생했습니다</h2>
                    <p style="
                        font-size: 14px;
                        color: #86868b;
                        line-height: 1.5;
                        margin: 0 0 24px 0;
                    ">${message}</p>
                    <button
                        onclick="window.location.reload()"
                        style="
                            width: 100%;
                            height: 48px;
                            background: #f5576c;
                            color: white;
                            border: none;
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                        "
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        `;
    }
};
