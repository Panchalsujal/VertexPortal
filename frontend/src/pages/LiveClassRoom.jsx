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
  useCallStateHooks,
  useCall,
  CallingState,
  OwnCapability,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  SlidersHorizontal,
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
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  LayoutGrid,
  LayoutTemplate,
  Settings,
  HelpCircle,
  Headphones,
  Sliders,
  X,
  Shield,
  ShieldAlert,
  Pin,
  UserX,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Live Chat Drawer Component
// ─────────────────────────────────────────────────────────────────────────────
function ChatDrawer({
  messages = [],
  inputText,
  setInputText,
  handleSendMessage,
  chatBottomRef,
  onClose,
}) {
  const safeMessages = Array.isArray(messages) ? messages : [];
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
            {safeMessages.length} msgs
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-950/60">
        {safeMessages.map((msg) => (
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
// 2. Participants & Voice Control Drawer Component
// ─────────────────────────────────────────────────────────────────────────────
function ParticipantsDrawer({
  participants = [],
  currentUser,
  isHost,
  call,
  participantVolumes,
  onSetParticipantVolume,
  onClose,
}) {
  const currentUserId = String(currentUser?._id || currentUser?.id || 'me');

  const handleGrantPermission = async (userId, permission, permName) => {
    if (!call) return;
    try {
      await call.updateUserPermissions({
        user_id: String(userId),
        grant_permissions: [permission],
      });
      toast.success(`Granted ${permName} permission`);
    } catch (e) {
      toast.error(`Failed to grant permission: ${e?.message || 'Error'}`);
    }
  };

  const handleRevokePermission = async (userId, permission, permName) => {
    if (!call) return;
    try {
      await call.updateUserPermissions({
        user_id: String(userId),
        revoke_permissions: [permission],
      });
      toast(`Revoked ${permName} permission`);
    } catch (e) {
      toast.error(`Failed to revoke permission: ${e?.message || 'Error'}`);
    }
  };

  const handleMuteUser = async (userId) => {
    if (!call) return;
    try {
      await call.muteUser(String(userId), 'audio');
      toast.success('Participant muted');
    } catch (e) {
      toast.error(`Failed to mute: ${e?.message || 'Error'}`);
    }
  };

  const handleTurnOffVideo = async (userId) => {
    if (!call) return;
    try {
      await call.muteUser(String(userId), 'video');
      toast('Participant camera turned off');
    } catch (e) {
      toast.error(`Failed: ${e?.message || 'Error'}`);
    }
  };

  const handleKick = async (userId) => {
    if (!call) return;
    if (window.confirm('Are you sure you want to remove this participant from the room?')) {
      try {
        await call.kickUser({ user_id: String(userId) });
        toast.success('Participant removed');
      } catch (e) {
        toast.error(`Failed to remove: ${e?.message || 'Error'}`);
      }
    }
  };

  return (
    <div className="w-full lg:w-96 sm:w-96 bg-slate-900/95 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-80 lg:h-full z-30 transition-all shadow-2xl">
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Participants ({participants.length})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-950/60">
        {participants.map((p) => {
          const isMe = String(p.userId) === currentUserId;
          const isParticipantHost = p.role === 'admin' || p.role === 'host' || p.role === 'instructor' || p.custom?.role === 'instructor';
          const pVolume = participantVolumes[p.sessionId] ?? 100;
          const isSpeaking = p.isSpeaking;

          return (
            <div
              key={p.sessionId || p.userId}
              className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3 space-y-2.5 shadow-sm transition hover:border-slate-600/80"
            >
              {/* Participant Header Info */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-8 h-8 rounded-full object-cover border border-purple-500/40"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center font-bold text-xs text-purple-200">
                        {(p.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    {isSpeaking && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full animate-ping" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">{p.name || 'User'}</span>
                      {isMe && (
                        <span className="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-bold">
                          You
                        </span>
                      )}
                      {isParticipantHost && (
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                          Instructor
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        {p.audioStream ? (
                          <Mic className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <MicOff className="w-3 h-3 text-red-400" />
                        )}
                        {p.audioStream ? 'Mic On' : 'Mic Off'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {p.videoStream ? (
                          <Video className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <VideoOff className="w-3 h-3 text-slate-500" />
                        )}
                        {p.videoStream ? 'Cam On' : 'Cam Off'}
                      </span>
                      {p.screenShareStream && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <Monitor className="w-3 h-3" /> Sharing
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Voice Controller (For all users & participants) */}
              {!isMe && (
                <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-purple-400" />
                      <span>Voice Volume</span>
                    </span>
                    <span className="text-purple-300 font-bold">{pVolume}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSetParticipantVolume(p.sessionId, pVolume === 0 ? 100 : 0)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
                      title={pVolume === 0 ? 'Unmute participant' : 'Mute participant'}
                    >
                      {pVolume === 0 ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={pVolume}
                      onChange={(e) => onSetParticipantVolume(p.sessionId, Number(e.target.value))}
                      className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Host/Admin Direct Permission & Moderation Controls */}
              {isHost && !isMe && (
                <div className="pt-1 border-t border-slate-700/40 grid grid-cols-2 gap-1.5 text-[10px]">
                  <button
                    onClick={() => handleGrantPermission(p.userId, OwnCapability.SEND_AUDIO, 'Microphone')}
                    className="px-2 py-1 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                    title="Allow student to speak"
                  >
                    <Mic className="w-3 h-3 text-emerald-400" />
                    <span>Allow Audio</span>
                  </button>
                  <button
                    onClick={() => handleRevokePermission(p.userId, OwnCapability.SEND_AUDIO, 'Microphone')}
                    className="px-2 py-1 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                    title="Disable student microphone"
                  >
                    <MicOff className="w-3 h-3 text-amber-400" />
                    <span>Disable Audio</span>
                  </button>
                  <button
                    onClick={() => handleGrantPermission(p.userId, OwnCapability.SEND_VIDEO, 'Camera')}
                    className="px-2 py-1 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                    title="Allow student to enable video"
                  >
                    <Video className="w-3 h-3 text-emerald-400" />
                    <span>Allow Video</span>
                  </button>
                  <button
                    onClick={() => handleRevokePermission(p.userId, OwnCapability.SEND_VIDEO, 'Camera')}
                    className="px-2 py-1 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                    title="Disable student camera"
                  >
                    <VideoOff className="w-3 h-3 text-amber-400" />
                    <span>Disable Video</span>
                  </button>
                  <button
                    onClick={() => handleGrantPermission(p.userId, OwnCapability.SCREENSHARE, 'Screen Sharing')}
                    className="px-2 py-1 bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-700/40 rounded-lg font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                    title="Allow student to share screen"
                  >
                    <Monitor className="w-3 h-3 text-purple-400" />
                    <span>Allow Screen</span>
                  </button>
                  <button
                    onClick={() => handleRevokePermission(p.userId, OwnCapability.SCREENSHARE, 'Screen Sharing')}
                    className="px-2 py-1 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                    title="Disable student screen sharing"
                  >
                    <MonitorOff className="w-3 h-3 text-amber-400" />
                    <span>Disable Screen</span>
                  </button>
                  <button
                    onClick={() => handleMuteUser(p.userId)}
                    className="px-2 py-1 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <VolumeX className="w-3 h-3 text-amber-400" />
                    <span>Mute User</span>
                  </button>
                  <button
                    onClick={() => handleKick(p.userId)}
                    className="px-2 py-1 bg-red-950/50 hover:bg-red-900/70 text-red-200 border border-red-800/40 rounded-lg font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <UserX className="w-3 h-3 text-red-400" />
                    <span>Kick</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Voice & Audio Controller Popover / Modal
// ─────────────────────────────────────────────────────────────────────────────
function VoiceControllerPopover({
  isOpen,
  onClose,
  masterVolume,
  onMasterVolumeChange,
  isMutedAll,
  onToggleMuteAll,
  audioLevel,
  isMicMuted,
  onOpenSettings,
  speakerDevices = [],
  selectedSpeaker,
  onSelectSpeaker,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl text-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Voice & Audio Controller</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Output Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              {isMutedAll || masterVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : masterVolume < 50 ? (
                <Volume1 className="w-4 h-4 text-purple-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-purple-400" />
              )}
              <span>Room Master Audio</span>
            </span>
            <span className="font-bold text-purple-300">{isMutedAll ? 'Muted (0%)' : `${masterVolume}%`}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMuteAll}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isMutedAll
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isMutedAll ? 'Unmute Room Audio' : 'Mute Room Audio'}
            >
              {isMutedAll ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMutedAll ? 0 : masterVolume}
              onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>

        {/* Microphone Voice Input Meter */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <span>My Voice Input:</span>
            </span>
            <span className={isMicMuted ? 'text-amber-400 font-bold' : audioLevel > 5 ? 'text-emerald-400 font-bold' : 'text-slate-400 font-medium'}>
              {isMicMuted ? 'Mic Muted' : audioLevel > 5 ? 'Speaking 🎙️' : 'Ready'}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                isMicMuted
                  ? 'bg-amber-500/40'
                  : audioLevel > 50
                  ? 'bg-emerald-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: isMicMuted ? '0%' : `${audioLevel}%` }}
            />
          </div>
        </div>

        {/* Quick Speaker Selector */}
        {speakerDevices && speakerDevices.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-purple-400" />
              <span>Audio Output Device</span>
            </label>
            <select
              value={selectedSpeaker || ''}
              onChange={(e) => onSelectSpeaker && onSelectSpeaker(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {speakerDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Speaker (${d.deviceId.slice(0, 5)})`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="pt-1 flex items-center justify-between border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>More Audio Devices</span>
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Device Settings & Diagnostics Modal Component
// ─────────────────────────────────────────────────────────────────────────────
function DeviceSettingsModal({
  isOpen,
  onClose,
  call,
  micDevices = [],
  selectedMic,
  camDevices = [],
  selectedCam,
  speakerDevices = [],
  selectedSpeaker,
  isMicMuted,
}) {
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    if (!isOpen || !call || isMicMuted) {
      setAudioLevel(0);
      return;
    }
    let animId;
    let audioCtx;
    let analyser;
    let source;

    const setupAudioMonitor = async () => {
      try {
        const stream = call.microphone?.mediaStream;
        if (stream && stream.getAudioTracks().length > 0 && stream.getAudioTracks()[0].enabled) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (!AudioContextClass) return;
          audioCtx = new AudioContextClass();
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const update = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animId = requestAnimationFrame(update);
          };
          update();
        }
      } catch (e) {
        console.warn('Audio monitor info:', e);
      }
    };

    setupAudioMonitor();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (source) {
        try { source.disconnect(); } catch (_e) {}
      }
      if (audioCtx) {
        try { audioCtx.close(); } catch (_e) {}
      }
    };
  }, [isOpen, call, isMicMuted]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-5 shadow-2xl text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Audio & Video Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Microphone Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-purple-400" />
            <span>Select Microphone</span>
          </label>
          <select
            value={selectedMic || ''}
            onChange={async (e) => {
              if (call?.microphone?.select) {
                await call.microphone.select(e.target.value);
                toast.success('Microphone changed');
              }
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {micDevices.length === 0 ? (
              <option value="">Default Microphone</option>
            ) : (
              micDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone (${d.deviceId.slice(0, 5)})`}
                </option>
              ))
            )}
          </select>

          {/* Live Mic Test Level Bar */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Mic Input Test:</span>
              <span className={isMicMuted ? 'text-amber-400 font-bold' : audioLevel > 5 ? 'text-emerald-400 font-bold' : 'text-slate-400 font-medium'}>
                {isMicMuted ? 'Mic is currently Muted' : audioLevel > 5 ? 'Detecting Voice 🎙️' : 'Speak into mic to test'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-75 rounded-full ${
                  isMicMuted
                    ? 'bg-amber-500/50'
                    : audioLevel > 50
                    ? 'bg-emerald-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: isMicMuted ? '0%' : `${audioLevel}%` }}
              />
            </div>
          </div>
        </div>

        {/* Camera Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-purple-400" />
            <span>Select Camera</span>
          </label>
          <select
            value={selectedCam || ''}
            onChange={async (e) => {
              if (call?.camera?.select) {
                await call.camera.select(e.target.value);
                toast.success('Camera changed');
              }
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {camDevices.length === 0 ? (
              <option value="">Default Camera</option>
            ) : (
              camDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera (${d.deviceId.slice(0, 5)})`}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Audio Output / Speaker Selection */}
        {speakerDevices && speakerDevices.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-purple-400" />
              <span>Select Speaker / Audio Output</span>
            </label>
            <select
              value={selectedSpeaker || ''}
              onChange={async (e) => {
                if (call?.speaker?.select) {
                  await call.speaker.select(e.target.value);
                  toast.success('Speaker changed');
                }
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {speakerDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Speaker (${d.deviceId.slice(0, 5)})`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Troubleshooting / Quick Help */}
        <div className="bg-purple-950/40 border border-purple-800/40 rounded-2xl p-3.5 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-purple-300">
            <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
            <span>If other participants still cannot hear you:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
            <li>Check if your external headset or microphone is selected in the dropdown above instead of default.</li>
            <li>In <strong>Brave Browser</strong>: Click the Lion Icon in the URL bar and turn <strong>Shields OFF</strong> for this website.</li>
            <li>In <strong>Windows Settings</strong>: Go to <em>Privacy & Security &gt; Microphone</em> and ensure browser access is turned <strong>ON</strong>.</li>
            <li>Close background apps like <strong>Zoom</strong>, <strong>Discord</strong>, or <strong>Microsoft Teams</strong> that may hold exclusive access to your mic.</li>
          </ul>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Stream Video Stage Component (Rendered inside <StreamCall>)
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
    useSpeakerState,
    useCallCallingState,
    useHasPermissions,
  } = useCallStateHooks();

  const participants = useParticipants() || [];
  const isRecording = useIsCallRecordingInProgress();
  const { isMute: isMicMuted, hasBrowserPermission: hasMicPermission, devices: micDevices, selectedDevice: selectedMic } = useMicrophoneState() || {};
  const { isMute: isCamMuted, hasBrowserPermission: hasCamPermission, devices: camDevices, selectedDevice: selectedCam } = useCameraState() || {};
  const { devices: speakerDevices, selectedDevice: selectedSpeaker } = useSpeakerState ? useSpeakerState() : {};
  const { screenShare, isEnabled: isScreenSharing } = useScreenShareState() || {};

  // Permission hooks from Stream Video SDK
  const hasScreenSharePermission = useHasPermissions ? useHasPermissions(OwnCapability.SCREENSHARE) : true;
  const hasAudioPermission = useHasPermissions ? useHasPermissions(OwnCapability.SEND_AUDIO) : true;
  const hasVideoPermission = useHasPermissions ? useHasPermissions(OwnCapability.SEND_VIDEO) : true;

  // Track previous permissions to notify students when admin toggles them
  const prevScreenSharePerm = useRef(hasScreenSharePermission);
  const prevAudioPerm = useRef(hasAudioPermission);
  const prevVideoPerm = useRef(hasVideoPermission);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [voiceControllerOpen, setVoiceControllerOpen] = useState(false);
  const [masterVolume, setMasterVolume] = useState(100);
  const [isMutedAll, setIsMutedAll] = useState(false);
  const [participantVolumes, setParticipantVolumes] = useState({});
  const [micAudioLevel, setMicAudioLevel] = useState(0);

  // Detect if ANY participant is sharing their screen (screenShareStream is set when active)
  const hasOngoingScreenShare = Array.isArray(participants) && participants.some(
    (p) => !!p.screenShareStream || (Array.isArray(p.publishedTracks) && p.publishedTracks.includes(3))
  );
  const callingState = useCallCallingState();

  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' | 'speaker'
  const [manualLayout, setManualLayout] = useState(false); // true = user manually picked layout
  const [audioBlocked, setAudioBlocked] = useState(!isHost);
  const [unreadCount, setUnreadCount] = useState(0);

  // Audio autoplay unblocker — runs on mount and whenever a new participant joins
  const doUnblockAudio = async (callRef) => {
    try {
      if (callRef?.resumeAudio) await callRef.resumeAudio();
      document.querySelectorAll('audio').forEach((el) => {
        el.muted = isMutedAll;
        el.volume = isMutedAll ? 0 : masterVolume / 100;
        if (el.paused) el.play().catch(() => {});
      });
      setAudioBlocked(false);
    } catch (e) {
      console.warn('Audio resume attempt:', e?.message);
    }
  };

  // Sync Master Volume & Participant Volume to audio streams & SDK SpeakerManager
  useEffect(() => {
    const vol = isMutedAll ? 0 : masterVolume / 100;
    if (call?.speaker?.setVolume) {
      try {
        call.speaker.setVolume(vol);
      } catch (_e) {}
    }
    document.querySelectorAll('audio').forEach((audio) => {
      try {
        audio.muted = isMutedAll;
        audio.volume = vol;
      } catch (_e) {}
    });
  }, [masterVolume, isMutedAll, call]);

  // Set individual participant volume
  const handleSetParticipantVolume = (sessionId, volumePercent) => {
    setParticipantVolumes((prev) => ({ ...prev, [sessionId]: volumePercent }));
    if (call?.speaker?.setParticipantVolume) {
      try {
        call.speaker.setParticipantVolume(sessionId, volumePercent / 100);
      } catch (_e) {}
    }
  };

  // Real-time Mic Activity Level Monitor
  useEffect(() => {
    if (!call || isMicMuted) {
      setMicAudioLevel(0);
      return;
    }
    let animId;
    let audioCtx;
    let analyser;
    let source;

    const setupMicMonitor = async () => {
      try {
        const stream = call.microphone?.mediaStream;
        if (stream && stream.getAudioTracks().length > 0 && stream.getAudioTracks()[0].enabled) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (!AudioContextClass) return;
          audioCtx = new AudioContextClass();
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const update = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setMicAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animId = requestAnimationFrame(update);
          };
          update();
        }
      } catch (e) {
        console.warn('Mic monitor:', e);
      }
    };

    setupMicMonitor();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (source) {
        try { source.disconnect(); } catch (_e) {}
      }
      if (audioCtx) {
        try { audioCtx.close(); } catch (_e) {}
      }
    };
  }, [call, isMicMuted]);

  // Listen and notify when admin grants/revokes permissions for students
  useEffect(() => {
    if (isHost) return;

    // Screen sharing permission update
    if (prevScreenSharePerm.current !== hasScreenSharePermission) {
      if (hasScreenSharePermission) {
        toast.success('Instructor granted you screen sharing permission! 🖥️', { duration: 5000, icon: '🖥️' });
      } else {
        toast('Screen sharing disabled by instructor.', { icon: '🔒' });
        if (isScreenSharing && call?.screenShare) {
          call.screenShare.disable().catch(() => {});
        }
      }
      prevScreenSharePerm.current = hasScreenSharePermission;
    }

    // Audio permission update
    if (prevAudioPerm.current !== hasAudioPermission) {
      if (hasAudioPermission) {
        toast.success('Instructor enabled your microphone! 🎙️', { duration: 5000, icon: '🎙️' });
      } else {
        toast('Microphone disabled by instructor.', { icon: '🔒' });
        if (!isMicMuted && call?.microphone) {
          call.microphone.disable().catch(() => {});
        }
      }
      prevAudioPerm.current = hasAudioPermission;
    }

    // Video permission update
    if (prevVideoPerm.current !== hasVideoPermission) {
      if (hasVideoPermission) {
        toast.success('Instructor enabled your camera! 📹', { duration: 5000, icon: '📹' });
      } else {
        toast('Camera disabled by instructor.', { icon: '🔒' });
        if (!isCamMuted && call?.camera) {
          call.camera.disable().catch(() => {});
        }
      }
      prevVideoPerm.current = hasVideoPermission;
    }
  }, [hasScreenSharePermission, hasAudioPermission, hasVideoPermission, isHost, isScreenSharing, isMicMuted, isCamMuted, call]);

  // Continuously unblock and monitor all remote audio elements
  useEffect(() => {
    const playAllAudio = () => {
      document.querySelectorAll('audio').forEach((audio) => {
        try {
          audio.muted = isMutedAll;
          audio.volume = isMutedAll ? 0 : masterVolume / 100;
          if (audio.paused) {
            audio.play().catch(() => {});
          }
        } catch (_e) {}
      });
    };

    playAllAudio();
    const interval = setInterval(playAllAudio, 1000);
    window.addEventListener('click', playAllAudio);
    window.addEventListener('keydown', playAllAudio);
    window.addEventListener('touchstart', playAllAudio);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', playAllAudio);
      window.removeEventListener('keydown', playAllAudio);
      window.removeEventListener('touchstart', playAllAudio);
    };
  }, [isMutedAll, masterVolume]);

  useEffect(() => {
    if (!call) return;

    doUnblockAudio(call);

    const unsub = call.on('call.session_participant_joined', () => {
      doUnblockAudio(call);
    });

    const unsubAll = call.on('all', () => {
      doUnblockAudio(call);
      if (typeof unsubAll === 'function') unsubAll();
    });

    // Handle being muted by instructor
    const unsubUserMuted = call.on('call.user_muted', (e) => {
      const currentUserId = String(currentUser?._id || currentUser?.id || 'student');
      if (e?.user_id === currentUserId || e?.userId === currentUserId) {
        toast('You have been muted by the instructor.', { icon: '🔇' });
      }
    });

    // Handle being kicked / removed by instructor
    const unsubKicked = call.on('call.kicked', (e) => {
      const currentUserId = String(currentUser?._id || currentUser?.id || 'student');
      if (e?.user_id === currentUserId || e?.userId === currentUserId) {
        toast.error('You were removed from this live class by the instructor.', { duration: 6000 });
        setTimeout(() => {
          onLeaveOrEnd();
        }, 1200);
      }
    });

    const unsubBlocked = call.on('call.blocked_user', (e) => {
      const currentUserId = String(currentUser?._id || currentUser?.id || 'student');
      if (e?.user_id === currentUserId || e?.userId === currentUserId) {
        toast.error('You were blocked from this live room.', { duration: 6000 });
        setTimeout(() => {
          onLeaveOrEnd();
        }, 1200);
      }
    });

    return () => {
      if (typeof unsub === 'function') unsub();
      if (typeof unsubAll === 'function') unsubAll();
      if (typeof unsubUserMuted === 'function') unsubUserMuted();
      if (typeof unsubKicked === 'function') unsubKicked();
      if (typeof unsubBlocked === 'function') unsubBlocked();
    };
  }, [call, currentUser, onLeaveOrEnd]);

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
      if (!isHost && !hasVideoPermission) {
        toast.error('Camera permission is disabled by the instructor for students.', { icon: '🔒' });
        return;
      }
      if (isCamMuted) {
        await call.camera.enable();
        toast.success('Camera turned on 📹');
      } else {
        await call.camera.disable();
        toast('Camera turned off');
      }
    } catch (e) {
      console.warn('Failed to toggle camera:', e);
      const msg = e?.message || '';
      if (msg.includes('Permission') || msg.includes('NotAllowedError')) {
        toast.error('Camera blocked by browser! Please allow camera access in site settings.', { duration: 6000 });
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFoundError')) {
        toast.error('No camera found on this device.', { duration: 5000 });
      } else {
        toast.error(msg || 'Could not access camera');
      }
    }
  };

  const toggleMic = async () => {
    try {
      if (!call) return;
      if (!isHost && !hasAudioPermission) {
        toast.error('Microphone permission is disabled by the instructor for students.', { icon: '🔒' });
        return;
      }
      if (isMicMuted) {
        await call.microphone.enable();
        toast.success('Microphone unmuted 🎙️');
      } else {
        await call.microphone.disable();
        toast('Microphone muted');
      }
    } catch (e) {
      console.warn('Failed to toggle mic:', e);
      const isBrave = (navigator?.brave && typeof navigator?.brave?.isBrave === 'function') || !!window?.chrome?.brave;
      const msg = e?.message || '';

      if (isBrave) {
        toast.error(
          'Brave Shields is blocking your mic! Click the Lion Icon in your URL bar and turn Shields OFF for this site.',
          { duration: 9000, icon: '🦁' }
        );
      } else if (msg.includes('Permission') || msg.includes('NotAllowedError')) {
        toast.error(
          'Microphone blocked! Click the lock/tune icon in your browser URL bar and set Microphone to Allow.',
          { duration: 7000 }
        );
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFoundError')) {
        toast.error('No microphone found. Please connect a microphone or headset to your PC.', { duration: 5000 });
      } else if (msg.includes('NotReadableError') || msg.includes('TrackStartError')) {
        toast.error('Microphone is in use by another app (Zoom/Teams/Discord). Please close other meeting apps.', { duration: 5000 });
      } else {
        toast.error(msg || 'Could not access microphone');
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!call) return;
    if (!isHost && !hasScreenSharePermission) {
      toast.error('Screen sharing permission has not been granted by the instructor.', { icon: '🔒' });
      return;
    }
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
    callingState === CallingState.JOINING ||
    callingState === CallingState.RECONNECTING ||
    callingState === CallingState.IDLE ||
    callingState === CallingState.LEFT;

  const isJoined = callingState === CallingState.JOINED;
  const canScreenShare = isHost || hasScreenSharePermission;

  return (
    <div
      ref={roomContainerRef}
      className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-[Inter,sans-serif] select-none"
      onClick={() => { if (audioBlocked) doUnblockAudio(call); }}
    >
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

          {/* Quick Voice / Volume Indicator & Opener */}
          <button
            onClick={() => setVoiceControllerOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white border border-slate-700/60 transition cursor-pointer shadow-xs flex items-center gap-1.5 text-xs font-bold"
            title="Voice & Audio Controller"
          >
            {isMutedAll || masterVolume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
            )}
            <span className="hidden md:inline text-[11px]">{isMutedAll ? 'Muted' : `${masterVolume}%`}</span>
          </button>

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

          {/* Participants Drawer Toggle Button */}
          <button
            onClick={() => setActiveSidebar(activeSidebar === 'participants' ? null : 'participants')}
            className={`flex items-center gap-1.5 text-xs border px-3 py-1 rounded-full transition cursor-pointer shadow-xs ${
              activeSidebar === 'participants'
                ? 'bg-purple-600 border-purple-500 text-white font-bold'
                : 'text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60'
            }`}
            title="View Participants & Individual Voice Controls"
          >
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>{participants?.length ?? 1}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace (Stage + Sidebars) */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Stream Video Stage */}
        <div className="flex-1 min-w-0 flex flex-col bg-slate-950 relative overflow-hidden p-2 sm:p-3">
          <div className="flex-1 min-h-0 w-full relative rounded-2xl overflow-hidden bg-[#080c15] flex items-stretch justify-stretch">
            {(!isJoined || isConnecting) ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center shadow-lg">
                  <Radio className="w-8 h-8 text-purple-400 animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-slate-300">
                  {callingState === CallingState.JOINING ? 'Joining live room…' :
                   callingState === CallingState.RECONNECTING ? 'Reconnecting…' :
                   'Connecting to live classroom…'}
                </p>
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
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 px-3 sm:px-4 py-2 rounded-2xl shadow-2xl flex-wrap justify-center">
              {/* Microphone Toggle */}
              <button
                onClick={toggleMic}
                className={`px-3 py-2 rounded-xl transition cursor-pointer font-bold text-xs flex items-center gap-2 shadow-sm ${
                  !isHost && !hasAudioPermission
                    ? 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed'
                    : !isMicMuted
                    ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title={!isHost && !hasAudioPermission ? 'Microphone locked by instructor' : !isMicMuted ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {!isHost && !hasAudioPermission ? (
                  <Lock className="w-4 h-4 text-slate-500" />
                ) : !isMicMuted ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {!isHost && !hasAudioPermission ? 'Mic Locked' : !isMicMuted ? 'Mic On' : 'Mic Muted'}
                </span>
              </button>

              {/* Camera Toggle */}
              <button
                onClick={toggleCamera}
                className={`px-3 py-2 rounded-xl transition cursor-pointer font-bold text-xs flex items-center gap-2 shadow-sm ${
                  !isHost && !hasVideoPermission
                    ? 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed'
                    : !isCamMuted
                    ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title={!isHost && !hasVideoPermission ? 'Camera locked by instructor' : !isCamMuted ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {!isHost && !hasVideoPermission ? (
                  <Lock className="w-4 h-4 text-slate-500" />
                ) : !isCamMuted ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <VideoOff className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {!isHost && !hasVideoPermission ? 'Cam Locked' : !isCamMuted ? 'Cam On' : 'Cam Off'}
                </span>
              </button>

              {/* Screen Share (Host OR Student with Granted Permission) */}
              {canScreenShare && (
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
                  <span className="hidden sm:inline">{isScreenSharing ? 'Stop Sharing' : 'Share Screen'}</span>
                </button>
              )}

              {/* Voice Controller Button (Master Volume & Mic Level Controller) */}
              <button
                onClick={() => setVoiceControllerOpen(true)}
                className={`px-3 py-2 rounded-xl transition cursor-pointer font-bold text-xs flex items-center gap-2 shadow-sm ${
                  voiceControllerOpen
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700'
                }`}
                title="Open Voice & Volume Controller"
              >
                {isMutedAll || masterVolume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-purple-400" />
                )}
                <span className="hidden sm:inline">Voice Control</span>
              </button>

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

              {/* Participants Drawer Toggle */}
              <button
                onClick={() => setActiveSidebar(activeSidebar === 'participants' ? null : 'participants')}
                className={`px-3 py-2 rounded-xl transition cursor-pointer font-bold text-xs flex items-center gap-2 shadow-sm ${
                  activeSidebar === 'participants'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
                title="View Participants & Permissions"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Participants</span>
              </button>

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

              {/* Device Settings (Mic/Camera Selector & Test) */}
              <button
                onClick={() => setSettingsOpen(true)}
                className={`px-3 py-2 rounded-xl transition cursor-pointer font-bold text-xs flex items-center gap-2 shadow-sm ${
                  settingsOpen
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
                title="Audio & Video Device Settings"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
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
        {activeSidebar === 'chat' && (
          <ChatDrawer
            messages={messages}
            inputText={inputText}
            setInputText={setInputText}
            handleSendMessage={handleSendMessage}
            chatBottomRef={chatBottomRef}
            onClose={() => setActiveSidebar(null)}
          />
        )}

        {/* Participants & Voice Control Drawer */}
        {activeSidebar === 'participants' && (
          <ParticipantsDrawer
            participants={participants}
            currentUser={currentUser}
            isHost={isHost}
            call={call}
            participantVolumes={participantVolumes}
            onSetParticipantVolume={handleSetParticipantVolume}
            onClose={() => setActiveSidebar(null)}
          />
        )}
      </div>

      {/* Voice & Master Volume Controller Popover */}
      <VoiceControllerPopover
        isOpen={voiceControllerOpen}
        onClose={() => setVoiceControllerOpen(false)}
        masterVolume={masterVolume}
        onMasterVolumeChange={(vol) => {
          setMasterVolume(vol);
          if (isMutedAll && vol > 0) setIsMutedAll(false);
        }}
        isMutedAll={isMutedAll}
        onToggleMuteAll={() => setIsMutedAll(!isMutedAll)}
        audioLevel={micAudioLevel}
        isMicMuted={isMicMuted}
        onOpenSettings={() => setSettingsOpen(true)}
        speakerDevices={speakerDevices}
        selectedSpeaker={selectedSpeaker}
        onSelectSpeaker={async (deviceId) => {
          if (call?.speaker?.select) {
            await call.speaker.select(deviceId);
            toast.success('Speaker output changed');
          }
        }}
      />

      {/* Audio & Video Device Settings Modal */}
      <DeviceSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        call={call}
        micDevices={micDevices}
        selectedMic={selectedMic}
        camDevices={camDevices}
        selectedCam={selectedCam}
        speakerDevices={speakerDevices}
        selectedSpeaker={selectedSpeaker}
        isMicMuted={isMicMuted}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Standalone / External Stage
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
// 7. Main LiveClassRoom Page Container
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

  const handleSendMessage = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const msgObj = {
      type: 'chat_message',
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      senderName: currentUser?.fullName || (isHost ? 'Instructor' : 'Student'),
      senderRole: isHost ? 'instructor' : 'student',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    if (!msgObj.text) return;
    setMessages((prev) => [...(Array.isArray(prev) ? prev : []), msgObj]);
    setInputText('');
    setTimeout(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

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
              // Auto-enable mic and camera independently so a missing webcam doesn't kill the mic
              callInstance.microphone.enable().catch((micErr) => {
                console.warn('Instructor mic auto-enable info:', micErr?.message);
              });
              callInstance.camera.enable().catch((camErr) => {
                console.warn('Instructor camera auto-enable info:', camErr?.message);
              });
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
