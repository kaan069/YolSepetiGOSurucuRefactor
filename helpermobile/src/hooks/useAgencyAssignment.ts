/**
 * Teklif ekranında acente ataması.
 *
 * - Ekran açılınca bekleyen atamalar senkronlanır (bildirim kaçırılmış olabilir).
 * - Atama görüldükten sonra store'dan silinse bile ekranda kalır (snapshot);
 *   böylece süre dolunca "Süre doldu" görünür ve teklif butonu kilitli kalır.
 * - Kapanma olayı (süre doldu / geri alındı) gelirse bilgi verilip ekran kapanır.
 *   Talep pazaryerine açıldıysa ekran açık kalır, sürücü normal teklif verebilir.
 * - Store'da bu talep için atama yoksa hiçbir şey yapmaz; ekran bugünkü gibi çalışır.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import agencyAssignmentsAPI from '../api/agencyAssignments';
import {
  AgencyAssignmentInfo,
  getAgencyClosedText,
  syncAgencyAssignments,
  useAgencyAssignmentStore,
} from '../store/useAgencyAssignmentStore';
import { logger } from '../utils/logger';

export interface AgencyAssignmentState {
  /** Ekrandaki atama (yoksa null — bant gösterilmez) */
  assignment: AgencyAssignmentInfo | null;
  /** Yanıt süresi doldu: teklif gönderilemez */
  expired: boolean;
  declining: boolean;
  decline: () => void;
  /** Teklif başarılı: atama kapanır, sonrası bugünkü akış */
  markOffered: () => void;
  /** Teklif ucundan gelen 403 AGENCY_ASSIGNMENT_REQUIRED'ı işler; işlendiyse true */
  handleOfferError: (error: any) => boolean;
}

export function useAgencyAssignment(requestId: number | null | undefined): AgencyAssignmentState {
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
      `${agencyName} tarafından size atanan bu işi reddetmek istediğinize emin misiniz?`,
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
      const data = error?.response?.data;
      if (error?.response?.status !== 403 || data?.errorCode !== 'AGENCY_ASSIGNMENT_REQUIRED') return false;
      logger.info('orders', 'offer rejected: agency assignment required', { requestId: id });
      if (id) clearAssignment(id);
      setSnapshot(null);
      Alert.alert('Bu İş Artık Size Atanmış Değil', data?.error || 'Bu talep bir acente tarafından başka bir sürücüye atanmış.', [
        { text: 'Tamam', onPress: leave },
      ]);
      return true;
    },
    [id, clearAssignment, leave],
  );

  return { assignment, expired: !!assignment && expired, declining, decline, markOffered, handleOfferError };
}
