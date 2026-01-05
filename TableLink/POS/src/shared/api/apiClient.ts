/**
 * POS Shared API - Base HTTP Client
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

/**
 * API 호출 헬퍼 함수
 */
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options
  
  // URL 파라미터 추가
  let url = `${API_BASE_URL}${endpoint}`
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || `HTTP error ${response.status}`)
  }

  return data.data || data
}

export const apiClient = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> => {
    return request<T>(endpoint, { method: 'GET', params })
  },

  post: <T>(endpoint: string, body?: unknown, params?: Record<string, string | number | boolean | undefined>): Promise<T> => {
    return request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      params,
    })
  },

  put: <T>(endpoint: string, body?: unknown, params?: Record<string, string | number | boolean | undefined>): Promise<T> => {
    return request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      params,
    })
  },

  patch: <T>(endpoint: string, body?: unknown, params?: Record<string, string | number | boolean | undefined>): Promise<T> => {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      params,
    })
  },

  delete: <T>(endpoint: string, body?: unknown, params?: Record<string, string | number | boolean | undefined>): Promise<T> => {
    return request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
      params,
    })
  },
}

/**
 * URL 파라미터에서 storeId와 tableNumber 추출
 */
export function getURLParams(): { storeId: number | null; tableNumber: number | null } {
  const params = new URLSearchParams(window.location.search)
  const storeId = params.get('storeId')
  const tableNumber = params.get('tableNumber')

  return {
    storeId: storeId ? parseInt(storeId, 10) : null,
    tableNumber: tableNumber ? parseInt(tableNumber, 10) : null,
  }
}
