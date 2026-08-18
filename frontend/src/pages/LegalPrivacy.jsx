import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, ArrowLeft, Lock, Eye, Database, Globe, Clock, Sparkles } from 'lucide-react';

export default function LegalPrivacy() {
  const seoTitle = 'Privacy Policy & Data Protection — NavGujarat Academy';
  const seoDescription =
    'Read the NavGujarat Academy Privacy Policy. Learn how we collect, protect, and isolate your personal data, code snippets, AI interactions, and verified credentials.';
  const canonicalUrl = 'https://navgujaratacademy.online/privacy';
  const seoImage = 'https://navgujaratacademy.online/og-image.png';

  const privacyStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'NavGujarat Academy Privacy Policy',
    url: canonicalUrl,
    description: seoDescription,
    publisher: {
      '@type': 'Organization',
      name: 'NavGujarat Academy',
      url: 'https://navgujaratacademy.online',
    },
  };

  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://navgujaratacademy.online/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Privacy Policy',
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <Helmet>
        {/* Dynamic Title */}
        <title>{seoTitle}</title>

        {/* Primary Meta Tags */}
        <meta name="description" content={seoDescription} />
        <meta name="robots" content="index, follow" />
        <meta
          name="keywords"
          content="privacy policy, data protection, security, AI sandbox privacy, navgujaratacademy privacy"
        />

        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="NavGujarat Academy" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={seoImage} />
        <meta property="og:image:alt" content="NavGujarat Academy Privacy Policy" />

        {/* Twitter Metadata */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={seoImage} />

        {/* Structured Data: WebPage */}
        <script type="application/ld+json">
          {JSON.stringify(privacyStructuredData)}
        </script>

        {/* Structured Data: Breadcrumbs */}
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbStructuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0f1a] text-gray-900 dark:text-gray-100 font-[Inter,sans-serif] py-6 sm:py-10 md:py-12 px-3.5 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Top Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center self-start gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#161928] text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 shadow-xs hover:shadow-sm transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span>Last Updated: August 2026</span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 dark:from-[#151230] dark:via-[#1a1540] dark:to-[#0f0d22] border border-purple-400/40 dark:border-purple-600/30 p-5 sm:p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 dark:bg-purple-900/60 text-white dark:text-purple-200 text-xs font-bold backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Data Protection &amp; Privacy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white break-words">
              NavGujarat Academy Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-purple-100 dark:text-purple-200/90 leading-relaxed max-w-2xl">
              We value your trust and are dedicated to safeguarding your personal data, code snippets, and learning credentials with enterprise-grade encryption.
            </p>
          </div>
        </div>

        {/* Policy Content Sections */}
        <div className="bg-white dark:bg-[#161928] border border-gray-200/90 dark:border-[#2a2f4e] rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-sm space-y-6 sm:space-y-8 text-xs sm:text-sm md:text-base text-gray-700 dark:text-slate-300 leading-relaxed">
          
          <section className="space-y-2.5 sm:space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>1. Information We Collect</span>
            </h2>
            <p className="text-gray-700 dark:text-slate-300">
              When you use NavGujarat Academy, we collect information you provide directly to us:
            </p>
            <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 text-xs sm:text-sm text-gray-600 dark:text-slate-400">
              <li><strong className="text-gray-900 dark:text-slate-200">Account Profile:</strong> Full name, email address, avatar, role (Student, Instructor), and authentication credentials.</li>
              <li><strong className="text-gray-900 dark:text-slate-200">Learning Activity:</strong> Course progress, lecture completions, quiz submissions, assignment files, and certificates earned.</li>
              <li><strong className="text-gray-900 dark:text-slate-200">Interactive Inputs:</strong> Prompts submitted to the AI Tutor, playground code snippets, and discussion forum replies.</li>
              <li><strong className="text-gray-900 dark:text-slate-200">Payment Records:</strong> Transaction IDs, order timestamps, and coupon usage records (we do not store raw credit card numbers).</li>
            </ul>
          </section>

          <section className="space-y-2.5 sm:space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>2. How We Use and Protect Your Data</span>
            </h2>
            <p className="text-gray-700 dark:text-slate-300">
              Your data is utilized strictly to provide, personalize, and enhance the LMS platform:
            </p>
            <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 text-xs sm:text-sm text-gray-600 dark:text-slate-400">
              <li>Delivering contextual AI tutor answers using Retrieval-Augmented Generation (RAG).</li>
              <li>Issuing tamper-evident, cryptographically signed digital certificates of completion.</li>
              <li>Providing real-time live streaming classrooms and synchronized interactive code execution.</li>
              <li>All database transmissions are secured using TLS 1.3 encryption and AES-256 storage standards.</li>
            </ul>
          </section>

          <section className="space-y-2.5 sm:space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>3. AI &amp; Code Sandbox Data Isolation</span>
            </h2>
            <p className="text-gray-700 dark:text-slate-300">
              Your browser-based code executions and private AI conversation threads are sandboxed. We do not use your private code or academic submissions to train public AI foundation models.
            </p>
          </section>

          <section className="space-y-2.5 sm:space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>4. Your Rights and Data Deletion</span>
            </h2>
            <p className="text-gray-700 dark:text-slate-300">
              You have the right to access, export, or permanently delete your account and associated learning history at any time from your Profile Settings or by contacting our data protection desk.
            </p>
          </section>

          {/* Contact Support Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-bold text-xs sm:text-sm text-purple-950 dark:text-purple-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                Have privacy questions or need data export?
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 break-all">
                Contact our Data Protection Officer at <span className="font-medium underline">privacy@navgujaratacademy.online</span>
              </p>
            </div>
            <Link
              to="/help"
              className="w-full sm:w-auto text-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 shrink-0"
            >
              Contact Support
            </Link>
          </div>

        </div>
      </div>
    </div>
  </>
);
}
