import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface WordAnalysisProps {
  arabicWord: string;
  transliteration?: string;
  meaning?: string;
  root?: string;
  isOpen: boolean;
  onClose: () => void;
}

// Basic transliteration map for common Arabic letters
const transliterationMap: Record<string, string> = {
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
  'ب': 'b', 'ت': 't', 'ث': 'th',
  'ج': 'j', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
  'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd',
  'ط': 't', 'ظ': 'z', 'ع': "'", 'غ': 'gh',
  'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l',
  'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
  'ي': 'y', 'ى': 'a', 'ة': 'h',
  'ء': "'", 'ئ': "'", 'ؤ': "'",
  // Diacritics
  'َ': 'a', 'ُ': 'u', 'ِ': 'i',
  'ً': 'an', 'ٌ': 'un', 'ٍ': 'in',
  'ّ': '', 'ْ': '', 'ٰ': 'a',
};

function basicTransliterate(arabicWord: string): string {
  return arabicWord
    .split('')
    .map(char => transliterationMap[char] || char)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

export function WordAnalysisDialog({
  arabicWord,
  transliteration,
  meaning,
  root,
  isOpen,
  onClose,
}: WordAnalysisProps) {
  const displayTransliteration = transliteration || basicTransliterate(arabicWord);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Word Analysis</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Arabic Word */}
          <div className="text-center">
            <p 
              className="text-4xl font-arabic leading-loose text-primary mb-2"
              dir="rtl"
              lang="ar"
            >
              {arabicWord}
            </p>
            <Badge variant="outline" className="text-sm">
              {displayTransliteration}
            </Badge>
          </div>

          {/* Word Details */}
          <div className="space-y-3">
            {meaning && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Meaning
                </p>
                <p className="text-foreground">{meaning}</p>
              </div>
            )}
            
            {root && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Root
                </p>
                <p className="font-arabic text-lg text-foreground" dir="rtl">
                  {root}
                </p>
              </div>
            )}

            {!meaning && !root && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Detailed word analysis coming soon. This feature will include morphological 
                breakdown, root analysis, and grammatical information.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ClickableArabicTextProps {
  text: string;
  fontSize: number;
  className?: string;
}

export function ClickableArabicText({ text, fontSize, className }: ClickableArabicTextProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  
  // Split Arabic text into words
  const words = text.split(/\s+/);

  return (
    <>
      <p
        className={className}
        style={{ fontSize: `${fontSize}px` }}
        dir="rtl"
        lang="ar"
      >
        {words.map((word, index) => (
          <span key={index}>
            <button
              type="button"
              onClick={() => setSelectedWord(word)}
              className="hover:text-primary hover:bg-primary/10 rounded px-1 transition-colors cursor-pointer focus-ring"
              aria-label={`Analyze word: ${word}`}
            >
              {word}
            </button>
            {index < words.length - 1 && ' '}
          </span>
        ))}
      </p>

      <WordAnalysisDialog
        arabicWord={selectedWord || ''}
        isOpen={!!selectedWord}
        onClose={() => setSelectedWord(null)}
      />
    </>
  );
}
