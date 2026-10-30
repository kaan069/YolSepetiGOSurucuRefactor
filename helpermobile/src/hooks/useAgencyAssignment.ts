/**
 * Teklif ekranında acente ataması.
 *
 * - Ekran açılınca bekleyen atamalar senkronlanır (bildirim kaçırılmış olabilir).
 * - Atama görüldükten sonra store'dan silinse bile ekranda kalır (snapshot);
 *   böylece süre dolunca "Süre doldu" görünür ve teklif butonu kilitli kalır.
 * - Kapanma olayı (süre doldu / geri alındı) gelirse bilgi verilip ekran kapanır.
 *   Talep pazaryerine açıldıysa ekran açık kalır, sürücü normal teklif verebilir.
 * - Store'da bu talep için atama yoksa hiçbir şey yapmaz; ekran bugünkü gibi çalışır.
 * - Acente ödemeli işte (payer != customer) teklif yoktur: ekran fiyat alanını gizler,
 *   sabit ücretle Kabul / Reddet gösterir. Kabul 201 in_progress döner, ödeme adımı yoktur.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import agencyAssignmentsAPI from '../api/agencyAssignments';
import type { PayerFields } from '../api/types';
import {
  AgencyAssignmentInfo,
  getAgencyClosedText,
  syncAgencyAssignments,
  useAgencyAssignmentStore,
} from '../store/useAgencyAssignmentStore';
import { logger } from '../utils/logger';
import { formatAgreedPrice, isAgencyPaid } from '../utils/agencyPaid';
import { getJobDetailNavigation, OfferServiceKey } from '../utils/notificationNavigation';

export interface AgencyAssignmentState {
  /** Ekrandaki atama (yoksa null — bant gösterilmez) */
  assignment: AgencyAssignmentInfo | null;
  /** Yanıt süresi doldu: teklif gönderilemez */
  expired: boolean;
  declining: boolean;
  decline: () => void;
  /** Teklif başarılı: atama kapanır, sonrası bugünkü akış */
  markOffered: () => void;
  /** Teklif ucundan gelen atama hatalarını (403 / 409) işler; işlendiyse true */
  handleOfferError: (error: any) => boolean;
  /** Acente ödemeli iş: fiyat sabit, Kabul / Reddet */
  paid: boolean;
  /** Sabit ücret (metin, örn. "1850.00"); müşteri ödemeli işte null */
  agreedPrice: string | null;
  /** Kabul onayı: iş hemen başladığı için yanlış dokunuşa karşı sorulur */
  confirmAccept: (onConfirm: () => void) => void;
  /** Kabul sonrası devam eden iş ekranını açar (komisyon ödemesi yoktur) */
  openAcceptedJob: (service: OfferServiceKey) => void;
}

/** request: talep detayı; atama listesi gelmeden de ödeyen bilgisi okunabilsin diye */
export function useAgencyAssignment(
  requestId: number | null | undefined,
  request?: PayerFields | null,
): AgencyAssignmentState {
  const navigation = useNavigation();
  const id = requestId && Number.isFinite(requestId) ? requestId : null;

  const fromStore = useAgencyAssignmentStore((s) => (id ? s.active[id] : undefined));
  const lastClosed = useAgencyAssignmentStore((s) => s.lastClosed);
  const clearAssignment = useAgencyAssignmentStore((s) => s.clearAssignment);
  const setViewing = useAgencyAssignmentStore((s) => s.setViewing);

  const [snapshot, setSnapshot] = useState<AgencyAssignmentInfo | null>(null);
  const [expired, setExpired] = useState(false);
  const [declining, setDeclining] = useState(false);
  const mountedAt = useRef(Date.now());
  const leftRef = useRef(false);

  const assignment = fromStore ?? snapshot;
  const paid = isAgencyPaid(assignment?.payer ?? request?.payer);
  const agreedPrice = paid ? (assignment?.agreedPrice ?? request?.agreed_price ?? null) : null;

  useEffect(() => {
    if (fromStore) setSnapshot(fromStore);
  }, [fromStore]);

  // Ekran açılınca senkronla + global atama kartını bu talep için gizle
  useEffect(() => {
    if (!id) return;
    syncAgencyAssignments();
    setViewing(id);
    return () => {
      if (useAgencyAssignmentStore.getState().viewingRequestId === id) setViewing(null);
    };
  }, [id, setViewing]);

  // Süre dolunca teklif kilitlenir (kesin karar backend'de; cihaz saati sapabilir)
  const expiresAt = assignment?.expiresAt;
  useEffect(() => {
    if (!expiresAt) {
      setExpired(false);
      return;
    }
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (!Number.isFinite(ms) || ms <= 0) {
      setExpired(true);
      return;
    }
    setExpired(false);
    const timer = setTimeout(() => setExpired(true), ms);
    return () => clearTimeout(timer);
  }, [expiresAt]);

  const leave = useCallback(() => {
    if (leftRef.current) return;
    leftRef.current = true;
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  // Kapanma olayı (push): süre doldu / geri alındı
  useEffect(() => {
    if (!id || !lastClosed || lastClosed.requestId !== id) return;
    if (lastClosed.at < mountedAt.current || !snapshot) return;

    if (lastClosed.reason === 'opened_to_marketplace') {
      setSnapshot(null);
      Alert.alert(
        'Talep Tüm Sürücülere Açıldı',
        'Acente bu talebi pazaryerine açtı. İsterseniz teklif vermeye devam edebilirsiniz.',
      );
      return;
    }

    const { title, message } = getAgencyClosedText(lastClosed.type, lastClosed.reason);
    Alert.alert(title, message, [{ text: 'Tamam', onPress: leave }], { cancelable: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastClosed?.at]);

  const decline = useCallback(() => {
    if (!id || !assignment) return;
    const { assignmentId, agencyName } = assignment;
    Alert.alert(
      'Atamayı Reddet',
      `${agencyName} tarafından gönderilen bu işi reddetmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Reddet',
          style: 'destructive',
          onPress: async () => {
            setDeclining(true);
            try {
              await agencyAssignmentsAPI.decline(assignmentId);
              clearAssignment(id);
              setSnapshot(null);
              leave();
            } catch (error: any) {
              const status = error?.response?.status;
              if (status === 409 || status === 404) {
                clearAssignment(id);
                setSnapshot(null);
                Alert.alert('Bilgi', 'Bu atama artık geçerli değil.', [{ text: 'Tamam', onPress: leave }]);
              } else {
                Alert.alert('Hata', error?.response?.data?.error || 'Atama reddedilemedi. Lütfen tekrar deneyin.');
              }
            } finally {
              setDeclining(false);
            }
          },
        },
      ],
    );
  }, [id, assignment, clearAssignment, leave]);

  const markOffered = useCallback(() => {
    if (!id) return;
    clearAssignment(id);
    setSnapshot(null);
  }, [id, clearAssignment]);

  const handleOfferError = useCallback(
    (error: any): boolean => {
      const status = error?.response?.status;
      const code = error?.response?.data?.errorCode;
      const text =
        status === 409 && code === 'JOB_TAKEN'
          ? { title: 'İş Alındı', message: 'Bu iş başka bir sürücü tarafından alındı.' }
          : status === 409 && code === 'ASSIGNMENT_NOT_ACTIVE'
            ? { title: 'Atama Geçersiz', message: 'Bu atama artık geçerli değil.' }
            : status === 403 && code === 'AGENCY_ASSIGNMENT_REQUIRED'
              ? { title: 'Atama Sona Erdi', message: 'Bu iş artık size atanmış değil.' }
              : null;
      if (!text) return false;
      logger.info('orders', 'offer rejected by agency assignment', { requestId: id, code });
      if (id) clearAssignment(id);
      setSnapshot(null);
      Alert.alert(text.title, text.message, [{ text: 'Tamam', onPress: leave }]);
      return true;
    },
    [id, clearAssignment, leave],
  );

  const confirmAccept = useCallback(
    (onConfirm: () => void) => {
      const price = formatAgreedPrice(agreedPrice);
      Alert.alert(
        'İşi Kabul Et',
        `${price ? `Bu işi ${price} ücretle` : 'Bu işi'} kabul ediyorsunuz. Ücreti acente öder ve iş hemen başlar.`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Kabul Et', onPress: onConfirm },
        ],
      );
    },
    [agreedPrice],
  );

  const openAcceptedJob = useCallback(
    (service: OfferServiceKey) => {
      if (!id) return;
      leftRef.current = true;
      const target = getJobDetailNavigation(service, id);
      (navigation as any).replace(target.screen, target.params);
    },
    [id, navigation],
  );

  return {
    assignment,
    expired: !!assignment && expired,
    declining,
    decline,
    markOffered,
    handleOfferError,
    paid,
    agreedPrice,
    confirmAccept,
    openAcceptedJob,
  };
}
