/**
 * 암호화 유틸리티 - bcryptjs 사용
 */
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

/**
 * 비밀번호 해시화
 * @param password 평문 비밀번호
 * @returns 해시된 비밀번호
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  const hashedPassword = await bcrypt.hash(password, salt)
  return hashedPassword
}

/**
 * 비밀번호 검증 (서버에서 사용)
 * @param password 평문 비밀번호
 * @param hashedPassword 해시된 비밀번호
 * @returns 일치 여부
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

