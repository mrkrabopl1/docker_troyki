// lib/withMainData.ts
import { GetStaticProps, GetServerSideProps } from 'next';
import { getMainData } from './mainDataLoader';

// 🔥 Для getStaticProps
export function withMainData<T extends object>(
  getPageProps?: GetStaticProps<T>
): GetStaticProps<T & { initialData: any }> { // 👈 Меняем тип
  return async (context) => {
    console.log('[WITH_MAIN_DATA] ========================================');
    console.log('[WITH_MAIN_DATA] Called for path:', context.params?.slug || 'home');
    console.log('[WITH_MAIN_DATA] Type: getStaticProps');
    
    const startTime = Date.now();
    console.log('[WITH_MAIN_DATA] Calling getMainData()...');
    
    const mainData = await getMainData();
    
    const duration = Date.now() - startTime;
    console.log('[WITH_MAIN_DATA] getMainData() completed in', duration, 'ms');
    console.log('[WITH_MAIN_DATA] mainData exists?', !!mainData);
    console.log('[WITH_MAIN_DATA] mainData keys:', Object.keys(mainData || {}));
    console.log('[WITH_MAIN_DATA] mainData.pageInfo length:', mainData?.pageInfo?.length || 0);
    console.log('[WITH_MAIN_DATA] mainData.mainInfo keys:', Object.keys(mainData?.mainInfo || {}));
    console.log('[WITH_MAIN_DATA] instagramPosts count:', mainData?.instagramPosts?.length || 0);
    
    console.log('[WITH_MAIN_DATA] Calling page getStaticProps...');
    let pageResult: any = { props: {} as T };
    if (getPageProps) {
      pageResult = await getPageProps(context);
    }
    console.log('[WITH_MAIN_DATA] Page props loaded');
    
    // 🔥 ПРАВИЛЬНО ОБЪЕДИНЯЕМ ДАННЫЕ
    const pageProps = pageResult.props || {};
    
    // Создаем initialData, объединяя mainData и данные из страницы
    const initialData = {
      ...mainData, // pageInfo, mainInfo, instagramPosts
      ...pageProps.initialData, // Дополнительные данные из страницы
      // Явно указываем, что должно быть в initialData
      pageInfo: mainData.pageInfo || pageProps.initialData?.pageInfo || [],
      mainInfo: mainData.mainInfo || pageProps.initialData?.mainInfo || {},
      instagramPosts: mainData.instagramPosts || pageProps.initialData?.instagramPosts || [],
      banners: pageProps.banners || pageProps.initialData?.banners || [],
    };
    
    const result = {
      ...pageResult,
      props: {
        ...pageProps,
        initialData, // 👈 Передаем как единый объект
      },
      revalidate: pageResult?.revalidate || 10,
    };
    
    // 🔥 Проверяем финальные данные
    console.log('[WITH_MAIN_DATA] ✅ Final result:');
    console.log('[WITH_MAIN_DATA] result.props.initialData keys:', Object.keys(result.props.initialData || {}));
    console.log('[WITH_MAIN_DATA] result.props.initialData.pageInfo length:', result.props.initialData?.pageInfo?.length || 0);
    console.log('[WITH_MAIN_DATA] result.props.initialData.mainInfo keys:', Object.keys(result.props.initialData?.mainInfo || {}));
    console.log('[WITH_MAIN_DATA] result.props.initialData.instagramPosts count:', result.props.initialData?.instagramPosts?.length || 0);
    console.log('[WITH_MAIN_DATA] result.props.initialData.banners length:', result.props.initialData?.banners?.length || 0);
    
    // Проверяем размер
    const resultSize = JSON.stringify(result).length;
    console.log('[WITH_MAIN_DATA] Final result size:', (resultSize / 1024 / 1024).toFixed(2), 'MB');
    console.log('[WITH_MAIN_DATA] ========================================');
    
    return result;
  };
}

// 🔥 Для getServerSideProps (аналогично)
export function withMainDataServer<T extends object>(
  getPageProps?: GetServerSideProps<T>
): GetServerSideProps<T & { initialData: any }> {
  return async (context) => {
    console.log('[WITH_MAIN_DATA_SERVER] ========================================');
    console.log('[WITH_MAIN_DATA_SERVER] Called for path:', context.resolvedUrl || 'unknown');
    console.log('[WITH_MAIN_DATA_SERVER] Type: getServerSideProps');
    
    const startTime = Date.now();
    console.log('[WITH_MAIN_DATA_SERVER] Calling getMainData()...');
    
    const mainData = await getMainData();
    
    const duration = Date.now() - startTime;
    console.log('[WITH_MAIN_DATA_SERVER] getMainData() completed in', duration, 'ms');
    console.log('[WITH_MAIN_DATA_SERVER] mainData exists?', !!mainData);
    console.log('[WITH_MAIN_DATA_SERVER] mainData keys:', Object.keys(mainData || {}));
    console.log('[WITH_MAIN_DATA_SERVER] mainData.pageInfo length:', mainData?.pageInfo?.length || 0);
    
    console.log('[WITH_MAIN_DATA_SERVER] Calling page getServerSideProps...');
    let pageResult: any = { props: {} as T };
    if (getPageProps) {
      pageResult = await getPageProps(context);
    }
    console.log('[WITH_MAIN_DATA_SERVER] Page props loaded');
    
    const pageProps = pageResult.props || {};
    
    // Объединяем данные
    const initialData = {
      ...mainData,
      ...pageProps.initialData,
      pageInfo: mainData.pageInfo || pageProps.initialData?.pageInfo || [],
      mainInfo: mainData.mainInfo || pageProps.initialData?.mainInfo || {},
      instagramPosts: mainData.instagramPosts || pageProps.initialData?.instagramPosts || [],
      banners: pageProps.banners || pageProps.initialData?.banners || [],
    };
    
    const result = {
      ...pageResult,
      props: {
        ...pageProps,
        initialData,
      },
    };
    
    console.log('[WITH_MAIN_DATA_SERVER] ✅ Final result:');
    console.log('[WITH_MAIN_DATA_SERVER] result.props.initialData.pageInfo length:', result.props.initialData?.pageInfo?.length || 0);
    console.log('[WITH_MAIN_DATA_SERVER] ========================================');
    
    return result;
  };
}