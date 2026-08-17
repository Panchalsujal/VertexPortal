import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchConversations, fetchConversation, startConversation, sendMessage,
  renameConversation, removeConversation, markMessageAnimated,
  selectAiConversations, selectCurrentConversation, selectAiMessages,
  selectAiSending, selectAiLoading,
} from '../store/slices/aiSlice';
import { getAllCourses } from '../api/course.api';
import {
  BookOpenIcon,
  MessageSquareIcon,
  SparklesIcon,
  BrainIcon,
  CircleCheckIcon,
  ArrowRightIcon,
  UsersIcon,
  VideoIcon,
} from '@animateicons/react/lucide';
import {
  Send, Plus, Trash2, Edit2, Check, X, Copy, CheckCheck,
  Search, RefreshCw, Lightbulb, GraduationCap,
  PanelLeftClose, PanelLeftOpen, Menu, Bot, User, FastForward
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageScroller } from '../components/ui/MessageScroller';
import { Combobox } from '../components/ui/Combobox';

// Beautiful Syntax-Highlighted Code Block
function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeContent = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-950 text-gray-100 font-mono text-xs shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 text-gray-400">
        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto leading-relaxed scrollbar-thin">
        <code>{codeContent}</code>
      </pre>
    </div>
  );
}

// ─── Markdown component config (stable reference — defined outside component) ─
const MD_COMPONENTS = {
  h1: (props) => <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2 pb-1 border-b border-gray-100 dark:border-gray-800" {...props} />,
  h2: (props) => <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mt-3 mb-1.5" {...props} />,
  h3: (props) => <h3 className="text-xs sm:text-sm font-bold text-purple-700 dark:text-purple-300 mt-2.5 mb-1" {...props} />,
  p: ({ node, children, ...props }) => <div className="mb-2.5 last:mb-0 leading-relaxed text-gray-800 dark:text-gray-200 inline" {...props}>{children}</div>,
  strong: (props) => <strong className="font-bold text-purple-950 dark:text-purple-200 bg-purple-50/70 dark:bg-purple-950/40 px-1 py-0.5 rounded" {...props} />,
  em: (props) => <em className="italic text-purple-600 dark:text-purple-400" {...props} />,
  ul: (props) => <ul className="list-disc pl-5 mb-3 space-y-1.5 text-gray-800 dark:text-gray-200 block" {...props} />,
  ol: (props) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-gray-800 dark:text-gray-200 block" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  code: ({ inline, className, children, ...props }) =>
    inline ? (
      <code className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-mono px-1.5 py-0.5 rounded-md font-semibold border border-purple-200/60 dark:border-purple-800/60" {...props}>
        {children}
      </code>
    ) : (
      <CodeBlock className={className}>{children}</CodeBlock>
    ),
  blockquote: (props) => (
    <blockquote className="border-l-4 border-purple-500 pl-3.5 italic my-3 text-gray-600 dark:text-gray-300 bg-purple-50/40 dark:bg-purple-950/20 py-2 rounded-r-xl block" {...props} />
  ),
  table: (props) => (
    <div className="overflow-x-auto my-4 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-sm bg-white dark:bg-gray-900 block">
      <table className="w-full text-left border-collapse text-xs sm:text-sm" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-purple-50/70 dark:bg-purple-950/40 border-b border-gray-200 dark:border-gray-700 text-purple-950 dark:text-purple-200 font-bold" {...props} />,
  th: (props) => <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 border-r border-gray-200/60 dark:border-gray-700/60 last:border-r-0" {...props} />,
  td: (props) => <td className="px-4 py-2.5 border-t border-r border-gray-100 dark:border-gray-800/60 last:border-r-0 text-gray-700 dark:text-gray-200" {...props} />,
  tr: (props) => <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors" {...props} />,
  hr: (props) => <hr className="my-4 border-gray-200 dark:border-gray-800 block" {...props} />,
};

/**
 * FormattedMarkdown — authentic ChatGPT-like streaming typewriter effect
 * with dynamic token pacing, live blinking cursor, skip capability, and auto-scroll trigger.
 */
function FormattedMarkdown({ content = '', animate = false, onComplete, onTypingTick }) {
  const [displayedText, setDisplayedText] = useState(() => (animate ? '' : content));
  const [isTyping, setIsTyping] = useState(() => Boolean(animate && content));

  const typedRef = useRef(animate ? 0 : content.length);
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const onTypingTickRef = useRef(onTypingTick);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onTypingTickRef.current = onTypingTick;
  });

  useEffect(() => {
    // If not set to animate, render full content immediately
    if (!animate) {
      setDisplayedText(content);
      setIsTyping(false);
      typedRef.current = content.length;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!content) return;

    const totalLength = content.length;

    // Reset if content changed or if we need to start fresh for this message
    if (typedRef.current >= totalLength) {
      typedRef.current = 0;
      setDisplayedText('');
    }

    setIsTyping(true);

    // Natural token streaming speed:
    // Paced at ~16ms (60fps) with dynamic chunking so short answers feel snappy & long answers don't take ages
    const step = Math.max(2, Math.min(10, Math.ceil(totalLength / 120)));

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      typedRef.current += step;

      if (typedRef.current >= totalLength) {
        typedRef.current = totalLength;
        setDisplayedText(content);
        setIsTyping(false);
        onCompleteRef.current?.();
        onTypingTickRef.current?.();
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else {
        setDisplayedText(content.slice(0, typedRef.current));
        onTypingTickRef.current?.();
      }
    }, 16);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [content, animate]);

  const handleSkipTypewriter = (e) => {
    e?.stopPropagation();
    if (isTyping) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      typedRef.current = content.length;
      setDisplayedText(content);
      setIsTyping(false);
      onCompleteRef.current?.();
      onTypingTickRef.current?.();
    }
  };

  return (
    <div className="relative group/typing">
      <div
        className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed"
        onClick={handleSkipTypewriter}
        style={isTyping ? { cursor: 'pointer' } : undefined}
        title={isTyping ? 'Click to skip typing animation' : undefined}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
          {displayedText}
        </ReactMarkdown>

        {/* ChatGPT Style Blinking Block Cursor */}
        {isTyping && (
          <span
            className="inline-block w-2 h-4 sm:w-2.5 sm:h-4.5 bg-gradient-to-t from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 ml-1 rounded-[2px] animate-pulse align-middle shadow-xs"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Floating Skip Control while actively typing */}
      {isTyping && (
        <div className="mt-2 pt-1.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400 select-none">
          <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
            Generating response...
          </span>
          <button
            type="button"
            onClick={handleSkipTypewriter}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-950 text-gray-600 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition cursor-pointer"
            title="Reveal complete response"
          >
            <FastForward className="w-3 h-3" />
            <span>Skip</span>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * ChatMessage — memoized so that previously-sent messages do NOT re-render
 * while the latest AI message is streaming. This keeps performance butter-smooth.
 */
const ChatMessage = React.memo(function ChatMessage({
  message: m,
  isAssistant,
  isAnimating,
  sources,
  copiedMsgId,
  msgIdx,
  onCopy,
  onAnimationComplete,
  onTypingTick,
}) {
  return (
    <div className={`flex items-start gap-2 sm:gap-3.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {isAssistant && (
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-1">
          <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      )}

      <div className={`max-w-[94%] sm:max-w-[85%] space-y-1.5 ${m.role === 'user' ? 'items-end' : ''}`}>
        <div
          className={`p-3 sm:p-4 text-xs sm:text-sm leading-relaxed ${
            m.role === 'user'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl sm:rounded-3xl rounded-tr-none shadow-xs font-medium'
              : 'bg-white dark:bg-[#131b2a] border border-gray-200/80 dark:border-gray-800 rounded-2xl sm:rounded-3xl rounded-tl-none shadow-xs text-gray-800 dark:text-gray-100'
          }`}
        >
          {m.role === 'user' ? (
            <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
          ) : (
            <FormattedMarkdown
              content={m.content}
              animate={isAnimating}
              onComplete={onAnimationComplete}
              onTypingTick={onTypingTick}
            />
          )}
        </div>

        {/* Citations / Sources */}
        {isAssistant && sources.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pl-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sources:</span>
            {sources.map((s, sIdx) => (
              <span
                key={sIdx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
              >
                <BookOpenIcon size={11} color="#6C5CE7" />
                <span>{s.title || `Lecture Resource #${s.sourceIndex || sIdx + 1}`}</span>
              </span>
            ))}
          </div>
        )}

        {/* Copy Action */}
        {isAssistant && (
          <div className="flex items-center gap-2 pl-1">
            <button
              type="button"
              onClick={() => onCopy(m.content, msgIdx)}
              className="text-[11px] text-gray-400 hover:text-purple-600 flex items-center gap-1 transition p-0.5 cursor-pointer"
              title="Copy message"
            >
              {copiedMsgId === msgIdx ? (
                <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500 font-semibold">Copied</span></>
              ) : (
                <><Copy className="w-3 h-3" /><span>Copy</span></>
              )}
            </button>
          </div>
        )}
      </div>

      {m.role === 'user' && (
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gray-900 dark:bg-gray-700 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-1">
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      )}
    </div>
  );
});

const INSPIRATION_PROMPTS = [
  { label: 'Summarize Key Topics', prompt: 'Please provide a clear, comprehensive summary of the main topics in this course.', icon: BookOpenIcon },
  { label: 'Generate Practice Quiz', prompt: 'Generate 5 multiple-choice practice quiz questions with detailed explanations for each answer.', icon: SparklesIcon },
  { label: 'Explain with Analogies', prompt: 'Explain the most complex and difficult concepts of this subject using simple everyday analogies.', icon: Lightbulb },
  { label: 'Exam Study Guide', prompt: 'Create a structured 7-day study plan and revision checklist to prepare for my upcoming exam.', icon: GraduationCap },
];


export default function AiChat() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const conversations = useAppSelector(selectAiConversations);
  const current = useAppSelector(selectCurrentConversation);
  const messages = useAppSelector(selectAiMessages);
  const sending = useAppSelector(selectAiSending);
  const loading = useAppSelector(selectAiLoading);

  const [inputMsg, setInputMsg] = useState('');
  const [courseId, setCourseId] = useState('');
  const [coursesList, setCoursesList] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [animatingMsgId, setAnimatingMsgId] = useState(null);

  // Responsive sidebar: closed by default on mobile screens
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });

  const scrollerRef = useRef(null);
  const textareaRef = useRef(null);
  const queryParamHandled = useRef(false);

  useEffect(() => {
    dispatch(fetchConversations());
    getAllCourses()
      .then(r => setCoursesList(r.data.courses || r.data.data?.courses || []))
      .catch(() => {});
  }, [dispatch]);

  // Handle incoming query param (?q=... and optional &courseId=...)
  useEffect(() => {
    const q = searchParams.get('q');
    const cId = searchParams.get('courseId');
    if (cId) setCourseId(cId);

    if (q && !queryParamHandled.current) {
      queryParamHandled.current = true;
      setInputMsg(q);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleStartChat = async (presetCourseId = courseId) => {
    try {
      const selectedCourse = coursesList.find(c => c._id === presetCourseId);
      const title = selectedCourse ? `${selectedCourse.title} AI Tutor` : 'New AI Study Chat';
      const conv = await dispatch(
        startConversation({ title, courseId: presetCourseId || undefined })
      ).unwrap();
      toast.success('New AI Chat session ready');
      dispatch(fetchConversation({ id: conv._id }));
      if (window.innerWidth < 1024) setSidebarOpen(false);
    } catch (err) {
      toast.error(err || 'Failed to start conversation');
    }
  };

  const handleSelectConversation = (id) => {
    setAnimatingMsgId(null);
    dispatch(fetchConversation({ id }));
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleSend = async (messageText) => {
    const textToSend = typeof messageText === 'string' ? messageText : inputMsg;
    if (!textToSend.trim()) return;

    let targetConv = current;
    if (!targetConv) {
      try {
        const selectedCourse = coursesList.find(c => c._id === courseId);
        const title = textToSend.slice(0, 30) + '...';
        targetConv = await dispatch(
          startConversation({ title, courseId: courseId || undefined })
        ).unwrap();
      } catch (err) {
        toast.error('Failed to initialize conversation');
        return;
      }
    }

    setInputMsg('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Scroll to bottom immediately as user message is placed
    setTimeout(() => {
      scrollerRef.current?.scrollToBottom('smooth');
    }, 50);

    try {
      const res = await dispatch(
        sendMessage({
          conversationId: targetConv._id,
          data: {
            content: textToSend,
            message: textToSend,
            courseId: courseId || targetConv.course || undefined,
          },
        })
      ).unwrap();

      const newBotId = res?.assistantMessage?._id || res?.aiMessage?._id || 'latest-response';
      setAnimatingMsgId(newBotId);
      setTimeout(() => {
        scrollerRef.current?.scrollToBottom('smooth');
      }, 50);
    } catch (err) {
      toast.error(err || 'Failed to generate AI response');
    }
  };

  const handleDeleteConversation = async (convId, e) => {
    e?.stopPropagation();
    if (!window.confirm('Delete this AI conversation? All message history will be removed.')) return;
    try {
      await dispatch(removeConversation(convId)).unwrap();
      toast.success('Conversation deleted');
    } catch (err) {
      toast.error(err || 'Failed to delete conversation');
    }
  };

  const handleStartRename = (conv, e) => {
    e?.stopPropagation();
    setEditingId(conv._id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = async (convId, e) => {
    e?.stopPropagation();
    if (!editTitle.trim()) return;
    try {
      await dispatch(renameConversation({ conversationId: convId, data: { title: editTitle.trim() } })).unwrap();
      toast.success('Chat renamed');
      setEditingId(null);
    } catch (err) {
      toast.error(err || 'Failed to rename');
    }
  };

  const handleCopyMessage = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    toast.success('Message copied');
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredConversations = conversations.filter(c =>
    (c.title || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  const activeCourse = coursesList.find(c => c._id === current?.course);

  return (
    <>
      <Helmet>
        <title>
          {current?.title
            ? `${current.title} — AI Tutor | VertexPortal`
            : 'Vertex AI Tutor & Study Assistant — VertexPortal'}
        </title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="h-[calc(100dvh-4rem)] bg-gray-50 dark:bg-[#0b0f17] font-[Inter,sans-serif] flex relative overflow-hidden">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Sidebar — Drawer on Mobile, Column on Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 lg:static lg:z-auto transition-transform duration-300 ease-in-out bg-white dark:bg-[#111827] border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between h-full shrink-0 overflow-hidden shadow-xl lg:shadow-none ${
          sidebarOpen ? 'translate-x-0 w-72 sm:w-80' : '-translate-x-full w-0 lg:w-0'
        }`}
      >
        <div className="flex flex-col h-full p-4 overflow-hidden">
          {/* Header Brand */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800/80 mb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <BrainIcon size={18} color="white" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 leading-none">
                  Vertex AI Tutor <SparklesIcon size={13} color="#f59e0b" />
                </h1>
                <p className="text-[10px] text-gray-400 mt-0.5">RAG Semantic Assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg lg:hidden"
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat & Scope */}
          <div className="space-y-2 mb-3 shrink-0">
            <Combobox
              value={courseId}
              onChange={(val) => setCourseId(val)}
              options={[
                { value: '', label: 'Scope: All Knowledge Base' },
                ...coursesList.map((c) => ({ value: c._id, label: c.title })),
              ]}
              placeholder="Scope: All Knowledge Base"
              searchPlaceholder="Filter knowledge scope..."
              className="w-full text-xs"
            />

            <button
              type="button"
              onClick={() => handleStartChat(courseId)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> <span>New Conversation</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mb-2.5 shrink-0">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Conversation History List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-none">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
              Recent Sessions ({filteredConversations.length})
            </div>
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                No conversations found.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = current?._id === conv._id;
                return (
                  <div
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv._id)}
                    className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200/80 dark:border-purple-800/60'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <MessageSquareIcon size={13} color="currentColor" className="shrink-0" />
                      {editingId === conv._id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(conv._id, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-white dark:bg-gray-900 border border-purple-400 rounded px-1.5 py-0.5 text-xs text-gray-900 dark:text-white focus:outline-none w-full"
                          autoFocus
                        />
                      ) : (
                        <span className="truncate">{conv.title || 'Untitled Session'}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {editingId === conv._id ? (
                        <button
                          type="button"
                          onClick={(e) => handleSaveRename(conv._id, e)}
                          className="p-1 hover:text-emerald-500 rounded"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleStartRename(conv, e)}
                            className="p-1 hover:text-purple-600 rounded"
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteConversation(conv._id, e)}
                            className="p-1 hover:text-red-600 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#0b0f17] relative">
        {/* Top Chat Header */}
        <header className="h-12 sm:h-14 border-b border-gray-200 dark:border-gray-800/80 px-3 sm:px-6 flex items-center justify-between shrink-0 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md z-10 gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer shrink-0"
              title="Toggle Conversations Drawer"
              aria-label="Toggle Sidebar"
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4 sm:w-5 sm:h-5 hidden lg:block" /> : <PanelLeftOpen className="w-4 h-4 sm:w-5 sm:h-5 hidden lg:block" />}
              <Menu className="w-5 h-5 lg:hidden" />
            </button>

            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                {current?.title || 'Vertex AI Tutor'}
              </h2>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-gray-400 truncate">
                <span>Mistral Large Engine</span>
                {activeCourse && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 truncate max-w-[120px] sm:max-w-[200px]">
                    <BookOpenIcon size={11} color="#6C5CE7" />
                    <span className="truncate">{activeCourse.title}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              RAG Active
            </span>
            {current && (
              <button
                type="button"
                onClick={(e) => handleDeleteConversation(current._id, e)}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition cursor-pointer"
                title="Delete Conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Message Stream with Shadcn MessageScroller */}
        <MessageScroller
          ref={scrollerRef}
          className="px-3 sm:px-6 py-3 sm:py-6 space-y-3 sm:space-y-6"
        >
          <div className="max-w-3xl mx-auto space-y-3 sm:space-y-6">
            {!current || messages.length === 0 ? (
              <div className="py-2 sm:py-6 px-1 sm:px-4 text-center space-y-2.5 sm:space-y-4 animate-in fade-in">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <SparklesIcon size={20} color="white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    What would you like to explore today?
                  </h3>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-md mx-auto">
                    Ask questions about your lectures, request practice test questions, or get clear step-by-step breakdowns.
                  </p>
                </div>

                {/* Prompt Starter Cards - Compact 2-column on mobile */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-left pt-1">
                  {INSPIRATION_PROMPTS.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(item.prompt)}
                      className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white dark:bg-[#161f30] hover:bg-purple-50/80 dark:hover:bg-purple-950/40 border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all text-left shadow-2xs hover:shadow-xs group cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold text-[11px] sm:text-xs mb-0.5">
                        <item.icon size={13} color="#6C5CE7" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-tight">
                        {item.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((m, idx) => {
              const isAssistant = m.role === 'assistant' || m.role === 'ai';
              const isLatest = isAssistant && idx === messages.length - 1;
              const sources = m.sources || m.metadata?.sources || [];
              const isAnimating = Boolean(
                m.shouldAnimate ||
                (animatingMsgId &&
                  (animatingMsgId === m._id ||
                    animatingMsgId === m.id ||
                    (animatingMsgId === 'latest-response' && isLatest)))
              );

              return (
                <ChatMessage
                  key={m._id || m.id || `msg-${idx}`}
                  message={m}
                  isAssistant={isAssistant}
                  isAnimating={isAnimating}
                  sources={sources}
                  copiedMsgId={copiedMsgId}
                  msgIdx={idx}
                  onCopy={handleCopyMessage}
                  onAnimationComplete={() => {
                    setAnimatingMsgId(null);
                    if (m._id) {
                      dispatch(markMessageAnimated(m._id));
                    }
                  }}
                  onTypingTick={() => {
                    scrollerRef.current?.scrollToBottom('auto');
                  }}
                />
              );
            })}

            {sending && (
              <div className="flex items-start gap-2 sm:gap-3.5 animate-in fade-in">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-1">
                  <BrainIcon size={14} color="white" />
                </div>
                <div className="bg-white dark:bg-[#131b2a] border border-gray-200/80 dark:border-gray-800 p-3 sm:p-4 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-2.5">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Consulting course knowledge & writing response...
                  </span>
                </div>
              </div>
            )}
          </div>
        </MessageScroller>

        {/* Floating Input Area */}
        <footer className="p-2 sm:p-4 pb-3 sm:pb-5 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#0b0f17] dark:via-[#0b0f17]/95 dark:to-transparent shrink-0">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-center bg-white dark:bg-[#161f30] border border-gray-300 dark:border-gray-700/80 rounded-2xl shadow-md focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all p-1"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Ask about courses, lectures, or topics..."
                value={inputMsg}
                onChange={(e) => {
                  setInputMsg(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                }}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none resize-none max-h-24 scrollbar-none"
              />
              <button
                type="submit"
                disabled={sending || !inputMsg.trim()}
                className="p-2 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
            <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-gray-400">
              <span className="hidden sm:inline">Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono text-[9px]">Enter</kbd> to send</span>
              <span className="ml-auto text-[9px] sm:text-[10px]">Vertex AI Tutor • Mistral Large</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  </>
);
}
