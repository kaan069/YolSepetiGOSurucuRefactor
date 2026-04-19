import axiosInstance from './axiosConfig';
import { logger } from '../utils/logger';

// Payment katmanı için güvenli error sanitizer.
// Backend error response body'sini ASLA loglamaz (kart, alias, 3DS body,
// transaction id gibi hassas alanlar içerebilir). Sadece HTTP status ve
// statik action adı loglanır.
const logPaymentError = (action: string, error: any): void => {
  const status = error?.response?.status;
  logger.error('payment', `${action} failed`, status ? { status } : undefined);
};

// =============== TYPES ===============

// Kayıtlı Kart Bilgisi
export interface SavedCard {
  id: number;
  card_alias: string;
  masked_number: string;
  bin_number: string;
  last_four: string;
  card_type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PREPAID_CARD';
  card_association: 'VISA' | 'MASTER_CARD' | 'AMERICAN_EXPRESS' | 'TROY';
  card_family: string;
  bank_name: string;
  is_default: boolean;
  created_at: string;
  last_used_at: string | null;
}

// Kart Kaydetme Request (Eski - kullanılmıyor)
export interface SaveCardRequest {
  card_holder_name: string;
  card_number: string;
  expire_month: string;
  expire_year: string;
  card_alias?: string;
  name: string;
  surname: string;
  email: string;
  identity_number: string;
  gsm_number: string;
  registration_address: string;
  city: string;
  country: string;
  zip_code: string;
}

// Kart Kaydetme Response (Eski)
export interface SaveCardResponse {
  id: number;
  card_alias: string;
  masked_number: string;
  card_type: string;
  card_association: string;
  is_default: boolean;
}

// Kart Doğrulama (1 TL) - Yeni Akış
export interface CardVerificationRequest {
  card_holder_name: string;
  card_number: string;
  expire_month: string;
  expire_year: string;
  cvc: string;
  card_alias?: string;
}

// Kart Doğrulama Durum Sorgusu
export interface CardVerificationStatus {
  id?: number;
  amount?: string;
  status: 'pending' | 'initiated' | 'completed' | 'card_saved' | 'refunded' | 'refund_failed' | 'failed' | 'no_verification';
  created_at?: string;
  initiated_at?: string;
  completed_at?: string;
  refunded_at?: string;
}

// Komisyon Ödeme - Yeni Kart
export interface CommissionPaymentNewCardRequest {
  card_info: {
    card_holder_name: string;
    card_number: string;
    expire_month: string;
    expire_year: string;
    cvc: string;
    register_card?: boolean;
  };
}

// Komisyon Ödeme - Kayıtlı Kart
export interface CommissionPaymentSavedCardRequest {
  saved_card_id?: number;
  use_default_card?: boolean;
}

// Komisyon Ödeme Durumu
export interface CommissionPaymentStatus {
  id: number;
  amount: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payment_method: 'credit_card' | 'debit_card';
  created_at: string;
  paid_at: string | null;
  error_message?: string;
}

// 3DS Response - Backend direkt HTML string donuyor
export interface ThreeDSResponse {
  html_content: string;
}

// 3DS Hata Response
export interface ThreeDSErrorResponse {
  error: string;
  error_code?: string;
}

// =============== PAYMENT API ===============

class PaymentAPI {
  // ============== KART YÖNETİMİ ==============

  /**
   * Yeni kart kaydet
   * POST /profile/cards/save/
   */
  async saveCard(cardData: SaveCardRequest): Promise<SaveCardResponse> {
    try {
      const response = await axiosInstance.post<SaveCardResponse>('/profile/cards/save/', cardData);

      return response.data;
    } catch (error: any) {
      logPaymentError('saveCard', error);
      throw error;
    }
  }

  /**
   * Kayıtlı kartları listele
   * GET /profile/cards/
   */
  async getSavedCards(): Promise<SavedCard[]> {
    try {
      const response = await axiosInstance.get<SavedCard[]>('/profile/cards/');

      return response.data || [];
    } catch (error: any) {
      logPaymentError('getSavedCards', error);
      throw error;
    }
  }

  /**
   * Kart detayını getir
   * GET /profile/cards/<card_id>/
   */
  async getCardDetail(cardId: number): Promise<SavedCard> {
    try {
      const response = await axiosInstance.get<SavedCard>(`/profile/cards/${cardId}/`);

      return response.data;
    } catch (error: any) {
      logPaymentError('getCardDetail', error);
      throw error;
    }
  }

  /**
   * Kartı sil
   * DELETE /profile/cards/<card_id>/delete/
   */
  async deleteCard(cardId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosInstance.delete(`/profile/cards/${cardId}/delete/`);

      return { success: true, message: 'Kart başarıyla silindi' };
    } catch (error: any) {
      logPaymentError('deleteCard', error);
      throw error;
    }
  }

  /**
   * Varsayılan kartı belirle
   * POST /profile/cards/<card_id>/set-default/
   */
  async setDefaultCard(cardId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosInstance.post(`/profile/cards/${cardId}/set-default/`);

      return { success: true, message: 'Varsayılan kart güncellendi' };
    } catch (error: any) {
      logPaymentError('setDefaultCard', error);
      throw error;
    }
  }

  /**
   * Kart takma adını güncelle
   * PATCH /profile/cards/<card_id>/alias/
   */
  async updateCardAlias(cardId: number, newAlias: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosInstance.patch(`/profile/cards/${cardId}/alias/`, {
        card_alias: newAlias,
      });

      return { success: true, message: 'Kart adı güncellendi' };
    } catch (error: any) {
      logPaymentError('updateCardAlias', error);
      throw error;
    }
  }

  // ============== KART DOĞRULAMA (1 TL 3DS) ==============

  /**
   * Kart doğrulama başlat (1 TL çekim + 3DS)
   * POST /payment/card-verification/initiate/
   * @returns 3DS HTML içeriği (text/html)
   */
  async initiateCardVerification(cardData: CardVerificationRequest): Promise<ThreeDSResponse> {
    try {
      const response = await axiosInstance.post(
        '/payment/card-verification/initiate/',
        cardData,
        { responseType: 'text' }
      );

      return this.parseCommissionResponse(response);
    } catch (error: any) {
      logPaymentError('initiateCardVerification', error);
      throw error;
    }
  }

  /**
   * Kart doğrulama durumunu sorgula
   * GET /payment/card-verification/status/
   */
  async getCardVerificationStatus(): Promise<CardVerificationStatus> {
    try {
      const response = await axiosInstance.get<CardVerificationStatus>(
        '/payment/card-verification/status/'
      );

      return response.data;
    } catch (error: any) {
      logPaymentError('getCardVerificationStatus', error);
      throw error;
    }
  }

  // ============== KOMİSYON ÖDEMELERİ ==============

  /**
   * Backend'den gelen response'u isle
   * Backend basarili durumda direkt HTML donuyor (text/html)
   * Hata durumunda JSON donuyor
   */
  private parseCommissionResponse(response: any): ThreeDSResponse {
    const data = response.data;
    const contentType = response.headers?.['content-type'] || '';

    // Eger content-type text/html ise, direkt HTML string gelmis demektir
    if (contentType.includes('text/html') || (typeof data === 'string' && data.includes('<'))) {
      return { html_content: typeof data === 'string' ? data : String(data) };
    }

    // JSON response (hata durumu veya farkli format)
    if (data && typeof data === 'object') {
      if (data.error) {
        throw new Error(data.error);
      }
      if (data.html_content) {
        return { html_content: data.html_content };
      }
    }

    // String ise direkt HTML kabul et
    if (typeof data === 'string') {
      return { html_content: data };
    }

    throw new Error('Beklenmedik response formati');
  }

  /**
   * Komisyon ödemesi başlat - Yeni kart ile
   * POST /payment/commission/<request_id>/initiate/
   * @returns 3DS HTML içeriği
   *
   * NOT: Backend basarili durumda HttpResponse(html, content_type='text/html') donuyor
   */
  async initiateCommissionPaymentNewCard(
    requestId: number,
    cardInfo: CommissionPaymentNewCardRequest['card_info']
  ): Promise<ThreeDSResponse> {
    try {
      const response = await axiosInstance.post(
        `/payment/commission/${requestId}/initiate/`,
        { card_info: cardInfo },
        { responseType: 'text' } // HTML response bekliyoruz
      );

      return this.parseCommissionResponse(response);
    } catch (error: any) {
      logPaymentError('initiateCommissionPaymentNewCard', error);
      throw error;
    }
  }

  /**
   * Komisyon ödemesi başlat - Kayıtlı kart ile
   * POST /payment/commission/<request_id>/initiate/
   * @returns 3DS HTML içeriği
   */
  async initiateCommissionPaymentSavedCard(
    requestId: number,
    savedCardId: number
  ): Promise<ThreeDSResponse> {
    try {
      const response = await axiosInstance.post(
        `/payment/commission/${requestId}/initiate/`,
        { saved_card_id: savedCardId },
        { responseType: 'text' } // HTML response bekliyoruz
      );

      return this.parseCommissionResponse(response);
    } catch (error: any) {
      logPaymentError('initiateCommissionPaymentSavedCard', error);
      throw error;
    }
  }

  /**
   * Komisyon ödemesi başlat - Varsayılan kart ile
   * POST /payment/commission/<request_id>/initiate/
   * @returns 3DS HTML içeriği
   */
  async initiateCommissionPaymentDefaultCard(requestId: number): Promise<ThreeDSResponse> {
    try {
      const response = await axiosInstance.post(
        `/payment/commission/${requestId}/initiate/`,
        { use_default_card: true },
        { responseType: 'text' } // HTML response bekliyoruz
      );

      return this.parseCommissionResponse(response);
    } catch (error: any) {
      logPaymentError('initiateCommissionPaymentDefaultCard', error);
      throw error;
    }
  }

  /**
   * Komisyon ödeme durumunu sorgula
   * GET /payment/commission/<request_id>/status/
   */
  async getCommissionPaymentStatus(requestId: number): Promise<CommissionPaymentStatus> {
    try {
      const response = await axiosInstance.get<CommissionPaymentStatus>(
        `/payment/commission/${requestId}/status/`
      );

      return response.data;
    } catch (error: any) {
      logPaymentError('getCommissionPaymentStatus', error);
      throw error;
    }
  }

  // ============== YARDIMCI METODLAR ==============

  /**
   * Kart numarasını formatla (görüntüleme için)
   */
  formatCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  }

  /**
   * Kart tipine göre ikon adını döndür
   */
  getCardIcon(cardAssociation: string): string {
    switch (cardAssociation) {
      case 'VISA':
        return 'credit-card';
      case 'MASTER_CARD':
        return 'credit-card';
      case 'AMERICAN_EXPRESS':
        return 'credit-card';
      case 'TROY':
        return 'credit-card';
      default:
        return 'credit-card-outline';
    }
  }

  /**
   * Kart tipine göre renk döndür
   */
  getCardColor(cardAssociation: string): string {
    switch (cardAssociation) {
      case 'VISA':
        return '#1A1F71';
      case 'MASTER_CARD':
        return '#EB001B';
      case 'AMERICAN_EXPRESS':
        return '#006FCF';
      case 'TROY':
        return '#00529B';
      default:
        return '#666';
    }
  }
}

export const paymentAPI = new PaymentAPI();
export default paymentAPI;
