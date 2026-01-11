import { useState, useEffect, useRef } from 'react';
import { useDailyAyah, surahData, getDailyAyahIndex } from '@/hooks/useQuran';
import { dailyAyahs } from '@/lib/quranData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { 
  Sparkles, Share2, RefreshCw, Copy, Check, Star, 
  Volume2, VolumeX, Bell, BellOff, Loader2, Play, Pause 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const NOTIFICATION_STORAGE_KEY = 'dailyAyahNotification';
const AUTOPLAY_STORAGE_KEY = 'dailyAyahAutoplay';

export function EnhancedDailyAyah() {
  const { data: ayah, isLoading, error, refetch, isFetching } = useDailyAyah();
  const dailyData = dailyAyahs[getDailyAyahIndex()];
  const surah = surahData.find(s => s.number === dailyData.surah);
  const { toast } = useToast();
  
  const [copied, setCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(() => {
    return localStorage.getItem(AUTOPLAY_STORAGE_KEY) === 'true';
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Notification state
  const [notificationEnabled, setNotificationEnabled] = useState(() => {
    return localStorage.getItem(NOTIFICATION_STORAGE_KEY) === 'true';
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Trigger entrance animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Trigger content animation after card appears
  useEffect(() => {
    if (!isLoading && ayah) {
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, ayah]);

  // Auto-play audio when ayah loads (if enabled)
  useEffect(() => {
    if (autoPlayEnabled && ayah && showContent && !isPlaying) {
      const timer = setTimeout(() => {
        handlePlayAudio();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [ayah, showContent, autoPlayEnabled]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Schedule daily notification
  useEffect(() => {
    if (notificationEnabled && notificationPermission === 'granted') {
      scheduleDailyNotification();
    }
  }, [notificationEnabled, notificationPermission]);

  const scheduleDailyNotification = () => {
    // For demo purposes, we'll show a toast. In production, you'd use a service worker
    // to schedule actual push notifications at a specific time (e.g., Fajr time)
    const lastNotification = localStorage.getItem('lastDailyAyahNotification');
    const today = new Date().toDateString();
    
    if (lastNotification !== today) {
      localStorage.setItem('lastDailyAyahNotification', today);
      // Show browser notification if page is loaded fresh
      if (document.visibilityState === 'visible' && ayah) {
        showNotification();
      }
    }
  };

  const showNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted' && ayah) {
      new Notification('Daily Ayah - Quran Explorer', {
        body: `${surah?.englishName} ${ayah.ayahNumber}: "${ayah.englishText?.slice(0, 100)}..."`,
        icon: '/favicon.ico',
        tag: 'daily-ayah',
      });
    }
  };

  const handleToggleNotification = async () => {
    if (!notificationEnabled) {
      // Request permission
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          setNotificationEnabled(true);
          localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'true');
          toast({
            title: 'Daily reminder enabled',
            description: 'You will receive daily Ayah notifications',
          });
        } else {
          toast({
            title: 'Permission denied',
            description: 'Please enable notifications in your browser settings',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Not supported',
          description: 'Your browser does not support notifications',
          variant: 'destructive',
        });
      }
    } else {
      setNotificationEnabled(false);
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'false');
      toast({
        title: 'Daily reminder disabled',
        description: 'You will no longer receive daily Ayah notifications',
      });
    }
  };

  const handleToggleAutoPlay = () => {
    const newValue = !autoPlayEnabled;
    setAutoPlayEnabled(newValue);
    localStorage.setItem(AUTOPLAY_STORAGE_KEY, String(newValue));
    toast({
      title: newValue ? 'Auto-play enabled' : 'Auto-play disabled',
      description: newValue 
        ? 'Audio will play automatically when the Ayah loads' 
        : 'Audio will not play automatically',
    });
  };

  const handlePlayAudio = async () => {
    if (!ayah) return;
    
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    setIsAudioLoading(true);
    
    try {
      const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${getGlobalAyahNumber(dailyData.surah, dailyData.ayah)}.mp3`;
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        setIsPlaying(false);
        setIsAudioLoading(false);
        toast({
          title: 'Audio unavailable',
          description: 'Could not load audio for this Ayah',
          variant: 'destructive',
        });
      };
      audioRef.current.oncanplaythrough = () => {
        setIsAudioLoading(false);
        audioRef.current?.play();
        setIsPlaying(true);
      };
      
      audioRef.current.load();
    } catch {
      setIsAudioLoading(false);
      toast({
        title: 'Audio error',
        description: 'Could not play audio',
        variant: 'destructive',
      });
    }
  };

  // Helper to get global ayah number
  const getGlobalAyahNumber = (surahNum: number, ayahNum: number): number => {
    const ayahCounts = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
    let total = 0;
    for (let i = 0; i < surahNum - 1; i++) {
      total += ayahCounts[i];
    }
    return total + ayahNum;
  };

  const handleShare = async () => {
    const shareText = ayah 
      ? `"${ayah.englishText}"\n\n- ${surah?.englishName} ${ayah.ayahNumber}\n\n${ayah.arabicText}`
      : '';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Daily Ayah from Quran Explorer',
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    const copyText = ayah 
      ? `${ayah.arabicText}\n\n"${ayah.englishText}"\n\n- ${surah?.englishName} ${ayah.ayahNumber}`
      : '';
    
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      toast({
        title: 'Copied to clipboard',
        description: 'Ayah copied successfully',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = () => {
    setIsAnimating(true);
    setShowContent(false);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    refetch();
    setTimeout(() => {
      setIsAnimating(false);
      setShowContent(true);
    }, 800);
  };

  if (error) {
    return null;
  }

  return (
    <Card 
      variant="gold" 
      className={cn(
        'relative overflow-hidden transition-all duration-700 ease-out',
        'transform-gpu group',
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95',
        isAnimating && 'animate-gold-pulse',
        isHovered && 'shadow-lg shadow-gold/20 scale-[1.01]'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="article"
      aria-label="Daily Ayah - Verse of the day"
    >
      {/* Animated gradient border - enhanced on hover */}
      <div 
        className={cn(
          'absolute inset-0 rounded-lg transition-opacity duration-500',
          isHovered ? 'opacity-60' : 'opacity-30',
          'animate-border-glow'
        )}
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(var(--gold)), transparent)',
          backgroundSize: '200% 100%',
        }}
        aria-hidden="true" 
      />

      {/* Floating particles - more visible on hover */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'absolute w-1 h-1 rounded-full animate-float-particle transition-all duration-500',
              isHovered ? 'bg-gold/60 scale-150' : 'bg-gold/40'
            )}
            style={{
              left: `${15 + i * 15}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Decorative corner stars - animate on hover */}
      <div 
        className={cn(
          'absolute top-3 right-3 transition-all duration-500',
          isHovered ? 'opacity-50 scale-125' : 'opacity-20'
        )} 
        aria-hidden="true"
      >
        <Star className="h-4 w-4 text-gold animate-twinkle" style={{ animationDelay: '0s' }} />
      </div>
      <div 
        className={cn(
          'absolute bottom-3 left-3 transition-all duration-500',
          isHovered ? 'opacity-50 scale-125' : 'opacity-20'
        )} 
        aria-hidden="true"
      >
        <Star className="h-3 w-3 text-gold animate-twinkle" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Decorative background pattern */}
      <div 
        className={cn(
          'absolute inset-0 geometric-pattern animate-pattern-shift transition-opacity duration-500',
          isHovered ? 'opacity-10' : 'opacity-5'
        )} 
        aria-hidden="true" 
      />
      
      <CardContent className="relative p-6 md:p-8">
        {/* Header */}
        <div className={cn(
          'mb-6 flex items-center justify-between transition-all duration-500',
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
        )}>
          <div className="flex items-center gap-3">
            <div 
              className={cn(
                'relative flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 transition-all duration-300',
                isHovered ? 'scale-110 bg-gold/30' : 'animate-glow-pulse'
              )}
              aria-hidden="true"
            >
              <div className="absolute inset-0 rounded-full bg-gold/20 animate-ping-slow" />
              <Sparkles className={cn(
                'h-5 w-5 text-gold transition-transform duration-300',
                isHovered ? 'scale-110 rotate-12' : 'animate-sparkle'
              )} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gold tracking-wide">Daily Ayah</h3>
              <p className="text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
                {dailyData.theme}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div 
            className={cn(
              'flex items-center gap-1 transition-all duration-500',
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
            )} 
            style={{ transitionDelay: '0.2s' }}
            role="group" 
            aria-label="Ayah actions"
          >
            {/* Audio Play Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayAudio}
              disabled={isAudioLoading}
              className={cn(
                'h-9 w-9 rounded-full transition-all duration-300 hover:scale-110 focus-ring',
                isPlaying ? 'bg-gold/30 text-gold hover:bg-gold/40' : 'hover:bg-gold/20'
              )}
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
            >
              {isAudioLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
            
            {/* Notification Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleNotification}
              className={cn(
                'h-9 w-9 rounded-full transition-all duration-300 hover:scale-110 focus-ring',
                notificationEnabled ? 'bg-gold/30 text-gold hover:bg-gold/40' : 'hover:bg-gold/20'
              )}
              aria-label={notificationEnabled ? 'Disable daily reminder' : 'Enable daily reminder'}
            >
              {notificationEnabled ? (
                <Bell className="h-4 w-4" aria-hidden="true" />
              ) : (
                <BellOff className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isFetching}
              className="h-9 w-9 rounded-full transition-all duration-300 hover:scale-110 hover:bg-gold/20 focus-ring"
              aria-label="Refresh ayah"
            >
              <RefreshCw 
                className={cn(
                  'h-4 w-4 transition-transform',
                  isFetching && 'animate-spin'
                )} 
                aria-hidden="true"
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-9 w-9 rounded-full transition-all duration-300 hover:scale-110 hover:bg-gold/20 focus-ring"
              aria-label={copied ? 'Copied' : 'Copy ayah'}
            >
              {copied ? (
                <Check className="h-4 w-4 text-primary animate-bounce-in" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-9 w-9 rounded-full transition-all duration-300 hover:scale-110 hover:bg-gold/20 focus-ring"
              aria-label="Share ayah"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Settings row - Auto-play toggle */}
        <div 
          className={cn(
            'mb-4 flex items-center justify-between text-xs transition-all duration-500',
            showContent ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group/toggle">
              <Switch 
                checked={autoPlayEnabled}
                onCheckedChange={handleToggleAutoPlay}
                className="scale-75"
              />
              <span className="text-muted-foreground group-hover/toggle:text-foreground transition-colors flex items-center gap-1">
                {autoPlayEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                Auto-play
              </span>
            </label>
          </div>
          
          {isPlaying && (
            <div className="flex items-center gap-2 text-gold animate-pulse">
              <div className="flex items-center gap-0.5">
                <div className="w-0.5 h-3 bg-gold rounded-full animate-audio-bar" style={{ animationDelay: '0ms' }} />
                <div className="w-0.5 h-4 bg-gold rounded-full animate-audio-bar" style={{ animationDelay: '150ms' }} />
                <div className="w-0.5 h-2 bg-gold rounded-full animate-audio-bar" style={{ animationDelay: '300ms' }} />
                <div className="w-0.5 h-5 bg-gold rounded-full animate-audio-bar" style={{ animationDelay: '450ms' }} />
              </div>
              <span>Playing...</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4" role="status" aria-label="Loading daily ayah">
            <Skeleton className="h-12 w-full animate-shimmer" />
            <Skeleton className="h-6 w-3/4 animate-shimmer" style={{ animationDelay: '0.1s' }} />
            <Skeleton className="h-4 w-1/2 animate-shimmer" style={{ animationDelay: '0.2s' }} />
            <span className="sr-only">Loading daily ayah...</span>
          </div>
        ) : ayah ? (
          <div className="space-y-6">
            {/* Arabic Text */}
            <p 
              className={cn(
                'arabic-text text-2xl md:text-3xl leading-[2.5] transition-all duration-700',
                showContent 
                  ? 'opacity-100 translate-y-0 blur-0' 
                  : 'opacity-0 translate-y-6 blur-sm',
                isPlaying && 'text-gold'
              )}
              style={{ 
                fontFamily: "'Amiri', serif",
                transitionDelay: '0.1s'
              }}
              lang="ar"
              dir="rtl"
            >
              {ayah.arabicText}
            </p>

            {/* English Translation */}
            {ayah.englishText && (
              <p 
                className={cn(
                  'text-base md:text-lg text-foreground/90 leading-relaxed transition-all duration-700',
                  showContent 
                    ? 'opacity-100 translate-y-0 blur-0' 
                    : 'opacity-0 translate-y-6 blur-sm'
                )}
                style={{ transitionDelay: '0.3s' }}
                lang="en"
              >
                <span className="text-gold/60 text-xl mr-1">"</span>
                {ayah.englishText}
                <span className="text-gold/60 text-xl ml-1">"</span>
              </p>
            )}

            {/* Surah Reference */}
            <div 
              className={cn(
                'flex items-center gap-2 text-sm text-muted-foreground transition-all duration-700',
                showContent 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              )}
              style={{ transitionDelay: '0.5s' }}
              aria-label={`From ${surah?.englishName}, verse ${ayah.ayahNumber}`}
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
              <span className="font-arabic px-3 hover:text-gold transition-colors cursor-default" lang="ar">{surah?.name}</span>
              <span aria-hidden="true" className="text-gold">•</span>
              <span className="px-3 hover:text-gold transition-colors cursor-default">{surah?.englishName} {ayah.ayahNumber}</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            </div>
          </div>
        ) : null}
      </CardContent>

      {/* Bottom decorative glow - enhanced on hover */}
      <div 
        className={cn(
          'absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-500',
          isHovered ? 'w-full bg-gradient-to-r from-transparent via-gold/70 to-transparent' : 'w-3/4 bg-gradient-to-r from-transparent via-gold/50 to-transparent animate-pulse'
        )}
        aria-hidden="true"
      />
    </Card>
  );
}
