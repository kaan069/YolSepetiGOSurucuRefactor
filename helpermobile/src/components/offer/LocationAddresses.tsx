import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface LocationAddressesProps {
    pickupAddress: string;
    dropoffAddress: string;
}

export default function LocationAddresses({
    pickupAddress,
    dropoffAddress
}: LocationAddressesProps) {
    return (
        <View style={styles.container}>
            <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>📍 Alınacak Konum:</Text>
            </View>
            <Text style={styles.addressValue}>
                {pickupAddress}
            </Text>

            <View style={[styles.addressRow, { marginTop: 12 }]}>
                <Text style={styles.addressLabel}>📍 Bırakılacak Konum:</Text>
            </View>
            <Text style={styles.addressValue}>
                {dropoffAddress}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    addressRow: {
        marginBottom: 4,
    },
    addressLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
    },
    addressValue: {
        fontSize: 14,
        color: '#333',
        marginLeft: 4,
        lineHeight: 20,
    },
});
