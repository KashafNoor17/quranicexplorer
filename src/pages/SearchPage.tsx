import { Header, Footer } from '@/components/layout/Header';
import { EnhancedSearch } from '@/components/quran/EnhancedSearch';
import { useSearch } from '@/hooks/useQuran';

export default function SearchPage() {
  const { query, language, results, isSearching, search, changeLanguage, clearSearch } = useSearch();

  // Transform results for EnhancedSearch component - ensure proper typing
  const transformedResults = results?.results.map(r => ({
    surahNumber: r.surahNumber ?? 1,
    ayahNumber: r.ayahNumber ?? 1,
    globalAyahNumber: r.globalAyahNumber ?? 1,
    snippet: r.snippet ?? '',
  })) ?? null;

  return (
    <div className="min-h-screen bg-background geometric-pattern">
      <Header title="Search" />

      <main className="container px-4 py-8 md:px-6 md:py-12 animate-page-in">
        {/* Search Header */}
        <div className="mb-8 text-center animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Search the Quran
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Search through 6,236 verses in English or Urdu. Find any word, Surah name,
            or Ayah number across the entire Holy Quran.
          </p>
        </div>

        {/* Enhanced Search Component */}
        <div className="max-w-3xl mx-auto animate-fade-in-up animation-delay-100">
          <EnhancedSearch
            onSearch={search}
            results={transformedResults}
            isSearching={isSearching}
            language={language}
            onLanguageChange={changeLanguage}
            onClear={clearSearch}
            query={query}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
