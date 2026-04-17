import { TowTruckRequestDetail } from '../../api';

export interface JobDetailProps {
  towTruckRequest: TowTruckRequestDetail;
  status: string | null;
  isAwaitingApproval: boolean;
  isInProgress: boolean;
  isCompleted: boolean;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}
