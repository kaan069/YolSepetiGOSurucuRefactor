export interface GuideStep {
  id: string;
  title: string;
  description: string;
  target: 'toggle' | 'tab_orders' | 'tab_earnings' | 'tab_profile' | 'location_button';
  arrowDirection: 'up' | 'down' | 'left' | 'right';
  icon: string;
}

export const guideSteps: GuideStep[] = [
  {
    id: 'toggle',
    title: 'Cevrimici / Cevrimdisi',
    description: 'Bu dugmeyi acarak cevrimici olun ve yakininizdaki is taleplerini almaya baslayin.',
    target: 'toggle',
    arrowDirection: 'up',
    icon: 'toggle-switch-outline',
  },
  {
    id: 'tab_orders',
    title: 'Isler Sekmesi',
    description: 'Bu sekmede gelen is taleplerini goreceksiniz. Teklif verin, isi kabul edin ve adim adim takip edin.',
    target: 'tab_orders',
    arrowDirection: 'down',
    icon: 'clipboard-text-outline',
  },
  {
    id: 'tab_earnings',
    title: 'Kazanc Sekmesi',
    description: 'Tamamladiginiz islerin kazancini buradan takip edebilirsiniz. Gunluk, haftalik ve aylik raporlari goruntuleyin.',
    target: 'tab_earnings',
    arrowDirection: 'down',
    icon: 'cash-multiple',
  },
  {
    id: 'tab_profile',
    title: 'Profil Sekmesi',
    description: 'Profil ayarlarinizi, araclarinizi, belgelerinizi ve sirket bilgilerinizi buradan yonetebilirsiniz.',
    target: 'tab_profile',
    arrowDirection: 'down',
    icon: 'account-cog-outline',
  },
  {
    id: 'location_button',
    title: 'Konum Butonu',
    description: 'Konumunuzu haritada bulmak ve gormek icin bu butona basin.',
    target: 'location_button',
    arrowDirection: 'left',
    icon: 'crosshairs-gps',
  },
];
