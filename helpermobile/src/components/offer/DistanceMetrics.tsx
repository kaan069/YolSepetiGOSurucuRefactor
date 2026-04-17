import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

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
        backgroundColor: '#f5f5f5',
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
        color: '#26a69a',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 2,
    },
    metricSubtext: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    metricDivider: {
        width: 1,
        height: 60,
        backgroundColor: '#ddd',
        marginHorizontal: 12,
    },
});
