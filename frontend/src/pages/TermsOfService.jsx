import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FileText, ArrowLeft, CheckCircle2, Shield, Scale, Award, AlertCircle, Clock } from 'lucide-react';

export default function TermsOfService() {
  const seoTitle = 'Terms of Service & User Agreement — NavGujarat Academy';
  const seoDescription =
    'Read the NavGujarat Academy Terms of Service and user agreement. Understand course access licenses, verified certificate rules, community guidelines, and refund policy.';
  const canonicalUrl = 'https://navgujaratacademy.online/terms';
  const seoImage = 'https://navgujaratacademy.online/og-image.png';

  const termsStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'NavGujarat Academy Terms of Service',
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
        name: 'Terms of Service',
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
          content="terms of service, user agreement, course license, navgujaratacademy terms, refund policy"
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
        <meta property="og:image:alt" content="NavGujarat Academy Terms of Service" />

        {/* Twitter Metadata */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={seoImage} />

        {/* Structured Data: WebPage */}
        <script type="application/ld+json">
          {JSON.stringify(termsStructuredData)}
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
            <span>Effective Date: August 2026</span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 dark:from-[#151230] dark:via-[#1a1540] dark:to-[#0f0d22] border border-purple-400/40 dark:border-purple-600/30 p-5 sm:p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 dark:bg-purple-900/60 text-white dark:text-purple-200 text-xs font-bold backdrop-blur-md">
              <Scale className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Platform Agreement</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white break-words">
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-purple-100 dark:text-purple-200/90 leading-relaxed max-w-2xl">
              Welcome to NavGujarat Academy. These Terms govern your access to our interactive courses, live sessions, AI tutor assistance, and certificate credentials.
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="bg-white dark:bg-[#161928] border border-gray-200/90 dark:border-[#2a2f4e] rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-sm space-y-6 sm:space-y-8 text-xs sm:text-sm md:text-base text-gray-700 dark:text-slate-300 leading-relaxed">
          
          <section className="space-y-2.5 sm:space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>1. Acceptance of Terms</span>
            </h2>
            <p className="text-gray-700 dark:text-slate-300">
              By creating an account or accessing NavGujarat Academy, you agree to comply with these terms, community guidelines, and applicable local and international copyright laws.
            </p>
          </section>

          <section className="space-y-2.5 sm:space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>2. Course Access &amp; Lifetime License</span>
            </h2>
            <p className="text-gray-700 dark:text-slate-300">
              When you enroll in a paid or free course, NavGujarat Academy grants you a personal, non-exclusive, non-transferable license to access the lecture videos, source code repositories, and interactive exercises for continuous educational purposes.
            </p>
          </section>

          <section className="space-y-2.5 sm:space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500 shrink-0" />
              <span>3. Certificates of Completion</span>
            </h2>
            <p className="text-gray-700 dark:text-slate-300">
              Certificates are awarded upon achieving verified completion criteria (quizzes passed and 100% lecture milestones). Cryptographic signatures generated on certificates are unique to the learner account and are permanently publicly verifiable.
            </p>
          </section>

          <section className="space-y-2.5 sm:space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>4. Community Code of Conduct</span>
            </h2>
            <p className="text-gray-700 dark:text-slate-300">
              Our discussion boards, code reviews, and live class chats require mutual respect. Harassment, spamming, academic dishonesty, and posting malicious code are strictly prohibited and may result in immediate suspension.
            </p>
          </section>

          <section className="space-y-2.5 sm:space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>5. Refund Policy</span>
            </h2>
            <p className="text-gray-700 dark:text-slate-300">
              We offer a straightforward 7-day money-back guarantee for course purchases if less than 25% of course content has been consumed. Contact support for instant review.
            </p>
          </section>

        </div>
      </div>
    </div>
  </>
);
}
