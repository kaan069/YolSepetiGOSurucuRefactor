import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Text, useTheme, Divider, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CONTRACTS, Contract } from '../constants/contracts';
import ContractModal from '../components/ContractModal';

export default function ContractsListScreen() {
  const theme = useTheme();
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contractModalVisible, setContractModalVisible] = useState(false);

  const handleContractPress = (contract: Contract) => {
    setSelectedContract(contract);
    setContractModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="file-document-multiple" size={48} color="#26a69a" />
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Sözleşmelerim
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Onayladığınız sözleşmeleri görüntüleyin
          </Text>
        </View>

        {/* Status Chip */}
        <View style={styles.statusContainer}>
          <Chip
            icon={() => <MaterialCommunityIcons name="check-circle" size={18} color="#4caf50" />}
            mode="flat"
            style={styles.statusChip}
            textStyle={styles.statusChipText}
          >
            Tüm Sözleşmeler Onaylandı
          </Chip>
        </View>

        {/* Contracts List */}
        <View style={styles.contractsContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Onaylı Sözleşmeler ({CONTRACTS.length})
          </Text>

          {CONTRACTS.map((contract, index) => (
            <Card key={contract.id} style={styles.contractCard}>
              <TouchableOpacity
                onPress={() => handleContractPress(contract)}
                activeOpacity={0.7}
              >
                <Card.Content>
                  <View style={styles.contractCardHeader}>
                    <View style={styles.contractIconContainer}>
                      <MaterialCommunityIcons
                        name={contract.icon as any}
                        size={32}
                        color="#26a69a"
                      />
                    </View>
                    <View style={styles.contractCardContent}>
                      <Text variant="titleMedium" style={styles.contractCardTitle}>
                        {contract.title}
                      </Text>
                      <View style={styles.contractCardMeta}>
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={16}
                          color="#4caf50"
                          style={styles.metaIcon}
                        />
                        <Text variant="bodySmall" style={styles.approvedText}>
                          Onaylandı
                        </Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={24}
                      color="#666"
                    />
                  </View>
                </Card.Content>
              </TouchableOpacity>

              {index < CONTRACTS.length - 1 && (
                <Divider style={styles.divider} />
              )}
            </Card>
          ))}
        </View>

        {/* Info Section */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons
                name="information"
                size={24}
                color="#2196f3"
                style={styles.infoIcon}
              />
              <Text variant="titleMedium" style={styles.infoTitle}>
                Bilgi
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.infoText}>
              • Sözleşmelerinizin tamamı kayıt sırasında SMS ile tarafınıza iletilmiştir.
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              • Sözleşme detaylarını görüntülemek için yukarıdaki sözleşmelere tıklayabilirsiniz.
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              • Sorularınız için müşteri hizmetleri ile iletişime geçebilirsiniz.
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Contract Modal */}
      <ContractModal
        visible={contractModalVisible}
        contract={selectedContract}
        onDismiss={() => setContractModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  headerSubtitle: {
    color: '#666',
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statusChip: {
    backgroundColor: '#e8f5e9',
  },
  statusChipText: {
    color: '#4caf50',
    fontWeight: '600',
  },
  contractsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  contractCard: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  contractCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contractIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0f2f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contractCardContent: {
    flex: 1,
  },
  contractCardTitle: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  contractCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 4,
  },
  approvedText: {
    color: '#4caf50',
    fontWeight: '500',
  },
  divider: {
    marginTop: 8,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#e3f2fd',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoTitle: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  infoText: {
    color: '#1565c0',
    lineHeight: 22,
    marginBottom: 8,
  },
  bottomSpacer: {
    height: 32,
  },
});
