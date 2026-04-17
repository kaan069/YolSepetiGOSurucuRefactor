import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../../hooks/useAppTheme';
import { isPdfFile } from '../../../../utils/fileHelpers';
import { TRANSFER_DOCUMENT_LABELS } from '../constants';

interface Props {
  transferDocuments: Record<string, string>;
}

export default function TransferDocumentsCard({ transferDocuments }: Props) {
  const { appColors } = useAppTheme();

  if (Object.keys(transferDocuments).length === 0) return null;

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          📄 Yüklenen Belgeler
        </Text>
        {Object.entries(transferDocuments).map(([key, url]) => (
          <View key={key} style={styles.documentItem}>
            <Text
              variant="bodyMedium"
              style={[styles.documentLabel, { color: appColors.text.primary }]}
            >
              {TRANSFER_DOCUMENT_LABELS[key] || key}
            </Text>
            {isPdfFile(url) ? (
              <View style={styles.pdfPreview}>
                <MaterialCommunityIcons name="file-pdf-box" size={36} color="#f44336" />
                <Text style={{ marginLeft: 8, color: appColors.text.secondary }}>
                  PDF Belgesi
                </Text>
              </View>
            ) : (
              <Image source={{ uri: url }} style={styles.documentImage} resizeMode="cover" />
            )}
          </View>
        ))}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    elevation: 2,
    marginBottom: 16,
  },
  cardContent: {
    padding: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#26a69a',
  },
  documentItem: {
    marginBottom: 12,
  },
  documentLabel: {
    fontWeight: '600',
    marginBottom: 6,
  },
  pdfPreview: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  documentImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
});
