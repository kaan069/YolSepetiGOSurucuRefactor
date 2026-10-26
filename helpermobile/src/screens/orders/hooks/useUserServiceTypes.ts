import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../../../api';
import { ServiceFilterType } from './useOrdersData';
import { logger } from '../../../utils/logger';

const SERVICE_ORDER: ServiceFilterType[] = ['tow', 'crane', 'nakliye', 'roadAssistance', 'transfer'];

/** Randevulu talep alabilen hizmetler (Randevu butonu ve ana ekrandaki randevulu iş sayısı) */
export const SCHEDULABLE_SERVICES: ServiceFilterType[] = ['crane', 'nakliye', 'transfer'];

const USER_TYPE_TO_SERVICE: Record<string, ServiceFilterType> = {
  towTruck: 'tow',
  crane: 'crane',
  roadAssistance: 'roadAssistance',
  homeToHomeMoving: 'nakliye',
  cityToCity: 'nakliye',
  transfer: 'transfer',
};

/** user.user_type (ör. ['towTruck', 'cityToCity']) → İşler sekmesindeki hizmetler, sıralı ve tekil */
export function userServiceTypesOf(userTypes: unknown): ServiceFilterType[] {
  if (!Array.isArray(userTypes)) return [];
  const mapped = new Set<ServiceFilterType>();
  userTypes.forEach((type) => {
    const service = USER_TYPE_TO_SERVICE[type as string];
    if (service) mapped.add(service);
  });
  return SERVICE_ORDER.filter((service) => mapped.has(service));
}

export function useUserServiceTypes(onServiceTypeChange?: (type: ServiceFilterType) => void) {
  const [userServiceTypes, setUserServiceTypes] = useState<ServiceFilterType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserServiceTypes = useCallback(async () => {
    try {
      setLoading(true);
      const user = await authAPI.getUser();

      if (user && user.user_type && Array.isArray(user.user_type)) {
        const sortedTypes = userServiceTypesOf(user.user_type);

        setUserServiceTypes(sortedTypes);

        // Set initial service type
        if (sortedTypes.length > 0 && onServiceTypeChange) {
          onServiceTypeChange(sortedTypes[0]);
        }

      }
    } catch (error) {
      logger.error('orders', 'Failed to fetch user service types');
    } finally {
      setLoading(false);
    }
  }, [onServiceTypeChange]);

  useEffect(() => {
    fetchUserServiceTypes();
  }, [fetchUserServiceTypes]);

  return {
    userServiceTypes,
    loading,
    refetch: fetchUserServiceTypes,
  };
}
