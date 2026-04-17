// API: Puanlama ve Yorumlar - Ratings and Reviews API
import axiosInstance from './axiosConfig';

export interface RatingDistribution {
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

export interface RatingStats {
  total_ratings: number;
  average_rating: string;
  rating_distribution: RatingDistribution;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  customer_name: string;
  created_at: string;
}

export interface MyRatingsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  stats: RatingStats;
  results: Review[];
}

const ratingsAPI = {
  // Giriş yapmış sürücünün kendi puanlama istatistikleri ve yorumları
  // Get logged-in driver's own rating statistics and reviews (JWT auth required)
  getMyRatings: async (): Promise<MyRatingsResponse> => {
    const response = await axiosInstance.get<MyRatingsResponse>('/ratings/my-ratings/');
    return response.data;
  },
};

export default ratingsAPI;
