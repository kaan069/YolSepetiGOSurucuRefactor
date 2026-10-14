// Konum kartı - Nakliye iş detayı (Alış/Teslim noktası)
import React from 'react';
import { JobLocationCard } from '../../../components/job';

interface LocationCardProps {
  type: 'pickup' | 'dropoff';
  // Backend detay response'larında adres alanı opsiyonel olabildiğinden
  // prop da opsiyonel tutulur; render'da 'Adres belirtilmemiş' fallback'i var.
  address?: string;
  latitude: number;
  longitude: number;
  // Backend sayısal alanları string olarak da dönebildiği için (ör. floor_from: "3")
  // prop'u gevşetiyoruz; render <Text> içinde stringleştirme otomatik.
  floor?: number | string | null;
  hasElevator?: boolean;
  visible: boolean;
  showDirectionsButton?: boolean;
}

export default function LocationCard({
  type,
  address,
  latitude,
  longitude,
  floor,
  hasElevator,
  visible,
  showDirectionsButton = true,
}: LocationCardProps) {
  if (!visible) return null;

  const isPickup = type === 'pickup';
  const title = isPickup ? 'Alış Noktası' : 'Teslim Noktası';
  const detail =
    floor !== undefined && floor !== null
      ? `Kat: ${floor} ${hasElevator ? '(Asansör var)' : '(Asansör yok)'}`
      : undefined;

  return (
    <JobLocationCard
      title={title}
      icon={isPickup ? 'map-marker-outline' : 'map-marker-check-outline'}
      points={[
        {
          type,
          address,
          latitude,
          longitude,
          detail,
          directionsLabel: showDirectionsButton ? `${title}na Yol Tarifi` : undefined,
        },
      ]}
    />
  );
}
