import React from 'react';
import { JobCompleteCard } from '../../../components/job';

interface CompleteJobCardProps {
  visible: boolean;
  onComplete: () => void;
}

export default function CompleteJobCard({ visible, onComplete }: CompleteJobCardProps) {
  if (!visible) return null;
  return (
    <JobCompleteCard
      onComplete={onComplete}
      notice={
        'İş tamamlanması için müşterinin takip sayfasından onay vermesi gerekmektedir. ' +
        'Müşteri, takip linkinden "Aracım Teslim Noktasına Bırakıldı" butonuna bastığında iş otomatik olarak tamamlanır. ' +
        'Aracı teslim ettikten sonra müşteriye takip linkini hatırlatın ve onay vermesini bekleyin.'
      }
    />
  );
}
