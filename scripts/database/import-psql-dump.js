
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * psql 명령어를 사용하여 SQL 덤프 파일 가져오기
 */

async function importSQLDumpWithPsql(dumpFileName) {
  const dumpFilePath = path.resolve(dumpFileName);
  
  console.log('📂 psql을 사용한 SQL 덤프 파일 가져오기 시작');
  console.log(`📖 파일: ${dumpFilePath}`);
  
  // 파일 존재 확인
  if (!fs.existsSync(dumpFilePath)) {
    throw new Error(`덤프 파일을 찾을 수 없습니다: ${dumpFilePath}`);
  }
  
  // DATABASE_URL 확인
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.');
  }
  
  console.log('📋 DATABASE_URL 확인:', databaseUrl.replace(/\/\/.*@/, '//***:***@'));
  
  try {
    // 1. 기존 데이터베이스 완전 초기화
    console.log('\n🗑️ 기존 데이터베이스 완전 초기화...');
    const resetModule = require('./complete-database-reset');
    await resetModule.completeDatabaseReset();
    
    // 2. psql 명령어로 덤프 파일 가져오기
    console.log('\n⚡ psql을 사용하여 덤프 파일 적용 중...');
    
    await new Promise((resolve, reject) => {
      const psqlProcess = spawn('psql', [databaseUrl, '-f', dumpFilePath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      psqlProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log('📤', data.toString().trim());
      });
      
      psqlProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        const message = data.toString().trim();
        if (message && !message.includes('NOTICE')) {
          console.log('⚠️', message);
        }
      });
      
      psqlProcess.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ psql 덤프 적용 완료!');
          resolve();
        } else {
          console.error('\n❌ psql 덤프 적용 실패');
          console.error('Exit code:', code);
          if (stderr) {
            console.error('Error output:', stderr);
          }
          reject(new Error(`psql이 코드 ${code}로 종료되었습니다.`));
        }
      });
      
      psqlProcess.on('error', (error) => {
        console.error('❌ psql 프로세스 오류:', error);
        reject(error);
      });
    });
    
    // 3. 결과 검증
    console.log('\n🔍 가져오기 결과 검증...');
    const pool = require('../../shared/config/database');
    
    const tablesResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name NOT LIKE 'spatial_%'
    `);
    
    const extensionsResult = await pool.query(`
      SELECT extname 
      FROM pg_extension 
      WHERE extname NOT IN ('plpgsql')
    `);
    
    console.log(`📊 가져온 테이블: ${tablesResult.rows[0].count}개`);
    console.log(`🔧 설치된 확장: ${extensionsResult.rows.map(r => r.extname).join(', ')}`);
    
    console.log('\n🎉 SQL 덤프 파일 가져오기 성공!');
    console.log('✨ 데이터베이스가 덤프 파일 상태로 복원되었습니다.');
    
  } catch (error) {
    console.error('\n💥 덤프 파일 가져오기 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  const dumpFileName = process.argv[2];
  
  if (!dumpFileName) {
    console.error('❌ 사용법: node scripts/database/import-psql-dump.js <덤프파일명>');
    console.error('예시: node scripts/database/import-psql-dump.js schema-export-2025-09-07T07-38-47-953Z.sql');
    process.exit(1);
  }
  
  importSQLDumpWithPsql(dumpFileName)
    .then(() => {
      console.log('\n✅ 모든 작업이 완료되었습니다!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 작업 실패:', error.message);
      process.exit(1);
    });
}

module.exports = { importSQLDumpWithPsql };
