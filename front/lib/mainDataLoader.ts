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

// 🔥 НОВАЯ ФУНКЦИЯ: Оптимизация данных для передачи на клиент
function optimizeDataForClient(data: any) {
  console.log('[OPTIMIZE] ========================================');
  console.log('[OPTIMIZE] Starting optimization...');
  
  // Проверяем размер ДО оптимизации
  const originalSize = JSON.stringify(data).length;
  console.log('[OPTIMIZE] Original data size:', originalSize, 'bytes');
  console.log('[OPTIMIZE] Original data size:', (originalSize / 1024 / 1024).toFixed(2), 'MB');
  
  // Копируем данные
  const optimized = {
    pageInfo: data.pageInfo || {},
    mainInfo: {
      categories: [],
      firms: [],
      discounts: data.mainInfo?.discounts || null,
      sizeTables: data.mainInfo?.sizeTables || {},
    },
    instagramPosts: data.instagramPosts || [],
  };
  
  // 🔥 ОГРАНИЧИВАЕМ КОЛИЧЕСТВО КАТЕГОРИЙ до 30
  if (data.mainInfo?.categories && Array.isArray(data.mainInfo.categories)) {
    const categories = data.mainInfo.categories;
    console.log('[OPTIMIZE] Original categories count:', categories.length);
    
    // Берем только уникальные категории (по category_id)
    const uniqueCategories = [];
    const seenIds = new Set();
    
    for (const cat of categories) {
      if (!seenIds.has(cat.category_id) && uniqueCategories.length < 30) {
        seenIds.add(cat.category_id);
        uniqueCategories.push({
          category_id: cat.category_id,
          category_key: cat.category_key,
          category_name: cat.category_name,
          image_path: cat.image_path,
          // Добавляем только несколько типов для примера
          types: categories
            .filter(c => c.category_id === cat.category_id)
            .slice(0, 5)
            .map(c => ({
              type_id: c.type_id,
              type_key: c.type_key,
              type_name: c.type_name,
            }))
        });
      }
    }
    
    optimized.mainInfo.categories = uniqueCategories;
    console.log('[OPTIMIZE] Optimized categories count:', optimized.mainInfo.categories.length);
  }
  
  // 🔥 ОГРАНИЧИВАЕМ КОЛИЧЕСТВО ФИРМ до 30
  if (data.mainInfo?.firms && Array.isArray(data.mainInfo.firms)) {
    const firms = data.mainInfo.firms;
    console.log('[OPTIMIZE] Original firms count:', firms.length);
    
    // Берем первые 30 фирм или уникальные
    const uniqueFirms = [];
    const seenBrands = new Set();
    
    for (const firm of firms) {
      if (!seenBrands.has(firm.brand_id) && uniqueFirms.length < 30) {
        seenBrands.add(firm.brand_id);
        uniqueFirms.push({
          brand_id: firm.brand_id,
          firm: firm.firm,
          brand_slug: firm.brand_slug,
          // Добавляем только несколько коллекций
          collections: firms
            .filter(f => f.brand_id === firm.brand_id)
            .slice(0, 3)
            .map(f => ({
              collection_name: f.collection_name,
              collection_slug: f.collection_slug,
            }))
        });
      }
    }
    
    optimized.mainInfo.firms = uniqueFirms;
    console.log('[OPTIMIZE] Optimized firms count:', optimized.mainInfo.firms.length);
  }
  
  // 🔥 ОГРАНИЧИВАЕМ Instagram фотографии до 6
  if (data.instagramPosts && Array.isArray(data.instagramPosts)) {
    console.log('[OPTIMIZE] Original instagram count:', data.instagramPosts.length);
    optimized.instagramPosts = data.instagramPosts.slice(0, 6);
    console.log('[OPTIMIZE] Optimized instagram count:', optimized.instagramPosts.length);
  }
  
  // Проверяем размер ПОСЛЕ оптимизации
  const optimizedSize = JSON.stringify(optimized).length;
  console.log('[OPTIMIZE] Optimized data size:', optimizedSize, 'bytes');
  console.log('[OPTIMIZE] Optimized data size:', (optimizedSize / 1024 / 1024).toFixed(2), 'MB');
  console.log('[OPTIMIZE] Size reduction:', ((originalSize - optimizedSize) / originalSize * 100).toFixed(2), '%');
  console.log('[OPTIMIZE] ========================================');
  
  return optimized;
}

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
    console.log('[MAIN_DATA_LOADER] ========================================');
    
    // 🔥 ПРИМЕНЯЕМ ОПТИМИЗАЦИЮ ПРИ ВОЗВРАТЕ ИЗ КЕША
    return optimizeDataForClient(cachedData);
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
        return {};
      });
      console.log('[MAIN_DATA_LOADER] getMainPage() completed in', Date.now() - pageInfoStart, 'ms');
      console.log('[MAIN_DATA_LOADER] pageInfo keys:', Object.keys(pageInfo || {}));

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

      // Сохраняем полные данные в кеш
      cachedData = {
        pageInfo: pageInfo || {},
        mainInfo: mainInfo || {},
        instagramPosts: instagramPhotos || []
      };

      const totalDuration = Date.now() - startTime;
      console.log('[MAIN_DATA_LOADER] ✅ DATA LOADED successfully in', totalDuration, 'ms');
      console.log('[MAIN_DATA_LOADER] cachedData keys:', Object.keys(cachedData));
      console.log('[MAIN_DATA_LOADER] mainInfo keys:', Object.keys(cachedData.mainInfo || {}));
      console.log('[MAIN_DATA_LOADER] instagramPosts count:', cachedData.instagramPosts.length);
      console.log('[MAIN_DATA_LOADER] pageInfo keys:', Object.keys(cachedData.pageInfo || {}));
      
      // 🔥 ВОЗВРАЩАЕМ ОПТИМИЗИРОВАННЫЕ ДАННЫЕ
      const optimizedData = optimizeDataForClient(cachedData);
      
      console.log('[MAIN_DATA_LOADER] Returning optimized data');
      console.log('[MAIN_DATA_LOADER] ========================================');
      return optimizedData;
      
    } catch (error) {
      console.error('[MAIN_DATA_LOADER] ❌ CRITICAL ERROR in loadPromise:', error);
      const fallbackData = {
        pageInfo: {},
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