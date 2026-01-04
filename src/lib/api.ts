import type { Ayah, AppError } from './schemas';
import { createError } from './schemas';

const API_BASE = 'https://api.alquran.cloud/v1';

interface ApiAyah {
  number: number;
  numberInSurah: number;
  text: string;
  audio?: string;
  juz: number;
  page: number;
}

interface ApiSurahResponse {
  data: {
    ayahs: ApiAyah[];
  };
}

// Normalize API response to canonical schema
function normalizeAyah(
  apiAyah: ApiAyah,
  surahNumber: number,
  englishText?: string,
  urduText?: string,
  audioUrl?: string
): Ayah {
  return {
    surahNumber,
    ayahNumber: apiAyah.numberInSurah,
    globalAyahNumber: apiAyah.number,
    arabicText: apiAyah.text,
    englishText: englishText || '',
    urduText: urduText || '',
    audioUrl: audioUrl || apiAyah.audio,
    juzNumber: apiAyah.juz,
    pageNumber: apiAyah.page,
  };
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

    const [arabicData, englishData, urduData, audioData] = await Promise.all([
      arabicRes.json() as Promise<ApiSurahResponse>,
      englishRes.ok ? englishRes.json() as Promise<ApiSurahResponse> : null,
      urduRes.ok ? urduRes.json() as Promise<ApiSurahResponse> : null,
      audioRes.ok ? audioRes.json() as Promise<ApiSurahResponse> : null,
    ]);

    const ayahs: Ayah[] = arabicData.data.ayahs.map((arabicAyah, index) => {
      const englishAyah = englishData?.data.ayahs[index];
      const urduAyah = urduData?.data.ayahs[index];
      const audioAyah = audioData?.data.ayahs[index];

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

    const [arabicData, englishData, urduData] = await Promise.all([
      arabicRes.json(),
      englishRes.ok ? englishRes.json() : null,
      urduRes.ok ? urduRes.json() : null,
    ]);

    return normalizeAyah(
      arabicData.data,
      surahNumber,
      englishData?.data?.text,
      urduData?.data?.text,
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
