import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Book, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TafsirEntry {
  source: string;
  author: string;
  commentary: string;
}

interface TafsirPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
}

// Mock tafsir data - In production, this would come from an API
async function fetchTafsir(surahNumber: number, ayahNumber: number): Promise<TafsirEntry[]> {
  // Simulated API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return mock tafsir data
  return [
    {
      source: 'Ibn Kathir',
      author: 'Ismail ibn Umar ibn Kathir',
      commentary: `This verse (${surahNumber}:${ayahNumber}) provides profound guidance for believers. Ibn Kathir explains that this ayah emphasizes the importance of faith and righteous action in the life of a Muslim. The context reveals deeper meanings about trust in Allah and the rewards promised to those who follow His guidance.`,
    },
    {
      source: 'Al-Jalalayn',
      author: 'Jalal ad-Din al-Mahalli & Jalal ad-Din as-Suyuti',
      commentary: `The two Jalals provide a concise interpretation of this ayah. They note that the verse addresses fundamental aspects of Islamic belief and practice, connecting the guidance given here to other passages in the Quran that reinforce similar themes.`,
    },
    {
      source: 'Al-Tabari',
      author: 'Muhammad ibn Jarir al-Tabari',
      commentary: `Al-Tabari's comprehensive tafsir draws upon numerous traditions and early scholarly opinions to explain this verse. He presents various interpretations while emphasizing the consensus understanding of the early Muslim community regarding its meaning and application.`,
    },
  ];
}

export function TafsirPanel({
  open,
  onOpenChange,
  surahNumber,
  ayahNumber,
  arabicText,
}: TafsirPanelProps) {
  const [tafsir, setTafsir] = useState<TafsirEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && surahNumber && ayahNumber) {
      setIsLoading(true);
      setError(null);
      
      fetchTafsir(surahNumber, ayahNumber)
        .then(setTafsir)
        .catch(() => setError('Failed to load tafsir. Please try again.'))
        .finally(() => setIsLoading(false));
    }
  }, [open, surahNumber, ayahNumber]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-lg"
        aria-describedby="tafsir-description"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" aria-hidden="true" />
            Tafsir Commentary
          </SheetTitle>
          <SheetDescription id="tafsir-description">
            Surah {surahNumber}, Ayah {ayahNumber}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          {/* Arabic Text */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border mb-4">
            <p 
              className="text-xl font-arabic text-right leading-loose text-foreground"
              lang="ar"
              dir="rtl"
            >
              {arabicText}
            </p>
          </div>

          {/* Tafsir Content */}
          <ScrollArea className="h-[calc(100vh-280px)]">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-muted-foreground mt-3">Loading tafsir...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {!isLoading && !error && tafsir.length > 0 && (
              <div className="space-y-4 pr-4">
                {tafsir.map((entry, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-lg border border-border",
                      "hover:border-primary/30 transition-colors"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <Badge variant="secondary" className="mb-1">
                          {entry.source}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <User className="h-3 w-3" aria-hidden="true" />
                          <span>{entry.author}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {entry.commentary}
                    </p>
                  </div>
                ))}

                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">
                    📖 Tafsir sources are for educational purposes.
                    <br />
                    Always consult qualified scholars for detailed understanding.
                  </p>
                </div>
              </div>
            )}

            {!isLoading && !error && tafsir.length === 0 && (
              <div className="text-center py-8">
                <Book className="h-12 w-12 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  No tafsir available for this verse.
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}