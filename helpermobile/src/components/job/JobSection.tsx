import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { FkCard, FkSectionHeader } from '../fk';
import { spacing } from '../../theme/design';

interface Props {
  title?: string;
  /** MaterialCommunityIcons adı */
  icon?: string;
  iconColor?: string;
  subtitle?: string;
  right?: React.ReactNode;
  variant?: 'default' | 'highlighted' | 'outlined';
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * İş / teklif ekranlarındaki bilgi bölümü: beyaz kart + ikonlu başlık.
 * Paper `Card` + `Card.Title` (çoğu emojili) kalıbının yerini alır.
 */
export default function JobSection({
  title,
  icon,
  iconColor,
  subtitle,
  right,
  variant = 'default',
  children,
  style,
}: Props) {
  return (
    <FkCard variant={variant} style={[{ marginBottom: spacing.md }, style]}>
      {title ? (
        <FkSectionHeader title={title} icon={icon} iconColor={iconColor} subtitle={subtitle} right={right} />
      ) : null}
      {children}
    </FkCard>
  );
}
