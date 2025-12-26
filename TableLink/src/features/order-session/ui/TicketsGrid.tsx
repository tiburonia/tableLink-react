/**
 * 티켓 그리드 컴포넌트
 */

import { getTicketStatusText } from '../model'
import type { OrderTicket, OrderSource } from '../model'
import styles from './TicketsGrid.module.css'

interface TicketsGridProps {
  tickets: OrderTicket[]
  type: OrderSource
  title: string
}

export const TicketsGrid = ({ tickets, type, title }: TicketsGridProps) => {
  if (tickets.length === 0) {
    return (
      <div className={styles.ticketsSection}>
        <div className={styles.subsectionHeader}>
          <div className={styles.subsectionTitle}>
            <span className={styles.statusIcon}>{type === 'TLL' ? '✅' : '🛒'}</span>
            <h4 className={styles.sectionTitle}>{title}</h4>
            <span className={`${styles.typeBadge} ${type === 'TLL' ? styles.tllBadge : styles.posBadge}`}>
              {type === 'TLL' ? '결제완료' : '현장주문'}
            </span>
          </div>
          <div className={styles.subsectionStatus}>총 0건</div>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <p className={styles.emptyText}>주문 내역이 없습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.ticketsSection}>
      <div className={styles.subsectionHeader}>
        <div className={styles.subsectionTitle}>
          <span className={styles.statusIcon}>{type === 'TLL' ? '✅' : '🛒'}</span>
          <h4 className={styles.sectionTitle}>{title}</h4>
          <span className={`${styles.typeBadge} ${type === 'TLL' ? styles.tllBadge : styles.posBadge}`}>
            {type === 'TLL' ? '결제완료' : '현장주문'}
          </span>
        </div>
        <div className={styles.subsectionStatus}>총 {tickets.length}건</div>
      </div>

      <div className={styles.ticketsGrid}>
        {tickets.map((ticket) => (
          <div
            key={ticket.ticket_id}
            className={`${styles.ticketCard} ${type === 'TLL' ? styles.tllCard : styles.posCard}`}
          >
            <div className={styles.ticketHeader}>
              <span className={styles.ticketId}>티켓 #{ticket.ticket_id}</span>
              <span className={`${styles.ticketStatus} ${styles[`status${ticket.status.charAt(0) + ticket.status.slice(1).toLowerCase()}`]}`}>
                {getTicketStatusText(ticket.status)}
              </span>
            </div>

            <div className={styles.ticketItems}>
              {ticket.items.slice(0, 3).map((item, idx) => (
                <div key={idx} className={styles.ticketItem}>
                  <div>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemQuantity}>x{item.quantity}</span>
                  </div>
                  <span className={styles.itemPrice}>
                    {(item.unit_price || 0).toLocaleString()}원
                  </span>
                </div>
              ))}
              {ticket.items.length > 3 && (
                <div className={styles.moreItems}>+{ticket.items.length - 3}개 더</div>
              )}
            </div>

            <div className={styles.ticketTotal}>
              <span className={styles.totalLabel}>총 금액</span>
              <span className={styles.totalAmount}>
                {ticket.items.reduce((sum, item) => sum + (item.unit_price || 0) * item.quantity, 0).toLocaleString()}원
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
