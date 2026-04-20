/**
 * JOBS WEBSOCKET SERVICE
 *
 * Real-time job notifications for all service types.
 *
 * Canonical `ServiceType` (camelCase) alınır; backend-facing URL segment'i
 * `SERVICE_WS_CHANNEL` boundary map'i ile snake_case'e çevrilir.
 *
 * WebSocket endpoint'leri (base URL `WS_BASE_URL` üzerinden türetilir):
 *   towTruck         -> {WS_BASE_URL}/ws/jobs/tow_truck/?auth={jwt}
 *   crane            -> {WS_BASE_URL}/ws/jobs/crane/?auth={jwt}
 *   roadAssistance   -> {WS_BASE_URL}/ws/jobs/road_assistance/?auth={jwt}
 *   homeToHomeMoving -> {WS_BASE_URL}/ws/jobs/home_moving/?auth={jwt}
 *   cityToCity       -> {WS_BASE_URL}/ws/jobs/city_moving/?auth={jwt}
 *   transfer         -> {WS_BASE_URL}/ws/jobs/transfer/?auth={jwt}
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { WS_BASE_URL } from '../constants/network';
import { ServiceType, SERVICE_WS_CHANNEL } from '../constants/serviceTypes';
import { logger } from '../utils/logger';

// Backward-compatible re-export — legacy caller'lar `import { ServiceType } from '../services/jobsWebSocket'` yaptıysa kırılmasın.
export type { ServiceType };

export interface JobMessage {
  type: 'new_job' | 'job_updated' | 'job_cancelled' | 'connection_established';
  job?: {
    id: number;
    tracking_token?: string;
    service_type?: string;
    status?: string;
    old_status?: string;
    estimated_price?: string;
    created_at?: string;
    [key: string]: any;
  };
  job_id?: number;
  status?: string;
  old_status?: string;
  service_type?: string;
  message?: string;
}

export interface JobsWebSocketConfig {
  serviceTypes: ServiceType[];
  onNewJob?: (serviceType: ServiceType, data: any) => void;
  onJobUpdated?: (serviceType: ServiceType, data: any) => void;
  onJobCancelled?: (serviceType: ServiceType, data: any) => void;
  onConnected?: (serviceType: ServiceType) => void;
  onDisconnected?: (serviceType: ServiceType) => void;
  onError?: (serviceType: ServiceType, error: any) => void;
}

interface WebSocketConnection {
  ws: WebSocket | null;
  serviceType: ServiceType;
  reconnectAttempts: number;
  reconnectTimeout: NodeJS.Timeout | null;
}

class JobsWebSocketService {
  private connections: Map<ServiceType, WebSocketConnection> = new Map();
  private config: JobsWebSocketConfig | null = null;
  private isIntentionallyClosed = false;
  private maxReconnectAttempts = 5;

  // Internet monitoring
  private netInfoUnsubscribe: (() => void) | null = null;
  private isInternetConnected = true;
  private wasDisconnectedDueToInternet = false;

  private startInternetMonitoring(): void {
    if (this.netInfoUnsubscribe) return;

    this.netInfoUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;

      if (!isConnected && this.isInternetConnected) {
        this.isInternetConnected = false;
        this.wasDisconnectedDueToInternet = true;

        this.connections.forEach((conn) => {
          if (conn.ws && conn.ws.readyState === WebSocket.OPEN) {
            conn.ws.close();
          }
        });
      } else if (isConnected && !this.isInternetConnected) {
        this.isInternetConnected = true;

        if (this.wasDisconnectedDueToInternet && this.config && !this.isIntentionallyClosed) {
          this.wasDisconnectedDueToInternet = false;
          this.config.serviceTypes.forEach((serviceType) => {
            const conn = this.connections.get(serviceType);
            if (conn) {
              conn.reconnectAttempts = 0;
            }
            this.connectService(serviceType);
          });
        }
      }
    });
  }

  private stopInternetMonitoring(): void {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }
  }

  async connect(config: JobsWebSocketConfig): Promise<void> {
    if (!config.serviceTypes || config.serviceTypes.length === 0) return;

    this.config = config;
    this.isIntentionallyClosed = false;

    this.startInternetMonitoring();

    const netState = await NetInfo.fetch();
    const isConnected = netState.isConnected && netState.isInternetReachable !== false;

    if (!isConnected) {
      this.isInternetConnected = false;
      this.wasDisconnectedDueToInternet = true;
      return;
    }

    this.isInternetConnected = true;

    for (const serviceType of config.serviceTypes) {
      await this.connectService(serviceType);
    }
  }

  private async connectService(serviceType: ServiceType): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('access_token');

      if (!token) {
        logger.error('websocket', 'jobs.connectService JWT missing', { serviceType });
        return;
      }

      const channel = SERVICE_WS_CHANNEL[serviceType];
      const wsUrl = `${WS_BASE_URL}/ws/jobs/${channel}/?auth=${token}`;
      const ws = new WebSocket(wsUrl);

      const connection: WebSocketConnection = {
        ws,
        serviceType,
        reconnectAttempts: 0,
        reconnectTimeout: null,
      };

      this.connections.set(serviceType, connection);

      ws.onopen = () => {
        logger.debug('websocket', 'jobs.onopen', { serviceType });
        connection.reconnectAttempts = 0;
        this.config?.onConnected?.(serviceType);
      };

      ws.onmessage = (event) => {
        try {
          const data: JobMessage = typeof event.data === 'string'
            ? JSON.parse(event.data)
            : event.data;

          logger.debug('websocket', 'jobs.onmessage', { serviceType, type: data.type });

          switch (data.type) {
            case 'new_job':
              this.config?.onNewJob?.(serviceType, data);
              break;
            case 'job_updated':
              this.config?.onJobUpdated?.(serviceType, data);
              break;
            case 'job_cancelled':
              this.config?.onJobCancelled?.(serviceType, data);
              break;
          }
        } catch (error) {
          logger.error('websocket', 'jobs.onmessage parse error', { serviceType });
        }
      };

      ws.onerror = async (error) => {
        this.config?.onError?.(serviceType, error);
      };

      ws.onclose = async (event) => {
        this.config?.onDisconnected?.(serviceType);

        const netState = await NetInfo.fetch();
        const isConnected = netState.isConnected && netState.isInternetReachable !== false;

        if (!isConnected) {
          this.wasDisconnectedDueToInternet = true;
          return;
        }

        if (!this.isIntentionallyClosed && connection.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect(serviceType);
        }
      };
    } catch (error) {
      logger.error('websocket', 'jobs.connectService failure', { serviceType });
      this.config?.onError?.(serviceType, error);
    }
  }

  private attemptReconnect(serviceType: ServiceType): void {
    const connection = this.connections.get(serviceType);
    if (!connection) return;

    connection.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, connection.reconnectAttempts), 30000);

    connection.reconnectTimeout = setTimeout(() => {
      this.connectService(serviceType);
    }, delay);
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopInternetMonitoring();

    this.connections.forEach((connection) => {
      if (connection.reconnectTimeout) {
        clearTimeout(connection.reconnectTimeout);
      }

      if (connection.ws) {
        if (connection.ws.readyState === WebSocket.OPEN || connection.ws.readyState === WebSocket.CONNECTING) {
          connection.ws.close();
        }
      }
    });

    this.connections.clear();
    this.config = null;
    this.wasDisconnectedDueToInternet = false;
  }

  isConnected(serviceType: ServiceType): boolean {
    const connection = this.connections.get(serviceType);
    return connection?.ws !== null && connection?.ws.readyState === WebSocket.OPEN;
  }

  hasActiveConnections(): boolean {
    for (const connection of this.connections.values()) {
      if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
        return true;
      }
    }
    return false;
  }

  getConnectedServices(): ServiceType[] {
    const connected: ServiceType[] = [];
    this.connections.forEach((connection, serviceType) => {
      if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
        connected.push(serviceType);
      }
    });
    return connected;
  }
}

// Singleton instance
export const jobsWebSocket = new JobsWebSocketService();
