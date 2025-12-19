// client/src/store/slices/publicDataSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { publicAPI } from '../../utils/api';

// Fetch Services - CACHE DISABLED
export const fetchServices = createAsyncThunk(
  'publicData/fetchServices',
  async (_, { rejectWithValue, getState }) => {
    try {
      // Direct API call without cache check
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

// Fetch Doctors - CACHE DISABLED
export const fetchDoctors = createAsyncThunk(
  'publicData/fetchDoctors',
  async (serviceId = null, { rejectWithValue, getState }) => {
    try {
      // Direct API call without cache check
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
      cache: {}, 
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
        state.services.data = action.payload.data;
        state.services.lastFetched = Date.now();
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
        // Even though we don't use cache for reading, we update it for consistency
        const cacheKey = action.payload.serviceId || 'all';
        state.doctors.cache[cacheKey] = {
          data: action.payload.data,
          lastFetched: Date.now(),
        };
        state.doctors.data = action.payload.data;
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