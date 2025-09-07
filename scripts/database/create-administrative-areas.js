
const pool = require('../../shared/config/database');

async function createAdministrativeAreas() {
  const client = await pool.connect();

  try {
    console.log('🏛️ 행정구역 테이블 생성 시작...');

    // 행정구역 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS administrative_areas (
        code VARCHAR(10) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        level VARCHAR(20) NOT NULL, -- sido/sigungu/emd
        parent_code VARCHAR(10),
        geom GEOMETRY(POLYGON, 4326),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 공간 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_administrative_areas_geom 
      ON administrative_areas USING GIST (geom);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_administrative_areas_level 
      ON administrative_areas (level);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_administrative_areas_parent 
      ON administrative_areas (parent_code);
    `);

    console.log('✅ 행정구역 테이블 생성 완료');

    // store_addresses 테이블에 행정구역 코드 컬럼 추가
    await client.query(`
      ALTER TABLE store_addresses 
      ADD COLUMN IF NOT EXISTS sido_code VARCHAR(10),
      ADD COLUMN IF NOT EXISTS sigungu_code VARCHAR(10),
      ADD COLUMN IF NOT EXISTS emd_code VARCHAR(10);
    `);

    // 행정구역 코드 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_addresses_sido_code 
      ON store_addresses (sido_code);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_addresses_sigungu_code 
      ON store_addresses (sigungu_code);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_store_addresses_emd_code 
      ON store_addresses (emd_code);
    `);

    console.log('✅ store_addresses 행정구역 코드 컬럼 추가 완료');

    // 샘플 행정구역 데이터 삽입 (서울 일부)
    const sampleData = [
      // 시도
      { code: '11', name: '서울특별시', level: 'sido', parent: null },
      
      // 시군구
      { code: '11740', name: '강남구', level: 'sigungu', parent: '11' },
      { code: '11680', name: '강동구', level: 'sigungu', parent: '11' },
      { code: '11410', name: '서초구', level: 'sigungu', parent: '11' },
      { code: '11650', name: '서대문구', level: 'sigungu', parent: '11' },
      
      // 읍면동 (강남구 일부)
      { code: '1174010100', name: '신사동', level: 'emd', parent: '11740' },
      { code: '1174010200', name: '논현동', level: 'emd', parent: '11740' },
      { code: '1174010300', name: '압구정동', level: 'emd', parent: '11740' },
      { code: '1174010400', name: '청담동', level: 'emd', parent: '11740' }
    ];

    for (const area of sampleData) {
      await client.query(`
        INSERT INTO administrative_areas (code, name, level, parent_code)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          level = EXCLUDED.level,
          parent_code = EXCLUDED.parent_code;
      `, [area.code, area.name, area.level, area.parent]);
    }

    console.log('✅ 샘플 행정구역 데이터 삽입 완료');

    // 기존 store_addresses 데이터에 행정구역 코드 매핑 (간단한 예시)
    await client.query(`
      UPDATE store_addresses SET
        sido_code = '11',
        sigungu_code = CASE 
          WHEN sigungu LIKE '%강남%' THEN '11740'
          WHEN sigungu LIKE '%강동%' THEN '11680'
          WHEN sigungu LIKE '%서초%' THEN '11410'
          WHEN sigungu LIKE '%서대문%' THEN '11650'
          ELSE '11740'
        END,
        emd_code = CASE 
          WHEN eupmyeondong LIKE '%신사%' THEN '1174010100'
          WHEN eupmyeondong LIKE '%논현%' THEN '1174010200'
          WHEN eupmyeondong LIKE '%압구정%' THEN '1174010300'
          WHEN eupmyeondong LIKE '%청담%' THEN '1174010400'
          ELSE '1174010100'
        END
      WHERE sido = '서울특별시';
    `);

    console.log('✅ 기존 매장 데이터 행정구역 코드 매핑 완료');

  } catch (error) {
    console.error('❌ 행정구역 테이블 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  createAdministrativeAreas()
    .then(() => {
      console.log('🎉 행정구역 시스템 설정 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = createAdministrativeAreas;
