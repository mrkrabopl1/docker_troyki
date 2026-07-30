// pages/index.tsx
import { GetServerSideProps } from 'next';
import { getMainPage } from 'src/providers/merchProvider';
import { getMainBanners } from 'src/providers/shopProvider';
import { getMainInfo } from 'src/providers/shopProvider';
import Main from 'src/pages/main/Main';

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Загружаем данные на сервере
    const [pageInfo, banners, mainInfo] = await Promise.all([
      getMainPage(),
      getMainBanners(),
      getMainInfo()
    ]);

    return {
      props: {
        initialData: {
          pageInfo: pageInfo || {},
          banners: banners || [],
          mainInfo: mainInfo || {}
        }
      }
    };
  } catch (error) {
    console.error('SSR failed:', error);
    return {
      props: {
        initialData: {
          pageInfo: {},
          banners: [],
          mainInfo: {}
        }
      }
    };
  }
};

export default Main;