import { useState, useRef, useCallback, useEffect } from 'react';
import type { Ayah } from '@/lib/schemas';

interface AudioPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  currentAyah: number | null;
  progress: number;
  duration: number;
  playbackSpeed: number;
  isLoading: boolean;
}

export function useAudioPlayer(ayahs: Ayah[], onAyahChange?: (ayahNumber: number) => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isPaused: false,
    currentAyah: null,
    progress: 0,
    duration: 0,
    playbackSpeed: 1,
    isLoading: false,
  });

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'metadata';

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setState((prev) => ({
        ...prev,
        progress: audio.currentTime,
        duration: audio.duration || 0,
      }));
    };

    const handleEnded = () => {
      // Auto-play next ayah
      setState((prev) => {
        if (prev.currentAyah === null) return prev;
        
        const currentIndex = ayahs.findIndex((a) => a.ayahNumber === prev.currentAyah);
        const nextAyah = ayahs[currentIndex + 1];
        
        if (nextAyah) {
          playAyah(nextAyah.ayahNumber);
        } else {
          return { ...prev, isPlaying: false, isPaused: false, currentAyah: null };
        }
        return prev;
      });
    };

    const handleLoadStart = () => {
      setState((prev) => ({ ...prev, isLoading: true }));
    };

    const handleCanPlay = () => {
      setState((prev) => ({ ...prev, isLoading: false }));
    };

    const handleError = () => {
      setState((prev) => ({ ...prev, isLoading: false, isPlaying: false }));
      console.error('Audio playback error');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, [ayahs]);

  const playAyah = useCallback((ayahNumber: number) => {
    const ayah = ayahs.find((a) => a.ayahNumber === ayahNumber);
    if (!ayah?.audioUrl || !audioRef.current) return;

    const audio = audioRef.current;
    audio.src = ayah.audioUrl;
    audio.playbackRate = state.playbackSpeed;
    audio.play().catch(console.error);

    setState((prev) => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      currentAyah: ayahNumber,
    }));

    onAyahChange?.(ayahNumber);
  }, [ayahs, state.playbackSpeed, onAyahChange]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState((prev) => ({ ...prev, isPlaying: false, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(console.error);
    setState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState((prev) => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      currentAyah: null,
      progress: 0,
    }));
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    setState((prev) => ({ ...prev, playbackSpeed: speed }));
  }, []);

  const togglePlayPause = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else if (state.isPaused && state.currentAyah !== null) {
      resume();
    } else if (ayahs.length > 0) {
      playAyah(ayahs[0].ayahNumber);
    }
  }, [state.isPlaying, state.isPaused, state.currentAyah, ayahs, pause, resume, playAyah]);

  return {
    ...state,
    playAyah,
    pause,
    resume,
    stop,
    seek,
    setPlaybackSpeed,
    togglePlayPause,
  };
}
