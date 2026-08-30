// pages/_app.tsx
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { Provider } from 'react-redux';
import { setupStore } from 'src/store/store';
import React, { useEffect, useState } from 'react';
import AppContent from 'src/AppContent';
import ProtectedRoute from 'src/components/admin/ProtectedRoute';
import AdminLayout from 'src/pages/admin/adminLayout/AdminLayout';
import MerchComplexSliderField from 'src/modules/merchField/MerchComplexSliderField';
import 'src/global.css';
import { setHydrated } from 'src/store/reducers/loadingSlice';
import { setupNavigationMonitoring } from 'lib/navigationDiagnostic';
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
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setupNavigationMonitoring();
    }
  }, []);

  // 🆕 Отслеживаем события роутера
  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      console.log(`🔵 [ROUTER] Начало смены маршрута: ${url}`);
      console.log(`   ⏱️ ${new Date().toISOString()}`);

      // Проверяем размер данных в __NEXT_DATA__
      try {
        // @ts-ignore
        const nextData = window.__NEXT_DATA__;
        const size = JSON.stringify(nextData).length;
        console.log(`   📊 Размер __NEXT_DATA__: ${(size / 1024 / 1024).toFixed(2)} MB`);
      } catch (e) {
        // ignore
      }
    };

    const handleRouteChangeComplete = (url: string) => {
      console.log(`🟢 [ROUTER] Смена маршрута завершена: ${url}`);
      console.log(`   ⏱️ ${new Date().toISOString()}`);
    };

    const handleRouteChangeError = (err: Error, url: string) => {
      console.error(`🔴 [ROUTER] Ошибка при смене маршрута: ${url}`);
      console.error(err);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router]);
  // 👈 Отмечаем гидратацию
  useEffect(() => {
    setIsClient(true);
    // Диспатчим setHydrated после гидратации
    store.dispatch(setHydrated());
  }, []);
  console.log('[_APP] ========================================');
  // pages/_app.tsx - временно добавить для измерения
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Размер __NEXT_DATA__
      const nextData = window.__NEXT_DATA__;
      const size = JSON.stringify(nextData).length;
      console.log('📊 __NEXT_DATA__ size:', (size / 1024 / 1024).toFixed(2), 'MB');

      // 2. Время до гидратации
      const start = performance.now();
      requestAnimationFrame(() => {
        const end = performance.now();
        console.log('⏱️ Time to hydration:', (end - start).toFixed(0), 'ms');
      });

      // 3. Размер JS бандла - ИСПРАВЛЕННАЯ ВЕРСИЯ
      setTimeout(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const jsFiles = resources.filter(r =>
          r.name.includes('.js') &&
          (r.name.includes('_next') || r.name.includes('chunks'))
        );
        const totalJS = jsFiles.reduce((sum, r) => sum + (r.transferSize || 0), 0);
        console.log('📦 Total JS size:', (totalJS / 1024 / 1024).toFixed(2), 'MB');

        // Дополнительно: размер каждого чанка
        jsFiles.forEach(r => {
          console.log(`  - ${r.name.split('/').pop()}: ${(r.transferSize / 1024).toFixed(0)}KB`);
        });
      }, 1000);

      // 4. 🔥 Время до First Paint (самый важный показатель)
      const paintEntries = performance.getEntriesByType('paint');
      const firstPaint = paintEntries.find(e => e.name === 'first-paint');
      const firstContentfulPaint = paintEntries.find(e => e.name === 'first-contentful-paint');
      if (firstPaint) {
        console.log('🖌️ First Paint:', firstPaint.startTime.toFixed(0), 'ms');
      }
      if (firstContentfulPaint) {
        console.log('🖌️ First Contentful Paint:', firstContentfulPaint.startTime.toFixed(0), 'ms');
      }

      // 5. 🔥 Время до LCP (Largest Contentful Paint)
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        console.log('🖼️ LCP:', lastEntry.startTime.toFixed(0), 'ms');
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // 6. Время до TTI (Time to Interactive) - приблизительно
      setTimeout(() => {
        const tti = performance.now();
        console.log('⚡ Time to Interactive (approx):', tti.toFixed(0), 'ms');
      }, 3000);
    }
  }, []);

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
  const mainInfo = pageProps.mainData?.mainInfo || pageProps.initialData?.menuInfo || {};
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