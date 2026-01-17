import { useState } from 'react';
import { Link } from 'react-router-dom';
import { surahData } from '@/hooks/useQuran';
import { Card, CardContent } from '@/components/ui/card';
import { useOfflineStatus } from '@/hooks/useQuran';
import { Check, BookOpen, CloudDownload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Surah } from '@/lib/schemas';

interface SurahCardProps {
  surah: Surah;
  isCached?: boolean;
  index: number;
}

function SurahCard({ surah, isCached, index }: SurahCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link 
      to={`/surah/${surah.number}`}
      className="block focus-ring rounded-xl"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <Card 
        variant="surah" 
        className={cn(
          'group h-full transition-all duration-500 ease-out',
          'hover:shadow-lg hover:shadow-primary/10',
          'hover:-translate-y-1 hover:scale-[1.02]',
          isHovered && 'border-primary/30'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="flex items-center gap-4 p-4 relative overflow-hidden">
          {/* Animated background gradient on hover */}
          <div 
            className={cn(
              'absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-gold/5',
              'transition-opacity duration-500',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
            aria-hidden="true"
          />

          {/* Surah Number */}
          <div 
            className={cn(
              'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
              'bg-gradient-to-br from-primary/10 to-emerald-light/10',
              'text-lg font-bold text-primary',
              'transition-all duration-500 ease-out',
              'group-hover:from-primary group-hover:to-emerald-light group-hover:text-primary-foreground',
              'group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg'
            )}
          >
            <span className={cn(
              'transition-transform duration-300',
              isHovered && 'scale-110'
            )}>
              {surah.number}
            </span>
            
            {/* Glow effect on hover */}
            <div 
              className={cn(
                'absolute inset-0 rounded-xl bg-primary/20 blur-md transition-opacity duration-300',
                isHovered ? 'opacity-100' : 'opacity-0'
              )}
              aria-hidden="true"
            />
          </div>

          {/* Surah Info */}
          <div className="flex-1 min-w-0 relative z-10">
            <div className="flex items-center gap-2">
              <h3 
                className={cn(
                  'font-semibold text-foreground truncate transition-all duration-300',
                  'group-hover:text-primary'
                )}
              >
                {surah.englishName}
              </h3>
              {isCached && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/15 shrink-0 animate-bounce-in">
                        <CloudDownload className="h-3 w-3 text-primary" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Available offline
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p 
              className={cn(
                'text-xs text-muted-foreground transition-all duration-300',
                'group-hover:text-muted-foreground/80'
              )}
            >
              {surah.ayahCount} Ayahs • {surah.revelationPlace}
            </p>
          </div>

          {/* Arabic Name - with hover animation */}
          <div className="text-right shrink-0 relative z-10">
            <div className="relative">
              <p 
                className={cn(
                  'font-arabic text-xl text-primary transition-all duration-500',
                  'group-hover:text-gold group-hover:scale-110',
                  isHovered && 'animate-arabic-glow'
                )}
              >
                {surah.name}
              </p>
              
              {/* Underline animation */}
              <div 
                className={cn(
                  'absolute -bottom-1 left-0 right-0 h-0.5 rounded-full',
                  'bg-gradient-to-r from-transparent via-gold to-transparent',
                  'transition-all duration-500 origin-center',
                  isHovered ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                )}
                aria-hidden="true"
              />
            </div>
            <p 
              className={cn(
                'text-xs text-muted-foreground mt-1 transition-all duration-300',
                'group-hover:text-gold/70'
              )}
            >
              {surah.englishNameTranslation}
            </p>
          </div>

          {/* Hover indicator icon */}
          <div 
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2',
              'transition-all duration-300',
              isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
            )}
            aria-hidden="true"
          >
            <BookOpen className="h-4 w-4 text-primary/50" />
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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
      {filteredSurahs.map((surah, index) => (
        <SurahCard
          key={surah.number}
          surah={surah}
          isCached={isSurahCached(surah.number)}
          index={index}
        />
      ))}
    </div>
  );
}
