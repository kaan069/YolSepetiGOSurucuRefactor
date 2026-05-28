import React from 'react';
import { FkDocumentUpload, FkFormSection } from '../../../components/fk';

interface TowTruckPhotoSectionProps {
  vehiclePhoto: string | null;
  onPhotoChange: (uri: string | null) => void;
  title?: string;
  helperText?: string;
  required?: boolean;
}

export default function TowTruckPhotoSection({
  vehiclePhoto,
  onPhotoChange,
  title = 'Araç Fotoğrafı',
  helperText = 'Plaka görünür şekilde araç fotoğrafı ekleyin',
  required,
}: TowTruckPhotoSectionProps) {
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
