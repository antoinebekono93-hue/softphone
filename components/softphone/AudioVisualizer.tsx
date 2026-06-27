"use client";

import { useEffect, useRef, useState } from "react";

interface AudioVisualizerProps {
  isActive: boolean;
  stream?: MediaStream | null;
}

export function AudioVisualizer({ isActive, stream }: AudioVisualizerProps) {
  const [volumes, setVolumes] = useState<number[]>([0.2, 0.4, 0.6, 0.8, 1]);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isActive || !stream) {
      // Reset or show idle animation
      setVolumes([0.2, 0.4, 0.6, 0.8, 1]);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      const updateVolume = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArrayRef.current[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(Math.max(average / 128, 0.2), 1.5); // Normalize between 0.2 and 1.5

        // Create 5 volume levels based on the average for the concentric rings
        setVolumes([
          Math.min(normalized * 1.5, 2),
          Math.min(normalized * 1.3, 1.8),
          Math.min(normalized * 1.1, 1.6),
          Math.min(normalized * 0.9, 1.4),
          Math.min(normalized * 0.7, 1.2),
        ]);

        animationRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err) {
      console.error("[AudioVisualizer] Error setting up audio context:", err);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, [isActive, stream]);

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {volumes.map((vol, i) => (
        <div
          key={i}
          className={`absolute rounded-full border border-[var(--border-subtle)] transition-transform duration-75 ease-out ${
            isActive ? "" : "animate-[pulse_4s_ease-in-out_infinite]"
          }`}
          style={{
            width: `${100 + i * 20}%`,
            height: `${100 + i * 20}%`,
            transform: `scale(${isActive ? vol : 1 + i * 0.1})`,
            opacity: Math.max(0.1, 0.8 - i * 0.15),
            animationDelay: `${i * 0.5}s`,
            background: i === 0 ? "rgba(134, 134, 139, 0.05)" : "none"
          }}
        />
      ))}
      {/* Center dot/icon area */}
      <div className="absolute w-24 h-24 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center z-10 shadow-sm">
        <div className={`w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center ${isActive ? 'animate-pulse' : ''}`}>
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
        </div>
      </div>
    </div>
  );
}
