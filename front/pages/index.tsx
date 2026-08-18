// pages/index.tsx
import { GetServerSideProps } from 'next';
import { getMainPage } from 'src/providers/merchProvider';
import { getMainBanners } from 'src/providers/shopProvider';
import { getMainInfo } from 'src/providers/shopProvider';
import { getInstagramPhotosServer } from 'src/providers/instagramProvider';
import Main from 'src/pages/main/Main';

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    console.debug("🔥 Starting SSR for Main Page");
    
    // Fetch with timeout
    const fetchWithTimeout = async (promise: Promise<any>) => {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      return Promise.race([promise, timeout]);
    };

    // Загружаем все данные параллельно
    const [pageInfo, banners, mainInfo, instagramPhotos] = await Promise.all([
      fetchWithTimeout(getMainPage()),
      fetchWithTimeout(getMainBanners()),
      fetchWithTimeout(getMainInfo()),
      fetchWithTimeout(getInstagramPhotosServer()).catch(() => []) // Если ошибка - пустой массив
    ]);

    return {
      props: {
        initialData: {
          pageInfo: pageInfo || {},
          banners: banners || [],
          mainInfo: mainInfo || {},
          instagramPosts: instagramPhotos || []
        }
      }
    };
  } catch (error) {
    console.error('SSR failed:', error);
    
    // Возвращаем пустые данные, но страница все равно рендерится
    return {
      props: {
        initialData: {
          pageInfo: {},
          banners: [],
          mainInfo: {},
          instagramPosts: []
        }
      }
    };
  }
};

export default Main;