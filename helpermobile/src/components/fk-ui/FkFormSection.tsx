import React from 'react';
import { View, ViewStyle } from 'react-native';
import FkCard from './FkCard';
import FkSectionHeader from './FkSectionHeader';
import { spacing } from '../../theme/design';

interface Props {
  title?: string;
  description?: string;
  /** MaterialCommunityIcons adı — başlığın solunda */
  icon?: string;
  titleColor?: string;
  required?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

/** Form bölümü: beyaz kart + müşteri uygulamasındaki ikonlu bölüm başlığı. */
export default function FkFormSection({
  title,
  description,
  icon,
  titleColor,
  required,
  children,
  style,
  contentStyle,
}: Props) {
  return (
    <FkCard padding={spacing.md} style={[{ marginBottom: spacing.md }, style]}>
      <View style={contentStyle}>
        {title ? (
          <FkSectionHeader
            title={title}
            subtitle={description}
            icon={icon}
            iconColor={titleColor}
            required={required}
          />
        ) : null}
        <View>{children}</View>
      </View>
    </FkCard>
  );
}
