import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Code2,
  Terminal,
  Maximize2,
  Minimize2,
  Trash2,
  ArrowLeft,
  FileCode,
  Laptop,
  Smartphone,
  Tablet,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

const JS_SNIPPETS = [
  {
    title: 'Array Transformations (Map / Filter / Reduce)',
    code: `// 🚀 Array Transformations in Modern JavaScript
const courses = [
  { title: 'Full Stack React & Node', price: 99, students: 1420, rating: 4.9 },
  { title: 'Python for Data Science', price: 79, students: 980, rating: 4.8 },
  { title: 'UI/UX Design Masterclass', price: 49, students: 650, rating: 4.7 },
  { title: 'DevOps & Docker Bootcamp', price: 89, students: 1100, rating: 4.9 },
];

console.log('--- 📚 Top Rated Courses (Rating >= 4.8) ---');
const topRated = courses.filter(c => c.rating >= 4.8);
console.log(topRated);

console.log('\\n--- 👥 Total Enrolled Students ---');
const totalStudents = courses.reduce((acc, c) => acc + c.students, 0);
console.log(\`Total Learners: \${totalStudents.toLocaleString()}\`);

console.log('\\n--- 🏷️ 20% Special Discount Offer ---');
const promoPrices = courses.map(c => ({
  course: c.title,
  original: \`$\${c.price}\`,
  discounted: \`$\${(c.price * 0.8).toFixed(2)}\`,
}));
console.table(promoPrices);
`,
  },
  {
    title: 'Async / Await Simulated API Call',
    code: `// ⚡ Simulating Asynchronous Student Learning API
function fetchStudentProgress(studentId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: studentId,
        name: 'Alex Johnson',
        role: 'Pro Learner',
        currentStreak: '7 Days 🔥',
        completedLessons: 24,
        totalScore: 95,
      });
    }, 450);
  });
}

async function loadStudentData() {
  console.log('📡 Fetching student profile from database...');
  const start = performance.now();
  const data = await fetchStudentProgress(101);
  const duration = (performance.now() - start).toFixed(1);
  
  console.log(\`✅ Data received in \${duration}ms:\`);
  console.log(data);
}

loadStudentData();
`,
  },
  {
    title: 'Binary Search Algorithm (O(log n))',
    code: `// 🔍 Classic Binary Search Algorithm
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  let steps = 0;

  while (left <= right) {
    steps++;
    const mid = Math.floor((left + right) / 2);
    console.log(\`Step \${steps}: Inspecting index \${mid} (val=\${arr[mid]})\`);
    
    if (arr[mid] === target) {
      console.log(\`🎯 Found target \${target} in \${steps} comparisons!\`);
      return mid;
    }
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

const numbers = [4, 9, 15, 23, 38, 45, 56, 72, 89, 94];
const target = 72;

console.log(\`Sorted Array: [\${numbers.join(', ')}]\`);
console.log(\`Looking for value: \${target}\\n\`);

const index = binarySearch(numbers, target);
console.log(\`Index Position: \${index}\`);
`,
  },
];

const HTML_SNIPPETS = [
  {
    title: 'Modern Glassmorphism Card',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at top right, #312e81, #0f172a 60%);
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      color: #f8fafc;
      padding: 24px;
    }
    .card {
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 28px;
      padding: 36px 30px;
      width: 100%;
      max-width: 360px;
      text-align: center;
      box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.6);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .card:hover {
      transform: translateY(-6px);
      border-color: rgba(168, 85, 247, 0.4);
      box-shadow: 0 35px 70px -15px rgba(108, 92, 231, 0.4);
    }
    .icon-badge {
      width: 60px;
      height: 60px;
      margin: 0 auto 18px;
      border-radius: 20px;
      background: linear-gradient(135deg, #6C5CE7, #a29bfe);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      box-shadow: 0 12px 24px -6px rgba(108, 92, 231, 0.5);
    }
    .tag {
      display: inline-block;
      padding: 5px 14px;
      border-radius: 99px;
      background: rgba(108, 92, 231, 0.25);
      border: 1px solid rgba(168, 85, 247, 0.4);
      color: #ddd6fe;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 14px;
    }
    h2 { font-size: 22px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; }
    p { color: #94a3b8; font-size: 13px; line-height: 1.6; margin-bottom: 26px; }
    .btn {
      width: 100%;
      padding: 13px 20px;
      border-radius: 16px;
      border: none;
      background: linear-gradient(135deg, #6C5CE7, #8b5cf6);
      color: white;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 8px 24px -4px rgba(108, 92, 231, 0.5);
      transition: all 0.2s ease;
    }
    .btn:hover {
      filter: brightness(1.1);
      transform: scale(1.02);
    }
    .btn:active { transform: scale(0.98); }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-badge">⚡</div>
    <div class="tag">VertexPortal Sandbox</div>
    <h2>Interactive Component</h2>
    <p>Write modern HTML & CSS in the editor and watch it render live with instant updates!</p>
    <button class="btn" onclick="alert('🎉 Live interaction is working smoothly!')">Test Click 🚀</button>
  </div>
</body>
</html>`,
  },
  {
    title: 'Interactive Counter Widget',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      font-family: system-ui, -apple-system, sans-serif;
      color: white;
      padding: 20px;
    }
    .box {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 24px;
      padding: 32px;
      text-align: center;
      width: 100%;
      max-width: 300px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .label {
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 1px;
    }
    .number {
      font-size: 64px;
      font-weight: 900;
      color: #a855f7;
      margin: 16px 0 24px;
      font-variant-numeric: tabular-nums;
    }
    .btn-group {
      display: flex;
      gap: 10px;
      justify-content: center;
    }
    button {
      flex: 1;
      padding: 12px;
      border-radius: 14px;
      border: none;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      color: white;
      transition: transform 0.1s ease;
    }
    button:active { transform: scale(0.95); }
    .dec { background: #ef4444; }
    .rst { background: #475569; font-size: 14px; }
    .inc { background: #10b981; }
  </style>
</head>
<body>
  <div class="box">
    <div class="label">Live Click Counter</div>
    <div class="number" id="num">0</div>
    <div class="btn-group">
      <button class="dec" onclick="step(-1)">-</button>
      <button class="rst" onclick="set(0)">Reset</button>
      <button class="inc" onclick="step(1)">+</button>
    </div>
  </div>

  <script>
    let val = 0;
    function step(n) {
      val += n;
      document.getElementById('num').innerText = val;
    }
    function set(n) {
      val = n;
      document.getElementById('num').innerText = val;
    }
  </script>
</body>
</html>`,
  },
];

export default function CodePlayground() {
  const [lang, setLang] = useState('javascript'); // 'javascript' | 'html'
  const [jsCode, setJsCode] = useState(JS_SNIPPETS[0].code);
  const [htmlCode, setHtmlCode] = useState(HTML_SNIPPETS[0].code);
  const [logs, setLogs] = useState([]);
  const [execTime, setExecTime] = useState(null);
  const [copied, setCopied] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [deviceMode, setDeviceMode] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'

  const activeCode = lang === 'javascript' ? jsCode : htmlCode;

  // Run JavaScript in safe sandbox
  const runJsCode = () => {
    setLogs([]);
    const capturedLogs = [];
    const startTime = performance.now();

    const fakeConsole = {
      log: (...args) => {
        capturedLogs.push({
          type: 'log',
          content: args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '),
        });
      },
      warn: (...args) => {
        capturedLogs.push({
          type: 'warn',
          content: args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '),
        });
      },
      error: (...args) => {
        capturedLogs.push({
          type: 'error',
          content: args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '),
        });
      },
      table: (data) => {
        capturedLogs.push({
          type: 'table',
          content: JSON.stringify(data, null, 2),
        });
      },
    };

    try {
      const runFn = new Function('console', jsCode);
      const result = runFn(fakeConsole);

      if (result !== undefined) {
        capturedLogs.push({
          type: 'return',
          content: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result),
        });
      }
    } catch (err) {
      capturedLogs.push({
        type: 'error',
        content: `${err.name}: ${err.message}`,
      });
    }

    const elapsed = (performance.now() - startTime).toFixed(2);
    setExecTime(elapsed);
    setLogs(capturedLogs);
    toast.success('Code executed!');
  };

  const handleRun = () => {
    if (lang === 'javascript') {
      runJsCode();
    } else {
      toast.success('Live preview updated!');
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (lang === 'javascript') {
      setJsCode(JS_SNIPPETS[0].code);
      setLogs([]);
    } else {
      setHtmlCode(HTML_SNIPPETS[0].code);
    }
    toast.success('Reset to default snippet');
  };

  const activeSnippetList = lang === 'javascript' ? JS_SNIPPETS : HTML_SNIPPETS;

  // Calculate line numbers for the editor
  const lineCount = activeCode.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div
      className={`flex flex-col bg-[#f7f8fc] dark:bg-[#0b0f19] text-gray-900 dark:text-slate-100 transition-all ${
        fullScreen
          ? 'fixed inset-0 z-50 h-screen w-screen bg-[#f7f8fc] dark:bg-[#0b0f19]'
          : 'h-[calc(100vh-64px)] max-h-[calc(100vh-64px)]'
      } overflow-hidden font-sans`}
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
    >
      {/* ── Subheader / Toolbar ── */}
      <header className="h-14 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/60 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>

          <div className="h-4 w-px bg-gray-200 dark:bg-slate-800" />

          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-md shadow-purple-600/30"
              style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
            >
              <Code2 className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
                Code Playground
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-mono shadow-2xs">
                <Zap className="w-3 h-3 text-purple-600 dark:text-purple-400 fill-purple-600 dark:fill-purple-400" />
                Live Compiler
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Language Toggle (JavaScript vs HTML/CSS) */}
          <div className="flex items-center bg-gray-100 dark:bg-[#090d16] p-1 rounded-xl border border-gray-200 dark:border-slate-800 shadow-inner">
            <button
              onClick={() => {
                setLang('javascript');
                setLogs([]);
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                lang === 'javascript'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              JavaScript
            </button>
            <button
              onClick={() => setLang('html')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                lang === 'html'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              HTML / CSS
            </button>
          </div>

          {/* Snippet Presets */}
          <select
            onChange={(e) => {
              const item = activeSnippetList.find((s) => s.title === e.target.value);
              if (item) {
                if (lang === 'javascript') {
                  setJsCode(item.code);
                  setLogs([]);
                } else {
                  setHtmlCode(item.code);
                }
              }
            }}
            className="hidden md:block text-xs bg-white dark:bg-[#090d16] border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-gray-700 dark:text-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-xs"
          >
            {activeSnippetList.map((s) => (
              <option key={s.title} value={s.title}>
                {s.title}
              </option>
            ))}
          </select>

          {/* Run Button */}
          {lang === 'javascript' && (
            <button
              onClick={handleRun}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #6C5CE7, #5046d4)' }}
              title="Run code (Ctrl + Enter)"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run Code</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setFullScreen(!fullScreen)}
            className="p-2 text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title={fullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {fullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ── Main Split View ── */}
      <div className="flex-1 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 overflow-hidden min-h-0 bg-[#f7f8fc] dark:bg-[#0b0f19]">
        
        {/* ══ Left Card: Code Editor ══ */}
        <div className="flex flex-col h-full bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-0">
          {/* Window Header */}
          <div className="h-10 bg-gray-50 dark:bg-[#0f172a] border-b border-gray-200 dark:border-slate-800 px-4 flex items-center justify-between text-xs text-gray-600 dark:text-slate-400 shrink-0">
            <div className="flex items-center gap-3">
              {/* macOS Window Dots */}
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="flex items-center gap-1.5 ml-1">
                <FileCode className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="font-mono font-bold text-gray-800 dark:text-slate-200">
                  {lang === 'javascript' ? 'main.js' : 'index.html'}
                </span>
                <span className="text-[10px] text-gray-400 font-sans">(Editable)</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyCode}
                className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="Copy code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleReset}
                className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="Reset code template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Editor Area with Line Numbers */}
          <div className="flex-1 relative overflow-hidden min-h-0 bg-[#fafbfc] dark:bg-[#090d16] flex">
            {/* Gutter: Line Numbers */}
            <div className="w-11 py-4 pr-3 text-right font-mono text-xs text-gray-400 dark:text-slate-600 select-none bg-gray-50 dark:bg-[#070a10] border-r border-gray-200 dark:border-slate-800/60 leading-relaxed overflow-hidden">
              {lineNumbers.map((num) => (
                <div key={num}>{num}</div>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              value={lang === 'javascript' ? jsCode : htmlCode}
              onChange={(e) => {
                if (lang === 'javascript') {
                  setJsCode(e.target.value);
                } else {
                  setHtmlCode(e.target.value);
                }
              }}
              onKeyDown={handleKeyDown}
              spellCheck="false"
              className="flex-1 h-full p-4 bg-transparent text-gray-800 dark:text-[#e2e8f0] font-mono text-xs sm:text-sm resize-none focus:outline-none leading-relaxed selection:bg-purple-100 dark:selection:bg-purple-900 selection:text-purple-900 dark:selection:text-purple-100"
              placeholder="Write your code here..."
            />
          </div>
        </div>

        {/* ══ Right Card: Output Console / Live Web Preview ══ */}
        <div className="flex flex-col h-full bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-0">
          
          {/* Header */}
          <div className="h-10 bg-gray-50 dark:bg-[#0f172a] border-b border-gray-200 dark:border-slate-800 px-4 flex items-center justify-between text-xs text-gray-600 dark:text-slate-400 shrink-0">
            <div className="flex items-center gap-3">
              {/* macOS Dots */}
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>

              <div className="flex items-center gap-2 ml-1">
                {lang === 'javascript' ? (
                  <>
                    <Terminal className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-gray-800 dark:text-slate-200">Terminal Output</span>
                    {execTime && (
                      <span className="text-[11px] text-purple-600 dark:text-purple-300 font-mono font-bold bg-purple-50 dark:bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800/50">
                        ⚡ {execTime}ms
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-gray-800 dark:text-slate-200">Live Browser Preview</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 rounded-md">
                      Auto-Reload
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Controls */}
            {lang === 'javascript' ? (
              <button
                onClick={() => setLogs([])}
                className="p-1 hover:text-red-600 dark:hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                title="Clear console"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            ) : (
              <div className="flex items-center bg-gray-200/70 dark:bg-[#090d16] p-0.5 rounded-lg border border-gray-200 dark:border-slate-800">
                <button
                  onClick={() => setDeviceMode('desktop')}
                  className={`p-1 rounded transition cursor-pointer ${
                    deviceMode === 'desktop'
                      ? 'bg-white dark:bg-purple-600 text-purple-600 dark:text-white shadow-xs'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Desktop View"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeviceMode('tablet')}
                  className={`p-1 rounded transition cursor-pointer ${
                    deviceMode === 'tablet'
                      ? 'bg-white dark:bg-purple-600 text-purple-600 dark:text-white shadow-xs'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Tablet View"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeviceMode('mobile')}
                  className={`p-1 rounded transition cursor-pointer ${
                    deviceMode === 'mobile'
                      ? 'bg-white dark:bg-purple-600 text-purple-600 dark:text-white shadow-xs'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Content Pane */}
          <div className="flex-1 overflow-hidden p-3 min-h-0 flex flex-col bg-gray-50/70 dark:bg-[#090d16]">
            {lang === 'javascript' ? (
              <div className="flex-1 overflow-auto p-4 font-mono text-xs bg-white dark:bg-[#070a10] text-gray-800 dark:text-slate-200 rounded-xl border border-gray-200 dark:border-slate-800/80 shadow-2xs">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-500 space-y-2.5 py-12">
                    <Terminal className="w-9 h-9 opacity-30 text-purple-600 dark:text-purple-400" />
                    <p className="font-sans font-medium text-xs text-gray-500 dark:text-slate-400">
                      Press <kbd className="px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-purple-600 dark:text-purple-300 font-mono">Run Code</kbd> or <kbd className="px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-purple-600 dark:text-purple-300 font-mono">Ctrl + Enter</kbd> to execute.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {logs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border leading-relaxed whitespace-pre-wrap ${
                          log.type === 'error'
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 shadow-xs'
                            : log.type === 'warn'
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 shadow-xs'
                            : log.type === 'return'
                            ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800/70 text-purple-700 dark:text-purple-200 font-bold shadow-xs'
                            : 'bg-gray-50 dark:bg-slate-900/90 border-gray-200 dark:border-slate-800 text-gray-800 dark:text-slate-200'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 mr-2">
                          {log.type === 'return' ? '➔ Return' : `[${log.type}]`}
                        </span>
                        {log.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex-1 flex items-center justify-center overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 overflow-hidden rounded-xl border border-gray-300 dark:border-slate-700/80 bg-white dark:bg-slate-950 shadow-md ${
                    deviceMode === 'mobile'
                      ? 'w-[375px]'
                      : deviceMode === 'tablet'
                      ? 'w-[720px]'
                      : 'w-full'
                  }`}
                >
                  <iframe
                    srcDoc={htmlCode}
                    title="Live Web Preview"
                    sandbox="allow-scripts allow-modals"
                    className="w-full h-full border-0 block bg-white dark:bg-slate-950"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
