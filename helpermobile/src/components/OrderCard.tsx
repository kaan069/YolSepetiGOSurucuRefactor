import React from 'react';
import { Card, Text, Button } from 'react-native-paper';
import { OrdersJob } from '../screens/orders/types';
import { View, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../hooks/useAppTheme';
import { maskAddressToArea } from '../utils/addressMask';
import type { ServiceGroup } from '../constants/serviceTypes';
import type { OrderStatus } from '../lib/types';

const PRIMARY_TEAL = '#26a69a';

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

function getServiceIcon(serviceType: ServiceGroup): string {
  switch (serviceType) {
    case 'towTruck':
      return 'tow-truck';
    case 'crane':
      return 'crane';
    case 'roadAssistance':
      return 'car-wrench';
    case 'nakliye':
    case 'homeToHomeMoving':
    case 'cityToCity':
      return 'truck-delivery';
    case 'transfer':
      return 'bus';
    default:
      return 'car';
  }
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
      let color = '#666';
      if (diffDays < 0) {
        sub = `${Math.abs(diffDays)} gün önce`;
        color = '#f44336';
      } else if (diffDays === 0) {
        sub = 'Bugün';
        color = '#4CAF50';
      } else if (diffDays === 1) {
        sub = 'Yarın';
        color = '#FF9800';
      } else if (diffDays <= 7) {
        sub = `${diffDays} gün sonra`;
        color = '#2196F3';
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
        color: '#666',
      };
    }
  }
  return null;
}

function getStatusInfo(status: OrderStatus, isDarkMode: boolean) {
  switch (status) {
    case 'pending':
      return {
        color: '#FF9800',
        bgColor: isDarkMode ? '#3e2e00' : '#FFF3E0',
        icon: 'clock-outline',
        text: 'Gelen İş',
      };
    case 'awaiting_approval':
      return {
        color: '#2196F3',
        bgColor: isDarkMode ? '#0d2137' : '#E3F2FD',
        icon: 'account-clock-outline',
        text: 'Onay Bekliyor',
      };
    case 'awaiting_payment':
      return {
        color: '#9C27B0',
        bgColor: isDarkMode ? '#2d1033' : '#F3E5F5',
        icon: 'credit-card-clock-outline',
        text: 'Ödeme Bekleniyor',
      };
    case 'in_progress':
      return {
        color: '#4CAF50',
        bgColor: isDarkMode ? '#1b3a1b' : '#E8F5E9',
        icon: 'truck-fast-outline',
        text: 'Devam Ediyor',
      };
    case 'completed':
      return {
        color: '#4CAF50',
        bgColor: isDarkMode ? '#1b3a1b' : '#E8F5E9',
        icon: 'check-circle-outline',
        text: 'Tamamlandı',
      };
    default:
      return {
        color: '#757575',
        bgColor: isDarkMode ? '#333' : '#F5F5F5',
        icon: 'information-outline',
        text: status,
      };
  }
}

export default function OrderCard({ item, onPress }: Props) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();

  const shouldShowFullAddress = item.status === 'in_progress' || item.status === 'completed';
  const fromMasked = shouldShowFullAddress
    ? (item.from.address || 'Adres belirtilmemiş')
    : maskAddressToArea(item.from.address);
  const toMasked = shouldShowFullAddress
    ? (item.to.address || 'Adres belirtilmemiş')
    : maskAddressToArea(item.to.address);
  const sameLocation = fromMasked === toMasked;

  const fromSplit = splitMaskedAddress(fromMasked);
  const toSplit = splitMaskedAddress(toMasked);

  const statusInfo = getStatusInfo(item.status, isDarkMode);
  const dateInfo = formatJobDate(item.preferredDate, item.createdAt);
  const showDistance = typeof item.distance === 'number' && item.distance > 0;
  const showPrice = typeof item.estimatedPrice === 'number' && item.estimatedPrice > 0;
  const serviceIcon = getServiceIcon(item.serviceType);

  const subtleBg = isDarkMode ? '#1f2a29' : '#F5F8F8';
  const dividerColor = isDarkMode ? '#2a3a38' : '#E5EEED';
  const labelColor = appColors.text.secondary;
  const valueColor = appColors.text.primary;

  return (
    <Card style={[styles.card, { backgroundColor: cardBg }]} elevation={2}>
      <Card.Content style={styles.content}>
        {/* Status pill - sağ üst */}
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
          <MaterialCommunityIcons name={statusInfo.icon as any} size={14} color={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
        </View>

        {/* Talep ID küçük caption */}
        <Text style={[styles.jobIdCaption, { color: labelColor }]}>
          #{item.id.toString().slice(-2).padStart(2, '0')}
        </Text>

        {/* Konum bloğu - From → To */}
        <View style={styles.locationBlock}>
          {shouldShowFullAddress ? (
            // in_progress / completed: tam adres tek/iki satır
            <View style={styles.fullAddressBlock}>
              <View style={styles.locationRow}>
                <MaterialCommunityIcons name={serviceIcon as any} size={20} color={PRIMARY_TEAL} />
                <Text
                  variant="bodyMedium"
                  style={[styles.fullAddressText, { color: valueColor }]}
                  numberOfLines={2}
                >
                  {fromMasked}
                </Text>
              </View>
              {!sameLocation && (
                <View style={styles.locationRow}>
                  <MaterialCommunityIcons name="map-marker-check" size={20} color="#FF5722" />
                  <Text
                    variant="bodyMedium"
                    style={[styles.fullAddressText, { color: valueColor }]}
                    numberOfLines={2}
                  >
                    {toMasked}
                  </Text>
                </View>
              )}
            </View>
          ) : sameLocation ? (
            // Tek lokasyon (vinç, yol yardımı): merkez
            <View style={styles.singleLocation}>
              <MaterialCommunityIcons name={serviceIcon as any} size={22} color={PRIMARY_TEAL} />
              <View style={styles.singleLocationText}>
                <Text style={[styles.cityText, { color: valueColor }]} numberOfLines={1}>
                  {fromSplit.city}
                </Text>
                {!!fromSplit.district && (
                  <Text style={[styles.districtText, { color: labelColor }]} numberOfLines={1}>
                    {fromSplit.district}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            // From → To: city/district split, ortada ok
            <View style={styles.fromToRow}>
              <View style={styles.locationSide}>
                <MaterialCommunityIcons name={serviceIcon as any} size={20} color={PRIMARY_TEAL} />
                <View style={styles.locationSideText}>
                  <Text style={[styles.cityText, { color: valueColor }]} numberOfLines={1}>
                    {fromSplit.city}
                  </Text>
                  {!!fromSplit.district && (
                    <Text style={[styles.districtText, { color: labelColor }]} numberOfLines={1}>
                      {fromSplit.district}
                    </Text>
                  )}
                </View>
              </View>
              <MaterialCommunityIcons
                name="arrow-right"
                size={18}
                color={labelColor}
                style={styles.arrow}
              />
              <View style={[styles.locationSide, styles.locationSideRight]}>
                <View style={[styles.locationSideText, styles.locationSideTextRight]}>
                  <Text
                    style={[styles.cityText, { color: valueColor, textAlign: 'right' }]}
                    numberOfLines={1}
                  >
                    {toSplit.city}
                  </Text>
                  {!!toSplit.district && (
                    <Text
                      style={[styles.districtText, { color: labelColor, textAlign: 'right' }]}
                      numberOfLines={1}
                    >
                      {toSplit.district}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Info grid: Hizmet · Mesafe · Tarih */}
        <View style={[styles.infoGrid, { borderTopColor: dividerColor, borderBottomColor: dividerColor }]}>
          <View style={styles.infoCell}>
            <View style={styles.infoCellHeader}>
              <MaterialCommunityIcons name="car-cog" size={14} color={labelColor} />
              <Text style={[styles.infoLabel, { color: labelColor }]}>Hizmet</Text>
            </View>
            <Text style={[styles.infoValue, { color: valueColor }]} numberOfLines={1}>
              {item.vehicleType || 'Belirtilmemiş'}
            </Text>
          </View>

          {showDistance && (
            <>
              <View style={[styles.infoDivider, { backgroundColor: dividerColor }]} />
              <View style={styles.infoCell}>
                <View style={styles.infoCellHeader}>
                  <MaterialCommunityIcons name="map-marker-distance" size={14} color={labelColor} />
                  <Text style={[styles.infoLabel, { color: labelColor }]}>Mesafe</Text>
                </View>
                <Text style={[styles.infoValue, { color: valueColor }]}>{item.distance} km</Text>
              </View>
            </>
          )}

          {dateInfo && (
            <>
              <View style={[styles.infoDivider, { backgroundColor: dividerColor }]} />
              <View style={styles.infoCell}>
                <View style={styles.infoCellHeader}>
                  <MaterialCommunityIcons name="calendar" size={14} color={labelColor} />
                  <Text style={[styles.infoLabel, { color: labelColor }]}>Tarih</Text>
                </View>
                <Text style={[styles.infoValue, { color: valueColor }]} numberOfLines={1}>
                  {dateInfo.label}
                </Text>
                {!!dateInfo.sub && (
                  <Text style={[styles.infoSub, { color: dateInfo.color }]} numberOfLines={1}>
                    {dateInfo.sub}
                  </Text>
                )}
              </View>
            </>
          )}
        </View>

        {/* Fiyat satırı */}
        {showPrice && (
          <View style={[styles.priceRow, { backgroundColor: subtleBg }]}>
            <MaterialCommunityIcons name="cash-multiple" size={16} color={PRIMARY_TEAL} />
            <Text style={[styles.priceLabel, { color: labelColor }]}>Tahmini Fiyat</Text>
            <Text style={[styles.priceValue, { color: valueColor }]}>
              ₺{Number(item.estimatedPrice).toLocaleString('tr-TR')}
            </Text>
          </View>
        )}

        {/* Hizmete özgü detay banner (description) */}
        {!!item.description && (
          <View style={[styles.descriptionBanner, { backgroundColor: subtleBg }]}>
            <MaterialCommunityIcons name="information-outline" size={14} color={labelColor} />
            <Text
              variant="bodySmall"
              style={[styles.descriptionText, { color: appColors.text.secondary }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          </View>
        )}

        {/* CTA Button - "Talebi Gör" full-width turkuaz */}
        <Button
          mode="contained"
          buttonColor={PRIMARY_TEAL}
          textColor="#fff"
          onPress={onPress}
          style={styles.ctaButton}
          contentStyle={styles.ctaButtonContent}
          labelStyle={styles.ctaButtonLabel}
        >
          Talebi Gör
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 4,
    borderRadius: 14,
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  jobIdCaption: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 12,
    opacity: 0.7,
  },
  locationBlock: {
    marginBottom: 14,
  },
  fullAddressBlock: {
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fullAddressText: {
    flex: 1,
    lineHeight: 20,
  },
  singleLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  singleLocationText: {
    flex: 1,
  },
  fromToRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationSideRight: {
    justifyContent: 'flex-end',
  },
  locationSideText: {
    flex: 1,
  },
  locationSideTextRight: {
    alignItems: 'flex-end',
  },
  cityText: {
    fontSize: 16,
    fontWeight: '700',
  },
  districtText: {
    fontSize: 12,
    marginTop: 2,
  },
  arrow: {
    marginHorizontal: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 12,
    marginBottom: 12,
  },
  infoCell: {
    flex: 1,
    paddingHorizontal: 6,
  },
  infoCellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoSub: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  infoDivider: {
    width: 1,
    marginVertical: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  priceLabel: {
    fontSize: 12,
    flex: 1,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  descriptionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    gap: 6,
  },
  descriptionText: {
    flex: 1,
    lineHeight: 18,
  },
  ctaButton: {
    borderRadius: 10,
  },
  ctaButtonContent: {
    paddingVertical: 6,
  },
  ctaButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
