import { Link } from 'react-router-dom';
import { useProgress, surahData } from '@/hooks/useQuran';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';

export function ContinueReading() {
  const { progress } = useProgress();

  if (!progress?.lastRead) {
    return null;
  }

  const { surahNumber, ayahNumber } = progress.lastRead;
  const surah = surahData.find(s => s.number === surahNumber);

  if (!surah) return null;

  return (
    <Card variant="feature" className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-light shadow-soft">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">Continue Reading</h3>
            <p className="text-sm text-muted-foreground">
              {surah.englishName} • Ayah {ayahNumber}
            </p>
          </div>

          <Link to={`/surah/${surahNumber}?ayah=${ayahNumber}`}>
            <Button variant="gold" size="sm">
              Resume
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
