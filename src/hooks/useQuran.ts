import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSurah, fetchAyah, searchAyahs } from '@/lib/api';
import {
  initDB,
  cacheAyahs,
  getCachedSurah,
  getAllCachedAyahs,
  addBookmark,
  removeBookmark,
  getBookmarks,
  isBookmarked,
  getProgress,
  updateProgress,
  updateLastRead,
  getSettings,
  updateSettings,
  isSurahCached,
  setCacheTimestamp,
} from '@/lib/storage';
import type { Ayah, Bookmark, Progress, Settings, SearchResults } from '@/lib/schemas';
import { surahData, dailyAyahs, getDailyAyahIndex } from '@/lib/quranData';

// Initialize DB on first import
initDB().catch(console.error);

// Hook to fetch and cache a Surah
export function useSurah(surahNumber: number) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return useQuery({
    queryKey: ['surah', surahNumber],
    queryFn: async () => {
      // Try cache first
      const cached = await getCachedSurah(surahNumber);
      if (cached.length > 0) {
        // If online, fetch fresh data in background
        if (!isOffline) {
          fetchSurah(surahNumber)
            .then(ayahs => {
              cacheAyahs(ayahs);
              setCacheTimestamp(`surah-${surahNumber}`);
            })
            .catch(console.error);
        }
        return cached;
      }

      // If offline and no cache, throw error
      if (isOffline) {
        throw new Error('No cached data available offline');
      }

      // Fetch from API
      const ayahs = await fetchSurah(surahNumber);
      
      // Cache for offline use
      await cacheAyahs(ayahs);
      await setCacheTimestamp(`surah-${surahNumber}`);
      
      return ayahs;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: isOffline ? false : 3,
  });
}

// Hook to get a single Ayah
export function useAyah(surahNumber: number, ayahNumber: number) {
  return useQuery({
    queryKey: ['ayah', surahNumber, ayahNumber],
    queryFn: async () => {
      // Try cache first
      const surahAyahs = await getCachedSurah(surahNumber);
      const cached = surahAyahs.find(a => a.ayahNumber === ayahNumber);
      if (cached) return cached;

      // Fetch from API
      return fetchAyah(surahNumber, ayahNumber);
    },
    staleTime: 1000 * 60 * 60,
  });
}

// Hook for Daily Ayah
export function useDailyAyah() {
  const dailyAyahData = dailyAyahs[getDailyAyahIndex()];
  return useAyah(dailyAyahData.surah, dailyAyahData.ayah);
}

// Hook for bookmarks
export function useBookmarks() {
  const queryClient = useQueryClient();

  const { data: bookmarks = [], ...query } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: getBookmarks,
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: ({ surahNumber, ayahNumber }: { surahNumber: number; ayahNumber: number }) =>
      addBookmark(surahNumber, ayahNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ surahNumber, ayahNumber }: { surahNumber: number; ayahNumber: number }) =>
      removeBookmark(surahNumber, ayahNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  const checkBookmarked = useCallback(
    (surahNumber: number, ayahNumber: number) => {
      return bookmarks.some(
        (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
      );
    },
    [bookmarks]
  );

  return {
    bookmarks,
    ...query,
    addBookmark: addMutation.mutate,
    removeBookmark: removeMutation.mutate,
    isBookmarked: checkBookmarked,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

// Hook for progress
export function useProgress() {
  const queryClient = useQueryClient();

  const { data: progress, ...query } = useQuery({
    queryKey: ['progress'],
    queryFn: getProgress,
    staleTime: 0,
  });

  const updateMutation = useMutation({
    mutationFn: updateProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });

  const updateLastReadMutation = useMutation({
    mutationFn: ({ surahNumber, ayahNumber }: { surahNumber: number; ayahNumber: number }) =>
      updateLastRead(surahNumber, ayahNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });

  return {
    progress: progress || { perSurahProgress: {}, overallCompletion: 0 },
    ...query,
    updateProgress: updateMutation.mutate,
    updateLastRead: updateLastReadMutation.mutate,
  };
}

// Hook for settings
export function useSettings() {
  const queryClient = useQueryClient();

  const { data: settings, ...query } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    staleTime: 0,
  });

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  return {
    settings: settings || {
      language: 'en' as const,
      showTranslations: true,
      fontSizePx: 24,
      theme: 'light' as const,
      preferredReciter: 'ar.alafasy',
      playbackSpeed: 1,
    },
    ...query,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}

// Hook for search
export function useSearch() {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = useCallback(async (searchQuery: string, searchLanguage: 'en' | 'ur') => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const allAyahs = await getAllCachedAyahs();
      const matchedAyahs = searchAyahs(allAyahs, searchQuery, searchLanguage);

      setResults({
        query: searchQuery,
        language: searchLanguage,
        results: matchedAyahs.map((ayah) => ({
          surahNumber: ayah.surahNumber,
          ayahNumber: ayah.ayahNumber,
          globalAyahNumber: ayah.globalAyahNumber,
          snippet: searchLanguage === 'en' 
            ? ayah.englishText?.slice(0, 150) + '...' || ''
            : ayah.urduText?.slice(0, 150) + '...' || '',
        })),
        resultOrder: 'ASC',
        totalCount: matchedAyahs.length,
      });
    } finally {
      setIsSearching(false);
    }
  }, []);

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    performSearch(searchQuery, language);
  }, [language, performSearch]);

  const changeLanguage = useCallback((newLanguage: 'en' | 'ur') => {
    setLanguage(newLanguage);
    if (query) {
      performSearch(query, newLanguage);
    }
  }, [query, performSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
  }, []);

  return {
    query,
    language,
    results,
    isSearching,
    search,
    changeLanguage,
    clearSearch,
  };
}

// Hook for offline status
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedSurahs, setCachedSurahs] = useState<Set<number>>(new Set());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check which surahs are cached
  useEffect(() => {
    const checkCached = async () => {
      const cached = new Set<number>();
      for (let i = 1; i <= 114; i++) {
        if (await isSurahCached(i)) {
          cached.add(i);
        }
      }
      setCachedSurahs(cached);
    };
    checkCached();
  }, []);

  return {
    isOnline,
    cachedSurahs,
    isSurahCached: (surahNumber: number) => cachedSurahs.has(surahNumber),
  };
}

// Export surah data for components
export { surahData, dailyAyahs, getDailyAyahIndex };
