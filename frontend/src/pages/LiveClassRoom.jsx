import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/slices/authSlice';
import { getInstructorLiveClass, updateLiveClassStatus } from '../api/instructor.api';
import { getStudentLiveClass, joinLiveClass, leaveLiveClass } from '../api/student.api';
import { Spinner } from '../components/ui/Spinner';
import {
  StreamVideoClient,
  StreamVideo,
  StreamCall,
  StreamTheme,
  SpeakerLayout,
  CallControls,
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
  CheckCircle2,
  Clock,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Stream Video Stage Component (Inside StreamCall context)
// ─────────────────────────────────────────────────────────────────────────────
function LiveStreamStage({
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
  isFullscreen,
  toggleFullscreen,
}) {
  const call = useCall();
  const {
    useCallCallingState,
    useParticipants,
    useCameraState,
    useMicrophoneState,
    useScreenShareState,
  } = useCallStateHooks();

  const callingState = useCallCallingState();
  const participants = useParticipants();
  const { isMute: isMicMuted } = useMicrophoneState();
  const { isMute: isCamMuted } = useCameraState();
  const { status: screenShareStatus } = useScreenShareState();
  const isScreenSharing = screenShareStatus === 'enabled';

  // Toggle Camera
  const toggleCamera = async () => {
    try {
      if (call) {
        await call.camera.toggle();
      }
    } catch (e) {
      console.warn('Failed to toggle camera:', e?.message);
    }
  };

  // Toggle Mic
  const toggleMic = async () => {
    try {
      if (call) {
        await call.microphone.toggle();
      }
    } catch (e) {
      console.warn('Failed to toggle mic:', e?.message);
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    try {
      if (call) {
        await call.screenShare.toggle();
      }
    } catch (e) {
      console.warn('Failed to toggle screen share:', e?.message);
    }
  };

  const isConnecting =
    callingState === CallingState.JOINING || callingState === CallingState.RECONNECTING;

  return (
    <div
      ref={roomContainerRef}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-[Inter,sans-serif] select-none"
    >
      {/* Top Header Bar */}
      <header className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onLeaveOrEnd}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            title="Exit live room"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-red-400">LIVE</span>
            <span className="text-slate-600">|</span>
            <h2 className="text-xs sm:text-sm font-bold truncate max-w-xs sm:max-w-md text-white">
              {liveClass?.title || 'Live Interactive Class'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-purple-400 bg-purple-950/60 border border-purple-800/50 px-2.5 py-1 rounded-full font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>GetStream Real-Time WebRTC</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800/70 border border-slate-700/50 px-2.5 py-1 rounded-full">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>{participants?.length || 1} online</span>
          </div>
        </div>
      </header>

      {/* Main Workspace (Stage + Chat) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Stream Video Stage */}
        <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden p-3 sm:p-4">
          <div className="flex-1 w-full h-full bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl relative flex items-center justify-center overflow-hidden shadow-2xl">
            {isConnecting ? (
              <div className="flex flex-col items-center justify-center text-center p-6 gap-3">
                <Spinner size="lg" />
                <p className="text-xs text-slate-400">Connecting to real-time WebRTC media stream...</p>
              </div>
            ) : (
              <div className="w-full h-full stream-stage-container">
                <SpeakerLayout participantsBarPosition="bottom" />
              </div>
            )}

            {/* Overlay Host/Role Pill */}
            <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 px-3 py-1 rounded-full text-[11px] font-semibold text-white flex items-center gap-2 z-10">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{isHost ? 'Host / Instructor Stream' : `${currentUser?.fullName || 'Student'} (Attending)`}</span>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer z-10"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Bottom Floating Controls Bar */}
          <div className="h-16 pt-3 flex items-center justify-center gap-2 sm:gap-4 z-10">
            {isHost && (
              <>
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-2xl transition cursor-pointer font-bold text-xs flex items-center gap-2 shadow-lg ${
                    !isMicMuted
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  title={!isMicMuted ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {!isMicMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-2xl transition cursor-pointer font-bold text-xs flex items-center gap-2 shadow-lg ${
                    !isCamMuted
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  title={!isCamMuted ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {!isCamMuted ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`p-3 rounded-2xl transition cursor-pointer font-bold text-xs flex items-center gap-2 shadow-lg ${
                    isScreenSharing
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                  title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                >
                  {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isScreenSharing ? 'Sharing Screen' : 'Share Screen'}</span>
                </button>
              </>
            )}

            {!isHost && (
              <button
                onClick={() => {
                  setHandRaised(!handRaised);
                  toast(handRaised ? 'Hand lowered' : 'Hand raised! Instructor has been notified.');
                }}
                className={`p-3 rounded-2xl transition cursor-pointer font-bold text-xs flex items-center gap-2 shadow-lg ${
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

            <button
              onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}
              className={`p-3 rounded-2xl transition cursor-pointer font-bold text-xs flex items-center gap-2 shadow-lg ${
                activeSidebar === 'chat'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
              title="Toggle Live Chat"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Live Chat</span>
            </button>

            <button
              onClick={onLeaveOrEnd}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-950/40 transition cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>{isHost ? 'End Session' : 'Leave Class'}</span>
            </button>
          </div>
        </div>

        {/* Live Chat & Q&A Drawer */}
        {activeSidebar && (
          <div className="w-full lg:w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-72 lg:h-auto z-10">
            {/* Sidebar Header */}
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Class Discussion</h3>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 font-semibold px-2 py-0.5 rounded-full">
                {messages.length} msgs
              </span>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
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
                  <div className="bg-slate-800/80 rounded-xl p-2.5 text-slate-300 leading-relaxed border border-slate-700/50">
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/90 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask a question or share thoughts..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2 rounded-xl transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main LiveClassRoom Page Container
// ─────────────────────────────────────────────────────────────────────────────
export default function LiveClassRoom() {
  const { liveClassId } = useParams();
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectUser);

  const [loading, setLoading] = useState(true);
  const [liveClass, setLiveClass] = useState(null);
  const [streamClient, setStreamClient] = useState(null);
  const [streamCall, setStreamCall] = useState(null);
  const [isInstructor, setIsInstructor] = useState(false);

  // Chat & UI state
  const [activeSidebar, setActiveSidebar] = useState('chat');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      senderName: 'Vertex Live Assistant',
      senderRole: 'system',
      text: 'Welcome to the live session! Real-time video and audio feeds are connected.',
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

    async function initRoom() {
      try {
        setLoading(true);
        let streamInfo = null;
        let classData = null;
        let hostMode = false;

        if (isHost) {
          try {
            const res = await getInstructorLiveClass(liveClassId);
            classData = res.data.liveClass || res.data.data?.liveClass || res.data.data;
            if (classData?.stream) {
              streamInfo = classData.stream;
              hostMode = true;
            }
          } catch (e) {
            console.warn('Instructor endpoint fallback to student join:', e?.message);
          }
        }

        if (!streamInfo) {
          try {
            const joinRes = await joinLiveClass(liveClassId);
            const joinData = joinRes.data;
            classData = joinData.liveClass;
            streamInfo = joinData.stream;
            hostMode = isHost;
          } catch (joinErr) {
            const classRes = await getStudentLiveClass(liveClassId);
            classData = classRes.data.liveClass || classRes.data.data?.liveClass || classRes.data;
            streamInfo = classData?.stream || null;
            hostMode = isHost;
          }
        }

        if (mounted) {
          setLiveClass(classData);
          setIsInstructor(hostMode);
        }

        // Initialize GetStream Video Client if stream credentials present
        if (streamInfo?.apiKey && streamInfo?.token) {
          const userObj = {
            id: String(streamInfo.user?.id || currentUser?._id || currentUser?.id || 'anonymous'),
            name: streamInfo.user?.name || currentUser?.fullName || 'User',
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
              console.warn('Camera/mic auto-enable failed:', mediaErr?.message);
            }
          } else {
            try {
              await callInstance.camera.disable();
              await callInstance.microphone.disable();
            } catch (_) {}
          }

          if (mounted) {
            setStreamClient(clientInstance);
            setStreamCall(callInstance);
          }
        }
      } catch (err) {
        if (mounted) {
          toast.error(err?.response?.data?.message || err?.message || 'Failed to connect to live class');
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
      if (!isHost) {
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      senderName: currentUser?.fullName || (isInstructor ? 'Instructor' : 'Student'),
      senderRole: isInstructor ? 'instructor' : 'student',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleEndOrLeave = async () => {
    if (isInstructor) {
      if (window.confirm('Are you sure you want to end this live session for all attendees?')) {
        try {
          await updateLiveClassStatus(liveClassId, { status: 'completed' });
          toast.success('Live class ended successfully');
        } catch (e) {
          // Ignored
        }
        if (streamCall) {
          await streamCall.leave().catch(() => {});
        }
        navigate('/instructor/live-classes');
      }
    } else {
      if (streamCall) {
        await streamCall.leave().catch(() => {});
      }
      await leaveLiveClass(liveClassId).catch(() => {});
      toast.success('Left live class');
      navigate('/student/live-classes');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-slate-400">Connecting to real-time GetStream video room...</p>
      </div>
    );
  }

  if (streamClient && streamCall) {
    return (
      <StreamVideo client={streamClient}>
        <StreamTheme className="h-full w-full">
          <StreamCall call={streamCall}>
            <LiveStreamStage
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
              isFullscreen={isFullscreen}
              toggleFullscreen={toggleFullscreen}
            />
          </StreamCall>
        </StreamTheme>
      </StreamVideo>
    );
  }

  // Fallback stage if Stream keys are not reachable
  return (
    <LiveStreamStage
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
      isFullscreen={isFullscreen}
      toggleFullscreen={toggleFullscreen}
    />
  );
}
