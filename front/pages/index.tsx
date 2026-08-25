// pages/index.tsx
import Main from 'src/pages/main/Main';

export const getStaticProps = async () => {
  console.log('[INDEX] ========================================');
  
  // 🔥🔥🔥 ТЕСТОВЫЕ ДАННЫЕ - МАКСИМАЛЬНО ПРОСТО!
  const testData = {
    hello: 'world',
    number: 123,
    arr: [1, 2, 3],
    obj: { foo: 'bar' }
  };
  
  console.log('[INDEX] Тест данные:', testData);
  
  return {
    props: {
      testData: testData, // 👈 ПРОСТО ПЕРЕДАЕМ
      initialData: {
        pageInfo: [],
        mainInfo: {},
        instagramPosts: [],
        banners: []
      }
    },
    revalidate: 300
  };
};

export default Main;