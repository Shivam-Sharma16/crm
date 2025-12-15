import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/api';

// Async thunks
export const fetchDoctorAppointments = createAsyncThunk(
  'doctors/fetchAppointments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/doctor/appointments');
      if (response.data.success) {
        return response.data.appointments || [];
      }
      return rejectWithValue(response.data.message || 'Failed to fetch appointments');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointments');
    }
  }
);

const doctorSlice = createSlice({
  name: 'doctors',
  initialState: {
    appointments: [],
    loading: false,
    error: null,
    lastFetched: null,
  },
  reducers: {
    clearAppointments: (state) => {
      state.appointments = [];
      state.lastFetched = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctorAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctorAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchDoctorAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAppointments: clearDoctorAppointments, clearError: clearDoctorError } = doctorSlice.actions;
export default doctorSlice.reducer;

