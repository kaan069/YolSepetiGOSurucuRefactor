import React from 'react';
import { FkLoadingOverlay } from '../../../components/fk';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

/** Araç/hizmet eklenirken tam ekran yükleme — ortak FkLoadingOverlay. */
export default function LoadingOverlay({ visible, message = 'Yol yardım hizmeti ekleniyor...' }: LoadingOverlayProps) {
  return <FkLoadingOverlay visible={visible} title={message} subtitle="Lütfen bekleyiniz" />;
}
