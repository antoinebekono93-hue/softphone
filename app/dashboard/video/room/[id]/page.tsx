"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Settings, Users, MonitorUp, Loader2, MessageSquare } from "lucide-react";

export default function RoomParticipantView() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    // Generate Join Token
    const joinRoom = async () => {
      try {
        const res = await fetch(`/api/video/rooms/${roomId}/token`, { method: "POST" });
        if (res.ok) {
          const json = await res.json();
          setToken(json.data?.token || "mock_token_success");
        }
      } catch (e) {
        console.error("Token error:", e);
      } finally {
        setLoading(false);
      }
    };
    joinRoom();
  }, [roomId]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#0B1120]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-medium text-white">Connexion à la salle...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#0B1120] text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <VideoIcon className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Salle de Visioconférence (Test)</h1>
            <p className="text-xs text-white/50 font-mono flex items-center gap-2">
              ID: {roomId}
              {token && <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold">Token Généré</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2 border border-white/10">
          <Users className="w-4 h-4 text-white/70" />
          <span className="text-sm font-medium">3 Participants</span>
        </div>
      </div>

      {/* Main Video Grid */}
      <div className="flex-1 p-6 flex gap-6 overflow-hidden">
        {/* Main Speaker */}
        <div className="flex-1 bg-black/40 rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center group shadow-2xl">
          {/* Simulated Remote Video */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 to-cyan-900/40 animate-pulse"></div>
          <div className="z-10 text-center">
            <div className="w-24 h-24 rounded-full bg-violet-500/20 flex items-center justify-center border-2 border-violet-500/50 mx-auto mb-4 backdrop-blur-md">
              <span className="text-3xl font-bold text-violet-200">JD</span>
            </div>
            <h3 className="text-lg font-medium">Jane Doe (Présentatrice)</h3>
            <p className="text-sm text-white/50">Audio connecté via WebRTC</p>
          </div>
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-medium">Jane Doe</span>
          </div>
        </div>

        {/* Side Panel (Self + Others) */}
        <div className="w-72 flex flex-col gap-4">
          {/* Self View */}
          <div className="h-48 bg-gray-900 rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center">
            {camOn ? (
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/30 to-blue-900/30"></div>
            ) : (
              <VideoOff className="w-8 h-8 text-white/30" />
            )}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10 flex items-center gap-2">
              {!micOn && <MicOff className="w-3 h-3 text-rose-500" />}
              <span className="text-xs font-medium">Vous (Local)</span>
            </div>
          </div>

          {/* Other Participant */}
          <div className="h-48 bg-gray-900 rounded-xl border border-white/10 relative flex items-center justify-center overflow-hidden">
             <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-500/50">
                <span className="text-sm font-bold text-blue-200">MS</span>
             </div>
             <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10 flex items-center gap-2">
              <MicOff className="w-3 h-3 text-rose-500" />
              <span className="text-xs font-medium">Marc Smith</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="h-20 bg-black/40 border-t border-white/10 flex items-center justify-center gap-4 px-6">
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

        <button className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all ml-4">
          <MonitorUp className="w-5 h-5" />
        </button>

        <button className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all">
          <MessageSquare className="w-5 h-5" />
        </button>
        
        <button className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all">
          <Settings className="w-5 h-5" />
        </button>

        <button 
          onClick={() => router.push('/dashboard/video')}
          className="w-16 h-12 rounded-full flex items-center justify-center bg-rose-500 hover:bg-rose-600 ml-4 shadow-[0_0_15px_rgba(244,63,94,0.5)] transition-all"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
