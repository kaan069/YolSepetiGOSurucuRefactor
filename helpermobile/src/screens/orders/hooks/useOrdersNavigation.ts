import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation';
import { OrderStatus } from '../../../lib/types';
import { ServiceFilterType } from './useOrdersData';

type NavigationType = NativeStackNavigationProp<RootStackParamList>;

export function useOrdersNavigation(serviceFilter: ServiceFilterType) {
  const navigation = useNavigation<NavigationType>();

  const navigateToJob = useCallback(
    (jobId: string, status: OrderStatus, movingType?: 'homeMoving' | 'cityMoving') => {
      if (status === 'pending') {
        // Gelen iş - teklif ekranına git
        navigateToOffer(jobId, movingType);
      } else {
        // Devam eden / onay bekleyen / ödeme bekleyen iş - detay ekranına git
        navigateToDetail(jobId, movingType);
      }
    },
    [serviceFilter, navigation]
  );

  const navigateToOffer = useCallback(
    (jobId: string, movingType?: 'homeMoving' | 'cityMoving') => {
      switch (serviceFilter) {
        case 'crane':
          navigation.navigate('CraneOffer', { orderId: jobId });
          break;
        case 'tow':
          navigation.navigate('TowTruckOffer', { orderId: jobId });
          break;
        case 'nakliye':
          if (movingType === 'cityMoving') {
            navigation.navigate('CityMovingOffer', { orderId: jobId });
          } else {
            navigation.navigate('HomeMovingOffer', { orderId: jobId });
          }
          break;
        case 'roadAssistance':
          navigation.navigate('RoadAssistanceOffer', { orderId: jobId });
          break;
        case 'transfer':
          navigation.navigate('TransferOffer', { orderId: jobId });
          break;
        default:
          navigation.navigate('Offer', { orderId: jobId });
      }
    },
    [serviceFilter, navigation]
  );

  const navigateToDetail = useCallback(
    (jobId: string, movingType?: 'homeMoving' | 'cityMoving') => {
      switch (serviceFilter) {
        case 'crane':
          navigation.navigate('CraneJobDetail', { jobId });
          break;
        case 'tow':
          navigation.navigate('JobDetail', { jobId });
          break;
        case 'nakliye':
          const nakliyeMovingType = movingType === 'cityMoving' ? 'city' : 'home';
          navigation.navigate('NakliyeJobDetail', { jobId, movingType: nakliyeMovingType });
          break;
        case 'roadAssistance':
          navigation.navigate('RoadAssistanceJobDetail', { jobId });
          break;
        case 'transfer':
          navigation.navigate('TransferJobDetail', { jobId });
          break;
        default:
          navigation.navigate('JobDetail', { jobId });
      }
    },
    [serviceFilter, navigation]
  );

  return {
    navigateToJob,
    navigateToOffer,
    navigateToDetail,
  };
}
