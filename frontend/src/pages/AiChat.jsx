import React, { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchConversations, fetchConversation, startConversation, sendMessage,
  renameConversation, removeConversation, clearAiChat,
  selectAiConversations, selectCurrentConversation, selectAiMessages,
  selectAiSending, selectAiLoading,
} from '../store/slices/aiSlice';
import { getAllCourses } from '../api/course.api';
import {
  Bot, Send, Plus, MessageSquare, User, Sparkles, Trash2,
  Edit2, Check, X, Copy, CheckCheck, BookOpen, Layers,
  Search, RefreshCw, HelpCircle, ChevronRight, CornerDownLeft,
  ExternalLink, Zap, Lightbulb, GraduationCap, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Code Block with 1-Click Copy
function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeContent = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3 rounded-2xl overflow-hidden border border-gray-800 bg-slate-950 shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-gray-800 text-[11px] font-mono text-gray-400">
        <span className="font-semibold uppercase tracking-wider text-purple-400">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition"
        >
          {copied ? (
            <>
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono overflow-x-auto text-gray-100 leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

// Typewriter Markdown Component
function TypewriterMarkdown({ content, isLatest }) {
  const [displayedText, setDisplayedText] = useState(isLatest ? '' : content);
  const [isTyping, setIsTyping] = useState(isLatest);

  useEffect(() => {
    if (!isLatest || !content) {
      setDisplayedText(content || '');
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    const step = Math.max(1, Math.floor(content.length / 150));
    const speed = 12;

    const interval = setInterval(() => {
      index += step;
      if (index >= content.length) {
        setDisplayedText(content);
        setIsTyping(false);
        clearInterval(interval);
      } else {
        setDisplayedText(content.slice(0, index));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [content, isLatest]);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-gray-800 dark:text-gray-200 relative">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node, ...props }) => <p className="mb-2.5 last:mb-0 leading-relaxed" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-purple-600 dark:text-purple-400" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc ml-5 mb-3 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal ml-5 mb-3 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
          code: ({ node, inline, className, children, ...props }) =>
            inline ? (
              <code className="bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 text-[11px] font-mono px-1.5 py-0.5 rounded font-semibold border border-purple-200 dark:border-purple-800" {...props}>
                {children}
              </code>
            ) : (
              <CodeBlock className={className}>{children}</CodeBlock>
            ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-purple-500 pl-3 italic my-2 text-gray-600 dark:text-gray-300 bg-purple-50/50 dark:bg-purple-950/20 py-2 rounded-r-xl" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
              <table className="w-full text-left border-collapse text-xs" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => <th className="bg-gray-100 dark:bg-gray-800 p-2.5 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-white" {...props} />,
          td: ({ node, ...props }) => <td className="p-2.5 border-b border-gray-100 dark:border-gray-800/80" {...props} />,
          hr: ({ node, ...props }) => <hr className="my-4 border-gray-200 dark:border-gray-800" {...props} />,
        }}
      >
        {displayedText}
      </ReactMarkdown>
      {isTyping && (
        <span className="inline-block w-2 h-3.5 bg-purple-600 ml-1 animate-pulse align-middle rounded-sm" />
      )}
    </div>
  );
}

const INSPIRATION_PROMPTS = [
  { label: 'Summarize Key Topics', prompt: 'Please provide a clear, comprehensive summary of the main topics in this course.', icon: BookOpen },
  { label: 'Generate Practice Quiz', prompt: 'Generate 5 multiple-choice practice quiz questions with detailed explanations for each answer.', icon: Sparkles },
  { label: 'Explain with Analogies', prompt: 'Explain the most complex and difficult concepts of this subject using simple everyday analogies.', icon: Lightbulb },
  { label: 'Exam Study Guide', prompt: 'Create a structured 7-day study plan and revision checklist to prepare for my upcoming exam.', icon: GraduationCap },
];

export default function AiChat() {
  const dispatch = useAppDispatch();
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

  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    dispatch(fetchConversations());
    getAllCourses()
      .then(r => setCoursesList(r.data.courses || r.data.data?.courses || []))
      .catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, sending]);

  const handleStartChat = async (presetCourseId = courseId) => {
    try {
      const selectedCourse = coursesList.find(c => c._id === presetCourseId);
      const title = selectedCourse ? `${selectedCourse.title} AI Tutor` : 'New AI Study Chat';
      const conv = await dispatch(
        startConversation({ title, courseId: presetCourseId || undefined })
      ).unwrap();
      toast.success('New AI Chat session ready');
      dispatch(fetchConversation({ id: conv._id }));
    } catch (err) {
      toast.error(err || 'Failed to start conversation');
    }
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

    try {
      await dispatch(
        sendMessage({
          conversationId: targetConv._id,
          data: { content: textToSend, message: textToSend },
        })
      ).unwrap();
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-[Inter,sans-serif] py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Chat Interface Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8.5rem)] min-h-[600px] max-h-[860px]">

          {/* Left Sidebar — Chat History & Course Scope */}
          <div className="lg:col-span-4 xl:col-span-3 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-4 flex flex-col justify-between h-full overflow-hidden shadow-sm">
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header / Brand */}
              <div className="flex items-center gap-3 mb-4 px-2 pt-1 shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                    Vertex AI Tutor <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </h1>
                  <p className="text-[11px] text-gray-400">RAG Knowledge Engine</p>
                </div>
              </div>

              {/* Course Context Picker */}
              <div className="space-y-2 mb-3 shrink-0">
                <div className="relative">
                  <BookOpen className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2.5 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition font-medium"
                  >
                    <option value="">Course Scope: All Knowledge</option>
                    {coursesList.map(c => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleStartChat(courseId)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> New AI Conversation
                </button>
              </div>

              {/* Search Chat History */}
              <div className="relative mb-2.5 shrink-0">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Chat History Header */}
              <div className="flex items-center justify-between px-2 mb-2 shrink-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Conversations
                </span>
                <button
                  onClick={() => dispatch(fetchConversations())}
                  className="text-gray-400 hover:text-purple-600 transition"
                  title="Refresh chat history"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              {/* Conversations List */}
              <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                {loading && (
                  <div className="py-8 text-center text-xs text-gray-400">
                    Loading conversations...
                  </div>
                )}
                {!loading && filteredConversations.length === 0 && (
                  <div className="text-center py-8 px-4 text-gray-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-400" />
                    <p className="text-xs font-medium">No conversations found</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Start a chat to ask questions!</p>
                  </div>
                )}
                {filteredConversations.map((c) => {
                  const isSelected = current?._id === c._id;
                  const isEditing = editingId === c._id;

                  return (
                    <div
                      key={c._id}
                      onClick={() => !isEditing && dispatch(fetchConversation({ id: c._id }))}
                      className={`group p-2.5 rounded-2xl text-xs font-medium cursor-pointer flex items-center justify-between gap-2 transition-all ${
                        isSelected
                          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold shadow-xs'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 border border-purple-400 rounded-lg px-2 py-0.5 text-xs w-full text-gray-900 dark:text-white focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <span className="truncate">{c.title || 'Untitled Chat'}</span>
                        )}
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        {isEditing ? (
                          <>
                            <button
                              onClick={(e) => handleSaveRename(c._id, e)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Save title"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => handleStartRename(c, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded transition"
                              title="Rename chat"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteConversation(c._id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition"
                              title="Delete conversation"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Main Chat Window */}
          <div className="lg:col-span-8 xl:col-span-9 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col justify-between h-full overflow-hidden shadow-sm">
            {current ? (
              <>
                {/* Chat Top Header */}
                <div className="border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 flex flex-wrap justify-between items-center gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight flex items-center gap-2">
                        {current.title}
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-400">
                          RAG Knowledge Search
                        </span>
                        {activeCourse && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200">
                            <BookOpen className="w-2.5 h-2.5" />
                            {activeCourse.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Mistral AI + RAG
                    </span>
                    <button
                      onClick={(e) => handleDeleteConversation(current._id, e)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Stream Area */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto space-y-5 pr-2 mb-4 min-h-0 scrollbar-thin"
                >
                  {messages.length === 0 && (
                    <div className="py-12 px-4 max-w-xl mx-auto text-center space-y-6 animate-in fade-in">
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-lg">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                          How can I help you learn today?
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                          Ask questions about your lectures, request practice quizzes, or explore course topics.
                        </p>
                      </div>

                      {/* Inspiration Prompt Chips */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                        {INSPIRATION_PROMPTS.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(item.prompt)}
                            className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-gray-100 dark:border-gray-800 hover:border-purple-200 transition text-left group cursor-pointer"
                          >
                            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs mb-1">
                              <item.icon className="w-3.5 h-3.5" />
                              <span>{item.label}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                              {item.prompt}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m, idx) => {
                    const isAssistant = m.role === 'assistant' || m.role === 'ai';
                    const isLatest = isAssistant && idx === messages.length - 1;
                    const sources = m.sources || m.metadata?.sources || [];

                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-3.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-2xl flex items-center justify-center text-white text-xs shrink-0 shadow-sm ${
                            m.role === 'user'
                              ? 'bg-gray-900 dark:bg-gray-700'
                              : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                          }`}
                        >
                          {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>

                        <div className={`max-w-[85%] space-y-2 ${m.role === 'user' ? 'items-end' : ''}`}>
                          <div
                            className={`rounded-3xl p-4.5 text-xs leading-relaxed shadow-xs ${
                              m.role === 'user'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none font-medium'
                                : 'bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/80 text-gray-800 dark:text-gray-100 rounded-tl-none'
                            }`}
                          >
                            {m.role === 'user' ? (
                              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                            ) : (
                              <TypewriterMarkdown content={m.content} isLatest={isLatest} />
                            )}
                          </div>

                          {/* Sources & Citations if RAG retrieved */}
                          {isAssistant && sources.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pl-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Sources:
                              </span>
                              {sources.map((s, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                >
                                  <BookOpen className="w-2.5 h-2.5" />
                                  {s.title || `Resource #${s.sourceIndex || sIdx + 1}`}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Message Actions */}
                          {isAssistant && (
                            <div className="flex items-center gap-2 pl-1">
                              <button
                                onClick={() => handleCopyMessage(m.content, idx)}
                                className="text-[11px] text-gray-400 hover:text-purple-600 flex items-center gap-1 transition"
                                title="Copy answer"
                              >
                                {copiedMsgId === idx ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span className="text-emerald-500">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {sending && (
                    <div className="flex items-start gap-3.5 animate-in fade-in">
                      <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/80 p-4 rounded-3xl rounded-tl-none flex items-center gap-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          Synthesizing knowledge & generating answer...
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="pt-3 border-t border-gray-100 dark:border-gray-800 shrink-0"
                >
                  <div className="relative flex items-center bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-2xl focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition shadow-inner">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      placeholder="Ask your AI tutor anything about your course..."
                      value={inputMsg}
                      onChange={(e) => {
                        setInputMsg(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                      }}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-transparent px-4 py-3 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none resize-none max-h-28"
                    />
                    <button
                      type="submit"
                      disabled={sending || !inputMsg.trim()}
                      className="mr-2.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] text-gray-400">
                    <span>Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded font-mono">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded font-mono">Shift+Enter</kbd> for newline</span>
                    <span>Powered by Mistral Large & Vertex RAG</span>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 max-w-md mx-auto space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shadow-inner">
                  <Bot className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Welcome to Vertex AI Tutor
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Select a conversation from the sidebar or click "New AI Conversation" to start learning with course-tailored assistance.
                  </p>
                </div>
                <button
                  onClick={() => handleStartChat(courseId)}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Start New AI Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
