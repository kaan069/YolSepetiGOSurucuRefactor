import axiosInstance from './axiosConfig';
import { ProfileCompletenessResponse } from './types';

// Document response interface
export interface DocumentResponse {
    id: number;
    user: number;
    user_phone: string;
    user_name: string;
    license_photo: string | null;
    tax_plate_photo: string | null;
    k_document_photo: string | null;
    verification_status: 'pending' | 'approved' | 'rejected';
    verified_at: string | null;
    rejection_reason: string | null;
    created_at: string;
    updated_at: string;
}

// URI'den MIME type belirle (PDF dahil)
function getMimeTypeFromUri(uri: string): { filename: string; mimeType: string } {
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

class DocumentsAPI {
    // Ehliyet ve vergi levhası bilgilerini getir
    async getDocuments(): Promise<DocumentResponse> {
        try {
            const response = await axiosInstance.get<DocumentResponse>('/auth/documents/license/');
            return response.data;
        } catch (error) {
            console.error('Get documents error:', error);
            throw error;
        }
    }

    // Ehliyet, vergi levhası ve K belgesi yükle
    async uploadDocuments(
        licensePhotoUri: string | null,
        taxPlatePhotoUri: string | null,
        kDocumentPhotoUri: string | null = null
    ): Promise<DocumentResponse> {
        try {
            console.log('📤 [DocumentsAPI] Upload başlıyor...');
            console.log('   • License URI:', licensePhotoUri);
            console.log('   • Tax Plate URI:', taxPlatePhotoUri);
            console.log('   • K Document URI:', kDocumentPhotoUri);

            const formData = new FormData();

            // Ehliyet fotoğrafı/dosyası ekle
            if (licensePhotoUri) {
                const { filename, mimeType } = getMimeTypeFromUri(licensePhotoUri);
                console.log('📸 [DocumentsAPI] License dosyası:', { uri: licensePhotoUri, name: filename, type: mimeType });
                formData.append('license_photo', { uri: licensePhotoUri, name: filename, type: mimeType } as any);
            }

            // Vergi levhası fotoğrafı/dosyası ekle
            if (taxPlatePhotoUri) {
                const { filename, mimeType } = getMimeTypeFromUri(taxPlatePhotoUri);
                console.log('📸 [DocumentsAPI] Tax plate dosyası:', { uri: taxPlatePhotoUri, name: filename, type: mimeType });
                formData.append('tax_plate_photo', { uri: taxPlatePhotoUri, name: filename, type: mimeType } as any);
            }

            // K belgesi fotoğrafı/dosyası ekle (opsiyonel)
            if (kDocumentPhotoUri) {
                const { filename, mimeType } = getMimeTypeFromUri(kDocumentPhotoUri);
                console.log('📸 [DocumentsAPI] K document dosyası:', { uri: kDocumentPhotoUri, name: filename, type: mimeType });
                formData.append('k_document_photo', { uri: kDocumentPhotoUri, name: filename, type: mimeType } as any);
            }

            const response = await axiosInstance.post<{ message: string; data: DocumentResponse }>(
                '/auth/documents/license/upload/',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            return response.data.data;
        } catch (error) {
            console.error('Upload documents error:', error);
            throw error;
        }
    }

    // Ehliyet belgelerini sil
    async deleteDocuments(): Promise<void> {
        try {
            await axiosInstance.delete('/auth/documents/license/delete/');
        } catch (error) {
            console.error('Delete documents error:', error);
            throw error;
        }
    }

    // Dosya validasyonu (PDF dahil)
    validateDocumentFile(uri: string, fileSizeBytes?: number): { valid: boolean; error?: string } {
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

    // Profil tamamlama durumu kontrolü
    // Check profile completeness (documents, company info, payment method)
    async checkProfileCompleteness(): Promise<ProfileCompletenessResponse> {
        try {
            const response = await axiosInstance.get<ProfileCompletenessResponse>('/profile/completeness/');
            return response.data;
        } catch (error) {
            console.error('Check profile completeness error:', error);
            throw error;
        }
    }
}

export default new DocumentsAPI();
