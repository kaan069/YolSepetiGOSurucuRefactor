import { useReducer, useCallback } from 'react';
import { OrderStatus } from '../../../lib/types';
import { ServiceFilterType } from './useOrdersData';

// Atomik state - 3 ayrı useState yerine tek reducer
interface OrdersFilterState {
  mainTab: 'incoming' | 'my_jobs';
  filter: OrderStatus;
  serviceFilter: ServiceFilterType;
}

type OrdersFilterAction =
  | { type: 'SET_ALL'; mainTab: 'incoming' | 'my_jobs'; filter: OrderStatus; serviceFilter: ServiceFilterType }
  | { type: 'SET_MAIN_TAB'; mainTab: 'incoming' | 'my_jobs' }
  | { type: 'SET_FILTER'; filter: OrderStatus }
  | { type: 'SET_SERVICE_FILTER'; serviceFilter: ServiceFilterType };

function ordersFilterReducer(state: OrdersFilterState, action: OrdersFilterAction): OrdersFilterState {
  switch (action.type) {
    case 'SET_ALL':
      // WebSocket auto-navigate: 3 state'i TEK seferde değiştir = TEK re-render
      return {
        mainTab: action.mainTab,
        filter: action.filter,
        serviceFilter: action.serviceFilter,
      };
    case 'SET_MAIN_TAB':
      // Ana tab değiştiğinde filter'ı otomatik reset et
      return {
        ...state,
        mainTab: action.mainTab,
        filter: action.mainTab === 'incoming' ? 'pending' : 'awaiting_approval',
      };
    case 'SET_FILTER':
      return { ...state, filter: action.filter };
    case 'SET_SERVICE_FILTER':
      return { ...state, serviceFilter: action.serviceFilter };
    default:
      return state;
  }
}

const initialState: OrdersFilterState = {
  mainTab: 'incoming',
  filter: 'pending',
  serviceFilter: 'tow',
};

export function useOrdersFilters() {
  const [state, dispatch] = useReducer(ordersFilterReducer, initialState);

  const handleMainTabChange = useCallback((tab: 'incoming' | 'my_jobs') => {
    dispatch({ type: 'SET_MAIN_TAB', mainTab: tab });
  }, []);

  const handleFilterChange = useCallback((newFilter: OrderStatus) => {
    dispatch({ type: 'SET_FILTER', filter: newFilter });
  }, []);

  const handleServiceFilterChange = useCallback((service: ServiceFilterType) => {
    dispatch({ type: 'SET_SERVICE_FILTER', serviceFilter: service });
  }, []);

  // Atomik navigate - WebSocket auto-navigate için
  const setAllFilters = useCallback((mainTab: 'incoming' | 'my_jobs', filter: OrderStatus, serviceFilter: ServiceFilterType) => {
    dispatch({ type: 'SET_ALL', mainTab, filter, serviceFilter });
  }, []);

  // Geriye uyumluluk için bireysel set fonksiyonları (route params vb.)
  const setFilter = useCallback((filter: OrderStatus) => {
    dispatch({ type: 'SET_FILTER', filter });
  }, []);

  const setServiceFilter = useCallback((serviceFilter: ServiceFilterType) => {
    dispatch({ type: 'SET_SERVICE_FILTER', serviceFilter });
  }, []);

  const setMainTab = useCallback((mainTab: 'incoming' | 'my_jobs') => {
    dispatch({ type: 'SET_MAIN_TAB', mainTab });
  }, []);

  return {
    mainTab: state.mainTab,
    filter: state.filter,
    serviceFilter: state.serviceFilter,
    handleMainTabChange,
    handleFilterChange,
    handleServiceFilterChange,
    setAllFilters,
    setFilter,
    setServiceFilter,
    setMainTab,
  };
}
