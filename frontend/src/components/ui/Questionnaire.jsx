import React, { useState } from 'react';
import { Check, HelpCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

/**
 * Shadcn-style Questionnaire / Quiz component
 * https://ui.shadcn.com/docs/components/base/questionnaire
 */
export function Questionnaire({
  questions = [],
  onComplete,
  title = 'Interactive Assessment',
  className = '',
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  if (!questions || questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleSelectOption = (optionIndex) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (isLast) {
      if (onComplete) onComplete(answers);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-[#161928] border border-gray-200 dark:border-[#2a2f4e] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 max-w-2xl mx-auto ${className}`}
    >
      {/* Top Header & Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>{title}</span>
          </div>
          <span className="text-xs font-mono font-bold text-gray-500 dark:text-slate-400">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Prompt */}
      <div className="space-y-1">
        <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white leading-snug">
          {currentQ.question}
        </h3>
        {currentQ.description && (
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {currentQ.description}
          </p>
        )}
      </div>

      {/* Options List */}
      <div className="space-y-2.5">
        {currentQ.options.map((opt, idx) => {
          const isSelected = answers[currentIndex] === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectOption(idx)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border text-xs sm:text-sm font-semibold text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:border-purple-300 dark:hover:border-purple-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                    isSelected
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{typeof opt === 'string' ? opt : opt.text || opt.label}</span>
              </div>
              {isSelected && (
                <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
        >
          Previous
        </button>

        <button
          type="button"
          disabled={answers[currentIndex] === undefined}
          onClick={handleNext}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-600/25 transition-all inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
        >
          <span>{isLast ? 'Complete Assessment' : 'Next Question'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Questionnaire;
