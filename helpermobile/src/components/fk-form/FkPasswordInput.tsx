import React, { useState } from 'react';
import { TextInput as PaperTextInput } from 'react-native-paper';
import FkTextInput, { FkTextInputProps } from './FkTextInput';

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
  leftIcon = 'lock',
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
          <PaperTextInput.Icon
            icon={show ? 'eye-off' : 'eye'}
            onPress={() => setShow((v) => !v)}
          />
        ) : undefined
      }
    />
  );
}
