import { API_BASE_URL } from '../constants/network';

export const isPdfFile = (uri: string | null | undefined): boolean => {
  if (!uri) return false;
  const cleanUri = uri.split('?')[0].split('#')[0].toLowerCase();
  return cleanUri.endsWith('.pdf');
};

export const buildFullUrl = (url: string): string => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
};

export const isLocalUri = (uri: string | null | undefined): boolean => {
  if (!uri) return false;
  return !uri.startsWith('http');
};
