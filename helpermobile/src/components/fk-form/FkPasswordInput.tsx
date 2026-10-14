import React, { useState } from 'react';
import FkTextInput, { FkInputIconButton, FkTextInputProps } from './FkTextInput';

type Props = Omit<FkTextInputProps, 'secureTextEntry' | 'rightIcon' | 'leftIcon' | 'keyboardType' | 'autoCapitalize'> & {
  numericPin?: boolean;
  maxLength?: number;
  showToggle?: boolean;
  leftIcon?: string;
};

export default function FkPasswordInput({
  numericPin = false,
  maxLength,
  showToggle = true,
  leftIcon = 'lock-outline',
  ...rest
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <FkTextInput
      {...rest}
      secureTextEntry={!show}
      keyboardType={numericPin ? 'numeric' : 'default'}
      autoCapitalize="none"
      maxLength={maxLength}
      leftIcon={leftIcon}
      rightIcon={
        showToggle ? (
          <FkInputIconButton
            icon={show ? 'eye-off-outline' : 'eye-outline'}
            onPress={() => setShow((v) => !v)}
          />
        ) : undefined
      }
    />
  );
}
