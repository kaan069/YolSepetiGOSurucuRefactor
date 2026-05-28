import React from 'react';
import FkTextInput, { FkTextInputProps } from './FkTextInput';

type Props = Omit<FkTextInputProps, 'keyboardType' | 'autoCapitalize' | 'autoCorrect' | 'leftIcon'> & {
  leftIcon?: string;
};

export default function FkEmailInput({ leftIcon = 'email', ...rest }: Props) {
  return (
    <FkTextInput
      {...rest}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      leftIcon={leftIcon}
    />
  );
}
