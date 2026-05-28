import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useFkTokens } from '../../hooks/useFkTokens';

interface Props {
  title?: string;
  description?: string;
  titleColor?: string;
  required?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export default function FkFormSection({
  title,
  description,
  titleColor,
  required,
  children,
  style,
  contentStyle,
}: Props) {
  const { tokens } = useFkTokens();
  return (
    <Card
      style={[
        styles.card,
        { backgroundColor: tokens.colors.cardBg, borderRadius: tokens.radius.xl, marginBottom: tokens.spacing.lg },
        style,
      ]}
    >
      <Card.Content style={[{ padding: tokens.spacing.xl }, contentStyle]}>
        {title ? (
          <Text
            variant="titleMedium"
            style={[
              styles.title,
              { color: titleColor || tokens.colors.primary, marginBottom: description ? 4 : tokens.spacing.lg },
            ]}
          >
            {title}
            {required ? <Text style={{ color: tokens.colors.error }}> *</Text> : null}
          </Text>
        ) : null}
        {description ? (
          <Text
            variant="bodySmall"
            style={[styles.description, { color: tokens.colors.textSecondary, marginBottom: tokens.spacing.lg }]}
          >
            {description}
          </Text>
        ) : null}
        <View>{children}</View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
  },
  description: {
    lineHeight: 20,
  },
});
