import { OrderStatus } from '../../lib/types';

export interface OrdersJob {
  id: string;
  serviceType: 'crane' | 'tow' | 'transport' | 'nakliye' | 'roadAssistance' | 'transfer';
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
