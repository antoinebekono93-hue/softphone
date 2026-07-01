"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Settings, Users, MonitorUp, Loader2, MessageSquare, Send, X } from "lucide-react";
import { initialize } from "@telnyx/video";
import type { Room } from "@telnyx/video";

export default function RoomParticipantView() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // Telnyx Video state
  const [room, setRoom] = useState<Room | null>(null);
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, { participantId: string, type: string, stream: MediaStream }>>(new Map());
  const [participantsCount, setParticipantsCount] = useState(1);

  // Screen Share state
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{id: string, sender: string, text: string, time: string, isMe: boolean}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Refs for video elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const localScreenRef = useRef<HTMLVideoElement>(null);

  // 1. Fetch Token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/video/rooms/${roomId}/token`, { method: "POST" });
        if (res.ok) {
          const json = await res.json();
          setToken(json.data?.token);
        } else {
          setError("Failed to generate join token");
        }
      } catch (e) {
        console.error("Token error:", e);
        setError("Network error fetching token");
      }
    };
    fetchToken();
  }, [roomId]);

  // 2. Initialize Telnyx Room
  useEffect(() => {
    if (!token) return;

    let currentRoom: Room;
    let localStreamRef: MediaStream | null = null;

    const initRoom = async () => {
      try {
        localStreamRef = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setLocalMediaStream(localStreamRef);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef;
        }

        currentRoom = await initialize({
          roomId,
          clientToken: token,
          context: JSON.stringify({ id: Math.random().toString(36).substring(7), name: 'Utilisateur' }),
          enableMessages: true
        });

        currentRoom.on('stream_published', (participantId, key) => {
          currentRoom.addSubscription(participantId, key, { audio: true, video: true });
        });

        currentRoom.on('subscription_started', (participantId, key) => {
          const stream = currentRoom.getParticipantStream(participantId, key);
          if (stream) {
            const mediaStream = new MediaStream();
            if (stream.audioTrack) mediaStream.addTrack(stream.audioTrack);
            if (stream.videoTrack) mediaStream.addTrack(stream.videoTrack);
            
            setRemoteStreams(prev => {
              const newMap = new Map(prev);
              newMap.set(`${participantId}-${key}`, { participantId, type: key, stream: mediaStream });
              return newMap;
            });
          }
        });

        currentRoom.on('subscription_ended', (participantId, key) => {
          setRemoteStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(`${participantId}-${key}`);
            return newMap;
          });
        });

        currentRoom.on('participant_joined', () => {
          setParticipantsCount(prev => prev + 1);
        });

        currentRoom.on('participant_left', () => {
          setParticipantsCount(prev => Math.max(1, prev - 1));
        });

        currentRoom.on('message_received', (participantId, message, recipients) => {
           setChatMessages(prev => [...prev, {
             id: Math.random().toString(36).substring(7),
             sender: participantId.substring(0, 5) || 'Participant', // Usually would lookup in context
             text: message.payload || JSON.stringify(message),
             time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
             isMe: false
           }]);
        });

        await currentRoom.connect();
        setRoom(currentRoom);

        await currentRoom.addStream('camera', {
          audio: localStreamRef.getAudioTracks()[0],
          video: localStreamRef.getVideoTracks()[0]
        });

        setLoading(false);

      } catch (e: any) {
        console.error("Telnyx Room Error:", e);
        setError(e.message || "Failed to connect to room");
        setLoading(false);
      }
    };

    initRoom();

    return () => {
      if (currentRoom) {
        currentRoom.disconnect();
      }
      if (localStreamRef) {
        localStreamRef.getTracks().forEach(track => track.stop());
      }
    };
  }, [token]);

  // Handle AV toggles
  useEffect(() => {
    if (localMediaStream) {
      localMediaStream.getAudioTracks().forEach(t => t.enabled = micOn);
    }
  }, [micOn, localMediaStream]);

  useEffect(() => {
    if (localMediaStream) {
      localMediaStream.getVideoTracks().forEach(t => t.enabled = camOn);
    }
  }, [camOn, localMediaStream]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen]);

  const handleDisconnect = () => {
    if (room) {
      room.disconnect();
    }
    if (localScreenStream) {
      localScreenStream.getTracks().forEach(t => t.stop());
    }
    router.push('/dashboard/video');
  };

  const toggleScreenShare = async () => {
    if (!room) return;
    
    if (isScreenSharing) {
      // Stop screen share
      if (localScreenStream) {
        localScreenStream.getTracks().forEach(t => t.stop());
      }
      await room.removeStream('screen');
      setLocalScreenStream(null);
      setIsScreenSharing(false);
    } else {
      // Start screen share
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setLocalScreenStream(stream);
        setIsScreenSharing(true);
        
        // Listen for browser UI stop button
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = async () => {
            await room.removeStream('screen');
            setLocalScreenStream(null);
            setIsScreenSharing(false);
          };
        }

        await room.addStream('screen', {
          video: stream.getVideoTracks()[0],
          audio: stream.getAudioTracks()[0]
        });
      } catch (err) {
        console.error("Screen share failed", err);
        setIsScreenSharing(false);
      }
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || !room) return;
    
    const text = chatInput.trim();
    setChatInput("");
    
    // UI optimistic update
    setChatMessages(prev => [...prev, {
       id: Math.random().toString(36).substring(7),
       sender: 'Vous',
       text: text,
       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
       isMe: true
    }]);

    try {
      await room.sendMessage({ type: 'text', payload: text });
    } catch (err) {
      console.error("Message send failed:", err);
    }
  };

  if (error) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#0B1120]">
        <div className="text-center text-rose-500">
          <PhoneOff className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-medium">Erreur de connexion</h2>
          <p className="mt-2 text-sm text-white/70">{error}</p>
          <button 
            onClick={() => router.push('/dashboard/video')}
            className="mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#0B1120]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-medium text-white">Connexion à la salle WebRTC...</h2>
        </div>
      </div>
    );
  }

  const streamsList = Array.from(remoteStreams.values());
  // Find a screen share stream if one exists to make it main, else use first remote camera
  let mainStream = streamsList.find(s => s.type === 'screen');
  if (!mainStream && streamsList.length > 0) {
    mainStream = streamsList[0];
  }
  // Exclude main stream from the side grid
  const sideStreams = streamsList.filter(s => s !== mainStream);

  // If local user is screen sharing, the local screen goes to main if no remote screen exists
  const isLocalScreenMain = isScreenSharing && !streamsList.find(s => s.type === 'screen');

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#0B1120] text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <VideoIcon className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Visioconférence Sécurisée</h1>
            <p className="text-xs text-white/50 font-mono flex items-center gap-2">
              ID: {roomId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2 border border-white/10">
          <Users className="w-4 h-4 text-white/70" />
          <span className="text-sm font-medium">{participantsCount} {participantsCount > 1 ? 'Participants' : 'Participant'}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
          {/* Main Speaker or Screen Share */}
          <div className="flex-1 bg-black/40 rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center group shadow-2xl">
            {isLocalScreenMain ? (
              <video 
                ref={(el) => {
                  if (el && localScreenStream && el.srcObject !== localScreenStream) {
                    el.srcObject = localScreenStream;
                  }
                }}
                autoPlay 
                playsInline
                muted
                className="w-full h-full object-contain"
              />
            ) : mainStream ? (
              <video 
                ref={(el) => {
                  if (el && el.srcObject !== mainStream?.stream) {
                    el.srcObject = mainStream!.stream;
                  }
                }}
                autoPlay 
                playsInline
                className={`w-full h-full ${mainStream.type === 'screen' ? 'object-contain' : 'object-cover'}`}
              />
            ) : (
              <div className="text-center text-white/50">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>En attente d'autres participants...</p>
              </div>
            )}
            
            {(mainStream || isLocalScreenMain) && (
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${(mainStream?.type === 'screen' || isLocalScreenMain) ? 'bg-cyan-500' : 'bg-emerald-500'} animate-pulse`}></div>
                <span className="text-xs font-medium">
                  {isLocalScreenMain ? "Votre Écran" : mainStream?.type === 'screen' ? `Écran partagé (${mainStream.participantId.substring(0,5)})` : "Participant Distant"}
                </span>
              </div>
            )}
          </div>

          {/* Horizontal Side Panel for participants (bottom row) */}
          <div className="h-48 flex gap-4 overflow-x-auto shrink-0 hide-scrollbar pb-2">
            {/* Self View */}
            <div className="w-64 shrink-0 bg-gray-900 rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center">
              {camOn ? (
                <video 
                  ref={localVideoRef}
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover mirror" 
                  style={{ transform: "scaleX(-1)" }}
                />
              ) : (
                <VideoOff className="w-8 h-8 text-white/30" />
              )}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10 flex items-center gap-2">
                {!micOn && <MicOff className="w-3 h-3 text-rose-500" />}
                <span className="text-xs font-medium">Vous (Local)</span>
              </div>
            </div>

            {/* Other Participants */}
            {sideStreams.map((info) => (
              <div key={`${info.participantId}-${info.type}`} className="w-64 shrink-0 bg-gray-900 rounded-xl border border-white/10 relative flex items-center justify-center overflow-hidden">
                 <video 
                   ref={(el) => {
                     remoteVideoRefs.current[`${info.participantId}-${info.type}`] = el;
                     if (el && el.srcObject !== info.stream) {
                       el.srcObject = info.stream;
                     }
                   }}
                   autoPlay 
                   playsInline
                   className="w-full h-full object-cover"
                 />
                 <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10 flex items-center gap-2">
                  <span className="text-xs font-medium">Participant {info.participantId.substring(0, 5)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Sidebar */}
        {chatOpen && (
          <div className="w-80 bg-black/20 border-l border-white/10 flex flex-col shrink-0">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                Chat de la salle
              </h3>
              <button onClick={() => setChatOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-white/30 text-sm mt-10">
                  Aucun message pour le moment.<br/>Soyez le premier à écrire !
                </div>
              ) : (
                chatMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                    <div className="text-[10px] text-white/40 mb-1 flex items-center gap-2">
                      <span>{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <div className={`px-3 py-2 rounded-xl text-sm ${msg.isMe ? 'bg-cyan-500/20 text-cyan-50 border border-cyan-500/30' : 'bg-white/10 text-white/90 border border-white/5'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="p-4 border-t border-white/10 bg-black/40">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Écrire un message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="h-20 bg-black/40 border-t border-white/10 flex items-center justify-center gap-4 px-6 shrink-0 z-10">
        <button 
          onClick={() => setMicOn(!micOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${micOn ? 'bg-white/10 hover:bg-white/20' : 'bg-rose-500 hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.4)]'}`}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button 
          onClick={() => setCamOn(!camOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${camOn ? 'bg-white/10 hover:bg-white/20' : 'bg-rose-500 hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.4)]'}`}
        >
          {camOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button 
          onClick={toggleScreenShare}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ml-4 ${isScreenSharing ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:bg-cyan-400' : 'bg-white/10 hover:bg-white/20'}`}
        >
          <MonitorUp className="w-5 h-5" />
        </button>

        <button 
          onClick={() => setChatOpen(!chatOpen)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${chatOpen ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-white/10 hover:bg-white/20'}`}
        >
          <MessageSquare className="w-5 h-5" />
        </button>
        
        <button className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all">
          <Settings className="w-5 h-5" />
        </button>

        <button 
          onClick={handleDisconnect}
          className="w-16 h-12 rounded-full flex items-center justify-center bg-rose-500 hover:bg-rose-600 ml-4 shadow-[0_0_15px_rgba(244,63,94,0.5)] transition-all"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
