import { useDispatch, useSelector } from 'react-redux';
import { useMemo } from 'react';

// Typed hooks for better TypeScript-like experience
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Memoized selectors for performance
export const useAuth = () => {
  return useAppSelector((state) => state.auth);
};

export const useAppointments = () => {
  return useAppSelector((state) => state.appointments);
};

export const useDoctors = () => {
  return useAppSelector((state) => state.doctors);
};

export const usePublicData = () => {
  return useAppSelector((state) => state.publicData);
};

export const useAdminEntities = () => {
  return useAppSelector((state) => state.adminEntities);
};

export const useServices = () => {
  return useAppSelector((state) => state.services);
};

// Selector hooks with memoization
export const useCachedServices = () => {
  const { data, loading, error, lastFetched } = useAppSelector(
    (state) => state.publicData.services
  );
  
  return useMemo(
    () => ({
      services: data,
      loading,
      error,
      isCached: lastFetched && Date.now() - lastFetched < 5 * 60 * 1000,
    }),
    [data, loading, error, lastFetched]
  );
};

export const useCachedDoctors = (serviceId = null) => {
  const { data, loading, error, cache } = useAppSelector(
    (state) => state.publicData.doctors
  );
  
  const cacheKey = serviceId || 'all';
  const cached = cache[cacheKey];
  
  return useMemo(
    () => ({
      doctors: data,
      loading,
      error,
      isCached: cached && Date.now() - cached.lastFetched < 5 * 60 * 1000,
    }),
    [data, loading, error, cached]
  );
};









