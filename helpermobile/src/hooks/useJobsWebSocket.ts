/**
 * useJobsWebSocket Hook
 *
 * Real-time job notifications hook
 * Connects to WebSocket based on user's registered service types
 */
import { useEffect, useCallback, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jobsWebSocket, ServiceType } from '../services/jobsWebSocket';
import { User } from '../api/types';

interface UseJobsWebSocketProps {
  onNewJob?: (serviceType: ServiceType, data: any) => void;
  onJobUpdated?: (serviceType: ServiceType, data: any) => void;
  onJobCancelled?: (serviceType: ServiceType, data: any) => void;
  enabled?: boolean;
}

interface UseJobsWebSocketReturn {
  isConnected: boolean;
  connectedServices: ServiceType[];
  reconnect: () => void;
}

// Map user_type to WebSocket service type
const userTypeToServiceType: Record<string, ServiceType> = {
  'towTruck': 'tow_truck',
  'crane': 'crane',
  'homeToHomeMoving': 'home_moving',
  'cityToCity': 'city_moving',
  'roadAssistance': 'road_assistance',
  'transfer': 'transfer',
};

export function useJobsWebSocket({
  onNewJob,
  onJobUpdated,
  onJobCancelled,
  enabled = true,
}: UseJobsWebSocketProps): UseJobsWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedServices, setConnectedServices] = useState<ServiceType[]>([]);
  const appState = useRef(AppState.currentState);
  const isConnecting = useRef(false);

  // Callback ref'leri - connect dependency zincirini kırmak için
  const onNewJobRef = useRef(onNewJob);
  const onJobUpdatedRef = useRef(onJobUpdated);
  const onJobCancelledRef = useRef(onJobCancelled);

  // Her render'da güncel callback'i ref'e yaz
  useEffect(() => { onNewJobRef.current = onNewJob; }, [onNewJob]);
  useEffect(() => { onJobUpdatedRef.current = onJobUpdated; }, [onJobUpdated]);
  useEffect(() => { onJobCancelledRef.current = onJobCancelled; }, [onJobCancelled]);

  // Get user's service types from AsyncStorage
  const getUserServiceTypes = useCallback(async (): Promise<ServiceType[]> => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) return [];

      const user: User = JSON.parse(userJson);
      const userTypes = user.user_type || [];

      const serviceTypes: ServiceType[] = [];
      for (const userType of userTypes) {
        const wsType = userTypeToServiceType[userType];
        if (wsType) {
          serviceTypes.push(wsType);
        }
      }

      return serviceTypes;
    } catch (error) {
      console.error('[useJobsWS] Error getting user service types:', error);
      return [];
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (isConnecting.current) return;

    isConnecting.current = true;

    // Önceki bağlantıları temizle
    if (jobsWebSocket.hasActiveConnections()) {
      jobsWebSocket.disconnect();
    }

    try {
      const serviceTypes = await getUserServiceTypes();

      if (serviceTypes.length === 0) {
        isConnecting.current = false;
        return;
      }

      await jobsWebSocket.connect({
        serviceTypes,
        onNewJob: (serviceType, data) => {
          onNewJobRef.current?.(serviceType, data);
        },
        onJobUpdated: (serviceType, data) => {
          onJobUpdatedRef.current?.(serviceType, data);
        },
        onJobCancelled: (serviceType, data) => {
          onJobCancelledRef.current?.(serviceType, data);
        },
        onConnected: () => {
          setConnectedServices(jobsWebSocket.getConnectedServices());
          setIsConnected(jobsWebSocket.hasActiveConnections());
        },
        onDisconnected: () => {
          setConnectedServices(jobsWebSocket.getConnectedServices());
          setIsConnected(jobsWebSocket.hasActiveConnections());
        },
        onError: () => {},
      });
    } catch (error) {
      console.error('[useJobsWS] Connection error:', error);
    } finally {
      isConnecting.current = false;
    }
  }, [getUserServiceTypes]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    jobsWebSocket.disconnect();
    setIsConnected(false);
    setConnectedServices([]);
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 500);
  }, [connect, disconnect]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (enabled && !jobsWebSocket.hasActiveConnections()) {
          connect();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, connect]);

  // Initial connection
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (!enabled) {
        disconnect();
      }
    };
  }, [enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectedServices,
    reconnect,
  };
}
