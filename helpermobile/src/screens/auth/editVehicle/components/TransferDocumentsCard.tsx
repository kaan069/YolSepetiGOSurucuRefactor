import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FkFormSection } from '../../../../components/fk';
import { useFkTokens } from '../../../../hooks/useFkTokens';
import { isPdfFile } from '../../../../utils/fileHelpers';
import { TRANSFER_DOCUMENT_LABELS } from '../constants';

interface Props {
  transferDocuments: Record<string, string>;
}

export default function TransferDocumentsCard({ transferDocuments }: Props) {
  const { tokens } = useFkTokens();

  if (Object.keys(transferDocuments).length === 0) return null;

  return (
    <FkFormSection title="📄 Yüklenen Belgeler">
      {Object.entries(transferDocuments).map(([key, url]) => (
        <View key={key} style={styles.row}>
          <Text
            variant="bodyMedium"
            style={[styles.label, { color: tokens.colors.textPrimary }]}
          >
            {TRANSFER_DOCUMENT_LABELS[key] || key}
          </Text>
          {isPdfFile(url) ? (
            <View
              style={[
                styles.pdfPreview,
                { backgroundColor: tokens.colors.surfaceMuted, borderRadius: tokens.radius.md },
              ]}
            >
              <MaterialCommunityIcons name="file-pdf-box" size={36} color={tokens.colors.error} />
              <Text style={{ marginLeft: 8, color: tokens.colors.textSecondary }}>
                PDF Belgesi
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: url }}
              style={[styles.image, { borderRadius: tokens.radius.md }]}
              resizeMode="cover"
            />
          )}
        </View>
      ))}
    </FkFormSection>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 12 },
  label: { fontWeight: '600', marginBottom: 6 },
  pdfPreview: {
    width: '100%',
    height: 150,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  image: { width: '100%', height: 120 },
});
