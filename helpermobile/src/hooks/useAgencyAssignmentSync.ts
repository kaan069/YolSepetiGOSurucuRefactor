/**
 * Bekleyen acente atamalarını uygulama açılışında ve ön plana gelişte senkronlar.
 * Bildirimi kaçıran sürücü için global atama kartı (AgencyAssignmentPrompt) bu veriyle açılır.
 * App.tsx'te global olarak çalışır.
 */
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { syncAgencyAssignments, useAgencyAssignmentStore } from '../store/useAgencyAssignmentStore';

export function useAgencyAssignmentSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      useAgencyAssignmentStore.getState().reset();
      return;
    }

    syncAgencyAssignments();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncAgencyAssignments();
    });
    return () => sub.remove();
  }, [isAuthenticated]);
}
