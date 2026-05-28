import React, { useCallback } from 'react';
import FkTextInput, { FkTextInputProps } from './FkTextInput';

type Props = Omit<FkTextInputProps, 'keyboardType' | 'autoCapitalize' | 'maxLength' | 'onChange'> & {
  onChange: (value: string) => void;
  maxLength?: number;
};

const sanitize = (raw: string) => raw.replace(/[^A-Za-z0-9 ]/g, '').toUpperCase();

export default function FkVehiclePlateInput({
  onChange,
  maxLength = 10,
  placeholder = '34 ABC 1234',
  ...rest
}: Props) {
  const handleChange = useCallback(
    (raw: string) => onChange(sanitize(raw)),
    [onChange],
  );

  return (
    <FkTextInput
      {...rest}
      onChange={handleChange}
      autoCapitalize="characters"
      maxLength={maxLength}
      placeholder={placeholder}
    />
  );
}
