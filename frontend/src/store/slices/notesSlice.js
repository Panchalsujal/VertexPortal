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
  initialState: {
    list: [],
    lectureNotes: [],
    current: null,
    pagination: null,
    loading: false,
    error: null,
    _snapshots: {},
  },
  reducers: {
    setNotesSnapshot: (s, a) => {
      if (a.payload.list !== undefined) s.list = a.payload.list;
      if (a.payload.lectureNotes !== undefined) s.lectureNotes = a.payload.lectureNotes;
    },
    optimisticRemoveNote: (s, a) => {
      const id = a.payload;
      s.list = s.list.filter(n => n._id !== id && n.id !== id);
      s.lectureNotes = s.lectureNotes.filter(n => n._id !== id && n.id !== id);
    },
    optimisticEditNote: (s, a) => {
      const { noteId, data } = a.payload;
      const idx = s.list.findIndex(n => n._id === noteId || n.id === noteId);
      if (idx !== -1) Object.assign(s.list[idx], data);
      const lIdx = s.lectureNotes.findIndex(n => n._id === noteId || n.id === noteId);
      if (lIdx !== -1) Object.assign(s.lectureNotes[lIdx], data);
    },
  },
  extraReducers: (b) => {
    b
      .addCase(fetchCourseNotes.pending, (s) => { s.loading = true; })
      .addCase(fetchCourseNotes.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.notes || []; s.pagination = a.payload.pagination; })
      .addCase(fetchCourseNotes.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchLectureNotes.fulfilled, (s, a) => { s.lectureNotes = a.payload; })

      // Optimistic Add Note
      .addCase(addNote.pending, (s, a) => {
        const data = a.meta.arg;
        const tempId = 'temp-note-' + Date.now();
        const optimisticNote = {
          _id: tempId,
          title: data.title || '',
          content: data.content || data.body || '',
          isPinned: Boolean(data.isPinned),
          lectureId: data.lectureId,
          timestampInSeconds: data.timestampInSeconds ?? null,
          createdAt: new Date().toISOString(),
        };
        s._snapshots.lastAddedTempId = tempId;
        s.list.unshift(optimisticNote);
        s.lectureNotes.unshift(optimisticNote);
      })
      .addCase(addNote.fulfilled, (s, a) => {
        const tempId = s._snapshots.lastAddedTempId;
        if (tempId) {
          const i = s.list.findIndex(n => n._id === tempId);
          if (i !== -1) s.list[i] = a.payload;
          const j = s.lectureNotes.findIndex(n => n._id === tempId);
          if (j !== -1) s.lectureNotes[j] = a.payload;
          delete s._snapshots.lastAddedTempId;
        } else {
          s.list.unshift(a.payload);
          s.lectureNotes.unshift(a.payload);
        }
      })
      .addCase(addNote.rejected, (s) => {
        const tempId = s._snapshots.lastAddedTempId;
        if (tempId) {
          s.list = s.list.filter(n => n._id !== tempId);
          s.lectureNotes = s.lectureNotes.filter(n => n._id !== tempId);
          delete s._snapshots.lastAddedTempId;
        }
      })

      // Optimistic Edit Note
      .addCase(editNote.pending, (s, a) => {
        const { noteId, data } = a.meta.arg;
        const prevNote = s.list.find(n => n._id === noteId);
        if (prevNote) {
          s._snapshots[`edit_${noteId}`] = { ...prevNote };
          Object.assign(prevNote, data);
        }
        const prevLecNote = s.lectureNotes.find(n => n._id === noteId);
        if (prevLecNote) {
          Object.assign(prevLecNote, data);
        }
      })
      .addCase(editNote.fulfilled, (s, a) => {
        const i = s.list.findIndex(n => n._id === a.payload._id);
        if (i !== -1) s.list[i] = a.payload;
        const j = s.lectureNotes.findIndex(n => n._id === a.payload._id);
        if (j !== -1) s.lectureNotes[j] = a.payload;
        delete s._snapshots[`edit_${a.payload._id}`];
      })
      .addCase(editNote.rejected, (s, a) => {
        const { noteId } = a.meta.arg;
        const snap = s._snapshots[`edit_${noteId}`];
        if (snap) {
          const i = s.list.findIndex(n => n._id === noteId);
          if (i !== -1) s.list[i] = snap;
          const j = s.lectureNotes.findIndex(n => n._id === noteId);
          if (j !== -1) s.lectureNotes[j] = snap;
          delete s._snapshots[`edit_${noteId}`];
        }
      })

      // Optimistic Remove Note
      .addCase(removeNote.pending, (s, a) => {
        const noteId = a.meta.arg;
        const item = s.list.find(n => n._id === noteId) || s.lectureNotes.find(n => n._id === noteId);
        if (item) {
          s._snapshots[`remove_${noteId}`] = { ...item };
        }
        s.list = s.list.filter(n => n._id !== noteId);
        s.lectureNotes = s.lectureNotes.filter(n => n._id !== noteId);
      })
      .addCase(removeNote.fulfilled, (s, a) => {
        delete s._snapshots[`remove_${a.payload}`];
      })
      .addCase(removeNote.rejected, (s, a) => {
        const noteId = a.meta.arg;
        const snap = s._snapshots[`remove_${noteId}`];
        if (snap) {
          s.list.unshift(snap);
          if (snap.lectureId) s.lectureNotes.unshift(snap);
          delete s._snapshots[`remove_${noteId}`];
        }
      });
  },
});

export const { setNotesSnapshot, optimisticRemoveNote, optimisticEditNote } = notesSlice.actions;
export const selectNotes = (s) => s.notes.list;
export const selectLectureNotes = (s) => s.notes.lectureNotes;
export const selectNotesLoading = (s) => s.notes.loading;
export default notesSlice.reducer;
