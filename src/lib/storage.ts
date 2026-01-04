import type { Ayah, Bookmark, Progress, Settings, AppError } from './schemas';
import { 
  validateBookmarks, 
  validateProgress, 
  validateSettings, 
  createError,
  BookmarksArraySchema,
  ProgressSchema,
  SettingsSchema
} from './schemas';

const DB_NAME = 'QuranExplorerDB';
const DB_VERSION = 1;

// IndexedDB store names
const STORES = {
  AYAHS: 'ayahs',
  BOOKMARKS: 'bookmarks',
  PROGRESS: 'progress',
  SETTINGS: 'settings',
  CACHE: 'cache',
} as const;

let db: IDBDatabase | null = null;

// Initialize IndexedDB
export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(createError('E_DB_INIT', 'Failed to initialize database', null, true));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Ayahs store with indexes
      if (!database.objectStoreNames.contains(STORES.AYAHS)) {
        const ayahStore = database.createObjectStore(STORES.AYAHS, {
          keyPath: ['surahNumber', 'ayahNumber'],
        });
        ayahStore.createIndex('surah', 'surahNumber', { unique: false });
        ayahStore.createIndex('global', 'globalAyahNumber', { unique: true });
        ayahStore.createIndex('juz', 'juzNumber', { unique: false });
      }

      // Bookmarks store
      if (!database.objectStoreNames.contains(STORES.BOOKMARKS)) {
        const bookmarkStore = database.createObjectStore(STORES.BOOKMARKS, {
          keyPath: ['surahNumber', 'ayahNumber'],
        });
        bookmarkStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Progress store
      if (!database.objectStoreNames.contains(STORES.PROGRESS)) {
        database.createObjectStore(STORES.PROGRESS, { keyPath: 'id' });
      }

      // Settings store
      if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
        database.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }

      // Cache metadata store
      if (!database.objectStoreNames.contains(STORES.CACHE)) {
        database.createObjectStore(STORES.CACHE, { keyPath: 'key' });
      }
    };
  });
}

// Generic get from store
async function getFromStore<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(createError('E_DB_READ', 'Failed to read from database', null, true));
  });
}

// Generic put to store
async function putToStore<T>(storeName: string, data: T): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(createError('E_DB_WRITE', 'Failed to write to database', null, true));
  });
}

// Generic delete from store
async function deleteFromStore(storeName: string, key: IDBValidKey): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(createError('E_DB_DELETE', 'Failed to delete from database', null, true));
  });
}

// Get all from store with optional index
async function getAllFromStore<T>(
  storeName: string,
  indexName?: string,
  query?: IDBValidKey
): Promise<T[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const target = indexName ? store.index(indexName) : store;
    const request = query !== undefined ? target.getAll(query) : target.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(createError('E_DB_READ', 'Failed to read from database', null, true));
  });
}

// Ayahs operations
export async function cacheAyahs(ayahs: Ayah[]): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.AYAHS, 'readwrite');
    const store = transaction.objectStore(STORES.AYAHS);

    ayahs.forEach((ayah) => store.put(ayah));

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(createError('E_DB_WRITE', 'Failed to cache ayahs', null, true));
  });
}

export async function getCachedSurah(surahNumber: number): Promise<Ayah[]> {
  const ayahs = await getAllFromStore<Ayah>(STORES.AYAHS, 'surah', surahNumber);
  return ayahs.sort((a, b) => a.ayahNumber - b.ayahNumber);
}

export async function getCachedAyah(surahNumber: number, ayahNumber: number): Promise<Ayah | null> {
  return getFromStore<Ayah>(STORES.AYAHS, [surahNumber, ayahNumber]);
}

export async function getAllCachedAyahs(): Promise<Ayah[]> {
  const ayahs = await getAllFromStore<Ayah>(STORES.AYAHS);
  return ayahs.sort((a, b) => a.globalAyahNumber - b.globalAyahNumber);
}

// Bookmark operations
export async function addBookmark(surahNumber: number, ayahNumber: number): Promise<void> {
  const bookmark: Bookmark = {
    surahNumber,
    ayahNumber,
    timestamp: new Date().toISOString(),
  };
  await putToStore(STORES.BOOKMARKS, bookmark);
}

export async function removeBookmark(surahNumber: number, ayahNumber: number): Promise<void> {
  await deleteFromStore(STORES.BOOKMARKS, [surahNumber, ayahNumber]);
}

export async function getBookmarks(): Promise<Bookmark[]> {
  const bookmarks = await getAllFromStore<Bookmark>(STORES.BOOKMARKS);
  return bookmarks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function isBookmarked(surahNumber: number, ayahNumber: number): Promise<boolean> {
  const bookmark = await getFromStore<Bookmark>(STORES.BOOKMARKS, [surahNumber, ayahNumber]);
  return bookmark !== null;
}

// Progress operations
const PROGRESS_ID = 'user-progress';

export async function getProgress(): Promise<Progress> {
  const progress = await getFromStore<Progress & { id: string }>(STORES.PROGRESS, PROGRESS_ID);
  if (!progress) {
    return {
      perSurahProgress: {},
      overallCompletion: 0,
    };
  }
  const { id, ...rest } = progress;
  return rest;
}

export async function updateProgress(progress: Progress): Promise<void> {
  await putToStore(STORES.PROGRESS, { id: PROGRESS_ID, ...progress });
}

export async function updateLastRead(surahNumber: number, ayahNumber: number): Promise<void> {
  const progress = await getProgress();
  progress.lastRead = {
    surahNumber,
    ayahNumber,
    timestamp: new Date().toISOString(),
  };
  await updateProgress(progress);
}

// Settings operations
const SETTINGS_ID = 'user-settings';

const defaultSettings: Settings = {
  language: 'en',
  showTranslations: true,
  fontSizePx: 24,
  theme: 'light',
  preferredReciter: 'ar.alafasy',
  playbackSpeed: 1,
};

export async function getSettings(): Promise<Settings> {
  const settings = await getFromStore<Settings & { id: string }>(STORES.SETTINGS, SETTINGS_ID);
  if (!settings) {
    return defaultSettings;
  }
  const { id, ...rest } = settings;
  return { ...defaultSettings, ...rest };
}

export async function updateSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  
  // Validate before saving
  try {
    validateSettings(updated);
  } catch (e) {
    throw createError('E_INVALID_SETTINGS', 'Invalid settings data', e, true);
  }
  
  await putToStore(STORES.SETTINGS, { id: SETTINGS_ID, ...updated });
}

// Export/Import operations
export async function exportBookmarks(): Promise<string> {
  const bookmarks = await getBookmarks();
  return JSON.stringify({ bookmarks }, null, 2);
}

export async function importBookmarks(jsonData: string): Promise<void> {
  try {
    const data = JSON.parse(jsonData);
    const validated = validateBookmarks(data);
    
    const database = await initDB();
    const transaction = database.transaction(STORES.BOOKMARKS, 'readwrite');
    const store = transaction.objectStore(STORES.BOOKMARKS);
    
    // Clear existing
    store.clear();
    
    // Add validated bookmarks
    validated.bookmarks.forEach((bookmark) => store.add(bookmark));
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(createError('E_IMPORT_FAILED', 'Failed to import bookmarks', null, true));
    });
  } catch (e) {
    throw createError('E_INVALID_IMPORT', 'Invalid bookmark data format', e, false);
  }
}

export async function exportSettings(): Promise<string> {
  const settings = await getSettings();
  return JSON.stringify(settings, null, 2);
}

export async function importSettings(jsonData: string): Promise<void> {
  try {
    const data = JSON.parse(jsonData);
    const validated = validateSettings(data);
    await updateSettings(validated);
  } catch (e) {
    throw createError('E_INVALID_IMPORT', 'Invalid settings data format', e, false);
  }
}

// Cache metadata
export async function setCacheTimestamp(key: string): Promise<void> {
  await putToStore(STORES.CACHE, { key, timestamp: new Date().toISOString() });
}

export async function getCacheTimestamp(key: string): Promise<string | null> {
  const cache = await getFromStore<{ key: string; timestamp: string }>(STORES.CACHE, key);
  return cache?.timestamp || null;
}

// Check if surah is cached
export async function isSurahCached(surahNumber: number): Promise<boolean> {
  const ayahs = await getCachedSurah(surahNumber);
  return ayahs.length > 0;
}
