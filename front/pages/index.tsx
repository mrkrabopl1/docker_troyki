// pages/index.tsx
import Main from 'src/pages/main/Main';
import { getMainBanners } from 'src/providers/shopProvider';

// 🔥 АСИНХРОННАЯ ФУНКЦИЯ, КОТОРАЯ ВОЗВРАЩАЕТ ТЕСТОВЫЙ ОБЪЕКТ С ЗАДЕРЖКОЙ
const getTestData = async () => {
  console.log('[TEST] Начинаю загрузку тестовых данных...');
  
  // 🔥 СИМУЛИРУЕМ АСИНХРОННУЮ ЗАГРУЗКУ (НАПРИМЕР, С БД)
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const testData = {
    hello: 'world',
    number: 123,
    arr: [1, 2, 3],
    obj: { foo: 'bar' },
    timestamp: Date.now()
  };
  
  console.log('[TEST] Тестовые данные загружены:', testData);
  return testData;
};

export const getStaticProps = async () => {
  console.log('[INDEX] ========================================');
  console.log('[INDEX] НАЧАЛО ЗАГРУЗКИ');
  
  // 🔥 ЗАГРУЖАЕМ ВСЁ АСИНХРОННО
  const startTime = Date.now();
  
  const [testData, banners] = await Promise.all([
    getTestData(),           // 👈 АСИНХРОННЫЙ ТЕСТ
    getMainBanners().catch(() => [])  // 👈 ТВОЙ БАННЕР
  ]);
  
  const duration = Date.now() - startTime;
  console.log('[INDEX] ВСЕ ДАННЫЕ ЗАГРУЖЕНЫ ЗА', duration, 'ms');
  console.log('[INDEX] testData:', testData);
  console.log('[INDEX] banners:', banners.length);
  
  return {
    props: {
      testData: testData,     // 👈 АСИНХРОННЫЙ ТЕСТ
      initialData: {
        banners: banners || []
      }
    },
    revalidate: 300
  };
};

export default Main;