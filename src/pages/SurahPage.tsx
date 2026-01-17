import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Header, Footer } from '@/components/layout/Header';
import { EnhancedAyahCard } from '@/components/quran/EnhancedAyahCard';
import { EnhancedAudioControls } from '@/components/quran/EnhancedAudioControls';
import { QuickNavigation } from '@/components/quran/QuickNavigation';
import { FontSizeControl } from '@/components/ui/FontSizeControl';
import { useSurah, useBookmarks, useProgress, useSettings, surahData, useOfflineStatus } from '@/hooks/useQuran';
import { usePersistentAudioPlayer } from '@/hooks/usePersistentAudioPlayer';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Download, Check, Loader2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cacheAyahs } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function SurahPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const surahNumber = parseInt(id || '1', 10);
  const startAyah = parseInt(searchParams.get('ayah') || '1', 10);

  const surah = surahData.find(s => s.number === surahNumber);
  const { data: ayahs, isLoading, error } = useSurah(surahNumber);
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const { updateLastRead } = useProgress();
  const { settings, updateSettings } = useSettings();

  const { isSurahCached, isOnline } = useOfflineStatus();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCached, setIsCached] = useState(false);

  const audioPlayer = usePersistentAudioPlayer(ayahs || [], (ayahNumber) => {
    updateLastRead({ surahNumber, ayahNumber });
  });

  // Check if surah is cached
  useEffect(() => {
    setIsCached(isSurahCached(surahNumber));
  }, [surahNumber, isSurahCached]);

  // Download surah for offline use
  const handleDownload = async () => {
    if (!ayahs || ayahs.length === 0) return;
    
    setIsDownloading(true);
    try {
      await cacheAyahs(ayahs);
      setIsCached(true);
      toast({
        title: "Downloaded!",
        description: `${surah?.englishName} is now available offline.`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not save surah for offline use.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Scroll to specific ayah on load
  useEffect(() => {
    if (ayahs && startAyah > 1) {
      const element = document.getElementById(`ayah-${startAyah}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [ayahs, startAyah]);

  // Update last read on initial load
  useEffect(() => {
    if (ayahs && ayahs.length > 0) {
      updateLastRead({ surahNumber, ayahNumber: 1 });
    }
  }, [surahNumber, ayahs]);

  if (!surah) {
    return (
      <div className="min-h-screen bg-background" role="main">
        <Header title="Surah Not Found" />
        <main className="container px-4 py-12 text-center animate-page-in">
          <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" aria-hidden="true" />
          <h1 className="text-2xl font-bold">Surah not found</h1>
          <p className="text-muted-foreground">The requested Surah does not exist.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background geometric-pattern" role="main">
      <Header title={surah.englishName} />

      <main className="container px-4 py-8 md:px-6 md:py-12 pb-32 animate-page-in">
        {/* Surah Header */}
        <header className="mb-8 text-center animate-fade-in-up">
          <h1 
            className="text-4xl md:text-5xl font-arabic text-primary mb-2"
            lang="ar"
            dir="rtl"
          >
            {surah.name}
          </h1>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {surah.englishName}
          </h2>
          <p className="text-muted-foreground mb-4">
            {surah.englishNameTranslation} • {surah.ayahCount} Ayahs • {surah.revelationPlace}
          </p>
          
          {/* Controls toolbar */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <QuickNavigation />
            <FontSizeControl 
              fontSize={settings.fontSizePx} 
              onFontSizeChange={(size) => updateSettings({ fontSizePx: size })} 
            />
            <div className="flex items-center gap-2">
              <Switch
                id="show-translations"
                checked={settings.showTranslations}
                onCheckedChange={(checked) => updateSettings({ showTranslations: checked })}
                aria-label="Toggle translations"
              />
              <Label htmlFor="show-translations" className="text-sm cursor-pointer">
                Translations
              </Label>
            </div>
            
            {/* Download / Offline Status Button */}
            {isCached ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
                {isOnline ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Available offline</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" />
                    <span>Offline mode</span>
                  </>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading || !ayahs || ayahs.length === 0}
                className={cn(
                  "gap-2",
                  isDownloading && "cursor-not-allowed"
                )}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download
                  </>
                )}
              </Button>
            )}
          </div>
        </header>

        {/* Bismillah */}
        {surahNumber !== 1 && surahNumber !== 9 && (
          <div className="mb-8 text-center animate-fade-in-up animation-delay-100">
            <p 
              className="text-2xl md:text-3xl font-arabic text-primary"
              lang="ar"
              dir="rtl"
              aria-label="Bismillah - In the name of Allah, the Most Gracious, the Most Merciful"
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              In the name of Allah, the Most Gracious, the Most Merciful
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4 animate-pulse-soft" role="status" aria-label="Loading verses">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full loading-shimmer" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-8 w-full loading-shimmer" />
                      <Skeleton className="h-4 w-3/4 loading-shimmer" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <span className="sr-only">Loading verses, please wait...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive animate-fade-in" role="alert">
            <CardContent className="p-6 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" aria-hidden="true" />
              <h3 className="text-lg font-semibold mb-2">Failed to load Surah</h3>
              <p className="text-muted-foreground mb-4">
                {(error as Error).message || 'An error occurred while loading the Surah.'}
              </p>
              <Button 
                onClick={() => window.location.reload()}
                className="focus-ring"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ayahs */}
        {ayahs && (
          <div className="space-y-4" role="list" aria-label="Verses">
            {ayahs.map((ayah, index) => (
              <div 
                key={ayah.ayahNumber} 
                id={`ayah-${ayah.ayahNumber}`}
                role="listitem"
                className="animate-fade-in scroll-mt-24"
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
              >
                <EnhancedAyahCard
                  ayah={ayah}
                  isBookmarked={isBookmarked(surahNumber, ayah.ayahNumber)}
                  isPlaying={audioPlayer.currentAyah === ayah.ayahNumber && audioPlayer.isPlaying}
                  isLoading={audioPlayer.currentAyah === ayah.ayahNumber && audioPlayer.isLoading}
                  showTranslations={settings.showTranslations}
                  fontSize={settings.fontSizePx}
                  onToggleBookmark={() => {
                    if (isBookmarked(surahNumber, ayah.ayahNumber)) {
                      removeBookmark({ surahNumber, ayahNumber: ayah.ayahNumber });
                    } else {
                      addBookmark({ surahNumber, ayahNumber: ayah.ayahNumber });
                    }
                  }}
                  onPlayAudio={() => audioPlayer.playAyah(ayah.ayahNumber)}
                  onPauseAudio={() => audioPlayer.pause()}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Audio Controls */}
      {ayahs && (
        <EnhancedAudioControls
          isPlaying={audioPlayer.isPlaying}
          isPaused={audioPlayer.isPaused}
          currentAyah={audioPlayer.currentAyah}
          progress={audioPlayer.progress}
          duration={audioPlayer.duration}
          playbackSpeed={audioPlayer.playbackSpeed}
          totalAyahs={ayahs.length}
          isLoading={audioPlayer.isLoading}
          isBuffering={audioPlayer.isBuffering}
          onPlayPause={audioPlayer.togglePlayPause}
          onPrevious={() => {
            if (audioPlayer.currentAyah && audioPlayer.currentAyah > 1) {
              audioPlayer.playAyah(audioPlayer.currentAyah - 1);
            }
          }}
          onNext={() => {
            if (audioPlayer.currentAyah && audioPlayer.currentAyah < ayahs.length) {
              audioPlayer.playAyah(audioPlayer.currentAyah + 1);
            }
          }}
          onSeek={audioPlayer.seek}
          onSpeedChange={audioPlayer.setPlaybackSpeed}
          onStop={audioPlayer.stop}
        />
      )}

      <Footer />
    </div>
  );
}
