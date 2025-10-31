
const regularRepository = require('../repositories/regularRepository');

/**
 * 단골 등급 관리 서비스
 */
class RegularService {
  /**
   * 결제 완료 후 단골 처리
   */
  async handleRegularAfterPayment({ orderId, orderAmount }) {
    try {
      console.log('💎 단골 처리 시작:', { orderId, orderAmount });

      // 1️⃣ 주문 정보 조회
      const orderInfo = await regularRepository.getOrderInfo(orderId);
      
      if (!orderInfo) {
        console.error('❌ 주문 정보를 찾을 수 없습니다:', orderId);
        return;
      }

      if (!orderInfo.user_pk) {
        console.log('ℹ️ 비회원 주문이므로 단골 처리를 건너뜁니다');
        return;
      }

      const { store_id: storeId, user_pk: userId, total_price } = orderInfo;
      const finalAmount = orderAmount || total_price || 0;

      console.log('📊 단골 처리 데이터:', { storeId, userId, finalAmount });

      // 2️⃣ 기존 단골 기록 조회
      const existingRegular = await regularRepository.findRegularByStoreAndUser(storeId, userId);

      if (existingRegular) {
        console.log('📊 기존 단골 발견:', existingRegular);

        // 3️⃣ 통계 업데이트
        await regularRepository.updateRegularStats(storeId, userId, finalAmount);

        // 4️⃣ 등급 승급 확인
        const currentLevelId = existingRegular.level_id;
        
        // 현재 레벨 정보 조회
        const currentLevelResult = await regularRepository.pool.query(
          'SELECT level, grade FROM store_regular_levels WHERE id = $1',
          [currentLevelId]
        );

        if (currentLevelResult.rows.length > 0) {
          const currentLevel = currentLevelResult.rows[0].level;
          const currentGrade = currentLevelResult.rows[0].grade;
          const nextLevel = await regularRepository.findNextLevel(storeId, currentLevel);

          if (nextLevel) {
            console.log(`🔍 승급 조건 확인 - 현재: ${currentLevel}(Grade ${currentGrade}), 다음: ${nextLevel.level}(Grade ${nextLevel.grade})`);
            console.log(`📋 다음 레벨 조건: 주문 ${nextLevel.min_orders}회 ${nextLevel.condition_operator || 'AND'} 누적 ${nextLevel.min_spent}원`);
            
            // 업데이트된 통계로 다시 조회
            const updatedRegular = await regularRepository.findRegularByStoreAndUser(storeId, userId);
            console.log(`📊 현재 통계: 주문 ${updatedRegular.visit_count}회, 누적 ${updatedRegular.total_spent}원`);
            
            const eligible = await regularRepository.checkLevelCondition(nextLevel, updatedRegular);

            if (eligible) {
              console.log(`🎉 등급 승급: ${currentLevel} → ${nextLevel.level}`);
              await regularRepository.promoteRegularLevel({
                storeId,
                userId,
                nextLevel,
                currentRegular: updatedRegular
              });
            } else {
              console.log(`⏳ 승급 조건 미달: ${currentLevel} 유지`);
            }
          } else {
            console.log(`✅ 최고 등급 도달: ${currentLevel}`);
          }
        }
      } else {
        console.log('🆕 신규 단골 생성');

        // 5️⃣ 최하위 등급으로 신규 생성
        const lowestLevel = await regularRepository.findLowestLevel(storeId);
        
        if (lowestLevel) {
          await regularRepository.createRegular({
            storeId,
            userId,
            levelId: lowestLevel.id,
            initialAmount: finalAmount,
          });
          console.log('✅ 신규 단골 생성 완료:', lowestLevel.level);
        }
      }

      console.log('✅ 단골 처리 완료');
    } catch (error) {
      console.error('❌ 단골 처리 에러:', error);
      // 에러가 발생해도 결제 프로세스는 계속 진행
    }
  }
}

module.exports = new RegularService();
