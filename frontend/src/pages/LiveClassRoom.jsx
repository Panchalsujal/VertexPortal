import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/slices/authSlice';
import { useTheme } from '../context/ThemeContext.jsx';
import { getInstructorLiveClass, updateLiveClassStatus } from '../api/instructor.api';
import { getStudentLiveClass, joinLiveClass, leaveLiveClass } from '../api/student.api';
import { SkeletonLiveRoom } from '../components/ui/Spinner';
import {
  StreamVideoClient,
  StreamVideo,
  StreamCall,
  StreamTheme,
  PaginatedGridLayout,
  SpeakerLayout,
  ParticipantsAudio,
  useCallStateHooks,
  useCall,
  CallingState,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Monitor,
  MonitorOff,
  PhoneOff,
  MessageSquare,
  Users,
  Send,
  Radio,
  Hand,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Sun,
  Moon,
  LayoutGrid,
  LayoutTemplate,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Live Chat Drawer Component
// ─────────────────────────────────────────────────────────────────────────────
function ChatDrawer({
  messages,
  inputText,
  setInputText,
  handleSendMessage,
  chatBottomRef,
  onClose,
}) {
  return (
    <div className="w-full lg:w-84 sm:w-96 bg-slate-900/95 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-72 lg:h-full z-30 transition-all shadow-2xl">
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Class Discussion
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-slate-800 text-slate-400 font-semibold px-2 py-0.5 rounded-full border border-slate-700/60">
            {messages.length} msgs
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded hover:bg-slate-800"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-950/60">
        {messages.map((msg) => (
          <div key={msg.id} className="text-xs">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                {msg.senderName}
                {msg.senderRole === 'instructor' && (
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                    Instructor
                  </span>
                )}
                {msg.senderRole === 'system' && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                    Bot
                  </span>
                )}
              </span>
              <span className="text-[10px] text-slate-500">{msg.time}</span>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-2.5 text-slate-200 leading-relaxed border border-slate-700/50 shadow-xs">
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatBottomRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/90 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask a question or share thoughts..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2 rounded-xl transition cursor-pointer shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Stream Video Stage Component (Rendered inside <StreamCall>)
// ─────────────────────────────────────────────────────────────────────────────
function StreamConnectedStage({
  liveClass,
  isHost,
  currentUser,
  activeSidebar,
  setActiveSidebar,
  onLeaveOrEnd,
  handRaised,
  setHandRaised,
  messages,
  setMessages,
  inputText,
  setInputText,
  chatBottomRef,
  roomContainerRef,
  isFullscreen,
  toggleFullscreen,
}) {
  const call = useCall();
  const { isDark, toggleTheme } = useTheme();
  const {
    useParticipants,
    useIsCallRecordingInProgress,
    useScreenShareState,
    useMicrophoneState,
    useCameraState,
    useCallCallingState,
  } = useCallStateHooks();

  const participants = useParticipants();
  const isRecording = useIsCallRecordingInProgress();
  const { isMute: isMicMuted } = useMicrophoneState();
  const { isMute: isCamMuted } = useCameraState();
  const { screenShare, isEnabled: isScreenSharing } = useScreenShareState();
  // Detect if ANY participant is sharing their screen (screenShareStream is set when active)
  const hasOngoingScreenShare = participants.some(
    (p) => !!p.screenShareStream || (p.publishedTracks && p.publishedTracks.includes(3))
  );
  const callingState = useCallCallingState();

  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' | 'speaker'
  const [manualLayout, setManualLayout] = useState(false); // true = user manually picked layout
  // Start as true so we always show the banner until user taps; browser will unblock then
  const [audioBlocked, setAudioBlocked] = useState(!isHost);
  const [unreadCount, setUnreadCount] = useState(0);

  // Audio autoplay unblocker — runs on mount and whenever a new participant joins
  const doUnblockAudio = async (callRef) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') await ctx.resume();
      }
      if (callRef?.resumeAudio) await callRef.resumeAudio();
      document.querySelectorAll('audio, video').forEach((el) => {
        if (el.paused) el.play().catch(() => {});
        if (el.muted) el.muted = false;
      });
      setAudioBlocked(false);
    } catch (e) {
      console.warn('Audio unblock attempt:', e?.message);
    }
  };

  useEffect(() => {
    if (!call) return;

    // Try immediately on mount (works in desktop where autoplay allowed)
    doUnblockAudio(call);

    // Re-try every time a participant joins (catches instructor joining late)
    const unsub = call.on('call.session_participant_joined', () => {
      doUnblockAudio(call);
    });

    // Also re-try on ANY call event once (belt-and-suspenders for mobile)
    const unsubAll = call.on('all', () => {
      doUnblockAudio(call);
      if (typeof unsubAll === 'function') unsubAll();
    });

    return () => {
      if (typeof unsub === 'function') unsub();
      if (typeof unsubAll === 'function') unsubAll();
    };
  }, [call]);

  // Auto-switch layout when screen share starts/stops (unless user manually picked)
  useEffect(() => {
    if (manualLayout) return;
    if (hasOngoingScreenShare) {
      setLayoutMode('speaker');
    } else {
      setLayoutMode('grid');
    }
  }, [hasOngoingScreenShare, manualLayout]);

  // Real-time custom event listener
  useEffect(() => {
    if (!call) return;

    const handleCustomEvent = (event) => {
      const payload = event?.custom || event;
      if (!payload) return;

      if (payload.type === 'chat_message') {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
        if (activeSidebar !== 'chat') {
          setUnreadCount((prev) => prev + 1);
        }
        setTimeout(() => {
          chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }

      if (payload.type === 'hand_raise') {
        if (isHost && payload.raised) {
          toast(`${payload.userName || 'A student'} raised their hand! ✋`, {
            icon: '✋',
            duration: 4000,
          });
        }
      }

      if (payload.type === 'class_ended') {
        if (!isHost) {
          toast('The instructor has concluded this live class.', { icon: '🏁' });
          setTimeout(() => {
            onLeaveOrEnd();
          }, 1500);
        }
      }
    };

    const unsubscribeCustom = call.on('custom', handleCustomEvent);
    const unsubscribeAll = call.on('all', (event) => {
      if (event?.type === 'custom') {
        handleCustomEvent(event);
      }
    });

    return () => {
      if (typeof unsubscribeCustom === 'function') unsubscribeCustom();
      if (typeof unsubscribeAll === 'function') unsubscribeAll();
    };
  }, [call, isHost, activeSidebar, onLeaveOrEnd, setMessages]);

  const toggleCamera = async () => {
    try {
      if (!call) return;
      if (isCamMuted) {
        await call.camera.enable();
        toast.success('Camera turned on');
      } else {
        await call.camera.disable();
        toast('Camera turned off');
      }
    } catch (e) {
      console.warn('Failed to toggle camera:', e?.message);
      toast.error(e?.message || 'Could not access camera');
    }
  };

  const toggleMic = async () => {
    try {
      if (!call) return;
      if (isMicMuted) {
        await call.microphone.enable();
        toast.success('Microphone unmuted');
      } else {
        await call.microphone.disable();
        toast('Microphone muted');
      }
    } catch (e) {
      console.warn('Failed to toggle mic:', e?.message);
      toast.error(e?.message || 'Could not access microphone');
    }
  };

  const toggleScreenShare = async () => {
    if (!call) return;
    try {
      if (isScreenSharing) {
        await call.screenShare.disable();
        toast('Screen sharing stopped.');
      } else {
        await call.screenShare.enable();
        toast.success('You are now sharing your screen.');
      }
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes('Permission denied') || msg.includes('NotAllowedError')) {
        toast.error('Browser blocked screen share — please allow it in your browser settings.');
      } else if (msg.includes('NotSupportedError')) {
        toast.error('Screen sharing is not supported on this browser/device.');
      } else {
        console.warn('Screen share toggle error:', msg);
        toast.error('Could not start screen share. Try again.');
      }
    }
  };

  const toggleRaiseHand = async () => {
    const nextState = !handRaised;
    setHandRaised(nextState);
    toast(nextState ? 'Hand raised! Instructor notified. ✋' : 'Hand lowered.');

    if (call) {
      try {
        await call.sendCustomEvent({
          type: 'hand_raise',
          id: `${Date.now()}`,
          userId: currentUser?._id || currentUser?.id,
          userName: currentUser?.fullName || 'Student',
          raised: nextState,
        });
      } catch (e) {
        console.warn('Failed to send hand raise event:', e?.message);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const msgObj = {
      type: 'chat_message',
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      senderName: currentUser?.fullName || (isHost ? 'Instructor' : 'Student'),
      senderRole: isHost ? 'instructor' : 'student',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, msgObj]);
    setInputText('');
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    if (call) {
      try {
        await call.sendCustomEvent(msgObj);
      } catch (err) {
        console.warn('Failed to broadcast message via Stream:', err?.message);
      }
    }
  };

  const isConnecting =
    callingState === CallingState.JOINING || callingState === CallingState.RECONNECTING;

  return (
    <div
      ref={roomContainerRef}
      className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-[Inter,sans-serif] select-none"
      onClick={() => { if (audioBlocked) doUnblockAudio(call); }}
    >
      {/* Explicit Audio Stream Element for Remote Participants */}
      <ParticipantsAudio />

      {/* Top Header Bar */}
      <header className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/90 px-3 sm:px-5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
          <button
            onClick={onLeaveOrEnd}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0 border border-slate-700/60 shadow-xs"
            title="Exit live room"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-red-400 shrink-0">
              LIVE
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <h2 className="text-xs sm:text-sm font-bold truncate text-white">
              {liveClass?.title || 'Live Interactive Class'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Screen Share Active Indicator */}
          {hasOngoingScreenShare && !isHost && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-900/40 border border-emerald-700/50 px-3 py-1 rounded-full animate-pulse">
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-semibold">Screen shared</span>
            </div>
          )}

          {/* Layout Grid / Speaker Switcher */}
          <button
            onClick={() => {
              const next = layoutMode === 'grid' ? 'speaker' : 'grid';
              setLayoutMode(next);
              setManualLayout(true);
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer shadow-xs"
            title={layoutMode === 'grid' ? 'Switch to Spotlight view' : 'Switch to Gallery grid'}
          >
            {layoutMode === 'grid' ? <LayoutTemplate className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
          </button>

          {/* User Role Badge */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-full shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="hidden sm:inline text-slate-400">You:</span>
            <span className="font-semibold text-white truncate max-w-[120px]">
              {currentUser?.fullName || 'User'}
            </span>
            <span className="text-[10px] uppercase font-bold text-purple-400 ml-0.5">
              ({isHost ? 'Instructor' : 'Student'})
            </span>
          </div>

          {/* Participants Counter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-full shadow-xs">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>{participants?.length || 1}</span>
          </div>
        </div>
      </header>

      {/* Main Workspace (Stage + Chat) */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Stream Video Stage */}
        <div className="flex-1 min-w-0 flex flex-col bg-slate-950 relative overflow-hidden p-2 sm:p-3">
          <div className="flex-1 min-h-0 w-full relative rounded-2xl overflow-hidden bg-[#080c15] flex items-stretch justify-stretch">
            {isConnecting ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center shadow-lg">
                  <Radio className="w-8 h-8 text-purple-400 animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-slate-300">Connecting to live classroom...</p>
              </div>
            ) : (
              <div className="absolute inset-0 stream-stage-container">
                {layoutMode === 'grid' ? (
                  <PaginatedGridLayout />
                ) : (
                  <SpeakerLayout participantsBarPosition="bottom" />
                )}
              </div>
            )}

            {/* Audio Autoplay Unblock Banner — always show for students until they tap */}
            {audioBlocked && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  doUnblockAudio(call);
                  toast.success('Audio enabled! 🔊');
                }}
                className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 px-5 py-2 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce z-30 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Tap to enable instructor audio</span>
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer z-10 shadow-md backdrop-blur-md"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Floating Controls Bar */}
          <div className="h-16 pt-2 flex items-center justify-center z-20">
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 px-3 sm:px-4 py-2 rounded-2xl shadow-2xl">
              {/* Microphone Toggle */}
              <button
                onClick={toggleMic}
                className={`px-3 py-2 rounded-xl transition cursor-pointer font-bold text-xs flex items-center gap-2 shadow-sm ${
                  !isMicMuted
                    ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title={!isMicMuted ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {!isMicMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{!isMicMuted ? 'Mic On' : 'Mic Muted'}</span>
              </button>

              {/* Camera Toggle */}
              <button
                onClick={toggleCamera}
                className={`px-3 py-2 rounded-xl transition cursor-pointer font-bold text-xs flex items-center gap-2 shadow-sm ${
                  !isCamMuted
                    ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title={!isCamMuted ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {!isCamMuted ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{!isCamMuted ? 'Cam On' : 'Cam Off'}</span>
              </button>

              {/* Screen Share (Host Only) */}
              {isHost && (
                <button
                  onClick={toggleScreenShare}
                  className={`px-3 py-2 rounded-xl transition cursor-pointer font-bold text-xs flex items-center gap-2 shadow-sm ${
                    isScreenSharing
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                  title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                >
                  {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isScreenSharing ? 'Sharing' : 'Share'}</span>
                </button>
              )}

              {/* Raise Hand (Students Only) */}
              {!isHost && (
                <button
                  onClick={toggleRaiseHand}
                  className={`px-3 py-2 rounded-xl transition cursor-pointer font-bold text-xs flex items-center gap-2 shadow-sm ${
                    handRaised
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                  title="Raise Hand"
                >
                  <Hand className="w-4 h-4" />
                  <span className="hidden sm:inline">{handRaised ? 'Hand Raised' : 'Raise Hand'}</span>
                </button>
              )}

              {/* Live Chat Toggle */}
              <button
                onClick={() => {
                  setActiveSidebar(activeSidebar === 'chat' ? null : 'chat');
                  setUnreadCount(0);
                }}
                className={`px-3 py-2 rounded-xl transition cursor-pointer font-bold text-xs flex items-center gap-2 shadow-sm relative ${
                  activeSidebar === 'chat'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
                title="Toggle Live Chat"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Live Chat</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse shadow-md">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* End / Leave Session */}
              <button
                onClick={onLeaveOrEnd}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-950/40 transition cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{isHost ? 'End Session' : 'Leave Class'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Chat Drawer */}
        {activeSidebar && (
          <ChatDrawer
            messages={messages}
            inputText={inputText}
            setInputText={setInputText}
            handleSendMessage={handleSendMessage}
            chatBottomRef={chatBottomRef}
            onClose={() => setActiveSidebar(null)}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Standalone / External Stage
// ─────────────────────────────────────────────────────────────────────────────
function StandaloneLiveStage({
  liveClass,
  isHost,
  currentUser,
  activeSidebar,
  setActiveSidebar,
  onLeaveOrEnd,
  handRaised,
  setHandRaised,
  messages,
  inputText,
  setInputText,
  handleSendMessage,
  chatBottomRef,
  roomContainerRef,
}) {
  const meetingUrl = liveClass?.meetingUrl || liveClass?.meeting?.url || liveClass?.joinUrl;

  return (
    <div
      ref={roomContainerRef}
      className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-[Inter,sans-serif] select-none"
    >
      <header className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/90 px-3 sm:px-5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
          <button
            onClick={onLeaveOrEnd}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0 border border-slate-700/60 shadow-xs"
            title="Exit live room"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 shrink-0">
              {liveClass?.status === 'live' ? 'LIVE NOW' : 'SCHEDULED'}
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <h2 className="text-xs sm:text-sm font-bold truncate text-white">
              {liveClass?.title || 'Live Interactive Class'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-full shadow-xs">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>Active</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden p-3 sm:p-6 justify-center items-center">
          <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-purple-950/80 border border-purple-800/60 mx-auto flex items-center justify-center shadow-lg">
              <Radio className="w-8 h-8 text-purple-400" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-1.5">{liveClass?.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {liveClass?.description || 'Interactive live classroom session.'}
              </p>
            </div>

            {meetingUrl && (
              <div className="pt-2">
                <a
                  href={meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 transition cursor-pointer text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch Meeting Link</span>
                </a>
                <p className="text-[11px] text-slate-500 mt-2">Opens in external meeting app</p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-3">
              {!isHost && (
                <button
                  onClick={() => {
                    setHandRaised(!handRaised);
                    toast(handRaised ? 'Hand lowered' : 'Hand raised! Instructor notified. ✋');
                  }}
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                    handRaised
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  <Hand className="w-4 h-4" />
                  <span>{handRaised ? 'Hand Raised' : 'Raise Hand'}</span>
                </button>
              )}

              <button
                onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}
                className="p-3 rounded-2xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-2 transition cursor-pointer shadow-md"
              >
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span>Discussion</span>
              </button>

              <button
                onClick={onLeaveOrEnd}
                className="p-3 rounded-2xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 transition cursor-pointer shadow-md"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Leave</span>
              </button>
            </div>
          </div>
        </div>

        {activeSidebar && (
          <ChatDrawer
            messages={messages}
            inputText={inputText}
            setInputText={setInputText}
            handleSendMessage={handleSendMessage}
            chatBottomRef={chatBottomRef}
            onClose={() => setActiveSidebar(null)}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Main LiveClassRoom Page Container
// ─────────────────────────────────────────────────────────────────────────────
export default function LiveClassRoom() {
  const { liveClassId } = useParams();
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectUser);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [liveClass, setLiveClass] = useState(null);
  const [streamClient, setStreamClient] = useState(null);
  const [streamCall, setStreamCall] = useState(null);
  const [isInstructor, setIsInstructor] = useState(false);

  // Chat & UI state
  const [activeSidebar, setActiveSidebar] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      senderName: 'Vertex Assistant',
      senderRole: 'system',
      text: 'Welcome to the live session! You can participate in discussion below.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [handRaised, setHandRaised] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const roomContainerRef = useRef(null);
  const chatBottomRef = useRef(null);

  const isHost = currentUser?.role === 'admin' || currentUser?.role === 'instructor';

  useEffect(() => {
    let mounted = true;
    let clientInstance = null;
    let callInstance = null;
    let hasJoinedSuccessfully = false;

    async function initRoom() {
      try {
        setLoading(true);
        setErrorMsg(null);
        let streamInfo = null;
        let classData = null;
        let hostMode = false;

        if (isHost) {
          try {
            const hostRes = await getInstructorLiveClass(liveClassId);
            classData = hostRes.data.liveClass || hostRes.data.data?.liveClass || hostRes.data;
            streamInfo = hostRes.data.stream || hostRes.data.data?.stream || classData?.stream;
            hostMode = true;
          } catch (hostErr) {
            console.warn('Instructor endpoint fetch warning:', hostErr?.message);
          }
        }

        if (!streamInfo) {
          try {
            const joinRes = await joinLiveClass(liveClassId);
            const joinData = joinRes.data;
            classData = joinData.liveClass || joinData.data?.liveClass || joinData;
            streamInfo = joinData.stream || joinData.data?.stream || classData?.stream;
            hostMode = isHost;
          } catch (joinErr) {
            try {
              const classRes = await getStudentLiveClass(liveClassId);
              classData = classRes.data.liveClass || classRes.data.data?.liveClass || classRes.data;
              streamInfo = classData?.stream || null;
              hostMode = isHost;
            } catch (fallbackErr) {
              const errMsg =
                joinErr?.response?.data?.message ||
                fallbackErr?.response?.data?.message ||
                'Unable to join live class';
              throw new Error(errMsg, { cause: fallbackErr });
            }
          }
        }

        if (mounted) {
          setLiveClass(classData);
          setIsInstructor(hostMode);
        }

        // Successfully joined or fetched room data
        hasJoinedSuccessfully = true;

        // Initialize GetStream Video Client if stream credentials present
        if (streamInfo?.apiKey && streamInfo?.token) {
          try {
            const userObj = {
              id: String(streamInfo.user?.id || currentUser?._id || currentUser?.id || 'student'),
              name: streamInfo.user?.name || currentUser?.fullName || 'Student',
              image: streamInfo.user?.image || currentUser?.avatarUrl || undefined,
            };

            clientInstance = new StreamVideoClient({
              apiKey: streamInfo.apiKey,
              user: userObj,
              token: streamInfo.token,
            });

            const callType = streamInfo.callType || 'default';
            const callId = streamInfo.callId || liveClassId;
            callInstance = clientInstance.call(callType, callId);

            await callInstance.join({ create: hostMode });

            if (hostMode) {
              try {
                await callInstance.camera.enable();
                await callInstance.microphone.enable();
              } catch (mediaErr) {
                console.warn('Media enable:', mediaErr?.message);
              }
            } else {
              try {
                await callInstance.microphone.disable().catch(() => {});
              } catch (disableErr) {
                // Ignore initial mute error on mobile
              }
            }

            if (mounted) {
              setStreamClient(clientInstance);
              setStreamCall(callInstance);
            }
          } catch (streamInitErr) {
            console.warn('Stream WebRTC initialization skipped:', streamInitErr?.message);
          }
        }
      } catch (err) {
        if (mounted) {
          const message =
            err?.response?.data?.message ||
            err?.message ||
            'Failed to connect to live class';
          setErrorMsg(message);
          toast.error(message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initRoom();

    return () => {
      mounted = false;
      if (callInstance) {
        callInstance.leave().catch(() => {});
      }
      if (clientInstance) {
        clientInstance.disconnectUser().catch(() => {});
      }
      if (!isHost && hasJoinedSuccessfully) {
        leaveLiveClass(liveClassId).catch(() => {});
      }
    };
  }, [liveClassId, isHost, currentUser]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      roomContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleEndOrLeave = async () => {
    if (isInstructor) {
      if (window.confirm('Are you sure you want to end this live session?')) {
        try {
          await updateLiveClassStatus(liveClassId, { status: 'completed' });
        } catch (_e) {
          // ignore status update error
        }
        if (streamCall) await streamCall.leave().catch(() => {});
        navigate('/instructor/live-classes');
      }
    } else {
      if (streamCall) await streamCall.leave().catch(() => {});
      await leaveLiveClass(liveClassId).catch(() => {});
      toast.success('Left live class');
      navigate('/student/live-classes');
    }
  };

  if (loading) {
    return <SkeletonLiveRoom />;
  }

  // Friendly error card instead of blank screen
  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-red-950/60 border border-red-800/60 mx-auto flex items-center justify-center shadow-lg">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Unable to Join Live Class</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{errorMsg}</p>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => navigate('/student/live-classes')}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              Back to Live Classes
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Stream WebRTC Video Room
  if (streamClient && streamCall) {
    return (
      <StreamVideo client={streamClient}>
        <StreamTheme className="h-full w-full">
          <StreamCall call={streamCall}>
            <StreamConnectedStage
              liveClass={liveClass}
              isHost={isInstructor}
              currentUser={currentUser}
              activeSidebar={activeSidebar}
              setActiveSidebar={setActiveSidebar}
              onLeaveOrEnd={handleEndOrLeave}
              handRaised={handRaised}
              setHandRaised={setHandRaised}
              messages={messages}
              setMessages={setMessages}
              inputText={inputText}
              setInputText={setInputText}
              chatBottomRef={chatBottomRef}
              roomContainerRef={roomContainerRef}
              isFullscreen={isFullscreen}
              toggleFullscreen={toggleFullscreen}
            />
          </StreamCall>
        </StreamTheme>
      </StreamVideo>
    );
  }

  // Fallback Standalone Stage
  return (
    <StandaloneLiveStage
      liveClass={liveClass}
      isHost={isInstructor}
      currentUser={currentUser}
      activeSidebar={activeSidebar}
      setActiveSidebar={setActiveSidebar}
      onLeaveOrEnd={handleEndOrLeave}
      handRaised={handRaised}
      setHandRaised={setHandRaised}
      messages={messages}
      inputText={inputText}
      setInputText={setInputText}
      handleSendMessage={handleSendMessage}
      chatBottomRef={chatBottomRef}
      roomContainerRef={roomContainerRef}
    />
  );
}
