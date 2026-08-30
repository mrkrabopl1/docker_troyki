// lib/mainDataLoader.ts

import { getWidgets } from 'src/providers/merchProvider';
import { getMainInfo } from 'src/providers/shopProvider';

interface MainData {
  pageInfo: any[];
  mainInfo: Record<string, any>;
}

// ==================== CACHE ====================

let cachedData: MainData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 60 секунд

let loadPromise: Promise<MainData> | null = null;

// ==================== EMPTY DATA ====================

const EMPTY_DATA: MainData = {
  pageInfo: [],
  mainInfo: {
    categories: [],
    firms: [],
    discounts: null,
    sizeTables: {},
  },
};

function isCacheValid(): boolean {
  return (
    cachedData !== null &&
    Date.now() - cacheTimestamp < CACHE_TTL
  );
}

// ==================== GET MAIN DATA ====================

export async function getMainData(): Promise<MainData> {
  // Используем кэш
  if (isCacheValid()) {
    return cachedData!;
  }

  // Если уже идёт загрузка — ждём её
  if (loadPromise) {
    return loadPromise;
  }

  // Загружаем данные параллельно
  loadPromise = (async () => {
    try {
      const [pageInfo, mainInfo] = await Promise.all([
        getWidgets().catch((error) => {
          console.error('[MAIN_DATA] getWidgets failed:', error);
          return [];
        }),

        getMainInfo().catch((error) => {
          console.error('[MAIN_DATA] getMainInfo failed:', error);
          return {};
        }),
      ]);

      const data: MainData = {
        pageInfo: Array.isArray(pageInfo) ? pageInfo : [],
        mainInfo:
          mainInfo && typeof mainInfo === 'object'
            ? mainInfo
            : {},
      };

      cachedData = data;
      cacheTimestamp = Date.now();

      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[MAIN_DATA] loaded in ${Date.now() - cacheTimestamp} ms`
        );
      }

      return data;
    } catch (error) {
      console.error('[MAIN_DATA] Critical error:', error);
      return EMPTY_DATA;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

// ==================== RESET CACHE ====================

export function resetMainDataCache(): void {
  cachedData = null;
  cacheTimestamp = 0;
  loadPromise = null;
}