import React from 'react';
import { FkLoadingOverlay } from '../../../components/fk';

interface CraneLoadingOverlayProps {
  visible: boolean;
  message?: string;
}

/** Araç/hizmet eklenirken tam ekran yükleme — ortak FkLoadingOverlay. */
export default function CraneLoadingOverlay({ visible, message = 'Vinç ekleniyor...' }: CraneLoadingOverlayProps) {
  return <FkLoadingOverlay visible={visible} title={message} subtitle="Lütfen bekleyiniz" />;
}
