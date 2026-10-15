/**
 * Yüklenen belgenin doğru alana yüklenip yüklenmediğini telefonda kontrol eder.
 *
 * Görselden yazı okunur (Android: Google ML Kit, iOS: Apple Vision — expo-text-extractor);
 * PDF ise önce ilk sayfası resme çevrilir (react-native-pdf-thumbnail). Okunan yazı
 * rules.ts'teki ifadelerle karşılaştırılır. Belgeler telefondan çıkmaz.
 *
 * Uyarı çıkan dosya alana konmaz ("yine de yükle" yok); sürücü başka dosya seçer ya da
 * WhatsApp destek hattına yazar. Kontrol yapılamazsa (native modül yok, PDF şifreli, OCR
 * hatası) dosya kabul edilir; sürücü engellenmez, admin onayı son kontroldür.
 */
import { isPdfFile } from '../fileHelpers';
import { buildSupportWhatsAppUrl } from '../../constants/support';
import { logger } from '../logger';
import { DocumentKind, evaluateDocumentText, getDocumentName } from './rules';
import type { FkUploadWarning } from '../../components/fk-upload/FkDocumentUpload';

export type { DocumentKind, DocumentWarning } from './rules';

/** PDF sayfası bu boyuttan büyük render edilmez (OCR için yeterli, bellek dostu) */
const PDF_RENDER_MAX_PX = 2000;

async function deleteTempFile(uri: string): Promise<void> {
  try {
    const { File } = await import('expo-file-system');
    new File(uri).delete();
  } catch {
    // Önbellek dosyası; silinemezse OS temizler
  }
}

/** Dosyadaki yazı; okunamazsa null (kontrol atlanır). */
async function readText(uri: string): Promise<string | null> {
  let tempImage: string | null = null;
  try {
    // Native modüller tembel yüklenir: eski build'de / Expo Go'da uygulama çökmesin
    const { extractTextFromImage, isSupported } = await import('expo-text-extractor');
    if (!isSupported) return null;

    let imageUri = uri;
    if (isPdfFile(uri)) {
      const { default: PdfThumbnail } = await import('react-native-pdf-thumbnail');
      const page = await PdfThumbnail.generate(uri, 0, {
        maxWidth: PDF_RENDER_MAX_PX,
        maxHeight: PDF_RENDER_MAX_PX,
        quality: 90,
      });
      imageUri = tempImage = page.uri;
    }

    const lines = await extractTextFromImage(imageUri);
    return lines.join('\n');
  } catch (error: any) {
    logger.debug('general', 'documentCheck.readText failed', { code: error?.code, message: error?.message });
    return null;
  } finally {
    if (tempImage) deleteTempFile(tempImage);
  }
}

/**
 * FkDocumentUpload `verify` prop'u için doğrulayıcı.
 * @example <FkDocumentUpload verify={documentVerifier('driver_license')} ... />
 */
export function documentVerifier(kind: DocumentKind) {
  return async (uri: string): Promise<FkUploadWarning | null> => {
    const text = await readText(uri);
    if (text === null) return null;
    const warning = evaluateDocumentText(text, kind);
    if (!warning) return null;
    return {
      ...warning,
      help: {
        label: 'WhatsApp Destek',
        url: buildSupportWhatsAppUrl(
          `Merhaba, ${getDocumentName(kind)} yüklerken sorun yaşıyorum; uygulama yüklediğim dosyayı kabul etmiyor. Yardım rica ederim.`,
        ),
      },
    };
  };
}
