import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getManageModules, createModule, updateModule, deleteModule, publishModule } from '../../api/module.api';
import {
  getManageLectures, createLecture, updateLecture, archiveLecture,
  publishLecture, uploadLectureVideo, uploadLectureDocument,
} from '../../api/lecture.api';
import { indexCourseForRag } from '../../api/rag.api';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Plus, Edit3, Trash2, Globe, Video, FileText, Upload, ArrowLeft, Eye, Download, X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';


export default function Curriculum() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPreviewIds, setExpandedPreviewIds] = useState([]);

  // Module modal
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [activeModule, setActiveModule] = useState(null);
  const [moduleTitle, setModuleTitle] = useState('');

  // Lecture modal
  const [lectureModalOpen, setLectureModalOpen] = useState(false);
  const [activeLecture, setActiveLecture] = useState(null);
  const [targetModuleId, setTargetModuleId] = useState(null);
  const [lectureForm, setLectureForm] = useState({ title: '', description: '', content: '', type: 'video' });

  // Asset upload modal
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetLecture, setAssetLecture] = useState(null);
  const [assetType, setAssetType] = useState('video');
  const [assetFile, setAssetFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Delete this module?')) return;
    try {
      await deleteModule(moduleId);
      toast.success('Module deleted');
      fetchModulesAndLectures();
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
  };

  const handleTogglePublishModule = async (moduleId) => {
    try {
      await publishModule(moduleId);
      toast.success('Module status updated');
      fetchModulesAndLectures();
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
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
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
  };

  const handleTogglePublishLecture = async (lectureId) => {
    try {
      await publishLecture(lectureId);
      toast.success('Lecture status updated');
      fetchModulesAndLectures();
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
  };

  const handleDeleteLecture = async (lectureId) => {
    if (!window.confirm('Archive this lecture?')) return;
    try {
      await archiveLecture(lectureId);
      toast.success('Lecture archived');
      fetchModulesAndLectures();
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
  };

  // ── Asset upload handler — Server-side ImageKit upload with progress ────────
  const handleUploadAsset = async (e) => {
    e.preventDefault();
    if (!assetFile || !assetLecture) return;

    const MAX_SIZE = 100 * 1024 * 1024; // 100 MB ImageKit single-file limit
    if (assetFile.size > MAX_SIZE) {
      toast.error(`File size (${(assetFile.size / 1024 / 1024).toFixed(1)} MB) exceeds ImageKit's 100 MB upload limit. Please choose a smaller file.`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const fd = new FormData();
    try {
      if (assetType === 'document') {
        fd.append('document', assetFile);
        await uploadLectureDocument(assetLecture._id, fd, (pct) => setUploadProgress(pct));
        toast.success('Document uploaded to ImageKit successfully!');
      } else {
        fd.append('video', assetFile);
        await uploadLectureVideo(assetLecture._id, fd, (pct) => setUploadProgress(pct));
        toast.success('Video uploaded to ImageKit successfully!');
      }

      setAssetModalOpen(false);
      setAssetFile(null);
      setUploadProgress(0);

      // Auto-open preview for this lecture
      if (!expandedPreviewIds.includes(assetLecture._id)) {
        setExpandedPreviewIds(prev => [...prev, assetLecture._id]);
      }
      fetchModulesAndLectures();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleIndexRag = async () => {
    setUploading(true);
    try {
      await indexCourseForRag(courseId);
      toast.success('Course curriculum and resources indexed into AI RAG knowledge base!');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'AI RAG indexing failed');
    } finally {
      setUploading(false);
    }
  };

  const closeAssetModal = () => {
    if (uploading) return; // prevent accidental close during upload
    setAssetModalOpen(false);
    setAssetFile(null);
    setUploadProgress(0);
  };

  if (loading) return <div className="page-loader"><Spinner /></div>;

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (window.history.length > 1 && window.history.state?.idx > 0) {
                  navigate(-1);
                } else {
                  navigate('/instructor/dashboard');
                }
              }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <div>
              <h1 style={{ marginBottom: '0.25rem' }}>Curriculum Builder</h1>
              <p>Upload videos directly to ImageKit cloud — no server size limits</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              onClick={handleIndexRag}
              disabled={uploading}
              title="Index course curriculum for AI Tutor"
            >
              <Sparkles size={16} color="#8b5cf6" /> Index AI RAG
            </button>
            <button
              className="btn btn-primary"
              onClick={() => { setActiveModule(null); setModuleTitle(''); setModuleModalOpen(true); }}
              id="add-module-btn"
            >
              <Plus size={18} /> Add Module
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: 900 }}>
        {modules.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {modules.map((mod, mi) => (
              <div key={mod._id} className="glass-card" style={{ padding: '1.25rem' }}>
                {/* Module Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>Module {mi + 1}:</span>
                    <h3 style={{ fontSize: '1.125rem' }}>{mod.title}</h3>
                    <span className={`badge ${mod.isPublished ? 'badge-success' : 'badge-warning'}`}>
                      {mod.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setActiveModule(mod); setModuleTitle(mod.title); setModuleModalOpen(true); }}><Edit3 size={14} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleTogglePublishModule(mod._id)}><Globe size={14} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDeleteModule(mod._id)}><Trash2 size={14} /></button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setTargetModuleId(mod._id); setActiveLecture(null); setLectureForm({ title: '', description: '', content: '', type: 'video' }); setLectureModalOpen(true); }}
                    >
                      <Plus size={14} /> Add Lecture
                    </button>
                  </div>
                </div>

                {/* Lectures */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(mod.lectures || []).map((lec, li) => {
                    const isExpanded = expandedPreviewIds.includes(lec._id);
                    const hasMedia = Boolean(lec.videoUrl || lec.documentUrl || lec.content);

                    return (
                      <div key={lec._id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
                        {/* Lecture Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', background: 'rgba(255,255,255,0.03)', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {lec.type === 'video' || lec.contentType === 'video'
                              ? <Video size={18} color="var(--color-secondary)" />
                              : <FileText size={18} color="var(--color-primary-light)" />
                            }
                            <div>
                              <p style={{ fontWeight: 600, fontSize: '0.9375rem', margin: 0 }}>
                                {li + 1}. {lec.title} <span style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 400 }}>({lec.type || 'video'})</span>
                              </p>
                              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                <span>{lec.isPublished ? 'Published' : 'Draft'}</span>
                                {lec.videoUrl && <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>• Video Ready</span>}
                                {lec.documentUrl && <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>• Document Attached</span>}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            {hasMedia && (
                              <button
                                className={`btn btn-sm ${isExpanded ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => togglePreview(lec._id)}
                                title="Toggle Preview Box"
                              >
                                <Eye size={14} /> {isExpanded ? 'Hide' : 'Preview'}
                              </button>
                            )}
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => { setAssetLecture(lec); setAssetType(lec.type === 'document' ? 'document' : 'video'); setAssetFile(null); setUploadProgress(0); setAssetModalOpen(true); }}
                              title="Upload Media"
                            >
                              <Upload size={14} /> Upload
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleTogglePublishLecture(lec._id)}><Globe size={14} /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setActiveLecture(lec); setLectureForm({ title: lec.title, description: lec.description || '', content: lec.content || '', type: lec.type || 'video' }); setLectureModalOpen(true); }}><Edit3 size={14} /></button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDeleteLecture(lec._id)}><Trash2 size={14} /></button>
                          </div>
                        </div>

                        {/* Preview Box */}
                        {isExpanded && (
                          <div style={{ padding: '1.25rem', borderTop: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.4)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <h5 style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                                📺 Admin Preview — {lec.title}
                              </h5>
                              <button className="btn btn-ghost btn-sm" onClick={() => togglePreview(lec._id)}><X size={14} /> Close</button>
                            </div>

                            {lec.videoUrl ? (
                              <div style={{ background: '#000', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxWidth: 640 }}>
                                <video
                                  src={lec.videoUrl}
                                  controls
                                  controlsList="nodownload"
                                  disablePictureInPicture
                                  onContextMenu={e => e.preventDefault()}
                                  style={{ width: '100%', maxHeight: 340, display: 'block' }}
                                />
                              </div>
                            ) : lec.documentUrl ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--color-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <FileText size={32} color="var(--color-primary-light)" />
                                    <div>
                                      <p style={{ fontWeight: 600, margin: 0 }}>{lec.title}</p>
                                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>Document Resource</p>
                                    </div>
                                  </div>
                                  <a href={lec.documentUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                                    <Download size={14} /> Open / Download
                                  </a>
                                </div>
                                {lec.documentUrl.toLowerCase().includes('.pdf') && (
                                  <iframe src={lec.documentUrl} title={lec.title} style={{ width: '100%', height: 380, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: '#fff' }} />
                                )}
                              </div>
                            ) : lec.content ? (
                              <div style={{ padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', lineHeight: 1.6, fontSize: '0.9375rem', whiteSpace: 'pre-wrap' }}>
                                {lec.content}
                              </div>
                            ) : (
                              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No media uploaded yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {(!mod.lectures || mod.lectures.length === 0) && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>No lectures in this module yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={48} /></div>
            <h3>Curriculum is empty</h3>
            <p>Add your first module to begin structuring your course.</p>
            <button className="btn btn-primary" onClick={() => { setActiveModule(null); setModuleTitle(''); setModuleModalOpen(true); }} style={{ marginTop: '1.5rem' }}>
              <Plus size={18} /> Add Module
            </button>
          </div>
        )}
      </div>

      {/* ── Module Modal ───────────────────────────────────────────────────── */}
      <Modal isOpen={moduleModalOpen} onClose={() => setModuleModalOpen(false)} title={activeModule ? 'Edit Module' : 'Create Module'}>
        <form onSubmit={handleSaveModule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Module Title</label>
            <input type="text" className="input-field" placeholder="e.g. Introduction & Fundamentals" value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Save Module</button>
        </form>
      </Modal>

      {/* ── Lecture Modal ──────────────────────────────────────────────────── */}
      <Modal isOpen={lectureModalOpen} onClose={() => setLectureModalOpen(false)} title={activeLecture ? 'Edit Lecture' : 'Create Lecture'}>
        <form onSubmit={handleSaveLecture} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Lecture Title *</label>
            <input type="text" className="input-field" placeholder="e.g. Setting Up Your Environment" value={lectureForm.title} onChange={e => setLectureForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="input-group">
            <label className="input-label">Lecture Type</label>
            <select className="input-field" value={lectureForm.type} onChange={e => setLectureForm(f => ({ ...f, type: e.target.value }))}>
              <option value="video">Video</option>
              <option value="document">Document (PDF / Word)</option>
              <option value="text">Text Content</option>
            </select>
          </div>
          {lectureForm.type === 'text' && (
            <div className="input-group">
              <label className="input-label">Text Content</label>
              <textarea className="input-field" rows={4} placeholder="Enter written lecture material..." value={lectureForm.content} onChange={e => setLectureForm(f => ({ ...f, content: e.target.value }))} />
            </div>
          )}
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="input-field" rows={3} placeholder="Short overview of this lesson..." value={lectureForm.description} onChange={e => setLectureForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Save Lecture</button>
        </form>
      </Modal>

      {/* ── Asset Upload Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={assetModalOpen} onClose={closeAssetModal} title={`Upload Media — "${assetLecture?.title}"`}>
        <form onSubmit={handleUploadAsset} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Upload method info */}
          <div style={{ background: 'rgba(99,179,237,0.08)', border: '1px solid rgba(99,179,237,0.3)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--color-info, #63b3ed)', lineHeight: 1.6 }}>
            {assetType === 'video' ? (
              <>
                <strong>📡 Client-Side Direct Upload</strong><br />
                Your video uploads <strong>directly from your browser to ImageKit</strong> — it never passes through our server. This supports large files up to your ImageKit plan limit. A real-time progress bar will track the upload.
              </>
            ) : (
              <>
                <strong>☁️ Server Upload to ImageKit</strong><br />
                Documents are uploaded via the server. Max file size: <strong>100 MB</strong>. Supported: PDF, DOC, DOCX, PPT, PPTX.
              </>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">Asset Type</label>
            <select className="input-field" value={assetType} onChange={e => setAssetType(e.target.value)} disabled={uploading}>
              <option value="video">Video File (mp4, webm, mov…)</option>
              <option value="document">Document File (PDF, DOC, DOCX, PPT, PPTX)</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Select File</label>
            <input
              type="file"
              className="input-field"
              accept={assetType === 'video' ? 'video/*' : '.pdf,.doc,.docx,.ppt,.pptx'}
              onChange={e => setAssetFile(e.target.files?.[0] || null)}
              required
              disabled={uploading}
            />
            {assetFile && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                Selected: <strong>{assetFile.name}</strong> ({(assetFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                <span>{uploadProgress < 100 ? 'Uploading to ImageKit…' : '✅ Saving to database…'}</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${uploadProgress}%`,
                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                    borderRadius: 999,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={uploading || !assetFile} style={{ justifyContent: 'center' }}>
            {uploading
              ? <><div className="spinner spinner-sm" /> Uploading… {uploadProgress}%</>
              : <><Upload size={16} /> Upload to ImageKit</>
            }
          </button>
        </form>
      </Modal>
    </div>
  );
}
