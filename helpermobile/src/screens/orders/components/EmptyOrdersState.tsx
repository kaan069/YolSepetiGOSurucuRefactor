import React from 'react';
import { Text } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { OrderStatus } from '../../../lib/types';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface EmptyOrdersStateProps {
  filter: OrderStatus;
}

export default function EmptyOrdersState({ filter }: EmptyOrdersStateProps) {
  const { appColors } = useAppTheme();

  const getMessage = () => {
    switch (filter) {
      case 'pending':
        return 'Bekleyen iş bulunmuyor.';
      case 'awaiting_approval':
        return 'Onay bekleyen iş bulunmuyor.';
      case 'in_progress':
        return 'Devam eden iş bulunmuyor.';
      case 'completed':
        return 'Tamamlanmış iş bulunmuyor.';
      default:
        return 'İş bulunmuyor.';
    }
  };

  return <Text style={[styles.emptyText, { color: appColors.text.secondary }]}>{getMessage()}</Text>;
}

const styles = StyleSheet.create({
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
