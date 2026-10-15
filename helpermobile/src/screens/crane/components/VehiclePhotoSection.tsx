import React from 'react';
import { FkDocumentUpload, FkFormSection } from '../../../components/fk';
import { documentVerifier } from '../../../utils/documentCheck';

interface VehiclePhotoSectionProps {
  vehiclePhoto: string | null;
  onPhotoChange: (uri: string | null) => void;
  title?: string;
  helperText?: string;
  required?: boolean;
  /** @deprecated artık kullanılmıyor — tema turkuazına sabitlendi */
  primaryColor?: string;
  /** Yanlış belge kontrolü: araç fotoğrafı (varsayılan) ya da sigorta poliçesi */
  documentKind?: 'vehicle_photo' | 'vehicle_insurance';
}

export default function VehiclePhotoSection({
  vehiclePhoto,
  onPhotoChange,
  title = 'Vinç Fotoğrafı',
  helperText = 'Plaka görünür şekilde vinç fotoğrafı ekleyin',
  required,
  documentKind = 'vehicle_photo',
}: VehiclePhotoSectionProps) {
  return (
    <FkFormSection title={`${title}`} icon="camera-outline" required={required}>
      <FkDocumentUpload
        helperText={helperText}
        value={vehiclePhoto}
        onChange={onPhotoChange}
        imageQuality={0.8}
        verify={documentVerifier(documentKind)}
      />
    </FkFormSection>
  );
}
