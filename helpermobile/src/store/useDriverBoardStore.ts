/**
 * Ana ekran panosu (duyuru / reklam) ve butonları.
 *
 * Son yanıt AsyncStorage'da tutulur: açılışta pano hemen görünür, ekran önce tam harita
 * açılıp sonra bölünmez. Backend ucu yoksa (404) liste boşalır ve ana ekran tam haritaya döner.
 */
import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import driverBoardAPI, { BoardButton, BoardItem } from '../api/driverBoard';
import { logger } from '../utils/logger';

/** Ana ekran her odaklandığında bundan sık istek atılmaz */
const REFRESH_MIN_GAP_MS = 5 * 60 * 1000;
/** Butonlar tek satırda; fazlası gösterilmez */
const MAX_BUTTONS = 4;

interface DriverBoardState {
  items: BoardItem[];
  buttons: BoardButton[];
  fetchedAt: number | null;
  refresh: (options?: { force?: boolean }) => Promise<void>;
}

let refreshInFlight: Promise<void> | null = null;

export const useDriverBoardStore = create<DriverBoardState>()(
  persist(
    (set, get) => ({
      items: [],
      buttons: [],
      fetchedAt: null,

      refresh: (options) => {
        const { fetchedAt } = get();
        if (!options?.force && fetchedAt && Date.now() - fetchedAt < REFRESH_MIN_GAP_MS) {
          return Promise.resolve();
        }
        if (refreshInFlight) return refreshInFlight;

        refreshInFlight = (async () => {
          try {
            const board = await driverBoardAPI.getBoard();
            set({ items: board.items, buttons: board.buttons, fetchedAt: Date.now() });
          } catch (error: any) {
            const status = error?.response?.status;
            if (status === 404) {
              // Uç henüz yayında değil: eski (tam harita) düzen
              set({ items: [], buttons: [], fetchedAt: Date.now() });
              return;
            }
            // Ağ / sunucu hatası: önbellekteki pano kalır, sonraki odakta tekrar denenir
            logger.warn('general', 'driverBoard.refresh failed', { status });
          } finally {
            refreshInFlight = null;
          }
        })();
        return refreshInFlight;
      },
    }),
    {
      name: 'driver-board-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items, buttons: state.buttons, fetchedAt: state.fetchedAt }),
    },
  ),
);

const isExpired = (item: BoardItem, now: number): boolean => {
  if (!item.ends_at) return false;
  const endsAt = new Date(item.ends_at).getTime();
  return Number.isFinite(endsAt) && endsAt < now;
};

/** Gösterilecek içerik ve butonlar: süresi geçen içerik ve hedefi olmayan buton düşer */
export function useDriverBoard(): { items: BoardItem[]; buttons: BoardButton[] } {
  const rawItems = useDriverBoardStore((s) => s.items);
  const rawButtons = useDriverBoardStore((s) => s.buttons);

  return useMemo(() => {
    const now = Date.now();
    const items = rawItems.filter((item) => !isExpired(item, now));
    const ids = new Set(items.map((item) => item.id));
    const buttons = rawButtons.filter((button) => ids.has(button.item_id)).slice(0, MAX_BUTTONS);
    return { items, buttons };
  }, [rawItems, rawButtons]);
}

/** Detay sayfası: içerik store'dan okunur (süresi geçmişse de açılır, listeden düşmüş olabilir) */
export function useBoardItem(itemId: number): BoardItem | undefined {
  return useDriverBoardStore((s) => s.items.find((item) => item.id === itemId));
}
