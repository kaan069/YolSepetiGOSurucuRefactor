import axiosInstance from './axiosConfig';
import {
    Crane, CreateCraneRequest, UpdateCraneRequest,
    TowTruck, CreateTowTruckRequest, UpdateTowTruckRequest,
    NakliyeVehicle, CreateNakliyeVehicleRequest, UpdateNakliyeVehicleRequest,
    RoadAssistanceVehicle, CreateRoadAssistanceVehicleRequest, UpdateRoadAssistanceVehicleRequest
} from './types';
import { useVehicleStore } from '../store/useVehicleStore';
import { File as ExpoFile, Paths } from 'expo-file-system';
import { logger } from '../utils/logger';

// Vehicles katmanı için güvenli error sanitizer.
// Backend error response body'sini ASLA loglamaz (plaka, marka, model, araç
// objesi, signed document URL gibi alanlar içerebilir). Sadece HTTP status ve
// statik action adı loglanır.
const logVehiclesError = (action: string, error: any): void => {
    const status = error?.response?.status;
    logger.error('vehicles', `${action} failed`, status ? { status } : undefined);
};

// URI'den MIME type belirle (PDF dahil)
export function getMimeTypeFromUri(uri: string): { filename: string; mimeType: string } {
    let filename = uri.split('/').pop() || 'file.jpg';
    const match = /\.(\w+)$/.exec(filename);
    let mimeType = 'image/jpeg';

    if (match) {
        const ext = match[1].toLowerCase();
        if (ext === 'pdf') {
            mimeType = 'application/pdf';
        } else if (ext === 'png') {
            mimeType = 'image/png';
        } else if (ext === 'webp') {
            mimeType = 'image/webp';
        } else if (ext === 'gif') {
            mimeType = 'image/gif';
        } else {
            mimeType = 'image/jpeg';
            if (ext !== 'jpg' && ext !== 'jpeg') {
                filename = filename + '.jpg';
            }
        }
    } else {
        filename = filename + '.jpg';
    }

    return { filename, mimeType };
}

// Mevcut araç fotoğrafını cache'e indir (sadece sigorta değiştiğinde backend vehicle_photo zorunlu tuttuğu için)
export async function downloadToCache(url: string): Promise<string> {
    const filename = url.split('/').pop()?.split('?')[0] || 'vehicle_photo.jpg';
    const destination = new ExpoFile(Paths.cache, filename);
    // NOTE: URL ve dönen local cache URI hassas olabilir (signed bucket path,
    // tracking token, cihaz dosya sistemi). Loglamıyoruz.
    const downloadedFile = await ExpoFile.downloadFileAsync(url, destination);
    return downloadedFile.uri;
}

class VehiclesAPI {
    // Çekici (Tow Truck) CRUD Operations

    // Kullanıcının tüm çekicilerini getir
    async getMyTowTrucks(): Promise<TowTruck[]> {
        try {
            const response = await axiosInstance.get<TowTruck[]>('/vehicles/my-cekici/');
            return response.data;
        } catch (error) {
            logVehiclesError('getMyTowTrucks', error);
            throw error;
        }
    }

    // Yeni çekici oluştur
    async createTowTruck(data: CreateTowTruckRequest): Promise<TowTruck> {
        try {
            const response = await axiosInstance.post<TowTruck>('/vehicles/cekici/create/', data);
            return response.data;
        } catch (error) {
            logVehiclesError('createTowTruck', error);
            throw error;
        }
    }

    // Çekici güncelle
    async updateTowTruck(id: number, data: UpdateTowTruckRequest): Promise<TowTruck> {
        try {
            const response = await axiosInstance.put<TowTruck>(`/vehicles/cekici/${id}/update/`, data);
            return response.data;
        } catch (error) {
            logVehiclesError('updateTowTruck', error);
            throw error;
        }
    }

    // Çekici sil
    async deleteTowTruck(id: number): Promise<void> {
        try {
            await axiosInstance.delete(`/vehicles/cekici/${id}/delete/`);
        } catch (error) {
            logVehiclesError('deleteTowTruck', error);
            throw error;
        }
    }

    // Vinç (Crane) CRUD Operations

    // Kullanıcının tüm vinçlerini getir
    async getMyCranes(): Promise<Crane[]> {
        try {
            const response = await axiosInstance.get<Crane[]>('/vehicles/my-vinc/');
            return response.data;
        } catch (error) {
            logVehiclesError('getMyCranes', error);
            throw error;
        }
    }

    // ID'ye göre vinç getir
    async getCraneById(id: number): Promise<Crane> {
        try {
            const response = await axiosInstance.get<Crane>(`/vehicles/vinc/${id}/`);
            return response.data;
        } catch (error) {
            logVehiclesError('getCraneById', error);
            throw error;
        }
    }

    // Yeni vinç oluştur
    async createCrane(data: CreateCraneRequest): Promise<Crane> {
        try {
            const response = await axiosInstance.post<Crane>('/vehicles/vinc/create/', data);
            return response.data;
        } catch (error) {
            logVehiclesError('createCrane', error);
            throw error;
        }
    }

    // Vinç güncelle
    async updateCrane(id: number, data: UpdateCraneRequest): Promise<Crane> {
        try {
            const response = await axiosInstance.put<Crane>(`/vehicles/vinc/${id}/update/`, data);
            return response.data;
        } catch (error) {
            logVehiclesError('updateCrane', error);
            throw error;
        }
    }

    // Vinç sil
    async deleteCrane(id: number): Promise<void> {
        try {
            await axiosInstance.delete(`/vehicles/vinc/${id}/delete/`);
        } catch (error) {
            logVehiclesError('deleteCrane', error);
            throw error;
        }
    }

    // Çekici fotoğrafını getir
    async getTowTruckPhoto(cekiciId: number): Promise<any> {
        try {
            const response = await axiosInstance.get(`/vehicles/documents/cekici/${cekiciId}/`);
            return response.data;
        } catch (error) {
            // 404 hatası normaldir (fotoğraf yüklenmemişse)
            // Axios interceptor zaten hataları yönetiyor
            throw error;
        }
    }

    // Çekici fotoğrafı yükle
    async uploadTowTruckPhoto(cekiciId: number, photoUri?: string, insurancePhotoUri?: string): Promise<any> {
        try {
            const formData = new FormData();

            if (photoUri) {
                const { filename, mimeType } = getMimeTypeFromUri(photoUri);
                formData.append('vehicle_photo', { uri: photoUri, name: filename, type: mimeType } as any);
            }

            if (insurancePhotoUri) {
                const ins = getMimeTypeFromUri(insurancePhotoUri);
                formData.append('insurance_document_photo', { uri: insurancePhotoUri, name: ins.filename, type: ins.mimeType } as any);
            }

            const response = await axiosInstance.post(
                `/vehicles/documents/cekici/${cekiciId}/upload/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            logger.info('vehicles', 'uploadTowTruckPhoto ok', { status: response.status });

            return response.data;
        } catch (error: any) {
            logVehiclesError('uploadTowTruckPhoto', error);
            throw error;
        }
    }

    // Vinç fotoğrafını getir
    async getCranePhoto(vincId: number): Promise<any> {
        try {
            const response = await axiosInstance.get(`/vehicles/documents/vinc/${vincId}/`);
            return response.data;
        } catch (error) {
            // 404 hatası normaldir (fotoğraf yüklenmemişse)
            // Axios interceptor zaten hataları yönetiyor
            throw error;
        }
    }

    // Vinç fotoğrafı yükle
    async uploadCranePhoto(vincId: number, photoUri?: string, insurancePhotoUri?: string): Promise<any> {
        try {
            const formData = new FormData();

            if (photoUri) {
                const { filename, mimeType } = getMimeTypeFromUri(photoUri);
                formData.append('vehicle_photo', { uri: photoUri, name: filename, type: mimeType } as any);
            }

            if (insurancePhotoUri) {
                const ins = getMimeTypeFromUri(insurancePhotoUri);
                formData.append('insurance_document_photo', { uri: insurancePhotoUri, name: ins.filename, type: ins.mimeType } as any);
            }

            const response = await axiosInstance.post(
                `/vehicles/documents/vinc/${vincId}/upload/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            logger.info('vehicles', 'uploadCranePhoto ok', { status: response.status });

            return response.data;
        } catch (error: any) {
            logVehiclesError('uploadCranePhoto', error);
            throw error;
        }
    }

    // Dosya validasyonu (PDF dahil)
    validatePhotoFile(uri: string, fileSizeBytes?: number): { valid: boolean; error?: string } {
        // Format kontrolü
        const validFormats = ['.jpg', '.jpeg', '.png', '.pdf'];
        const hasValidFormat = validFormats.some(format =>
            uri.toLowerCase().endsWith(format)
        );

        if (!hasValidFormat) {
            return {
                valid: false,
                error: 'Geçersiz dosya formatı. Sadece JPG, JPEG, PNG ve PDF dosyaları kabul edilir.'
            };
        }

        // Boyut kontrolü (5MB = 5 * 1024 * 1024 bytes)
        if (fileSizeBytes && fileSizeBytes > 5 * 1024 * 1024) {
            const sizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
            return {
                valid: false,
                error: `Dosya boyutu 5MB'dan küçük olmalıdır. Mevcut dosya: ${sizeMB} MB`
            };
        }

        return { valid: true };
    }

    // ==================== NAKLİYE ARAÇ CRUD ====================

    // Nakliye aracı fotoğrafını getir
    async getNakliyeVehiclePhoto(nakliyeId: number): Promise<any> {
        try {
            const response = await axiosInstance.get(`/vehicles/documents/nakliye/${nakliyeId}/`);
            return response.data;
        } catch (error) {
            // 404 hatası normaldir (fotoğraf yüklenmemişse)
            throw error;
        }
    }

    // Kullanıcının tüm nakliye araçlarını getir
    async getMyNakliyeVehicles(): Promise<NakliyeVehicle[]> {
        try {
            const response = await axiosInstance.get<NakliyeVehicle[]>('/vehicles/my-nakliye/');
            return response.data;
        } catch (error) {
            logVehiclesError('getMyNakliyeVehicles', error);
            throw error;
        }
    }

    // Yeni nakliye aracı oluştur
    async createNakliyeVehicle(data: CreateNakliyeVehicleRequest): Promise<NakliyeVehicle> {
        try {
            const response = await axiosInstance.post<NakliyeVehicle>('/vehicles/nakliye/create/', data);
            return response.data;
        } catch (error) {
            logVehiclesError('createNakliyeVehicle', error);
            throw error;
        }
    }

    // Nakliye aracı güncelle
    async updateNakliyeVehicle(id: number, data: UpdateNakliyeVehicleRequest): Promise<NakliyeVehicle> {
        try {
            const response = await axiosInstance.put<NakliyeVehicle>(`/vehicles/nakliye/${id}/update/`, data);
            return response.data;
        } catch (error) {
            logVehiclesError('updateNakliyeVehicle', error);
            throw error;
        }
    }

    // Nakliye aracı sil
    async deleteNakliyeVehicle(id: number): Promise<void> {
        try {
            await axiosInstance.delete(`/vehicles/nakliye/${id}/delete/`);
        } catch (error) {
            logVehiclesError('deleteNakliyeVehicle', error);
            throw error;
        }
    }

    // Nakliye aracı fotoğrafı yükle
    async uploadNakliyeVehiclePhoto(nakliyeId: number, photoUri?: string, insurancePhotoUri?: string): Promise<any> {
        try {
            const formData = new FormData();

            if (photoUri) {
                const { filename, mimeType } = getMimeTypeFromUri(photoUri);
                formData.append('vehicle_photo', { uri: photoUri, name: filename, type: mimeType } as any);
            }

            if (insurancePhotoUri) {
                const ins = getMimeTypeFromUri(insurancePhotoUri);
                formData.append('insurance_document_photo', { uri: insurancePhotoUri, name: ins.filename, type: ins.mimeType } as any);
            }

            const response = await axiosInstance.post(
                `/vehicles/documents/nakliye/${nakliyeId}/upload/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            logger.info('vehicles', 'uploadNakliyeVehiclePhoto ok', { status: response.status });

            return response.data;
        } catch (error: any) {
            logVehiclesError('uploadNakliyeVehiclePhoto', error);
            throw error;
        }
    }

    // ==================== YOL YARDIM ARAÇ CRUD ====================

    // Yol yardım aracı fotoğrafını getir
    async getRoadAssistanceVehiclePhoto(yolYardimId: number): Promise<any> {
        try {
            const response = await axiosInstance.get(`/vehicles/documents/yol-yardim/${yolYardimId}/`);
            return response.data;
        } catch (error) {
            // 404 hatası normaldir (fotoğraf yüklenmemişse)
            throw error;
        }
    }

    // Kullanıcının tüm yol yardım araçlarını getir
    async getMyRoadAssistanceVehicles(): Promise<RoadAssistanceVehicle[]> {
        try {
            const response = await axiosInstance.get<RoadAssistanceVehicle[]>('/vehicles/my-yol-yardim/');
            return response.data;
        } catch (error) {
            logVehiclesError('getMyRoadAssistanceVehicles', error);
            throw error;
        }
    }

    // Yeni yol yardım aracı oluştur
    async createRoadAssistanceVehicle(data: CreateRoadAssistanceVehicleRequest): Promise<RoadAssistanceVehicle> {
        try {
            const response = await axiosInstance.post<RoadAssistanceVehicle>('/vehicles/yol-yardim/create/', data);
            return response.data;
        } catch (error) {
            logVehiclesError('createRoadAssistanceVehicle', error);
            throw error;
        }
    }

    // Yol yardım aracı güncelle
    async updateRoadAssistanceVehicle(id: number, data: UpdateRoadAssistanceVehicleRequest): Promise<RoadAssistanceVehicle> {
        try {
            const response = await axiosInstance.put<RoadAssistanceVehicle>(`/vehicles/yol-yardim/${id}/update/`, data);
            return response.data;
        } catch (error) {
            logVehiclesError('updateRoadAssistanceVehicle', error);
            throw error;
        }
    }

    // Yol yardım aracı sil
    async deleteRoadAssistanceVehicle(id: number): Promise<void> {
        try {
            await axiosInstance.delete(`/vehicles/yol-yardim/${id}/delete/`);
        } catch (error) {
            logVehiclesError('deleteRoadAssistanceVehicle', error);
            throw error;
        }
    }

    // Yol yardım aracı fotoğrafı yükle
    async uploadRoadAssistanceVehiclePhoto(yolYardimId: number, photoUri?: string, insurancePhotoUri?: string): Promise<any> {
        try {
            const formData = new FormData();

            if (photoUri) {
                const { filename, mimeType } = getMimeTypeFromUri(photoUri);
                formData.append('vehicle_photo', { uri: photoUri, name: filename, type: mimeType } as any);
            }

            if (insurancePhotoUri) {
                const ins = getMimeTypeFromUri(insurancePhotoUri);
                formData.append('insurance_document_photo', { uri: insurancePhotoUri, name: ins.filename, type: ins.mimeType } as any);
            }

            const response = await axiosInstance.post(
                `/vehicles/documents/yol-yardim/${yolYardimId}/upload/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            logger.info('vehicles', 'uploadRoadAssistanceVehiclePhoto ok', { status: response.status });

            return response.data;
        } catch (error: any) {
            logVehiclesError('uploadRoadAssistanceVehiclePhoto', error);
            throw error;
        }
    }

    // ==================== TRANSFER ARAÇ ====================

    async createTransferVehicle(data: {
        brand: string;
        model: string;
        year: number;
        plate_number: string;
        transfer_type: string;
        passenger_capacity: number;
        vehicle_class: string;
    }): Promise<any> {
        try {
            const response = await axiosInstance.post('/vehicles/transfer/create/', data);
            return response.data;
        } catch (error) {
            logVehiclesError('createTransferVehicle', error);
            throw error;
        }
    }

    async uploadTransferVehiclePhoto(transferId: number, photoUri: string): Promise<any> {
        try {
            const formData = new FormData();
            formData.append('vehicle_photo', {
                uri: photoUri,
                type: 'image/jpeg',
                name: 'vehicle_photo.jpg',
            } as any);
            const response = await axiosInstance.post(
                `/vehicles/documents/transfer/${transferId}/upload/`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            return response.data;
        } catch (error) {
            logVehiclesError('uploadTransferVehiclePhoto', error);
            throw error;
        }
    }

    async uploadTransferVehicleDocuments(transferId: number, formData: FormData): Promise<any> {
        try {
            const response = await axiosInstance.post(
                `/vehicles/documents/transfer/${transferId}/upload/`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            return response.data;
        } catch (error) {
            logVehiclesError('uploadTransferVehicleDocuments', error);
            throw error;
        }
    }

    // Transfer aracı güncelle
    async updateTransferVehicle(transferId: number, data: {
        brand: string;
        model: string;
        year: number;
        plate_number: string;
        transfer_type: string;
        passenger_capacity: number;
        vehicle_class: string;
    }): Promise<any> {
        try {
            const response = await axiosInstance.patch(`/vehicles/transfer/${transferId}/update/`, data);
            return response.data;
        } catch (error) {
            logVehiclesError('updateTransferVehicle', error);
            throw error;
        }
    }

    // Transfer aracı sil
    async deleteTransferVehicle(transferId: number): Promise<void> {
        try {
            await axiosInstance.delete(`/vehicles/transfer/${transferId}/delete/`);
        } catch (error) {
            logVehiclesError('deleteTransferVehicle', error);
            throw error;
        }
    }

    // Transfer araç belge/fotoğraflarını getir
    async getTransferVehicleDocuments(transferId: number): Promise<any> {
        try {
            const response = await axiosInstance.get(`/vehicles/documents/transfer/${transferId}/`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Kullanıcının tüm transfer araçlarını getir
    async getMyTransferVehicles(): Promise<any[]> {
        try {
            const response = await axiosInstance.get<any[]>('/vehicles/my-transfer/');
            return response.data;
        } catch (error) {
            logVehiclesError('getMyTransferVehicles', error);
            throw error;
        }
    }

    // ==================== GENEL METODLAR ====================

    // Kullanıcının tüm araçlarını yükle ve store'a kaydet
    async loadUserVehicles(): Promise<void> {
        try {
            // Nakliye ve Yol Yardım API'leri henüz hazır olmayabilir, hata durumunda boş array döndür
            const [towTrucks, cranes, nakliyeVehicles, roadAssistanceVehicles, transferVehicles] = await Promise.all([
                this.getMyTowTrucks().catch(() => []),
                this.getMyCranes().catch(() => []),
                this.getMyNakliyeVehicles().catch(() => []),
                this.getMyRoadAssistanceVehicles().catch(() => []),
                this.getMyTransferVehicles().catch(() => [])
            ]);

            // Clear existing vehicles and load from backend
            useVehicleStore.getState().clearAll();

            // Add tow trucks from backend to store
            towTrucks.forEach(truck => {
                const store = useVehicleStore.getState();
                const existingIndex = store.towTrucks.findIndex(t => t.plate === truck.plate_number);

                const towTruckData = {
                    id: truck.id?.toString() || Date.now().toString(),
                    plate: truck.plate_number,
                    brand: truck.brand,
                    model: truck.model,
                    year: truck.year.toString(),
                    color: truck.color,
                    platformType: 'open' as const,
                    supportedVehicleTypes: truck.availibility_vehicles_types || [],
                };

                if (existingIndex === -1) {
                    useVehicleStore.setState(state => ({
                        towTrucks: [...state.towTrucks, towTruckData]
                    }));
                }
            });

            // Add cranes from backend to store
            cranes.forEach(crane => {
                const store = useVehicleStore.getState();
                const existingIndex = store.cranes.findIndex(c => c.plate === crane.plate_number);

                const craneData = {
                    id: crane.id?.toString() || Date.now().toString(),
                    plate: crane.plate_number,
                    brand: crane.brand,
                    model: crane.model,
                    year: crane.year.toString(),
                    color: crane.color,
                    maxHeight: crane.max_height.toString(),
                };

                if (existingIndex === -1) {
                    useVehicleStore.setState(state => ({
                        cranes: [...state.cranes, craneData]
                    }));
                }
            });

            // Add nakliye vehicles from backend to store
            // Backend alanları: brand, model, year, plate_number, vehicle_type, vehicle_type_display, capacity_type, max_volume, max_weight, has_helper
            nakliyeVehicles.forEach(vehicle => {
                const store = useVehicleStore.getState();
                const existingIndex = store.homeMoving.findIndex(v => v.plate === vehicle.plate_number);

                // capacity_type'ı vehicleType'a dönüştür
                const vehicleTypeMap: Record<string, 'van' | 'small-truck' | 'truck' | 'large-truck'> = {
                    'small': 'van',
                    'medium': 'small-truck',
                    'large': 'truck'
                };

                const nakliyeData = {
                    id: vehicle.id?.toString() || Date.now().toString(),
                    plate: vehicle.plate_number,
                    brand: vehicle.brand,
                    model: vehicle.model,
                    year: vehicle.year.toString(),
                    vehicleType: vehicleTypeMap[vehicle.capacity_type] || 'truck',
                    movingVehicleType: vehicle.vehicle_type, // Backend'den gelen nakliye araç tipi
                    movingVehicleTypeDisplay: vehicle.vehicle_type_display, // Backend'den gelen görüntüleme adı
                    capacity: (vehicle.max_weight / 1000).toString(), // kg to ton
                    volume: vehicle.max_volume.toString(),
                    length: '',
                    width: '',
                    height: '',
                    hasLift: false,
                    hasRamp: false,
                    equipment: [],
                    hasHelper: vehicle.has_helper,
                    helperCount: vehicle.has_helper ? '1' : '0',
                    pricePerKm: '',
                    pricePerHour: '',
                    minPrice: '',
                };

                if (existingIndex === -1) {
                    useVehicleStore.setState(state => ({
                        homeMoving: [...state.homeMoving, nakliyeData]
                    }));
                }
            });

            // Add road assistance vehicles from backend to store
            // Backend alanları: brand, model, year, plate_number, available_services
            roadAssistanceVehicles.forEach(vehicle => {
                const store = useVehicleStore.getState();
                const existingIndex = store.roadAssistance.findIndex(v => v.id === vehicle.id?.toString());

                // Backend'deki service key'lerini Türkçe'ye çevir
                const serviceLabels: Record<string, string> = {
                    'tire_change': 'Lastik Değişimi',
                    'battery_boost': 'Akü Takviyesi',
                    'fuel_delivery': 'Yakıt İkmali',
                    'lockout': 'Araç Kilit Açma',
                    'minor_repair': 'Küçük Tamirat'
                };

                const roadAssistanceData = {
                    id: vehicle.id?.toString() || Date.now().toString(),
                    // Araç bilgileri (Backend'den gelen)
                    plate: vehicle.plate_number || '',
                    brand: vehicle.brand || '',
                    model: vehicle.model || '',
                    year: vehicle.year?.toString() || '',
                    // Hizmet bilgileri
                    services: (vehicle.available_services || []).map((s: string) => serviceLabels[s] || s),
                    pricePerService: '',
                    pricePerKm: '',
                    workingAreas: [],
                    is24Hours: true,
                    workingHoursStart: undefined,
                    workingHoursEnd: undefined,
                };

                if (existingIndex === -1) {
                    useVehicleStore.setState(state => ({
                        roadAssistance: [...state.roadAssistance, roadAssistanceData]
                    }));
                }
            });

            // Add transfer vehicles to store
            transferVehicles.forEach((vehicle: any) => {
                const store = useVehicleStore.getState();
                const existingIndex = store.transfers.findIndex(t => t.plate === vehicle.plate_number);

                const transferData = {
                    id: vehicle.id?.toString() || Date.now().toString(),
                    plate: vehicle.plate_number || '',
                    brand: vehicle.brand || '',
                    model: vehicle.model || '',
                    year: vehicle.year?.toString() || '',
                    transferType: vehicle.transfer_type || 'vip',
                    passengerCapacity: vehicle.passenger_capacity || 0,
                    vehicleClass: vehicle.vehicle_class || '',
                };

                if (existingIndex === -1) {
                    useVehicleStore.setState(state => ({
                        transfers: [...state.transfers, transferData]
                    }));
                }
            });

            // Sadece count'lar loglanır; brand/model/plate (PII) loglanmaz.
            logger.info('vehicles', 'loadUserVehicles ok', {
                towTrucks: towTrucks.length,
                cranes: cranes.length,
                nakliye: nakliyeVehicles.length,
                roadAssistance: roadAssistanceVehicles.length,
                transfer: transferVehicles.length,
            });
        } catch (error) {
            logVehiclesError('loadUserVehicles', error);
            throw error;
        }
    }
}

export default new VehiclesAPI();
