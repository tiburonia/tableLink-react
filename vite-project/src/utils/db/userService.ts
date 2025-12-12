import { query } from './pool'
import type { User } from './types'

/**
 * 모든 사용자 조회
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const users = await query<User>(
      `SELECT id, email, name, phone, created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC`
    )
    return users
  } catch (error) {
    console.error('❌ 사용자 조회 오류:', error)
    throw error
  }
}

/**
 * ID로 사용자 조회
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    const users = await query<User>(
      `SELECT id, email, name, phone, created_at, updated_at 
       FROM users 
       WHERE id = $1`,
      [id]
    )
    return users.length > 0 ? users[0] : null
  } catch (error) {
    console.error('❌ 사용자 조회 오류:', error)
    throw error
  }
}

/**
 * 이메일로 사용자 조회
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const users = await query<User>(
      `SELECT id, email, name, phone, created_at, updated_at 
       FROM users 
       WHERE email = $1`,
      [email]
    )
    return users.length > 0 ? users[0] : null
  } catch (error) {
    console.error('❌ 사용자 조회 오류:', error)
    throw error
  }
}

/**
 * 사용자 생성
 */
export async function createUser(
  email: string,
  name: string,
  options?: {
    phone?: string
  }
): Promise<User> {
  try {
    const result = await query<User>(
      `INSERT INTO users (email, name, phone, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, email, name, phone, created_at, updated_at`,
      [email, name, options?.phone || null]
    )
    return result[0]
  } catch (error) {
    console.error('❌ 사용자 생성 오류:', error)
    throw error
  }
}

/**
 * 사용자 업데이트
 */
export async function updateUser(
  id: string,
  updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
): Promise<User> {
  try {
    const keys = Object.keys(updates)
    if (keys.length === 0) {
      const user = await getUserById(id)
      if (!user) throw new Error('사용자를 찾을 수 없습니다.')
      return user
    }

    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ')
    const values = [...Object.values(updates), id]

    const result = await query<User>(
      `UPDATE users
       SET ${setClause}, updated_at = NOW()
       WHERE id = $${keys.length + 1}
       RETURNING id, email, name, phone, created_at, updated_at`,
      values as (string | number | boolean | null | undefined)[]
    )

    if (result.length === 0) throw new Error('사용자를 찾을 수 없습니다.')
    return result[0]
  } catch (error) {
    console.error('❌ 사용자 업데이트 오류:', error)
    throw error
  }
}

/**
 * 사용자 삭제
 */
export async function deleteUser(id: string): Promise<boolean> {
  try {
    const result = await query<{ id: string }>(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    )
    return result.length > 0
  } catch (error) {
    console.error('❌ 사용자 삭제 오류:', error)
    throw error
  }
}
