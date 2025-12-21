import { type PoolClient, Pool } from 'pg'

/**
 * PostgreSQL 데이터베이스 연결 풀
 */
let pool: Pool | null = null

/**
 * 데이터베이스 풀 초기화
 */
export function initializePool(): Pool {
  if (pool) {
    return pool
  }

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.')
  }

  pool = new Pool({
    connectionString: databaseUrl,
  })

  pool.on('error', (err) => {
    console.error('❌ 예상치 못한 데이터베이스 풀 오류:', err)
  })

  return pool
}

/**
 * 데이터베이스 풀 가져오기
 */
export function getPool(): Pool {
  if (!pool) {
    return initializePool()
  }
  return pool
}

/**
 * 데이터베이스 연결 테스트
 */
export async function testConnection(): Promise<boolean> {
  try {
    const pool = getPool()
    const client = await pool.connect()

    try {
      const result = await client.query('SELECT NOW()')
      console.log('✅ 데이터베이스 연결 성공:', result.rows[0])
      return true
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error)
    return false
  }
}

/**
 * 데이터베이스 쿼리 실행
 * @param text - SQL 쿼리
 * @param values - 쿼리 파라미터
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  values?: (string | number | boolean | null | undefined)[]
): Promise<T[]> {
  const pool = getPool()
  try {
    const result = await pool.query(text, values)
    return result.rows as T[]
  } catch (error) {
    console.error('❌ 쿼리 실행 오류:', error)
    throw error
  }
}

/**
 * 트랜잭션 실행
 * @param callback - 트랜잭션 내에서 실행할 콜백 함수
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ 트랜잭션 오류:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * 데이터베이스 풀 종료
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    console.log('✅ 데이터베이스 연결 풀 종료')
  }
}
