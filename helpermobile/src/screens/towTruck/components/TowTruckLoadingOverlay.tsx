import React from 'react';
import { FkLoadingOverlay } from '../../../components/fk';

interface TowTruckLoadingOverlayProps {
  visible: boolean;
  message?: string;
}

/** Araç/hizmet eklenirken tam ekran yükleme — ortak FkLoadingOverlay. */
export default function TowTruckLoadingOverlay({ visible, message = 'Çekici ekleniyor...' }: TowTruckLoadingOverlayProps) {
  return <FkLoadingOverlay visible={visible} title={message} subtitle="Lütfen bekleyiniz" />;
}
