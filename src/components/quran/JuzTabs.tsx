import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { juzData } from '@/lib/quranData';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface JuzTabsProps {
  selectedJuz: number | null;
  onSelectJuz: (juz: number | null) => void;
}

export function JuzTabs({ selectedJuz, onSelectJuz }: JuzTabsProps) {
  return (
    <div className="relative">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-3">
          {/* All button */}
          <Button
            variant={selectedJuz === null ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onSelectJuz(null)}
            className={cn(
              'shrink-0 transition-all',
              selectedJuz === null && 'emerald-glow'
            )}
          >
            All Surahs
          </Button>

          {/* Juz buttons */}
          {juzData.map((juz) => (
            <Button
              key={juz.number}
              variant={selectedJuz === juz.number ? 'gold' : 'ghost'}
              size="sm"
              onClick={() => onSelectJuz(juz.number)}
              className="shrink-0"
            >
              Juz {juz.number}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
