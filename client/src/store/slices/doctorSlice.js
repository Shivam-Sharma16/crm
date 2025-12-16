import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/api';

// Fetch Appointments
export const fetchDoctorAppointments = createAsyncThunk(
  'doctors/fetchAppointments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/doctor/appointments');
      if (response.data.success) return response.data.appointments || [];
      return rejectWithValue(response.data.message);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch');
    }
  }
);

// Cancel Appointment
export const cancelAppointment = createAsyncThunk(
  'doctors/cancelAppointment',
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/api/doctor/appointments/${appointmentId}/cancel`);
      if (response.data.success) return { appointmentId, status: 'cancelled' };
      return rejectWithValue(response.data.message);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel');
    }
  }
);

// Update Availability
export const updateAvailability = createAsyncThunk(
  'doctors/updateAvailability',
  async (availabilityData, { rejectWithValue }) => {
    try {
      const response = await apiClient.put('/api/doctor/availability', { availability: availabilityData });
      if (response.data.success) return response.data.availability;
      return rejectWithValue(response.data.message);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Update failed');
    }
  }
);

// Update Prescription
export const updatePrescription = createAsyncThunk(
  'doctors/updatePrescription',
  async ({ appointmentId, formData }, { rejectWithValue }) => {
    try {
      // Axios automatically sets 'Content-Type': 'multipart/form-data' when sending FormData
      const response = await apiClient.patch(`/api/doctor/appointments/${appointmentId}/prescription`, formData);
      
      if (response.data.success) return response.data.appointment;
      return rejectWithValue(response.data.message);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update prescription');
    }
  }
);

const doctorSlice = createSlice({
  name: 'doctors',
  initialState: {
    appointments: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearAppointments: (state) => { state.appointments = []; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Appointments
      .addCase(fetchDoctorAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctorAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
        state.error = null;
      })
      .addCase(fetchDoctorAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Cancel Appointment
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(app => app._id === action.payload.appointmentId);
        if (index !== -1) {
          state.appointments[index].status = 'cancelled';
        }
      })

      // Update Prescription
      .addCase(updatePrescription.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(app => app._id === action.payload._id);
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
      });
  },
});

export const { clearAppointments, clearError } = doctorSlice.actions;
export default doctorSlice.reducer;