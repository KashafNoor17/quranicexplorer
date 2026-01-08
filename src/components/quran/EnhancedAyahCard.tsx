import { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck, Play, Pause, Copy, Check, Loader2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { TafsirPanel } from '@/components/quran/TafsirPanel';
import type { Ayah } from '@/lib/schemas';

interface EnhancedAyahCardProps {
  ayah: Ayah;
  isBookmarked: boolean;
  isPlaying: boolean;
  isLoading?: boolean;
  showTranslations: boolean;
  fontSize: number;
  onToggleBookmark: () => void;
  onPlayAudio: () => void;
  onPauseAudio: () => void;
}

export function EnhancedAyahCard({
  ayah,
  isBookmarked,
  isPlaying,
  isLoading,
  showTranslations,
  fontSize,
  onToggleBookmark,
  onPlayAudio,
  onPauseAudio,
}: EnhancedAyahCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const { toast } = useToast();

  // Scroll into view when playing with smooth animation
  useEffect(() => {
    if (isPlaying && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const isInView = rect.top >= 0 && rect.bottom <= window.innerHeight;
      
      if (!isInView) {
        cardRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
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
        'transition-all duration-300',
        isPlaying && 'border-gold/50 shadow-gold ring-2 ring-gold/30 scale-[1.01]'
      )}
      role="article"
      aria-label={`Verse ${ayah.ayahNumber}`}
      aria-current={isPlaying ? 'true' : undefined}
    >
      <CardContent className="p-4 md:p-6">
        {/* Header with Ayah number and actions */}
        <div className="mb-4 flex items-center justify-between">
          <div 
            className={cn(
              'ayah-badge transition-all duration-300',
              isPlaying && 'ring-2 ring-gold/50 animate-pulse-soft'
            )}
            aria-label={`Verse number ${ayah.ayahNumber}`}
          >
            {ayah.ayahNumber}
          </div>
          
          <div className="flex items-center gap-1" role="group" aria-label="Verse actions">
            {/* Tafsir button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTafsirOpen(true)}
              className="h-9 w-9 sm:h-10 sm:w-10 transition-transform hover:scale-105 active:scale-95 focus-ring"
              aria-label="View tafsir commentary"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </Button>

            {/* Copy button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-9 w-9 sm:h-10 sm:w-10 transition-transform hover:scale-105 active:scale-95 focus-ring"
              aria-label={copied ? 'Copied' : 'Copy verse to clipboard'}
            >
              {copied ? (
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>

            {/* Audio button */}
            {ayah.audioUrl && (
              <Button
                variant={isPlaying ? 'gold' : 'ghost'}
                size="icon"
                onClick={isPlaying ? onPauseAudio : onPlayAudio}
                disabled={isLoading}
                className={cn(
                  'h-9 w-9 sm:h-10 sm:w-10 transition-transform hover:scale-105 active:scale-95 focus-ring',
                  isPlaying && 'animate-pulse-soft'
                )}
                aria-label={isLoading ? 'Loading audio' : isPlaying ? 'Pause audio' : 'Play audio'}
                aria-pressed={isPlaying}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : isPlaying ? (
                  <Pause className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Play className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            )}

            {/* Bookmark button */}
            <Button
              variant={isBookmarked ? 'gold' : 'ghost'}
              size="icon"
              onClick={onToggleBookmark}
              className="h-9 w-9 sm:h-10 sm:w-10 transition-transform hover:scale-105 active:scale-95 focus-ring"
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              aria-pressed={isBookmarked}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Bookmark className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {/* Arabic Text - with proper RTL and line-breaking */}
        <p
          className={cn(
            'arabic-text mb-4 leading-[2.5] text-foreground select-text',
            isPlaying && 'text-gold'
          )}
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: "'Amiri', serif",
            wordBreak: 'keep-all',
            overflowWrap: 'normal',
          }}
          lang="ar"
          dir="rtl"
        >
          {ayah.arabicText}
        </p>

        {/* Translations - synchronized with Arabic */}
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
                style={{ 
                  fontFamily: "'Amiri', serif",
                  wordBreak: 'keep-all',
                }}
                dir="rtl"
                lang="ur"
              >
                {ayah.urduText}
              </p>
            )}
          </div>
        )}

        {/* Tafsir Panel */}
        <TafsirPanel
          open={tafsirOpen}
          onOpenChange={setTafsirOpen}
          surahNumber={ayah.surahNumber}
          ayahNumber={ayah.ayahNumber}
          arabicText={ayah.arabicText}
        />
      </CardContent>
    </Card>
  );
}
