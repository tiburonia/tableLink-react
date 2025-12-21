/**
 * 알림 카드 컴포넌트
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../services/notificationService';
import {
  markAsRead,
  getRelativeTime,
  getNotificationIcon,
  getNotificationColor
} from '../services/notificationService';
import './NotificationCard.css';

interface NotificationCardProps {
  notification: Notification;
  onRead: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onRead }) => {
  const navigate = useNavigate();
  const [isRead, setIsRead] = useState(notification.isRead);
  const [isProcessing, setIsProcessing] = useState(false);

  const icon = getNotificationIcon(notification.type);
  const color = getNotificationColor(notification.type);
  const relativeTime = getRelativeTime(notification.createdAt);

  // 메타데이터에서 추가 정보 추출
  const getAdditionalInfo = (): string => {
    const metadata = notification.metadata || {};
    const enrichedData = notification.enrichedData || {};

    const storeInfo = enrichedData.store?.name || metadata.store_name
      ? `매장: ${enrichedData.store?.name || metadata.store_name}`
      : '';
    const tableInfo = enrichedData.order?.table_number || metadata.table_number
      ? `테이블: ${enrichedData.order?.table_number || metadata.table_number}`
      : '';
    const orderInfo = enrichedData.order?.id || metadata.order_id
      ? `주문번호: ${enrichedData.order?.id || metadata.order_id}`
      : '';
    const amountInfo = enrichedData.order?.total_amount || enrichedData.payment?.final_amount || metadata.amount
      ? `금액: ${parseInt(
          String(enrichedData.order?.total_amount || enrichedData.payment?.final_amount || metadata.amount)
        ).toLocaleString()}원`
      : '';
    const ticketInfo = enrichedData.ticket?.ticket_id || metadata.ticket_id
      ? `티켓: ${enrichedData.ticket?.ticket_id || metadata.ticket_id}`
      : '';

    return [storeInfo, tableInfo, orderInfo, ticketInfo, amountInfo]
      .filter(info => info)
      .join(' | ');
  };

  const handleClick = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    // 읽음 처리
    if (!isRead) {
      const userId = parseInt(localStorage.getItem('userId') || '0');
      const success = await markAsRead(notification.id, userId);
      if (success) {
        setIsRead(true);
        onRead();
      }
    }

    // 알림 타입에 따른 액션 처리
    handleNotificationAction();

    setIsProcessing(false);
  };

  const handleNotificationAction = () => {
    const metadata = notification.metadata || {};
    const enrichedData = notification.enrichedData || {};

    switch (notification.type) {
      case 'order':
      case 'payment': {
        // 주문 상세 화면으로 이동
        const orderId = enrichedData.order?.id || metadata.order_id;
        if (orderId) {
          navigate(`/order/${orderId}`);
        }
        break;
      }

      case 'promotion': {
        // 매장 화면으로 이동
        const storeId = enrichedData.store?.store_id || metadata.store_id;
        if (storeId) {
          navigate(`/rs/${storeId}`);
        }
        break;
      }

      case 'system':
        // 설정 화면으로 이동
        navigate('/settings');
        break;

      default:
        break;
    }
  };

  const additionalInfo = getAdditionalInfo();

  return (
    <div
      className={`notification-card ${isRead ? '' : 'unread'}`}
      onClick={handleClick}
      style={{ cursor: isProcessing ? 'wait' : 'pointer' }}
    >
      <div className="notification-icon" style={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
      <div className="notification-content">
        <div className="notification-header">
          <h4 className="notification-title">{notification.title}</h4>
          <span className="notification-time">{relativeTime}</span>
        </div>
        <p className="notification-message">{notification.message}</p>
        {additionalInfo && (
          <div className="notification-meta">{additionalInfo}</div>
        )}
      </div>
      {!isRead && <div className="notification-badge"></div>}
    </div>
  );
};
