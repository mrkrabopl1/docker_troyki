import {
  GetStaticProps,
  GetStaticPropsContext,
  GetServerSideProps,
  GetServerSidePropsContext,
  GetStaticPropsResult,
  GetServerSidePropsResult,
} from 'next';

import { getMainData } from './mainDataLoader';

type MainData = {
  pageInfo: any[];
  menuInfo: any;
  instagramPosts?: any[];
};

type WithMainData = {
  initialData: MainData;
};

function hasProps<T extends object>(
  result: GetServerSidePropsResult<T>
): result is { props: T } {
  return 'props' in result;
}

function hasStaticProps<T extends object>(
  result: GetStaticPropsResult<T>
): result is { props: T } {
  return 'props' in result;
}

/**
 * getStaticProps
 */
export function withMainData<T extends object>(
  getPageProps?: GetStaticProps<T>
): GetStaticProps<T & WithMainData> {
  return async (context) => {
    // ВАЖНО:
    // Promise.all — mainData и данные страницы грузятся параллельно
    const [mainData, pageResult] = await Promise.all([
      getMainData(),

      getPageProps
        ? getPageProps(context)
        : Promise.resolve({ props: {} as T }),
    ]);

    // Если страница вернула redirect / notFound —
    // не пытаемся читать props
    if (!hasStaticProps(pageResult)) {
      return pageResult as any;
    }

    const pageProps = pageResult.props;

    const initialData: MainData = {
      pageInfo: mainData?.pageInfo ?? [],
      menuInfo: mainData?.menuInfo ?? {},
    };

    return {
      ...pageResult,

      props: {
        ...pageProps,

        initialData: {
          ...initialData,
          ...(pageProps as any).initialData,
        },
      },

      revalidate:
        'revalidate' in pageResult
          ? pageResult.revalidate
          : 60,
    } as any;
  };
}

/**
 * getServerSideProps
 */
export function withMainDataServer<T extends object>(
  getPageProps?: GetServerSideProps<T>
): GetServerSideProps<T & WithMainData> {
  return async (context) => {
   
    const [mainData, pageResult] = await Promise.all([
      getMainData(),

      getPageProps
        ? getPageProps(context)
        : Promise.resolve({ props: {} as T }),
    ]);

    // redirect / notFound
    if (!hasProps(pageResult)) {
      return pageResult as any;
    }

    const pageProps = pageResult.props;

    const initialData: MainData = {
      pageInfo: mainData?.pageInfo ?? [],
      menuInfo: mainData?.menuInfo ?? {},
    };

    return {
      ...pageResult,

      props: {
        ...pageProps,

        initialData: {
          ...initialData,

          // сохраняем данные конкретной страницы
          ...(pageProps as any).initialData,
        },
      },
    } as any;
  };
}