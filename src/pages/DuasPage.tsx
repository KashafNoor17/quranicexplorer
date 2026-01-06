import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { quranicDuas, surahData } from '@/lib/quranData';
import { useSurah, useBookmarks } from '@/hooks/useQuran';
import { Heart, Search, ArrowRight, Play, Bookmark, BookmarkCheck } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

// Group duas by theme
const duasByTheme = quranicDuas.reduce((acc, dua) => {
  if (!acc[dua.theme]) {
    acc[dua.theme] = [];
  }
  acc[dua.theme].push(dua);
  return acc;
}, {} as Record<string, typeof quranicDuas>);

const themes = Object.keys(duasByTheme).sort();

export default function DuasPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'theme' | 'surah'>('theme');

  // Filter duas
  const filteredDuas = useMemo(() => {
    let duas = selectedTheme ? duasByTheme[selectedTheme] : quranicDuas;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      duas = duas.filter(dua => {
        const surah = surahData.find(s => s.number === dua.surah);
        return (
          dua.theme.toLowerCase().includes(query) ||
          surah?.englishName.toLowerCase().includes(query) ||
          surah?.name.includes(query)
        );
      });
    }
    
    return duas;
  }, [selectedTheme, searchQuery]);

  // Group by surah if needed
  const groupedDuas = useMemo(() => {
    if (groupBy === 'surah') {
      return filteredDuas.reduce((acc, dua) => {
        const surah = surahData.find(s => s.number === dua.surah);
        const key = surah?.englishName || `Surah ${dua.surah}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(dua);
        return acc;
      }, {} as Record<string, typeof filteredDuas>);
    }
    return null;
  }, [filteredDuas, groupBy]);

  return (
    <div className="min-h-screen bg-background geometric-pattern" role="main">
      <Header title="Quranic Duas" />

      <main className="container px-4 py-8 md:px-6 md:py-12 animate-page-in">
        {/* Header */}
        <div className="mb-8 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gold/10 text-sm text-gold">
            <Heart className="h-4 w-4" aria-hidden="true" />
            <span>Supplications from the Quran</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Quranic Duas
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Authentic supplications directly from the Holy Quran. These are the blessed
            duas mentioned by Allah in His divine book.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="max-w-2xl mx-auto mb-8 space-y-4 animate-fade-in-up animation-delay-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Search duas by theme or surah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 focus-ring"
              aria-label="Search duas"
            />
          </div>

          <div className="flex items-center justify-between">
            <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as 'theme' | 'surah')}>
              <TabsList>
                <TabsTrigger value="theme">By Theme</TabsTrigger>
                <TabsTrigger value="surah">By Surah</TabsTrigger>
              </TabsList>
            </Tabs>

            {selectedTheme && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedTheme(null)}>
                Clear filter
              </Button>
            )}
          </div>

          {/* Theme filters */}
          {groupBy === 'theme' && !selectedTheme && (
            <div className="flex flex-wrap gap-2">
              {themes.slice(0, 10).map((theme) => (
                <Button
                  key={theme}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTheme(theme)}
                  className="text-xs"
                >
                  {theme}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Duas List */}
        <div className="max-w-3xl mx-auto space-y-4 stagger-children" role="list" aria-label="Quranic duas">
          {groupBy === 'surah' && groupedDuas ? (
            Object.entries(groupedDuas).map(([surahName, duas]) => (
              <div key={surahName} className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">{surahName}</h3>
                {duas.map((dua) => (
                  <DuaCard key={`${dua.surah}-${dua.ayah}`} dua={dua} />
                ))}
              </div>
            ))
          ) : (
            filteredDuas.map((dua) => (
              <DuaCard key={`${dua.surah}-${dua.ayah}`} dua={dua} />
            ))
          )}

          {filteredDuas.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No duas found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

interface DuaCardProps {
  dua: { surah: number; ayah: number; theme: string };
}

function DuaCard({ dua }: DuaCardProps) {
  const surah = surahData.find(s => s.number === dua.surah);
  const { data: ayahs } = useSurah(dua.surah);
  const ayah = ayahs?.find(a => a.ayahNumber === dua.ayah);
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();

  const bookmarked = isBookmarked(dua.surah, dua.ayah);

  return (
    <Card variant="ayah" className="overflow-hidden transition-transform hover:scale-[1.01]" role="listitem">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gold bg-gold/10 px-2 py-1 rounded-full">
              {dua.theme}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={bookmarked ? 'gold' : 'ghost'}
              size="icon"
              className="transition-transform hover:scale-105 active:scale-95 focus-ring"
              aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
              aria-pressed={bookmarked}
              onClick={() => {
                if (bookmarked) {
                  removeBookmark({ surahNumber: dua.surah, ayahNumber: dua.ayah });
                } else {
                  addBookmark({ surahNumber: dua.surah, ayahNumber: dua.ayah });
                }
              }}
            >
              {bookmarked ? (
                <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Bookmark className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {/* Arabic Text */}
        {ayah && (
          <p 
            className="arabic-text text-xl md:text-2xl leading-[2.5] mb-4 text-foreground"
            lang="ar"
            dir="rtl"
          >
            {ayah.arabicText}
          </p>
        )}

        {/* Translations */}
        {ayah && (
          <div className="space-y-3 border-t border-border/50 pt-4">
            {ayah.englishText && (
              <p className="text-sm leading-relaxed text-foreground/80" lang="en">
                {ayah.englishText}
              </p>
            )}
            {ayah.urduText && (
              <p className="text-sm leading-relaxed text-foreground/70 font-arabic" dir="rtl" lang="ur">
                {ayah.urduText}
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-arabic">{surah?.name}</span>
            <span>•</span>
            <span>{surah?.englishName} {dua.ayah}</span>
          </div>
          <Link to={`/surah/${dua.surah}?ayah=${dua.ayah}`}>
            <Button variant="ghost" size="sm">
              View in context
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
