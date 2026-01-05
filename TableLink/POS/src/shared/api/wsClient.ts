/**
 * POS WebSocket Service
 */

import { io, Socket } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_WS_URL || ''

type EventCallback = (data: unknown) => void

export interface WebSocketConfig {
  storeId: number
  onConnect?: () => void
  onDisconnect?: () => void
  onNewOrder?: (data: unknown) => void
  onOrderUpdate?: (data: unknown) => void
  onOrderCancel?: (data: unknown) => void
  onTableUpdate?: (data: unknown) => void
  onPaymentComplete?: (data: unknown) => void
  onTLLOrder?: (data: unknown) => void
  onError?: (error: Error) => void
}

/**
 * POS WebSocket 매니저 클래스
 */
class WebSocketManager {
  private socket: Socket | null = null
  private config: WebSocketConfig | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private eventListeners: Map<string, Set<EventCallback>> = new Map()
  private isManualDisconnect = false

  connect(config: WebSocketConfig): void {
    this.config = config
    this.isManualDisconnect = false

    if (this.socket?.connected) {
      console.log('⚡ WebSocket 이미 연결됨')
      return
    }

    console.log('🔌 WebSocket 연결 시작...')

    this.socket = io(WS_URL, {
      query: {
        storeId: config.storeId,
        clientType: 'POS',
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    if (!this.socket || !this.config) return

    this.socket.on('connect', () => {
      console.log('✅ WebSocket 연결 성공')
      this.reconnectAttempts = 0
      this.socket?.emit('join_store', {
        storeId: this.config?.storeId,
        role: 'POS',
      })
      this.config?.onConnect?.()
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket 연결 해제:', reason)
      if (!this.isManualDisconnect) {
        this.config?.onDisconnect?.()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('🚨 WebSocket 연결 오류:', error)
      this.reconnectAttempts++
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.config?.onError?.(new Error('WebSocket 연결 실패'))
      }
    })

    // 이벤트 핸들러
    this.socket.on('new_order', (data) => {
      this.config?.onNewOrder?.(data)
      this.emit('new_order', data)
    })

    this.socket.on('order_update', (data) => {
      this.config?.onOrderUpdate?.(data)
      this.emit('order_update', data)
    })

    this.socket.on('order_cancel', (data) => {
      this.config?.onOrderCancel?.(data)
      this.emit('order_cancel', data)
    })

    this.socket.on('table_update', (data) => {
      this.config?.onTableUpdate?.(data)
      this.emit('table_update', data)
    })

    this.socket.on('payment_complete', (data) => {
      this.config?.onPaymentComplete?.(data)
      this.emit('payment_complete', data)
    })

    this.socket.on('tll_order', (data) => {
      this.config?.onTLLOrder?.(data)
      this.emit('tll_order', data)
    })
  }

  disconnect(): void {
    this.isManualDisconnect = true
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.eventListeners.clear()
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)?.add(callback)
  }

  off(event: string, callback: EventCallback): void {
    this.eventListeners.get(event)?.delete(callback)
  }

  private emit(event: string, data: unknown): void {
    this.eventListeners.get(event)?.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`이벤트 핸들러 오류 (${event}):`, error)
      }
    })
  }

  send(event: string, data: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    }
  }
}

export const wsClient = new WebSocketManager()
