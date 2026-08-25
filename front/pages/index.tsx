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
  console.log('[INDEX] НАЧАЛО ЗАГРУЗКИ');
  
  const startTime = Date.now();
  
  const [testData, banners] = await Promise.all([
    getTestData(),
    getMainBanners().catch(() => [])
  ]);
  
  const duration = Date.now() - startTime;
  console.log('[INDEX] ВСЕ ДАННЫЕ ЗАГРУЖЕНЫ ЗА', duration, 'ms');
  console.log('[INDEX] testData:', testData);
  console.log('[INDEX] banners:', banners);
  console.log('[INDEX] banners length:', banners.length);
  
  // 🔥🔥🔥 ТЕСТ 1: ОБЫЧНЫЙ МАССИВ
  const testArray = [1, 2, 3, 4, 5];
  
  // 🔥🔥🔥 ТЕСТ 2: МАССИВ СТРОК
  const testStringArray = ['a', 'b', 'c', 'd'];
  
  // 🔥🔥🔥 ТЕСТ 3: ПРОСТОЙ ОБЪЕКТ
  const testSimpleObject = { foo: 'bar', baz: 123 };
  
  // 🔥🔥🔥 ТЕСТ 4: МАССИВ ОБЪЕКТОВ (КАК БАННЕРЫ)
  const testObjectArray = [
    { id: 1, name: 'test1' },
    { id: 2, name: 'test2' },
    { id: 3, name: 'test3' }
  ];
  
  return {
    props: {
      // 🔥 ВСЕ ТЕСТЫ
      testData: testData,
      testArray: testArray,
      testStringArray: testStringArray,
      testSimpleObject: testSimpleObject,
      testObjectArray: testObjectArray,
      banners:banners,
      
      // 🔥 ОРИГИНАЛЬНЫЕ ДАННЫЕ
      initialData: {
        banners: banners || []
      }
    },
    revalidate: 300
  };
};

export default Main;