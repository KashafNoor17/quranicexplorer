import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Header, Footer } from '@/components/layout/Header';
import { AyahCard } from '@/components/quran/AyahCard';
import { AudioControls } from '@/components/quran/AudioControls';
import { useSurah, useBookmarks, useProgress, useSettings, surahData } from '@/hooks/useQuran';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SurahPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const surahNumber = parseInt(id || '1', 10);
  const startAyah = parseInt(searchParams.get('ayah') || '1', 10);

  const surah = surahData.find(s => s.number === surahNumber);
  const { data: ayahs, isLoading, error } = useSurah(surahNumber);
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const { updateLastRead } = useProgress();
  const { settings } = useSettings();

  const audioPlayer = useAudioPlayer(ayahs || [], (ayahNumber) => {
    updateLastRead({ surahNumber, ayahNumber });
  });

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
      <div className="min-h-screen bg-background">
        <Header showBack title="Surah Not Found" />
        <main className="container px-4 py-12 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Surah not found</h1>
          <p className="text-muted-foreground">The requested Surah does not exist.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background geometric-pattern">
      <Header showBack title={surah.englishName} />

      <main className="container px-4 py-8 md:px-6 md:py-12 pb-32">
        {/* Surah Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-arabic text-primary mb-2">
            {surah.name}
          </h1>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {surah.englishName}
          </h2>
          <p className="text-muted-foreground">
            {surah.englishNameTranslation} • {surah.ayahCount} Ayahs • {surah.revelationPlace}
          </p>
        </div>

        {/* Bismillah */}
        {surahNumber !== 1 && surahNumber !== 9 && (
          <div className="mb-8 text-center">
            <p className="text-2xl md:text-3xl font-arabic text-primary">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              In the name of Allah, the Most Gracious, the Most Merciful
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="p-6 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load Surah</h3>
              <p className="text-muted-foreground mb-4">
                {(error as Error).message || 'An error occurred while loading the Surah.'}
              </p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ayahs */}
        {ayahs && (
          <div className="space-y-4">
            {ayahs.map((ayah) => (
              <div key={ayah.ayahNumber} id={`ayah-${ayah.ayahNumber}`}>
                <AyahCard
                  ayah={ayah}
                  isBookmarked={isBookmarked(surahNumber, ayah.ayahNumber)}
                  isPlaying={audioPlayer.currentAyah === ayah.ayahNumber && audioPlayer.isPlaying}
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
        <AudioControls
          isPlaying={audioPlayer.isPlaying}
          isPaused={audioPlayer.isPaused}
          currentAyah={audioPlayer.currentAyah}
          progress={audioPlayer.progress}
          duration={audioPlayer.duration}
          playbackSpeed={audioPlayer.playbackSpeed}
          totalAyahs={ayahs.length}
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
        />
      )}

      <Footer />
    </div>
  );
}
