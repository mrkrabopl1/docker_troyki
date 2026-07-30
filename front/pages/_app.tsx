// pages/_app.tsx
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { Provider } from 'react-redux';
import { setupStore } from 'src/store/store';
import AppContent from 'src/AppContent';
import ProtectedRoute from 'src/components/admin/ProtectedRoute';
import AdminLayout from 'src/pages/admin/adminLayout/AdminLayout';
import 'src/global.css';

const store = setupStore();

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAdmin = router.pathname.startsWith('/admin') && 
                  !router.pathname.startsWith('/admin/login') &&
                  !router.pathname.startsWith('/admin/forgot-password') &&
                  !router.pathname.startsWith('/admin/reset-password') &&
                  !router.pathname.startsWith('/admin/accept-invite');

  // 🔥 Берем данные с сервера
  const initialMainInfo = pageProps.initialData?.mainInfo;

  return (
    <Provider store={store}>
      {/* 🔥 Передаем initialMainInfo в AppContent */}
      <AppContent initialMainInfo={initialMainInfo}>
        {isAdmin ? (
          <ProtectedRoute>
            <AdminLayout>
              <Component {...pageProps} />
            </AdminLayout>
          </ProtectedRoute>
        ) : (
          <Component {...pageProps} />
        )}
      </AppContent>
    </Provider>
  );
}