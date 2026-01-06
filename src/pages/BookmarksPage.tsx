import { Link } from 'react-router-dom';
import { Header, Footer } from '@/components/layout/Header';
import { useBookmarks, surahData } from '@/hooks/useQuran';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, ArrowRight, Trash2, Download, Upload } from 'lucide-react';
import { exportBookmarks, importBookmarks } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';

export default function BookmarksPage() {
  const { bookmarks, removeBookmark, isLoading } = useBookmarks();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
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
        description: 'Your bookmarks have been saved to a file.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export bookmarks.',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importBookmarks(text);
      toast({
        title: 'Bookmarks imported',
        description: 'Your bookmarks have been restored.',
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'Invalid bookmark file format.',
        variant: 'destructive',
      });
    }
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
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="transition-transform hover:scale-105 focus-ring"
              aria-label="Import bookmarks from file"
            >
              <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
              Import
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              disabled={bookmarks.length === 0}
              className="transition-transform hover:scale-105 focus-ring"
              aria-label="Export bookmarks to file"
            >
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Export
            </Button>
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
