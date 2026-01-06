import { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck, Play, Pause, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Scroll into view when playing
  useEffect(() => {
    if (isPlaying && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isPlaying]);

  const handleCopy = async () => {
    const textToCopy = `${ayah.arabicText}\n\n${ayah.englishText || ''}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast({
        title: 'Copied',
        description: 'Verse copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card
      ref={cardRef}
      variant="ayah"
      className={cn(
        'transition-all duration-300 animate-fade-in',
        isPlaying && 'border-gold/50 shadow-gold ring-1 ring-gold/20'
      )}
      role="article"
      aria-label={`Verse ${ayah.ayahNumber}`}
    >
      <CardContent className="p-4 md:p-6">
        {/* Header with Ayah number and actions */}
        <div className="mb-4 flex items-center justify-between">
          <div 
            className="ayah-badge"
            aria-label={`Verse number ${ayah.ayahNumber}`}
          >
            {ayah.ayahNumber}
          </div>
          
          <div className="flex items-center gap-1" role="group" aria-label="Verse actions">
            {/* Copy button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="transition-transform hover:scale-105 active:scale-95 focus-ring"
              aria-label={copied ? 'Copied' : 'Copy verse to clipboard'}
            >
              {copied ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>

            {/* Audio button */}
            {ayah.audioUrl && (
              <Button
                variant={isPlaying ? 'gold' : 'ghost'}
                size="icon"
                onClick={isPlaying ? onPauseAudio : onPlayAudio}
                className="transition-transform hover:scale-105 active:scale-95 focus-ring"
                aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                aria-pressed={isPlaying}
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
              className="transition-transform hover:scale-105 active:scale-95 focus-ring"
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              aria-pressed={isBookmarked}
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
          lang="ar"
          dir="rtl"
        >
          {ayah.arabicText}
        </p>

        {/* Translations */}
        {showTranslations && (
          <div className="space-y-3 border-t border-border/50 pt-4 animate-fade-in">
            {ayah.englishText && (
              <p 
                className="text-sm leading-relaxed text-foreground/80"
                lang="en"
              >
                {ayah.englishText}
              </p>
            )}
            {ayah.urduText && (
              <p
                className="text-sm leading-relaxed text-foreground/70"
                style={{ fontFamily: "'Amiri', serif" }}
                dir="rtl"
                lang="ur"
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
