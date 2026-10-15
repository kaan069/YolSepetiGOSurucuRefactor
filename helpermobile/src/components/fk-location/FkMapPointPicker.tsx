import React, { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../hooks/useFkTokens';
import { useDriverStore } from '../../store/driverStore';
import { ensureForegroundPermission } from '../../utils/locationPermission';
import FkLabel from '../fk-ui/FkLabel';
import FkButton from '../fk-ui/FkButton';
import FkStickyFooter from '../fk-ui/FkStickyFooter';
import { fieldStyles, getFieldBoxStyle } from '../fk-form/fieldStyles';
import { colors, radius, shadows, spacing } from '../../theme/design';
import { logger } from '../../utils/logger';

export interface FkMapPoint {
  latitude: number;
  longitude: number;
}

interface Props {
  value: FkMapPoint | null;
  onChange: (next: FkMapPoint) => void;
  label?: string;
  helperText?: string;
  disabled?: boolean;
}

/** Konum bilinmiyorsa Türkiye geneli */
const TURKEY_REGION: Region = { latitude: 39.0, longitude: 35.0, latitudeDelta: 9, longitudeDelta: 9 };
const CLOSE_DELTA = 0.01;

/** Backend DecimalField(9, 6) için 6 ondalıklı metin */
export function toCoordString(n: number): string {
  return n.toFixed(6);
}

/** Profil yanıtındaki "40.991000" / sayı / null değerinden nokta */
export function parseMapPoint(lat: unknown, lng: unknown): FkMapPoint | null {
  const latitude = typeof lat === 'number' ? lat : parseFloat(String(lat ?? ''));
  const longitude = typeof lng === 'number' ? lng : parseFloat(String(lng ?? ''));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude === 0 && longitude === 0) return null;
  return { latitude, longitude };
}

/**
 * Haritadan tek nokta seçimi: alan + tam ekran harita. Harita kaydırılır, ortadaki
 * işaretçinin altındaki nokta seçilir.
 */
export default function FkMapPointPicker({
  value,
  onChange,
  label = 'Haritadaki Konum',
  helperText,
  disabled,
}: Props) {
  const { tokens, isDarkMode } = useFkTokens();
  const [open, setOpen] = useState(false);
  const [center, setCenter] = useState<FkMapPoint | null>(value);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<MapView>(null);

  const initialRegion = (): Region => {
    const known = value ?? (() => {
      const c = useDriverStore.getState().currentLocation?.coords;
      return c ? { latitude: c.latitude, longitude: c.longitude } : null;
    })();
    return known ? { ...known, latitudeDelta: CLOSE_DELTA, longitudeDelta: CLOSE_DELTA } : TURKEY_REGION;
  };

  const openPicker = () => {
    if (disabled) return;
    const region = initialRegion();
    setCenter({ latitude: region.latitude, longitude: region.longitude });
    setOpen(true);
  };

  const goToMyLocation = async () => {
    setLocating(true);
    try {
      if (!(await ensureForegroundPermission())) return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      mapRef.current?.animateToRegion(
        {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: CLOSE_DELTA,
          longitudeDelta: CLOSE_DELTA,
        },
        400,
      );
    } catch (error) {
      logger.error('location', 'FkMapPointPicker.myLocation failed');
    } finally {
      setLocating(false);
    }
  };

  const confirm = () => {
    if (center) onChange(center);
    setOpen(false);
  };

  return (
    <View style={fieldStyles.container}>
      <FkLabel disabled={disabled}>{label}</FkLabel>
      <Pressable
        onPress={openPicker}
        disabled={disabled}
        style={[fieldStyles.box, styles.trigger, getFieldBoxStyle(tokens.colors, isDarkMode, { disabled })]}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons
          name={value ? 'map-marker-check' : 'map-marker-plus-outline'}
          size={20}
          color={value ? colors.success[500] : colors.neutral[400]}
        />
        <View style={styles.triggerText}>
          <Text style={[styles.triggerTitle, { color: value ? tokens.colors.textPrimary : colors.neutral[400] }]}>
            {value ? 'Konum işaretlendi' : 'Haritadan konum seçin'}
          </Text>
          {value ? (
            <Text style={[styles.coords, { color: tokens.colors.textSecondary }]}>
              {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.action, { color: colors.primary[600] }]}>{value ? 'Değiştir' : 'Seç'}</Text>
      </Pressable>
      {helperText ? (
        <Text style={[styles.helper, { color: tokens.colors.textSecondary }]}>{helperText}</Text>
      ) : null}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={[styles.modal, { backgroundColor: tokens.colors.cardBg }]} edges={['top', 'bottom']}>
          <View style={[styles.header, { borderBottomColor: tokens.colors.border }]}>
            <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10} accessibilityLabel="Kapat">
              <MaterialCommunityIcons name="close" size={24} color={tokens.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: tokens.colors.textPrimary }]}>{label}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.mapWrap}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              initialRegion={initialRegion()}
              showsUserLocation
              onRegionChangeComplete={(r) => setCenter({ latitude: r.latitude, longitude: r.longitude })}
            />
            {/* Ortadaki işaretçi: ucu harita merkezinde */}
            <View pointerEvents="none" style={styles.pinWrap}>
              <MaterialCommunityIcons name="map-marker" size={48} color={colors.danger[500]} style={styles.pin} />
            </View>
            <View pointerEvents="none" style={[styles.hint, shadows.sm]}>
              <Text style={styles.hintText}>Haritayı kaydırarak işaretçiyi iş yerinize getirin</Text>
            </View>
            <TouchableOpacity
              style={[styles.myLocation, shadows.md, { backgroundColor: tokens.colors.cardBg }]}
              onPress={goToMyLocation}
              disabled={locating}
              accessibilityLabel="Konumuma git"
            >
              <MaterialCommunityIcons
                name={locating ? 'timer-sand' : 'crosshairs-gps'}
                size={24}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
          </View>

          <FkStickyFooter safeArea={false}>
            <FkButton icon="check" size="lg" fullWidth onPress={confirm} disabled={!center}>
              Bu Konumu Kullan
            </FkButton>
          </FkStickyFooter>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    gap: spacing.sm + 4,
    paddingVertical: spacing.sm,
  },
  triggerText: { flex: 1 },
  triggerTitle: { fontSize: 15 },
  coords: { fontSize: 12, marginTop: 2, fontVariant: ['tabular-nums'] },
  action: { fontSize: 14, fontWeight: '600' },
  helper: { fontSize: 12, marginTop: spacing.xs, lineHeight: 17 },
  modal: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  headerSpacer: { width: 24 },
  mapWrap: { flex: 1 },
  pinWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // İkonun alt ucu merkeze gelsin
  pin: { marginBottom: 48 },
  hint: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
  },
  hintText: { fontSize: 13, color: colors.neutral[700] },
  myLocation: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
