import React from 'react';
import { FkFormSection, FkImageGrid } from '../../../../components/fk';
import { INTERIOR_PHOTO_SLOT_COUNT } from '../constants';
import { colors } from '../../../../theme/design';

interface Props {
  interiorPhotos: (string | null)[];
  onChange: (next: (string | null)[]) => void;
  /** Onaylı araç: alanlar salt okunur */
  readOnly?: boolean;
}

export default function TransferInteriorPhotosCard({ interiorPhotos, onChange, readOnly }: Props) {
  return (
    <FkFormSection
      title="Araç İçi Görselleri" icon="star-outline"
      titleColor={colors.warning[500]}
      description="Müşterilerin aracınızın içini görebilmesi için görseller ekleyin"
    >
      <FkImageGrid
        disabled={readOnly}
        slots={INTERIOR_PHOTO_SLOT_COUNT}
        value={interiorPhotos}
        slotLabelPrefix="Görsel"
        onChange={onChange}
      />
    </FkFormSection>
  );
}
