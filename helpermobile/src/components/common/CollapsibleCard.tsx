import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FkCard from '../fk-ui/FkCard';
import { useFkTokens } from '../../hooks/useFkTokens';
import { colors, spacing, text } from '../../theme/design';

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

/** Açılıp kapanan kart — FkCard + ikonlu bölüm başlığı + chevron. */
export default function CollapsibleCard({
    title,
    icon,
    iconColor,
    children,
    defaultExpanded = false
}: CollapsibleCardProps) {
    const { tokens } = useFkTokens();
    const [expanded, setExpanded] = useState(defaultExpanded);

    const toggleExpanded = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <FkCard padding={0} style={styles.card}>
            <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.7}>
                <View style={styles.header}>
                    {icon && (
                        <MaterialCommunityIcons
                            name={icon as any}
                            size={20}
                            color={iconColor || tokens.colors.primary}
                        />
                    )}
                    <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>{title}</Text>
                    <MaterialCommunityIcons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={22}
                        color={colors.neutral[400]}
                    />
                </View>
            </TouchableOpacity>
            {expanded && (
                <View style={styles.content}>
                    {children}
                </View>
            )}
        </FkCard>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.sm,
    },
    title: {
        ...text.cardTitle,
        flex: 1,
    },
    content: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
});
