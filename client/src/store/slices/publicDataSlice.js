import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { publicAPI } from '../../utils/api';

// Fetch Services
export const fetchServices = createAsyncThunk(
  'publicData/fetchServices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await publicAPI.getServices();
      // Robust check for different API response formats
      if (response.success && response.data) return response.data;
      if (response.services) return response.services;
      if (Array.isArray(response)) return response;
      return [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch services');
    }
  }
);

// Fetch Doctors
export const fetchDoctors = createAsyncThunk(
  'publicData/fetchDoctors',
  async (serviceId, { rejectWithValue }) => {
    try {
      const response = await publicAPI.getDoctors(serviceId);
      // Robust check for different API response formats
      if (response.success && response.data) return response.data;
      if (response.doctors) return response.doctors;
      if (Array.isArray(response)) return response;
      return [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch doctors');
    }
  }
);

const publicDataSlice = createSlice({
  name: 'publicData',
  initialState: {
    services: [], // Flat array structure
    doctors: [],  // Flat array structure
    loading: false,
    error: null,
    lastFetched: null,
  },
  reducers: {
    clearErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Services
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Doctors
      .addCase(fetchDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.doctors = action.payload;
      })
      .addCase(fetchDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearErrors } = publicDataSlice.actions;
export default publicDataSlice.reducer;