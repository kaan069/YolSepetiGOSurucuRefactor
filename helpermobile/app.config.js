// Dinamik Expo yapılandırması.
//
// Statik ayarların tamamı app.json'dan gelir (yapı orada korunur); burada
// yalnızca ortam-bağımlı / gizli değerleri .env üzerinden enjekte ediyoruz.
// Expo (SDK 49+) proje kökündeki .env dosyasını otomatik yükler, bu yüzden
// ekstra bir bağımlılığa (dotenv) gerek yoktur.
//
// Not: Bu anahtar native derleme sırasında AndroidManifest'e gömülür; yani
// build zamanı bir değerdir, uygulama JS bundle'ına EXPO_PUBLIC_ ile sızmaz.

module.exports = ({ config }) => {
  // Önce .env'den oku; yoksa app.json'da kalan değere düş (şu an boş).
  const googleMapsApiKey =
    process.env.GOOGLE_MAPS_API_KEY || config.android?.config?.googleMaps?.apiKey || '';

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          ...config.android?.config?.googleMaps,
          apiKey: googleMapsApiKey,
        },
      },
    },
  };
};
