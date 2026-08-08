import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getMyCertificates } from '../../api/certificate.api';

export const fetchMyCertificates = createAsyncThunk(
  'certificates/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getMyCertificates();
      const raw = res.data.certificates || res.data.data?.certificates || res.data.data || [];
      return Array.isArray(raw) ? raw : [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const certificatesSlice = createSlice({
  name: 'certificates',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyCertificates.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchMyCertificates.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchMyCertificates.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export default certificatesSlice.reducer;
export const selectMyCertificates        = (s) => s.certificates.items;
export const selectCertificatesLoading    = (s) => s.certificates.loading;
