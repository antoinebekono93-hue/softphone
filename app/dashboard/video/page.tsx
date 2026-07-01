"use client";

import { useState, useEffect } from "react";
import { Video, Plus, Users, Key, Loader2, Play } from "lucide-react";
import Link from "next/link";

export default function VideoDashboard() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/video/rooms");
      if (res.ok) {
        const json = await res.json();
        setRooms(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    setCreating(true);
    try {
      await fetch("/api/video/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unique_name: `visio-${Math.random().toString(36).substring(7)}`,
          max_participants: 10,
          enable_recording: false
        })
      });
      fetchRooms();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)] flex items-center gap-3">
            <Video className="w-8 h-8 text-cyan-500" /> Vidéo Programmable (Salles)
          </h1>
          <p className="text-[var(--text-secondary)]">
            Gérez vos salles de visioconférence WebRTC Telnyx.
          </p>
        </div>
        <button 
          onClick={handleCreateRoom}
          disabled={creating}
          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50"
        >
          {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          Créer une Salle
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--bg-surface-solid)]/30 border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-6 py-4 font-medium">Nom de la Salle</th>
                <th className="px-6 py-4 font-medium">ID Telnyx</th>
                <th className="px-6 py-4 font-medium">Création</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Chargement des salles...
                  </td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                    <Video className="w-12 h-12 text-[var(--border-subtle)] mx-auto mb-3" />
                    Aucune salle vidéo trouvée.
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[var(--text-primary)]">{room.unique_name}</div>
                      <div className="text-[var(--text-secondary)] text-xs mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Max: {room.max_participants}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[var(--text-secondary)]">
                      {room.id}
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--text-secondary)]">
                      {new Date(room.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/dashboard/video/room/${room.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 rounded-md font-medium text-sm transition-colors"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Rejoindre (Test)
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
