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
            <Text style={styles.contractText}>{contract.content}</Text>
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
