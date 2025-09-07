
const fs = require('fs');
const path = require('path');
const pool = require('../../shared/config/database');

async function importSQLDump(dumpFilePath) {
  try {
    console.log('📂 psql을 사용한 SQL 덤프 파일 가져오기 시작');
    console.log('📖 파일:', dumpFilePath);

    // 파일 존재 확인
    if (!fs.existsSync(dumpFilePath)) {
      throw new Error(`덤프 파일을 찾을 수 없습니다: ${dumpFilePath}`);
    }

    // SQL 파일 읽기
    const sqlContent = fs.readFileSync(dumpFilePath, 'utf8');
    console.log('📄 SQL 파일 읽기 완료');

    // SQL 문들을 분리 (간단한 방식)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📊 총 ${statements.length}개의 SQL 문 발견`);

    // 트랜잭션 시작
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      console.log('🔄 트랜잭션 시작');

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        try {
          await client.query(statement);
          successCount++;
          
          if (i % 50 === 0 && i > 0) {
            console.log(`⏳ 진행률: ${i}/${statements.length} (${Math.round(i/statements.length*100)}%)`);
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ SQL 실행 실패 (${i+1}번째):`, error.message);
          
          // 중요한 에러는 중단
          if (error.message.includes('syntax error') || error.message.includes('does not exist')) {
            console.error('💥 중요한 오류 발생, 롤백합니다.');
            await client.query('ROLLBACK');
            throw error;
          }
        }
      }

      await client.query('COMMIT');
      console.log('✅ 트랜잭션 커밋 완료');
      
      console.log(`📊 실행 결과:`);
      console.log(`  ✅ 성공: ${successCount}개`);
      console.log(`  ❌ 실패: ${errorCount}개`);
      
      console.log('🎉 SQL 덤프 파일 가져오기 완료!');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('💥 작업 실패:', error.message);
    process.exit(1);
  }
}

// 명령행 인수 처리
const dumpFile = process.argv[2];

if (!dumpFile) {
  console.error('❌ 사용법: node import-psql-dump.js <덤프파일경로>');
  console.error('예시: node import-psql-dump.js schema-export-2025-09-07T07-38-47-953Z.sql');
  process.exit(1);
}

// 절대 경로로 변환
const absolutePath = path.isAbsolute(dumpFile) 
  ? dumpFile 
  : path.join(process.cwd(), dumpFile);

importSQLDump(absolutePath);
