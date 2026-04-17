import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { TowTruckRequestDetail } from '../../../api';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface HeroSectionProps {
  towTruckRequest: TowTruckRequestDetail;
  isAwaitingApproval: boolean;
  isInProgress: boolean;
  isCompleted: boolean;
  pricingLoading: boolean;
  pricing: any;
}

export default function HeroSection({
  towTruckRequest,
  isAwaitingApproval,
  isInProgress,
  isCompleted,
  pricingLoading,
  pricing,
}: HeroSectionProps) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();

  if (!isAwaitingApproval && !isInProgress && !isCompleted) {
    return null;
  }

  const getEarningsDisplay = () => {
    if (isCompleted && towTruckRequest?.final_price) {
      return `${towTruckRequest.final_price} ₺`;
    }
    if ((isAwaitingApproval || isInProgress) && towTruckRequest?.my_offer?.driver_earnings) {
      return `${towTruckRequest.my_offer.driver_earnings} ₺`;
    }
    if ((isAwaitingApproval || isInProgress) && pricing?.driverEarnings) {
      return `${pricing.driverEarnings} ₺`;
    }
    if (isInProgress && pricing?.driverEarnings) {
      return `${pricing.driverEarnings} ₺`;
    }
    return '-';
  };

  const heroBg = isDarkMode ? '#1a2e1a' : '#E8F5E9';
  const statusBg = isDarkMode ? '#0d2137' : '#E3F2FD';
  const statusTextColor = isDarkMode ? '#90CAF9' : '#1976D2';

  return (
    <View style={[styles.heroSection, { backgroundColor: cardBg }]}>
      <View style={styles.heroRow}>
        <View style={[styles.heroCard, { backgroundColor: heroBg }]}>
          {pricingLoading ? (
            <LoadingSpinner size={40} />
          ) : (
            <>
              <Text style={[styles.heroLabel, { color: appColors.text.secondary }]}>
                {isAwaitingApproval ? 'Teklif Tutarı' : 'Kazanç'}
              </Text>
              <Text style={styles.heroValue}>{getEarningsDisplay()}</Text>
            </>
          )}
        </View>
        <View style={[styles.heroCard, styles.statusCard, { backgroundColor: statusBg }]}>
          <MaterialCommunityIcons
            name={isCompleted ? "check-circle" : isAwaitingApproval ? "clock-alert-outline" : "truck-fast"}
            size={32}
            color={isCompleted ? "#4CAF50" : isAwaitingApproval ? "#F57C00" : "#26a69a"}
          />
          {!isCompleted && (
            <Text style={[styles.statusText, { color: statusTextColor }]}>
              {isAwaitingApproval ? 'Onay Bekleniyor' : 'Devam Ediyor'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    marginBottom: 8,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  heroCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 0,
  },
  statusCard: {
    flexShrink: 0,
    minWidth: 80,
  },
  heroLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
});
