
const { backupCurrentStructure } = require('./backup-current-structure');
const { createNewSchema } = require('./create-new-schema');
const { migrateToNewSchema } = require('./migrate-to-new-schema');
const { createCompatibilityViews } = require('./create-compatibility-views');

async function fullMigration() {
  try {
    console.log('🚀 TableLink DB 전체 마이그레이션 시작');
    console.log('⚠️  이 작업은 되돌릴 수 없습니다. 백업을 먼저 생성합니다.');
    
    // 1. 백업
    console.log('\n1️⃣ 현재 DB 구조 백업...');
    await backupCurrentStructure();
    
    // 2. 새 스키마 생성
    console.log('\n2️⃣ 새로운 스키마 생성...');
    await createNewSchema();
    
    // 3. 데이터 마이그레이션
    console.log('\n3️⃣ 데이터 마이그레이션...');
    await migrateToNewSchema();
    
    // 4. 호환성 뷰 생성
    console.log('\n4️⃣ 호환성 뷰 생성...');
    await createCompatibilityViews();
    
    console.log('\n🎉 전체 마이그레이션 완료!');
    console.log('📋 다음 단계:');
    console.log('   1. 새로운 API 라우트 확인');
    console.log('   2. 프론트엔드 코드 수정 확인');
    console.log('   3. 테스트 진행');
    console.log('   4. 구 테이블 정리 (추후)');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    console.log('💡 백업 파일을 확인하여 복구하세요.');
    throw error;
  }
}

if (require.main === module) {
  fullMigration()
    .then(() => {
      console.log('✅ 전체 마이그레이션 성공');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 전체 마이그레이션 실패:', error);
      process.exit(1);
    });
}

module.exports = { fullMigration };
