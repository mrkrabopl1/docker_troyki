// lib/withMainData.ts
import { GetStaticProps, GetServerSideProps } from 'next';
import { getMainData } from './mainDataLoader';

// 🔥 Для getStaticProps
export function withMainData<T extends object>(
  getPageProps?: GetStaticProps<T>
): GetStaticProps<T & { mainData: any }> {
  return async (context) => {
    console.log('[WITH_MAIN_DATA] ========================================');
    console.log('[WITH_MAIN_DATA] Called for path (from params):', context.params?.slug || 'home');
    console.log('[WITH_MAIN_DATA] Type: getStaticProps');
    console.log('[WITH_MAIN_DATA] Params:', context.params || 'none');
    console.log('[WITH_MAIN_DATA] Locale:', context.locale || 'default');
    
    const startTime = Date.now();
    console.log('[WITH_MAIN_DATA] Calling getMainData()...');
    
    const mainData = await getMainData();
    
    const duration = Date.now() - startTime;
    console.log('[WITH_MAIN_DATA] getMainData() completed in', duration, 'ms');
    console.log('[WITH_MAIN_DATA] mainData exists?', !!mainData);
    console.log('[WITH_MAIN_DATA] mainData keys:', Object.keys(mainData || {}));
    console.log('[WITH_MAIN_DATA] mainInfo keys:', Object.keys(mainData?.mainInfo || {}));
    console.log('[WITH_MAIN_DATA] instagramPosts count:', mainData?.instagramPosts?.length || 0);
    
    console.log('[WITH_MAIN_DATA] Calling page getStaticProps...');
    const pageResult = getPageProps ? await getPageProps(context) : { props: {} as T };
    console.log('[WITH_MAIN_DATA] Page props loaded');
    
    const result = {
      ...pageResult,
      props: {
        ...(pageResult as any).props,
        mainData,
      },
      revalidate: (pageResult as any)?.revalidate || 300,
    };
    
    console.log('[WITH_MAIN_DATA] Returning props');
    console.log('[WITH_MAIN_DATA] props.mainData exists?', !!result.props.mainData);
    console.log('[WITH_MAIN_DATA] props.mainData keys:', Object.keys(result.props.mainData || {}));
    console.log('[WITH_MAIN_DATA] ========================================');
    
    return result;
  };
}

// 🔥 Для getServerSideProps
export function withMainDataServer<T extends object>(
  getPageProps?: GetServerSideProps<T>
): GetServerSideProps<T & { mainData: any }> {
  return async (context) => {
    console.log('[WITH_MAIN_DATA_SERVER] ========================================');
    console.log('[WITH_MAIN_DATA_SERVER] Called for path:', context.resolvedUrl || 'unknown');
    console.log('[WITH_MAIN_DATA_SERVER] Type: getServerSideProps');
    console.log('[WITH_MAIN_DATA_SERVER] Query:', context.query || 'none');
    console.log('[WITH_MAIN_DATA_SERVER] Params:', context.params || 'none');
    console.log('[WITH_MAIN_DATA_SERVER] Locale:', context.locale || 'default');
    
    const startTime = Date.now();
    console.log('[WITH_MAIN_DATA_SERVER] Calling getMainData()...');
    
    const mainData = await getMainData();
    
    const duration = Date.now() - startTime;
    console.log('[WITH_MAIN_DATA_SERVER] getMainData() completed in', duration, 'ms');
    console.log('[WITH_MAIN_DATA_SERVER] mainData exists?', !!mainData);
    console.log('[WITH_MAIN_DATA_SERVER] mainData keys:', Object.keys(mainData || {}));
    console.log('[WITH_MAIN_DATA_SERVER] mainInfo keys:', Object.keys(mainData?.mainInfo || {}));
    console.log('[WITH_MAIN_DATA_SERVER] instagramPosts count:', mainData?.instagramPosts?.length || 0);
    
    console.log('[WITH_MAIN_DATA_SERVER] Calling page getServerSideProps...');
    let pageResult: any = { props: {} as T };
    if (getPageProps) {
      pageResult = await getPageProps(context);
    }
    console.log('[WITH_MAIN_DATA_SERVER] Page props loaded');
    
    const pageProps = typeof pageResult.props === 'function' 
      ? await pageResult.props(context) 
      : pageResult.props || {};
    
    const result = {
      ...pageResult,
      props: {
        ...pageProps,
        mainData,
      },
    };
    
    console.log('[WITH_MAIN_DATA_SERVER] Returning props');
    console.log('[WITH_MAIN_DATA_SERVER] props.mainData exists?', !!result.props.mainData);
    console.log('[WITH_MAIN_DATA_SERVER] props.mainData keys:', Object.keys(result.props.mainData || {}));
    console.log('[WITH_MAIN_DATA_SERVER] ========================================');
    
    return result;
  };
}