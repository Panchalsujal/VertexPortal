import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createNote, getCourseNotes, getLectureNotes, getNoteById, updateNote, deleteNote } from '../../api/notes.api';

export const fetchCourseNotes = createAsyncThunk('notes/byCourse', async ({ courseId, params }, { rejectWithValue }) => {
  try { const r = await getCourseNotes(courseId, params); return r.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchLectureNotes = createAsyncThunk('notes/byLecture', async (lectureId, { rejectWithValue }) => {
  try { const r = await getLectureNotes(lectureId); return r.data.notes || []; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const addNote = createAsyncThunk('notes/create', async (data, { rejectWithValue }) => {
  try {
    const payload = data?.data ? { lectureId: data.lectureId, ...data.data } : data;
    const r = await createNote(payload);
    return r.data.note;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to save note');
  }
});

export const editNote = createAsyncThunk('notes/update', async ({ noteId, data }, { rejectWithValue }) => {
  try { const r = await updateNote(noteId, data); return r.data.note; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const removeNote = createAsyncThunk('notes/delete', async (noteId, { rejectWithValue }) => {
  try { await deleteNote(noteId); return noteId; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

const notesSlice = createSlice({
  name: 'notes',
  initialState: { list: [], lectureNotes: [], current: null, pagination: null, loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b
      .addCase(fetchCourseNotes.pending, (s) => { s.loading = true; })
      .addCase(fetchCourseNotes.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.notes || []; s.pagination = a.payload.pagination; })
      .addCase(fetchCourseNotes.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchLectureNotes.fulfilled, (s, a) => { s.lectureNotes = a.payload; })
      .addCase(addNote.fulfilled, (s, a) => { s.list.unshift(a.payload); s.lectureNotes.unshift(a.payload); })
      .addCase(editNote.fulfilled, (s, a) => {
        const i = s.list.findIndex(n => n._id === a.payload._id);
        if (i !== -1) s.list[i] = a.payload;
        const j = s.lectureNotes.findIndex(n => n._id === a.payload._id);
        if (j !== -1) s.lectureNotes[j] = a.payload;
      })
      .addCase(removeNote.fulfilled, (s, a) => {
        s.list = s.list.filter(n => n._id !== a.payload);
        s.lectureNotes = s.lectureNotes.filter(n => n._id !== a.payload);
      });
  },
});

export const selectNotes = (s) => s.notes.list;
export const selectLectureNotes = (s) => s.notes.lectureNotes;
export const selectNotesLoading = (s) => s.notes.loading;
export default notesSlice.reducer;
