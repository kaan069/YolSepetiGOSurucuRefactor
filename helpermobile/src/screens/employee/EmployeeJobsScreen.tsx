import React, { useCallback, useState } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, ActivityIndicator, Card } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { RootStackParamList } from '../../navigation';
import { AppBar } from '../../components/common';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useResponsive } from '../../hooks/useResponsive';
import { useEmployeePanelStore } from '../../store/useEmployeePanelStore';
import { EmployeeJob } from '../../api/types';

// ---------------------------------------------------------------------------
// Config maps
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface JobCardProps {
    item: EmployeeJob;
    onPress: (item: EmployeeJob) => void;
    cardBg: string;
    appColors: any;
    moderateScale: (size: number) => number;
    spacing: any;
    isDarkMode: boolean;
}

function JobCard({ item, onPress, cardBg, appColors, moderateScale, spacing, isDarkMode }: JobCardProps) {
    const serviceInfo = serviceTypeConfig[item.service_type] ?? { label: item.service_type, icon: 'briefcase-outline' };
    const statusInfo = statusConfig[item.status] ?? { label: item.status, color: '#9E9E9E' };

    return (
        <TouchableOpacity
            onPress={() => onPress(item)}
            activeOpacity={0.75}
            style={styles.cardTouchable}
        >
            <Card mode="outlined" style={[styles.card, { backgroundColor: cardBg }]}>
                <Card.Content style={styles.cardContent}>
                    {/* Icon + Service type label */}
                    <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#1a3a2a' : '#E8F5E9' }]}>
                        <MaterialCommunityIcons
                            name={serviceInfo.icon}
                            size={moderateScale(24)}
                            color={appColors.primary[400]}
                        />
                    </View>

                    {/* Main info */}
                    <View style={styles.cardInfo}>
                        <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 2 }}>
                            {serviceInfo.label}
                        </Text>

                        {/* Customer name (only when available) */}
                        {item.customer_info !== null && (
                            <Text variant="bodySmall" style={{ color: appColors.text.secondary, marginBottom: 2 }}>
                                {item.customer_info.name}
                            </Text>
                        )}

                        {/* Date */}
                        <Text variant="bodySmall" style={{ color: appColors.text.disabled }}>
                            {formatDate(item.created_at)}
                        </Text>
                    </View>

                    {/* Status badge */}
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '22' }]}>
                        <Text
                            variant="labelSmall"
                            style={{ color: statusInfo.color, fontWeight: '600' }}
                        >
                            {statusInfo.label}
                        </Text>
                    </View>
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function EmployeeJobsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { appColors, screenBg, cardBg, isDarkMode } = useAppTheme();
    const { spacing, moderateScale } = useResponsive();
    const { jobs, jobsLoading, fetchJobs, loadMoreJobs } = useEmployeePanelStore();

    const [refreshing, setRefreshing] = useState(false);

    // Her zaman sadece aktif işleri getir
    useFocusEffect(
        useCallback(() => {
            fetchJobs('active').catch(() => {});
        }, [])
    );

    // Pull-to-refresh handler
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchJobs('active');
        } catch {
            // silently ignore
        } finally {
            setRefreshing(false);
        }
    }, [fetchJobs]);

    // Navigate to job detail
    const handleJobPress = useCallback(
        (item: EmployeeJob) => {
            navigation.navigate('EmployeeJobDetail', { requestId: item.request_id });
        },
        [navigation]
    );

    // Pagination
    const handleEndReached = useCallback(() => {
        loadMoreJobs().catch(() => {});
    }, [loadMoreJobs]);

    // ---------------------------------------------------------------------------
    // Render helpers
    // ---------------------------------------------------------------------------

    const renderItem = useCallback(
        ({ item }: { item: EmployeeJob }) => (
            <JobCard
                item={item}
                onPress={handleJobPress}
                cardBg={cardBg}
                appColors={appColors}
                moderateScale={moderateScale}
                spacing={spacing}
                isDarkMode={isDarkMode}
            />
        ),
        [handleJobPress, cardBg, appColors, moderateScale, spacing, isDarkMode]
    );

    const renderEmptyState = useCallback(() => {
        if (jobsLoading) return null;
        return (
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                    name="briefcase-outline"
                    size={moderateScale(64)}
                    color={appColors.text.disabled}
                />
                <Text
                    variant="titleMedium"
                    style={{ color: appColors.text.secondary, marginTop: spacing.md, textAlign: 'center' }}
                >
                    Devam eden işiniz bulunmuyor
                </Text>
                <Text
                    variant="bodySmall"
                    style={{ color: appColors.text.disabled, marginTop: spacing.xs, textAlign: 'center' }}
                >
                    Şu an için size atanmış aktif bir iş yok.
                </Text>
            </View>
        );
    }, [jobsLoading, appColors, moderateScale, spacing]);

    const renderFooter = useCallback(() => {
        if (!jobsLoading || jobs.length === 0) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={appColors.primary[400]} />
            </View>
        );
    }, [jobsLoading, jobs.length, appColors]);

    const keyExtractor = useCallback((item: EmployeeJob) => item.request_id.toString(), []);

    // ---------------------------------------------------------------------------
    // Full-screen initial loading
    // ---------------------------------------------------------------------------

    if (jobsLoading && jobs.length === 0) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
                <AppBar title="Devam Eden İşler" showBackButton={false} />
                <View style={styles.fullscreenLoader}>
                    <ActivityIndicator size="large" color={appColors.primary[400]} />
                    <Text style={{ color: appColors.text.secondary, marginTop: spacing.md }}>
                        İşler yükleniyor...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // ---------------------------------------------------------------------------
    // Main render
    // ---------------------------------------------------------------------------

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
            <AppBar title="Devam Eden İşler" showBackButton={false} />

            {/* Jobs list */}
            <FlatList
                data={jobs}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                ListEmptyComponent={renderEmptyState}
                ListFooterComponent={renderFooter}
                contentContainerStyle={[
                    { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xl },
                    jobs.length === 0 && styles.emptyListContent,
                ]}
                showsVerticalScrollIndicator={false}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#26a69a']}
                        tintColor="#26a69a"
                    />
                }
            />
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
    cardTouchable: {
        marginBottom: 10,
    },
    card: {
        borderRadius: 12,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardInfo: {
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    emptyListContent: {
        flex: 1,
        justifyContent: 'center',
    },
    fullscreenLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerLoader: {
        paddingVertical: 16,
        alignItems: 'center',
    },
});
