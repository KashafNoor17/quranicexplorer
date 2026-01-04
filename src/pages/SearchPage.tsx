import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearch, surahData } from '@/hooks/useQuran';
import { Search as SearchIcon, ArrowRight, AlertCircle } from 'lucide-react';

export default function SearchPage() {
  const { query, language, results, isSearching, search, changeLanguage, clearSearch } = useSearch();
  const [inputValue, setInputValue] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(inputValue);
  };

  return (
    <div className="min-h-screen bg-background geometric-pattern">
      <Header showBack title="Search" />

      <main className="container px-4 py-8 md:px-6 md:py-12">
        {/* Search Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Search the Quran
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Search through 6,236 verses in English or Urdu. Find any word or phrase
            across the entire Holy Quran.
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search verses..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button type="submit" variant="emerald" size="lg" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>

          {/* Language Tabs */}
          <Tabs value={language} onValueChange={(v) => changeLanguage(v as 'en' | 'ur')} className="mt-4">
            <TabsList className="grid w-full grid-cols-2 max-w-xs mx-auto">
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="ur">Urdu</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Results */}
        {results && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {results.totalCount} results for "{results.query}"
              </h2>
              {results.totalCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearSearch}>
                  Clear
                </Button>
              )}
            </div>

            {results.totalCount === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground">
                    Try searching with different keywords or check your spelling.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {results.results.map((result, index) => {
                  const surah = surahData.find(s => s.number === result.surahNumber);
                  return (
                    <Link
                      key={`${result.surahNumber}-${result.ayahNumber}-${index}`}
                      to={`/surah/${result.surahNumber}?ayah=${result.ayahNumber}`}
                    >
                      <Card variant="surah">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="ayah-badge shrink-0">
                              {result.ayahNumber}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-foreground">
                                  {surah?.englishName}
                                </span>
                                <span className="text-muted-foreground text-sm">
                                  {surah?.name}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {result.snippet}
                              </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!results && !isSearching && (
          <div className="max-w-xl mx-auto text-center text-muted-foreground">
            <SearchIcon className="mx-auto h-16 w-16 mb-4 opacity-50" />
            <p>Enter a search term to find verses in the Quran.</p>
            <p className="text-sm mt-2">
              Tip: Search works offline once Surahs are cached.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
