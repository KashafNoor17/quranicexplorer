import { Link } from 'react-router-dom';
import { surahData } from '@/hooks/useQuran';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOfflineStatus } from '@/hooks/useQuran';
import { WifiOff, Check } from 'lucide-react';
import type { Surah } from '@/lib/schemas';

interface SurahCardProps {
  surah: Surah;
  isCached?: boolean;
}

function SurahCard({ surah, isCached }: SurahCardProps) {
  return (
    <Link to={`/surah/${surah.number}`}>
      <Card variant="surah" className="group h-full">
        <CardContent className="flex items-center gap-4 p-4">
          {/* Surah Number */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-emerald-light/10 text-lg font-bold text-primary transition-all group-hover:from-primary group-hover:to-emerald-light group-hover:text-primary-foreground">
            {surah.number}
          </div>

          {/* Surah Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">
                {surah.englishName}
              </h3>
              {isCached && (
                <Check className="h-3 w-3 text-primary shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {surah.ayahCount} Ayahs • {surah.revelationPlace}
            </p>
          </div>

          {/* Arabic Name */}
          <div className="text-right shrink-0">
            <p className="font-arabic text-xl text-primary">{surah.name}</p>
            <p className="text-xs text-muted-foreground">
              {surah.englishNameTranslation}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface SurahListProps {
  selectedJuz?: number;
}

export function SurahList({ selectedJuz }: SurahListProps) {
  const { isSurahCached } = useOfflineStatus();

  const filteredSurahs = selectedJuz
    ? surahData.filter(s => s.juzNumbers.includes(selectedJuz))
    : surahData;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {filteredSurahs.map((surah) => (
        <SurahCard
          key={surah.number}
          surah={surah}
          isCached={isSurahCached(surah.number)}
        />
      ))}
    </div>
  );
}
