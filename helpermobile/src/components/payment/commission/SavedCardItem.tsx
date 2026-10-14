import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SavedCard } from '../../../api/payment';
import { CardBrand, getCardBrandFromAssociation } from './paymentUtils';
import { colors } from '../../../theme/design';

interface SavedCardItemProps {
  card: SavedCard;
  isSelected: boolean;
  onPress: () => void;
}

const renderBrandLogo = (brand: CardBrand, isSelected: boolean) => {
  const textColor = isSelected ? colors.white : colors.neutral[800];

  switch (brand) {
    case 'visa':
      return (
        <Text style={[styles.brandText, { color: isSelected ? colors.white : '#1a1f71' }]}>
          VISA
        </Text>
      );
    case 'mastercard':
      return (
        <View style={styles.mastercardLogo}>
          <View style={[styles.mastercardCircle, { backgroundColor: '#EB001B' }]} />
          <View style={[styles.mastercardCircle, { backgroundColor: '#F79E1B', marginLeft: -6 }]} />
        </View>
      );
    case 'amex':
      return (
        <Text style={[styles.brandText, { color: isSelected ? colors.white : '#006FCF' }]}>
          AMEX
        </Text>
      );
    case 'troy':
      return (
        <Text style={[styles.brandText, { color: isSelected ? colors.white : '#00529B' }]}>
          TROY
        </Text>
      );
    case 'discover':
      return (
        <Text style={[styles.brandText, { color: isSelected ? colors.white : '#FF6000' }]}>
          DISC
        </Text>
      );
    default:
      return <MaterialCommunityIcons name="credit-card" size={20} color={textColor} />;
  }
};

export default function SavedCardItem({ card, isSelected, onPress }: SavedCardItemProps) {
  const cardBrand = getCardBrandFromAssociation(card.card_association);

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View style={[styles.brandIcon, isSelected && styles.brandIconSelected]}>
          {renderBrandLogo(cardBrand, isSelected)}
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, isSelected && styles.nameSelected]}>
            {card.card_alias || card.bank_name || 'Kayıtlı Kart'}
          </Text>
          <Text style={styles.number}>•••• •••• •••• {card.last_four}</Text>
        </View>
      </View>
      <View style={styles.right}>
        {card.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Varsayılan</Text>
          </View>
        )}
        {isSelected && (
          <MaterialCommunityIcons name="check-circle" size={24} color={colors.success[500]} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    borderColor: colors.success[500],
    backgroundColor: colors.success[50],
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandIcon: {
    width: 48,
    height: 32,
    backgroundColor: colors.neutral[100],
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandIconSelected: {
    backgroundColor: colors.success[500],
  },
  brandText: {
    fontSize: 11,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  mastercardLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mastercardCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 2,
  },
  nameSelected: {
    color: colors.success[700],
  },
  number: {
    fontSize: 13,
    color: colors.neutral[500],
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultBadge: {
    backgroundColor: colors.info[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: colors.info[700],
    fontWeight: '600',
  },
});
