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
    title: 'Çevrimiçi / Çevrimdışı',
    description: 'Bu düğmeyi açarak çevrimiçi olun ve yakınınızdaki iş taleplerini almaya başlayın.',
    target: 'toggle',
    arrowDirection: 'up',
    icon: 'toggle-switch-outline',
  },
  {
    id: 'tab_orders',
    title: 'İşler Sekmesi',
    description: 'Bu sekmede gelen iş taleplerini göreceksiniz. Teklif verin, işi kabul edin ve adım adım takip edin.',
    target: 'tab_orders',
    arrowDirection: 'down',
    icon: 'clipboard-text-outline',
  },
  {
    id: 'tab_earnings',
    title: 'Kazanç Sekmesi',
    description: 'Tamamladığınız işlerin kazancını buradan takip edebilirsiniz. Günlük, haftalık ve aylık raporları görüntüleyin.',
    target: 'tab_earnings',
    arrowDirection: 'down',
    icon: 'cash-multiple',
  },
  {
    id: 'tab_profile',
    title: 'Profil Sekmesi',
    description: 'Profil ayarlarınızı, araçlarınızı, belgelerinizi ve şirket bilgilerinizi buradan yönetebilirsiniz.',
    target: 'tab_profile',
    arrowDirection: 'down',
    icon: 'account-cog-outline',
  },
  {
    id: 'location_button',
    title: 'Konum Butonu',
    description: 'Konumunuzu haritada bulmak ve görmek için bu butona basın.',
    target: 'location_button',
    arrowDirection: 'left',
    icon: 'crosshairs-gps',
  },
];
