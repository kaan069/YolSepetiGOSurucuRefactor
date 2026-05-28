import React from 'react';
import { FkFormSection, FkImageGrid } from '../../../../components/fk';
import { INTERIOR_PHOTO_SLOT_COUNT } from '../constants';

interface Props {
  interiorPhotos: (string | null)[];
  onChange: (next: (string | null)[]) => void;
}

export default function TransferInteriorPhotosCard({ interiorPhotos, onChange }: Props) {
  return (
    <FkFormSection
      title="⭐ Araç İçi Görselleri"
      titleColor="#FFB300"
      description="Müşterilerin aracınızın içini görebilmesi için görseller ekleyin"
    >
      <FkImageGrid
        slots={INTERIOR_PHOTO_SLOT_COUNT}
        value={interiorPhotos}
        slotLabelPrefix="Görsel"
        onChange={onChange}
      />
    </FkFormSection>
  );
}
