import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../../../api';
import { ServiceFilterType } from './useOrdersData';

const SERVICE_ORDER: ServiceFilterType[] = ['tow', 'crane', 'nakliye', 'roadAssistance', 'transfer'];

export function useUserServiceTypes(onServiceTypeChange?: (type: ServiceFilterType) => void) {
  const [userServiceTypes, setUserServiceTypes] = useState<ServiceFilterType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserServiceTypes = useCallback(async () => {
    try {
      setLoading(true);
      const user = await authAPI.getUser();

      if (user && user.user_type && Array.isArray(user.user_type)) {
        const mappedTypes: ServiceFilterType[] = [];

        user.user_type.forEach((type: string) => {
          if (type === 'towTruck') {
            if (!mappedTypes.includes('tow')) mappedTypes.push('tow');
          } else if (type === 'crane') {
            if (!mappedTypes.includes('crane')) mappedTypes.push('crane');
          } else if (type === 'roadAssistance') {
            if (!mappedTypes.includes('roadAssistance')) mappedTypes.push('roadAssistance');
          } else if (type === 'homeToHomeMoving' || type === 'cityToCity') {
            if (!mappedTypes.includes('nakliye')) mappedTypes.push('nakliye');
          } else if (type === 'transfer') {
            if (!mappedTypes.includes('transfer')) mappedTypes.push('transfer');
          }
        });

        // Sort by predefined order
        const sortedTypes = mappedTypes.sort((a, b) => {
          return SERVICE_ORDER.indexOf(a) - SERVICE_ORDER.indexOf(b);
        });

        setUserServiceTypes(sortedTypes);

        // Set initial service type
        if (sortedTypes.length > 0 && onServiceTypeChange) {
          onServiceTypeChange(sortedTypes[0]);
        }

      }
    } catch (error) {
      console.error('❌ Failed to fetch user service types:', error);
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
