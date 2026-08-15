import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getManageModules, createModule, updateModule, deleteModule, publishModule } from '../../api/module.api';
import {
  getManageLectures, createLecture, updateLecture, archiveLecture,
  publishLecture, uploadLectureVideo, uploadLectureDocument,
} from '../../api/lecture.api';
import { indexCourseForRag } from '../../api/rag.api';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import {
  Plus, Edit3, Trash2, Globe, Video, FileText, Upload, ArrowLeft,
  Eye, Download, X, Sparkles, Layers, BookOpen, ExternalLink, Check, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Curriculum() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPreviewIds, setExpandedPreviewIds] = useState([]);

  // Module modal state
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [activeModule, setActiveModule] = useState(null);
  const [moduleTitle, setModuleTitle] = useState('');

  // Lecture modal state
  const [lectureModalOpen, setLectureModalOpen] = useState(false);
  const [activeLecture, setActiveLecture] = useState(null);
  const [targetModuleId, setTargetModuleId] = useState(null);
  const [lectureForm, setLectureForm] = useState({ title: '', description: '', content: '', type: 'video' });

  // Asset upload modal state
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetLecture, setAssetLecture] = useState(null);
  const [assetType, setAssetType] = useState('video');
  const [assetFile, setAssetFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [indexingRag, setIndexingRag] = useState(false);

  const fetchModulesAndLectures = async () => {
    setLoading(true);
    try {
      const res = await getManageModules(courseId);
      const rawMods = res.data.modules || res.data.data?.modules || res.data.data || [];
      const withLecs = await Promise.all(rawMods.map(async mod => {
        try {
          const lRes = await getManageLectures(mod._id);
          return { ...mod, lectures: lRes.data.lectures || lRes.data.data?.lectures || [] };
        } catch {
          return { ...mod, lectures: [] };
        }
      }));
      setModules(withLecs);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModulesAndLectures(); }, [courseId]);

  const togglePreview = (lectureId) => {
    setExpandedPreviewIds(prev =>
      prev.includes(lectureId) ? prev.filter(id => id !== lectureId) : [...prev, lectureId]
    );
  };

  // ── Module handlers ────────────────────────────────────────────────────────
  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    try {
      if (activeModule) {
        await updateModule(activeModule._id, { title: moduleTitle });
        toast.success('Module updated');
      } else {
        await createModule(courseId, { title: moduleTitle });
        toast.success('Module created');
      }
      setModuleModalOpen(false);
      fetchModulesAndLectures();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Delete this module and all its lectures?')) return;
    try {
      await deleteModule(moduleId);
      toast.success('Module deleted');
      fetchModulesAndLectures();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleTogglePublishModule = async (moduleId) => {
    try {
      await publishModule(moduleId);
      toast.success('Module status updated');
      fetchModulesAndLectures();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  // ── Lecture handlers ───────────────────────────────────────────────────────
  const handleSaveLecture = async (e) => {
    e.preventDefault();
    if (!lectureForm.title.trim()) return;
    try {
      if (activeLecture) {
        await updateLecture(activeLecture._id, lectureForm);
        toast.success('Lecture updated');
      } else {
        await createLecture(targetModuleId, lectureForm);
        toast.success('Lecture created');
      }
      setLectureModalOpen(false);
      fetchModulesAndLectures();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleTogglePublishLecture = async (lectureId) => {
    try {
      await publishLecture(lectureId);
      toast.success('Lecture status updated');
      fetchModulesAndLectures();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteLecture = async (lectureId) => {
    if (!window.confirm('Archive this lecture?')) return;
    try {
      await archiveLecture(lectureId);
      toast.success('Lecture archived');
      fetchModulesAndLectures();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  // ── Asset upload handler ──────────────────────────────────────────────────
  const handleUploadAsset = async (e) => {
    e.preventDefault();
    if (!assetFile || !assetLecture) return;

    const MAX_SIZE = 100 * 1024 * 1024;
    if (assetFile.size > MAX_SIZE) {
      toast.error(`File size exceeds ImageKit's 100 MB limit.`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const fd = new FormData();
    try {
      if (assetType === 'document') {
        fd.append('document', assetFile);
        await uploadLectureDocument(assetLecture._id, fd, (pct) => setUploadProgress(pct));
        toast.success('Document uploaded successfully!');
      } else {
        fd.append('video', assetFile);
        await uploadLectureVideo(assetLecture._id, fd, (pct) => setUploadProgress(pct));
        toast.success('Video uploaded successfully!');
      }

      setAssetModalOpen(false);
      setAssetFile(null);
      setUploadProgress(0);
      fetchModulesAndLectures();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleIndexRag = async () => {
    setIndexingRag(true);
    try {
      await indexCourseForRag(courseId);
      toast.success('Course curriculum indexed into AI RAG knowledge base!');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'AI RAG indexing failed');
    } finally {
      setIndexingRag(false);
    }
  };

  const closeAssetModal = () => {
    if (uploading) return;
    setAssetModalOpen(false);
    setAssetFile(null);
    setUploadProgress(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-[Inter,sans-serif] py-8 text-gray-900 dark:text-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.history.length > 1 && window.history.state?.idx > 0) {
                  navigate(-1);
                } else {
                  navigate('/instructor/dashboard');
                }
              }}
              className="p-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:text-purple-600 hover:border-purple-300 transition shadow-xs cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Curriculum Builder
                </h1>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Structure modules, lectures, video lessons, and PDF study documents
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={handleIndexRag}
              disabled={indexingRag}
              className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 transition inline-flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              title="Index course curriculum for AI Tutor semantic search"
            >
              <Sparkles className={`w-4 h-4 ${indexingRag ? 'animate-spin' : 'text-purple-600'}`} />
              <span>{indexingRag ? 'Indexing RAG…' : 'Index AI RAG'}</span>
            </button>

            <button
              onClick={() => { setActiveModule(null); setModuleTitle(''); setModuleModalOpen(true); }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs transition inline-flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Module</span>
            </button>
          </div>
        </div>

        {/* Modules Stream */}
        {modules.length > 0 ? (
          <div className="space-y-6">
            {modules.map((mod, mi) => (
              <div
                key={mod._id}
                className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800/80 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Module Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Module {mi + 1}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {mod.title}
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                      mod.isPublished
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${mod.isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {mod.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { setActiveModule(mod); setModuleTitle(mod.title); setModuleModalOpen(true); }}
                      className="p-2 rounded-xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer"
                      title="Edit Module Title"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleTogglePublishModule(mod._id)}
                      className={`p-2 rounded-xl transition cursor-pointer ${
                        mod.isPublished
                          ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={mod.isPublished ? 'Unpublish Module' : 'Publish Module'}
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteModule(mod._id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                      title="Delete Module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setTargetModuleId(mod._id);
                        setActiveLecture(null);
                        setLectureForm({ title: '', description: '', content: '', type: 'video' });
                        setLectureModalOpen(true);
                      }}
                      className="ml-2 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Lecture
                    </button>
                  </div>
                </div>

                {/* Lectures List */}
                <div className="space-y-3">
                  {(mod.lectures || []).map((lec, li) => {
                    const isExpanded = expandedPreviewIds.includes(lec._id);
                    const hasMedia = Boolean(lec.videoUrl || lec.documentUrl || lec.content);

                    return (
                      <div
                        key={lec._id}
                        className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 overflow-hidden transition-all"
                      >
                        {/* Lecture Row */}
                        <div className="flex flex-wrap items-center justify-between p-3.5 sm:p-4 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              lec.type === 'document'
                                ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-600'
                                : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600'
                            }`}>
                              {lec.type === 'document' ? <FileText className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {li + 1}. {lec.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                                <span className="capitalize font-semibold text-gray-500 dark:text-gray-400">
                                  {lec.type || 'video'}
                                </span>
                                <span>•</span>
                                <span className={lec.isPublished ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
                                  {lec.isPublished ? 'Published' : 'Draft'}
                                </span>
                                {lec.videoUrl && (
                                  <>
                                    <span>•</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Video Ready</span>
                                  </>
                                )}
                                {lec.documentUrl && (
                                  <>
                                    <span>•</span>
                                    <span className="text-purple-600 dark:text-purple-400 font-semibold">Document Attached</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Lecture Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {hasMedia && (
                              <button
                                onClick={() => togglePreview(lec._id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer ${
                                  isExpanded
                                    ? 'bg-purple-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{isExpanded ? 'Hide' : 'Preview'}</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setAssetLecture(lec);
                                setAssetType(lec.type === 'document' ? 'document' : 'video');
                                setAssetFile(null);
                                setUploadProgress(0);
                                setAssetModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-gray-200 dark:border-gray-700 hover:border-purple-300 text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                              title="Upload Media / Document"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload</span>
                            </button>

                            <button
                              onClick={() => handleTogglePublishLecture(lec._id)}
                              className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                              title={lec.isPublished ? 'Unpublish Lecture' : 'Publish Lecture'}
                            >
                              <Globe className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setActiveLecture(lec);
                                setLectureForm({
                                  title: lec.title,
                                  description: lec.description || '',
                                  content: lec.content || '',
                                  type: lec.type || 'video',
                                });
                                setLectureModalOpen(true);
                              }}
                              className="p-2 rounded-xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer"
                              title="Edit Lecture"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteLecture(lec._id)}
                              className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                              title="Delete Lecture"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Clean Preview Drawer */}
                        {isExpanded && (
                          <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 rounded-b-2xl">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5" /> Preview: {lec.title}
                              </h5>
                              <button
                                onClick={() => togglePreview(lec._id)}
                                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" /> Close
                              </button>
                            </div>

                            {lec.videoUrl ? (
                              <div className="rounded-2xl overflow-hidden bg-black max-w-2xl border border-gray-800 shadow-md">
                                <video
                                  src={lec.videoUrl}
                                  controls
                                  controlsList="nodownload"
                                  className="w-full max-h-[380px] object-contain"
                                />
                              </div>
                            ) : lec.documentUrl ? (
                              <div className="space-y-4 max-w-3xl">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                                      <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-gray-900 dark:text-white">{lec.title}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">PDF Document Resource</p>
                                    </div>
                                  </div>
                                  <a
                                    href={lec.documentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow-xs"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Open Document
                                  </a>
                                </div>

                                {lec.documentUrl.toLowerCase().includes('.pdf') && (
                                  <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
                                    <iframe
                                      src={lec.documentUrl}
                                      title={lec.title}
                                      className="w-full h-[480px] bg-white"
                                    />
                                  </div>
                                )}
                              </div>
                            ) : lec.content ? (
                              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                                {lec.content}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic">No media uploaded yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {(!mod.lectures || mod.lectures.length === 0) && (
                    <div className="py-6 text-center text-xs text-gray-400 bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                      No lectures added yet. Click "+ Add Lecture" to begin.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Curriculum is empty</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              Add your first module to begin structuring your course lectures and resources.
            </p>
            <button
              onClick={() => { setActiveModule(null); setModuleTitle(''); setModuleModalOpen(true); }}
              className="mt-6 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Module
            </button>
          </div>
        )}
      </div>

      {/* ── Module Modal ───────────────────────────────────────────────────── */}
      <Modal isOpen={moduleModalOpen} onClose={() => setModuleModalOpen(false)} title={activeModule ? 'Edit Module' : 'Create Module'}>
        <form onSubmit={handleSaveModule} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Module Title</label>
            <input
              type="text"
              placeholder="e.g. Introduction & Core Fundamentals"
              value={moduleTitle}
              onChange={e => setModuleTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
          >
            Save Module
          </button>
        </form>
      </Modal>

      {/* ── Lecture Modal ──────────────────────────────────────────────────── */}
      <Modal isOpen={lectureModalOpen} onClose={() => setLectureModalOpen(false)} title={activeLecture ? 'Edit Lecture' : 'Add Lecture'}>
        <form onSubmit={handleSaveLecture} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Lecture Title</label>
            <input
              type="text"
              placeholder="e.g. Python Variables & Data Types"
              value={lectureForm.title}
              onChange={e => setLectureForm(f => ({ ...f, title: e.target.value }))}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Lecture Type</label>
            <select
              value={lectureForm.type}
              onChange={e => setLectureForm(f => ({ ...f, type: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="video">Video Lesson</option>
              <option value="document">Document / PDF</option>
              <option value="text">Written Article / Notes</option>
            </select>
          </div>

          {lectureForm.type === 'text' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Text Content</label>
              <textarea
                rows={4}
                placeholder="Enter written lecture notes..."
                value={lectureForm.content}
                onChange={e => setLectureForm(f => ({ ...f, content: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea
              rows={3}
              placeholder="Short overview of what is taught..."
              value={lectureForm.description}
              onChange={e => setLectureForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
          >
            Save Lecture
          </button>
        </form>
      </Modal>

      {/* ── Asset Upload Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={assetModalOpen} onClose={closeAssetModal} title={`Upload Media — "${assetLecture?.title}"`}>
        <form onSubmit={handleUploadAsset} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
            {assetType === 'video' ? (
              <>
                <strong>📡 Video Upload to ImageKit</strong><br />
                Video files upload securely with live progress tracking. Supported formats: MP4, WebM, MOV.
              </>
            ) : (
              <>
                <strong>☁️ PDF Document Upload</strong><br />
                Documents are uploaded securely and indexed for AI RAG study assistance. Max size: <strong>100 MB</strong>.
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Asset Type</label>
            <select
              value={assetType}
              onChange={e => setAssetType(e.target.value)}
              disabled={uploading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="video">Video File (mp4, webm, mov…)</option>
              <option value="document">Document File (PDF, DOC, DOCX, PPT, PPTX)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Select File</label>
            <input
              type="file"
              accept={assetType === 'video' ? 'video/*' : '.pdf,.doc,.docx,.ppt,.pptx'}
              onChange={e => setAssetFile(e.target.files?.[0] || null)}
              required
              disabled={uploading}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-xs sm:text-sm text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
            />
            {assetFile && (
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
                Selected: <strong>{assetFile.name}</strong> ({(assetFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
                <span>{uploadProgress < 100 ? 'Uploading to ImageKit…' : '✅ Finalizing…'}</span>
                <span className="text-purple-600 font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !assetFile}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 text-white font-bold text-xs transition inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            {uploading ? (
              <>
                <Spinner /> Uploading… {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Upload to ImageKit
              </>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
}
