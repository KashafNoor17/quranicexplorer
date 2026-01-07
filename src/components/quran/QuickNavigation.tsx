import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { surahData } from '@/hooks/useQuran';
import { Navigation, ArrowRight } from 'lucide-react';

export function QuickNavigation() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState<string>('');
  const [ayahNumber, setAyahNumber] = useState<string>('');

  const selectedSurahData = selectedSurah 
    ? surahData.find(s => s.number === parseInt(selectedSurah))
    : null;

  const handleNavigate = () => {
    if (!selectedSurah) return;
    
    const ayah = ayahNumber && parseInt(ayahNumber) > 0 ? parseInt(ayahNumber) : 1;
    const maxAyah = selectedSurahData?.ayahCount || 1;
    const validAyah = Math.min(Math.max(1, ayah), maxAyah);
    
    navigate(`/surah/${selectedSurah}?ayah=${validAyah}`);
    setIsOpen(false);
    setSelectedSurah('');
    setAyahNumber('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 focus-ring"
          aria-label="Quick navigation to any Surah and Ayah"
        >
          <Navigation className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Jump to Ayah</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" aria-describedby="navigation-description">
        <DialogHeader>
          <DialogTitle>Quick Navigation</DialogTitle>
        </DialogHeader>
        <p id="navigation-description" className="text-sm text-muted-foreground mb-4">
          Jump directly to any Surah and Ayah
        </p>
        
        <div className="space-y-4">
          {/* Surah Selection */}
          <div className="space-y-2">
            <label htmlFor="surah-select" className="text-sm font-medium">
              Select Surah
            </label>
            <Select value={selectedSurah} onValueChange={setSelectedSurah}>
              <SelectTrigger id="surah-select" className="w-full focus-ring">
                <SelectValue placeholder="Choose a Surah..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {surahData.map((surah) => (
                  <SelectItem key={surah.number} value={surah.number.toString()}>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold">{surah.number}.</span>
                      <span>{surah.englishName}</span>
                      <span className="font-arabic text-muted-foreground">{surah.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ayah Number Input */}
          <div className="space-y-2">
            <label htmlFor="ayah-input" className="text-sm font-medium">
              Ayah Number {selectedSurahData && (
                <span className="text-muted-foreground">(1-{selectedSurahData.ayahCount})</span>
              )}
            </label>
            <Input
              id="ayah-input"
              type="number"
              min={1}
              max={selectedSurahData?.ayahCount || 999}
              value={ayahNumber}
              onChange={(e) => setAyahNumber(e.target.value)}
              placeholder="Enter ayah number (optional)"
              className="focus-ring"
              aria-describedby={selectedSurahData ? "ayah-range" : undefined}
            />
            {selectedSurahData && (
              <p id="ayah-range" className="sr-only">
                Valid range: 1 to {selectedSurahData.ayahCount}
              </p>
            )}
          </div>

          {/* Navigate Button */}
          <Button
            onClick={handleNavigate}
            disabled={!selectedSurah}
            className="w-full gap-2"
            aria-label={
              selectedSurah 
                ? `Navigate to ${selectedSurahData?.englishName}${ayahNumber ? `, Ayah ${ayahNumber}` : ''}`
                : 'Select a Surah first'
            }
          >
            Go to Ayah
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
