import { useState } from 'react';
import { Header, Footer } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSurah, surahData } from '@/hooks/useQuran';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Columns2, ArrowLeftRight } from 'lucide-react';

const translations = [
  { id: 'en.sahih', name: 'Sahih International (English)', lang: 'en' },
  { id: 'ur.ahmedali', name: 'Ahmed Ali (Urdu)', lang: 'ur' },
];

export default function ComparisonPage() {
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [leftTranslation, setLeftTranslation] = useState('en.sahih');
  const [rightTranslation, setRightTranslation] = useState('ur.ahmedali');

  const { data: ayahs, isLoading, error } = useSurah(selectedSurah);

  const surah = surahData.find(s => s.number === selectedSurah);

  const swapTranslations = () => {
    const temp = leftTranslation;
    setLeftTranslation(rightTranslation);
    setRightTranslation(temp);
  };

  const getTranslationText = (ayah: any, translationId: string) => {
    if (translationId.startsWith('en')) {
      return ayah.englishText;
    } else if (translationId.startsWith('ur')) {
      return ayah.urduText;
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-background geometric-pattern">
      <Header title="Compare Translations" />

      <main className="container px-4 py-8 md:px-6 md:py-12 animate-page-in">
        {/* Header */}
        <div className="mb-8 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 text-sm text-primary">
            <Columns2 className="h-4 w-4" />
            <span>Side-by-Side Comparison</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Compare Translations
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            View two translations side by side to better understand the Quran.
          </p>
        </div>

        {/* Controls */}
        <div className="max-w-4xl mx-auto mb-8 animate-fade-in-up animation-delay-100">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Surah Selector */}
            <div className="w-full sm:w-auto">
              <label className="text-sm text-muted-foreground mb-1.5 block">Select Surah</label>
              <Select value={selectedSurah.toString()} onValueChange={(v) => setSelectedSurah(parseInt(v))}>
                <SelectTrigger className="w-full sm:w-[250px] focus-ring">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {surahData.map((s) => (
                    <SelectItem key={s.number} value={s.number.toString()}>
                      {s.number}. {s.englishName} ({s.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Translation Selectors */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Left Translation</label>
              <Select value={leftTranslation} onValueChange={setLeftTranslation}>
                <SelectTrigger className="focus-ring">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {translations.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={swapTranslations}
              className="self-end transition-transform hover:scale-105 active:scale-95"
              aria-label="Swap translations"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Right Translation</label>
              <Select value={rightTranslation} onValueChange={setRightTranslation}>
                <SelectTrigger className="focus-ring">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {translations.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Surah Header */}
        {surah && (
          <div className="mb-8 text-center animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-arabic text-primary mb-2">
              {surah.name}
            </h2>
            <p className="text-muted-foreground">
              {surah.englishName} • {surah.ayahCount} Verses
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" label="Loading verses..." />
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="max-w-xl mx-auto border-destructive">
            <CardContent className="p-6 text-center">
              <p className="text-destructive">Failed to load verses. Please try again.</p>
            </CardContent>
          </Card>
        )}

        {/* Comparison View */}
        {ayahs && (
          <div className="max-w-6xl mx-auto space-y-4">
            {ayahs.map((ayah, index) => (
              <Card 
                key={ayah.ayahNumber} 
                className="overflow-hidden animate-fade-in"
                style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
              >
                <CardContent className="p-0">
                  {/* Arabic Text Header */}
                  <div className="p-4 bg-muted/30 border-b">
                    <div className="flex items-center gap-3">
                      <span className="ayah-badge">{ayah.ayahNumber}</span>
                      <p 
                        className="font-arabic text-xl leading-loose text-foreground flex-1"
                        dir="rtl"
                        lang="ar"
                      >
                        {ayah.arabicText}
                      </p>
                    </div>
                  </div>

                  {/* Side by Side Translations */}
                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                    <div className="p-4">
                      <p 
                        className="text-sm leading-relaxed text-foreground/80"
                        lang={translations.find(t => t.id === leftTranslation)?.lang}
                        dir={leftTranslation.startsWith('ur') ? 'rtl' : 'ltr'}
                        style={leftTranslation.startsWith('ur') ? { fontFamily: "'Amiri', serif" } : {}}
                      >
                        {getTranslationText(ayah, leftTranslation)}
                      </p>
                    </div>
                    <div className="p-4">
                      <p 
                        className="text-sm leading-relaxed text-foreground/80"
                        lang={translations.find(t => t.id === rightTranslation)?.lang}
                        dir={rightTranslation.startsWith('ur') ? 'rtl' : 'ltr'}
                        style={rightTranslation.startsWith('ur') ? { fontFamily: "'Amiri', serif" } : {}}
                      >
                        {getTranslationText(ayah, rightTranslation)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
