import { useState } from 'react';
import { useDailyAyah, surahData, getDailyAyahIndex } from '@/hooks/useQuran';
import { dailyAyahs } from '@/lib/quranData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Share2, RefreshCw, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function EnhancedDailyAyah() {
  const { data: ayah, isLoading, error, refetch, isFetching } = useDailyAyah();
  const dailyData = dailyAyahs[getDailyAyahIndex()];
  const surah = surahData.find(s => s.number === dailyData.surah);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

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
        // User cancelled or share failed
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
    refetch();
    setTimeout(() => setIsAnimating(false), 600);
  };

  if (error) {
    return null;
  }

  return (
    <Card 
      variant="gold" 
      className={cn(
        'relative overflow-hidden transition-all duration-500',
        isAnimating && 'animate-pulse-soft'
      )}
      role="article"
      aria-label="Daily Ayah - Verse of the day"
    >
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-5 geometric-pattern" aria-hidden="true" />
      
      <CardContent className="relative p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20"
              aria-hidden="true"
            >
              <Sparkles className="h-4 w-4 text-gold" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gold">Daily Ayah</h3>
              <p className="text-xs text-muted-foreground">{dailyData.theme}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1" role="group" aria-label="Ayah actions">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isFetching}
              className="h-8 w-8 transition-transform hover:scale-105 focus-ring"
              aria-label="Refresh ayah"
            >
              <RefreshCw 
                className={cn(
                  'h-4 w-4',
                  isFetching && 'animate-spin'
                )} 
                aria-hidden="true"
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-8 w-8 transition-transform hover:scale-105 focus-ring"
              aria-label={copied ? 'Copied' : 'Copy ayah'}
            >
              {copied ? (
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-8 w-8 transition-transform hover:scale-105 focus-ring"
              aria-label="Share ayah"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4" role="status" aria-label="Loading daily ayah">
            <Skeleton className="h-12 w-full loading-shimmer" />
            <Skeleton className="h-6 w-3/4 loading-shimmer" />
            <Skeleton className="h-4 w-1/2 loading-shimmer" />
            <span className="sr-only">Loading daily ayah...</span>
          </div>
        ) : ayah ? (
          <div className={cn(
            'space-y-6',
            isAnimating ? 'animate-fade-in' : ''
          )}>
            {/* Arabic Text */}
            <p 
              className="arabic-text text-2xl md:text-3xl leading-[2.5] animate-fade-in-up"
              style={{ fontFamily: "'Amiri', serif" }}
              lang="ar"
              dir="rtl"
            >
              {ayah.arabicText}
            </p>

            {/* English Translation */}
            {ayah.englishText && (
              <p 
                className="text-base md:text-lg text-foreground/90 leading-relaxed animate-fade-in-up animation-delay-200"
                lang="en"
              >
                "{ayah.englishText}"
              </p>
            )}

            {/* Surah Reference */}
            <div 
              className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in animation-delay-300"
              aria-label={`From ${surah?.englishName}, verse ${ayah.ayahNumber}`}
            >
              <span className="font-arabic" lang="ar">{surah?.name}</span>
              <span aria-hidden="true">•</span>
              <span>{surah?.englishName} {ayah.ayahNumber}</span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
