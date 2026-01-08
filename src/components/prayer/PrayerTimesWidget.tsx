import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MapPin, RefreshCw, Bell, BellOff, Clock, Sun, Sunrise, Sunset, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
}

function getNextPrayer(prayerTimes: PrayerTimes): { name: string; time: string; isNext: boolean }[] {
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

export function PrayerTimesWidget() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');

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

    if (Notification.permission === 'denied') {
      setError('Notification permission denied');
      return;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Notification permission denied');
        return;
      }
    }

    setNotificationsEnabled(!notificationsEnabled);
  }, [notificationsEnabled]);

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
          <div className="flex items-center gap-2">
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
      </CardContent>
    </Card>
  );
}