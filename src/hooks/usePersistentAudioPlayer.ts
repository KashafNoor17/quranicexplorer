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
  isBuffering: boolean;
}

const PLAYBACK_SPEED_KEY = 'quran-playback-speed';

// Get persisted playback speed
function getPersistedSpeed(): number {
  try {
    const stored = localStorage.getItem(PLAYBACK_SPEED_KEY);
    if (stored) {
      const speed = parseFloat(stored);
      if (speed >= 0.5 && speed <= 2) {
        return speed;
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return 1;
}

// Save playback speed to localStorage
function persistSpeed(speed: number): void {
  try {
    localStorage.setItem(PLAYBACK_SPEED_KEY, speed.toString());
  } catch {
    // Ignore localStorage errors
  }
}

export function usePersistentAudioPlayer(
  ayahs: Ayah[], 
  onAyahChange?: (ayahNumber: number) => void
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isPaused: false,
    currentAyah: null,
    progress: 0,
    duration: 0,
    playbackSpeed: getPersistedSpeed(), // Load from localStorage
    isLoading: false,
    isBuffering: false,
  });

  // Preload next ayah audio for smoother playback
  const preloadRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
    preloadRef.current = new Audio();
    preloadRef.current.preload = 'metadata';

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setState((prev) => ({
        ...prev,
        progress: audio.currentTime,
        duration: audio.duration || 0,
        isBuffering: false,
      }));
    };

    const handleEnded = () => {
      // Auto-play next ayah with preserved speed
      setState((prev) => {
        if (prev.currentAyah === null) return prev;
        
        const currentIndex = ayahs.findIndex((a) => a.ayahNumber === prev.currentAyah);
        const nextAyah = ayahs[currentIndex + 1];
        
        if (nextAyah) {
          // Play next ayah (speed is already persisted)
          playAyahInternal(nextAyah.ayahNumber, prev.playbackSpeed);
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

    const handleWaiting = () => {
      setState((prev) => ({ ...prev, isBuffering: true }));
    };

    const handlePlaying = () => {
      setState((prev) => ({ ...prev, isBuffering: false, isLoading: false }));
    };

    const handleError = () => {
      setState((prev) => ({ ...prev, isLoading: false, isPlaying: false, isBuffering: false }));
      console.error('Audio playback error');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, [ayahs]);

  // Preload next ayah when current ayah changes
  useEffect(() => {
    if (state.currentAyah === null) return;
    
    const currentIndex = ayahs.findIndex((a) => a.ayahNumber === state.currentAyah);
    const nextAyah = ayahs[currentIndex + 1];
    
    if (nextAyah?.audioUrl && preloadRef.current) {
      preloadRef.current.src = nextAyah.audioUrl;
    }
  }, [state.currentAyah, ayahs]);

  const playAyahInternal = useCallback((ayahNumber: number, speed: number) => {
    const ayah = ayahs.find((a) => a.ayahNumber === ayahNumber);
    if (!ayah?.audioUrl || !audioRef.current) return;

    const audio = audioRef.current;
    audio.src = ayah.audioUrl;
    audio.playbackRate = speed; // Use the persisted speed
    audio.play().catch(console.error);

    setState((prev) => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      currentAyah: ayahNumber,
    }));

    onAyahChange?.(ayahNumber);
  }, [ayahs, onAyahChange]);

  const playAyah = useCallback((ayahNumber: number) => {
    playAyahInternal(ayahNumber, state.playbackSpeed);
  }, [playAyahInternal, state.playbackSpeed]);

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
    // Persist speed to localStorage
    persistSpeed(speed);
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
