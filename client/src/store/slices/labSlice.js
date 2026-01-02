import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { labAPI } from '../../utils/api';

// --- Thunks ---

/**
 * Fetch general statistics for the lab dashboard.
 */
export const fetchLabStats = createAsyncThunk(
  'lab/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      return await labAPI.getStats();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

/**
 * Fetch lab requests filtered by status (e.g., 'pending', 'completed').
 */
export const fetchLabRequests = createAsyncThunk(
  'lab/fetchRequests',
  async (status, { rejectWithValue }) => {
    try {
      return await labAPI.getRequests(status);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch requests');
    }
  }
);

/**
 * NEW: Update payment details (status, mode, amount) for a lab request.
 */
export const updateLabPayment = createAsyncThunk(
  'lab/updatePayment',
  async ({ id, paymentData }, { rejectWithValue }) => {
    try {
      return await labAPI.updatePayment(id, paymentData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Payment update failed');
    }
  }
);

/**
 * Upload the final report file and technician notes.
 */
export const uploadLabReport = createAsyncThunk(
  'lab/uploadReport',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      return await labAPI.uploadReport(id, formData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Upload failed');
    }
  }
);

// --- Slice ---

const labSlice = createSlice({
  name: 'lab',
  initialState: {
    stats: { total: 0, pending: 0, completed: 0 },
    requests: [],
    loading: false,
    error: null,
    uploadSuccess: null
  },
  reducers: {
    /**
     * Resets error and success states.
     */
    clearLabErrors: (state) => {
      state.error = null;
      state.uploadSuccess = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Stats
      .addCase(fetchLabStats.pending, (state) => { state.loading = true; })
      .addCase(fetchLabStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
      })
      .addCase(fetchLabStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Requests
      .addCase(fetchLabRequests.pending, (state) => { state.loading = true; })
      .addCase(fetchLabRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.requests;
      })
      .addCase(fetchLabRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // NEW: Update Lab Payment
      .addCase(updateLabPayment.pending, (state) => { state.loading = true; })
      .addCase(updateLabPayment.fulfilled, (state, action) => {
        state.loading = false;
        // Update the local request object with the new payment data returned from the server
        const index = state.requests.findIndex(req => req._id === action.payload.report._id);
        if (index !== -1) {
            state.requests[index] = action.payload.report;
        }
      })
      .addCase(updateLabPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Upload Lab Report
      .addCase(uploadLabReport.pending, (state) => { state.loading = true; })
      .addCase(uploadLabReport.fulfilled, (state, action) => {
        state.loading = false;
        state.uploadSuccess = 'Report uploaded successfully';
        // Remove the completed request from the current pending list
        state.requests = state.requests.filter(req => req._id !== action.payload.report._id);
        state.stats.pending -= 1;
        state.stats.completed += 1;
      })
      .addCase(uploadLabReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearLabErrors } = labSlice.actions;
export default labSlice.reducer;