// pages/_app.tsx
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { Provider } from 'react-redux';
import { setupStore } from 'src/store/store';
import React, { useEffect } from 'react';
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

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  console.log('[_APP] ========================================');

  // 🔥 ПРОВЕРЯЕМ ВСЕ ТЕСТЫ
  console.log('[_APP] testData:', pageProps.testData);
  console.log('[_APP] testArray:', pageProps.testArray);
  console.log('[_APP] testStringArray:', pageProps.testStringArray);
  console.log('[_APP] testSimpleObject:', pageProps.testSimpleObject);
  console.log('[_APP] testObjectArray:', pageProps.testObjectArray);
  console.log('[_APP] testObjectArray length:', pageProps.testObjectArray?.length || 0);

  // 🔥 ПРОВЕРЯЕМ INITIALDATA
  console.log('[_APP] initialData:', pageProps.initialData);
  console.log('[_APP] initialData.banners:', pageProps.initialData?.banners);
  console.log('[_APP] initialData.banners length:', pageProps.initialData?.banners?.length || 0);

  console.log('[_APP] ========================================');

  console.log('[_APP] ========================================');
  useEffect(() => {
    // @ts-ignore
    const nextData = window.__NEXT_DATA__;
    const size = JSON.stringify(nextData).length;
    console.log('📊 __NEXT_DATA__ size:', (size / 1024 / 1024).toFixed(2), 'MB');

    // @ts-ignore
    const pageInfo = nextData?.props?.pageProps?.initialData?.pageInfo;
    console.log('📊 pageInfo in __NEXT_DATA__:', pageInfo?.length || 0);
  }, []);
  // 🔥 ПРОВЕРКА НА КЛИЕНТЕ - ЧТО ПРИШЛО В __NEXT_DATA__
  useEffect(() => {
    console.log('[_APP useEffect] ========================================');
    console.log('[_APP useEffect] pageProps.initialData.pageInfo ДЛИНА:', pageProps.initialData?.pageInfo?.length || 0);
    console.log('[_APP useEffect] pageProps.initialData.pageInfo ПЕРВЫЙ:', pageProps.initialData?.pageInfo?.[0]?.name || 'НЕТ');

    // @ts-ignore
    const nextData = window.__NEXT_DATA__?.props?.pageProps?.initialData;
    console.log('[_APP useEffect] __NEXT_DATA__ ДОСТУПЕН?', !!nextData);
    console.log('[_APP useEffect] __NEXT_DATA__.pageInfo ДЛИНА:', nextData?.pageInfo?.length || 0);
    console.log('[_APP useEffect] __NEXT_DATA__.pageInfo ПЕРВЫЙ:', nextData?.pageInfo?.[0]?.name || 'НЕТ');

    // РАЗМЕР __NEXT_DATA__
    // @ts-ignore
    const nextDataSize = JSON.stringify(window.__NEXT_DATA__ || {}).length;
    console.log('[_APP useEffect] __NEXT_DATA__ РАЗМЕР:', (nextDataSize / 1024 / 1024).toFixed(2), 'MB');

    // СРАВНИВАЕМ pageProps и __NEXT_DATA__
    const fromProps = pageProps.initialData?.pageInfo?.length || 0;
    const fromNextData = nextData?.pageInfo?.length || 0;
    console.log('[_APP useEffect] pageProps.pageInfo:', fromProps);
    console.log('[_APP useEffect] __NEXT_DATA__.pageInfo:', fromNextData);

    if (fromProps === 0 && fromNextData > 0) {
      console.log('[_APP useEffect] ⚠️ ДАННЫЕ ЕСТЬ В __NEXT_DATA__, НО НЕТ В pageProps!');
      console.log('[_APP useEffect] ⚠️ ЭТО ПРОБЛЕМА ГИДРАТАЦИИ!');
    }

    if (fromProps === 0 && fromNextData === 0) {
      console.log('[_APP useEffect] ❌ ДАННЫХ НЕТ НИГДЕ!');
    }

    if (fromProps > 0) {
      console.log('[_APP useEffect] ✅ ДАННЫЕ ЕСТЬ В pageProps!');
    }
    console.log('[_APP useEffect] ========================================');
  }, [pageProps]);

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

  // 🔥 ПРОВЕРКА ПЕРЕД ПЕРЕДАЧЕЙ В AppContent
  const mainInfo = pageProps.mainData?.mainInfo || pageProps.initialData?.mainInfo || {};
  const instagramPosts = pageProps.mainData?.instagramPosts || pageProps.initialData?.instagramPosts || [];
  const widgetsInfo = pageProps.mainData?.pageInfo || pageProps.initialData?.pageInfo || [];

  console.log('[_APP ПЕРЕД AppContent] ========================================');
  console.log('[_APP ПЕРЕД AppContent] mainInfo.categories ДЛИНА:', mainInfo?.categories?.length || 0);
  console.log('[_APP ПЕРЕД AppContent] widgetsInfo ТИП:', typeof widgetsInfo);
  console.log('[_APP ПЕРЕД AppContent] widgetsInfo МАССИВ?:', Array.isArray(widgetsInfo));
  console.log('[_APP ПЕРЕД AppContent] widgetsInfo ДЛИНА:', widgetsInfo?.length || 0);
  console.log('[_APP ПЕРЕД AppContent] widgetsInfo ПЕРВЫЙ:', widgetsInfo?.[0]?.name || 'НЕТ');
  console.log('[_APP ПЕРЕД AppContent] ========================================');

  return (
    <Provider store={store}>
      <AppContent
        initialMainInfo={mainInfo}
        initialInstagramPhotos={instagramPosts}
        initialWidgetsInfo={widgetsInfo}
      >
        {renderContent()}
      </AppContent>
    </Provider>
  );
}

export default MyApp;