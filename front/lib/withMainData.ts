// lib/withMainData.ts
import { GetStaticProps, GetServerSideProps } from 'next';
import { getMainData } from './mainDataLoader';

// 🔥 Для getStaticProps
export function withMainData<T extends object>(
  getPageProps?: GetStaticProps<T>
): GetStaticProps<T & { mainData: any }> {
  return async (context) => {
    const mainData = await getMainData();
    const pageResult = getPageProps ? await getPageProps(context) : { props: {} as T };
    
    return {
      ...pageResult,
      props: {
        ...(pageResult as any).props,
        mainData,
      },
      revalidate: (pageResult as any)?.revalidate || 300,
    };
  };
}

// 🔥 Для getServerSideProps
export function withMainDataServer<T extends object>(
  getPageProps?: GetServerSideProps<T>
): GetServerSideProps<T & { mainData: any }> {
  return async (context) => {
    // ✅ Всегда загружаем mainData
    const mainData = await getMainData();
    
    // ✅ Загружаем данные страницы
    let pageResult: any = { props: {} as T };
    if (getPageProps) {
      pageResult = await getPageProps(context);
    }
    
    // ✅ Если pageResult.props - функция, вызываем ее
    const pageProps = typeof pageResult.props === 'function' 
      ? await pageResult.props(context) 
      : pageResult.props || {};
    
    return {
      ...pageResult,
      props: {
        ...pageProps,
        mainData, // 👈 ВСЕГДА добавляем mainData
      },
    };
  };
}