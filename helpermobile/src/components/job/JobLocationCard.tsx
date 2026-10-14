import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import JobSection from './JobSection';
import { FkButton } from '../fk';
import { useFkTokens } from '../../hooks/useFkTokens';
import { openMapsAt } from '../../utils/contactActions';
import { colors, spacing } from '../../theme/design';

export interface JobLocationPoint {
  /** pickup = yeşil nokta, dropoff = kırmızı, single = ana renk */
  type: 'pickup' | 'dropoff' | 'single';
  /** Noktanın üst etiketi (ör. "Alış Noktası") */
  label?: string;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  /** Adresin altına ek bilgi (ör. "Kat: 3 (Asansör var)") */
  detail?: string;
  /** Yol tarifi butonu metni; verilmezse buton gösterilmez */
  directionsLabel?: string;
}

interface Props {
  title?: string;
  /** MaterialCommunityIcons adı */
  icon?: string;
  points: JobLocationPoint[];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const DOT: Record<JobLocationPoint['type'], string> = {
  pickup: colors.success[500],
  dropoff: colors.danger[500],
  single: colors.primary[500],
};

/**
 * Konum kartı — müşteri uygulamasındaki LocationInfoCard zaman çizelgesi:
 * yeşil alış / kırmızı bırakış noktası, arada bağlantı çizgisi, her noktada isteğe bağlı yol tarifi.
 */
export default function JobLocationCard({ title = 'Konum', icon = 'map-marker-outline', points, style, children }: Props) {
  const { tokens } = useFkTokens();
  return (
    <JobSection title={title} icon={icon} style={style}>
      {points.map((p, i) => (
        <View key={`${p.type}-${i}`}>
          {i > 0 ? <View style={[styles.connector, { backgroundColor: tokens.colors.border }]} /> : null}
          <View style={styles.point}>
            <View style={[styles.dot, { backgroundColor: DOT[p.type] }]} />
            <View style={styles.info}>
              {p.label ? <Text style={[styles.label, { color: tokens.colors.textSecondary }]}>{p.label}</Text> : null}
              <Text style={[styles.address, { color: tokens.colors.textPrimary }]}>
                {p.address || 'Adres belirtilmemiş'}
              </Text>
              {p.detail ? (
                <Text style={[styles.detail, { color: tokens.colors.textSecondary }]}>{p.detail}</Text>
              ) : null}
              {p.directionsLabel ? (
                <FkButton
                  size="sm"
                  variant={p.type === 'dropoff' ? 'secondary' : 'primary'}
                  icon="directions"
                  onPress={() => openMapsAt(p.latitude, p.longitude)}
                  style={styles.directions}
                >
                  {p.directionsLabel}
                </FkButton>
              ) : null}
            </View>
          </View>
        </View>
      ))}
      {children}
    </JobSection>
  );
}

const styles = StyleSheet.create({
  point: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm + 4,
  },
  label: {
    fontSize: 12,
  },
  address: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  detail: {
    fontSize: 13,
    marginTop: 4,
  },
  directions: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  connector: {
    width: 2,
    height: 20,
    marginLeft: 5,
    marginVertical: spacing.xs,
  },
});
