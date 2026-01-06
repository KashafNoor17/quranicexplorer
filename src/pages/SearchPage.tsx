import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useSearch, surahData } from '@/hooks/useQuran';
import { Search as SearchIcon, ArrowRight, AlertCircle, Filter, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SearchPage() {
  const { query, language, results, isSearching, search, changeLanguage, clearSearch } = useSearch();
  const [inputValue, setInputValue] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(inputValue);
  };

  // Filter results by surah
  const filteredResults = results ? {
    ...results,
    results: selectedSurah === 'all' 
      ? results.results 
      : results.results.filter(r => r.surahNumber === parseInt(selectedSurah)),
    totalCount: selectedSurah === 'all' 
      ? results.totalCount 
      : results.results.filter(r => r.surahNumber === parseInt(selectedSurah)).length,
  } : null;

  const handleClearFilters = () => {
    setSelectedSurah('all');
  };

  const hasActiveFilters = selectedSurah !== 'all';

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
            Search through 6,236 verses in English or Urdu. Find any word or phrase
            across the entire Holy Quran.
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-2xl mx-auto mb-8 animate-fade-in-up animation-delay-100">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search verses..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="pl-10 h-12 focus-ring"
                aria-label="Search query"
              />
            </div>
            <Button 
              type="submit" 
              variant="emerald" 
              size="lg" 
              disabled={isSearching}
              className="transition-transform hover:scale-105 active:scale-95"
            >
              {isSearching ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Search'
              )}
            </Button>
          </form>

          {/* Language Tabs & Filters */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <Tabs value={language} onValueChange={(v) => changeLanguage(v as 'en' | 'ur')}>
              <TabsList className="grid w-full grid-cols-2 max-w-xs">
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="ur">Urdu</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="transition-transform hover:scale-105"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">1</Badge>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Filters</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">
                    Filter by Surah
                  </label>
                  <Select value={selectedSurah} onValueChange={setSelectedSurah}>
                    <SelectTrigger className="focus-ring">
                      <SelectValue placeholder="All Surahs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Surahs</SelectItem>
                      {surahData.map((surah) => (
                        <SelectItem key={surah.number} value={surah.number.toString()}>
                          {surah.number}. {surah.englishName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {filteredResults && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {filteredResults.totalCount} {filteredResults.totalCount === 1 ? 'result' : 'results'} for "{filteredResults.query}"
                {selectedSurah !== 'all' && (
                  <span className="text-muted-foreground font-normal">
                    {' '}in {surahData.find(s => s.number === parseInt(selectedSurah))?.englishName}
                  </span>
                )}
              </h2>
              {filteredResults.totalCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearSearch}>
                  Clear
                </Button>
              )}
            </div>

            {filteredResults.totalCount === 0 ? (
              <Card className="animate-fade-in">
                <CardContent className="p-8 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground">
                    Try searching with different keywords or check your spelling.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 stagger-children">
                {filteredResults.results.map((result, index) => {
                  const surah = surahData.find(s => s.number === result.surahNumber);
                  return (
                    <Link
                      key={`${result.surahNumber}-${result.ayahNumber}-${index}`}
                      to={`/surah/${result.surahNumber}?ayah=${result.ayahNumber}`}
                      className="block"
                    >
                      <Card 
                        variant="surah"
                        className="transition-transform hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="ayah-badge shrink-0" aria-label={`Verse ${result.ayahNumber}`}>
                              {result.ayahNumber}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-foreground">
                                  {surah?.englishName}
                                </span>
                                <span className="text-muted-foreground text-sm font-arabic">
                                  {surah?.name}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {result.snippet}
                              </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
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
          <div className="max-w-xl mx-auto text-center text-muted-foreground animate-fade-in animation-delay-200">
            <SearchIcon className="mx-auto h-16 w-16 mb-4 opacity-50" aria-hidden="true" />
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
