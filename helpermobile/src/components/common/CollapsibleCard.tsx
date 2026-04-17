import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleCardProps {
    title: string;
    icon?: string;
    iconColor?: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

export default function CollapsibleCard({
    title,
    icon,
    iconColor = '#4CAF50',
    children,
    defaultExpanded = false
}: CollapsibleCardProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const toggleExpanded = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <Card style={styles.card}>
            <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.7}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        {icon && (
                            <MaterialCommunityIcons
                                name={icon as any}
                                size={24}
                                color={iconColor}
                                style={styles.headerIcon}
                            />
                        )}
                        <Text style={styles.title}>{title}</Text>
                    </View>
                    <MaterialCommunityIcons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        color="#666"
                    />
                </View>
            </TouchableOpacity>
            {expanded && (
                <Card.Content style={styles.content}>
                    {children}
                </Card.Content>
            )}
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
        borderRadius: 12,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerIcon: {
        marginRight: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    content: {
        paddingTop: 0,
    },
});
