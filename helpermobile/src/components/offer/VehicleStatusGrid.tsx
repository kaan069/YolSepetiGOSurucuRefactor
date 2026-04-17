import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface StatusItemProps {
    label: string;
    value: string;
    isOk: boolean;
    note?: string;
}

function StatusItem({ label, value, isOk, note }: StatusItemProps) {
    return (
        <View style={styles.statusItem}>
            <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>{label}:</Text>
                <Text style={[styles.statusValue, isOk ? styles.statusOk : styles.statusWarning]}>
                    {value}
                </Text>
            </View>
            {note && <Text style={styles.noteText}>Not: {note}</Text>}
        </View>
    );
}

interface VehicleStatusGridProps {
    isRunning: boolean;
    runningNote?: string;
    isGearStuck: boolean;
    gearNote?: string;
    isTireLocked: boolean;
    tireNote?: string;
    isStuck: boolean;
    stuckNote?: string;
    isCrashed: boolean;
    crashedNote?: string;
}

export default function VehicleStatusGrid({
    isRunning,
    runningNote,
    isGearStuck,
    gearNote,
    isTireLocked,
    tireNote,
    isStuck,
    stuckNote,
    isCrashed,
    crashedNote
}: VehicleStatusGridProps) {
    return (
        <View style={styles.container}>
            <StatusItem
                label="Motor"
                value={isRunning ? '✓ Çalışıyor' : '✗ Çalışmıyor'}
                isOk={isRunning}
                note={!isRunning ? runningNote : undefined}
            />
            <StatusItem
                label="Vites"
                value={isGearStuck ? '✗ Takılı' : '✓ Normal'}
                isOk={!isGearStuck}
                note={isGearStuck ? gearNote : undefined}
            />
            <StatusItem
                label="Lastik"
                value={isTireLocked ? '✗ Kilitli' : '✓ Normal'}
                isOk={!isTireLocked}
                note={isTireLocked ? tireNote : undefined}
            />
            <StatusItem
                label="Sıkışma"
                value={isStuck ? '✗ Sıkışmış' : '✓ Sıkışma Yok'}
                isOk={!isStuck}
                note={isStuck ? stuckNote : undefined}
            />
            <StatusItem
                label="Kaza"
                value={isCrashed ? '⚠️ Kaza Var' : '✓ Kaza Yok'}
                isOk={!isCrashed}
                note={isCrashed ? crashedNote : undefined}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
    },
    statusItem: {
        marginBottom: 8,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
        backgroundColor: '#f9f9f9',
        borderRadius: 6,
    },
    statusLabel: {
        fontWeight: '600',
        fontSize: 14,
        color: '#555',
    },
    statusValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    statusOk: {
        color: '#4caf50',
    },
    statusWarning: {
        color: '#ff9800',
    },
    noteText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginLeft: 8,
        marginTop: 4,
    },
});
