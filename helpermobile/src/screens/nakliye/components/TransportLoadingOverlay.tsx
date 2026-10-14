import React from 'react';
import { FkLoadingOverlay } from '../../../components/fk';

interface TransportLoadingOverlayProps {
  visible: boolean;
  message?: string;
}

/** Araç/hizmet eklenirken tam ekran yükleme — ortak FkLoadingOverlay. */
export default function TransportLoadingOverlay({ visible, message = 'Nakliye aracı ekleniyor...' }: TransportLoadingOverlayProps) {
  return <FkLoadingOverlay visible={visible} title={message} subtitle="Lütfen bekleyiniz" />;
}
