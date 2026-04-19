import { OrderStatus } from '../../lib/types';
import type { ServiceGroup } from '../../constants/serviceTypes';

export interface OrdersJob {
  id: string;
  /**
   * UI-level `ServiceGroup` — canonical atomik tipler + `'nakliye'` birleşik
   * kartı. `homeToHomeMoving` ve `cityToCity` bu listede UI tarafında
   * `'nakliye'` olarak birleşik render edilir; atomik ayrım için `movingType`
   * alanı taşınır (navigation + setActiveJob store adapter).
   */
  serviceType: ServiceGroup;
  vehicleType: string;
  movingType?: 'homeMoving' | 'cityMoving';
  from: {
    lat: number;
    lng: number;
    address: string;
  };
  to: {
    lat: number;
    lng: number;
    address: string;
  };
  distance: number;
  estimatedPrice: number;
  status: OrderStatus;
  createdAt: Date;
  description: string;
  // Nakliye işleri için tercih edilen tarih (OrderCard tarafından render edilir)
  preferredDate?: string;
  // Aktif iş takibi için backend tokeni (bazı flow'larda prop chain'inde taşınır)
  trackingToken?: string;
}
