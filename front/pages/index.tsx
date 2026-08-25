// pages/index.tsx
import Main from 'src/pages/main/Main';
import { getMainData } from 'lib/mainDataLoader';
import { getMainBanners } from 'src/providers/shopProvider';

export const getStaticProps = async () => {
  console.log('[INDEX] ========================================');
  console.log('[INDEX] getStaticProps НАЧАЛО');
  
  const [mainData, banners] = await Promise.all([
    getMainData(),
    getMainBanners().catch(() => [])
  ]);
  
  console.log('[INDEX] mainData ПОЛУЧЕН:');
  console.log('[INDEX] - mainData.pageInfo ДЛИНА:', mainData?.pageInfo?.length || 0);
  console.log('[INDEX] - mainData.pageInfo ПЕРВЫЙ:', mainData?.pageInfo?.[0]?.name || 'НЕТ');
  console.log('[INDEX] - mainData.pageInfo ТИП:', typeof mainData?.pageInfo);
  console.log('[INDEX] - mainData.pageInfo МАССИВ?:', Array.isArray(mainData?.pageInfo));
  console.log('[INDEX] - mainData.mainInfo.categories ДЛИНА:', mainData?.mainInfo?.categories?.length || 0);
  console.log('[INDEX] - banners ДЛИНА:', banners.length);
  
  const result = {
    props: {
      initialData: {
        ...mainData,
        banners
      }
    },
    revalidate: 300
  };
  
  console.log('[INDEX] ОТПРАВЛЯЮ В ПРОПС:');
  console.log('[INDEX] - result.props.initialData.pageInfo ДЛИНА:', result.props.initialData?.pageInfo?.length || 0);
  console.log('[INDEX] - result.props.initialData.pageInfo ПЕРВЫЙ:', result.props.initialData?.pageInfo?.[0]?.name || 'НЕТ');
  console.log('[INDEX] - result.props.initialData.pageInfo ТИП:', typeof result.props.initialData?.pageInfo);
  console.log('[INDEX] - result.props.initialData.pageInfo МАССИВ?:', Array.isArray(result.props.initialData?.pageInfo));
  
  // 🔥 ПРОВЕРЯЕМ РАЗМЕР ОТПРАВЛЯЕМЫХ ДАННЫХ
  const dataSize = JSON.stringify(result).length;
  console.log('[INDEX] - РАЗМЕР ОТПРАВЛЯЕМЫХ ДАННЫХ:', (dataSize / 1024 / 1024).toFixed(2), 'MB');
  console.log('[INDEX] ========================================');
  
  return result;
};

export default Main;