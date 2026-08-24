// pages/_app.tsx
import type { AppProps } from 'next/app'; // 👈 Убрал AppContext
import { useRouter } from 'next/router';
import { Provider } from 'react-redux';
import { setupStore } from 'src/store/store';
import React from 'react';
import AppContent from 'src/AppContent';
import ProtectedRoute from 'src/components/admin/ProtectedRoute';
import AdminLayout from 'src/pages/admin/adminLayout/AdminLayout';
import MerchComplexSliderField from 'src/modules/merchField/MerchComplexSliderField';
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

function MyApp({ Component, pageProps }: AppProps) { // 👈 Убрал mainData
  const router = useRouter();
  console.log('[_APP] ========================================');
  console.log('[_APP] Router path:', router.pathname);
  console.log('[_APP] pageProps:', pageProps);
  console.log('[_APP] pageProps.mainData:', pageProps.mainData);
  console.log('[_APP] pageProps.mainData exists?', !!pageProps.mainData);
  console.log('[_APP] pageProps.mainData keys:', pageProps.mainData ? Object.keys(pageProps.mainData) : 'null');
  console.log('[_APP] pageProps.mainData.mainInfo:', pageProps.mainData?.mainInfo);
  console.log('[_APP] pageProps.mainData.mainInfo keys:', pageProps.mainData?.mainInfo ? Object.keys(pageProps.mainData.mainInfo) : 'null');
  console.log('[_APP] pageProps.initialData:', pageProps.initialData);
  console.log('[_APP] ========================================');
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

  // ✅ Добавил console.log для проверки
  console.log('🔥 pageProps in _app:', pageProps);
  console.log('🔥 mainData:', pageProps.mainData);
  console.log('🔥 initialData:', pageProps.initialData);

  return (
    <Provider store={store}>
      <AppContent
        initialMainInfo={pageProps.mainData?.mainInfo || pageProps.initialData?.mainInfo || {}}
        initialInstagramPhotos={pageProps.mainData?.instagramPosts || pageProps.initialData?.instagramPosts || []}
        initialWidgetsInfo={pageProps.mainData?.pageInfo || pageProps.initialData?.pageInfo || {}}
      >
        {renderContent()}
      </AppContent>
    </Provider>
  );
}

// ❌ УДАЛИЛ getInitialProps полностью

export default MyApp;