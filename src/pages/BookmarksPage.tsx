import { Link } from 'react-router-dom';
import { Header, Footer } from '@/components/layout/Header';
import { useBookmarks, surahData } from '@/hooks/useQuran';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bookmark, ArrowRight, Trash2, Download, Upload, FileJson, FileText } from 'lucide-react';
import { exportBookmarks, importBookmarks, getBookmarks } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';

// Constants for import validation
const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1MB max file size
const MAX_BOOKMARK_ROWS = 10000; // Maximum bookmarks to import

// Convert bookmarks to CSV format
function bookmarksToCSV(bookmarks: Array<{ surahNumber: number; ayahNumber: number; timestamp: string; notes?: string }>): string {
  const header = 'surah,verse,timestamp,notes';
  const rows = bookmarks.map(b => 
    `${b.surahNumber},${b.ayahNumber},${b.timestamp},"${(b.notes || '').replace(/"/g, '""')}"`
  );
  return [header, ...rows].join('\n');
}

// Validate CSV header
function validateCSVHeader(header: string): boolean {
  const expectedColumns = ['surah', 'verse', 'timestamp'];
  const columns = header.toLowerCase().split(',').map(c => c.trim());
  return expectedColumns.every(col => columns.includes(col));
}

// Parse and validate CSV to bookmarks
function csvToBookmarks(csv: string): { 
  bookmarks: Array<{ surahNumber: number; ayahNumber: number; timestamp: string; notes?: string }>; 
  errors: string[];
} {
  const errors: string[] = [];
  const lines = csv.trim().split('\n');
  
  if (lines.length < 2) {
    return { bookmarks: [], errors: ['CSV file is empty or has no data rows'] };
  }
  
  // Validate header
  if (!validateCSVHeader(lines[0])) {
    return { bookmarks: [], errors: ['Invalid CSV header. Expected columns: surah, verse, timestamp, notes'] };
  }
  
  // Check row count limit
  if (lines.length - 1 > MAX_BOOKMARK_ROWS) {
    return { bookmarks: [], errors: [`Too many rows. Maximum allowed: ${MAX_BOOKMARK_ROWS}`] };
  }
  
  const bookmarks: Array<{ surahNumber: number; ayahNumber: number; timestamp: string; notes?: string }> = [];
  
  // Parse data rows with validation
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parsing - handle quoted fields
    const parts = line.match(/(".*?"|[^,]+)/g) || [];
    
    const surahNumber = parseInt(parts[0]) || 0;
    const ayahNumber = parseInt(parts[1]) || 0;
    const timestamp = parts[2] || new Date().toISOString();
    const notes = parts[3]?.replace(/^"|"$/g, '').replace(/""/g, '"') || undefined;
    
    // Validate surah number (1-114)
    if (surahNumber < 1 || surahNumber > 114) {
      errors.push(`Row ${i + 1}: Invalid surah number (${surahNumber}). Must be 1-114.`);
      continue;
    }
    
    // Validate ayah number (positive integer, max reasonable limit)
    if (ayahNumber < 1 || ayahNumber > 286) { // Al-Baqarah has 286 ayahs (longest)
      errors.push(`Row ${i + 1}: Invalid ayah number (${ayahNumber}).`);
      continue;
    }
    
    bookmarks.push({ surahNumber, ayahNumber, timestamp, notes });
  }
  
  return { bookmarks, errors };
}

export default function BookmarksPage() {
  const { bookmarks, removeBookmark, isLoading } = useBookmarks();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = async () => {
    try {
      const data = await exportBookmarks();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'quran-bookmarks.json';
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: 'Bookmarks exported',
        description: 'Your bookmarks have been saved as JSON.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export bookmarks.',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      const allBookmarks = await getBookmarks();
      // Ensure proper typing for CSV conversion
      const typedBookmarks = allBookmarks.map(b => ({
        surahNumber: b.surahNumber ?? 1,
        ayahNumber: b.ayahNumber ?? 1,
        timestamp: b.timestamp ?? new Date().toISOString(),
        notes: undefined as string | undefined,
      }));
      const csv = bookmarksToCSV(typedBookmarks);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'quran-bookmarks.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: 'Bookmarks exported',
        description: 'Your bookmarks have been saved as CSV.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export bookmarks.',
        variant: 'destructive',
      });
    }
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importBookmarks(text);
      toast({
        title: 'Bookmarks imported',
        description: 'Your bookmarks have been restored from JSON.',
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'Invalid bookmark file format.',
        variant: 'destructive',
      });
    }
    // Reset input
    event.target.value = '';
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`,
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      const { bookmarks: parsedBookmarks, errors } = csvToBookmarks(text);
      
      if (errors.length > 0 && parsedBookmarks.length === 0) {
        throw new Error(errors[0]);
      }

      if (parsedBookmarks.length === 0) {
        throw new Error('No valid bookmarks found in the file');
      }

      // Convert to JSON format and import
      const jsonData = JSON.stringify({ bookmarks: parsedBookmarks });
      await importBookmarks(jsonData);
      
      const warningMsg = errors.length > 0 
        ? ` (${errors.length} rows skipped due to errors)` 
        : '';
      
      toast({
        title: 'Bookmarks imported',
        description: `${parsedBookmarks.length} bookmarks restored from CSV${warningMsg}.`,
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Invalid CSV file format.',
        variant: 'destructive',
      });
    }
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="min-h-screen bg-background geometric-pattern" role="main">
      <Header title="Bookmarks" />

      <main className="container px-4 py-8 md:px-6 md:py-12 animate-page-in">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Your Bookmarks
            </h1>
            <p className="text-muted-foreground">
              {bookmarks.length} saved {bookmarks.length === 1 ? 'verse' : 'verses'}
            </p>
          </div>
          
          <div className="flex items-center gap-2" role="group" aria-label="Bookmark actions">
            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
              aria-label="Import JSON file"
            />
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
              aria-label="Import CSV file"
            />
            
            {/* Import Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="transition-transform hover:scale-105 focus-ring"
                >
                  <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                  Import
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <FileJson className="h-4 w-4 mr-2" aria-hidden="true" />
                  Import JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => csvInputRef.current?.click()}>
                  <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                  Import CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={bookmarks.length === 0}
                  className="transition-transform hover:scale-105 focus-ring"
                >
                  <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportJSON}>
                  <FileJson className="h-4 w-4 mr-2" aria-hidden="true" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Bookmarks List */}
        {bookmarks.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="p-12 text-center">
              <Bookmark className="mx-auto h-16 w-16 text-muted-foreground mb-4" aria-hidden="true" />
              <h3 className="text-xl font-semibold mb-2">No bookmarks yet</h3>
              <p className="text-muted-foreground mb-6">
                Start reading and bookmark your favorite verses to find them quickly later.
              </p>
              <Link to="/">
                <Button variant="emerald" className="transition-transform hover:scale-105">
                  Explore Surahs
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 stagger-children" role="list" aria-label="Saved bookmarks">
            {bookmarks.map((bookmark) => {
              const surah = surahData.find(s => s.number === bookmark.surahNumber);
              const date = new Date(bookmark.timestamp);
              
              return (
                <Card 
                  key={`${bookmark.surahNumber}-${bookmark.ayahNumber}`} 
                  variant="surah"
                  className="transition-transform hover:scale-[1.01]"
                  role="listitem"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="ayah-badge shrink-0" aria-label={`Verse ${bookmark.ayahNumber}`}>
                        {bookmark.ayahNumber}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {surah?.englishName}
                          </span>
                          <span className="font-arabic text-primary" lang="ar">
                            {surah?.name}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <time dateTime={date.toISOString()}>Saved {date.toLocaleDateString()}</time>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBookmark({
                            surahNumber: bookmark.surahNumber,
                            ayahNumber: bookmark.ayahNumber,
                          })}
                          aria-label={`Remove bookmark for ${surah?.englishName} verse ${bookmark.ayahNumber}`}
                          className="transition-transform hover:scale-105 focus-ring"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                        </Button>
                        <Link to={`/surah/${bookmark.surahNumber}?ayah=${bookmark.ayahNumber}`}>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="transition-transform hover:scale-105 focus-ring"
                            aria-label={`Go to ${surah?.englishName} verse ${bookmark.ayahNumber}`}
                          >
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
