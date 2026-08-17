import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, CheckCircle2, Shield, Scale, Award, AlertCircle, Clock } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0f1a] text-gray-900 dark:text-gray-100 font-[Inter,sans-serif] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#161928] text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 shadow-2xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            <span>Effective Date: August 2026</span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 dark:from-[#151230] dark:via-[#1a1540] dark:to-[#0f0d22] border border-purple-400/40 dark:border-purple-600/30 p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 dark:bg-purple-900/60 text-white dark:text-purple-200 text-xs font-bold backdrop-blur-md">
              <Scale className="w-4 h-4 text-amber-300" />
              <span>Platform Agreement</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Terms of Service
            </h1>
            <p className="text-sm sm:text-base text-purple-100 dark:text-purple-200/90 leading-relaxed max-w-2xl">
              Welcome to VertexPortal. These Terms govern your access to our interactive courses, live sessions, AI tutor assistance, and certificate credentials.
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="bg-white dark:bg-[#161928] border border-gray-200/90 dark:border-[#2a2f4e] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 text-sm sm:text-base text-gray-700 dark:text-slate-300 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
              1. Acceptance of Terms
            </h2>
            <p>
              By creating an account or accessing VertexPortal, you agree to comply with these terms, community guidelines, and applicable local and international copyright laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              2. Course Access &amp; Lifetime License
            </h2>
            <p>
              When you enroll in a paid or free course, VertexPortal grants you a personal, non-exclusive, non-transferable license to access the lecture videos, source code repositories, and interactive exercises for continuous educational purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500 shrink-0" />
              3. Certificates of Completion
            </h2>
            <p>
              Certificates are awarded upon achieving verified completion criteria (quizzes passed and 100% lecture milestones). Cryptographic signatures generated on certificates are unique to the learner account and are permanently publicly verifiable.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              4. Community Code of Conduct
            </h2>
            <p>
              Our discussion boards, code reviews, and live class chats require mutual respect. Harassment, spamming, academic dishonesty, and posting malicious code are strictly prohibited and may result in immediate suspension.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              5. Refund Policy
            </h2>
            <p>
              We offer a straightforward 7-day money-back guarantee for course purchases if less than 25% of course content has been consumed. Contact support for instant review.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
