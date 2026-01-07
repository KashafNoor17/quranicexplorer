import { z } from 'zod';
import type { Ayah, AppError } from './schemas';
import { createError, AyahSchema } from './schemas';

// API Response Schemas for validation
const ApiAyahResponseSchema = z.object({
  number: z.number().int().positive(),
  numberInSurah: z.number().int().positive(),
  text: z.string().min(1),
  audio: z.string().url().optional(),
  juz: z.number().int().min(1).max(30),
  page: z.number().int().positive(),
});

const ApiSurahResponseSchema = z.object({
  data: z.object({
    ayahs: z.array(ApiAyahResponseSchema),
  }),
});

const ApiSingleAyahResponseSchema = z.object({
  data: ApiAyahResponseSchema,
});

// Sanitize text content to prevent XSS - strips potential script content
function sanitizeText(text: string): string {
  if (!text) return '';
  // Remove script tags and event handlers
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<[^>]+>/g, '') // Strip all HTML tags for text content
    .trim();
}

const API_BASE = 'https://api.alquran.cloud/v1';

// Type inference from schemas
type ApiAyah = z.infer<typeof ApiAyahResponseSchema>;

// Normalize and sanitize API response to canonical schema
function normalizeAyah(
  apiAyah: ApiAyah,
  surahNumber: number,
  englishText?: string,
  urduText?: string,
  audioUrl?: string
): Ayah {
  const normalized = {
    surahNumber,
    ayahNumber: apiAyah.numberInSurah,
    globalAyahNumber: apiAyah.number,
    arabicText: sanitizeText(apiAyah.text),
    englishText: sanitizeText(englishText || ''),
    urduText: sanitizeText(urduText || ''),
    audioUrl: audioUrl || apiAyah.audio,
    juzNumber: apiAyah.juz,
    pageNumber: apiAyah.page,
  };
  
  // Validate against canonical Ayah schema
  return AyahSchema.parse(normalized);
}

// Fetch Surah with all editions (Arabic, English, Urdu, Audio)
export async function fetchSurah(surahNumber: number, reciter = 'ar.alafasy'): Promise<Ayah[]> {
  try {
    // Fetch multiple editions in parallel
    const [arabicRes, englishRes, urduRes, audioRes] = await Promise.all([
      fetch(`${API_BASE}/surah/${surahNumber}/ar.alafasy`),
      fetch(`${API_BASE}/surah/${surahNumber}/en.sahih`),
      fetch(`${API_BASE}/surah/${surahNumber}/ur.ahmedali`),
      fetch(`${API_BASE}/surah/${surahNumber}/${reciter}`),
    ]);

    if (!arabicRes.ok) {
      throw createError('E_API_FETCH', `Failed to fetch Surah ${surahNumber}`, null, true);
    }

    const [rawArabicData, rawEnglishData, rawUrduData, rawAudioData] = await Promise.all([
      arabicRes.json(),
      englishRes.ok ? englishRes.json() : null,
      urduRes.ok ? urduRes.json() : null,
      audioRes.ok ? audioRes.json() : null,
    ]);
    
    // Validate API responses with Zod schemas
    const arabicData = ApiSurahResponseSchema.parse(rawArabicData);
    const englishData = rawEnglishData ? ApiSurahResponseSchema.safeParse(rawEnglishData) : null;
    const urduData = rawUrduData ? ApiSurahResponseSchema.safeParse(rawUrduData) : null;
    const audioData = rawAudioData ? ApiSurahResponseSchema.safeParse(rawAudioData) : null;

    const ayahs: Ayah[] = arabicData.data.ayahs.map((arabicAyah, index) => {
      const englishAyah = englishData?.success ? englishData.data.data.ayahs[index] : undefined;
      const urduAyah = urduData?.success ? urduData.data.data.ayahs[index] : undefined;
      const audioAyah = audioData?.success ? audioData.data.data.ayahs[index] : undefined;

      return normalizeAyah(
        arabicAyah,
        surahNumber,
        englishAyah?.text,
        urduAyah?.text,
        audioAyah?.audio
      );
    });

    // Sort by ayah number (ASC order - mandatory)
    return ayahs.sort((a, b) => a.ayahNumber - b.ayahNumber);
  } catch (error) {
    if ((error as AppError).errorCode) {
      throw error;
    }
    throw createError(
      'E_NETWORK',
      'Network error while fetching Quran data',
      error,
      true
    );
  }
}

// Fetch single Ayah
export async function fetchAyah(
  surahNumber: number,
  ayahNumber: number,
  reciter = 'ar.alafasy'
): Promise<Ayah> {
  try {
    const [arabicRes, englishRes, urduRes] = await Promise.all([
      fetch(`${API_BASE}/ayah/${surahNumber}:${ayahNumber}/${reciter}`),
      fetch(`${API_BASE}/ayah/${surahNumber}:${ayahNumber}/en.sahih`),
      fetch(`${API_BASE}/ayah/${surahNumber}:${ayahNumber}/ur.ahmedali`),
    ]);

    if (!arabicRes.ok) {
      throw createError(
        'E_API_FETCH',
        `Failed to fetch Ayah ${surahNumber}:${ayahNumber}`,
        null,
        true
      );
    }

    const [rawArabicData, rawEnglishData, rawUrduData] = await Promise.all([
      arabicRes.json(),
      englishRes.ok ? englishRes.json() : null,
      urduRes.ok ? urduRes.json() : null,
    ]);
    
    // Validate API responses
    const arabicData = ApiSingleAyahResponseSchema.parse(rawArabicData);
    const englishData = rawEnglishData ? ApiSingleAyahResponseSchema.safeParse(rawEnglishData) : null;
    const urduData = rawUrduData ? ApiSingleAyahResponseSchema.safeParse(rawUrduData) : null;

    return normalizeAyah(
      arabicData.data,
      surahNumber,
      englishData?.success ? englishData.data.data.text : undefined,
      urduData?.success ? urduData.data.data.text : undefined,
      arabicData.data.audio
    );
  } catch (error) {
    if ((error as AppError).errorCode) {
      throw error;
    }
    throw createError(
      'E_NETWORK',
      'Network error while fetching Ayah',
      error,
      true
    );
  }
}

// Search Ayahs (client-side search on cached data)
export function searchAyahs(
  ayahs: Ayah[],
  query: string,
  language: 'en' | 'ur'
): Ayah[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  const results = ayahs.filter((ayah) => {
    const text = language === 'en' ? ayah.englishText : ayah.urduText;
    return text?.toLowerCase().includes(normalizedQuery);
  });

  // Sort by global ayah number (ASC order - mandatory)
  return results.sort((a, b) => a.globalAyahNumber - b.globalAyahNumber);
}
