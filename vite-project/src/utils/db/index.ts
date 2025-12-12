/**
 * 데이터베이스 클라이언트 (API 기반)
 * 
 * 브라우저에서 직접 데이터베이스에 접근할 수 없으므로,
 * Node.js 백엔드 API를 통해 데이터베이스 작업 수행
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/db';

// =============================================================================
// STORES API FUNCTIONS
// =============================================================================

/**
 * 모든 매장 조회
 */
export async function getAllStores() {
  try {
    const response = await fetch(`${API_BASE_URL}/stores`);
    if (!response.ok) throw new Error('매장 조회 실패');
    return await response.json();
  } catch (error) {
    console.error('❌ 매장 조회 오류:', error);
    throw error;
  }
}

/**
 * ID로 매장 조회
 */
export async function getStoreById(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/stores/${id}`);
    if (!response.ok) throw new Error('매장 조회 실패');
    return await response.json();
  } catch (error) {
    console.error('❌ 매장 조회 오류:', error);
    throw error;
  }
}

/**
 * 카테고리로 매장 조회
 */
export async function getStoresByCategory(category: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/stores-by-category/${category}`);
    if (!response.ok) throw new Error('매장 조회 실패');
    return await response.json();
  } catch (error) {
    console.error('❌ 카테고리별 매장 조회 오류:', error);
    throw error;
  }
}

/**
 * 위치 기반 매장 조회 (반경 내)
 */
export async function getNearbyStores(
  latitude: number,
  longitude: number,
  radiusKm: number = 5
) {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radiusKm.toString()
    });
    const response = await fetch(`${API_BASE_URL}/stores-nearby?${params}`);
    if (!response.ok) throw new Error('근처 매장 조회 실패');
    return await response.json();
  } catch (error) {
    console.error('❌ 근처 매장 조회 오류:', error);
    throw error;
  }
}

/**
 * 매장 검색
 */
export async function searchStores(searchQuery: string) {
  try {
    const params = new URLSearchParams({ query: searchQuery });
    const response = await fetch(`${API_BASE_URL}/stores-search?${params}`);
    if (!response.ok) throw new Error('매장 검색 실패');
    return await response.json();
  } catch (error) {
    console.error('❌ 매장 검색 오류:', error);
    throw error;
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
) {
  try {
    const response = await fetch(`${API_BASE_URL}/stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        address,
        latitude,
        longitude,
        ...options
      })
    });
    if (!response.ok) throw new Error('매장 생성 실패');
    return await response.json();
  } catch (error) {
    console.error('❌ 매장 생성 오류:', error);
    throw error;
  }
}

/**
 * 매장 업데이트
 */
export async function updateStore(
  id: string,
  updates: Record<string, unknown>
) {
  try {
    const response = await fetch(`${API_BASE_URL}/stores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('매장 업데이트 실패');
    return await response.json();
  } catch (error) {
    console.error('❌ 매장 업데이트 오류:', error);
    throw error;
  }
}

/**
 * 매장 삭제
 */
export async function deleteStore(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/stores/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('매장 삭제 실패');
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('❌ 매장 삭제 오류:', error);
    throw error;
  }
}

// =============================================================================
// USERS API FUNCTIONS
// =============================================================================

/**
 * 모든 사용자 조회
 */
export async function getAllUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('사용자 조회 실패');
    return await response.json();
  } catch (error) {
    console.error('❌ 사용자 조회 오류:', error);
    throw error;
  }
}

/**
 * ID로 사용자 조회
 */
export async function getUserById(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) throw new Error('사용자 조회 실패');
    return await response.json();
  } catch (error) {
    console.error('❌ 사용자 조회 오류:', error);
    throw error;
  }
}

/**
 * 이메일로 사용자 조회
 */
export async function getUserByEmail(email: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/users-by-email/${email}`);
    if (!response.ok) throw new Error('사용자 조회 실패');
    return await response.json();
  } catch (error) {
    console.error('❌ 사용자 조회 오류:', error);
    throw error;
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
) {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name,
        ...options
      })
    });
    if (!response.ok) throw new Error('사용자 생성 실패');
    return await response.json();
  } catch (error) {
    console.error('❌ 사용자 생성 오류:', error);
    throw error;
  }
}

/**
 * 사용자 업데이트
 */
export async function updateUser(
  id: string,
  updates: Record<string, unknown>
) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('사용자 업데이트 실패');
    return await response.json();
  } catch (error) {
    console.error('❌ 사용자 업데이트 오류:', error);
    throw error;
  }
}

/**
 * 사용자 삭제
 */
export async function deleteUser(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('사용자 삭제 실패');
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('❌ 사용자 삭제 오류:', error);
    throw error;
  }
}

// =============================================================================
// DATABASE CONNECTION TEST
// =============================================================================

/**
 * 데이터베이스 연결 테스트
 */
export async function testConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/test-connection`);
    const data = await response.json();
    return data.connected === true;
  } catch (error) {
    console.error('❌ 데이터베이스 연결 테스트 실패:', error);
    return false;
  }
}

