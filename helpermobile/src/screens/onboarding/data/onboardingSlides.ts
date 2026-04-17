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
    title: 'Yol SepetiGO\'ya Hosgeldiniz!',
    description: 'Cekici, vinc, nakliye ve yol yardim hizmetleri icin tek platform. Yakininizdaki musteri taleplerini alin, isi tamamlayin, kazancinizi goruntuleyin.',
    icon: 'steering',
    isWelcome: true,
  },
  {
    id: 'orders',
    title: 'Siparisler',
    description: 'Yakininizdaki yol yardim taleplerini aninda alin. Teklif verin, isi kabul edin ve adim adim takip edin.',
    icon: 'clipboard-text-outline',
  },
  {
    id: 'earnings',
    title: 'Kazanclar',
    description: 'Tamamladiginiz islerin kazancini anlik olarak takip edin. Gunluk, haftalik ve aylik raporlarinizi goruntuleyin.',
    icon: 'cash-multiple',
  },
  {
    id: 'location',
    title: 'Konum & Bildirimler',
    description: 'Konumunuzu paylasarak yakininizdaki is taleplerini alin. Anlik bildirimlerle yeni isleri kacirmayin.',
    icon: 'map-marker-radius',
  },
  {
    id: 'start',
    title: 'Hizmet Vermeye Baslayin!',
    description: 'Profilinizi tamamlayin, cevrimici olun ve ilk isinizi almaya hazir olun. Yol SepetiGO ile kazanmaya baslayin!',
    icon: 'rocket-launch-outline',
    isFinal: true,
  },
];
