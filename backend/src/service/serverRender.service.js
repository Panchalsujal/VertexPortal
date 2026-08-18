/**
 * Server-Side Template & Fragment Renderer with Dynamic Hole Support
 * 
 * Pre-renders static/infrequently changing HTML for fast first-paint & SEO
 * while reserving dynamic holes for personalized regions (enrollment, wishlist, auth nav).
 */

const DICTIONARY = {
  en: {
    enrollNow: "Enroll Now",
    continueLearning: "Continue Learning",
    goToCourse: "Go to Course",
    alreadyEnrolled: "You are enrolled in this course",
    addToCart: "Add to Cart",
    inCart: "In Cart",
    addToWishlist: "Add to Wishlist",
    inWishlist: "Saved in Wishlist",
    courseOverview: "Course Overview",
    whatYoullLearn: "What You'll Learn",
    requirements: "Requirements",
    curriculum: "Course Curriculum",
    modules: "Modules",
    lectures: "Lectures",
    instructor: "Instructor",
    studentReviews: "Student Reviews",
    rating: "Rating",
    verifiedCertificate: "Official & Verified Credential",
    certificateRevoked: "Certificate Revoked",
    certificateOfCompletion: "Certificate of Completion",
    proudlyPresentedTo: "Proudly Presented To",
    certificateDescription: "for successfully completing the comprehensive professional program on",
    dateOfCertification: "Date of Certification",
    downloadPdf: "Download PDF Certificate",
    verifyAuthenticity: "Verify Authenticity",
    officialRecord: "Official Immutable Record",
    signIn: "Sign In",
    getStarted: "Get Started",
    free: "Free",
  },
  es: {
    enrollNow: "Inscribirse Ahora",
    continueLearning: "Continuar Aprendiendo",
    goToCourse: "Ir al Curso",
    alreadyEnrolled: "Estás inscrito en este curso",
    addToCart: "Añadir al Carrito",
    inCart: "En el Carrito",
    addToWishlist: "Añadir a Deseos",
    inWishlist: "Guardado en Deseos",
    courseOverview: "Descripción del Curso",
    whatYoullLearn: "Lo que aprenderás",
    requirements: "Requisitos",
    curriculum: "Plan de Estudios",
    modules: "Módulos",
    lectures: "Clases",
    instructor: "Instructor",
    studentReviews: "Opiniones de Estudiantes",
    rating: "Calificación",
    verifiedCertificate: "Credencial Oficial y Verificada",
    certificateRevoked: "Certificado Revocado",
    certificateOfCompletion: "Certificado de Finalización",
    proudlyPresentedTo: "Otorgado con Orgullo a",
    certificateDescription: "por haber completado con éxito el programa profesional exhaustivo de",
    dateOfCertification: "Fecha de Certificación",
    downloadPdf: "Descargar Certificado PDF",
    verifyAuthenticity: "Verificar Autenticidad",
    officialRecord: "Registro Oficial Inmutable",
    signIn: "Iniciar Sesión",
    getStarted: "Empezar",
    free: "Gratis",
  },
  fr: {
    enrollNow: "S'inscrire Maintenant",
    continueLearning: "Continuer l'Apprentissage",
    goToCourse: "Accéder au Cours",
    alreadyEnrolled: "Vous êtes inscrit à ce cours",
    addToCart: "Ajouter au Panier",
    inCart: "Dans le Panier",
    addToWishlist: "Ajouter aux Favoris",
    inWishlist: "Dans vos Favoris",
    courseOverview: "Aperçu du Cours",
    whatYoullLearn: "Ce que vous allez apprendre",
    requirements: "Prérequis",
    curriculum: "Programme du Cours",
    modules: "Modules",
    lectures: "Leçons",
    instructor: "Instructeur",
    studentReviews: "Avis des Étudiants",
    rating: "Évaluation",
    verifiedCertificate: "Certificat Officiel & Vérifié",
    certificateRevoked: "Certificat Révoqué",
    certificateOfCompletion: "Certificat de Réussite",
    proudlyPresentedTo: "Fièrement Décerné à",
    certificateDescription: "pour avoir complété avec succès le programme professionnel approfondi en",
    dateOfCertification: "Date de Certification",
    downloadPdf: "Télécharger le Certificat PDF",
    verifyAuthenticity: "Vérifier l'Authenticité",
    officialRecord: "Registre Officiel Immuable",
    signIn: "Se Connecter",
    getStarted: "Commencer",
    free: "Gratuit",
  },
  hi: {
    enrollNow: "अभी इनरोल करें",
    continueLearning: "सीखना जारी रखें",
    goToCourse: "कोर्स पर जाएं",
    alreadyEnrolled: "आप इस कोर्स में नामांकित हैं",
    addToCart: "कार्ट में जोड़ें",
    inCart: "कार्ट में है",
    addToWishlist: "इच्छा सूची में जोड़ें",
    inWishlist: "इच्छा सूची में सहेजा गया",
    courseOverview: "कोर्स का विवरण",
    whatYoullLearn: "आप क्या सीखेंगे",
    requirements: "आवश्यकताएं",
    curriculum: "कोर्स पाठ्यक्रम",
    modules: "मॉड्यूल",
    lectures: "व्याख्यान",
    instructor: "प्रशिक्षक",
    studentReviews: "छात्र समीक्षाएं",
    rating: "रेटिंग",
    verifiedCertificate: "आधिकारिक और सत्यापित प्रमाणपत्र",
    certificateRevoked: "प्रमाणपत्र रद्द कर दिया गया",
    certificateOfCompletion: "पूर्णता प्रमाणपत्र",
    proudlyPresentedTo: "गर्व से प्रस्तुत किया गया",
    certificateDescription: "सफलतापूर्वक पूरा करने के लिए",
    dateOfCertification: "प्रमाणन की तिथि",
    downloadPdf: "पीडीएफ प्रमाणपत्र डाउनलोड करें",
    verifyAuthenticity: "प्रामाणिकता सत्यापित करें",
    officialRecord: "आधिकारिक अपरिवर्तनीय रिकॉर्ड",
    signIn: "साइन इन करें",
    getStarted: "शुरू करें",
    free: "मुफ़्त",
  },
  de: {
    enrollNow: "Jetzt Einschreiben",
    continueLearning: "Weiterlernen",
    goToCourse: "Zum Kurs",
    alreadyEnrolled: "Sie sind für diesen Kurs eingeschrieben",
    addToCart: "In den Warenkorb",
    inCart: "Im Warenkorb",
    addToWishlist: "Auf die Wunschliste",
    inWishlist: "Auf der Wunschliste",
    courseOverview: "Kursübersicht",
    whatYoullLearn: "Was Sie lernen werden",
    requirements: "Voraussetzungen",
    curriculum: "Lehrplan",
    modules: "Module",
    lectures: "Lektionen",
    instructor: "Kursleiter",
    studentReviews: "Studentenbewertungen",
    rating: "Bewertung",
    verifiedCertificate: "Offizielles & Verifiziertes Zertifikat",
    certificateRevoked: "Zertifikat Widerrufen",
    certificateOfCompletion: "Abschlusszertifikat",
    proudlyPresentedTo: "Stolz Verliehen an",
    certificateDescription: "für den erfolgreichen Abschluss des professionellen Programms",
    dateOfCertification: "Zertifizierungsdatum",
    downloadPdf: "PDF-Zertifikat Herunterladen",
    verifyAuthenticity: "Authentizität Überprüfen",
    officialRecord: "Offizieller Unveränderlicher Datensatz",
    signIn: "Anmelden",
    getStarted: "Loslegen",
    free: "Kostenlos",
  },
};

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getI18n(locale = "en") {
  const norm = locale.slice(0, 2).toLowerCase();
  return DICTIONARY[norm] || DICTIONARY.en;
}

export class ServerRenderService {
  /**
   * Render Course Detail Page / Fragment (Static HTML Shell with Dynamic Holes)
   */
  renderCourseDetail({
    course,
    modules = [],
    isFragment = false,
    locale = "en",
  }) {
    const t = getI18n(locale);
    const title = escapeHtml(course.title);
    const subtitle = escapeHtml(course.subtitle || "");
    const description = escapeHtml(course.description || "");
    const categoryName = escapeHtml(course.category?.name || "General");
    const instructorName = escapeHtml(course.instructor?.fullName || "NavGujarat Academy Instructor");
    const level = escapeHtml(course.level || "All Levels");
    const language = escapeHtml(course.language || "English");
    const priceDisplay = course.price === 0 ? t.free : `$${course.price}`;
    const discountPriceDisplay = course.discountPrice ? `$${course.discountPrice}` : null;
    const rating = course.averageRating ? course.averageRating.toFixed(1) : "5.0";
    const reviewsCount = course.totalReviews || 0;
    const enrolledCount = course.enrolledStudentsCount || 0;
    const totalModules = modules.length || course.totalModules || 0;
    const totalLectures = course.totalLectures || 0;
    const courseId = course._id ? course._id.toString() : "";
    const courseSlug = course.slug || "";

    const learningOutcomesHtml = (course.learningOutcomes || [])
      .map((item) => `<li class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"><span class="text-emerald-500 font-bold">✓</span> <span>${escapeHtml(item)}</span></li>`)
      .join("");

    const requirementsHtml = (course.requirements || [])
      .map((item) => `<li class="text-sm text-gray-600 dark:text-gray-400">• ${escapeHtml(item)}</li>`)
      .join("");

    const modulesHtml = modules
      .map((m, idx) => `
        <div class="border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-3 bg-white dark:bg-gray-900/50">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
              ${idx + 1}. ${escapeHtml(m.title)}
            </h4>
            <span class="text-xs text-gray-500">${m.lectures?.length || m.totalLectures || 0} ${t.lectures}</span>
          </div>
          ${m.description ? `<p class="text-xs text-gray-500 mt-1">${escapeHtml(m.description)}</p>` : ""}
        </div>
      `)
      .join("");

    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.title,
      description: course.description,
      provider: {
        "@type": "Organization",
        name: "NavGujarat Academy",
        sameAs: "https://navgujaratacademy.online",
      },
      offers: {
        "@type": "Offer",
        price: course.discountPrice !== null && course.discountPrice !== undefined ? course.discountPrice : course.price,
        priceCurrency: "USD",
        category: "Paid",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating,
        reviewCount: Math.max(reviewsCount, 1),
      },
    });

    const bodyHtml = `
      <article class="nga-course-view max-w-6xl mx-auto px-4 py-8 font-[Inter,sans-serif]" data-course-id="${courseId}" data-course-slug="${courseSlug}">
        <!-- Course Header -->
        <header class="bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden mb-8">
          <div class="relative z-10 max-w-3xl space-y-4">
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded-full font-medium">${categoryName}</span>
              <span class="px-3 py-1 bg-gray-800 text-gray-300 rounded-full capitalize">${level}</span>
              <span class="px-3 py-1 bg-gray-800 text-gray-300 rounded-full">${language}</span>
            </div>
            <h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight">${title}</h1>
            ${subtitle ? `<p class="text-sm sm:text-base text-gray-300 leading-relaxed">${subtitle}</p>` : ""}
            
            <div class="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-300 pt-2">
              <div class="flex items-center gap-1.5 text-amber-400 font-bold">
                <span>★ ${rating}</span>
                <span class="text-gray-400 font-normal">(${reviewsCount} ${t.studentReviews})</span>
              </div>
              <div>•</div>
              <div>${enrolledCount.toLocaleString()} Students</div>
              <div>•</div>
              <div>${t.instructor}: <strong class="text-white">${instructorName}</strong></div>
            </div>
          </div>
        </header>

        <!-- Main Content Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column (Static Syllabus & Info) -->
          <div class="lg:col-span-2 space-y-8">
            ${learningOutcomesHtml ? `
              <section class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-xs">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">${t.whatYoullLearn}</h2>
                <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">${learningOutcomesHtml}</ul>
              </section>
            ` : ""}

            <section class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-xs">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">${t.courseOverview}</h2>
              <div class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">${description}</div>
            </section>

            <section class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-xs">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">${t.curriculum}</h2>
                <span class="text-xs text-gray-500">${totalModules} ${t.modules} • ${totalLectures} ${t.lectures}</span>
              </div>
              <div class="space-y-2">${modulesHtml}</div>
            </section>

            ${requirementsHtml ? `
              <section class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-xs">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">${t.requirements}</h2>
                <ul class="space-y-2">${requirementsHtml}</ul>
              </section>
            ` : ""}
          </div>

          <!-- Right Column (Sticky Pricing Card with DYNAMIC HOLE) -->
          <div class="lg:col-span-1">
            <div class="sticky top-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
              ${course.thumbnailUrl ? `
                <img src="${escapeHtml(course.thumbnailUrl)}" alt="${title}" class="w-full h-48 object-cover rounded-2xl mb-4" />
              ` : ""}

              <div class="flex items-baseline gap-3">
                <span class="text-3xl font-extrabold text-gray-900 dark:text-white">
                  ${discountPriceDisplay || priceDisplay}
                </span>
                ${discountPriceDisplay ? `<span class="text-sm text-gray-400 line-through">${priceDisplay}</span>` : ""}
              </div>

              <!-- DYNAMIC HOLE: USER ENROLLMENT & ACTION REGION -->
              <!-- HOLE:USER_ENROLLMENT -->
              <div id="ssr-hole-enrollment" data-ssr-hydrate="course-enrollment" data-course-id="${courseId}" class="space-y-3">
                <button class="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-sm shadow-md transition transform active:scale-98 cursor-pointer">
                  ${t.enrollNow}
                </button>
                <div class="flex gap-2">
                  <!-- HOLE:USER_WISHLIST_CART -->
                  <button class="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    ${t.addToCart}
                  </button>
                  <button class="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    ${t.addToWishlist}
                  </button>
                </div>
              </div>
              <!-- END HOLE:USER_ENROLLMENT -->

              <div class="text-xs text-gray-500 dark:text-gray-400 space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p>✓ Lifetime access with certificate</p>
                <p>✓ Full HD on-demand video lectures</p>
                <p>✓ Access on mobile and desktop</p>
              </div>
            </div>
          </div>
        </div>
      </article>
    `;

    if (isFragment) {
      return bodyHtml;
    }

    return `<!DOCTYPE html>
<html lang="${escapeHtml(locale)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | NavGujarat Academy</title>
  <meta name="description" content="${subtitle || description.slice(0, 160)}">
  <meta property="og:title" content="${title} | NavGujarat Academy">
  <meta property="og:description" content="${subtitle || description.slice(0, 160)}">
  ${course.thumbnailUrl ? `<meta property="og:image" content="${escapeHtml(course.thumbnailUrl)}">` : ""}
  <script type="application/ld+json">${jsonLd}</script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 dark:bg-[#0b0f17] text-gray-900 dark:text-gray-100 min-h-screen">
  <!-- HOLE:USER_NAV -->
  <nav id="ssr-hole-nav" data-ssr-hydrate="user-nav" class="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between bg-white dark:bg-gray-900">
    <a href="/" class="text-lg font-black tracking-wider text-sky-600 dark:text-sky-400">NAVGUJARATACADEMY</a>
    <div class="flex items-center gap-3">
      <a href="/login" class="text-xs font-semibold px-4 py-2 rounded-lg bg-sky-600 text-white">${t.signIn}</a>
    </div>
  </nav>
  <!-- END HOLE:USER_NAV -->
  <main>${bodyHtml}</main>
</body>
</html>`;
  }

  /**
   * Render Certificate Verification View (Static Geometric Certificate Card with Dynamic Holes)
   */
  renderCertificateVerification({
    certificate,
    isValid = true,
    isFragment = false,
    locale = "en",
  }) {
    const t = getI18n(locale);
    const certNumber = escapeHtml(certificate.certificateNumber || certificate.verificationCode || "UNKNOWN");
    const studentName = escapeHtml(certificate.studentName || certificate.student?.fullName || "Distinguished Student");
    const courseTitle = escapeHtml(certificate.courseTitle || certificate.course?.title || "Professional Program");
    const instructorName = escapeHtml(certificate.instructorName || "Course Instructor");
    const issuedDate = new Date(certificate.issuedAt || certificate.createdAt || Date.now()).toLocaleDateString(locale === "en" ? "en-US" : locale, {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });

    const cardHtml = `
      <div class="relative bg-white dark:bg-gray-900 border-2 border-sky-300 dark:border-sky-800 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden font-[Inter,sans-serif] max-w-3xl mx-auto my-8" data-cert-number="${certNumber}">
        <!-- Top-Right Polygons -->
        <div class="absolute top-0 right-0 w-36 h-36 pointer-events-none opacity-30 dark:opacity-40">
          <svg viewBox="0 0 100 100" class="w-full h-full">
            <polygon points="100,0 0,0 60,60" fill="#0284c7" />
            <polygon points="100,0 100,100 40,40" fill="#38bdf8" />
            <polygon points="60,60 100,100 40,80" fill="#7dd3fc" />
          </svg>
        </div>

        <!-- Bottom-Left Polygons -->
        <div class="absolute bottom-0 left-0 w-36 h-36 pointer-events-none opacity-30 dark:opacity-40">
          <svg viewBox="0 0 100 100" class="w-full h-full">
            <polygon points="0,100 100,100 40,40" fill="#0284c7" />
            <polygon points="0,100 0,0 60,60" fill="#38bdf8" />
            <polygon points="40,40 0,0 60,20" fill="#7dd3fc" />
          </svg>
        </div>

        <div class="relative z-10 text-center space-y-6">
          <!-- Status Pill -->
          <div>
            ${isValid ? `
              <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                <span>🛡️</span> <span>${t.verifiedCertificate}</span>
              </span>
            ` : `
              <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
                <span>❌</span> <span>${t.certificateRevoked}</span>
              </span>
            `}
          </div>

          <!-- Brand Header -->
          <div>
            <p class="text-xs font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">NAVGUJARATACADEMY</p>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              ${t.certificateOfCompletion}
            </h1>
          </div>

          <!-- Student Name -->
          <div class="py-2">
            <p class="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">${t.proudlyPresentedTo}</p>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              ${studentName}
            </h2>
            <div class="w-24 h-0.5 bg-sky-500 mx-auto mt-2 rounded-full"></div>
          </div>

          <!-- Description -->
          <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-lg mx-auto leading-relaxed">
            ${t.certificateDescription} <strong class="text-gray-900 dark:text-white font-bold">${courseTitle}</strong>.
          </p>

          <!-- Signatures & Date Grid -->
          <div class="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4 max-w-md mx-auto text-xs">
            <div>
              <p class="font-bold text-gray-900 dark:text-white">${instructorName}</p>
              <p class="text-[11px] text-gray-400">Instructor & Director</p>
            </div>
            <div>
              <p class="font-bold text-gray-900 dark:text-white">${issuedDate}</p>
              <p class="text-[11px] text-gray-400">${t.dateOfCertification}</p>
            </div>
          </div>

          <!-- Meta ID & Actions -->
          <div class="text-[11px] text-gray-400 font-mono pt-2">
            Certificate ID: <strong class="text-gray-700 dark:text-gray-300">${certNumber}</strong>
          </div>

          <!-- DYNAMIC HOLE: VIEWER ACTION (Download PDF / Share) -->
          <!-- HOLE:VIEWER_ACTION -->
          <div id="ssr-hole-viewer-action" data-ssr-hydrate="cert-action" data-cert-number="${certNumber}" class="pt-4 flex justify-center gap-3">
            <a href="/api/certificates/download/${certificate._id || certNumber}" target="_blank" class="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition">
              ${t.downloadPdf}
            </a>
          </div>
          <!-- END HOLE:VIEWER_ACTION -->
        </div>
      </div>
    `;

    if (isFragment) {
      return cardHtml;
    }

    return `<!DOCTYPE html>
<html lang="${escapeHtml(locale)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate: ${studentName} - ${courseTitle} | NavGujarat Academy</title>
  <meta name="description" content="Verified Certificate for ${studentName} issued by NavGujarat Academy for completion of ${courseTitle}">
  <meta property="og:title" content="Verified Certificate: ${studentName}">
  <meta property="og:description" content="Verified Certificate of Completion for ${courseTitle}">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 dark:bg-[#0b0f17] min-h-screen py-10 px-4">
  <main>${cardHtml}</main>
</body>
</html>`;
  }

  /**
   * Render Catalog Fragment
   */
  renderCatalogFragment({
    courses = [],
    categories = [],
    locale = "en",
  }) {
    const t = getI18n(locale);

    const categoriesHtml = categories
      .map(
        (cat) => `
        <button class="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-sky-500 transition">
          ${escapeHtml(cat.name)}
        </button>
      `
      )
      .join("");

    const coursesHtml = courses
      .map((c) => {
        const title = escapeHtml(c.title);
        const slug = escapeHtml(c.slug);
        const rating = c.averageRating ? c.averageRating.toFixed(1) : "5.0";
        const price = c.price === 0 ? t.free : `$${c.price}`;
        const instructor = escapeHtml(c.instructor?.fullName || "Instructor");

        return `
          <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between">
            <div>
              ${c.thumbnailUrl ? `<img src="${escapeHtml(c.thumbnailUrl)}" alt="${title}" class="w-full h-36 object-cover rounded-xl mb-3" />` : ""}
              <h3 class="font-bold text-sm text-gray-900 dark:text-white line-clamp-2">${title}</h3>
              <p class="text-xs text-gray-400 mt-1">${instructor}</p>
            </div>
            <div class="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
              <span class="font-extrabold text-sm text-sky-600 dark:text-sky-400">${price}</span>
              <span class="text-xs text-amber-500 font-bold">★ ${rating}</span>
            </div>
          </div>
        `;
      })
      .join("");

    return `
      <section class="nga-catalog-fragment space-y-6">
        <div class="flex flex-wrap gap-2">${categoriesHtml}</div>
        <!-- HOLE:USER_SAVED_PREFERENCES -->
        <div id="ssr-hole-preferences" data-ssr-hydrate="user-catalog-prefs"></div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">${coursesHtml}</div>
      </section>
    `;
  }

  /**
   * Fills dynamic holes in pre-rendered/cached HTML
   * Keeps personalized regions dynamic while serving 95%+ cached markup!
   */
  fillDynamicHoles(html, userContext = null, locale = "en") {
    if (!html) return html;
    const t = getI18n(locale);

    let output = html;

    // 1. Enrollment & Wishlist Holes
    if (userContext && userContext.isEnrolled) {
      const enrolledHoleReplacement = `
        <div class="space-y-3">
          <div class="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
            <span>✓</span> <span>${t.alreadyEnrolled} (${userContext.progressPercent || 0}% completed)</span>
          </div>
          <a href="/learn/${userContext.courseSlug || ''}" class="block text-center w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md transition">
            ${t.continueLearning}
          </a>
        </div>
      `;
      output = output.replace(
        /<!-- HOLE:USER_ENROLLMENT -->[\s\S]*?<!-- END HOLE:USER_ENROLLMENT -->/g,
        enrolledHoleReplacement
      );
    }

    // 2. Navigation / Auth Hole
    if (userContext && userContext.user) {
      const userNavReplacement = `
        <nav id="ssr-hole-nav" class="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between bg-white dark:bg-gray-900">
          <a href="/" class="text-lg font-black tracking-wider text-sky-600 dark:text-sky-400">NAVGUJARATACADEMY</a>
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-500 font-medium">Hello, <strong class="text-gray-900 dark:text-white">${escapeHtml(userContext.user.fullName || userContext.user.name)}</strong></span>
            <a href="/my-learning" class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">My Learning</a>
          </div>
        </nav>
      `;
      output = output.replace(
        /<!-- HOLE:USER_NAV -->[\s\S]*?<!-- END HOLE:USER_NAV -->/g,
        userNavReplacement
      );
    }

    return output;
  }
}

export const serverRenderService = new ServerRenderService();
export default serverRenderService;
