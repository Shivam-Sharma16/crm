import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { labAPI } from '../../utils/api';

// Thunks
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
    clearLabErrors: (state) => {
      state.error = null;
      state.uploadSuccess = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Stats
      .addCase(fetchLabStats.pending, (state) => { state.loading = true; })
      .addCase(fetchLabStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
      })
      .addCase(fetchLabStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Requests
      .addCase(fetchLabRequests.pending, (state) => { state.loading = true; })
      .addCase(fetchLabRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.requests;
      })
      .addCase(fetchLabRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upload
      .addCase(uploadLabReport.pending, (state) => { state.loading = true; })
      .addCase(uploadLabReport.fulfilled, (state, action) => {
        state.loading = false;
        state.uploadSuccess = 'Report uploaded successfully';
        // Remove the completed request from the list if we are in pending view
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