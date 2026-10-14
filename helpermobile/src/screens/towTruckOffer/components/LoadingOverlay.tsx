/**
 * LoadingOverlay Component
 *
 * Teklif gönderilirken tam ekran loading gösterir (ortak FkLoadingOverlay).
 */
import React from 'react';
import { FkLoadingOverlay } from '../../../components/fk';

interface LoadingOverlayProps {
  /** Gösterilecek ana metin */
  title?: string;
  /** Gösterilecek alt metin */
  subtitle?: string;
}

export default function LoadingOverlay({
  title = 'Teklif gönderiliyor...',
  subtitle = 'Lütfen bekleyiniz',
}: LoadingOverlayProps) {
  return <FkLoadingOverlay title={title} subtitle={subtitle} />;
}
