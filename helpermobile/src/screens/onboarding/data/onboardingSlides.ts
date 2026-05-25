export interface OnboardingSlideData {
  id: string;
  title: string;
  description: string;
  icon: string;
  isWelcome?: boolean;
  isFinal?: boolean;
}

export const onboardingSlides: OnboardingSlideData[] = [
  {
    id: 'welcome',
    title: 'Yol SepetiGO\'ya Hoşgeldiniz!',
    description: 'Çekici, vinç, nakliye ve yol yardım hizmetleri için tek platform. Yakınınızdaki müşteri taleplerini alın, işi tamamlayın, kazancınızı görüntüleyin.',
    icon: 'steering',
    isWelcome: true,
  },
  {
    id: 'orders',
    title: 'Siparişler',
    description: 'Yakınınızdaki yol yardım taleplerini anında alın. Teklif verin, işi kabul edin ve adım adım takip edin.',
    icon: 'clipboard-text-outline',
  },
  {
    id: 'earnings',
    title: 'Kazançlar',
    description: 'Tamamladığınız işlerin kazancını anlık olarak takip edin. Günlük, haftalık ve aylık raporlarınızı görüntüleyin.',
    icon: 'cash-multiple',
  },
  {
    id: 'location',
    title: 'Konum & Bildirimler',
    description: 'Konumunuzu paylaşarak yakınınızdaki iş taleplerini alın. Anlık bildirimlerle yeni işleri kaçırmayın.',
    icon: 'map-marker-radius',
  },
  {
    id: 'start',
    title: 'Hizmet Vermeye Başlayın!',
    description: 'Profilinizi tamamlayın, çevrimiçi olun ve ilk işinizi almaya hazır olun. Yol SepetiGO ile kazanmaya başlayın!',
    icon: 'rocket-launch-outline',
    isFinal: true,
  },
];
