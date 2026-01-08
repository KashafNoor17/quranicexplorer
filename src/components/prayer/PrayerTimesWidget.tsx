import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MapPin, RefreshCw, Bell, BellOff, Clock, Sun, Sunrise, Sunset, Moon, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface PrayerTimesError {
  error: string;
}

const PRAYER_ICONS = {
  Fajr: Sunrise,
  Sunrise: Sun,
  Dhuhr: Sun,
  Asr: Sun,
  Maghrib: Sunset,
  Isha: Moon,
};

const PRAYER_NAMES_AR = {
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

// Public domain Azan audio URL
const AZAN_AUDIO_URL = 'https://www.islamcan.com/audio/adhan/azan1.mp3';
const AZAN_FAJR_AUDIO_URL = 'https://www.islamcan.com/audio/adhan/azan1.mp3';

// Storage keys
const NOTIFICATIONS_KEY = 'prayer-notifications-enabled';
const AZAN_KEY = 'prayer-azan-enabled';
const PLAYED_PRAYERS_KEY = 'played-prayers-today';

async function fetchPrayerTimes(coords: Coordinates): Promise<PrayerTimes | PrayerTimesError> {
  try {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const response = await fetch(
      `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${coords.latitude}&longitude=${coords.longitude}&method=2`
    );

    if (!response.ok) {
      return { error: 'Failed to fetch prayer times' };
    }

    const data = await response.json();
    const timings = data.data.timings;

    return {
      Fajr: timings.Fajr,
      Sunrise: timings.Sunrise,
      Dhuhr: timings.Dhuhr,
      Asr: timings.Asr,
      Maghrib: timings.Maghrib,
      Isha: timings.Isha,
    };
  } catch {
    return { error: 'Network error. Please try again.' };
  }
}

function getNextPrayer(prayerTimes: PrayerTimes): { name: string; time: string; isNext: boolean; minutes: number }[] {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const prayers = Object.entries(prayerTimes).map(([name, time]) => {
    const [hours, minutes] = time.split(':').map(Number);
    const prayerMinutes = hours * 60 + minutes;
    return { name, time, minutes: prayerMinutes };
  });

  // Find the next prayer
  let nextPrayerIndex = prayers.findIndex(p => p.minutes > currentMinutes);
  if (nextPrayerIndex === -1) nextPrayerIndex = 0; // Next day's Fajr

  return prayers.map((p, i) => ({
    name: p.name,
    time: p.time,
    minutes: p.minutes,
    isNext: i === nextPrayerIndex,
  }));
}

function formatTimeUntil(targetTime: string): string {
  const now = new Date();
  const [hours, minutes] = targetTime.split(':').map(Number);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const diff = target.getTime() - now.getTime();
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }
  return `${diffMinutes}m`;
}

// Get today's date string for tracking played prayers
function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

// Get played prayers from localStorage
function getPlayedPrayers(): Set<string> {
  try {
    const stored = localStorage.getItem(PLAYED_PRAYERS_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === getTodayKey()) {
        return new Set(data.prayers);
      }
    }
  } catch {
    // Ignore errors
  }
  return new Set();
}

// Save played prayer to localStorage
function markPrayerPlayed(prayerName: string): void {
  try {
    const played = getPlayedPrayers();
    played.add(prayerName);
    localStorage.setItem(PLAYED_PRAYERS_KEY, JSON.stringify({
      date: getTodayKey(),
      prayers: Array.from(played),
    }));
  } catch {
    // Ignore errors
  }
}

export function PrayerTimesWidget() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      return localStorage.getItem(NOTIFICATIONS_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [azanEnabled, setAzanEnabled] = useState(() => {
    try {
      return localStorage.getItem(AZAN_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const [isPlayingAzan, setIsPlayingAzan] = useState(false);
  
  const azanAudioRef = useRef<HTMLAudioElement | null>(null);
  const checkIntervalRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Initialize audio element
  useEffect(() => {
    azanAudioRef.current = new Audio();
    azanAudioRef.current.preload = 'none';
    
    return () => {
      if (azanAudioRef.current) {
        azanAudioRef.current.pause();
        azanAudioRef.current = null;
      }
    };
  }, []);

  // Play Azan audio
  const playAzan = useCallback((prayerName: string) => {
    if (!azanAudioRef.current || !azanEnabled) return;
    
    // Check if already played today for this prayer
    const played = getPlayedPrayers();
    if (played.has(prayerName)) return;

    const audioUrl = prayerName === 'Fajr' ? AZAN_FAJR_AUDIO_URL : AZAN_AUDIO_URL;
    azanAudioRef.current.src = audioUrl;
    setIsPlayingAzan(true);
    
    azanAudioRef.current.play()
      .then(() => {
        markPrayerPlayed(prayerName);
        toast({
          title: `🕌 ${prayerName} Prayer Time`,
          description: `It's time for ${prayerName} prayer. ${PRAYER_NAMES_AR[prayerName as keyof typeof PRAYER_NAMES_AR]}`,
        });
      })
      .catch((err) => {
        console.error('Failed to play Azan:', err);
        setIsPlayingAzan(false);
      });
    
    azanAudioRef.current.onended = () => {
      setIsPlayingAzan(false);
    };
  }, [azanEnabled, toast]);

  // Stop Azan
  const stopAzan = useCallback(() => {
    if (azanAudioRef.current) {
      azanAudioRef.current.pause();
      azanAudioRef.current.currentTime = 0;
      setIsPlayingAzan(false);
    }
  }, []);

  // Show browser notification
  const showNotification = useCallback((prayerName: string, time: string) => {
    if (!notificationsEnabled || Notification.permission !== 'granted') return;
    
    const played = getPlayedPrayers();
    if (played.has(`notif-${prayerName}`)) return;
    
    try {
      new Notification(`🕌 ${prayerName} Prayer Time`, {
        body: `It's ${time} - time for ${prayerName} prayer`,
        icon: '/favicon.ico',
        tag: `prayer-${prayerName}`,
        requireInteraction: true,
      });
      markPrayerPlayed(`notif-${prayerName}`);
    } catch (err) {
      console.error('Failed to show notification:', err);
    }
  }, [notificationsEnabled]);

  // Check prayer times and trigger alerts
  useEffect(() => {
    if (!prayerTimes || (!notificationsEnabled && !azanEnabled)) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    const checkPrayerTime = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const currentSeconds = now.getSeconds();
      
      // Only check at the start of each minute
      if (currentSeconds > 5) return;

      const prayers = getNextPrayer(prayerTimes);
      
      for (const prayer of prayers) {
        // Skip Sunrise - it's not a prayer time for Azan
        if (prayer.name === 'Sunrise') continue;
        
        // Check if current time matches prayer time (within 1 minute window)
        if (Math.abs(prayer.minutes - currentMinutes) <= 1) {
          if (azanEnabled) {
            playAzan(prayer.name);
          }
          if (notificationsEnabled) {
            showNotification(prayer.name, prayer.time);
          }
          break;
        }
      }
    };

    // Check immediately
    checkPrayerTime();
    
    // Check every 30 seconds
    checkIntervalRef.current = window.setInterval(checkPrayerTime, 30000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [prayerTimes, notificationsEnabled, azanEnabled, playAzan, showNotification]);

  const fetchLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(coords);

        // Fetch location name using reverse geocoding
        try {
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
          );
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            setLocationName(geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Your Location');
          }
        } catch {
          setLocationName('Your Location');
        }

        const times = await fetchPrayerTimes(coords);
        if ('error' in times) {
          setError(times.error);
        } else {
          setPrayerTimes(times);
        }
        setIsLoading(false);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission denied. Please enable location access.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information unavailable.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('An unknown error occurred.');
        }
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  const toggleNotifications = useCallback(async () => {
    if (!('Notification' in window)) {
      setError('Notifications are not supported by your browser');
      return;
    }

    if (!notificationsEnabled) {
      if (Notification.permission === 'denied') {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive',
        });
        return;
      }

      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast({
            title: 'Permission Required',
            description: 'Notification permission is required for prayer alerts.',
            variant: 'destructive',
          });
          return;
        }
      }
    }

    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem(NOTIFICATIONS_KEY, String(newValue));
    
    toast({
      title: newValue ? 'Notifications Enabled' : 'Notifications Disabled',
      description: newValue 
        ? 'You will receive alerts when prayer time arrives.' 
        : 'Prayer time notifications have been turned off.',
    });
  }, [notificationsEnabled, toast]);

  const toggleAzan = useCallback(() => {
    if (isPlayingAzan) {
      stopAzan();
      return;
    }
    
    const newValue = !azanEnabled;
    setAzanEnabled(newValue);
    localStorage.setItem(AZAN_KEY, String(newValue));
    
    toast({
      title: newValue ? '🔊 Azan Sound Enabled' : '🔇 Azan Sound Disabled',
      description: newValue 
        ? 'Azan will play automatically at prayer times.' 
        : 'Azan sounds have been turned off.',
    });
    
    // Play a short preview if enabling
    if (newValue && azanAudioRef.current) {
      azanAudioRef.current.src = AZAN_AUDIO_URL;
      azanAudioRef.current.volume = 0.5;
      azanAudioRef.current.play()
        .then(() => {
          setTimeout(() => {
            if (azanAudioRef.current) {
              azanAudioRef.current.pause();
              azanAudioRef.current.currentTime = 0;
              azanAudioRef.current.volume = 1;
            }
          }, 3000); // Play 3 second preview
        })
        .catch(() => {
          toast({
            title: 'Audio Error',
            description: 'Could not play Azan. Please check your browser settings.',
            variant: 'destructive',
          });
        });
    }
  }, [azanEnabled, isPlayingAzan, stopAzan, toast]);

  // Update countdown timer
  useEffect(() => {
    if (!prayerTimes) return;

    const updateCountdown = () => {
      const prayers = getNextPrayer(prayerTimes);
      const nextPrayer = prayers.find(p => p.isNext);
      if (nextPrayer) {
        setTimeUntilNext(formatTimeUntil(nextPrayer.time));
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [prayerTimes]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const prayers = prayerTimes ? getNextPrayer(prayerTimes) : [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-emerald-light/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
            Prayer Times
          </CardTitle>
          <div className="flex items-center gap-1">
            {/* Azan Sound Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAzan}
              className={cn(
                "h-8 w-8 transition-all",
                isPlayingAzan && "animate-pulse"
              )}
              aria-label={isPlayingAzan ? 'Stop Azan' : azanEnabled ? 'Disable Azan sound' : 'Enable Azan sound'}
            >
              {isPlayingAzan ? (
                <VolumeX className="h-4 w-4 text-primary" />
              ) : azanEnabled ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            
            {/* Notification Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleNotifications}
              className="h-8 w-8"
              aria-label={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
            >
              {notificationsEnabled ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            
            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchLocation}
              disabled={isLoading}
              className="h-8 w-8"
              aria-label="Refresh prayer times"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
        {locationName && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            <span>{locationName}</span>
            {(notificationsEnabled || azanEnabled) && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {azanEnabled && notificationsEnabled ? 'Azan + Alerts' : azanEnabled ? 'Azan' : 'Alerts'}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading && !prayerTimes && (
          <div className="flex flex-col items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground mt-2">Fetching prayer times...</p>
          </div>
        )}

        {error && !prayerTimes && (
          <div className="text-center py-6">
            <p className="text-sm text-destructive mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchLocation}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {prayerTimes && (
          <div className="space-y-2">
            {prayers.map(({ name, time, isNext }) => {
              const Icon = PRAYER_ICONS[name as keyof typeof PRAYER_ICONS];
              const arabicName = PRAYER_NAMES_AR[name as keyof typeof PRAYER_NAMES_AR];
              
              return (
                <div
                  key={name}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg transition-all",
                    isNext 
                      ? "bg-primary/10 border border-primary/20 shadow-sm" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isNext ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "h-4 w-4",
                        isNext ? "text-primary" : "text-muted-foreground"
                      )} aria-hidden="true" />
                    </div>
                    <div>
                      <p className={cn(
                        "font-medium",
                        isNext && "text-primary"
                      )}>
                        {name}
                      </p>
                      <p className="text-xs text-muted-foreground font-arabic" lang="ar">
                        {arabicName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-mono text-sm",
                      isNext ? "text-primary font-semibold" : "text-foreground"
                    )}>
                      {time}
                    </span>
                    {isNext && (
                      <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                        in {timeUntilNext}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Azan playing indicator */}
        {isPlayingAzan && (
          <div className="mt-4 p-3 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-gold" />
              <span className="text-sm font-medium text-gold">Playing Azan...</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={stopAzan}
              className="text-gold hover:text-gold/80"
            >
              Stop
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}