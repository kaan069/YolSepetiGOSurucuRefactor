import axiosInstance from './axiosConfig';
import { InvitedUsersResponse } from './types';
import { logger } from '../utils/logger';

const logReferralError = (action: string, error: any): void => {
    const status = error?.response?.status;
    logger.error('orders', `${action} failed`, status ? { status } : undefined);
};

class ReferralAPI {
    // Davet edilen sürücülerin listesi + toplam pay özetleri
    async getInvitedUsers(): Promise<InvitedUsersResponse> {
        try {
            const response = await axiosInstance.get<InvitedUsersResponse>('/referral/invited/');
            return response.data;
        } catch (error: any) {
            logReferralError('getInvitedUsers', error);
            throw error;
        }
    }
}

export default new ReferralAPI();
