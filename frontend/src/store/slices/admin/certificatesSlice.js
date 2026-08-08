import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  adminGetAllCertificates,
  adminGetIssueQueue,
  adminIssueCertificate as adminIssueApi,
  adminRetryBulkCertificates as adminRetryBulkApi,
  adminRevokeCertificate as adminRevokeApi,
  adminRestoreCertificate as adminRestoreApi,
  adminRegenerateCertificatePdf as adminRegeneratePdfApi,
} from '../../../api/certificate.api';

export const fetchAdminCertificates = createAsyncThunk(
  'adminCertificates/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await adminGetAllCertificates(params);
      const raw = res.data.certificates || res.data.data?.certificates || res.data.data || [];
      return Array.isArray(raw) ? raw : [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchIssueQueue = createAsyncThunk(
  'adminCertificates/fetchQueue',
  async (_, { rejectWithValue }) => {
    try {
      const res = await adminGetIssueQueue();
      const raw = res.data.queue || res.data.data?.queue || res.data.data || [];
      return Array.isArray(raw) ? raw : [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const issueCertificate = createAsyncThunk(
  'adminCertificates/issue',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await adminIssueApi(payload);
      return res.data.certificate || res.data.data?.certificate || res.data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const retryBulkCertificates = createAsyncThunk(
  'adminCertificates/retryBulk',
  async (_, { rejectWithValue }) => {
    try {
      const res = await adminRetryBulkApi();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const revokeCertificate = createAsyncThunk(
  'adminCertificates/revoke',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await adminRevokeApi(id, { reason });
      return { id, certificate: res.data.certificate || res.data.data?.certificate };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const restoreCertificate = createAsyncThunk(
  'adminCertificates/restore',
  async (id, { rejectWithValue }) => {
    try {
      const res = await adminRestoreApi(id);
      return { id, certificate: res.data.certificate || res.data.data?.certificate };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const regeneratePdf = createAsyncThunk(
  'adminCertificates/regeneratePdf',
  async (id, { rejectWithValue }) => {
    try {
      const res = await adminRegeneratePdfApi(id);
      return { id, result: res.data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const adminCertificatesSlice = createSlice({
  name: 'adminCertificates',
  initialState: { items: [], queue: [], loading: false, queueLoading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminCertificates.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchAdminCertificates.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchAdminCertificates.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchIssueQueue.pending,   (s) => { s.queueLoading = true; })
      .addCase(fetchIssueQueue.fulfilled, (s, a) => { s.queueLoading = false; s.queue = a.payload; })
      .addCase(fetchIssueQueue.rejected,  (s) => { s.queueLoading = false; })

      .addCase(issueCertificate.fulfilled, (s, a) => {
        if (a.payload) s.items.unshift(a.payload);
      })
      .addCase(revokeCertificate.fulfilled, (s, a) => {
        const item = s.items.find(x => x._id === a.payload.id);
        if (item) item.isRevoked = true;
      })
      .addCase(restoreCertificate.fulfilled, (s, a) => {
        const item = s.items.find(x => x._id === a.payload.id);
        if (item) item.isRevoked = false;
      });
  },
});

export default adminCertificatesSlice.reducer;
export const selectAdminCertificates        = (s) => s.adminCertificates.items;
export const selectAdminCertificatesLoading = (s) => s.adminCertificates.loading;
export const selectIssueQueue               = (s) => s.adminCertificates.queue;
export const selectIssueQueueLoading        = (s) => s.adminCertificates.queueLoading;
