import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import JobSection from './JobSection';
import { FkButton, FkInfoBanner } from '../fk';
import { spacing } from '../../theme/design';

interface Props {
  onComplete: () => void;
  /** Butonun üstünde gösterilecek bilgi (ör. müşteri onayı gerekir) */
  notice?: string;
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** "İşi Tamamla" bölümü — tüm servislerde tek bileşen (eskiden 5 kopya). */
export default function JobCompleteCard({
  onComplete,
  notice,
  label = 'İşi Tamamla',
  loading,
  disabled,
  style,
}: Props) {
  return (
    <JobSection style={style}>
      {notice ? <FkInfoBanner type="info" message={notice} style={{ marginBottom: spacing.md }} /> : null}
      <FkButton
        variant="success"
        icon="check-circle-outline"
        size="lg"
        fullWidth
        onPress={onComplete}
        loading={loading}
        disabled={disabled}
      >
        {label}
      </FkButton>
    </JobSection>
  );
}
