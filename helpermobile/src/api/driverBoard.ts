import axiosInstance from './axiosConfig';
import { logger } from '../utils/logger';

/** Ana ekran panosundaki duyuru / reklam (herkese aynı içerik) */
export interface BoardItem {
    id: number;
    title: string;
    /** Kartta görünen kısa metin */
    summary: string;
    image_url?: string | null;
    /** Detay sayfası metni (düz metin) */
    body: string;
    published_at?: string | null;
    ends_at?: string | null;
    cta_label?: string | null;
    cta_url?: string | null;
}

/** Panonun altındaki buton: bir pano içeriğinin detayını açar */
export interface BoardButton {
    id: number;
    label: string;
    /** MaterialCommunityIcons adı */
    icon?: string | null;
    item_id: number;
}

export interface DriverBoard {
    items: BoardItem[];
    buttons: BoardButton[];
}

/** board: karttan, button: alt butondan detay açıldı; cta: detaydaki bağlantı butonuna basıldı */
export type BoardClickSource = 'board' | 'button' | 'cta';

const str = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const optStr = (value: unknown): string | null => str(value) || null;

function toItem(raw: any): BoardItem | null {
    const id = Number(raw?.id);
    const title = str(raw?.title);
    if (!Number.isFinite(id) || !title) return null;
    return {
        id,
        title,
        summary: str(raw.summary),
        image_url: optStr(raw.image_url),
        body: str(raw.body),
        published_at: optStr(raw.published_at),
        ends_at: optStr(raw.ends_at),
        cta_label: optStr(raw.cta_label),
        cta_url: optStr(raw.cta_url),
    };
}

function toButton(raw: any): BoardButton | null {
    const id = Number(raw?.id);
    const itemId = Number(raw?.item_id);
    const label = str(raw?.label);
    if (!Number.isFinite(id) || !Number.isFinite(itemId) || !label) return null;
    return { id, label, icon: optStr(raw.icon), item_id: itemId };
}

class DriverBoardAPI {
    /**
     * Ana ekran panosu ve butonları.
     * GET /home/driver-board/ → { items: [...], buttons: [...] } (aktif ve tarih aralığındakiler)
     */
    async getBoard(): Promise<DriverBoard> {
        const response = await axiosInstance.get('/home/driver-board/');
        const data = response.data ?? {};
        const items = Array.isArray(data.items) ? data.items : [];
        const buttons = Array.isArray(data.buttons) ? data.buttons : [];
        return {
            items: items.map(toItem).filter((i: BoardItem | null): i is BoardItem => i !== null),
            buttons: buttons.map(toButton).filter((b: BoardButton | null): b is BoardButton => b !== null),
        };
    }

    /**
     * Tıklanma sayacı (detay açılışı ya da bağlantı butonu). POST /home/driver-board/items/{id}/click/ → 204
     * Hata fırlatmaz: sayaç kaybolsa da detay / bağlantı açılır.
     */
    async trackClick(id: number, source: BoardClickSource): Promise<void> {
        try {
            await axiosInstance.post(`/home/driver-board/items/${id}/click/`, { source });
        } catch (error: any) {
            logger.debug('general', 'driverBoard.trackClick failed', { status: error?.response?.status });
        }
    }
}

export default new DriverBoardAPI();
