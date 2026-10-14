// İşi tamamla kartı - Nakliye iş detayı
import React from 'react';
import { Alert } from 'react-native';
import { JobCompleteCard } from '../../../components/job';

interface CompleteJobCardProps {
  visible: boolean;
}

export default function CompleteJobCard({ visible }: CompleteJobCardProps) {
  if (!visible) return null;

  const handleComplete = () => {
    Alert.alert(
      'Bilgilendirme',
      'İşi bitirebilmeniz için müşterinin takip linkinden onay vermesi gerekmektedir.',
      [{ text: 'Tamam' }]
    );
  };

  return <JobCompleteCard onComplete={handleComplete} />;
}
