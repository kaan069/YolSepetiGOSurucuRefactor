import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import MapView, { Marker, Region } from 'react-native-maps';
import { MarkerIcon } from '../map/CustomMarker';

interface MapWithRouteProps {
    pickupLatitude: string;
    pickupLongitude: string;
    pickupAddress: string;
    dropoffLatitude: string;
    dropoffLongitude: string;
    dropoffAddress: string;
    title: string;
}

export default function MapWithRoute({
    pickupLatitude,
    pickupLongitude,
    pickupAddress,
    dropoffLatitude,
    dropoffLongitude,
    dropoffAddress,
    title
}: MapWithRouteProps) {
    const pickupLat = parseFloat(pickupLatitude);
    const pickupLng = parseFloat(pickupLongitude);
    const dropoffLat = parseFloat(dropoffLatitude);
    const dropoffLng = parseFloat(dropoffLongitude);

    const minLat = Math.min(pickupLat, dropoffLat);
    const maxLat = Math.max(pickupLat, dropoffLat);
    const minLng = Math.min(pickupLng, dropoffLng);
    const maxLng = Math.max(pickupLng, dropoffLng);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.02);
    const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.02);

    const region: Region = {
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
    };

    return (
        <Card style={styles.card}>
            <Card.Title title={title} />
            <MapView style={styles.map} initialRegion={region}>
                <Marker
                    coordinate={{
                        latitude: pickupLat,
                        longitude: pickupLng,
                    }}
                    title="Alınacak Konum"
                    description={pickupAddress}
                >
                    <MarkerIcon type="pickup" />
                </Marker>
                <Marker
                    coordinate={{
                        latitude: dropoffLat,
                        longitude: dropoffLng,
                    }}
                    title="Bırakılacak Konum"
                    description={dropoffAddress}
                >
                    <MarkerIcon type="dropoff" />
                </Marker>
            </MapView>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
    },
    map: {
        height: 200,
        marginVertical: 10,
    },
});
