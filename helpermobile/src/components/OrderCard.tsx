import React from 'react';
import { OrdersJob } from '../screens/orders/types';
import { View, StyleSheet, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../hooks/useAppTheme';
import { maskAddressToArea } from '../utils/addressMask';
import { useDriverStore } from '../store/driverStore';
import { calculateDistance } from '../screens/jobDetail/utils';
import type { OrderStatus } from '../lib/types';
import { SERVICE_ICON, SERVICE_LABEL } from '../constants/serviceTypeUI';
import { FkButton, FkCard, FkIconChip, FkStatusBadge } from './fk';
import { colors, radius, spacing, text, tint } from '../theme/design';
import { formatSchedule, getScheduleState, ScheduleState } from '../utils/schedule';

// Kart üzerindeki durum etiketi — "Beklemede" yerine sürücü diliyle "Gelen İş".
const STATUS_TEXT: Partial<Record<OrderStatus, string>> = {
  pending: 'Gelen İş',
  awaiting_approval: 'Onay Bekliyor',
  awaiting_payment: 'Ödeme Bekleniyor',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
};

// Randevu şeridinin rengi: gecikme kırmızı, bugün sarı, yola çıkıldı yeşil, ileri tarih turkuaz
const SCHEDULE_TINT: Record<ScheduleState, Parameters<typeof tint>[0]> = {
  late: 'danger',
  now: 'warning',
  today: 'warning',
  departed: 'success',
  tomorrow: 'primary',
  upcoming: 'primary',
};

interface Props {
  item: OrdersJob;
  onPress: () => void;
  onDismiss?: () => void;
}

// Uygulama Türkiye'de kullanıldığı için ülke ismi gereksiz — adres parça
// listesinden filtrelenir; aksi halde "Erzurum, Türkiye" gibi backend
// stringlerinde "Türkiye" yanlışlıkla şehir başlığı olur.
const COUNTRY_NAMES = new Set(['türkiye', 'turkiye', 'turkey', 'tr']);

// maskAddressToArea "İlçe, İl" döner → city/district ayrıştır.
// Tek parça ise city olarak kullan, district boş kalır.
function splitMaskedAddress(masked: string): { city: string; district: string } {
  const parts = masked
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => !COUNTRY_NAMES.has(p.toLowerCase()));
  if (parts.length >= 2) {
    return { city: parts[parts.length - 1], district: parts.slice(0, -1).join(', ') };
  }
  if (parts.length === 1) {
    return { city: parts[0], district: '' };
  }
  return { city: masked, district: '' };
}

// Tarih: preferredDate varsa onu (gün farkıyla), yoksa createdAt'i kısa Türkçe.
function formatJobDate(
  preferredDate: string | undefined,
  createdAt: Date | undefined,
): { label: string; sub?: string; color: string } | null {
  if (preferredDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(preferredDate);
    if (!isNaN(target.getTime())) {
      target.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const label = target.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
      let sub = '';
      let color: string = colors.neutral[500];
      if (diffDays < 0) {
        sub = `${Math.abs(diffDays)} gün önce`;
        color = colors.danger[600];
      } else if (diffDays === 0) {
        sub = 'Bugün';
        color = colors.success[600];
      } else if (diffDays === 1) {
        sub = 'Yarın';
        color = colors.warning[600];
      } else if (diffDays <= 7) {
        sub = `${diffDays} gün sonra`;
        color = colors.info[600];
      } else {
        sub = `${diffDays} gün sonra`;
      }
      return { label, sub, color };
    }
  }
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      return {
        label: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        color: colors.neutral[500],
      };
    }
  }
  return null;
}

export default function OrderCard({ item, onPress }: Props) {
  const { isDarkMode, appColors } = useAppTheme();
  const currentLocation = useDriverStore((s) => s.currentLocation);

  const shouldShowFullAddress = item.status === 'in_progress' || item.status === 'completed';
  const fromMasked = shouldShowFullAddress
    ? (item.from.address || 'Adres belirtilmemiş')
    : maskAddressToArea(item.from.address);
  const toMasked = shouldShowFullAddress
    ? (item.to.address || 'Adres belirtilmemiş')
    : maskAddressToArea(item.to.address);
  // Lat/lng ile karşılaştırma — maskeli adres aynı ilçede olsa bile gerçek
  // koordinatlar farklı olabilir (nakliye: aynı il, farklı mahalleler).
  // Vinç/yol yardımı backend tarafında pickup=dropoff aynı yazıldığı için burada eşit çıkar.
  const sameLocation =
    typeof item.from.lat === 'number' &&
    typeof item.to.lat === 'number' &&
    item.from.lat === item.to.lat &&
    item.from.lng === item.to.lng;

  const fromSplit = splitMaskedAddress(fromMasked);
  const toSplit = splitMaskedAddress(toMasked);

  // Randevulu iş: tarih şeritte gösterilir, alttaki tarih rozeti tekrar etmez
  const schedule = item.schedule?.isScheduled ? item.schedule : null;
  const scheduleState = schedule ? getScheduleState(schedule) : null;
  const scheduleTint = tint(SCHEDULE_TINT[scheduleState?.state ?? 'upcoming']);
  const statusLabel =
    schedule && !schedule.departedAt && item.status === 'in_progress' ? 'Randevu Bekliyor' : STATUS_TEXT[item.status];
  const dateInfo = schedule ? null : formatJobDate(item.preferredDate, item.createdAt);
  const showDistance = typeof item.distance === 'number' && item.distance > 0;
  const showPrice = typeof item.estimatedPrice === 'number' && item.estimatedPrice > 0;
  const serviceIcon = SERVICE_ICON[item.serviceType] || 'car';
  const serviceLabel = SERVICE_LABEL[item.serviceType] || 'Hizmet';

  // Sürücünün anlık konumundan müşterinin pickup noktasına haversine mesafesi.
  // currentLocation null veya from koordinatları yoksa null döner; null'da satır gizlenir.
  const distanceToCustomer =
    currentLocation &&
    typeof item.from.lat === 'number' &&
    typeof item.from.lng === 'number'
      ? calculateDistance(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
          item.from.lat,
          item.from.lng,
        )
      : null;
  // in_progress / completed durumda zaten sürücü yolda — bilgi anlamsızlaşır.
  const showDistanceToCustomer =
    distanceToCustomer !== null &&
    (item.status === 'pending' ||
      item.status === 'awaiting_approval' ||
      item.status === 'awaiting_payment');

  const labelColor = appColors.text.secondary;
  const valueColor = appColors.text.primary;
  const subtleBg = isDarkMode ? '#1f2a29' : colors.neutral[50];
  const dividerColor = isDarkMode ? '#2a3a38' : colors.neutral[100];

  const renderPlace = (place: { city: string; district: string }, dotColor: string, fullText?: string) => (
    <View style={styles.placeRow}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={styles.placeText}>
        {fullText !== undefined ? (
          <Text style={[styles.fullAddress, { color: valueColor }]} numberOfLines={2}>
            {fullText}
          </Text>
        ) : (
          <>
            <Text style={[styles.city, { color: valueColor }]} numberOfLines={1}>
              {place.city}
            </Text>
            {!!place.district && (
              <Text style={[styles.district, { color: labelColor }]} numberOfLines={1}>
                {place.district}
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );

  return (
    <FkCard rounded="xl" elevation="md" style={styles.card} onPress={onPress}>
      {/* Başlık: servis ikonu + adı, talep no, durum */}
      <View style={styles.header}>
        <FkIconChip icon={serviceIcon} size={44} />
        <View style={styles.headerText}>
          <Text style={[styles.serviceTitle, { color: valueColor }]} numberOfLines={1}>
            {serviceLabel}
          </Text>
          <Text style={[styles.caption, { color: labelColor }]}>
            #{item.id.toString().slice(-2).padStart(2, '0')}
          </Text>
        </View>
        <FkStatusBadge status={item.status} label={statusLabel} size="sm" />
      </View>

      {/* Randevulu talep: tarih/aralık + Bugün / Yarın / Gecikti */}
      {schedule && (
        <View style={[styles.scheduleStrip, { backgroundColor: scheduleTint.bg, borderColor: scheduleTint.border }]}>
          <MaterialCommunityIcons name="calendar-clock" size={16} color={scheduleTint.icon} />
          <Text style={[styles.scheduleText, { color: scheduleTint.text }]} numberOfLines={1}>
            <Text style={styles.scheduleLabel}>Randevulu</Text>
            {`  ${formatSchedule(schedule)}`}
          </Text>
          {scheduleState ? (
            <Text style={[styles.scheduleState, { color: scheduleTint.text }]}>{scheduleState.label}</Text>
          ) : null}
        </View>
      )}

      {/* Konum: alış (yeşil) → bırakış (kırmızı) zaman çizelgesi */}
      <View style={styles.route}>
        {shouldShowFullAddress ? (
          <>
            {renderPlace(fromSplit, colors.success[500], fromMasked)}
            {!sameLocation && (
              <>
                <View style={[styles.connector, { backgroundColor: dividerColor }]} />
                {renderPlace(toSplit, colors.danger[500], toMasked)}
              </>
            )}
          </>
        ) : sameLocation ? (
          renderPlace(fromSplit, colors.primary[500])
        ) : (
          <>
            {renderPlace(fromSplit, colors.success[500])}
            <View style={[styles.connector, { backgroundColor: dividerColor }]} />
            {renderPlace(toSplit, colors.danger[500])}
          </>
        )}
      </View>

      {/* Ek bilgiler: araç tipi · mesafe · tarih */}
      <View style={styles.metaRow}>
        <View style={[styles.meta, { backgroundColor: subtleBg }]}>
          <MaterialCommunityIcons name="car-cog" size={14} color={labelColor} />
          <Text style={[styles.metaText, { color: valueColor }]} numberOfLines={1}>
            {item.vehicleType || 'Belirtilmemiş'}
          </Text>
        </View>
        {showDistance && (
          <View style={[styles.meta, { backgroundColor: subtleBg }]}>
            <MaterialCommunityIcons name="map-marker-distance" size={14} color={labelColor} />
            <Text style={[styles.metaText, { color: valueColor }]}>{item.distance} km</Text>
          </View>
        )}
        {dateInfo && (
          <View style={[styles.meta, { backgroundColor: subtleBg }]}>
            <MaterialCommunityIcons name="calendar-outline" size={14} color={labelColor} />
            <Text style={[styles.metaText, { color: valueColor }]} numberOfLines={1}>
              {dateInfo.label}
              {!!dateInfo.sub && <Text style={{ color: dateInfo.color }}>{` · ${dateInfo.sub}`}</Text>}
            </Text>
          </View>
        )}
      </View>

      {/* Müşteriye uzaklık (sürücünün konumu → pickup noktası) */}
      {showDistanceToCustomer && (
        <View
          style={[
            styles.distanceBanner,
            {
              backgroundColor: isDarkMode ? '#0d2624' : colors.primary[50],
              borderColor: isDarkMode ? colors.primary[700] : colors.primary[200],
            },
          ]}
        >
          <MaterialCommunityIcons name="map-marker-radius" size={16} color={colors.primary[500]} />
          <Text style={[styles.distanceText, { color: isDarkMode ? valueColor : colors.primary[700] }]}>
            Müşteriye <Text style={styles.distanceValue}>{distanceToCustomer} km</Text> uzaktasınız
          </Text>
        </View>
      )}

      {/* Hizmete özgü detay (description) */}
      {!!item.description && (
        <View style={[styles.descriptionBox, { backgroundColor: subtleBg }]}>
          <MaterialCommunityIcons name="information-outline" size={14} color={labelColor} />
          <Text style={[styles.descriptionText, { color: labelColor }]} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      )}

      {/* Alt satır: tahmini fiyat + CTA */}
      <View style={[styles.footer, { borderTopColor: dividerColor }]}>
        {showPrice ? (
          <View style={styles.priceBlock}>
            <Text style={[styles.priceLabel, { color: labelColor }]}>Tahmini Fiyat</Text>
            <Text style={[styles.price, { color: isDarkMode ? colors.primary[300] : colors.primary[600] }]}>
              ₺{Number(item.estimatedPrice).toLocaleString('tr-TR')}
            </Text>
          </View>
        ) : (
          <View style={styles.priceBlock} />
        )}
        <FkButton onPress={onPress} icon="chevron-right" iconPosition="right" style={styles.cta}>
          Talebi Gör
        </FkButton>
      </View>
    </FkCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.sm,
    marginHorizontal: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  scheduleStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm + 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  scheduleText: {
    flex: 1,
    fontSize: 13,
  },
  scheduleLabel: {
    fontWeight: '700',
  },
  scheduleState: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
  },
  serviceTitle: {
    ...text.cardTitle,
  },
  caption: {
    ...text.caption,
    marginTop: 2,
  },
  route: {
    marginTop: spacing.md,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  placeText: {
    flex: 1,
  },
  connector: {
    width: 2,
    height: 14,
    marginLeft: 5,
    marginVertical: 3,
  },
  city: {
    fontSize: 15,
    fontWeight: '600',
  },
  district: {
    ...text.meta,
    marginTop: 1,
  },
  fullAddress: {
    ...text.body,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    maxWidth: '100%',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  distanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
    gap: 8,
  },
  distanceText: {
    fontSize: 13,
    flex: 1,
  },
  distanceValue: {
    fontWeight: '700',
  },
  descriptionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: radius.md,
    marginTop: spacing.sm + 4,
    gap: 6,
  },
  descriptionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  priceBlock: {
    flex: 1,
  },
  priceLabel: {
    ...text.caption,
  },
  price: {
    ...text.price,
    marginTop: 2,
  },
  cta: {
    paddingHorizontal: 18,
  },
});
