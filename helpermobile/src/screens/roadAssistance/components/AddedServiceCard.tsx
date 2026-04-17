import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, IconButton, useTheme } from 'react-native-paper';
import { RoadAssistanceInfo } from '../../../store/useVehicleStore';
import { serviceOptions } from './ServiceTypesSection';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface AddedServiceCardProps {
  service: RoadAssistanceInfo;
  onRemove: (id: string) => void;
}

export default function AddedServiceCard({ service, onRemove }: AddedServiceCardProps) {
  const theme = useTheme();
  const { isDarkMode, appColors } = useAppTheme();

  const serviceTagBg = isDarkMode ? '#2a1f0e' : '#fff3e0';

  return (
    <Card mode="outlined" style={styles.serviceCard}>
      <Card.Content>
        <View style={styles.serviceHeader}>
          <View style={styles.serviceInfo}>
            <Text variant="titleMedium" style={styles.serviceTitle}>
              🆘 Yol Yardım Hizmeti
            </Text>
            <Text variant="bodySmall" style={[styles.serviceDetails, { color: appColors.text.secondary }]}>
              {service.pricePerService} TL/hizmet • {service.pricePerKm} TL/km
            </Text>
            <Text variant="bodySmall" style={[styles.serviceDetails, { color: appColors.text.secondary }]}>
              {service.is24Hours ? '7/24 Hizmet' : `${service.workingHoursStart} - ${service.workingHoursEnd}`}
            </Text>
          </View>
          <IconButton
            icon="delete"
            size={20}
            onPress={() => onRemove(service.id)}
            iconColor={theme.colors.error}
          />
        </View>

        <View style={styles.servicesTags}>
          {service.services.slice(0, 3).map((s, index) => {
            const serviceInfo = serviceOptions.find(opt => opt.value === s);
            return (
              <Chip key={index} compact style={[styles.serviceTag, { backgroundColor: serviceTagBg }]}>
                {serviceInfo?.icon} {serviceInfo?.label || s}
              </Chip>
            );
          })}
          {service.services.length > 3 && (
            <Text variant="bodySmall" style={[styles.moreText, { color: appColors.text.secondary }]}>
              +{service.services.length - 3} daha
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  serviceCard: {
    marginBottom: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  serviceDetails: {
    marginTop: 4,
  },
  servicesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 12,
    alignItems: 'center',
  },
  serviceTag: {},
  moreText: {
    fontStyle: 'italic',
    marginLeft: 8,
  },
});
