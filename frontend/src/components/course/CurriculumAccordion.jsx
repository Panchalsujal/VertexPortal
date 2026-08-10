import { useState } from 'react';
import { ChevronDown, PlayCircle, FileText, CheckCircle } from 'lucide-react';

function formatDuration(s) {
  if (!s || s <= 0) return '';
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
    <div className="space-y-2">
      {modules.map((mod, mi) => {
        const isOpen = openModules.includes(mod._id);
        const lectureCount = mod.lectures?.length || 0;

        return (
          <div
            key={mod._id}
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs"
          >
            {/* Module Header */}
            <button
              type="button"
              onClick={() => toggleModule(mod._id)}
              className={`w-full p-3.5 flex items-center justify-between text-left transition-colors ${
                isOpen ? 'bg-blue-50/50 dark:bg-slate-800/50' : 'hover:bg-gray-50 dark:hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {mi + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{mod.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {lectureCount} {lectureCount === 1 ? 'lecture' : 'lectures'}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                }`}
              />
            </button>

            {/* Lectures */}
            {isOpen && (
              <div className="border-t border-gray-200 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800/60">
                {(mod.lectures || []).map((lec) => {
                  const isCompleted = completedLectureIds.includes(lec._id);
                  const isActive = lec._id === activeLectureId;
                  const isVideo = (lec.type || lec.contentType) === 'video';

                  return (
                    <button
                      key={lec._id}
                      type="button"
                      onClick={() => onLectureSelect?.(lec)}
                      className={`w-full pl-6 pr-4 py-3 flex items-center gap-3 text-xs font-medium text-left transition-all ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : isVideo ? (
                        <PlayCircle className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                      ) : (
                        <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                      )}
                      <span className="flex-1 truncate">{lec.title}</span>
                      {lec.durationInSeconds > 0 && (
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">
                          {formatDuration(lec.durationInSeconds)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
