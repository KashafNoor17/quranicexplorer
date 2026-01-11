import { useState, useEffect } from 'react';
import { useDailyAyah, surahData, getDailyAyahIndex } from '@/hooks/useQuran';
import { dailyAyahs } from '@/lib/quranData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Share2, RefreshCw, Copy, Check, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function EnhancedDailyAyah() {
  const { data: ayah, isLoading, error, refetch, isFetching } = useDailyAyah();
  const dailyData = dailyAyahs[getDailyAyahIndex()];
  const surah = surahData.find(s => s.number === dailyData.surah);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Trigger entrance animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Trigger content animation after card appears
  useEffect(() => {
    if (!isLoading && ayah) {
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, ayah]);

  const handleShare = async () => {
    const shareText = ayah 
      ? `"${ayah.englishText}"\n\n- ${surah?.englishName} ${ayah.ayahNumber}\n\n${ayah.arabicText}`
      : '';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Daily Ayah from Quran Explorer',
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    const copyText = ayah 
      ? `${ayah.arabicText}\n\n"${ayah.englishText}"\n\n- ${surah?.englishName} ${ayah.ayahNumber}`
      : '';
    
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      toast({
        title: 'Copied to clipboard',
        description: 'Ayah copied successfully',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = () => {
    setIsAnimating(true);
    setShowContent(false);
    refetch();
    setTimeout(() => {
      setIsAnimating(false);
      setShowContent(true);
    }, 800);
  };

  if (error) {
    return null;
  }

  return (
    <Card 
      variant="gold" 
      className={cn(
        'relative overflow-hidden transition-all duration-700 ease-out',
        'transform-gpu',
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95',
        isAnimating && 'animate-gold-pulse'
      )}
      role="article"
      aria-label="Daily Ayah - Verse of the day"
    >
      {/* Animated gradient border */}
      <div 
        className="absolute inset-0 rounded-lg opacity-30 animate-border-glow"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(var(--gold)), transparent)',
          backgroundSize: '200% 100%',
        }}
        aria-hidden="true" 
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gold/40 animate-float-particle"
            style={{
              left: `${15 + i * 15}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Decorative corner stars */}
      <div className="absolute top-3 right-3 opacity-20" aria-hidden="true">
        <Star className="h-4 w-4 text-gold animate-twinkle" style={{ animationDelay: '0s' }} />
      </div>
      <div className="absolute bottom-3 left-3 opacity-20" aria-hidden="true">
        <Star className="h-3 w-3 text-gold animate-twinkle" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Decorative background pattern */}
      <div 
        className="absolute inset-0 opacity-5 geometric-pattern animate-pattern-shift" 
        aria-hidden="true" 
      />
      
      <CardContent className="relative p-6 md:p-8">
        {/* Header */}
        <div className={cn(
          'mb-6 flex items-center justify-between transition-all duration-500',
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
        )}>
          <div className="flex items-center gap-3">
            <div 
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 animate-glow-pulse"
              aria-hidden="true"
            >
              <div className="absolute inset-0 rounded-full bg-gold/20 animate-ping-slow" />
              <Sparkles className="h-5 w-5 text-gold animate-sparkle" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gold tracking-wide">Daily Ayah</h3>
              <p className="text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
                {dailyData.theme}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div 
            className={cn(
              'flex items-center gap-1 transition-all duration-500',
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
            )} 
            style={{ transitionDelay: '0.2s' }}
            role="group" 
            aria-label="Ayah actions"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isFetching}
              className="h-9 w-9 rounded-full transition-all duration-300 hover:scale-110 hover:bg-gold/20 focus-ring"
              aria-label="Refresh ayah"
            >
              <RefreshCw 
                className={cn(
                  'h-4 w-4 transition-transform',
                  isFetching && 'animate-spin'
                )} 
                aria-hidden="true"
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-9 w-9 rounded-full transition-all duration-300 hover:scale-110 hover:bg-gold/20 focus-ring"
              aria-label={copied ? 'Copied' : 'Copy ayah'}
            >
              <span className={cn(
                'transition-all duration-300',
                copied ? 'scale-100' : 'scale-100'
              )}>
                {copied ? (
                  <Check className="h-4 w-4 text-primary animate-bounce-in" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-9 w-9 rounded-full transition-all duration-300 hover:scale-110 hover:bg-gold/20 focus-ring"
              aria-label="Share ayah"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4" role="status" aria-label="Loading daily ayah">
            <Skeleton className="h-12 w-full animate-shimmer" />
            <Skeleton className="h-6 w-3/4 animate-shimmer" style={{ animationDelay: '0.1s' }} />
            <Skeleton className="h-4 w-1/2 animate-shimmer" style={{ animationDelay: '0.2s' }} />
            <span className="sr-only">Loading daily ayah...</span>
          </div>
        ) : ayah ? (
          <div className="space-y-6">
            {/* Arabic Text */}
            <p 
              className={cn(
                'arabic-text text-2xl md:text-3xl leading-[2.5] transition-all duration-700',
                showContent 
                  ? 'opacity-100 translate-y-0 blur-0' 
                  : 'opacity-0 translate-y-6 blur-sm'
              )}
              style={{ 
                fontFamily: "'Amiri', serif",
                transitionDelay: '0.1s'
              }}
              lang="ar"
              dir="rtl"
            >
              {ayah.arabicText}
            </p>

            {/* English Translation */}
            {ayah.englishText && (
              <p 
                className={cn(
                  'text-base md:text-lg text-foreground/90 leading-relaxed transition-all duration-700',
                  showContent 
                    ? 'opacity-100 translate-y-0 blur-0' 
                    : 'opacity-0 translate-y-6 blur-sm'
                )}
                style={{ transitionDelay: '0.3s' }}
                lang="en"
              >
                <span className="text-gold/60 text-xl mr-1">"</span>
                {ayah.englishText}
                <span className="text-gold/60 text-xl ml-1">"</span>
              </p>
            )}

            {/* Surah Reference */}
            <div 
              className={cn(
                'flex items-center gap-2 text-sm text-muted-foreground transition-all duration-700',
                showContent 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              )}
              style={{ transitionDelay: '0.5s' }}
              aria-label={`From ${surah?.englishName}, verse ${ayah.ayahNumber}`}
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
              <span className="font-arabic px-3" lang="ar">{surah?.name}</span>
              <span aria-hidden="true" className="text-gold">•</span>
              <span className="px-3">{surah?.englishName} {ayah.ayahNumber}</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            </div>
          </div>
        ) : null}
      </CardContent>

      {/* Bottom decorative glow */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent animate-pulse"
        aria-hidden="true"
      />
    </Card>
  );
}
