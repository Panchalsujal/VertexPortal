import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// =========================================================================
// Code Block Component with Mac Controls & Copy Functionality
// =========================================================================
export function CodeBlock({ language, codeText, children }) {
  const [copied, setCopied] = useState(false);

  const displayLang = (language || "code").toUpperCase();

  const handleCopy = (e) => {
    e.stopPropagation();
    const textToCopy = codeText || (typeof children === "string" ? children : "");
    if (textToCopy) {
      navigator.clipboard?.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-slate-800 bg-[#0F172A] shadow-lg group">
      {/* Code Header with macOS style dots and Copy button */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-[11px] select-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E] inline-block shadow-xs shadow-rose-500/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block shadow-xs shadow-amber-500/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block shadow-xs shadow-emerald-500/50" />
          <span className="font-mono font-extrabold text-indigo-300 ml-1.5 uppercase text-[10px] tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {displayLang}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer shadow-xs active:scale-95"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <span className="text-emerald-400 font-bold">✓</span>
              <span className="text-emerald-300">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed text-emerald-300 font-mono scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        <code>{codeText || children}</code>
      </pre>
    </div>
  );
}

// =========================================================================
// Enhanced Markdown Renderer
// =========================================================================
export function MarkdownRenderer({ content, className = "" }) {
  if (!content) return null;

  return (
    <div className={`space-y-3 text-[13px] text-slate-800 leading-relaxed font-sans ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-base font-extrabold text-slate-900 pt-3 pb-1 border-b border-slate-100">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-extrabold text-slate-900 pt-2.5 pb-1 border-b border-slate-100">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-extrabold text-[#5B4FF5] pt-2 tracking-wider flex items-center gap-1.5 uppercase">
              <span>◈</span> {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-bold text-slate-900 pt-1.5">
              {children}
            </h4>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="leading-relaxed text-[13px] text-slate-800 my-1">{children}</p>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="space-y-1.5 my-2 pl-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1.5 my-2 pl-1 list-decimal list-inside">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-2 text-[13px] text-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B4FF5] shrink-0 mt-2" />
              <span className="flex-1 leading-relaxed">{children}</span>
            </li>
          ),
          // Bold & Italic
          strong: ({ children }) => (
            <strong className="font-extrabold text-slate-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded text-[11px]">{children}</em>
          ),
          // Pre & Code Handling (Fixed to never render empty blocks)
          pre: ({ children }) => {
            // Check if child is a code tag with props
            if (children && children.props) {
              const codeProps = children.props;
              const className = codeProps.className || "";
              const match = /language-(\w+)/.exec(className);
              const lang = match ? match[1] : "";
              const rawText = String(codeProps.children || "").replace(/\n$/, "");
              return <CodeBlock language={lang} codeText={rawText} />;
            }
            return <>{children}</>;
          },
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const rawText = String(children || "").replace(/\n$/, "");

            // If it's a code block with language or multiline, render CodeBlock
            if (match || className?.includes("language") || rawText.includes("\n")) {
              return <CodeBlock language={match ? match[1] : "code"} codeText={rawText} />;
            }

            // Otherwise, render inline code badge
            return (
              <code
                className="mx-1 px-1.5 py-0.5 rounded-md bg-[#EEF0FF] text-[#5B4FF5] font-mono text-[11px] font-bold border border-indigo-100"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="my-2 p-3 bg-[#EEF0FF]/60 border-l-4 border-[#5B4FF5] rounded-r-2xl text-[13px] text-slate-800 italic leading-relaxed">
              {children}
            </blockquote>
          ),
          // Horizontal rules
          hr: () => <hr className="my-3 border-t border-slate-100" />,
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5B4FF5] hover:underline font-bold"
            >
              {children}
            </a>
          ),
          // Tables
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="w-full text-[12px] border-collapse border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#EEF0FF] font-extrabold text-slate-900">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-extrabold text-slate-900 text-left border-b border-slate-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-slate-700 border-b border-slate-100">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// =========================================================================
// Typewriter Markdown Component
// =========================================================================
export function TypewriterMarkdown({
  content = "",
  isTyping = false,
  speed = 12,
  onComplete,
  onTypingStep,
}) {
  const [displayedLength, setDisplayedLength] = useState(isTyping ? 0 : content.length);
  const [isDone, setIsDone] = useState(!isTyping);
  const timerRef = useRef(null);

  // If typing is disabled or content changes
  useEffect(() => {
    if (!isTyping) {
      setDisplayedLength(content.length);
      setIsDone(true);
      return;
    }

    setDisplayedLength(0);
    setIsDone(false);

    let currentLength = 0;
    const totalLength = content.length;

    // Dynamic chunk size so longer responses type naturally fast without lag
    const getChunkSize = (len) => {
      if (len > 1500) return 12;
      if (len > 800) return 8;
      if (len > 300) return 4;
      return 2;
    };

    const intervalTime = Math.max(8, speed);

    timerRef.current = setInterval(() => {
      const step = getChunkSize(totalLength);
      currentLength = Math.min(currentLength + step, totalLength);
      setDisplayedLength(currentLength);

      if (onTypingStep) {
        onTypingStep();
      }

      if (currentLength >= totalLength) {
        clearInterval(timerRef.current);
        setIsDone(true);
        if (onComplete) {
          onComplete();
        }
      }
    }, intervalTime);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [content, isTyping, speed, onComplete, onTypingStep]);

  // Click to complete immediately
  const handleSkip = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setDisplayedLength(content.length);
    setIsDone(true);
    if (onComplete) {
      onComplete();
    }
  };

  const displayedContent = content.slice(0, displayedLength);

  return (
    <div className="relative group/typewriter">
      <MarkdownRenderer content={displayedContent} />
      
      {/* Blinking Cursor while typing */}
      {!isDone && (
        <span className="inline-flex items-center gap-1 mt-1 text-[#5B4FF5] text-xs font-mono select-none">
          <span className="inline-block w-2 h-4 bg-[#5B4FF5] rounded-xs animate-pulse" />
          <button
            type="button"
            onClick={handleSkip}
            className="text-[10px] text-slate-400 hover:text-[#5B4FF5] bg-slate-100 hover:bg-indigo-50 px-1.5 py-0.5 rounded cursor-pointer transition-colors ml-2"
          >
            Skip ⏩
          </button>
        </span>
      )}
    </div>
  );
}

export default MarkdownRenderer;
