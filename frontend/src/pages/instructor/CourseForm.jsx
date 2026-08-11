import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createCourse, updateCourse, updateCourseThumbnail, getCourseBySlug, getAllCourses } from '../../api/course.api';
import { getAllCategories } from '../../api/category.api';
import { Spinner } from '../../components/ui/Spinner';
import { Save, ArrowLeft, Upload, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseForm() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(courseId);
  const fileRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    categoryId: '',
    level: 'beginner',
    language: 'English',
    price: 0,
    discountPrice: '',
    requirements: [''],
    learningOutcomes: [''],
  });

  useEffect(() => {
    getAllCategories().then(r => setCategories(r.data.categories || r.data.data?.categories || r.data.data || [])).catch(() => {});

    if (isEdit) {
      // Find course by ID or slug
      getAllCourses({ limit: 100 }).then(r => {
        const list = r.data.data?.courses || r.data.data || [];
        const found = list.find(c => c._id === courseId);
        if (found) {
          setForm({
            title: found.title || '',
            subtitle: found.subtitle || '',
            description: found.description || '',
            categoryId: found.category?._id || found.category || '',
            level: found.level || 'beginner',
            language: found.language || 'English',
            price: found.price || 0,
            discountPrice: found.discountPrice !== null ? found.discountPrice : '',
            requirements: found.requirements?.length ? found.requirements : [''],
            learningOutcomes: found.learningOutcomes?.length ? found.learningOutcomes : [''],
          });
          if (found.thumbnailUrl) setThumbnailPreview(found.thumbnailUrl);
        }
      }).catch(() => toast.error('Failed to load course details'))
        .finally(() => setLoading(false));
    }
  }, [courseId, isEdit]);

  const handleArrayChange = (field, index, value) => {
    setForm(f => {
      const arr = [...f[field]];
      arr[index] = value;
      return { ...f, [field]: arr };
    });
  };

  const addArrayItem = (field) => {
    setForm(f => ({ ...f, [field]: [...f[field], ''] }));
  };

  const removeArrayItem = (field, index) => {
    setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.categoryId) {
      toast.error('Please fill required fields (Title, Description, Category)');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        requirements: form.requirements.filter(r => r.trim()),
        learningOutcomes: form.learningOutcomes.filter(l => l.trim()),
        price: Number(form.price),
        discountPrice: form.discountPrice !== '' ? Number(form.discountPrice) : null,
      };

      let id = courseId;
      if (isEdit) {
        await updateCourse(courseId, payload);
        toast.success('Course updated successfully');
      } else {
        const res = await createCourse(payload);
        const created = res.data.course || res.data.data?.course || res.data.data || res.data;
        id = created?._id;
        toast.success('Course created successfully!');
      }

      if (thumbnailFile && id) {
        const fd = new FormData();
        fd.append('thumbnail', thumbnailFile);
        await updateCourseThumbnail(id, fd);
        toast.success('Thumbnail uploaded!');
      }

      navigate(`/instructor/courses/${id}/curriculum`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loader"><Spinner /></div>;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 style={{ marginBottom: '0.25rem' }}>{isEdit ? 'Edit Course' : 'Create New Course'}</h1>
            <p>{isEdit ? 'Update course information' : 'Step 1: Set up basic course details'}</p>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: 800 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Thumbnail */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <label className="input-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Course Thumbnail</label>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 180, height: 100, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-surface-hover)', border: '1px dashed var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Upload size={24} color="var(--text-muted)" />
                )}
              </div>
              <div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                  <Upload size={14} /> Upload Image
                </button>
                <input type="file" ref={fileRef} accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>PNG, JPG or WEBP under 5MB</p>
              </div>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="course-title">Course Title *</label>
              <input
                id="course-title"
                type="text"
                className="input-field"
                placeholder="e.g. Master React & Redux Toolkit"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="course-subtitle">Subtitle</label>
              <input
                id="course-subtitle"
                type="text"
                className="input-field"
                placeholder="Short tagline explaining what students will learn"
                value={form.subtitle}
                onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="course-desc">Description *</label>
              <textarea
                id="course-desc"
                className="input-field"
                rows={5}
                placeholder="Detailed description of the course content..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Metadata & Pricing */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="course-cat">Category *</label>
              <select
                id="course-cat"
                className="input-field"
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                required
              >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="course-level">Level</label>
              <select
                id="course-level"
                className="input-field"
                value={form.level}
                onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="all-levels">All Levels</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="course-price">Price (₹)</label>
              <input
                id="course-price"
                type="number"
                min="0"
                className="input-field"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="course-disc-price">Discounted Price (₹)</label>
              <input
                id="course-disc-price"
                type="number"
                min="0"
                className="input-field"
                placeholder="Optional"
                value={form.discountPrice}
                onChange={e => setForm(f => ({ ...f, discountPrice: e.target.value }))}
              />
            </div>
          </div>

          {/* Requirements */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <label className="input-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Requirements</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {form.requirements.map((req, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Basic HTML/CSS knowledge"
                    value={req}
                    onChange={e => handleArrayChange('requirements', i, e.target.value)}
                  />
                  {form.requirements.length > 1 && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeArrayItem('requirements', i)} style={{ color: 'var(--color-error)' }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => addArrayItem('requirements')}>
              <Plus size={14} /> Add Requirement
            </button>
          </div>

          {/* Outcomes */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <label className="input-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Learning Outcomes</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {form.learningOutcomes.map((out, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Build real-world React apps from scratch"
                    value={out}
                    onChange={e => handleArrayChange('learningOutcomes', i, e.target.value)}
                  />
                  {form.learningOutcomes.length > 1 && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeArrayItem('learningOutcomes', i)} style={{ color: 'var(--color-error)' }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => addArrayItem('learningOutcomes')}>
              <Plus size={14} /> Add Learning Outcome
            </button>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={saving} style={{ justifyContent: 'center' }}>
            {saving ? <div className="spinner spinner-sm" /> : <><Save size={18} /> {isEdit ? 'Save & Continue to Curriculum' : 'Create & Continue to Curriculum'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}
