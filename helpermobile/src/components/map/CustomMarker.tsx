import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface MarkerIconProps {
    type: 'driver' | 'pickup' | 'dropoff';
    label?: string;
}

export function MarkerIcon({ type, label }: MarkerIconProps) {
    if (type === 'driver') {
        return (
            <View style={styles.driverContainer}>
                <View style={styles.driverCircle}>
                    <MaterialCommunityIcons name="truck" size={24} color="#ffffff" />
                </View>
                <View style={styles.driverPulse} />
            </View>
        );
    }

    if (type === 'pickup') {
        return (
            <View style={styles.locationContainer}>
                <View style={[styles.locationCircle, styles.pickupCircle]}>
                    <Text style={styles.locationLabel}>A</Text>
                </View>
                <View style={styles.locationPin} />
            </View>
        );
    }

    if (type === 'dropoff') {
        return (
            <View style={styles.locationContainer}>
                <View style={[styles.locationCircle, styles.dropoffCircle]}>
                    <Text style={styles.locationLabel}>B</Text>
                </View>
                <View style={styles.locationPin} />
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    // Driver Marker (Animasyonlu çekici)
    driverContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    driverCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#26a69a',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#ffffff',
        shadowColor: '#26a69a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 10,
    },
    driverPulse: {
        position: 'absolute',
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#26a69a',
        opacity: 0.2,
        zIndex: 1,
    },

    // Pickup/Dropoff Markers
    locationContainer: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 50,
    },
    locationCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    pickupCircle: {
        backgroundColor: '#4CAF50',
    },
    dropoffCircle: {
        backgroundColor: '#F44336',
    },
    locationLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    locationPin: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#ffffff',
        marginTop: -3,
    },
});
