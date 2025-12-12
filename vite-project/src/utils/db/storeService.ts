import { query } from './pool'
import type { Store } from './types'

/**
 * 모든 매장 조회
 */
export async function getAllStores(): Promise<Store[]> {
  try {
    const stores = await query<Store>(
      `SELECT id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at 
       FROM stores 
       ORDER BY created_at DESC`
    )
    return stores
  } catch (error) {
    console.error('❌ 매장 조회 오류:', error)
    throw error
  }
}

/**
 * ID로 매장 조회
 */
export async function getStoreById(id: string): Promise<Store | null> {
  try {
    const stores = await query<Store>(
      `SELECT id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at 
       FROM stores 
       WHERE id = $1`,
      [id]
    )
    return stores.length > 0 ? stores[0] : null
  } catch (error) {
    console.error('❌ 매장 조회 오류:', error)
    throw error
  }
}

/**
 * 카테고리로 매장 조회
 */
export async function getStoresByCategory(category: string): Promise<Store[]> {
  try {
    const stores = await query<Store>(
      `SELECT id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at 
       FROM stores 
       WHERE category = $1 
       ORDER BY rating DESC`,
      [category]
    )
    return stores
  } catch (error) {
    console.error('❌ 카테고리별 매장 조회 오류:', error)
    throw error
  }
}

/**
 * 위치 기반 매장 조회 (반경 내)
 */
export async function getNearbyStores(
  latitude: number,
  longitude: number,
  radiusKm: number = 5
): Promise<Store[]> {
  try {
    const stores = await query<Store>(
      `SELECT id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at,
              ST_Distance(
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
                ST_SetSRID(ST_MakePoint($1, $2), 4326)
              )::numeric / 1000 as distance_km
       FROM stores
       WHERE ST_DWithin(
         ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
         ST_SetSRID(ST_MakePoint($1, $2), 4326),
         $3 * 1000
       )
       ORDER BY distance_km ASC`,
      [longitude, latitude, radiusKm]
    )
    return stores
  } catch (error) {
    console.error('❌ 근처 매장 조회 오류:', error)
    throw error
  }
}

/**
 * 매장 생성
 */
export async function createStore(
  name: string,
  address: string,
  latitude: number,
  longitude: number,
  options?: {
    phone?: string
    category?: string
    description?: string
    opening_hours?: string
  }
): Promise<Store> {
  try {
    const result = await query<Store>(
      `INSERT INTO stores (name, address, latitude, longitude, phone, category, description, opening_hours, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at`,
      [
        name,
        address,
        latitude,
        longitude,
        options?.phone || null,
        options?.category || null,
        options?.description || null,
        options?.opening_hours || null,
      ]
    )
    return result[0]
  } catch (error) {
    console.error('❌ 매장 생성 오류:', error)
    throw error
  }
}

/**
 * 매장 업데이트
 */
export async function updateStore(
  id: string,
  updates: Partial<Omit<Store, 'id' | 'created_at' | 'updated_at'>>
): Promise<Store> {
  try {
    const keys = Object.keys(updates)
    if (keys.length === 0) {
      const store = await getStoreById(id)
      if (!store) throw new Error('매장을 찾을 수 없습니다.')
      return store
    }

    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ')
    const values = [...Object.values(updates), id]

    const result = await query<Store>(
      `UPDATE stores
       SET ${setClause}, updated_at = NOW()
       WHERE id = $${keys.length + 1}
       RETURNING id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at`,
      values as (string | number | boolean | null | undefined)[]
    )

    if (result.length === 0) throw new Error('매장을 찾을 수 없습니다.')
    return result[0]
  } catch (error) {
    console.error('❌ 매장 업데이트 오류:', error)
    throw error
  }
}

/**
 * 매장 삭제
 */
export async function deleteStore(id: string): Promise<boolean> {
  try {
    const result = await query<{ id: string }>(
      'DELETE FROM stores WHERE id = $1 RETURNING id',
      [id]
    )
    return result.length > 0
  } catch (error) {
    console.error('❌ 매장 삭제 오류:', error)
    throw error
  }
}

/**
 * 매장 검색
 */
export async function searchStores(searchQuery: string): Promise<Store[]> {
  try {
    const query_text = `%${searchQuery}%`
    const stores = await query<Store>(
      `SELECT id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at
       FROM stores
       WHERE name ILIKE $1 OR address ILIKE $1 OR category ILIKE $1
       ORDER BY rating DESC`,
      [query_text]
    )
    return stores
  } catch (error) {
    console.error('❌ 매장 검색 오류:', error)
    throw error
  }
}
