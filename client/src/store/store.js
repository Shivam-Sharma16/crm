import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import appointmentReducer from './slices/appointmentSlice';
import doctorReducer from './slices/doctorSlice';
import serviceReducer from './slices/serviceSlice';
import publicDataReducer from './slices/publicDataSlice';
import adminEntitiesReducer from './slices/adminEntitiesSlice';
import { setStoreRef } from './storeRef';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    appointments: appointmentReducer,
    doctors: doctorReducer,
    services: serviceReducer,
    publicData: publicDataReducer,
    adminEntities: adminEntitiesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Set store reference for use in API interceptors
setStoreRef(store);

