// lib/mainDataLoader.ts
import { getMainPage } from 'src/providers/merchProvider';
import { getMainInfo } from 'src/providers/shopProvider';
import { getInstagramPhotosServer } from 'src/providers/instagramProvider';

console.log('[MAIN_DATA_LOADER] ========================================');
console.log('[MAIN_DATA_LOADER] MODULE LOADED');
console.log('[MAIN_DATA_LOADER] NODE_ENV:', process.env.NODE_ENV);
console.log('[MAIN_DATA_LOADER] ========================================');

let cachedData: any = null;
let loadPromise: Promise<any> | null = null;

export async function getMainData() {
  console.log('[MAIN_DATA_LOADER] ========================================');
  console.log('[MAIN_DATA_LOADER] getMainData() CALLED');
  console.log('[MAIN_DATA_LOADER] cachedData exists?', !!cachedData);
  console.log('[MAIN_DATA_LOADER] loadPromise exists?', !!loadPromise);
  console.log('[MAIN_DATA_LOADER] cachedData keys:', cachedData ? Object.keys(cachedData) : 'null');
  
  if (cachedData) {
    console.log('[MAIN_DATA_LOADER] ✅ Returning from CACHE');
    console.log('[MAIN_DATA_LOADER] cachedData keys:', Object.keys(cachedData));
    console.log('[MAIN_DATA_LOADER] mainInfo keys:', Object.keys(cachedData.mainInfo || {}));
    console.log('[MAIN_DATA_LOADER] pageInfo length:', cachedData.pageInfo?.length || 0);
    console.log('[MAIN_DATA_LOADER] ========================================');
    return cachedData; // 👈 БЕЗ ОПТИМИЗАЦИИ!
  }
  
  if (loadPromise) {
    console.log('[MAIN_DATA_LOADER] ⏳ Waiting for existing loadPromise...');
    console.log('[MAIN_DATA_LOADER] ========================================');
    const result = await loadPromise;
    console.log('[MAIN_DATA_LOADER] ⏳ loadPromise resolved');
    return result;
  }

  console.log('[MAIN_DATA_LOADER] 🔄 Creating NEW loadPromise');
  console.log('[MAIN_DATA_LOADER] Loading from DB (first time)');
  
  const startTime = Date.now();
  
  loadPromise = (async () => {
    console.log('[MAIN_DATA_LOADER] 📦 Starting Promise.all at', new Date().toISOString());
    
    try {
      console.log('[MAIN_DATA_LOADER] Calling getMainPage()...');
      const pageInfoStart = Date.now();
      const pageInfo = await getMainPage().catch((e) => {
        console.error('[MAIN_DATA_LOADER] ❌ getMainPage failed:', e.message || e);
        return [];
      });
      console.log('[MAIN_DATA_LOADER] getMainPage() completed in', Date.now() - pageInfoStart, 'ms');
      console.log('[MAIN_DATA_LOADER] pageInfo length:', pageInfo?.length || 0);

      console.log('[MAIN_DATA_LOADER] Calling getMainInfo()...');
      const mainInfoStart = Date.now();
      const mainInfo = await getMainInfo().catch((e) => {
        console.error('[MAIN_DATA_LOADER] ❌ getMainInfo failed:', e.message || e);
        return {};
      });
      console.log('[MAIN_DATA_LOADER] getMainInfo() completed in', Date.now() - mainInfoStart, 'ms');
      console.log('[MAIN_DATA_LOADER] mainInfo keys:', Object.keys(mainInfo || {}));
      console.log('[MAIN_DATA_LOADER] mainInfo.categories count:', mainInfo?.categories?.length || 0);
      console.log('[MAIN_DATA_LOADER] mainInfo.firms count:', mainInfo?.firms?.length || 0);

      console.log('[MAIN_DATA_LOADER] Calling getInstagramPhotosServer()...');
      const instagramStart = Date.now();
      const instagramPhotos = await getInstagramPhotosServer().catch((e) => {
        console.error('[MAIN_DATA_LOADER] ❌ getInstagramPhotosServer failed:', e.message || e);
        return [];
      });
      console.log('[MAIN_DATA_LOADER] getInstagramPhotosServer() completed in', Date.now() - instagramStart, 'ms');
      console.log('[MAIN_DATA_LOADER] instagramPhotos count:', instagramPhotos?.length || 0);

      cachedData = {
        pageInfo: pageInfo || [],
        mainInfo: mainInfo || {},
        instagramPosts: instagramPhotos || []
      };

      const totalDuration = Date.now() - startTime;
      console.log('[MAIN_DATA_LOADER] ✅ DATA LOADED successfully in', totalDuration, 'ms');
      console.log('[MAIN_DATA_LOADER] cachedData keys:', Object.keys(cachedData));
      console.log('[MAIN_DATA_LOADER] mainInfo keys:', Object.keys(cachedData.mainInfo || {}));
      console.log('[MAIN_DATA_LOADER] instagramPosts count:', cachedData.instagramPosts.length);
      console.log('[MAIN_DATA_LOADER] pageInfo length:', cachedData.pageInfo?.length || 0);
      
      console.log('[MAIN_DATA_LOADER] Returning RAW data (NO OPTIMIZATION)');
      console.log('[MAIN_DATA_LOADER] ========================================');
      return cachedData;
      
    } catch (error) {
      console.error('[MAIN_DATA_LOADER] ❌ CRITICAL ERROR in loadPromise:', error);
      const fallbackData = {
        pageInfo: [],
        mainInfo: {
          categories: [],
          firms: [],
          discounts: null,
          sizeTables: {}
        },
        instagramPosts: []
      };
      cachedData = fallbackData;
      console.log('[MAIN_DATA_LOADER] Returning EMPTY cachedData as fallback');
      return fallbackData;
    } finally {
      loadPromise = null;
      console.log('[MAIN_DATA_LOADER] 🔓 loadPromise set to null');
    }
  })();

  console.log('[MAIN_DATA_LOADER] ⏳ Awaiting loadPromise...');
  const result = await loadPromise;
  console.log('[MAIN_DATA_LOADER] ✅ loadPromise resolved');
  console.log('[MAIN_DATA_LOADER] result keys:', Object.keys(result || {}));
  console.log('[MAIN_DATA_LOADER] result mainInfo keys:', Object.keys(result?.mainInfo || {}));
  console.log('[MAIN_DATA_LOADER] result categories count:', result?.mainInfo?.categories?.length || 0);
  console.log('[MAIN_DATA_LOADER] result firms count:', result?.mainInfo?.firms?.length || 0);
  console.log('[MAIN_DATA_LOADER] result pageInfo length:', result?.pageInfo?.length || 0);
  console.log('[MAIN_DATA_LOADER] ========================================');
  return result;
}

export function resetMainDataCache() {
  console.log('[MAIN_DATA_LOADER] 🗑️ RESETTING CACHE');
  cachedData = null;
  loadPromise = null;
  console.log('[MAIN_DATA_LOADER] cachedData set to null');
  console.log('[MAIN_DATA_LOADER] loadPromise set to null');
}