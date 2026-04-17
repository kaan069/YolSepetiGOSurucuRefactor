import React, { useCallback, useState } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { RootStackParamList } from '../../navigation';
import { AppBar } from '../../components/common';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useResponsive } from '../../hooks/useResponsive';
import { useEmployeePanelStore } from '../../store/useEmployeePanelStore';

// ---------------------------------------------------------------------------
// Config maps
// ---------------------------------------------------------------------------

const serviceTypeLabels: Record<string, string> = {
    towTruck: 'Çekici',
    crane: 'Vinç',
    home_moving: 'Evden Eve Nakliye',
    city_moving: 'Şehirlerarası Nakliye',
    road_assistance: 'Yol Yardım',
};

const statusLabels: Record<string, string> = {
    in_progress: 'Devam Ediyor',
    pending: 'Bekliyor',
    completed: 'Tamamlandı',
};

const statusColors: Record<string, string> = {
    in_progress: '#2196F3',
    pending: '#FF9800',
    completed: '#4CAF50',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const PRIMARY = '#26a69a';

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function EmployeeDashboardScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { appColors, screenBg, cardBg, isDarkMode } = useAppTheme();
    const { spacing, moderateScale } = useResponsive();
    const { dashboard, loading, error, fetchDashboard } = useEmployeePanelStore();

    const [refreshing, setRefreshing] = useState(false);

    // Fetch dashboard whenever the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchDashboard().catch(() => {});
        }, [])
    );

    // Pull-to-refresh handler
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchDashboard();
        } catch {
            // silently ignore
        } finally {
            setRefreshing(false);
        }
    }, [fetchDashboard]);

    // Call employer phone
    const handleCallEmployer = useCallback((phone: string) => {
        Linking.openURL(`tel:${phone}`).catch(() => {});
    }, []);

    // Navigate to active job detail
    const handleActiveJobPress = useCallback(
        (requestId: number) => {
            navigation.navigate('EmployeeJobDetail', { requestId });
        },
        [navigation]
    );

    // ---------------------------------------------------------------------------
    // Full-screen loading state
    // ---------------------------------------------------------------------------

    if (loading && !dashboard) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
                <AppBar title="Ana Sayfa" showBackButton={false} />
                <View style={styles.centeredFill}>
                    <ActivityIndicator size="large" color={PRIMARY} />
                    <Text style={[styles.loadingText, { color: appColors.text.secondary, marginTop: spacing.md }]}>
                        Yükleniyor...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // ---------------------------------------------------------------------------
    // Error state
    // ---------------------------------------------------------------------------

    if (error && !dashboard) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
                <AppBar title="Ana Sayfa" showBackButton={false} />
                <View style={styles.centeredFill}>
                    <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={moderateScale(56)}
                        color={appColors.text.disabled}
                    />
                    <Text
                        variant="titleMedium"
                        style={[styles.errorTitle, { color: appColors.text.secondary, marginTop: spacing.md }]}
                    >
                        Bir hata oluştu
                    </Text>
                    <Text
                        variant="bodySmall"
                        style={[styles.errorSubtitle, { color: appColors.text.disabled, marginTop: spacing.xs }]}
                    >
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={() => fetchDashboard().catch(() => {})}
                        activeOpacity={0.75}
                        style={[styles.retryButton, { marginTop: spacing.lg }]}
                    >
                        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ---------------------------------------------------------------------------
    // Main render
    // ---------------------------------------------------------------------------

    const iconBg = isDarkMode ? '#1a3333' : '#e0f2f1';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
            <AppBar title="Ana Sayfa" showBackButton={false} />

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { padding: spacing.md, paddingBottom: spacing.xl }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[PRIMARY]}
                        tintColor={PRIMARY}
                    />
                }
            >
                {/* ------------------------------------------------------------------ */}
                {/* Greeting */}
                {/* ------------------------------------------------------------------ */}
                {dashboard?.employee_info && (
                    <View style={[styles.greetingRow, { marginBottom: spacing.md }]}>
                        <View
                            style={[
                                styles.avatarCircle,
                                { backgroundColor: iconBg },
                            ]}
                        >
                            <MaterialCommunityIcons
                                name="account-hard-hat"
                                size={moderateScale(28)}
                                color={PRIMARY}
                            />
                        </View>
                        <View style={styles.greetingTextContainer}>
                            <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                                Merhaba, {dashboard.employee_info.name}
                            </Text>
                            <Text variant="bodySmall" style={{ color: appColors.text.secondary }}>
                                {dashboard.employee_info.phone}
                            </Text>
                        </View>
                    </View>
                )}

                {/* ------------------------------------------------------------------ */}
                {/* Employer Info Card - İşveren bilgi kartı */}
                {/* ------------------------------------------------------------------ */}
                {dashboard?.employee_info && (
                    <Card
                        mode="elevated"
                        style={[styles.card, { backgroundColor: cardBg, marginBottom: spacing.md }]}
                        elevation={2}
                    >
                        <Card.Content style={styles.cardContent}>
                            {/* Section header */}
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconWrap, { backgroundColor: iconBg }]}>
                                    <MaterialCommunityIcons
                                        name="office-building"
                                        size={moderateScale(20)}
                                        color={PRIMARY}
                                    />
                                </View>
                                <Text variant="titleSmall" style={[styles.sectionTitle, { color: PRIMARY }]}>
                                    İşveren Bilgileri
                                </Text>
                            </View>

                            <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#e0e0e0' }]} />

                            {/* Employer name */}
                            <View style={styles.infoRow}>
                                <MaterialCommunityIcons
                                    name="account-tie"
                                    size={moderateScale(18)}
                                    color={appColors.text.secondary}
                                    style={styles.infoRowIcon}
                                />
                                <View style={styles.infoRowTextBlock}>
                                    <Text variant="labelSmall" style={{ color: appColors.text.disabled }}>
                                        İşveren Adı
                                    </Text>
                                    <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                                        {dashboard.employee_info.employer_name}
                                    </Text>
                                </View>
                            </View>

                            {/* Company name */}
                            <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
                                <MaterialCommunityIcons
                                    name="domain"
                                    size={moderateScale(18)}
                                    color={appColors.text.secondary}
                                    style={styles.infoRowIcon}
                                />
                                <View style={styles.infoRowTextBlock}>
                                    <Text variant="labelSmall" style={{ color: appColors.text.disabled }}>
                                        Şirket
                                    </Text>
                                    <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                                        {dashboard.employee_info.company_name}
                                    </Text>
                                </View>
                            </View>

                            {/* Employer phone - tappable */}
                            <TouchableOpacity
                                onPress={() => handleCallEmployer(dashboard.employee_info.employer_phone)}
                                activeOpacity={0.7}
                                style={[styles.infoRow, { marginTop: spacing.sm }]}
                            >
                                <MaterialCommunityIcons
                                    name="phone-outline"
                                    size={moderateScale(18)}
                                    color={PRIMARY}
                                    style={styles.infoRowIcon}
                                />
                                <View style={styles.infoRowTextBlock}>
                                    <Text variant="labelSmall" style={{ color: appColors.text.disabled }}>
                                        Telefon
                                    </Text>
                                    <Text variant="bodyMedium" style={{ fontWeight: '600', color: PRIMARY }}>
                                        {dashboard.employee_info.employer_phone}
                                    </Text>
                                </View>
                                <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={moderateScale(20)}
                                    color={PRIMARY}
                                />
                            </TouchableOpacity>
                        </Card.Content>
                    </Card>
                )}

                {/* ------------------------------------------------------------------ */}
                {/* Active Job Card - Aktif iş kartı */}
                {/* ------------------------------------------------------------------ */}
                <Card
                    mode="elevated"
                    style={[styles.card, { backgroundColor: cardBg, marginBottom: spacing.md }]}
                    elevation={2}
                >
                    <Card.Content style={styles.cardContent}>
                        {/* Section header */}
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIconWrap, { backgroundColor: iconBg }]}>
                                <MaterialCommunityIcons
                                    name="briefcase-clock-outline"
                                    size={moderateScale(20)}
                                    color={PRIMARY}
                                />
                            </View>
                            <Text variant="titleSmall" style={[styles.sectionTitle, { color: PRIMARY }]}>
                                Aktif İş
                            </Text>
                        </View>

                        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#e0e0e0' }]} />

                        {dashboard?.active_job ? (
                            <TouchableOpacity
                                onPress={() => handleActiveJobPress(dashboard.active_job!.request_id)}
                                activeOpacity={0.75}
                            >
                                {/* Service type */}
                                <View style={styles.infoRow}>
                                    <MaterialCommunityIcons
                                        name="briefcase-outline"
                                        size={moderateScale(18)}
                                        color={appColors.text.secondary}
                                        style={styles.infoRowIcon}
                                    />
                                    <View style={styles.infoRowTextBlock}>
                                        <Text variant="labelSmall" style={{ color: appColors.text.disabled }}>
                                            Hizmet Türü
                                        </Text>
                                        <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                                            {serviceTypeLabels[dashboard.active_job.service_type] ?? dashboard.active_job.service_type}
                                        </Text>
                                    </View>
                                </View>

                                {/* Status */}
                                <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
                                    <MaterialCommunityIcons
                                        name="tag-outline"
                                        size={moderateScale(18)}
                                        color={appColors.text.secondary}
                                        style={styles.infoRowIcon}
                                    />
                                    <View style={styles.infoRowTextBlock}>
                                        <Text variant="labelSmall" style={{ color: appColors.text.disabled }}>
                                            Durum
                                        </Text>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                {
                                                    backgroundColor:
                                                        (statusColors[dashboard.active_job.status] ?? '#9E9E9E') + '22',
                                                },
                                            ]}
                                        >
                                            <Text
                                                variant="labelSmall"
                                                style={{
                                                    color: statusColors[dashboard.active_job.status] ?? '#9E9E9E',
                                                    fontWeight: '700',
                                                }}
                                            >
                                                {statusLabels[dashboard.active_job.status] ?? dashboard.active_job.status}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Created at */}
                                <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
                                    <MaterialCommunityIcons
                                        name="clock-outline"
                                        size={moderateScale(18)}
                                        color={appColors.text.secondary}
                                        style={styles.infoRowIcon}
                                    />
                                    <View style={styles.infoRowTextBlock}>
                                        <Text variant="labelSmall" style={{ color: appColors.text.disabled }}>
                                            Oluşturulma Tarihi
                                        </Text>
                                        <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                                            {formatDate(dashboard.active_job.created_at)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Tap hint */}
                                <View style={[styles.tapHint, { marginTop: spacing.sm }]}>
                                    <Text variant="labelSmall" style={{ color: PRIMARY }}>
                                        Detayları görüntüle
                                    </Text>
                                    <MaterialCommunityIcons
                                        name="chevron-right"
                                        size={moderateScale(16)}
                                        color={PRIMARY}
                                    />
                                </View>
                            </TouchableOpacity>
                        ) : (
                            /* No active job */
                            <View style={styles.emptyActiveJob}>
                                <MaterialCommunityIcons
                                    name="briefcase-outline"
                                    size={moderateScale(44)}
                                    color={appColors.text.disabled}
                                />
                                <Text
                                    variant="bodyMedium"
                                    style={[
                                        styles.emptyActiveJobText,
                                        { color: appColors.text.secondary, marginTop: spacing.sm },
                                    ]}
                                >
                                    Aktif iş yok
                                </Text>
                                <Text
                                    variant="bodySmall"
                                    style={{ color: appColors.text.disabled, textAlign: 'center', marginTop: 4 }}
                                >
                                    Şu anda size atanmış aktif bir iş bulunmuyor.
                                </Text>
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* ------------------------------------------------------------------ */}
                {/* Stats Section - İstatistik bölümü */}
                {/* ------------------------------------------------------------------ */}
                {dashboard?.stats && (
                    <>
                        <Text
                            variant="titleSmall"
                            style={[styles.statsHeading, { color: appColors.text.secondary, marginBottom: spacing.sm }]}
                        >
                            İSTATİSTİKLER
                        </Text>

                        <View style={styles.statsRow}>
                            {/* Total completed */}
                            <Card
                                mode="elevated"
                                style={[styles.statCard, { backgroundColor: cardBg, marginRight: spacing.sm / 2 }]}
                                elevation={2}
                            >
                                <Card.Content style={styles.statCardContent}>
                                    <View style={[styles.statIconWrap, { backgroundColor: '#e8f5e922' }]}>
                                        <MaterialCommunityIcons
                                            name="check-circle-outline"
                                            size={moderateScale(28)}
                                            color="#4CAF50"
                                        />
                                    </View>
                                    <Text
                                        variant="displaySmall"
                                        style={[styles.statNumber, { color: PRIMARY }]}
                                    >
                                        {dashboard.stats.total_completed}
                                    </Text>
                                    <Text
                                        variant="labelSmall"
                                        style={[styles.statLabel, { color: appColors.text.secondary }]}
                                    >
                                        Toplam{'\n'}Tamamlanan
                                    </Text>
                                </Card.Content>
                            </Card>

                            {/* This month */}
                            <Card
                                mode="elevated"
                                style={[styles.statCard, { backgroundColor: cardBg, marginLeft: spacing.sm / 2 }]}
                                elevation={2}
                            >
                                <Card.Content style={styles.statCardContent}>
                                    <View style={[styles.statIconWrap, { backgroundColor: '#e3f2fd22' }]}>
                                        <MaterialCommunityIcons
                                            name="calendar-month"
                                            size={moderateScale(28)}
                                            color="#2196F3"
                                        />
                                    </View>
                                    <Text
                                        variant="displaySmall"
                                        style={[styles.statNumber, { color: PRIMARY }]}
                                    >
                                        {dashboard.stats.this_month}
                                    </Text>
                                    <Text
                                        variant="labelSmall"
                                        style={[styles.statLabel, { color: appColors.text.secondary }]}
                                    >
                                        Bu Ay
                                    </Text>
                                </Card.Content>
                            </Card>
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centeredFill: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    loadingText: {
        textAlign: 'center',
    },
    errorTitle: {
        textAlign: 'center',
        fontWeight: '600',
    },
    errorSubtitle: {
        textAlign: 'center',
        lineHeight: 20,
    },
    retryButton: {
        backgroundColor: PRIMARY,
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 24,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    scrollContent: {
        flexGrow: 1,
    },
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    greetingTextContainer: {
        flex: 1,
    },
    card: {
        borderRadius: 16,
        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    cardContent: {
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    sectionTitle: {
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    divider: {
        height: 1,
        marginBottom: 14,
        borderRadius: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoRowIcon: {
        marginRight: 10,
        width: 22,
        textAlign: 'center',
    },
    infoRowTextBlock: {
        flex: 1,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
        marginTop: 2,
    },
    tapHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    emptyActiveJob: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyActiveJobText: {
        fontWeight: '600',
        textAlign: 'center',
    },
    statsHeading: {
        fontWeight: '700',
        letterSpacing: 1,
    },
    statsRow: {
        flexDirection: 'row',
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    statCardContent: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 8,
    },
    statIconWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statNumber: {
        fontWeight: '800',
        fontSize: 36,
        lineHeight: 44,
    },
    statLabel: {
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 16,
        fontWeight: '600',
    },
});
