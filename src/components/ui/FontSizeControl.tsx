import { Button } from '@/components/ui/button';
import { Minus, Plus, Type } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';

interface FontSizeControlProps {
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  min?: number;
  max?: number;
}

export function FontSizeControl({
  fontSize,
  onFontSizeChange,
  min = 16,
  max = 48,
}: FontSizeControlProps) {
  const handleDecrease = () => {
    onFontSizeChange(Math.max(min, fontSize - 2));
  };

  const handleIncrease = () => {
    onFontSizeChange(Math.min(max, fontSize + 2));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 focus-ring"
          aria-label={`Font size: ${fontSize}px. Click to adjust.`}
        >
          <Type className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{fontSize}px</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" id="font-size-label">
              Arabic Font Size
            </label>
            <span className="text-sm text-muted-foreground tabular-nums">
              {fontSize}px
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrease}
              disabled={fontSize <= min}
              className="h-8 w-8 shrink-0 focus-ring"
              aria-label="Decrease font size"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </Button>
            
            <Slider
              value={[fontSize]}
              min={min}
              max={max}
              step={2}
              onValueChange={([value]) => onFontSizeChange(value)}
              className="flex-1"
              aria-labelledby="font-size-label"
            />
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrease}
              disabled={fontSize >= max}
              className="h-8 w-8 shrink-0 focus-ring"
              aria-label="Increase font size"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Preview */}
          <div className="pt-2 border-t border-border">
            <p 
              className="font-arabic text-center text-primary transition-all"
              style={{ fontSize: `${fontSize}px` }}
              lang="ar"
              dir="rtl"
            >
              بِسْمِ اللَّهِ
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
