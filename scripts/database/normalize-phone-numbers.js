
const pool = require('../../shared/config/database');

async function normalizePhoneNumbers() {
  const client = await pool.connect();
  
  try {
    console.log('📞 전화번호 형식 정규화 시작...');
    
    await client.query('BEGIN');
    
    // 1. users 테이블 전화번호 정규화
    console.log('👥 users 테이블 전화번호 정규화 중...');
    
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
        await client.query(`
          UPDATE users 
          SET phone = $1 
          WHERE id = $2
        `, [normalizedPhone, user.id]);
        
        console.log(`✅ ${user.name || user.id}: ${originalPhone} → ${normalizedPhone}`);
        userUpdated++;
      }
    }
    
    // 2. guests 테이블 전화번호 정규화
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
          SELECT phone FROM guests WHERE phone = $1
        `, [normalizedPhone]);
        
        if (existingGuest.rows.length === 0) {
          // 새로운 정규화된 번호로 레코드 생성
          await client.query(`
            INSERT INTO guests (phone, visit_count)
            VALUES ($1, $2)
          `, [normalizedPhone, guest.visit_count]);
          
          // 기존 레코드 삭제
          await client.query(`
            DELETE FROM guests WHERE phone = $1
          `, [originalPhone]);
          
          console.log(`✅ 게스트: ${originalPhone} → ${normalizedPhone}`);
          guestUpdated++;
        } else {
          // 이미 정규화된 번호가 존재하면 방문 기록 병합
          await client.query(`
            UPDATE guests 
            SET visit_count = visit_count || $1
            WHERE phone = $2
          `, [JSON.stringify(guest.visit_count), normalizedPhone]);
          
          // 기존 레코드 삭제
          await client.query(`
            DELETE FROM guests WHERE phone = $1
          `, [originalPhone]);
          
          console.log(`🔄 게스트 병합: ${originalPhone} → ${normalizedPhone}`);
          guestUpdated++;
        }
      }
    }
    
    // 3. paid_orders 테이블 guest_phone 정규화
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
