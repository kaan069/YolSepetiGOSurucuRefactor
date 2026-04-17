import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SavedCard } from '../../../api/payment';
import { formatCurrency } from './paymentUtils';
import SavedCardItem from './SavedCardItem';
import NewCardForm, { NewCardFormProps } from './NewCardForm';

interface PaymentSelectScreenProps {
  commissionAmount: number;
  commissionBaseAmount?: number;
  commissionVatRate?: number;
  commissionVatAmount?: number;
  savedCards: SavedCard[];
  selectedCardId: number | null;
  showNewCardForm: boolean;
  isFormValid: boolean;
  formProps: NewCardFormProps;
  onCardSelect: (id: number) => void;
  onShowNewCardForm: () => void;
  onBackToSaved: () => void;
  onPay: () => void;
}

export default function PaymentSelectScreen({
  commissionAmount,
  commissionBaseAmount,
  commissionVatRate,
  commissionVatAmount,
  savedCards,
  selectedCardId,
  showNewCardForm,
  isFormValid,
  formProps,
  onCardSelect,
  onShowNewCardForm,
  onBackToSaved,
  onPay,
}: PaymentSelectScreenProps) {
  const canPay = selectedCardId !== null || isFormValid;

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Amount Display */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Ödenecek Komisyon</Text>
          <Text style={styles.amountValue}>{formatCurrency(commissionAmount)} ₺</Text>
          {commissionVatAmount != null && commissionVatAmount > 0 && commissionBaseAmount != null && (
            <Text style={styles.amountBreakdown}>
              Komisyon: {formatCurrency(commissionBaseAmount)} ₺ + KDV{commissionVatRate != null ? ` (%${commissionVatRate})` : ''}: {formatCurrency(commissionVatAmount)} ₺
            </Text>
          )}
        </View>

        {/* Saved Cards */}
        {savedCards.length > 0 && !showNewCardForm && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kayıtlı Kartlarım</Text>
            {savedCards.map((card) => (
              <SavedCardItem
                key={card.id}
                card={card}
                isSelected={selectedCardId === card.id}
                onPress={() => onCardSelect(card.id)}
              />
            ))}
            <TouchableOpacity style={styles.addNewCardButton} onPress={onShowNewCardForm} activeOpacity={0.7}>
              <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#1976D2" />
              <Text style={styles.addNewCardText}>Yeni Kart Ekle</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* New Card Form */}
        {showNewCardForm && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Yeni Kart</Text>
              {savedCards.length > 0 && (
                <TouchableOpacity onPress={onBackToSaved}>
                  <Text style={styles.backToSavedText}>Kayıtlı Kartlarıma Dön</Text>
                </TouchableOpacity>
              )}
            </View>
            <NewCardForm {...formProps} />
          </View>
        )}

        {/* Security Info */}
        <View style={styles.securitySection}>
          <MaterialCommunityIcons name="shield-check" size={20} color="#4CAF50" />
          <Text style={styles.securityText}>
            Ödemeniz 256-bit SSL ile korunmaktadır. iyzico güvencesi ile güvenli ödeme.
          </Text>
        </View>

        {/* Payment Logos */}
        <View style={styles.logosContainer}>
          <View style={styles.logoItem}>
            <Text style={styles.visaLogo}>VISA</Text>
          </View>
          <View style={styles.logoItem}>
            <View style={styles.mastercardLogo}>
              <View style={[styles.mastercardCircle, { backgroundColor: '#EB001B' }]} />
              <View style={[styles.mastercardCircle, { backgroundColor: '#F79E1B', marginLeft: -6 }]} />
            </View>
          </View>
          <View style={styles.logoItem}>
            <Text style={styles.iyzicoLogo}>iyzico</Text>
          </View>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, !canPay && styles.payButtonDisabled]}
          onPress={onPay}
          disabled={!canPay}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="lock" size={20} color="#fff" />
          <Text style={styles.payButtonText}>
            Güvenli Ödeme - {formatCurrency(commissionAmount)} ₺
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContentContainer: {
    paddingBottom: 16,
  },
  // Amount
  amountSection: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1B5E20',
  },
  amountBreakdown: {
    fontSize: 13,
    color: '#388E3C',
    marginTop: 6,
  },
  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  backToSavedText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  // Add New Card
  addNewCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#1976D2',
    borderStyle: 'dashed',
    borderRadius: 12,
    gap: 8,
  },
  addNewCardText: {
    fontSize: 15,
    color: '#1976D2',
    fontWeight: '600',
  },
  // Security
  securitySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 18,
  },
  // Logos
  logosContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 16,
  },
  logoItem: {
    padding: 8,
  },
  visaLogo: {
    fontSize: 24,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#1a1f71',
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
  iyzicoLogo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B4B4B',
  },
  // Footer
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 18,
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
    shadowColor: '#ccc',
  },
  payButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});
