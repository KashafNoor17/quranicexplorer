import { useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck, Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Ayah } from '@/lib/schemas';

interface AyahCardProps {
  ayah: Ayah;
  isBookmarked: boolean;
  isPlaying: boolean;
  showTranslations: boolean;
  fontSize: number;
  onToggleBookmark: () => void;
  onPlayAudio: () => void;
  onPauseAudio: () => void;
}

export function AyahCard({
  ayah,
  isBookmarked,
  isPlaying,
  showTranslations,
  fontSize,
  onToggleBookmark,
  onPlayAudio,
  onPauseAudio,
}: AyahCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Scroll into view when playing
  useEffect(() => {
    if (isPlaying && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isPlaying]);

  return (
    <Card
      ref={cardRef}
      variant="ayah"
      className={cn(
        'transition-all duration-300',
        isPlaying && 'border-gold/50 shadow-gold ring-1 ring-gold/20'
      )}
    >
      <CardContent className="p-4 md:p-6">
        {/* Header with Ayah number and actions */}
        <div className="mb-4 flex items-center justify-between">
          <div className="ayah-badge">
            {ayah.ayahNumber}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Audio button */}
            {ayah.audioUrl && (
              <Button
                variant={isPlaying ? 'gold' : 'ghost'}
                size="icon"
                onClick={isPlaying ? onPauseAudio : onPlayAudio}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Bookmark button */}
            <Button
              variant={isBookmarked ? 'gold' : 'ghost'}
              size="icon"
              onClick={onToggleBookmark}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Arabic Text */}
        <p
          className="arabic-text mb-4 leading-[2.5] text-foreground"
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: "'Amiri', serif",
          }}
        >
          {ayah.arabicText}
        </p>

        {/* Translations */}
        {showTranslations && (
          <div className="space-y-3 border-t border-border/50 pt-4">
            {ayah.englishText && (
              <p className="text-sm leading-relaxed text-foreground/80">
                {ayah.englishText}
              </p>
            )}
            {ayah.urduText && (
              <p
                className="text-sm leading-relaxed text-foreground/70"
                style={{ fontFamily: "'Amiri', serif" }}
                dir="rtl"
              >
                {ayah.urduText}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
