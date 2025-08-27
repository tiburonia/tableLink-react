
const pool = require('../../shared/config/database');

async function normalizePhoneNumbers() {
  const client = await pool.connect();
  
  try {
    console.log('📞 전화번호 형식 정규화 시작...');
    
    await client.query('BEGIN');
    
    // 1. 먼저 중복 전화번호 처리
    console.log('🔍 중복 전화번호 검사 및 처리 중...');
    
    // 정규화된 형태로 중복될 수 있는 전화번호들 찾기
    const potentialDuplicates = await client.query(`
      SELECT phone, COUNT(*) as count
      FROM users 
      WHERE phone IS NOT NULL AND phone != ''
      GROUP BY phone 
      HAVING COUNT(*) > 1
    `);
    
    console.log(`🚨 발견된 중복 전화번호: ${potentialDuplicates.rows.length}개`);
    
    // 각 중복 전화번호 처리 (가장 최근 계정만 유지)
    for (const duplicate of potentialDuplicates.rows) {
      console.log(`🔧 중복 전화번호 ${duplicate.phone} 처리 중... (${duplicate.count}개 계정)`);
      
      const duplicateAccounts = await client.query(`
        SELECT id, name, created_at
        FROM users 
        WHERE phone = $1
        ORDER BY created_at DESC
      `, [duplicate.phone]);
      
      // 첫 번째(가장 최근) 계정 제외하고 나머지 전화번호 NULL로 변경
      for (let i = 1; i < duplicateAccounts.rows.length; i++) {
        const account = duplicateAccounts.rows[i];
        await client.query(`
          UPDATE users 
          SET phone = NULL 
          WHERE id = $1
        `, [account.id]);
        
        console.log(`   📱 ${account.name || account.id}의 전화번호 제거 (중복 해결)`);
      }
      
      console.log(`   ✅ ${duplicateAccounts.rows[0].name || duplicateAccounts.rows[0].id}의 전화번호 유지`);
    }
    
    // 2. users 테이블 전화번호 정규화
    console.log('\n👥 users 테이블 전화번호 정규화 중...');
    
    const usersResult = await client.query(`
      SELECT id, phone, name 
      FROM users 
      WHERE phone IS NOT NULL AND phone != ''
    `);
    
    let userUpdated = 0;
    
    for (const user of usersResult.rows) {
      const originalPhone = user.phone;
      const normalizedPhone = normalizePhoneFormat(originalPhone);
      
      if (normalizedPhone && normalizedPhone !== originalPhone) {
        // 정규화된 번호가 이미 다른 계정에 있는지 확인
        const existingUser = await client.query(`
          SELECT id FROM users 
          WHERE phone = $1 AND id != $2
        `, [normalizedPhone, user.id]);
        
        if (existingUser.rows.length > 0) {
          console.log(`⚠️ ${user.name || user.id}: ${originalPhone} → ${normalizedPhone} (이미 존재하는 번호, 현재 계정 전화번호 제거)`);
          
          // 현재 계정의 전화번호를 NULL로 설정
          await client.query(`
            UPDATE users 
            SET phone = NULL 
            WHERE id = $1
          `, [user.id]);
        } else {
          // 정규화 실행
          await client.query(`
            UPDATE users 
            SET phone = $1 
            WHERE id = $2
          `, [normalizedPhone, user.id]);
          
          console.log(`✅ ${user.name || user.id}: ${originalPhone} → ${normalizedPhone}`);
          userUpdated++;
        }
      }
    }
    
    // 3. guests 테이블 전화번호 정규화
    console.log('\n👤 guests 테이블 전화번호 정규화 중...');
    
    const guestsResult = await client.query(`
      SELECT phone, visit_count 
      FROM guests
    `);
    
    let guestUpdated = 0;
    
    for (const guest of guestsResult.rows) {
      const originalPhone = guest.phone;
      const normalizedPhone = normalizePhoneFormat(originalPhone);
      
      if (normalizedPhone && normalizedPhone !== originalPhone) {
        // 기존 정규화된 번호가 있는지 확인
        const existingGuest = await client.query(`
          SELECT phone, visit_count FROM guests WHERE phone = $1
        `, [normalizedPhone]);
        
        if (existingGuest.rows.length === 0) {
          // 새로운 정규화된 번호로 레코드 생성
          await client.query(`
            INSERT INTO guests (phone, visit_count)
            VALUES ($1, $2)
            ON CONFLICT (phone) DO NOTHING
          `, [normalizedPhone, guest.visit_count]);
          
          // 기존 레코드 삭제
          await client.query(`
            DELETE FROM guests WHERE phone = $1
          `, [originalPhone]);
          
          console.log(`✅ 게스트: ${originalPhone} → ${normalizedPhone}`);
          guestUpdated++;
        } else {
          // 이미 정규화된 번호가 존재하면 방문 기록 병합
          const existingVisitCount = existingGuest.rows[0].visit_count || [];
          const mergedVisitCount = [...existingVisitCount, ...(guest.visit_count || [])];
          
          await client.query(`
            UPDATE guests 
            SET visit_count = $1
            WHERE phone = $2
          `, [JSON.stringify(mergedVisitCount), normalizedPhone]);
          
          // 기존 레코드 삭제
          await client.query(`
            DELETE FROM guests WHERE phone = $1
          `, [originalPhone]);
          
          console.log(`🔄 게스트 병합: ${originalPhone} → ${normalizedPhone}`);
          guestUpdated++;
        }
      }
    }
    
    // 4. paid_orders 테이블 guest_phone 정규화
    console.log('\n💳 paid_orders 테이블 guest_phone 정규화 중...');
    
    const ordersResult = await client.query(`
      SELECT id, guest_phone 
      FROM paid_orders 
      WHERE guest_phone IS NOT NULL AND guest_phone != ''
    `);
    
    let orderUpdated = 0;
    
    for (const order of ordersResult.rows) {
      const originalPhone = order.guest_phone;
      const normalizedPhone = normalizePhoneFormat(originalPhone);
      
      if (normalizedPhone && normalizedPhone !== originalPhone) {
        await client.query(`
          UPDATE paid_orders 
          SET guest_phone = $1 
          WHERE id = $2
        `, [normalizedPhone, order.id]);
        
        console.log(`✅ 주문 ${order.id}: ${originalPhone} → ${normalizedPhone}`);
        orderUpdated++;
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n📊 정규화 완료 요약:');
    console.log(`   - users 테이블: ${userUpdated}개 정규화`);
    console.log(`   - guests 테이블: ${guestUpdated}개 정규화`);
    console.log(`   - paid_orders 테이블: ${orderUpdated}개 정규화`);
    console.log('✅ 전화번호 형식 정규화 완료!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 전화번호 정규화 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 전화번호 정규화 함수
function normalizePhoneFormat(phone) {
  if (!phone) return null;
  
  // 숫자만 추출
  const digits = phone.replace(/\D/g, '');
  
  // 010으로 시작하는 11자리 번호만 처리
  if (digits.length === 11 && digits.startsWith('010')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
  
  // 이미 올바른 형식인지 확인
  if (/^010-\d{4}-\d{4}$/.test(phone)) {
    return phone;
  }
  
  console.log(`⚠️ 처리할 수 없는 전화번호 형식: ${phone}`);
  return null;
}

// 스크립트 직접 실행
if (require.main === module) {
  normalizePhoneNumbers()
    .then(() => {
      console.log('🎉 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = normalizePhoneNumbers;
