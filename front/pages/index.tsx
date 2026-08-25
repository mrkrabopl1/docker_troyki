// pages/index.tsx
import Main from 'src/pages/main/Main';
import { getMainBanners } from 'src/providers/shopProvider';

const getTestData = async () => {
  console.log('[TEST] Начинаю загрузку тестовых данных...');
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
  
  const [testData, banners] = await Promise.all([
    getTestData(),
    getMainBanners().catch(() => [])
  ]);
  
  // 🔥 ДЕЛАЕМ ГЛУБОКУЮ КОПИЮ!
  // const safeBanners = JSON.parse(JSON.stringify(banners));
  // // ИЛИ
  // const safeBanners = banners.map(b => ({ ...b }));
  // // ИЛИ
  let safeBanners = structuredClone(banners); // 👈 СОВРЕМЕННЫЙ СПОСОБ
  
  console.log('[INDEX] original banners:', banners);
  console.log('[INDEX] safe banners copy:', safeBanners);
  console.log("testData",testData)
  
  return {
    props: {
      testData: testData,
      // 🔥 ПЕРЕДАЁМ КОПИЮ, А НЕ ОРИГИНАЛ!
      banners: safeBanners[0]|| "no data",
      initialData: {
        banners: safeBanners[0]|| "no data"
      }
    },
    revalidate: 300
  };
};

export default Main;