import {
  TowTruckInfo,
  CraneInfo,
  TransportInfo,
  HomeMovingInfo,
  RoadAssistanceInfo,
  TransferVehicleInfo,
} from '../../../store/useVehicleStore';

export type VehicleKind =
  | 'tow'
  | 'crane'
  | 'transport'
  | 'homeMoving'
  | 'roadAssistance'
  | 'transfer';

export type EditVehicleFormData = Partial<
  TowTruckInfo &
    CraneInfo &
    TransportInfo &
    HomeMovingInfo &
    RoadAssistanceInfo &
    TransferVehicleInfo
>;

export type VehicleRecord =
  | TowTruckInfo
  | CraneInfo
  | TransportInfo
  | HomeMovingInfo
  | RoadAssistanceInfo
  | TransferVehicleInfo;

export interface VehiclePhotosState {
  vehiclePhoto: string | null;
  insurancePhoto: string | null;
  interiorPhotos: (string | null)[];
  transferDocuments: Record<string, string>;
  loadingPhoto: boolean;
}
