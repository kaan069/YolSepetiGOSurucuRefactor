import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../../theme/design';

interface DistanceMetricsProps {
    distanceToCustomer: number | null;
    routeDistance: string;
    routeDuration: string;
}

export default function DistanceMetrics({
    distanceToCustomer,
    routeDistance,
    routeDuration
}: DistanceMetricsProps) {
    return (
        <View style={styles.container}>
            <View style={styles.metricBox}>
                <Text style={styles.metricValue}>
                    {distanceToCustomer ? `${distanceToCustomer} km` : '-'}
                </Text>
                <Text style={styles.metricLabel}>Müşteriye Uzaklık</Text>
                <Text style={styles.metricSubtext}>Sizin konumunuzdan</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBox}>
                <Text style={styles.metricValue}>{routeDistance}</Text>
                <Text style={styles.metricLabel}>Çekim Mesafesi</Text>
                <Text style={styles.metricSubtext}>{routeDuration}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.neutral[100],
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
    },
    metricBox: {
        flex: 1,
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.primary[500],
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.neutral[800],
        textAlign: 'center',
        marginBottom: 2,
    },
    metricSubtext: {
        fontSize: 12,
        color: colors.neutral[500],
        textAlign: 'center',
    },
    metricDivider: {
        width: 1,
        height: 60,
        backgroundColor: colors.neutral[200],
        marginHorizontal: 12,
    },
});
