import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authSlice from './slices/authSlice';
import companySlice from './slices/companySlice';
import orderSlice from './slices/orderSlice';
import tripSlice from './slices/tripSlice';
import vehicleSlice from './slices/vehicleSlice';
import customerSlice from './slices/customerSlice';
import notificationSlice from './slices/notificationSlice';
import kpiSlice from './slices/kpiSlice';
import { authApi } from './api/authApi';
import { orderApi } from './api/orderApi';
import { logisticsApi } from './api/logisticsApi';
import { billingApi } from './api/billingApi';
import { analyticsApi } from './api/analyticsApi';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    company: companySlice,
    order: orderSlice,
    trip: tripSlice,
    vehicle: vehicleSlice,
    customer: customerSlice,
    notification: notificationSlice,
    kpi: kpiSlice,
    // API reducers
    [authApi.reducerPath]: authApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [logisticsApi.reducerPath]: logisticsApi.reducer,
    [billingApi.reducerPath]: billingApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
      .concat(authApi.middleware)
      .concat(orderApi.middleware)
      .concat(logisticsApi.middleware)
      .concat(billingApi.middleware)
      .concat(analyticsApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Required for refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Type-safe hooks
export const useAppDispatch = () => store.dispatch;
export const useAppSelector = <T>(selector: (state: RootState) => T) => {
  return useSelector(selector);
};

// Import useSelector from react-redux
import { useSelector } from 'react-redux';