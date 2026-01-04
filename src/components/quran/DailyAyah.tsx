import { useDailyAyah, surahData, getDailyAyahIndex } from '@/hooks/useQuran';
import { dailyAyahs } from '@/lib/quranData';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';

export function DailyAyah() {
  const { data: ayah, isLoading, error } = useDailyAyah();
  const dailyData = dailyAyahs[getDailyAyahIndex()];
  const surah = surahData.find(s => s.number === dailyData.surah);

  if (error) {
    return null;
  }

  return (
    <Card 
      variant="gold" 
      className="relative overflow-hidden animate-gold-pulse"
    >
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-5 geometric-pattern" />
      
      <CardContent className="relative p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20">
            <Sparkles className="h-4 w-4 text-gold" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gold">Daily Ayah</h3>
            <p className="text-xs text-muted-foreground">{dailyData.theme}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : ayah ? (
          <div className="space-y-6">
            {/* Arabic Text - Fades in first */}
            <p 
              className="arabic-text text-2xl md:text-3xl leading-[2.5] animate-fade-in-up"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              {ayah.arabicText}
            </p>

            {/* English Translation - Fades in with delay */}
            <p className="text-base md:text-lg text-foreground/90 leading-relaxed animate-fade-in-up animation-delay-200">
              "{ayah.englishText}"
            </p>

            {/* Surah Reference */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in animation-delay-300">
              <span className="font-arabic">{surah?.name}</span>
              <span>•</span>
              <span>{surah?.englishName} {ayah.ayahNumber}</span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
