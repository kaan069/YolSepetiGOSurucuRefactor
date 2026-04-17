import React, { useEffect, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    ScrollView,
    View,
    Linking,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { RootStackParamList } from '../../navigation';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useResponsive } from '../../hooks/useResponsive';
import { useLocationWebSocket } from '../../hooks/useLocationWebSocket';
import { useEmployeePanelStore } from '../../store/useEmployeePanelStore';
import { AppBar } from '../../components/common';
import PhotosSection from '../../components/PhotosSection';
import VehicleStatusSection from '../towTruckOffer/components/VehicleStatusSection';

type Props = NativeStackScreenProps<RootStackParamList, 'EmployeeJobDetail'>;

// ─── Config maps ─────────────────────────────────────────────────────────────

const serviceTypeConfig: Record<string, { label: string; icon: string }> = {
    towTruck: { label: 'Çekici', icon: 'tow-truck' },
    crane: { label: 'Vinç', icon: 'crane' },
    home_moving: { label: 'Evden Eve Nakliye', icon: 'home-group' },
    city_moving: { label: 'Şehirlerarası Nakliye', icon: 'truck' },
    road_assistance: { label: 'Yol Yardım', icon: 'car-wrench' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
    in_progress: { label: 'Devam Ediyor', color: '#2196F3' },
    pending: { label: 'Bekliyor', color: '#FF9800' },
    completed: { label: 'Tamamlandı', color: '#4CAF50' },
    cancelled: { label: 'İptal', color: '#EF4444' },
};

const PRIMARY = '#26a69a';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(isoString: string): string {
    try {
        const date = new Date(isoString);
        return date.toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return isoString;
    }
}

function openNavigation(lat: number, lng: number): void {
    const url = Platform.select({
        ios: `maps://app?daddr=${lat},${lng}`,
        android: `google.navigation:q=${lat},${lng}`,
    });
    if (url) {
        Linking.openURL(url).catch(() =>
            Alert.alert('Hata', 'Navigasyon uygulaması açılamadı.')
        );
    }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface InfoRowProps {
    icon: string;
    label: string;
    value: string;
    iconColor?: string;
}

function InfoRow({ icon, label, value, iconColor = PRIMARY }: InfoRowProps) {
    return (
        <View style={styles.infoRow}>
            <MaterialCommunityIcons
                name={icon}
                size={20}
                color={iconColor}
                style={styles.infoIcon}
            />
            <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function EmployeeJobDetailScreen({ route, navigation }: Props) {
    const { requestId } = route.params;
    const { isDarkMode, appColors, screenBg, cardBg } = useAppTheme();
    const { spacing } = useResponsive();
    const { jobDetail, detailLoading, error, fetchJobDetail, clearJobDetail } =
        useEmployeePanelStore();

    // ── Fetch on mount, cleanup on unmount ──
    useEffect(() => {
        fetchJobDetail(requestId).catch((err) =>
            console.error('[EmployeeJobDetail] fetchJobDetail error:', err)
        );
        return () => {
            clearJobDetail();
        };
    }, [requestId]);

    // ── WebSocket location sharing ──
    // Auto-starts when job is in_progress. No toggle per API docs.
    const handleWsConnected = useCallback(() => {
        console.log('[EmployeeJobDetail] Employee location sharing started');
    }, []);

    const handleWsError = useCallback((err: any) => {
        console.error('[EmployeeJobDetail] Employee WebSocket error:', err);
    }, []);

    useLocationWebSocket({
        trackingToken: jobDetail?.tracking_token || null,
        enabled:
            !!jobDetail &&
            jobDetail.status === 'in_progress' &&
            !!jobDetail.tracking_token,
        onConnected: handleWsConnected,
        onError: handleWsError,
    });

    const handleRetry = useCallback(() => {
        fetchJobDetail(requestId).catch((err) =>
            console.error('[EmployeeJobDetail] retry error:', err)
        );
    }, [requestId]);

    // ── Derived display values ──
    const serviceInfo = jobDetail
        ? serviceTypeConfig[jobDetail.service_type] ?? {
              label: jobDetail.service_type,
              icon: 'briefcase-outline',
          }
        : null;

    const statusInfo = jobDetail
        ? statusConfig[jobDetail.status] ?? {
              label: jobDetail.status,
              color: '#9E9E9E',
          }
        : null;

    const loc = jobDetail?.location_info;
    const hasTwoPoints =
        loc &&
        (loc.pickup_address !== undefined || loc.dropoff_address !== undefined);

    // Araç durumu bilgileri (eleman fiyat görmediği için amount=0)
    const vehicleStatusSurcharges = useMemo(() => {
        return (jobDetail?.question_answers || []).map((qa: any) => ({
            question: qa.questionText || qa.question_text || qa.question || '',
            answer: qa.selectedOptionText || qa.selected_option_text || qa.answer || '',
            amount: 0,
        }));
    }, [jobDetail?.question_answers]);

    const isInProgress = jobDetail?.status === 'in_progress';
    const showCustomerCard =
        isInProgress && jobDetail?.customer_info !== null && !!jobDetail?.customer_info;

    // ────────────────────────────────────────────────────────────────────────

    // Loading state
    if (detailLoading) {
        return (
            <SafeAreaView
                style={[styles.container, styles.centered, { backgroundColor: screenBg }]}
                edges={['bottom']}
            >
                <AppBar title="İş Detayı" />
                <ActivityIndicator size="large" color={PRIMARY} style={styles.activityIndicator} />
                <Text style={[styles.loadingText, { color: appColors.text.secondary }]}>
                    Yükleniyor...
                </Text>
            </SafeAreaView>
        );
    }

    // Error state
    if (error && !jobDetail) {
        return (
            <SafeAreaView
                style={[styles.container, styles.centered, { backgroundColor: screenBg }]}
                edges={['bottom']}
            >
                <AppBar title="İş Detayı" />
                <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={56}
                    color="#EF4444"
                    style={styles.errorIcon}
                />
                <Text style={[styles.errorText, { color: appColors.text.primary }]}>
                    {error}
                </Text>
                <Button
                    mode="contained"
                    onPress={handleRetry}
                    buttonColor={PRIMARY}
                    style={styles.retryButton}
                    icon="refresh"
                >
                    Tekrar Dene
                </Button>
            </SafeAreaView>
        );
    }

    // No data state
    if (!jobDetail) {
        return (
            <SafeAreaView
                style={[styles.container, styles.centered, { backgroundColor: screenBg }]}
                edges={['bottom']}
            >
                <AppBar title="İş Detayı" />
                <Text style={{ color: appColors.text.secondary }}>
                    İş detayı bulunamadı.
                </Text>
                <Button
                    mode="outlined"
                    onPress={() => navigation.goBack()}
                    style={styles.retryButton}
                >
                    Geri Dön
                </Button>
            </SafeAreaView>
        );
    }

    // ── Render ──
    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: screenBg }]}
            edges={['bottom']}
        >
            <AppBar title="İş Detayı" />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Konum Paylaşımı Durumu ── */}
                <View
                    style={[
                        styles.locationStatusBar,
                        {
                            backgroundColor: isInProgress
                                ? 'rgba(38,166,154,0.12)'
                                : isDarkMode
                                ? 'rgba(255,255,255,0.06)'
                                : 'rgba(0,0,0,0.05)',
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.locationDot,
                            { backgroundColor: isInProgress ? '#4CAF50' : '#9E9E9E' },
                        ]}
                    />
                    <Text
                        style={[
                            styles.locationStatusText,
                            { color: isInProgress ? PRIMARY : appColors.text.secondary },
                        ]}
                    >
                        {isInProgress
                            ? 'Konum paylaşılıyor...'
                            : 'Konum paylaşımı aktif değil'}
                    </Text>
                </View>

                {/* ── İş Bilgileri Kartı ── */}
                <Card style={[styles.card, { backgroundColor: cardBg }]}>
                    <Card.Title
                        title="İş Bilgileri"
                        titleStyle={[styles.cardTitle, { color: appColors.text.primary }]}
                        left={() => (
                            <MaterialCommunityIcons
                                name="briefcase-outline"
                                size={24}
                                color={PRIMARY}
                            />
                        )}
                    />
                    <Card.Content style={styles.cardContent}>
                        {/* Service type */}
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons
                                name={serviceInfo?.icon ?? 'briefcase-outline'}
                                size={20}
                                color={PRIMARY}
                                style={styles.infoIcon}
                            />
                            <View style={styles.infoTextWrap}>
                                <Text style={styles.infoLabel}>Hizmet Türü</Text>
                                <Text
                                    style={[styles.infoValue, { color: appColors.text.primary }]}
                                >
                                    {serviceInfo?.label ?? jobDetail.service_type}
                                </Text>
                            </View>
                        </View>

                        {/* Status badge */}
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons
                                name="information-outline"
                                size={20}
                                color={statusInfo?.color ?? '#9E9E9E'}
                                style={styles.infoIcon}
                            />
                            <View style={styles.infoTextWrap}>
                                <Text style={styles.infoLabel}>Durum</Text>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: statusInfo?.color ?? '#9E9E9E' },
                                    ]}
                                >
                                    <Text style={styles.statusBadgeText}>
                                        {statusInfo?.label ?? jobDetail.status}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Vehicle plate */}
                        {jobDetail.vehicle_plate && (
                            <InfoRow
                                icon="car-info"
                                label="Araç Plakası"
                                value={jobDetail.vehicle_plate}
                                iconColor={PRIMARY}
                            />
                        )}

                        {/* Created at */}
                        <InfoRow
                            icon="calendar-plus"
                            label="Oluşturulma Tarihi"
                            value={formatDate(jobDetail.created_at)}
                            iconColor={PRIMARY}
                        />

                        {/* Updated at */}
                        <InfoRow
                            icon="calendar-edit"
                            label="Güncellenme Tarihi"
                            value={formatDate(jobDetail.updated_at)}
                            iconColor={PRIMARY}
                        />
                    </Card.Content>
                </Card>

                {/* ── Servis Detayları Kartı ── */}
                {jobDetail.service_details && Object.keys(jobDetail.service_details).length > 0 && (
                    <Card style={[styles.card, { backgroundColor: cardBg }]}>
                        <Card.Title
                            title={
                                jobDetail.service_type === 'towTruck' ? 'Araç Bilgileri' :
                                jobDetail.service_type === 'crane' ? 'Yük Detayları' :
                                jobDetail.service_type === 'roadAssistance' ? 'Arıza Detayları' :
                                jobDetail.service_type === 'homeToHomeMoving' ? 'Nakliye Detayları' :
                                jobDetail.service_type === 'cityToCity' ? 'Yük Detayları' :
                                'Detaylar'
                            }
                            titleStyle={[styles.cardTitle, { color: appColors.text.primary }]}
                            left={() => (
                                <MaterialCommunityIcons
                                    name={
                                        jobDetail.service_type === 'towTruck' ? 'car' :
                                        jobDetail.service_type === 'crane' ? 'crane' :
                                        jobDetail.service_type === 'roadAssistance' ? 'car-wrench' :
                                        jobDetail.service_type === 'homeToHomeMoving' ? 'home-group' :
                                        jobDetail.service_type === 'cityToCity' ? 'truck' :
                                        'clipboard-list-outline'
                                    }
                                    size={24}
                                    color={PRIMARY}
                                />
                            )}
                        />
                        <Card.Content style={styles.cardContent}>
                            {/* ─ Çekici ─ */}
                            {jobDetail.service_type === 'towTruck' && (
                                <>
                                    {!!jobDetail.service_details.vehicle_type && (
                                        <InfoRow icon="car-side" label="Araç Tipi" value={jobDetail.service_details.vehicle_type} />
                                    )}
                                    {!!jobDetail.service_details.estimated_km && (
                                        <InfoRow icon="map-marker-distance" label="Tahmini Mesafe" value={`${jobDetail.service_details.estimated_km.toFixed(1)} km`} />
                                    )}
                                </>
                            )}

                            {/* ─ Vinç ─ */}
                            {jobDetail.service_type === 'crane' && (
                                <>
                                    {!!jobDetail.service_details.load_type && (
                                        <InfoRow icon="package-variant" label="Yük Tipi" value={jobDetail.service_details.load_type} />
                                    )}
                                    {!!jobDetail.service_details.load_weight && (
                                        <InfoRow icon="weight-kilogram" label="Yük Ağırlığı" value={`${jobDetail.service_details.load_weight} kg`} />
                                    )}
                                    {!!jobDetail.service_details.lift_height && (
                                        <InfoRow icon="arrow-up-bold" label="Kaldırma Yüksekliği" value={`${jobDetail.service_details.lift_height} m`} />
                                    )}
                                    {jobDetail.service_details.floor !== undefined && jobDetail.service_details.floor > 0 && (
                                        <InfoRow icon="office-building" label="Kat" value={`${jobDetail.service_details.floor}. kat`} />
                                    )}
                                    {jobDetail.service_details.has_obstacles && (
                                        <InfoRow icon="alert-outline" label="Engel Durumu" value={jobDetail.service_details.obstacle_note || 'Engel var'} iconColor="#FF9800" />
                                    )}
                                    {!!jobDetail.service_details.estimated_duration_hours && (
                                        <InfoRow icon="clock-outline" label="Tahmini Süre" value={`${jobDetail.service_details.estimated_duration_hours} saat`} />
                                    )}
                                </>
                            )}

                            {/* ─ Yol Yardım ─ */}
                            {jobDetail.service_type === 'roadAssistance' && (
                                <>
                                    {!!jobDetail.service_details.vehicle_type && (
                                        <InfoRow icon="car-side" label="Araç Tipi" value={jobDetail.service_details.vehicle_type} />
                                    )}
                                    {jobDetail.service_details.problem_types && jobDetail.service_details.problem_types.length > 0 && (
                                        <InfoRow icon="wrench" label="Arıza Tipleri" value={jobDetail.service_details.problem_types.join(', ')} iconColor="#FF9800" />
                                    )}
                                    {!!jobDetail.service_details.problem_description && (
                                        <InfoRow icon="text-box-outline" label="Arıza Açıklaması" value={jobDetail.service_details.problem_description} />
                                    )}
                                    {!!jobDetail.service_details.additional_notes && (
                                        <InfoRow icon="note-text-outline" label="Ek Notlar" value={jobDetail.service_details.additional_notes} />
                                    )}
                                </>
                            )}

                            {/* ─ Ev Nakliye ─ */}
                            {jobDetail.service_type === 'homeToHomeMoving' && (
                                <>
                                    {!!jobDetail.service_details.home_type && (
                                        <InfoRow icon="home-outline" label="Ev Tipi" value={jobDetail.service_details.home_type} />
                                    )}
                                    {jobDetail.service_details.floor_from !== undefined && (
                                        <InfoRow
                                            icon="stairs-up"
                                            label="Kat Bilgisi"
                                            value={`${jobDetail.service_details.floor_from}. kat → ${jobDetail.service_details.floor_to}. kat`}
                                        />
                                    )}
                                    <InfoRow
                                        icon="elevator-passenger"
                                        label="Asansör"
                                        value={`Çıkış: ${jobDetail.service_details.has_elevator_from ? 'Var' : 'Yok'} / Varış: ${jobDetail.service_details.has_elevator_to ? 'Var' : 'Yok'}`}
                                    />
                                    {jobDetail.service_details.has_large_items && (
                                        <InfoRow icon="sofa-outline" label="Büyük Eşya" value={jobDetail.service_details.large_items_note || 'Var'} iconColor="#FF9800" />
                                    )}
                                    {jobDetail.service_details.has_fragile_items && (
                                        <InfoRow icon="glass-fragile" label="Kırılacak Eşya" value="Var" iconColor="#FF9800" />
                                    )}
                                    {jobDetail.service_details.needs_packing && (
                                        <InfoRow icon="package-variant-closed" label="Paketleme" value="İsteniyor" iconColor="#2196F3" />
                                    )}
                                    {jobDetail.service_details.needs_disassembly && (
                                        <InfoRow icon="hammer-screwdriver" label="Söküm/Montaj" value="İsteniyor" iconColor="#2196F3" />
                                    )}
                                    {!!jobDetail.service_details.preferred_date && (
                                        <InfoRow icon="calendar" label="Tercih Edilen Tarih" value={`${jobDetail.service_details.preferred_date}${jobDetail.service_details.preferred_time_slot ? ' - ' + jobDetail.service_details.preferred_time_slot : ''}`} />
                                    )}
                                    {!!jobDetail.service_details.additional_notes && (
                                        <InfoRow icon="note-text-outline" label="Ek Notlar" value={jobDetail.service_details.additional_notes} />
                                    )}
                                </>
                            )}

                            {/* ─ Şehirler Arası ─ */}
                            {jobDetail.service_type === 'cityToCity' && (
                                <>
                                    {!!jobDetail.service_details.load_type && (
                                        <InfoRow icon="package-variant" label="Yük Tipi" value={jobDetail.service_details.load_type} />
                                    )}
                                    {!!jobDetail.service_details.load_weight && (
                                        <InfoRow icon="weight-kilogram" label="Yük Ağırlığı" value={`${jobDetail.service_details.load_weight} kg`} />
                                    )}
                                    {(jobDetail.service_details.width || jobDetail.service_details.length || jobDetail.service_details.height) && (
                                        <InfoRow
                                            icon="cube-outline"
                                            label="Boyutlar"
                                            value={`${jobDetail.service_details.width || '-'} × ${jobDetail.service_details.length || '-'} × ${jobDetail.service_details.height || '-'} cm`}
                                        />
                                    )}
                                    {!!jobDetail.service_details.preferred_date && (
                                        <InfoRow icon="calendar" label="Tercih Edilen Tarih" value={`${jobDetail.service_details.preferred_date}${jobDetail.service_details.preferred_time_slot ? ' - ' + jobDetail.service_details.preferred_time_slot : ''}`} />
                                    )}
                                    {!!jobDetail.service_details.additional_notes && (
                                        <InfoRow icon="note-text-outline" label="Ek Notlar" value={jobDetail.service_details.additional_notes} />
                                    )}
                                </>
                            )}
                        </Card.Content>
                    </Card>
                )}

                {/* ── Konum Bilgileri Kartı ── */}
                <Card style={[styles.card, { backgroundColor: cardBg }]}>
                    <Card.Title
                        title="Konum Bilgileri"
                        titleStyle={[styles.cardTitle, { color: appColors.text.primary }]}
                        left={() => (
                            <MaterialCommunityIcons
                                name="map-marker-outline"
                                size={24}
                                color={PRIMARY}
                            />
                        )}
                    />
                    <Card.Content style={styles.cardContent}>
                        {hasTwoPoints ? (
                            <>
                                {loc?.pickup_address && (
                                    <>
                                        <InfoRow
                                            icon="map-marker-up"
                                            label="Alış Adresi"
                                            value={loc.pickup_address}
                                            iconColor="#FF9800"
                                        />
                                        {loc.pickup_lat !== undefined && loc.pickup_lng !== undefined && (
                                            <Button
                                                mode="contained"
                                                icon="navigation"
                                                buttonColor="#FF9800"
                                                style={styles.pickupNavButton}
                                                onPress={() =>
                                                    openNavigation(loc.pickup_lat!, loc.pickup_lng!)
                                                }
                                            >
                                                Alış Noktasına Git
                                            </Button>
                                        )}
                                    </>
                                )}
                                {loc?.dropoff_address && (
                                    <>
                                        <InfoRow
                                            icon="map-marker-down"
                                            label="Bırakış Adresi"
                                            value={loc.dropoff_address}
                                            iconColor="#4CAF50"
                                        />
                                        {loc.dropoff_lat !== undefined && loc.dropoff_lng !== undefined && (
                                            <Button
                                                mode="contained"
                                                icon="navigation"
                                                buttonColor="#4CAF50"
                                                style={styles.navButton}
                                                onPress={() =>
                                                    openNavigation(loc.dropoff_lat!, loc.dropoff_lng!)
                                                }
                                            >
                                                Bırakış Noktasına Git
                                            </Button>
                                        )}
                                    </>
                                )}
                            </>
                        ) : (
                            loc?.address && (
                                <>
                                    <InfoRow
                                        icon="map-marker"
                                        label="Adres"
                                        value={loc.address}
                                        iconColor={PRIMARY}
                                    />
                                    {loc.latitude !== undefined && loc.longitude !== undefined && (
                                        <Button
                                            mode="contained"
                                            icon="navigation"
                                            buttonColor={PRIMARY}
                                            style={styles.navButton}
                                            onPress={() =>
                                                openNavigation(loc.latitude!, loc.longitude!)
                                            }
                                        >
                                            Navigasyonu Başlat
                                        </Button>
                                    )}
                                </>
                            )
                        )}
                    </Card.Content>
                </Card>

                {/* ── Araç Durumu ── */}
                <VehicleStatusSection surcharges={vehicleStatusSurcharges} totalSurcharge={0} />

                {/* ── Fotoğraflar ── */}
                <PhotosSection photos={jobDetail.photos} />

                {/* ── Müşteri Bilgisi Kartı ── */}
                {showCustomerCard && jobDetail.customer_info && (
                    <Card style={[styles.card, { backgroundColor: cardBg }]}>
                        <Card.Title
                            title="Müşteri Bilgisi"
                            titleStyle={[styles.cardTitle, { color: appColors.text.primary }]}
                            left={() => (
                                <MaterialCommunityIcons
                                    name="account-outline"
                                    size={24}
                                    color={PRIMARY}
                                />
                            )}
                        />
                        <Card.Content style={styles.cardContent}>
                            <InfoRow
                                icon="account"
                                label="Müşteri Adı"
                                value={jobDetail.customer_info.name}
                                iconColor={PRIMARY}
                            />
                            <InfoRow
                                icon="phone"
                                label="Telefon"
                                value={jobDetail.customer_info.phone}
                                iconColor={PRIMARY}
                            />
                            <Button
                                mode="contained"
                                icon="phone"
                                buttonColor="#4CAF50"
                                style={styles.callButton}
                                onPress={() =>
                                    Linking.openURL(
                                        `tel:${jobDetail.customer_info!.phone}`
                                    ).catch(() =>
                                        Alert.alert('Hata', 'Arama başlatılamadı.')
                                    )
                                }
                            >
                                Ara
                            </Button>
                        </Card.Content>
                    </Card>
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityIndicator: {
        marginTop: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
    },
    errorIcon: {
        marginTop: 32,
        marginBottom: 12,
    },
    errorText: {
        fontSize: 15,
        textAlign: 'center',
        marginHorizontal: 32,
        marginBottom: 16,
    },
    retryButton: {
        marginTop: 8,
        minWidth: 160,
    },
    scrollContent: {
        paddingTop: 8,
        paddingBottom: 40,
        paddingHorizontal: 16,
    },
    // ── Location status bar ──
    locationStatusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 12,
    },
    locationDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    locationStatusText: {
        fontSize: 13,
        fontWeight: '500',
    },
    // ── Card ──
    card: {
        borderRadius: 16,
        marginBottom: 14,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    cardContent: {
        paddingTop: 4,
        paddingBottom: 8,
    },
    // ── Info row ──
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    infoIcon: {
        marginTop: 2,
        marginRight: 10,
    },
    infoTextWrap: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#9E9E9E',
        marginBottom: 2,
        fontWeight: '400',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        flexWrap: 'wrap',
    },
    // ── Status badge ──
    statusBadge: {
        alignSelf: 'flex-start',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginTop: 2,
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    // ── Buttons ──
    pickupNavButton: {
        marginTop: -4,
        marginBottom: 18,
        borderRadius: 10,
    },
    navButton: {
        marginTop: 6,
        borderRadius: 10,
    },
    callButton: {
        marginTop: 6,
        borderRadius: 10,
    },
    bottomSpacer: {
        height: 24,
    },
});
