// pages/_app.tsx
import type { AppProps, AppContext } from 'next/app';
import { useRouter } from 'next/router';
import { Provider } from 'react-redux';
import { setupStore } from 'src/store/store';
import React, { useEffect } from 'react';
import AppContent from 'src/AppContent';
import ProtectedRoute from 'src/components/admin/ProtectedRoute';
import AdminLayout from 'src/pages/admin/adminLayout/AdminLayout';
import MerchComplexSliderField from 'src/modules/merchField/MerchComplexSliderField';
import { getMainPage } from 'src/providers/merchProvider';
import { getMainBanners } from 'src/providers/shopProvider';
import { getMainInfo } from 'src/providers/shopProvider';
import { getInstagramPhotosServer } from 'src/providers/instagramProvider';
import 'src/global.css';

const store = setupStore();

const SHOP_PAGES = [
  '/',
  '/product/[id]',
  '/collections/[slug]',
  '/search',
  '/catalog',
  '/brands',
];

interface MyAppProps extends AppProps {
  mainData: {
    pageInfo: any;
    banners: any[];
    mainInfo: any;
    instagramPosts: any[];
  };
}

function MyApp({ Component, pageProps, mainData }: MyAppProps) {
  const router = useRouter();
  
  const isAdmin = router.pathname.startsWith('/admin') && 
                  !router.pathname.startsWith('/admin/login') &&
                  !router.pathname.startsWith('/admin/forgot-password') &&
                  !router.pathname.startsWith('/admin/reset-password') &&
                  !router.pathname.startsWith('/admin/accept-invite');

  const isShopPage = SHOP_PAGES.some(pattern => {
    if (pattern.includes('[id]') || pattern.includes('[slug]')) {
      const regexPattern = pattern
        .replace('[id]', '[^/]+')
        .replace('[slug]', '[^/]+');
      const regex = new RegExp('^' + regexPattern + '$');
      return regex.test(router.pathname);
    }
    return router.pathname === pattern;
  });

  const renderContent = () => {
    if (isAdmin) {
      return (
        <ProtectedRoute>
          <AdminLayout>
            <Component {...pageProps} />
          </AdminLayout>
        </ProtectedRoute>
      );
    }

    if (isShopPage) {
      return (
        <div className="shop-page-wrapper">
          <Component {...pageProps} />
          <MerchComplexSliderField />
        </div>
      );
    }

    return <Component {...pageProps} />;
  };

  return (
    <Provider store={store}>
      <AppContent 

        initialMainInfo={mainData?.mainInfo || {}} 
        initialInstagramPhotos={mainData?.instagramPosts || []}
        initialWidgetsInfo={mainData?.pageInfo||[]}
      >
        {renderContent()}
      </AppContent>
    </Provider>
  );
}

// 🔥 ГЛАВНОЕ: getInitialProps в _app - загружает данные для ВСЕХ страниц
MyApp.getInitialProps = async (context: AppContext) => {
  // Получаем данные со страницы если они есть
  const pageProps = context.Component.getInitialProps 
    ? await context.Component.getInitialProps(context.ctx)
    : {};

  // Загружаем основные данные (только если это не admin)
  let mainData = {
    pageInfo: {},
    banners: [],
    mainInfo: {},
    instagramPosts: []
  };

  const isAdminRoute = context.ctx.pathname?.startsWith('/admin');
  
  if (!isAdminRoute) {
    try {
      console.log('🔥 Loading main data in _app getInitialProps for:', context.ctx.pathname);
      
      // Загружаем все данные параллельно (как на index)
      const [pageInfo, banners, mainInfo, instagramPhotos] = await Promise.all([
        getMainPage().catch(() => ({})),
        getMainBanners().catch(() => []),
        getMainInfo().catch(() => ({})),
        getInstagramPhotosServer().catch(() => [])
      ]);
      console.log(pageInfo,"d lskmdlaksmdlaskm")
      mainData = {
        pageInfo: pageInfo || {},
        banners: banners || [],
        mainInfo: mainInfo || {},
        instagramPosts: instagramPhotos || []
      };
    } catch (error) {
      console.error('Failed to load main data in _app:', error);
    }
  }

  return {
    ...pageProps,
    mainData,
  };
};

export default MyApp;