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
  const now = Date.now();
  const isValid = cachedData !== null && now - cacheTimestamp < CACHE_TTL;
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[MAIN_DATA] Cache check: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`[MAIN_DATA] Cache age: ${cachedData ? Math.round((now - cacheTimestamp) / 1000) : 0}s / ${CACHE_TTL / 1000}s`);
  }
  
  return isValid;
}

// ==================== GET MAIN DATA ====================

export async function getMainData(): Promise<MainData> {
  const startTime = Date.now();
  console.log(`⏱️ [MAIN_DATA] START at ${new Date(startTime).toISOString()}`);

  // Используем кэш
  if (isCacheValid()) {
    const elapsed = Date.now() - startTime;
    console.log(`⏱️ [MAIN_DATA] ✅ FROM CACHE (${elapsed}ms)`);
    return cachedData!;
  }

  // Если уже идёт загрузка — ждём её
  if (loadPromise) {
    console.log(`⏱️ [MAIN_DATA] ⏳ Waiting for existing request...`);
    const result = await loadPromise;
    const elapsed = Date.now() - startTime;
    console.log(`⏱️ [MAIN_DATA] ✅ FROM EXISTING REQUEST (${elapsed}ms)`);
    return result;
  }

  // Загружаем данные параллельно
  console.log(`⏱️ [MAIN_DATA] 🔄 Starting fresh load...`);
  const loadStart = Date.now();

  loadPromise = (async () => {
    try {
      console.log(`⏱️ [MAIN_DATA] 📡 Fetching data... (${new Date().toISOString()})`);
      
      const [pageInfo, mainInfo] = await Promise.all([
        getWidgets().catch((error) => {
          const elapsed = Date.now() - loadStart;
          console.error(`⏱️ [MAIN_DATA] ❌ getWidgets failed after ${elapsed}ms:`, error);
          return [];
        }),

        getMainInfo().catch((error) => {
          const elapsed = Date.now() - loadStart;
          console.error(`⏱️ [MAIN_DATA] ❌ getMainInfo failed after ${elapsed}ms:`, error);
          return {};
        }),
      ]);

      const fetchElapsed = Date.now() - loadStart;
      console.log(`⏱️ [MAIN_DATA] 📡 Fetch complete in ${fetchElapsed}ms`);

      const data: MainData = {
        pageInfo: Array.isArray(pageInfo) ? pageInfo : [],
        mainInfo:
          mainInfo && typeof mainInfo === 'object'
            ? mainInfo
            : {},
      };

      // Статистика
      const categoriesCount = data.mainInfo?.categories?.length || 0;
      const firmsCount = data.mainInfo?.firms?.length || 0;
      const pageInfoCount = data.pageInfo?.length || 0;

      console.log(`⏱️ [MAIN_DATA] 📊 Data stats:`);
      console.log(`   - categories: ${categoriesCount}`);
      console.log(`   - firms: ${firmsCount}`);
      console.log(`   - pageInfo: ${pageInfoCount}`);

      cachedData = data;
      cacheTimestamp = Date.now();
      
      const totalElapsed = Date.now() - loadStart;
      console.log(`⏱️ [MAIN_DATA] ✅ Load complete in ${totalElapsed}ms`);
      console.log(`⏱️ [MAIN_DATA] 💾 Cached at ${new Date(cacheTimestamp).toISOString()}`);

      return data;
    } catch (error) {
      const elapsed = Date.now() - loadStart;
      console.error(`⏱️ [MAIN_DATA] 💥 Critical error after ${elapsed}ms:`, error);
      return EMPTY_DATA;
    } finally {
      loadPromise = null;
      const totalElapsed = Date.now() - startTime;
      console.log(`⏱️ [MAIN_DATA] 🏁 TOTAL TIME: ${totalElapsed}ms`);
    }
  })();

  return loadPromise;
}

// ==================== RESET CACHE ====================

export function resetMainDataCache(): void {
  const timestamp = Date.now();
  console.log(`⏱️ [MAIN_DATA] 🗑️ Cache reset at ${new Date(timestamp).toISOString()}`);
  cachedData = null;
  cacheTimestamp = 0;
  loadPromise = null;
}