import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Text, useTheme, Divider, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CONTRACTS, Contract } from '../constants/contracts';
import ContractModal from '../components/ContractModal';
import { colors } from '../theme/design';
import { FkCard } from '../components/fk';

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
          <MaterialCommunityIcons name="file-document-multiple" size={48} color={colors.primary[500]} />
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
            icon={() => <MaterialCommunityIcons name="check-circle" size={18} color={colors.success[500]} />}
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
                        color={colors.primary[500]}
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
                          color={colors.success[500]}
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
                      color={colors.neutral[500]}
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
        <FkCard style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons
                name="information"
                size={24}
                color={colors.info[500]}
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
          
        </FkCard>

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
    backgroundColor: colors.neutral[100],
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: colors.neutral[800],
  },
  headerSubtitle: {
    color: colors.neutral[500],
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statusChip: {
    backgroundColor: colors.success[50],
  },
  statusChipText: {
    color: colors.success[500],
    fontWeight: '600',
  },
  contractsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.neutral[800],
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
    backgroundColor: colors.primary[50],
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
    color: colors.neutral[800],
  },
  contractCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 4,
  },
  approvedText: {
    color: colors.success[500],
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
    backgroundColor: colors.info[50],
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
    color: colors.info[600],
  },
  infoText: {
    color: colors.info[700],
    lineHeight: 22,
    marginBottom: 8,
  },
  bottomSpacer: {
    height: 32,
  },
});
