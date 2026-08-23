// lib/mainDataLoader.ts
import { getMainPage } from 'src/providers/merchProvider';
import { getMainBanners, getMainInfo } from 'src/providers/shopProvider';
import { getInstagramPhotosServer } from 'src/providers/instagramProvider';

// 🔥 Глобальный кэш на сервере (живет между запросами)
let cachedData: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

export async function getMainData() {
  // ✅ Если данные уже загружены - возвращаем из кэша
  if (cachedData) {
    console.log('✅ MainData: using cache');
    return cachedData;
  }

  // ✅ Если данные уже загружаются - ждем
  if (loadPromise) {
    console.log('⏳ MainData: waiting for loading...');
    return loadPromise;
  }

  // 🔥 Загружаем данные (1 раз для всех страниц)
  console.log('🔄 MainData: loading from DB (first time)');
  
  loadPromise = (async () => {
    try {
      const [pageInfo, banners, mainInfo, instagramPhotos] = await Promise.all([
        getMainPage().catch(() => ({})),
        getMainBanners().catch(() => []),
        getMainInfo().catch(() => ({})),
        getInstagramPhotosServer().catch(() => [])
      ]);

      cachedData = {
        pageInfo: pageInfo || {},
        banners: banners || [],
        mainInfo: mainInfo || {},
        instagramPosts: instagramPhotos || []
      };

      return cachedData;
    } catch (error) {
      console.error('MainData: loading failed', error);
      cachedData = {
        pageInfo: {},
        banners: [],
        mainInfo: {},
        instagramPosts: []
      };
      return cachedData;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

// 🔥 Сброс кэша (для обновления данных)
export function resetMainDataCache() {
  cachedData = null;
  loadPromise = null;
  console.log('🗑️ MainData: cache reset');
}