import React from 'react';
import { FkDocumentUpload, FkFormSection } from '../../../components/fk';

interface VehiclePhotoSectionProps {
  vehiclePhoto: string | null;
  onPhotoChange: (uri: string | null) => void;
  title?: string;
  helperText?: string;
  required?: boolean;
  /** @deprecated artık kullanılmıyor — tema turkuazına sabitlendi */
  primaryColor?: string;
}

export default function VehiclePhotoSection({
  vehiclePhoto,
  onPhotoChange,
  title = 'Araç Fotoğrafı',
  helperText = 'Plaka görünür şekilde araç fotoğrafı ekleyin',
  required,
}: VehiclePhotoSectionProps) {
  return (
    <FkFormSection title={`📷 ${title}`} required={required}>
      <FkDocumentUpload
        helperText={helperText}
        value={vehiclePhoto}
        onChange={onPhotoChange}
        imageQuality={0.8}
      />
    </FkFormSection>
  );
}
