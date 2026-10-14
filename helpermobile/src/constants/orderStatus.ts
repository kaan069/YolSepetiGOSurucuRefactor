import { OrderStatus } from '../lib/types';

/**
 * Status display mapping for Turkish UI
 * Maps OrderStatus enum values to user-friendly Turkish labels
 */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Beklemede',
  accepted: 'Kabul Edildi',
  awaiting_approval: 'Onay Bekleniyor',
  awaiting_payment: 'Ödeme Bekleniyor',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal Edildi',
};

// Durum renkleri ve ikonları: theme/design.ts → statusColors (tek kaynak)

/**
 * WebSocket event types for new approval workflow
 */
export const WEBSOCKET_EVENTS = {
  REQUEST_ACCEPTED: 'request_accepted',     // Driver accepted (old: went to in_progress, new: goes to awaiting_approval)
  REQUEST_APPROVED: 'request_approved',     // Customer approved offer (awaiting_approval -> awaiting_payment for crane)
  REQUEST_REJECTED: 'request_rejected',     // Customer rejected offer (awaiting_approval -> cancelled)
  PAYMENT_REQUIRED: 'payment_required',     // Crane: Customer approved, driver needs to pay commission (awaiting_payment)
  PAYMENT_COMPLETED: 'payment_completed',   // Commission paid (awaiting_payment -> in_progress)
  LOCATION_UPDATE: 'location_update',       // Driver location update
  STATUS_UPDATE: 'status_update',           // Generic status change
  REQUEST_COMPLETED: 'request_completed',   // Job completed
} as const;

export type WebSocketEventType = typeof WEBSOCKET_EVENTS[keyof typeof WEBSOCKET_EVENTS];
