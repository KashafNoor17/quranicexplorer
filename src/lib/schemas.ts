import { z } from 'zod';

// Canonical Surah Schema
export const SurahSchema = z.object({
  number: z.number().int().min(1).max(114),
  name: z.string().min(1),
  englishName: z.string().min(1),
  englishNameTranslation: z.string().optional(),
  ayahCount: z.number().int().min(1),
  revelationPlace: z.enum(['Mecca', 'Medina']),
  juzNumbers: z.array(z.number().int().min(1).max(30)),
});

export type Surah = z.infer<typeof SurahSchema>;

// Canonical Ayah Schema
export const AyahSchema = z.object({
  surahNumber: z.number().int().min(1).max(114),
  ayahNumber: z.number().int().min(1),
  globalAyahNumber: z.number().int().min(1).max(6236),
  arabicText: z.string().min(1),
  englishText: z.string().optional(),
  urduText: z.string().optional(),
  audioUrl: z.string().url().optional(),
  juzNumber: z.number().int().min(1).max(30),
  pageNumber: z.number().int().optional(),
});

export type Ayah = z.infer<typeof AyahSchema>;

// Bookmark Schema
export const BookmarkSchema = z.object({
  surahNumber: z.number().int().min(1).max(114),
  ayahNumber: z.number().int().min(1),
  timestamp: z.string().datetime(),
});

export type Bookmark = z.infer<typeof BookmarkSchema>;

export const BookmarksArraySchema = z.object({
  bookmarks: z.array(BookmarkSchema),
});

// Progress Schema
export const ProgressSchema = z.object({
  perSurahProgress: z.record(z.string(), z.number().int().min(0).max(100)),
  overallCompletion: z.number().int().min(0).max(100),
  lastRead: z.object({
    surahNumber: z.number().int().min(1).max(114),
    ayahNumber: z.number().int().min(1),
    timestamp: z.string().datetime(),
  }).optional(),
});

export type Progress = z.infer<typeof ProgressSchema>;

// Settings Schema
export const SettingsSchema = z.object({
  language: z.enum(['ar', 'en', 'ur']).default('en'),
  showTranslations: z.boolean().default(true),
  fontSizePx: z.number().int().min(12).max(48).default(24),
  theme: z.enum(['light', 'dark']).default('light'),
  preferredReciter: z.string().default('ar.alafasy'),
  playbackSpeed: z.number().min(0.5).max(2).default(1),
}).passthrough().refine(
  (data) => {
    const customKeys = Object.keys(data).filter(k => 
      !['language', 'showTranslations', 'fontSizePx', 'theme', 'preferredReciter', 'playbackSpeed'].includes(k)
    );
    return customKeys.every(k => k.startsWith('custom_'));
  },
  { message: 'Extension fields must be namespaced with custom_*' }
);

export type Settings = z.infer<typeof SettingsSchema>;

// Error Schema
export const ErrorSchema = z.object({
  errorCode: z.string(),
  message: z.string(),
  details: z.any().nullable(),
  recoverable: z.boolean(),
});

export type AppError = z.infer<typeof ErrorSchema>;

// Search Results Schema
export const SearchResultSchema = z.object({
  surahNumber: z.number().int().min(1).max(114),
  ayahNumber: z.number().int().min(1),
  globalAyahNumber: z.number().int().min(1).max(6236),
  snippet: z.string(),
});

export const SearchResultsSchema = z.object({
  query: z.string(),
  language: z.enum(['en', 'ur']),
  results: z.array(SearchResultSchema),
  resultOrder: z.literal('ASC'),
  totalCount: z.number().int().min(0),
});

export type SearchResults = z.infer<typeof SearchResultsSchema>;

// Validation helpers
export function validateSurah(data: unknown): Surah {
  return SurahSchema.parse(data);
}

export function validateAyah(data: unknown): Ayah {
  return AyahSchema.parse(data);
}

export function validateBookmarks(data: unknown) {
  return BookmarksArraySchema.parse(data);
}

export function validateProgress(data: unknown): Progress {
  return ProgressSchema.parse(data);
}

export function validateSettings(data: unknown): Settings {
  return SettingsSchema.parse(data);
}

export function createError(
  errorCode: string,
  message: string,
  details: unknown = null,
  recoverable = true
): AppError {
  return {
    errorCode,
    message,
    details,
    recoverable,
  };
}
