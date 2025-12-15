import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { publicAPI } from '../../utils/api';

// Async thunks with caching
export const fetchServices = createAsyncThunk(
  'publicData/fetchServices',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const { lastFetched } = state.publicData.services;
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      
      // Return cached data if still valid
      if (lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
        return { cached: true, data: state.publicData.services.data };
      }
      
      const response = await publicAPI.getServices();
      if (response.success) {
        return { cached: false, data: response.services || [] };
      }
      return rejectWithValue(response.message || 'Failed to fetch services');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch services');
    }
  }
);

export const fetchDoctors = createAsyncThunk(
  'publicData/fetchDoctors',
  async (serviceId = null, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const cacheKey = serviceId || 'all';
      const cached = state.publicData.doctors.cache[cacheKey];
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      
      // Return cached data if still valid
      if (cached && Date.now() - cached.lastFetched < CACHE_DURATION) {
        return { cached: true, data: cached.data, serviceId };
      }
      
      const response = await publicAPI.getDoctors(serviceId);
      if (response.success) {
        return { cached: false, data: response.doctors || [], serviceId };
      }
      return rejectWithValue(response.message || 'Failed to fetch doctors');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch doctors');
    }
  }
);

const publicDataSlice = createSlice({
  name: 'publicData',
  initialState: {
    services: {
      data: [],
      loading: false,
      error: null,
      lastFetched: null,
    },
    doctors: {
      data: [],
      loading: false,
      error: null,
      cache: {}, // Cache by serviceId
    },
  },
  reducers: {
    clearServices: (state) => {
      state.services.data = [];
      state.services.lastFetched = null;
    },
    clearDoctors: (state) => {
      state.doctors.data = [];
      state.doctors.cache = {};
    },
    clearError: (state) => {
      state.services.error = null;
      state.doctors.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Services
      .addCase(fetchServices.pending, (state) => {
        state.services.loading = true;
        state.services.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.services.loading = false;
        if (!action.payload.cached) {
          state.services.data = action.payload.data;
          state.services.lastFetched = Date.now();
        }
        state.services.error = null;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.services.loading = false;
        state.services.error = action.payload;
      })
      // Fetch Doctors
      .addCase(fetchDoctors.pending, (state) => {
        state.doctors.loading = true;
        state.doctors.error = null;
      })
      .addCase(fetchDoctors.fulfilled, (state, action) => {
        state.doctors.loading = false;
        const cacheKey = action.payload.serviceId || 'all';
        
        if (!action.payload.cached) {
          // Update cache
          state.doctors.cache[cacheKey] = {
            data: action.payload.data,
            lastFetched: Date.now(),
          };
        }
        
        // Update current data
        state.doctors.data = action.payload.cached
          ? state.doctors.cache[cacheKey].data
          : action.payload.data;
        
        state.doctors.error = null;
      })
      .addCase(fetchDoctors.rejected, (state, action) => {
        state.doctors.loading = false;
        state.doctors.error = action.payload;
      });
  },
});

export const { clearServices, clearDoctors, clearError: clearPublicDataError } = publicDataSlice.actions;
export default publicDataSlice.reducer;

