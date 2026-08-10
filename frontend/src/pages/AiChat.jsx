import React, { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchConversations, fetchConversation, startConversation, sendMessage,
  selectAiConversations, selectCurrentConversation, selectAiMessages,
  selectAiSending, selectAiLoading,
} from '../store/slices/aiSlice';
import { getAllCourses } from '../api/course.api';
import { Bot, Send, Plus, MessageSquare, User, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ChatGPT-style Typewriter Markdown Component
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
    const speed = 15;

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
    <div className="prose prose-xs max-w-none text-xs text-gray-800 dark:text-gray-200 relative">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed text-gray-800 dark:text-gray-200" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc ml-5 mb-2 space-y-1 text-gray-800 dark:text-gray-200" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal ml-5 mb-2 space-y-1 text-gray-800 dark:text-gray-200" {...props} />,
          li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
          code: ({ node, inline, className, children, ...props }) =>
            inline ? (
              <code className="bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-[11px] font-mono px-1.5 py-0.5 rounded font-semibold" {...props}>
                {children}
              </code>
            ) : (
              <pre className="bg-slate-950 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto my-3 border border-slate-800 shadow-inner">
                <code className="text-slate-100" {...props}>
                  {children}
                </code>
              </pre>
            ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 pl-3 italic my-2 text-gray-600 dark:text-gray-300 bg-blue-50/50 dark:bg-blue-950/30 py-1.5 rounded-r" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3">
              <table className="w-full text-left border-collapse border border-gray-200 dark:border-slate-800 text-xs" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => <th className="bg-gray-100 dark:bg-slate-800 p-2 border border-gray-200 dark:border-slate-700 font-bold text-gray-900 dark:text-white" {...props} />,
          td: ({ node, ...props }) => <td className="p-2 border border-gray-200 dark:border-slate-800" {...props} />,
          hr: ({ node, ...props }) => <hr className="my-3 border-gray-200 dark:border-slate-800" {...props} />,
        }}
      >
        {displayedText}
      </ReactMarkdown>
      {isTyping && (
        <span className="inline-block w-2 h-3.5 bg-blue-600 ml-1 animate-pulse align-middle rounded-sm" />
      )}
    </div>
  );
}

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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    dispatch(fetchConversations());
    getAllCourses()
      .then(r => setCoursesList(r.data.courses || r.data.data?.courses || []))
      .catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleStartChat = async () => {
    try {
      const conv = await dispatch(
        startConversation({ title: 'New AI Study Chat', courseId: courseId || undefined })
      ).unwrap();
      toast.success('AI Chat started');
      setCourseId('');
      dispatch(fetchConversation({ id: conv._id }));
    } catch (err) {
      toast.error(err || 'Failed to start conversation');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !current) return;
    const msg = inputMsg;
    setInputMsg('');
    try {
      await dispatch(sendMessage({ conversationId: current._id, data: { content: msg, message: msg } })).unwrap();
    } catch (err) {
      toast.error(err || 'Failed to send message');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 shadow-xs">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Vertex AI Tutor <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Ask questions about courses, lectures, or general concepts</p>
        </div>
      </div>

      {/* Main Chat Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-14rem)] min-h-[520px] max-h-[750px]">
        {/* Sidebar — Conversations */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 flex flex-col justify-between h-full overflow-hidden shadow-xs">
          <div className="flex flex-col h-full overflow-hidden">
            <div className="mb-4 space-y-2 shrink-0">
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full text-xs border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Course Context (Optional)</option>
                {coursesList.map(c => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
              <button
                onClick={handleStartChat}
                className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-xs"
              >
                <Plus className="w-4 h-4" /> New AI Chat
              </button>
            </div>

            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 shrink-0">
              Chat History
            </h3>

            <div className="space-y-1 overflow-y-auto flex-1 pr-1">
              {loading && <p className="text-xs text-gray-400 py-2">Loading chats...</p>}
              {!loading && conversations.length === 0 && (
                <p className="text-xs text-gray-400 py-4 text-center">No previous chats</p>
              )}
              {conversations.map((c) => (
                <div
                  key={c._id}
                  onClick={() => dispatch(fetchConversation({ id: c._id }))}
                  className={`p-2.5 rounded-xl text-xs font-medium cursor-pointer flex items-center gap-2 transition ${
                    current?._id === c._id
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{c.title || 'Untitled Chat'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 flex flex-col justify-between h-full overflow-hidden shadow-xs">
          {current ? (
            <>
              {/* Header */}
              <div className="border-b border-gray-100 dark:border-slate-800/80 pb-3 mb-4 flex justify-between items-center shrink-0">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">{current.title}</h2>
                  <p className="text-[11px] text-gray-400">RAG Knowledge Base & Context Search Active</p>
                </div>
                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Connected
                </span>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 min-h-0">
                {messages.length === 0 && (
                  <div className="text-center py-16 text-gray-400 text-xs">
                    <Bot className="w-12 h-12 mx-auto mb-3 text-blue-400" />
                    Ask any question about your course lectures or study material!
                  </div>
                )}
                {messages.map((m, idx) => {
                  const isAssistant = m.role === 'assistant' || m.role === 'ai';
                  const isLatest = isAssistant && idx === messages.length - 1;

                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`p-2 rounded-full text-white text-xs shrink-0 ${
                          m.role === 'user' ? 'bg-gray-900 dark:bg-slate-700' : 'bg-blue-600'
                        }`}
                      >
                        {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none font-medium shadow-xs'
                            : 'bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-100 rounded-tl-none shadow-xs'
                        }`}
                      >
                        {m.role === 'user' ? (
                          <p>{m.content}</p>
                        ) : (
                          <TypewriterMarkdown content={m.content} isLatest={isLatest} />
                        )}
                      </div>
                    </div>
                  );
                })}
                {sending && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 w-fit">
                    <Bot className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" /> AI is generating response...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSend} className="flex gap-2 shrink-0 pt-3 border-t border-gray-100 dark:border-slate-800">
                <input
                  type="text"
                  placeholder="Ask your study question..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={sending || !inputMsg.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <Bot className="w-16 h-16 mb-4 text-blue-400 dark:text-blue-500 opacity-60" />
              <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">No Active Chat</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm">
                Select a previous chat from the sidebar or click "New AI Chat" to start learning.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
