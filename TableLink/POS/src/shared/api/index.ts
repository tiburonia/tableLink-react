/**
 * POS Shared API - Public Exports
 */

export { apiClient, getURLParams } from './apiClient'
export { wsClient } from './wsClient'
export type { WebSocketConfig } from './wsClient'

// Auth API
export * as authApi from './authApi'
export type { Member, Store, LoginRequest, AuthResponse, MyStoresResponse } from './authApi'
