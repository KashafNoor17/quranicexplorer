import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface AudioControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  currentAyah: number | null;
  progress: number;
  duration: number;
  playbackSpeed: number;
  totalAyahs: number;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioControls({
  isPlaying,
  isPaused,
  currentAyah,
  progress,
  duration,
  playbackSpeed,
  totalAyahs,
  onPlayPause,
  onPrevious,
  onNext,
  onSeek,
  onSpeedChange,
}: AudioControlsProps) {
  const isActive = isPlaying || isPaused;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 glass-card p-4 transition-all duration-300',
        isActive ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <div className="container mx-auto max-w-3xl">
        {/* Progress bar */}
        <div className="mb-3 flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-12 text-right">
            {formatTime(progress)}
          </span>
          <Slider
            value={[progress]}
            max={duration || 100}
            step={0.1}
            onValueChange={([value]) => onSeek(value)}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-12">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Ayah info */}
          <div className="flex items-center gap-2">
            <div className="ayah-badge text-xs">
              {currentAyah || '-'}
            </div>
            <span className="text-sm text-muted-foreground">
              of {totalAyahs}
            </span>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevious}
              disabled={!currentAyah || currentAyah <= 1}
              aria-label="Previous ayah"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="emerald"
              size="iconLg"
              onClick={onPlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              disabled={!currentAyah || currentAyah >= totalAyahs}
              aria-label="Next ayah"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Speed control */}
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Select
              value={playbackSpeed.toString()}
              onValueChange={(v) => onSpeedChange(parseFloat(v))}
            >
              <SelectTrigger className="w-20 h-8">
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
          </div>
        </div>
      </div>
    </div>
  );
}
