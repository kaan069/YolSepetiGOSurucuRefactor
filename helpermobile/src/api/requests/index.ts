/**
 * Requests API - Modular Export
 * Tüm API'lerin merkezi export noktası
 *
 * Kullanım:
 * import { towTruckAPI, craneAPI, nakliyeAPI, roadAssistanceAPI } from '../api/requests';
 *
 * Veya eski stil (backward compatible):
 * import requestsAPI from '../api/requests';
 * requestsAPI.getPendingCraneRequests()
 */

// Modular exports
export { towTruckAPI } from './towTruck';
export { craneAPI } from './crane';
export { homeMovingAPI, cityMovingAPI, nakliyeAPI } from './nakliye';
export { roadAssistanceAPI } from './roadAssistance';
export { commonAPI } from './common';
export { cancellationAPI } from './cancellation';
export { employeeAPI } from './employees';
export { employeePanelAPI } from './employeePanel';
export { transferAPI } from './transfer';

// Import all for backward compatible wrapper
import { towTruckAPI } from './towTruck';
import { craneAPI } from './crane';
import { homeMovingAPI, cityMovingAPI } from './nakliye';
import { roadAssistanceAPI } from './roadAssistance';
import { commonAPI } from './common';
import { cancellationAPI } from './cancellation';
import { transferAPI } from './transfer';
import type { CancelServiceType } from '../types';

/**
 * Backward Compatible RequestsAPI
 * Eski kodların çalışmaya devam etmesi için wrapper
 */
class RequestsAPI {
  // ==================== ÇEKICI (TOW TRUCK) ====================
  getPendingTowTruckRequests = () => towTruckAPI.getPendingRequests();
  getAvailableTowTruckRequests = () => towTruckAPI.getAvailableRequests();
  getAwaitingApprovalTowTruckRequests = () => towTruckAPI.getAwaitingApprovalRequests();
  getAwaitingPaymentTowTruckRequests = () => towTruckAPI.getAwaitingPaymentRequests();
  getInProgressTowTruckRequests = () => towTruckAPI.getInProgressRequests();
  getCompletedTowTruckRequests = () => towTruckAPI.getCompletedRequests();
  getTowTruckRequestDetail = (id: number) => towTruckAPI.getRequestDetail(id);
  calculateTowTruckPrice = towTruckAPI.calculatePrice.bind(towTruckAPI);
  acceptTowTruckRequest = towTruckAPI.acceptRequest.bind(towTruckAPI);
  submitTowTruckOffer = (
    trackingToken: string,
    vehicleId: number,
    totalDistanceKm: number,
    proposedPrice: number,
    isGearStuck?: boolean,
    isStuck?: boolean,
    isVehicleOperational?: boolean,
    hasExtraAttachments?: boolean,
    attachmentTypes?: string[],
    employeeId?: number
  ) => towTruckAPI.submitOffer(trackingToken, vehicleId, totalDistanceKm, proposedPrice, isGearStuck, isStuck, isVehicleOperational, hasExtraAttachments, attachmentTypes, employeeId);
  withdrawTowTruckOffer = (trackingToken: string) => towTruckAPI.withdrawOffer(trackingToken);

  // ==================== VINÇ (CRANE) ====================
  getPendingCraneRequests = () => craneAPI.getPendingRequests();
  getAvailableCraneRequests = () => craneAPI.getAvailableRequests();
  getAwaitingApprovalCraneRequests = () => craneAPI.getAwaitingApprovalRequests();
  getAwaitingPaymentCraneRequests = () => craneAPI.getAwaitingPaymentRequests();
  getInProgressCraneRequests = () => craneAPI.getInProgressRequests();
  getCompletedCraneRequests = () => craneAPI.getCompletedRequests();
  getCraneRequestDetail = (id: number) => craneAPI.getRequestDetail(id);
  findCraneByServiceRequestId = (serviceRequestId: number) => craneAPI.findByServiceRequestId(serviceRequestId);
  getMyCranes = () => craneAPI.getMyCranes();
  submitCraneOffer = (
    trackingToken: string,
    vehicleId: number,
    distanceToLocationKm: number,
    estimatedDurationHours: number,
    offerPrice: number,
    employeeId?: number
  ) => craneAPI.submitOffer(trackingToken, vehicleId, distanceToLocationKm, estimatedDurationHours, offerPrice, employeeId);
  withdrawCraneOffer = (trackingToken: string) => craneAPI.withdrawOffer(trackingToken);
  completeCraneRequest = (id: number) => commonAPI.completeCraneRequest(id);
  payCraneCommission = (id: number) => commonAPI.payCraneCommission(id);

  // ==================== EVDEN EVE NAKLİYE (HOME MOVING) ====================
  getPendingHomeMovingRequests = () => homeMovingAPI.getPendingRequests();
  getAwaitingApprovalHomeMovingRequests = () => homeMovingAPI.getAwaitingApprovalRequests();
  getAwaitingPaymentHomeMovingRequests = () => homeMovingAPI.getAwaitingPaymentRequests();
  getInProgressHomeMovingRequests = () => homeMovingAPI.getInProgressRequests();
  getCompletedHomeMovingRequests = () => homeMovingAPI.getCompletedRequests();
  getHomeMovingRequestDetail = (id: number) => homeMovingAPI.getRequestDetail(id);
  submitHomeMovingOffer = homeMovingAPI.submitOffer.bind(homeMovingAPI);
  withdrawHomeMovingOffer = (trackingToken: string) => homeMovingAPI.withdrawOffer(trackingToken);

  // ==================== ŞEHİRLER ARASI NAKLİYE (CITY MOVING) ====================
  getPendingCityMovingRequests = () => cityMovingAPI.getPendingRequests();
  getAwaitingApprovalCityMovingRequests = () => cityMovingAPI.getAwaitingApprovalRequests();
  getAwaitingPaymentCityMovingRequests = () => cityMovingAPI.getAwaitingPaymentRequests();
  getInProgressCityMovingRequests = () => cityMovingAPI.getInProgressRequests();
  getCompletedCityMovingRequests = () => cityMovingAPI.getCompletedRequests();
  getCityMovingRequestDetail = (id: number) => cityMovingAPI.getRequestDetail(id);
  submitCityMovingOffer = cityMovingAPI.submitOffer.bind(cityMovingAPI);
  withdrawCityMovingOffer = (trackingToken: string) => cityMovingAPI.withdrawOffer(trackingToken);

  // ==================== YOL YARDIM (ROAD ASSISTANCE) ====================
  getPendingRoadAssistanceRequests = () => roadAssistanceAPI.getPendingRequests();
  getAvailableRoadAssistanceRequests = () => roadAssistanceAPI.getAvailableRequests();
  getAwaitingApprovalRoadAssistanceRequests = () => roadAssistanceAPI.getAwaitingApprovalRequests();
  getAwaitingPaymentRoadAssistanceRequests = () => roadAssistanceAPI.getAwaitingPaymentRequests();
  getInProgressRoadAssistanceRequests = () => roadAssistanceAPI.getInProgressRequests();
  getCompletedRoadAssistanceRequests = () => roadAssistanceAPI.getCompletedRequests();
  getRoadAssistanceRequestDetail = (id: number) => roadAssistanceAPI.getRequestDetail(id);
  submitRoadAssistanceOffer = roadAssistanceAPI.submitOffer.bind(roadAssistanceAPI);
  withdrawRoadAssistanceOffer = (trackingToken: string) => roadAssistanceAPI.withdrawOffer(trackingToken);

  // ==================== TRANSFER ====================
  getAvailableTransferRequests = () => transferAPI.getAvailableRequests();
  getAwaitingApprovalTransferRequests = () => transferAPI.getAwaitingApprovalRequests();
  getAwaitingPaymentTransferRequests = () => transferAPI.getAwaitingPaymentRequests();
  getInProgressTransferRequests = () => transferAPI.getInProgressRequests();
  getCompletedTransferRequests = () => transferAPI.getCompletedRequests();
  getTransferRequestDetail = (id: number) => transferAPI.getRequestDetail(id);
  submitTransferOffer = transferAPI.submitOffer.bind(transferAPI);
  withdrawTransferOffer = (trackingToken: string) => transferAPI.withdrawOffer(trackingToken);

  // ==================== ORTAK (COMMON) ====================
  getTotalEarnings = () => commonAPI.getTotalEarnings();
  getPeriodEarnings = commonAPI.getPeriodEarnings.bind(commonAPI);
  getEarningsList = commonAPI.getEarningsList.bind(commonAPI);
  completeJobByCustomer = (token: string) => commonAPI.completeJobByCustomer(token);
  approveRequestByCustomer = (token: string) => commonAPI.approveRequestByCustomer(token);
  rejectRequestByCustomer = commonAPI.rejectRequestByCustomer.bind(commonAPI);
  completeTowTruckRequest = (id: number) => commonAPI.completeTowTruckRequest(id);

  // ==================== PAYPOS NFC ÖDEME ====================
  initiatePayPOSPayment = (requestId: number) => commonAPI.initiatePayPOSPayment(requestId);
  getPaymentStatus = (requestId: number) => commonAPI.getPaymentStatus(requestId);

  // ==================== İŞ SAYILARI (JOB COUNTS) ====================
  getAllServicesCounts = () => commonAPI.getAllServicesCounts();
  getServiceCounts = (serviceType: string) => commonAPI.getServiceCounts(serviceType);

  // ==================== İPTAL (CANCELLATION) ====================
  canCancelJob = (serviceType: CancelServiceType, trackingToken: string) =>
    cancellationAPI.canCancel(serviceType, trackingToken);
  cancelJob = (serviceType: CancelServiceType, trackingToken: string, reason?: string) =>
    cancellationAPI.cancelJob(serviceType, trackingToken, reason);
}

// Default export for backward compatibility
const requestsAPI = new RequestsAPI();
export default requestsAPI;
