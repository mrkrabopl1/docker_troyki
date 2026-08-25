// pages/index.tsx
import Main from 'src/pages/main/Main';
import { getMainData } from 'lib/mainDataLoader';
import { getMainBanners } from 'src/providers/shopProvider';

export const getStaticProps = async () => {
  console.log('[INDEX] ========================================');
  
  // 🔥 ЗАГРУЖАЕМ РЕАЛЬНЫЕ ДАННЫЕ
  const [mainData, banners] = await Promise.all([
    getMainData(),
    getMainBanners().catch(() => [])
  ]);
  
  // 🔥 ТЕСТОВЫЙ ОБЪЕКТ - ЧТОБЫ ПРОВЕРИТЬ, ЧТО ДАННЫЕ ВООБЩЕ ДОХОДЯТ
  const testData = {
    hello: 'world',
    number: 123,
    arr: [1, 2, 3],
    obj: { foo: 'bar' }
  };
  
  console.log('[INDEX] Тест данные:', testData);
  console.log('[INDEX] Реальные данные:');
  console.log('[INDEX] - pageInfo length:', mainData?.pageInfo?.length || 0);
  console.log('[INDEX] - categories length:', mainData?.mainInfo?.categories?.length || 0);
  console.log('[INDEX] - firms length:', mainData?.mainInfo?.firms?.length || 0);
  
  // 🔥 ПРОВЕРЯЕМ РАЗМЕР РЕАЛЬНЫХ ДАННЫХ
  const realDataSize = JSON.stringify(mainData).length;
  console.log('[INDEX] Реальные данные размер:', (realDataSize / 1024 / 1024).toFixed(2), 'MB');
  
  // 🔥 ПРОВЕРЯЕМ, ЧТО В pageInfo ЕСТЬ ПРОДУКТЫ
  if (mainData?.pageInfo?.length > 0) {
    const firstWidget = mainData.pageInfo[0];
    console.log('[INDEX] Первый виджет:', firstWidget?.name);
    console.log('[INDEX] Продуктов в первом виджете:', firstWidget?.products?.length || 0);
    
    // 🔥 ПРОВЕРЯЕМ ПЕРВЫЙ ПРОДУКТ НА ЦИКЛИЧЕСКИЕ ССЫЛКИ
    if (firstWidget?.products?.length > 0) {
      const firstProduct = firstWidget.products[0];
      console.log('[INDEX] Первый продукт:', firstProduct?.name);
      console.log('[INDEX] Ключи продукта:', Object.keys(firstProduct || {}));
    }
  }
  
  return {
    props: {
      testData: testData, // 👈 ТЕСТОВЫЙ ОБЪЕКТ - ДОЛЖЕН БЫТЬ ВИДЕН В ЛОГАХ!
      initialData: {
        ...mainData, // 👈 РЕАЛЬНЫЕ ДАННЫЕ
        banners: banners || []
      }
    },
    revalidate: 300
  };
};

export default Main;