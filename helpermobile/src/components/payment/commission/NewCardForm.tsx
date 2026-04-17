import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, TextInput as RNTextInput, TouchableOpacity, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CardBrand, getCardBrand, formatCardNumber, formatExpireDate } from './paymentUtils';

export interface NewCardFormProps {
  cardNumber: string;
  setCardNumber: (v: string) => void;
  cardHolderName: string;
  setCardHolderName: (v: string) => void;
  expireDate: string;
  setExpireDate: (v: string) => void;
  cvc: string;
  setCvc: (v: string) => void;
  saveCard: boolean;
  setSaveCard: (v: boolean) => void;
}

const renderCardBrandLogo = (brand: CardBrand) => {
  switch (brand) {
    case 'visa':
      return <Text style={styles.previewBrand}>VISA</Text>;
    case 'mastercard':
      return (
        <View style={styles.mastercardLogo}>
          <View style={[styles.mastercardCircle, { backgroundColor: '#EB001B' }]} />
          <View style={[styles.mastercardCircle, { backgroundColor: '#F79E1B', marginLeft: -8 }]} />
        </View>
      );
    case 'amex':
      return <Text style={[styles.previewBrand, { fontStyle: 'normal' }]}>AMEX</Text>;
    case 'troy':
      return <Text style={[styles.previewBrand, { fontStyle: 'normal' }]}>TROY</Text>;
    case 'discover':
      return <Text style={[styles.previewBrand, { color: '#FF6000', fontStyle: 'normal' }]}>DISCOVER</Text>;
    default:
      return <MaterialCommunityIcons name="credit-card" size={24} color="#fff" />;
  }
};

export default function NewCardForm({
  cardNumber, setCardNumber,
  cardHolderName, setCardHolderName,
  expireDate, setExpireDate,
  cvc, setCvc,
  saveCard, setSaveCard,
}: NewCardFormProps) {
  const cardBrand = getCardBrand(cardNumber);
  const [displayCardNumber, setDisplayCardNumber] = useState(formatCardNumber(cardNumber));
  const cardInputRef = useRef<RNTextInput>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);

  // Sync display value when parent cardNumber changes externally
  useEffect(() => {
    const formatted = formatCardNumber(cardNumber);
    if (formatted !== displayCardNumber) {
      setDisplayCardNumber(formatted);
    }
  }, [cardNumber]);

  const handleCardNumberChange = useCallback((text: string) => {
    // Get cursor position before formatting
    const cursorPos = selectionRef.current?.start ?? text.length;

    // Count digits before cursor in the new text
    const textBeforeCursor = text.slice(0, cursorPos);
    const digitsBeforeCursor = textBeforeCursor.replace(/\D/g, '').length;

    // Extract raw digits and update parent
    const raw = text.replace(/\D/g, '').slice(0, 16);
    setCardNumber(raw);

    // Format the new value
    const formatted = formatCardNumber(raw);
    setDisplayCardNumber(formatted);

    // Calculate new cursor position: find position after N digits in formatted string
    let digitCount = 0;
    let newCursorPos = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        digitCount++;
      }
      if (digitCount === digitsBeforeCursor) {
        newCursorPos = i + 1;
        break;
      }
    }
    if (digitsBeforeCursor === 0) {
      newCursorPos = 0;
    }

    // Set cursor position after React re-renders
    setTimeout(() => {
      cardInputRef.current?.setNativeProps({
        selection: { start: newCursorPos, end: newCursorPos },
      });
    }, 0);
  }, [setCardNumber]);

  return (
    <View style={styles.container}>
      {/* Card Preview */}
      <View style={styles.preview}>
        <View style={styles.previewHeader}>
          <MaterialCommunityIcons name="contactless-payment" size={24} color="#fff" />
          {renderCardBrandLogo(cardBrand)}
        </View>
        <Text style={styles.previewNumber}>
          {cardNumber ? formatCardNumber(cardNumber) : '•••• •••• •••• ••••'}
        </Text>
        <View style={styles.previewFooter}>
          <View>
            <Text style={styles.previewLabel}>Kart Sahibi</Text>
            <Text style={styles.previewValue}>{cardHolderName || 'AD SOYAD'}</Text>
          </View>
          <View>
            <Text style={styles.previewLabel}>Son Kullanma</Text>
            <Text style={styles.previewValue}>{expireDate || 'MM/YY'}</Text>
          </View>
        </View>
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Kart Numarası</Text>
          <View style={styles.inputWrapper}>
            <RNTextInput
              ref={cardInputRef}
              style={styles.input}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor="#999"
              value={displayCardNumber}
              onChangeText={handleCardNumberChange}
              onSelectionChange={(e) => {
                selectionRef.current = e.nativeEvent.selection;
              }}
              keyboardType="numeric"
              maxLength={19}
            />
            <MaterialCommunityIcons name="credit-card-outline" size={20} color="#666" style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Kart Üzerindeki İsim</Text>
          <View style={styles.inputWrapper}>
            <RNTextInput
              style={styles.input}
              placeholder="AD SOYAD"
              placeholderTextColor="#999"
              value={cardHolderName}
              onChangeText={setCardHolderName}
              autoCapitalize="characters"
            />
            <MaterialCommunityIcons name="account-outline" size={20} color="#666" style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.rowInputs}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Son Kullanma</Text>
            <RNTextInput
              style={styles.inputSmall}
              placeholder="MM/YY"
              placeholderTextColor="#999"
              value={expireDate}
              onChangeText={(text: string) => {
                if (text.length < expireDate.length) {
                  if (expireDate.includes('/') && !text.includes('/')) {
                    setExpireDate(text.replace(/\D/g, '').slice(0, 2));
                    return;
                  }
                  setExpireDate(formatExpireDate(text.replace('/', '')));
                  return;
                }
                setExpireDate(formatExpireDate(text));
              }}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.inputLabel}>CVV</Text>
            <RNTextInput
              style={styles.inputSmall}
              placeholder="•••"
              placeholderTextColor="#999"
              value={cvc}
              onChangeText={(text: string) => setCvc(text.replace(/\D/g, '').slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>

        {/* Save Card Toggle */}
        <TouchableOpacity style={styles.saveToggle} onPress={() => setSaveCard(!saveCard)} activeOpacity={0.7}>
          <View style={[styles.checkbox, saveCard && styles.checkboxChecked]}>
            {saveCard && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
          </View>
          <Text style={styles.saveText}>Bu kartı kaydet (Sonraki ödemelerde kullan)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  // Card Preview
  preview: {
    height: 180,
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#1a1f71',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewBrand: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    fontStyle: 'italic',
  },
  mastercardLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mastercardCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  previewNumber: {
    fontSize: 22,
    fontWeight: '500',
    color: '#fff',
    letterSpacing: 2,
    marginTop: 30,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  previewLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  previewValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  // Form
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    paddingRight: 44,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  inputSmall: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
    textAlign: 'center',
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  // Save Card
  saveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  saveText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});
