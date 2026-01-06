import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer } from '@/components/layout/Header';
import { DailyAyah } from '@/components/quran/DailyAyah';
import { SurahList } from '@/components/quran/SurahList';
import { JuzTabs } from '@/components/quran/JuzTabs';
import { ContinueReading } from '@/components/quran/ContinueReading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, BookOpen, Heart, Wifi, WifiOff, Columns2 } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/useQuran';

export default function Index() {
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const { isOnline, cachedSurahs } = useOfflineStatus();

  return (
    <div className="min-h-screen bg-background geometric-pattern" role="main">
      <Header />

      <main className="container px-4 py-8 md:px-6 md:py-12">
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 text-sm text-primary">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                <span>Offline Mode ({cachedSurahs.size} Surahs cached)</span>
              </>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 animate-fade-in-up">
            Explore the{' '}
            <span className="text-primary">Holy Quran</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in-up animation-delay-100">
            Read, listen, reflect, and memorize the divine words of Allah 
            with our beautiful, modern Quran explorer.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in-up animation-delay-200">
            <Link to="/search">
              <Button variant="hero" size="xl" className="transition-transform hover:scale-105 active:scale-95">
                <Search className="h-5 w-5" />
                Search All Verses
              </Button>
            </Link>
            <Link to="/compare">
              <Button variant="glass" size="xl" className="transition-transform hover:scale-105 active:scale-95">
                <Columns2 className="h-5 w-5" />
                Compare Translations
              </Button>
            </Link>
            <Link to="/duas">
              <Button variant="glass" size="xl" className="transition-transform hover:scale-105 active:scale-95">
                <Heart className="h-5 w-5" />
                Quranic Duas
              </Button>
            </Link>
          </div>
        </section>

        {/* Continue Reading */}
        <section className="mb-8 animate-fade-in-up animation-delay-300">
          <ContinueReading />
        </section>

        {/* Daily Ayah */}
        <section className="mb-12 animate-fade-in-up animation-delay-400">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            ✨ Ayah of the Day
          </h2>
          <DailyAyah />
        </section>

        {/* Feature Cards */}
        <section className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card variant="feature" className="animate-fade-in-up animation-delay-100">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-emerald-light/20">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">114 Surahs</h3>
              <p className="text-sm text-muted-foreground">
                Complete Quran with Arabic, English, and Urdu translations
              </p>
            </CardContent>
          </Card>

          <Card variant="feature" className="animate-fade-in-up animation-delay-200">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-gold-light/20">
                <Search className="h-7 w-7 text-gold" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Smart Search</h3>
              <p className="text-sm text-muted-foreground">
                Search across 6,236 verses in English and Urdu
              </p>
            </CardContent>
          </Card>

          <Card variant="feature" className="animate-fade-in-up animation-delay-300">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-gold/20">
                <WifiOff className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Offline Ready</h3>
              <p className="text-sm text-muted-foreground">
                Read the Quran anytime, even without internet
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Surah List */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              📖 All Surahs
            </h2>
            <JuzTabs selectedJuz={selectedJuz} onSelectJuz={setSelectedJuz} />
          </div>
          <SurahList selectedJuz={selectedJuz ?? undefined} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
