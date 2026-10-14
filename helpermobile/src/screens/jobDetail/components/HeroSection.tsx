import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TowTruckRequestDetail } from '../../../api';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { JobEarningsCard } from '../../../components/job';
import { FkCard } from '../../../components/fk';
import { spacing } from '../../../theme/design';

interface HeroSectionProps {
  towTruckRequest: TowTruckRequestDetail;
  isAwaitingApproval: boolean;
  isInProgress: boolean;
  isCompleted: boolean;
  pricingLoading: boolean;
  pricing: any;
}

/** Kazanç / teklif tutarı özeti (ortak JobEarningsCard). */
export default function HeroSection({
  towTruckRequest,
  isAwaitingApproval,
  isInProgress,
  isCompleted,
  pricingLoading,
  pricing,
}: HeroSectionProps) {
  if (!isAwaitingApproval && !isInProgress && !isCompleted) return null;

  if (pricingLoading) {
    return (
      <FkCard style={styles.loading}>
        <View style={styles.center}>
          <LoadingSpinner size={40} />
        </View>
      </FkCard>
    );
  }

  const amount =
    isCompleted && towTruckRequest?.final_price
      ? towTruckRequest.final_price
      : (isAwaitingApproval || isInProgress) && towTruckRequest?.my_offer?.driver_earnings
      ? towTruckRequest.my_offer.driver_earnings
      : (isAwaitingApproval || isInProgress) && pricing?.driverEarnings
      ? pricing.driverEarnings
      : null;

  if (amount === null || amount === undefined) return null;

  return (
    <JobEarningsCard
      amount={amount}
      status={isCompleted ? 'completed' : isAwaitingApproval ? 'awaiting_approval' : 'in_progress'}
      label={isAwaitingApproval ? 'Teklif Tutarı' : 'Kazanç'}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    marginBottom: spacing.md,
  },
  center: {
    alignItems: 'center',
  },
});
