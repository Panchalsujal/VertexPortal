import React, { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchConversations, fetchConversation, startConversation, sendMessage,
  renameConversation, removeConversation,
  selectAiConversations, selectCurrentConversation, selectAiMessages,
  selectAiSending, selectAiLoading,
} from '../store/slices/aiSlice';
import { getAllCourses } from '../api/course.api';
import {
  Bot, Send, Plus, MessageSquare, User, Sparkles, Trash2,
  Edit2, Check, X, Copy, CheckCheck, BookOpen,
  Search, RefreshCw,
  Lightbulb, GraduationCap,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

// Render markdown stream content nicely
function FormattedMarkdown({ content, isTyping = false }) {
  const displayedText = content;

  return (
    <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h1 className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2 pb-1 border-b border-gray-100 dark:border-gray-800" {...props} />,
          h2: (props) => <h2 className="text-base font-bold text-gray-900 dark:text-white mt-3 mb-1.5" {...props} />,
          h3: (props) => <h3 className="text-sm font-bold text-purple-700 dark:text-purple-300 mt-2.5 mb-1" {...props} />,
          p: (props) => <p className="mb-2.5 last:mb-0 leading-relaxed text-gray-800 dark:text-gray-200" {...props} />,
          strong: (props) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
          em: (props) => <em className="italic text-purple-600 dark:text-purple-400" {...props} />,
          ul: (props) => <ul className="list-disc pl-5 mb-3 space-y-1 text-gray-800 dark:text-gray-200" {...props} />,
          ol: (props) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-gray-800 dark:text-gray-200" {...props} />,
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
            <blockquote className="border-l-4 border-purple-500 pl-3.5 italic my-3 text-gray-600 dark:text-gray-300 bg-purple-50/40 dark:bg-purple-950/20 py-2 rounded-r-xl" {...props} />
          ),
          table: (props) => (
            <div className="overflow-x-auto my-4 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-sm bg-white dark:bg-gray-900">
              <table className="w-full text-left border-collapse text-xs sm:text-sm" {...props} />
            </div>
          ),
          thead: (props) => <thead className="bg-purple-50/70 dark:bg-purple-950/40 border-b border-gray-200 dark:border-gray-700 text-purple-950 dark:text-purple-200 font-bold" {...props} />,
          th: (props) => <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 border-r border-gray-200/60 dark:border-gray-700/60 last:border-r-0" {...props} />,
          td: (props) => <td className="px-4 py-2.5 border-t border-r border-gray-100 dark:border-gray-800/60 last:border-r-0 text-gray-700 dark:text-gray-200" {...props} />,
          tr: (props) => <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors" {...props} />,
          hr: (props) => <hr className="my-4 border-gray-200 dark:border-gray-800" {...props} />,
        }}
      >
        {displayedText}
      </ReactMarkdown>
      {isTyping && (
        <span className="inline-block w-2 h-4 bg-purple-600 ml-1 animate-pulse align-middle rounded-xs" />
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    <div className="h-[calc(100vh-4.5rem)] bg-gray-50 dark:bg-[#0b0f17] font-[Inter,sans-serif] flex overflow-hidden">
      {/* Sidebar — Conversations & Scope */}
      <aside
        className={`${
          sidebarOpen ? 'w-80' : 'w-0 -translate-x-full'
        } transition-all duration-300 ease-in-out bg-white dark:bg-[#111827] border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between h-full z-20 shrink-0 overflow-hidden shadow-sm`}
      >
        <div className="flex flex-col h-full p-4 overflow-hidden">
          {/* Header Brand */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800/80 mb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                  Vertex AI Tutor <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                </h1>
                <p className="text-[11px] text-gray-400">RAG Semantic Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg lg:hidden"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat & Scope */}
          <div className="space-y-2 mb-3 shrink-0">
            <div className="relative">
              <BookOpen className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2.5 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition font-medium cursor-pointer"
              >
                <option value="">Scope: All Knowledge Base</option>
                {coursesList.map(c => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleStartChat(courseId)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Conversation
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mb-2.5 shrink-0">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Chat History Header */}
          <div className="flex items-center justify-between px-1 mb-2 shrink-0">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Recent Chats
            </span>
            <button
              onClick={() => dispatch(fetchConversations())}
              className="text-gray-400 hover:text-purple-600 transition p-1"
              title="Refresh chats"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Conversations Stream */}
          <div className="space-y-1 overflow-y-auto flex-1 pr-1 scrollbar-thin">
            {loading && (
              <div className="py-6 text-center text-xs text-gray-400">
                Loading chats...
              </div>
            )}
            {!loading && filteredConversations.length === 0 && (
              <div className="text-center py-8 px-4 text-gray-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-400" />
                <p className="text-xs font-medium">No previous chats</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Click New Conversation to start</p>
              </div>
            )}
            {filteredConversations.map((c) => {
              const isSelected = current?._id === c._id;
              const isEditing = editingId === c._id;

              return (
                <div
                  key={c._id}
                  onClick={() => !isEditing && dispatch(fetchConversation({ id: c._id }))}
                  className={`group px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800 shadow-xs'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
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
      </aside>

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#0b0f17] relative">
        {/* Top Chat Header */}
        <header className="h-14 border-b border-gray-200 dark:border-gray-800/80 px-4 sm:px-6 flex items-center justify-between shrink-0 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                title="Open Sidebar"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {current?.title || 'Vertex AI Tutor'}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <span>Mistral Large Engine</span>
                {activeCourse && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 truncate max-w-[200px]">
                    <BookOpen className="w-2.5 h-2.5" />
                    {activeCourse.title}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              RAG Active
            </span>
            {current && (
              <button
                onClick={(e) => handleDeleteConversation(current._id, e)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition cursor-pointer"
                title="Delete Conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Message Stream */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 scrollbar-thin"
        >
          <div className="max-w-3xl mx-auto space-y-6">
            {!current || messages.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-6 animate-in fade-in">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    What would you like to explore today?
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-md mx-auto">
                    Ask questions about your lectures, request practice test questions, or get clear step-by-step concept breakdowns.
                  </p>
                </div>

                {/* Prompt Starter Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                  {INSPIRATION_PROMPTS.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(item.prompt)}
                      className="p-4 rounded-2xl bg-white dark:bg-[#161f30] hover:bg-purple-50/80 dark:hover:bg-purple-950/40 border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all text-left shadow-xs hover:shadow-md group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs mb-1.5">
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
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

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[88%] space-y-2 ${m.role === 'user' ? 'items-end' : ''}`}>
                    <div
                      className={`p-4.5 text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-3xl rounded-tr-none shadow-sm font-medium'
                          : 'bg-white dark:bg-[#131b2a] border border-gray-200/80 dark:border-gray-800 rounded-3xl rounded-tl-none shadow-xs text-gray-800 dark:text-gray-100'
                      }`}
                    >
                      {m.role === 'user' ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      ) : (
                        <FormattedMarkdown content={m.content} isLatest={isLatest} />
                      )}
                    </div>

                    {/* Citations / Sources */}
                    {isAssistant && sources.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pl-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Sources:
                        </span>
                        {sources.map((s, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                          >
                            <BookOpen className="w-3 h-3" />
                            {s.title || `Lecture Resource #${s.sourceIndex || sIdx + 1}`}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Copy Action */}
                    {isAssistant && (
                      <div className="flex items-center gap-2 pl-2">
                        <button
                          onClick={() => handleCopyMessage(m.content, idx)}
                          className="text-xs text-gray-400 hover:text-purple-600 flex items-center gap-1 transition p-1 cursor-pointer"
                          title="Copy message"
                        >
                          {copiedMsgId === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy response</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-gray-900 dark:bg-gray-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {sending && (
              <div className="flex items-start gap-3.5 animate-in fade-in">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-[#131b2a] border border-gray-200/80 dark:border-gray-800 p-4.5 rounded-3xl rounded-tl-none shadow-xs flex items-center gap-3">
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
        </div>

        {/* Floating Input Area */}
        <footer className="p-4 sm:p-6 bg-gradient-to-t from-white via-white to-transparent dark:from-[#0b0f17] dark:via-[#0b0f17] dark:to-transparent shrink-0">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-center bg-white dark:bg-[#161f30] border border-gray-300 dark:border-gray-700/80 rounded-2xl shadow-lg focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all overflow-hidden"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Ask anything about your courses, lectures, or study materials..."
                value={inputMsg}
                onChange={(e) => {
                  setInputMsg(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
                }}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent px-4 py-3.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none resize-none max-h-36"
              />
              <button
                type="submit"
                disabled={sending || !inputMsg.trim()}
                className="mr-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-md transition cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
            <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-gray-400">
              <span>Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono text-[10px]">Shift+Enter</kbd> for newline</span>
              <span>Vertex AI Tutor • Mistral Large</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
