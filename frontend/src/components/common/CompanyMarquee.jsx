import { Sparkles } from 'lucide-react';

const COMPANIES = [
  {
    name: 'Amazon',
    logo: (
      <svg className="h-7 w-auto fill-current" viewBox="0 0 100 30">
        <path d="M57.6 19.3c-4.4 3.3-10.8 5-16.3 5-7.7 0-14.6-2.9-19.8-7.7-.4-.4-.1-.9.4-.6 5.5 3.1 12.2 5 19.4 5 4.9 0 10.5-1.1 15.6-3.6.8-.4 1.5.4.7.9z" />
        <path d="M59.4 17.5c-.5-.7-3.6-.3-5 .2-.4.1-.5-.3-.1-.5 2.4-1.7 6.3-1.2 6.7-.7.4.5-.1 4.5-2.4 6.4-.4.3-.7.1-.5-.3.8-1.2 1.8-4.4 1.3-5.1z" />
        <path d="M21.5 13.9c0-2.3 1.4-3.5 3.3-3.5 1.5 0 2.5.9 2.9 2.1v-1.8h2.3v7.4h-2.3v-1.1c-.6.9-1.6 1.3-2.9 1.3-2.2 0-3.3-1.6-3.3-4.4zm2.4.1c0 1.6.6 2.5 1.7 2.5 1.1 0 1.8-.9 1.8-2.5 0-1.5-.7-2.4-1.8-2.4-1.1 0-1.7.9-1.7 2.4zm10.7-3.9v1.2c.6-.9 1.6-1.4 2.8-1.4 1.5 0 2.6.8 3 2.2.8-1.4 2-2.2 3.5-2.2 2 0 3.3 1.3 3.3 3.6v4.6h-2.3v-4.2c0-1.3-.6-2-1.7-2-1 0-1.8.8-1.8 2.1v4.1h-2.3v-4.2c0-1.3-.6-2-1.7-2-1.1 0-1.8.8-1.8 2.1v4.1h-2.3v-7.9h1.7zm16.9 4c0-2.4 1.8-4.2 4.4-4.2 2.6 0 4.4 1.8 4.4 4.2 0 2.4-1.8 4.2-4.4 4.2-2.6 0-4.4-1.8-4.4-4.2zm6.4 0c0-1.3-.9-2.3-2-2.3-1.1 0-2 1-2 2.3 0 1.3.9 2.3 2 2.3 1.1 0 2-1 2-2.3z" />
      </svg>
    ),
  },
  {
    name: 'Google',
    logo: (
      <svg className="h-6 w-auto fill-current" viewBox="0 0 80 26">
        <path d="M12.5 10.3v3.7h6c-.2 1.4-1.7 4.1-6 4.1-3.6 0-6.6-3-6.6-6.6s3-6.6 6.6-6.6c2.1 0 3.5.9 4.3 1.6l2.9-2.8C17.9 2 15.4.9 12.5.9 6.7.9 2 5.6 2 11.5s4.7 10.6 10.5 10.6c6.1 0 10.1-4.3 10.1-10.3 0-.7-.1-1.2-.2-1.5H12.5zm16.6 3.6c-3.1 0-5.6 2.4-5.6 5.5 0 3.1 2.5 5.5 5.6 5.5 3.1 0 5.6-2.4 5.6-5.5 0-3.1-2.5-5.5-5.6-5.5zm0 8.7c-1.7 0-3.2-1.4-3.2-3.2 0-1.8 1.4-3.2 3.2-3.2 1.7 0 3.2 1.4 3.2 3.2 0 1.8-1.5 3.2-3.2 3.2zm12.3-8.7c-3.1 0-5.6 2.4-5.6 5.5 0 3.1 2.5 5.5 5.6 5.5 3.1 0 5.6-2.4 5.6-5.5 0-3.1-2.5-5.5-5.6-5.5zm0 8.7c-1.7 0-3.2-1.4-3.2-3.2 0-1.8 1.4-3.2 3.2-3.2 1.7 0 3.2 1.4 3.2 3.2 0 1.8-1.5 3.2-3.2 3.2zm11.7-8.4v1.1h-.1c-.6-.7-1.7-1.4-3.2-1.4-3 0-5.6 2.6-5.6 5.5 0 3 2.5 5.5 5.6 5.5 1.5 0 2.6-.7 3.2-1.4h.1v.9c0 2.1-1.1 3.2-3 3.2-1.5 0-2.5-1.1-2.9-2l-2.1.9c.6 1.5 2.2 3.3 5 3.3 2.9 0 5.3-1.7 5.3-5.8V14.2h-2.3zm-2.9 7.8c-1.7 0-3-1.4-3-3.2 0-1.7 1.3-3.2 3-3.2 1.6 0 2.9 1.4 2.9 3.2 0 1.7-1.3 3.2-2.9 3.2zM57 1.5h2.5v22.7H57V1.5zm8.4 16.4c1.4 0 2.4-.7 3-1.5l1.9 1.3c-.9 1.3-2.6 2.6-4.9 2.6-3.4 0-5.8-2.6-5.8-5.5 0-3.3 2.4-5.5 5.5-5.5 3.3 0 4.9 2.3 4.9 5.5v.6H63c0 1.8 1.1 2.5 2.4 2.5zm-.4-4.5c-1 0-1.9.6-2.2 1.5h4.3c-.1-1.1-.9-1.5-2.1-1.5z" />
      </svg>
    ),
  },
  {
    name: 'Microsoft',
    logo: (
      <div className="flex items-center gap-2">
        <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
          <div className="bg-[#f25022] rounded-[1px]" />
          <div className="bg-[#7fba00] rounded-[1px]" />
          <div className="bg-[#00a4ef] rounded-[1px]" />
          <div className="bg-[#ffb900] rounded-[1px]" />
        </div>
        <span className="font-bold tracking-tight text-base font-sans">Microsoft</span>
      </div>
    ),
  },
  {
    name: 'Walmart',
    logo: (
      <div className="flex items-center gap-2">
        <span className="font-extrabold tracking-tight text-lg font-sans">Walmart</span>
        <svg className="w-5 h-5 text-amber-400 fill-current animate-spin-slow" viewBox="0 0 24 24">
          <path d="M12 2a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-3 0v-3A1.5 1.5 0 0 1 12 2zm0 14a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-3 0v-3A1.5 1.5 0 0 1 12 16zm8.485-8.485a1.5 1.5 0 0 1 0 2.121l-2.121 2.121a1.5 1.5 0 1 1-2.121-2.121l2.121-2.121a1.5 1.5 0 0 1 2.121 0zm-11.314 11.314a1.5 1.5 0 0 1 0 2.121l-2.121 2.121a1.5 1.5 0 0 1-2.121-2.121l2.121-2.121a1.5 1.5 0 0 1 2.121 0zm11.314 0a1.5 1.5 0 0 1-2.121 0l-2.121-2.121a1.5 1.5 0 1 1 2.121-2.121l2.121 2.121a1.5 1.5 0 0 1 0 2.121zM7.05 7.05a1.5 1.5 0 0 1-2.121 0L2.808 4.929a1.5 1.5 0 1 1 2.121-2.121L7.05 4.929a1.5 1.5 0 0 1 0 2.121z" />
        </svg>
      </div>
    ),
  },
  {
    name: 'Nagarro',
    logo: (
      <div className="flex items-center gap-2">
        <svg className="w-6 h-6 text-purple-400 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
          <circle cx="9" cy="12" r="6" />
          <circle cx="15" cy="12" r="6" />
        </svg>
        <span className="font-extrabold tracking-tight text-base font-sans">
          nagarro<span className="text-[10px] text-purple-400 ml-0.5 uppercase">ES</span>
        </span>
      </div>
    ),
  },
  {
    name: 'TCS',
    logo: (
      <div className="flex items-center gap-1.5">
        <span className="font-black text-lg tracking-tighter">tcs</span>
        <div className="h-4 w-px bg-current opacity-40 mx-0.5" />
        <span className="text-[9px] uppercase leading-tight font-semibold tracking-wider opacity-80">
          TATA<br />CONSULTANCY
        </span>
      </div>
    ),
  },
  {
    name: 'Meta',
    logo: (
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-500 fill-current" viewBox="0 0 24 24">
          <path d="M16.9 3.5C14.7 3.5 12.8 4.8 12 6.6 11.2 4.8 9.3 3.5 7.1 3.5 3.7 3.5 1 6.3 1 9.8c0 4.9 6.2 9.7 10.4 11.2.4.1.8.1 1.2 0C16.8 19.5 23 14.7 23 9.8c0-3.5-2.7-6.3-6.1-6.3zm-9.8 9.8c-2 0-3.6-1.6-3.6-3.6 0-2 1.6-3.6 3.6-3.6 1.8 0 3.3 1.3 3.6 3-.3 1.8-1.8 4.2-3.6 4.2zm9.8 0c-1.8 0-3.3-2.4-3.6-4.2.3-1.7 1.8-3 3.6-3 2 0 3.6 1.6 3.6 3.6 0 2-1.6 3.6-3.6 3.6z" />
        </svg>
        <span className="font-bold text-base font-sans">Meta</span>
      </div>
    ),
  },
  {
    name: 'Uber',
    logo: <span className="font-black tracking-widest text-lg font-sans">Uber</span>,
  },
  {
    name: 'Netflix',
    logo: (
      <span className="font-black tracking-tighter text-xl text-red-600 font-sans uppercase">
        Netflix
      </span>
    ),
  },
  {
    name: 'Adobe',
    logo: (
      <div className="flex items-center gap-1.5">
        <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
          <path d="M14.5 3h6.5v18h-3.5l-3-6.5zm-5 0h-6.5v18h3.5l3-6.5zm2.5 7.5l3.2 7.5h-2.1l-1.1-2.6h-2.8l1.4-3.4z" />
        </svg>
        <span className="font-extrabold text-base tracking-tight font-sans">Adobe</span>
      </div>
    ),
  },
  {
    name: 'Swiggy',
    logo: (
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white text-[9px] font-black">
          S
        </div>
        <span className="font-bold text-base tracking-tight text-orange-500 font-sans">SWIGGY</span>
      </div>
    ),
  },
  {
    name: 'Zomato',
    logo: (
      <span className="font-black italic text-lg tracking-tight text-rose-500 font-sans">
        zomato
      </span>
    ),
  },
];

/**
 * Sheryians-Style Infinite Smooth Sliding Logo Marquee Ribbon
 */
export function CompanyMarquee() {
  return (
    <section className="relative py-10 bg-[#090b14] border-y border-slate-800/80 overflow-hidden select-none">
      {/* Background Ambience Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-purple-900/10 pointer-events-none" />

      {/* Header Tag */}
      <div className="max-w-7xl mx-auto px-4 text-center mb-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/60 text-slate-400 text-[11px] sm:text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Our Students & Alumni Work At Leading Companies</span>
        </div>
      </div>

      {/* Infinite Seamless Marquee Track with Mask Gradients */}
      <div
        className="relative w-full overflow-hidden flex items-center"
        style={{
          maskImage:
            'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
        }}
      >
        <div className="flex w-max animate-marquee-smooth hover:[animation-play-state:paused] items-center gap-10 sm:gap-16 py-2">
          {/* First Sequence */}
          {COMPANIES.map((company, idx) => (
            <div
              key={`c1-${idx}`}
              className="flex items-center justify-center opacity-45 hover:opacity-100 text-slate-300 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer shrink-0 grayscale hover:grayscale-0"
              title={company.name}
            >
              {company.logo}
            </div>
          ))}

          {/* Second Duplicate Sequence (for seamless infinite loop) */}
          {COMPANIES.map((company, idx) => (
            <div
              key={`c2-${idx}`}
              className="flex items-center justify-center opacity-45 hover:opacity-100 text-slate-300 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer shrink-0 grayscale hover:grayscale-0"
              title={company.name}
            >
              {company.logo}
            </div>
          ))}

          {/* Third Duplicate Sequence (for wide screens) */}
          {COMPANIES.map((company, idx) => (
            <div
              key={`c3-${idx}`}
              className="flex items-center justify-center opacity-45 hover:opacity-100 text-slate-300 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer shrink-0 grayscale hover:grayscale-0"
              title={company.name}
            >
              {company.logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CompanyMarquee;
