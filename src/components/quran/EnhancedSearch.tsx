import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { surahData } from '@/hooks/useQuran';
import { Search as SearchIcon, ArrowRight, AlertCircle, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  surahNumber: number;
  ayahNumber: number;
  globalAyahNumber: number;
  snippet: string;
  matchType?: 'surah' | 'ayah' | 'text';
}

interface EnhancedSearchProps {
  onSearch: (query: string) => void;
  results: SearchResult[] | null;
  isSearching: boolean;
  language: 'en' | 'ur';
  onLanguageChange: (lang: 'en' | 'ur') => void;
  onClear: () => void;
  query: string;
}

// Levenshtein distance for typo tolerance
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function EnhancedSearch({
  onSearch,
  results,
  isSearching,
  language,
  onLanguageChange,
  onClear,
  query,
}: EnhancedSearchProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Generate suggestions based on input
  const suggestions = useMemo(() => {
    if (!inputValue || inputValue.length < 2) return [];

    const input = inputValue.toLowerCase().trim();
    const result: Array<{ type: 'surah' | 'ayah'; text: string; data: unknown }> = [];

    // Check for Surah name matches (English and Arabic)
    surahData.forEach(surah => {
      const englishMatch = surah.englishName.toLowerCase().includes(input);
      const arabicMatch = surah.name.includes(inputValue);
      const translationMatch = surah.englishNameTranslation?.toLowerCase().includes(input);
      
      // Typo tolerance for English names
      const distance = levenshteinDistance(input, surah.englishName.toLowerCase().slice(0, input.length));
      const fuzzyMatch = distance <= 2 && input.length >= 3;

      if (englishMatch || arabicMatch || translationMatch || fuzzyMatch) {
        result.push({
          type: 'surah',
          text: `${surah.englishName} (${surah.name})`,
          data: surah,
        });
      }
    });

    // Check for Surah:Ayah pattern (e.g., "2:255" or "Al-Baqarah 255")
    const ayahPattern = /^(\d+)[:\s]+(\d+)$/;
    const match = input.match(ayahPattern);
    if (match) {
      const surahNum = parseInt(match[1]);
      const ayahNum = parseInt(match[2]);
      const surah = surahData.find(s => s.number === surahNum);
      if (surah && ayahNum <= surah.ayahCount) {
        result.push({
          type: 'ayah',
          text: `${surah.englishName} ${ayahNum}`,
          data: { surahNumber: surahNum, ayahNumber: ayahNum },
        });
      }
    }

    return result.slice(0, 5);
  }, [inputValue]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(inputValue);
  };

  const handleSuggestionClick = (suggestion: typeof suggestions[0]) => {
    setShowSuggestions(false);
    if (suggestion.type === 'surah') {
      const surah = suggestion.data as typeof surahData[0];
      setInputValue(surah.englishName);
      onSearch(surah.englishName);
    } else if (suggestion.type === 'ayah') {
      const { surahNumber, ayahNumber } = suggestion.data as { surahNumber: number; ayahNumber: number };
      window.location.href = `/surah/${surahNumber}?ayah=${ayahNumber}`;
    }
  };

  // Filter results by surah
  const filteredResults = useMemo(() => {
    if (!results) return null;
    if (selectedSurah === 'all') return results;
    return results.filter(r => r.surahNumber === parseInt(selectedSurah));
  }, [results, selectedSurah]);

  const handleClearFilters = () => {
    setSelectedSurah('all');
  };

  const hasActiveFilters = selectedSurah !== 'all';

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <SearchIcon 
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" 
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              type="search"
              placeholder="Search by Surah name, Ayah number, or keywords..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="pl-10 h-12 focus-ring"
              aria-label="Search query"
              aria-autocomplete="list"
              aria-expanded={showSuggestions && suggestions.length > 0}
            />
            
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in"
                role="listbox"
                aria-label="Search suggestions"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none flex items-center gap-3 transition-colors"
                    role="option"
                  >
                    <Badge variant="secondary" className="shrink-0">
                      {suggestion.type === 'surah' ? 'Surah' : 'Ayah'}
                    </Badge>
                    <span className="text-sm">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button 
            type="submit" 
            variant="emerald" 
            size="lg" 
            disabled={isSearching}
            className="transition-transform hover:scale-105 active:scale-95 focus-ring"
          >
            {isSearching ? (
              <LoadingSpinner size="sm" />
            ) : (
              'Search'
            )}
          </Button>
        </div>

        {/* Language Tabs & Filters */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <Tabs value={language} onValueChange={(v) => onLanguageChange(v as 'en' | 'ur')}>
            <TabsList className="grid w-full grid-cols-2 max-w-xs" aria-label="Search language">
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="ur">Urdu</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            type="button"
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="transition-transform hover:scale-105 focus-ring"
            aria-expanded={showFilters}
            aria-controls="filter-panel"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" aria-hidden="true" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">1</Badge>
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div 
            id="filter-panel"
            className="mt-4 p-4 rounded-lg bg-muted/50 border border-border animate-fade-in"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Filters</h3>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs focus-ring"
                >
                  <X className="h-3 w-3 mr-1" aria-hidden="true" />
                  Clear all
                </Button>
              )}
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="surah-filter" className="text-sm text-muted-foreground mb-1.5 block">
                  Filter by Surah
                </label>
                <Select value={selectedSurah} onValueChange={setSelectedSurah}>
                  <SelectTrigger id="surah-filter" className="focus-ring">
                    <SelectValue placeholder="All Surahs" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
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
      </form>

      {/* Results */}
      {filteredResults && (
        <div className="animate-fade-in" role="region" aria-label="Search results">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'} for "{query}"
              {selectedSurah !== 'all' && (
                <span className="text-muted-foreground font-normal">
                  {' '}in {surahData.find(s => s.number === parseInt(selectedSurah))?.englishName}
                </span>
              )}
            </h2>
            {filteredResults.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClear}
                className="focus-ring"
              >
                Clear
              </Button>
            )}
          </div>

          {filteredResults.length === 0 ? (
            <Card className="animate-fade-in" role="status">
              <CardContent className="p-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try searching with different keywords, check your spelling, or try a different language.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3" role="list" aria-label="Search results list">
              {filteredResults.map((result, index) => {
                const surah = surahData.find(s => s.number === result.surahNumber);
                return (
                  <Link
                    key={`${result.surahNumber}-${result.ayahNumber}-${index}`}
                    to={`/surah/${result.surahNumber}?ayah=${result.ayahNumber}`}
                    className="block focus-ring rounded-lg"
                    role="listitem"
                  >
                    <Card 
                      variant="surah"
                      className="transition-transform hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div 
                            className="ayah-badge shrink-0" 
                            aria-label={`Verse ${result.ayahNumber}`}
                          >
                            {result.ayahNumber}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-foreground">
                                {surah?.englishName}
                              </span>
                              <span className="text-muted-foreground text-sm font-arabic" lang="ar">
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
        <div className="text-center text-muted-foreground animate-fade-in" role="status">
          <SearchIcon className="mx-auto h-16 w-16 mb-4 opacity-50" aria-hidden="true" />
          <p>Enter a search term to find verses in the Quran.</p>
          <p className="text-sm mt-2">
            Try searching for Surah names, Ayah numbers (e.g., "2:255"), or keywords.
          </p>
        </div>
      )}
    </div>
  );
}
