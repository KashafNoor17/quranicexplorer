import { Header, Footer } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettings } from '@/hooks/useQuran';
import { exportSettings, importSettings } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';
import { Download, Upload, Settings as SettingsIcon, Type, Volume2, CloudDownload, Database } from 'lucide-react';
import { OfflineDownloadManager } from '@/components/settings/OfflineDownloadManager';

const reciters = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy' },
  { id: 'ar.abdurrahmaansudais', name: 'Abdul Rahman Al-Sudais' },
  { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary' },
  { id: 'ar.minshawi', name: 'Mohamed Siddiq El-Minshawi' },
  { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit (Murattal)' },
];

export default function SettingsPage() {
  const { settings, updateSettings, isUpdating } = useSettings();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data = await exportSettings();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'quran-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: 'Settings exported',
        description: 'Your settings have been saved to a file.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export settings.',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importSettings(text);
      toast({
        title: 'Settings imported',
        description: 'Your settings have been restored.',
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'Invalid settings file format.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background geometric-pattern">
      <Header showBack title="Settings" />

      <main className="container px-4 py-8 md:px-6 md:py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 text-sm text-primary">
              <SettingsIcon className="h-4 w-4" />
              <span>Preferences</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Customize your Quran reading experience
            </p>
          </div>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Display
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Show Translations */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="translations">Show Translations</Label>
                  <p className="text-sm text-muted-foreground">
                    Display English and Urdu translations
                  </p>
                </div>
                <Switch
                  id="translations"
                  checked={settings.showTranslations}
                  onCheckedChange={(checked) => updateSettings({ showTranslations: checked })}
                />
              </div>

              {/* Font Size */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Arabic Font Size</Label>
                  <span className="text-sm text-muted-foreground">
                    {settings.fontSizePx}px
                  </span>
                </div>
                <Slider
                  value={[settings.fontSizePx]}
                  min={16}
                  max={48}
                  step={2}
                  onValueChange={([value]) => updateSettings({ fontSizePx: value })}
                />
                <p className="text-2xl font-arabic text-center mt-4" style={{ fontSize: settings.fontSizePx }}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label>Primary Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value: 'ar' | 'en' | 'ur') => updateSettings({ language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية (Arabic)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ur">اردو (Urdu)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Audio Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Audio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Reciter */}
              <div className="space-y-2">
                <Label>Reciter</Label>
                <Select
                  value={settings.preferredReciter}
                  onValueChange={(value) => updateSettings({ preferredReciter: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reciters.map((reciter) => (
                      <SelectItem key={reciter.id} value={reciter.id}>
                        {reciter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Playback Speed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Default Playback Speed</Label>
                  <span className="text-sm text-muted-foreground">
                    {settings.playbackSpeed}x
                  </span>
                </div>
                <Slider
                  value={[settings.playbackSpeed]}
                  min={0.5}
                  max={2}
                  step={0.25}
                  onValueChange={([value]) => updateSettings({ playbackSpeed: value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Offline Reading */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CloudDownload className="h-5 w-5" />
                Offline Reading
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Download surahs for offline reading. Once downloaded, you can read them without an internet connection.
              </p>
              <OfflineDownloadManager />
            </CardContent>
          </Card>

          {/* Preferences Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Preferences Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Export your display and audio preferences (font size, reciter, language, etc.) to back them up or transfer to another device.
              </p>
              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Preferences
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
