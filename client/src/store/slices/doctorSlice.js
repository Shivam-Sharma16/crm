import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/api';

// Fetch Doctor Appointments
export const fetchDoctorAppointments = createAsyncThunk(
  'doctors/fetchAppointments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/doctor/appointments');
      if (response.data.success) return response.data.appointments || [];
      return rejectWithValue(response.data.message);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointments');
    }
  }
);

// Fetch Patient History
export const fetchPatientHistory = createAsyncThunk(
  'doctors/fetchPatientHistory',
  async (patientId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/api/doctor/patients/${patientId}/history`);
      if (response.data.success) return response.data.history;
      return rejectWithValue(response.data.message);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch history');
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

// --- NEW: Fetch Treatment Plan ---
export const fetchTreatmentPlan = createAsyncThunk(
  'doctors/fetchTreatmentPlan',
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/api/treatment-plans/${appointmentId}`);
      // Returns { success: true, plan: { ... } or null }
      return response.data.plan;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch plan');
    }
  }
);

// --- NEW: Save Treatment Plan ---
export const saveTreatmentPlan = createAsyncThunk(
  'doctors/saveTreatmentPlan',
  async ({ appointmentId, formData }, { rejectWithValue }) => {
    try {
      // Content-Type undefined lets browser set boundary for FormData
      const config = { headers: { 'Content-Type': undefined } };
      const response = await apiClient.post(`/api/treatment-plans/${appointmentId}`, formData, config);
      if (response.data.success) return response.data.plan;
      return rejectWithValue(response.data.message);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save plan');
    }
  }
);

// --- NEW: Delete File from Plan ---
export const deletePlanFile = createAsyncThunk(
    'doctors/deletePlanFile',
    async ({ appointmentId, fileId }, { rejectWithValue }) => {
        try {
            const response = await apiClient.delete(`/api/treatment-plans/${appointmentId}/files/${fileId}`);
            if (response.data.success) return response.data.plan;
            return rejectWithValue(response.data.message);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete file');
        }
    }
);

// Legacy Action: Update Prescription (Keep for backward compatibility)
export const updatePrescription = createAsyncThunk(
  'doctors/updatePrescription',
  async ({ appointmentId, formData }, { rejectWithValue }) => {
    try {
      const config = { headers: { 'Content-Type': undefined } };
      const response = await apiClient.patch(
          `/api/doctor/appointments/${appointmentId}/prescription`, 
          formData,
          config
      );
      if (response.data.success) return response.data.appointment;
      return rejectWithValue(response.data.message);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update');
    }
  }
);

// Legacy Action: Delete Prescription
export const deletePrescription = createAsyncThunk(
    'doctors/deletePrescription',
    async ({ appointmentId, prescriptionId }, { rejectWithValue }) => {
        try {
            const response = await apiClient.delete(
                `/api/doctor/appointments/${appointmentId}/prescriptions/${prescriptionId}`
            );
            if (response.data.success) return response.data.appointment;
            return rejectWithValue(response.data.message);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete');
        }
    }
);

const doctorSlice = createSlice({
  name: 'doctors',
  initialState: {
    appointments: [],
    patientHistory: [],
    currentTreatmentPlan: null, // Stores the active treatment plan
    loading: false,
    error: null,
  },
  reducers: {
    clearAppointments: (state) => { state.appointments = []; },
    clearError: (state) => { state.error = null; },
    clearHistory: (state) => { state.patientHistory = []; },
    clearCurrentPlan: (state) => { state.currentTreatmentPlan = null; }
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

      // Fetch History
      .addCase(fetchPatientHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPatientHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.patientHistory = action.payload;
      })
      .addCase(fetchPatientHistory.rejected, (state) => {
        state.loading = false;
      })

      // Cancel Appointment
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(app => app._id === action.payload.appointmentId);
        if (index !== -1) {
          state.appointments[index].status = 'cancelled';
        }
      })

      // --- Treatment Plan Handlers ---
      .addCase(fetchTreatmentPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTreatmentPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTreatmentPlan = action.payload; // Set the plan data
      })
      .addCase(fetchTreatmentPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(saveTreatmentPlan.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveTreatmentPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTreatmentPlan = action.payload; // Update with saved plan
        state.error = null;
      })
      .addCase(saveTreatmentPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deletePlanFile.fulfilled, (state, action) => {
        state.currentTreatmentPlan = action.payload; // Update with plan after file deletion
      })

      // Legacy Handlers
      .addCase(updatePrescription.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(app => app._id === action.payload._id);
        if (index !== -1) state.appointments[index] = action.payload;
      })
      .addCase(deletePrescription.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(app => app._id === action.payload._id);
        if (index !== -1) state.appointments[index] = action.payload;
      });
  },
});

export const { clearAppointments, clearError, clearHistory, clearCurrentPlan } = doctorSlice.actions;
export default doctorSlice.reducer;