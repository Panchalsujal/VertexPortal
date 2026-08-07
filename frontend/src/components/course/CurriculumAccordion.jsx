import { useState } from 'react';
import { ChevronDown, PlayCircle, FileText, Lock, CheckCircle } from 'lucide-react';

function formatDuration(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function CurriculumAccordion({ modules = [], completedLectureIds = [], onLectureSelect, activeLectureId }) {
  const [openModules, setOpenModules] = useState([modules[0]?._id]);

  const toggleModule = (id) => {
    setOpenModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {modules.map((mod, mi) => (
        <div key={mod._id} style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}>
          {/* Module Header */}
          <button
            onClick={() => toggleModule(mod._id)}
            style={{
              width: '100%', padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: openModules.includes(mod._id) ? 'rgba(124,58,237,0.06)' : 'transparent',
              transition: 'background 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: 'white', flexShrink: 0,
              }}>{mi + 1}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{mod.title}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {mod.lectures?.length || 0} lectures
                </p>
              </div>
            </div>
            <ChevronDown
              size={18}
              style={{
                color: 'var(--text-muted)', flexShrink: 0,
                transform: openModules.includes(mod._id) ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </button>

          {/* Lectures */}
          {openModules.includes(mod._id) && (
            <div style={{ borderTop: '1px solid var(--color-border)' }}>
              {(mod.lectures || []).map(lec => {
                const isCompleted = completedLectureIds.includes(lec._id);
                const isActive = lec._id === activeLectureId;
                const isVideo = (lec.type || lec.contentType) === 'video';

                return (
                  <button
                    key={lec._id}
                    onClick={() => onLectureSelect?.(lec)}
                    style={{
                      width: '100%', padding: '0.75rem 1.25rem 0.75rem 2rem',
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      background: isActive ? 'rgba(124,58,237,0.12)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                      transition: 'all 0.15s',
                      cursor: onLectureSelect ? 'pointer' : 'default',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {isCompleted ? (
                      <CheckCircle size={16} color="var(--color-success)" style={{ flexShrink: 0 }} />
                    ) : isVideo ? (
                      <PlayCircle size={16} color={isActive ? 'var(--color-primary-light)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                    ) : (
                      <FileText size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    )}
                    <span style={{
                      flex: 1, textAlign: 'left', fontSize: '0.875rem',
                      color: isActive ? 'var(--color-primary-light)' : isCompleted ? 'var(--text-secondary)' : 'var(--text-secondary)',
                    }}>
                      {lec.title}
                    </span>
                    {lec.durationInSeconds > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {formatDuration(lec.durationInSeconds)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
