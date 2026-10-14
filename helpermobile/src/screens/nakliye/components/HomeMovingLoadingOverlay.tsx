import React from 'react';
import { FkLoadingOverlay } from '../../../components/fk';

interface HomeMovingLoadingOverlayProps {
  visible: boolean;
  message?: string;
}

/** Araç/hizmet eklenirken tam ekran yükleme — ortak FkLoadingOverlay. */
export default function HomeMovingLoadingOverlay({ visible, message = 'Nakliye aracı ekleniyor...' }: HomeMovingLoadingOverlayProps) {
  return <FkLoadingOverlay visible={visible} title={message} subtitle="Lütfen bekleyiniz" />;
}
