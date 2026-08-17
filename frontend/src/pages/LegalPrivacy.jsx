import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, Eye, Database, Globe, Clock } from 'lucide-react';

export default function LegalPrivacy() {
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
            <span>Last Updated: August 2026</span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 dark:from-[#151230] dark:via-[#1a1540] dark:to-[#0f0d22] border border-purple-400/40 dark:border-purple-600/30 p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 dark:bg-purple-900/60 text-white dark:text-purple-200 text-xs font-bold backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Data Protection &amp; Privacy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              VertexPortal Privacy Policy
            </h1>
            <p className="text-sm sm:text-base text-purple-100 dark:text-purple-200/90 leading-relaxed max-w-2xl">
              We value your trust and are dedicated to safeguarding your personal data, code snippets, and learning credentials with enterprise-grade encryption.
            </p>
          </div>
        </div>

        {/* Policy Content Sections */}
        <div className="bg-white dark:bg-[#161928] border border-gray-200/90 dark:border-[#2a2f4e] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 text-sm sm:text-base text-gray-700 dark:text-slate-300 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
              1. Information We Collect
            </h2>
            <p>
              When you use VertexPortal, we collect information you provide directly to us:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-gray-600 dark:text-slate-400">
              <li><strong>Account Profile:</strong> Full name, email address, avatar, role (Student, Instructor), and authentication credentials.</li>
              <li><strong>Learning Activity:</strong> Course progress, lecture completions, quiz submissions, assignment files, and certificates earned.</li>
              <li><strong>Interactive Inputs:</strong> Prompts submitted to the AI Tutor, playground code snippets, and discussion forum replies.</li>
              <li><strong>Payment Records:</strong> Transaction IDs, order timestamps, and coupon usage records (we do not store raw credit card numbers).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              2. How We Use and Protect Your Data
            </h2>
            <p>
              Your data is utilized strictly to provide, personalize, and enhance the LMS platform:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-gray-600 dark:text-slate-400">
              <li>Delivering contextual AI tutor answers using Retrieval-Augmented Generation (RAG).</li>
              <li>Issuing tamper-evident, cryptographically signed digital certificates of completion.</li>
              <li>Providing real-time live streaming classrooms and synchronized interactive code execution.</li>
              <li>All database transmissions are secured using TLS 1.3 encryption and AES-256 storage standards.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
              3. AI &amp; Code Sandbox Data Isolation
            </h2>
            <p>
              Your browser-based code executions and private AI conversation threads are sandboxed. We do not use your private code or academic submissions to train public AI foundation models.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              4. Your Rights and Data Deletion
            </h2>
            <p>
              You have the right to access, export, or permanently delete your account and associated learning history at any time from your Profile Settings or by contacting our data protection desk.
            </p>
          </section>

          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-xs sm:text-sm text-purple-900 dark:text-purple-200 flex items-center justify-between">
            <div>
              <p className="font-bold">Have privacy questions or need data export?</p>
              <p className="text-xs text-purple-700 dark:text-purple-300">Contact our Data Protection Officer at privacy@vertexportal.dev</p>
            </div>
            <Link
              to="/help"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 ml-3"
            >
              Contact Support
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
