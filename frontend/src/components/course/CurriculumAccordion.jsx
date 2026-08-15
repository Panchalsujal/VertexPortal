import React, { useState } from 'react';
import { ChevronDown, PlayCircle, FileText, CheckCircle2, Circle } from 'lucide-react';

function formatDuration(s) {
  if (!s || s <= 0) return '';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function CurriculumAccordion({
  modules = [],
  completedLectureIds = [],
  onLectureSelect,
  activeLectureId,
}) {
  const [openModules, setOpenModules] = useState(() => {
    const activeMod = modules.find((m) =>
      (m.lectures || []).some((l) => l._id === activeLectureId)
    );
    return activeMod ? [activeMod._id] : [modules[0]?._id].filter(Boolean);
  });

  const toggleModule = (id) => {
    setOpenModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-3 font-[Inter,sans-serif]">
      {modules.map((mod, mi) => {
        const isOpen = openModules.includes(mod._id);
        const lectures = mod.lectures || [];
        const completedInMod = lectures.filter((l) =>
          completedLectureIds.includes(l._id)
        ).length;

        return (
          <div
            key={mod._id}
            className="bg-gray-50/90 dark:bg-slate-800/60 border border-gray-200/90 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-xs transition-all"
          >
            {/* Module Header */}
            <button
              type="button"
              onClick={() => toggleModule(mod._id)}
              className={`w-full p-3.5 px-4 flex items-center justify-between text-left transition-colors cursor-pointer ${
                isOpen
                  ? 'bg-gray-100/90 dark:bg-slate-800'
                  : 'hover:bg-gray-100/60 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-xs font-bold shrink-0">
                  {mi + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                    {mod.title}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                    {completedInMod}/{lectures.length} completed
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-purple-600 dark:text-purple-400' : ''
                }`}
              />
            </button>

            {/* Lectures List */}
            {isOpen && (
              <div className="border-t border-gray-200/90 dark:border-slate-700/80 divide-y divide-gray-200/60 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                {lectures.map((lec) => {
                  const isCompleted = completedLectureIds.includes(lec._id);
                  const isActive = lec._id === activeLectureId;
                  const isVideo = (lec.type || lec.contentType) === 'video';

                  return (
                    <button
                      key={lec._id}
                      type="button"
                      onClick={() => onLectureSelect?.(lec)}
                      className={`w-full pl-5 pr-4 py-3 flex items-center gap-3 text-xs font-medium text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-200 border-l-4 border-purple-600 font-bold shadow-inner'
                          : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-white border-l-4 border-transparent'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : isVideo ? (
                        <PlayCircle
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-slate-500'
                          }`}
                        />
                      ) : (
                        <FileText
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-slate-500'
                          }`}
                        />
                      )}
                      <span className="flex-1 truncate leading-tight">{lec.title}</span>
                      {lec.durationInSeconds > 0 && (
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0 font-mono">
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
