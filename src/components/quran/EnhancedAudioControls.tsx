import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, Loader2, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface EnhancedAudioControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  currentAyah: number | null;
  progress: number;
  duration: number;
  playbackSpeed: number;
  totalAyahs: number;
  isLoading?: boolean;
  isBuffering?: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onStop?: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function EnhancedAudioControls({
  isPlaying,
  isPaused,
  currentAyah,
  progress,
  duration,
  playbackSpeed,
  totalAyahs,
  isLoading,
  isBuffering,
  onPlayPause,
  onPrevious,
  onNext,
  onSeek,
  onSpeedChange,
  onStop,
}: EnhancedAudioControlsProps) {
  const isActive = isPlaying || isPaused;
  const showLoader = isLoading || isBuffering;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 glass-card p-3 sm:p-4 transition-all duration-300 safe-area-inset-bottom',
        isActive ? 'translate-y-0' : 'translate-y-full'
      )}
      role="region"
      aria-label="Audio player controls"
    >
      <div className="container mx-auto max-w-3xl">
        {/* Progress bar */}
        <div className="mb-3 flex items-center gap-2 sm:gap-3">
          <span 
            className="text-xs text-muted-foreground w-10 sm:w-12 text-right tabular-nums"
            aria-label={`Current time: ${formatTime(progress)}`}
          >
            {formatTime(progress)}
          </span>
          <Slider
            value={[progress]}
            max={duration || 100}
            step={0.1}
            onValueChange={([value]) => onSeek(value)}
            className="flex-1"
            aria-label="Seek audio position"
          />
          <span 
            className="text-xs text-muted-foreground w-10 sm:w-12 tabular-nums"
            aria-label={`Duration: ${formatTime(duration)}`}
          >
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2">
          {/* Ayah info */}
          <div className="flex items-center gap-2 min-w-0">
            <div 
              className="ayah-badge text-xs shrink-0"
              aria-label={`Current verse: ${currentAyah || 'none'}`}
            >
              {currentAyah || '-'}
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              of {totalAyahs}
            </span>
            {showLoader && (
              <Loader2 
                className="h-4 w-4 animate-spin text-muted-foreground" 
                aria-label="Loading audio"
              />
            )}
          </div>

          {/* Playback controls */}
          <div 
            className="flex items-center gap-1 sm:gap-2"
            role="group"
            aria-label="Playback controls"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevious}
              disabled={!currentAyah || currentAyah <= 1}
              className="h-9 w-9 sm:h-10 sm:w-10 focus-ring"
              aria-label="Previous verse"
            >
              <SkipBack className="h-4 w-4" aria-hidden="true" />
            </Button>

            <Button
              variant="emerald"
              size="iconLg"
              onClick={onPlayPause}
              className="h-11 w-11 sm:h-12 sm:w-12 focus-ring"
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
              aria-pressed={isPlaying}
            >
              {showLoader ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" aria-hidden="true" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              disabled={!currentAyah || currentAyah >= totalAyahs}
              className="h-9 w-9 sm:h-10 sm:w-10 focus-ring"
              aria-label="Next verse"
            >
              <SkipForward className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Speed control and stop button */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground hidden sm:block" aria-hidden="true" />
            <Select
              value={playbackSpeed.toString()}
              onValueChange={(v) => onSpeedChange(parseFloat(v))}
            >
              <SelectTrigger 
                className="w-16 sm:w-20 h-8 text-xs focus-ring"
                aria-label={`Playback speed: ${playbackSpeed}x`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">0.5x</SelectItem>
                <SelectItem value="0.75">0.75x</SelectItem>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="1.25">1.25x</SelectItem>
                <SelectItem value="1.5">1.5x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
              </SelectContent>
            </Select>
            
            {onStop && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onStop}
                className="h-8 w-8 focus-ring"
                aria-label="Stop playback"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
