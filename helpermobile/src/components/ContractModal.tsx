import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Modal, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Portal, Text, Button, IconButton, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Contract } from '../constants/contracts';

interface ContractModalProps {
  visible: boolean;
  contract: Contract | null;
  onDismiss: () => void;
  showAcceptButton?: boolean;
  onAccept?: () => void;
}

type EmphasisStyle = 'bold' | 'underline';

const EMPHASIZED_SENTENCES: Array<{ text: string; style: EmphasisStyle }> = [
  {
    text: 'Platform yalnızca dijital aracılık hizmeti olup, hizmetin fiili ifasını üstlenmez.',
    style: 'underline',
  },
  {
    text: 'Yol SepetiGO sadece bir aracıdır. Asla bir taraf değildir. Fiyatlandırma, kabul, taraflar arasında olup Yol Sepeti Go hiçbir sorumluluk altında değildir. Taraflar önceden rizikoları kabul eder.',
    style: 'underline',
  },
  {
    text: '7.5. Platform, hizmet bedelini tek taraflı belirlemez; fiyatlandırma Hizmet Sağlayıcı tarafından yapılır.',
    style: 'underline',
  },
  {
    text: 'Hizmet Sağlayıcı; sunduğu hizmetleri tamamen kendi nam ve hesabına bağımsız bir şekilde yürüttüğünü kabul eder. Hizmet Sağlayıcı; kendi personelinden, kullandığı araç ve ekipmanlardan, faaliyetleri kapsamında doğabilecek zararlardan, vergi yükümlülüklerinden, sigorta primlerinden ve SGK dahil tüm yasal yükümlülüklerden münhasıran kendisinin sorumlu olduğunu kabul ve taahhüt eder.',
    style: 'underline',
  },
  {
    text: 'Hizmet Sağlayıcı ile platform işletmecisi Yol Sepeti Go arasında hiçbir şekilde işçi‑işveren ilişkisi, hizmet sözleşmesi, temsil, acentelik, adi ortaklık veya benzeri bir hukuki ilişki kurulmuş sayılmaz. Hizmet Sağlayıcı ve onun istihdam ettiği personel hiçbir surette Yol Sepeti Go\'nun çalışanı olarak kabul edilemez.',
    style: 'underline',
  },
  {
    text: 'Bu yükümlülüklerin yerine getirilmemesinden doğabilecek her türlü sorumluluk hizmet sağlayıcıya ait olacaktır.',
    style: 'underline',
  },
  {
    text: '(Hizmet Sağlayıcı veya kullanıcı tarafından)',
    style: 'underline',
  },
  {
    text: 'Taraflar, iptal durumunda platformun belirlediği kesinti ve iade koşullarını peşinen kabul eder.',
    style: 'underline',
  },
  {
    text: 'İptal Zamanları ve öngörülen kesinti ise şöyledir:',
    style: 'bold',
  },
  {
    text: '50.000 TL (elli bin türk lirası)',
    style: 'underline',
  },
];

function renderFormattedContent(text: string): React.ReactNode[] {
  const ranges: Array<{ start: number; end: number; style: EmphasisStyle }> = [];
  for (const item of EMPHASIZED_SENTENCES) {
    let pos = 0;
    while (true) {
      const idx = text.indexOf(item.text, pos);
      if (idx === -1) break;
      ranges.push({ start: idx, end: idx + item.text.length, style: item.style });
      pos = idx + item.text.length;
    }
  }
  ranges.sort((a, b) => a.start - b.start);

  const segments: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  for (const r of ranges) {
    if (r.start < cursor) continue;
    if (r.start > cursor) segments.push(text.slice(cursor, r.start));
    const inner = text.slice(r.start, r.end);
    if (r.style === 'bold') {
      segments.push(<Text key={`b-${key++}`} style={{ fontWeight: 'bold' }}>{inner}</Text>);
    } else {
      segments.push(<Text key={`u-${key++}`} style={{ textDecorationLine: 'underline' }}>{inner}</Text>);
    }
    cursor = r.end;
  }
  if (cursor < text.length) segments.push(text.slice(cursor));
  return segments;
}

export default function ContractModal({ visible, contract, onDismiss, showAcceptButton, onAccept }: ContractModalProps) {
  const theme = useTheme();
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;
    if (isAtBottom && !scrolledToBottom) {
      setScrolledToBottom(true);
    }
  }, [scrolledToBottom]);

  const handleAccept = () => {
    setScrolledToBottom(false);
    onAccept?.();
  };

  const handleDismiss = () => {
    setScrolledToBottom(false);
    onDismiss();
  };

  if (!contract) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onRequestClose={handleDismiss}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons
                name={contract.icon as any}
                size={24}
                color="#fff"
                style={styles.headerIcon}
              />
              <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={2}>
                {contract.title}
              </Text>
            </View>
            <IconButton
              icon="close"
              iconColor="#fff"
              size={24}
              onPress={handleDismiss}
              style={styles.closeButton}
            />
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <Text style={styles.contractText}>{renderFormattedContent(contract.content)}</Text>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {showAcceptButton ? (
              <Button
                mode="contained"
                onPress={handleAccept}
                disabled={!scrolledToBottom}
                style={[styles.closeButtonFooter, !scrolledToBottom && styles.disabledButton]}
                contentStyle={styles.closeButtonContent}
              >
                {scrolledToBottom ? 'Sözleşmeyi Onayla' : 'Sözleşmeyi okumak için aşağı kaydırın'}
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleDismiss}
                style={styles.closeButtonFooter}
                contentStyle={styles.closeButtonContent}
              >
                Kapat
              </Button>
            )}
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    margin: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  contractText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#333',
    textAlign: 'justify',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  closeButtonFooter: {
    borderRadius: 12,
  },
  closeButtonContent: {
    paddingVertical: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
