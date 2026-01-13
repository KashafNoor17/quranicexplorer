import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Check, Trash2, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { surahData } from '@/lib/quranData';
import { isSurahCached, getCachedSurah, cacheAyahs } from '@/lib/storage';
import { fetchSurah } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SurahDownloadStatus {
  surahNumber: number;
  isDownloaded: boolean;
  isDownloading: boolean;
}

export function OfflineDownloadManager() {
  const [downloadStatus, setDownloadStatus] = useState<SurahDownloadStatus[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isCheckingCache, setIsCheckingCache] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);
  const { toast } = useToast();

  // Check online status
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
  const checkCacheStatus = useCallback(async () => {
    setIsCheckingCache(true);
    const status: SurahDownloadStatus[] = [];
    
    for (const surah of surahData) {
      const cached = await isSurahCached(surah.number);
      status.push({
        surahNumber: surah.number,
        isDownloaded: cached,
        isDownloading: false,
      });
    }
    
    setDownloadStatus(status);
    setIsCheckingCache(false);
  }, []);

  useEffect(() => {
    checkCacheStatus();
  }, [checkCacheStatus]);

  // Download a single surah
  const downloadSurah = async (surahNumber: number) => {
    if (!isOnline) {
      toast({
        title: 'Offline',
        description: 'You need an internet connection to download surahs.',
        variant: 'destructive',
      });
      return;
    }

    setDownloadStatus(prev => 
      prev.map(s => s.surahNumber === surahNumber ? { ...s, isDownloading: true } : s)
    );

    try {
      const ayahs = await fetchSurah(surahNumber);
      await cacheAyahs(ayahs);
      
      setDownloadStatus(prev => 
        prev.map(s => s.surahNumber === surahNumber ? { ...s, isDownloaded: true, isDownloading: false } : s)
      );
      
      toast({
        title: 'Download Complete',
        description: `${surahData[surahNumber - 1].englishName} is now available offline.`,
      });
    } catch (error) {
      setDownloadStatus(prev => 
        prev.map(s => s.surahNumber === surahNumber ? { ...s, isDownloading: false } : s)
      );
      
      toast({
        title: 'Download Failed',
        description: 'Failed to download surah. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Download all surahs
  const downloadAll = async () => {
    if (!isOnline) {
      toast({
        title: 'Offline',
        description: 'You need an internet connection to download surahs.',
        variant: 'destructive',
      });
      return;
    }

    const notDownloaded = downloadStatus.filter(s => !s.isDownloaded);
    setDownloadProgress({ current: 0, total: notDownloaded.length });

    for (let i = 0; i < notDownloaded.length; i++) {
      const surah = notDownloaded[i];
      setDownloadProgress({ current: i + 1, total: notDownloaded.length });
      
      setDownloadStatus(prev => 
        prev.map(s => s.surahNumber === surah.surahNumber ? { ...s, isDownloading: true } : s)
      );

      try {
        const ayahs = await fetchSurah(surah.surahNumber);
        await cacheAyahs(ayahs);
        
        setDownloadStatus(prev => 
          prev.map(s => s.surahNumber === surah.surahNumber ? { ...s, isDownloaded: true, isDownloading: false } : s)
        );
      } catch (error) {
        setDownloadStatus(prev => 
          prev.map(s => s.surahNumber === surah.surahNumber ? { ...s, isDownloading: false } : s)
        );
      }
    }

    setDownloadProgress(null);
    toast({
      title: 'Download Complete',
      description: 'All surahs are now available offline.',
    });
  };

  // Clear all downloaded data
  const clearDownloads = async () => {
    try {
      // Clear the IndexedDB store
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('QuranExplorerDB', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('ayahs', 'readwrite');
        const store = transaction.objectStore('ayahs');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      setDownloadStatus(prev => prev.map(s => ({ ...s, isDownloaded: false })));
      
      toast({
        title: 'Downloads Cleared',
        description: 'All offline data has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear downloads.',
        variant: 'destructive',
      });
    }
  };

  const downloadedCount = downloadStatus.filter(s => s.isDownloaded).length;
  const totalCount = downloadStatus.length;
  const percentDownloaded = totalCount > 0 ? Math.round((downloadedCount / totalCount) * 100) : 0;

  if (isCheckingCache) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Checking offline data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-destructive" />
          )}
          <span className="text-sm text-muted-foreground">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <Badge variant="secondary">
          {downloadedCount}/{totalCount} Surahs Downloaded
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={percentDownloaded} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          {percentDownloaded}% available offline
        </p>
      </div>

      {/* Download Progress */}
      {downloadProgress && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm">
              Downloading surah {downloadProgress.current} of {downloadProgress.total}...
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={downloadAll}
          disabled={!isOnline || downloadProgress !== null || downloadedCount === totalCount}
          className="flex-1"
        >
          <Download className="h-4 w-4 mr-2" />
          {downloadedCount === totalCount ? 'All Downloaded' : 'Download All'}
        </Button>
        <Button
          variant="outline"
          onClick={clearDownloads}
          disabled={downloadedCount === 0 || downloadProgress !== null}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>

      {/* Surah List */}
      <ScrollArea className="h-64 rounded-md border">
        <div className="p-2 space-y-1">
          {surahData.map((surah) => {
            const status = downloadStatus.find(s => s.surahNumber === surah.number);
            const isDownloaded = status?.isDownloaded ?? false;
            const isDownloading = status?.isDownloading ?? false;

            return (
              <div
                key={surah.number}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg transition-colors",
                  isDownloaded ? "bg-green-500/10" : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-6 text-right">
                    {surah.number}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{surah.englishName}</p>
                    <p className="text-xs text-muted-foreground">
                      {surah.ayahCount} Ayahs
                    </p>
                  </div>
                </div>
                <div>
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : isDownloaded ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => downloadSurah(surah.number)}
                      disabled={!isOnline}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <p className="text-xs text-muted-foreground text-center">
        Downloaded surahs can be read without an internet connection
      </p>
    </div>
  );
}