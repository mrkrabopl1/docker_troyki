import React, {
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';

import { useAppDispatch } from 'src/store/hooks/redux';
import { useRouteChange } from 'src/store/hooks/redux';

import {
  cartCountAction,
  setDiscountRules,
  setSizeTables,
  show,
  sticky,
  types,
  categories,
  setFirmMap,
  setFirms,
  collections,
  setLineMap,
} from 'src/store/reducers/menuSlice';

import { setFooter } from 'src/store/reducers/dispetcherSlice';
import { setWidthProps } from 'src/store/reducers/resizeSlice';
import { setInstagramPhotos } from 'src/store/reducers/instagramSlice';
import {
  setPageInfo,
  SliderData,
} from 'src/store/reducers/widgetSlice';

import { getCookie } from './global';
import { setUniqueCustomer } from './providers/userProvider';
import { getCartCount } from './providers/shopProvider';
import { getInstagramPhotos, getBrandsWithLines } from './providers/instagramProvider';

import {
  addImageToLoad,
  imageLoaded,
} from 'src/store/reducers/loadingSlice';

import ScrollToTop from './scrollToTop';
import Preloader from './components/preloader/Preloader';
import CookieInfo from './components/cookieInfo/CookieInfo';
import ComplexDropMenuWithRequest from './modules/menu/ComplexDropMenuWithRequest';
import StickyDispetcherButton from 'src/modules/stickyDispetcherButton/StickyDispetcherButton';
import Footer from './modules/footer/Footer';

import { Firm, Line } from 'src/types/modules';

interface AppContentProps {
  children: React.ReactNode;

  // SSR
  initialMainInfo?: any;

  // Instagram теперь НЕ приходит с SSR
  initialInstagramPhotos?: any[];

  // SSR
  initialWidgetsInfo?: SliderData;
}

const AppContent: React.FC<AppContentProps> = ({
  children,
  initialMainInfo,
  initialInstagramPhotos,
  initialWidgetsInfo,
}) => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    // Проверяем размер переданных данных
    if (initialMainInfo) {
      const size = JSON.stringify(initialMainInfo).length;
      console.log(`📊 [AppContent] initialMainInfo размер: ${(size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   - categories: ${initialMainInfo.categories?.length || 0}`);
      console.log(`   - firms: ${initialMainInfo.firms?.length || 0}`);
    }

    if (initialWidgetsInfo) {
      const size = JSON.stringify(initialWidgetsInfo).length;
      console.log(`📊 [AppContent] initialWidgetsInfo размер: ${(size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   - количество: ${initialWidgetsInfo.length || 0}`);
    }

    if (initialInstagramPhotos) {
      const size = JSON.stringify(initialInstagramPhotos).length;
      console.log(`📊 [AppContent] initialInstagramPhotos размер: ${(size / 1024 / 1024).toFixed(2)} MB`);
    }
  }, [initialMainInfo, initialWidgetsInfo, initialInstagramPhotos]);
  const contRef = useRef<HTMLDivElement>(null);

  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animationFrameRef = useRef<number | null>(null);

  const initializedRef = useRef(false);

  useRouteChange();

  // ============================================================
  // COOKIE
  // ============================================================

  const handleCookieAccept = useCallback(() => {
    // ничего тяжёлого здесь не делаем
  }, []);

  // ============================================================
  // RESIZE
  // ============================================================

  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      const width = document.body.clientWidth;

      if (width < 300) {
        dispatch(setWidthProps(2));
      } else if (width < 700) {
        dispatch(setWidthProps(1));
      } else {
        dispatch(setWidthProps(0));
      }
    }, 100);
  }, [dispatch]);

  // ============================================================
  // APPLY MAIN INFO
  // ============================================================

  const applyFirmsToRedux = useCallback((data) => {
    // --------------------------------------------------------
    // FIRMS / COLLECTIONS
    // --------------------------------------------------------

    const fieldData: Record<
      string,
      Record<string, string>
    > = {};

    const firmMap: Record<string, Firm> = {};
    const lineMap: Record<string, Line> = {};

    const firms = Array.isArray(data.firms)
      ? data.firms
      : [];

    firms.forEach((row: any) => {
      if (!row?.brand_slug) return;

      firmMap[row.brand_slug] = {
        id: row.brand_id,
        name: row.firm,
        slug: row.brand_slug,
      };

      if (!fieldData[row.firm]) {
        fieldData[row.firm] = {};
      }

      if (row.collection_name && row.line_id) {
        fieldData[row.firm][row.line_id] =
          row.collection_name;
      }

      if (
        row.collection_name &&
        row.line_id &&
        row.collection_slug &&
        !lineMap[row.collection_slug]
      ) {
        lineMap[row.collection_slug] = {
          id: row.line_id,
          name: row.collection_name,
          slug: row.collection_slug,
          brand_id: row.brand_id,
        };
      }
    });

    dispatch(setFirms(Object.keys(fieldData)));
    dispatch(setFirmMap(firmMap));
    dispatch(collections(fieldData));
    dispatch(setLineMap(lineMap));
  }, [dispatch])
  const applyDataToRedux = useCallback(
    (data: any) => {
      if (!data) return;

      // --------------------------------------------------------
      // CATEGORIES / TYPES
      // --------------------------------------------------------

      const categoriesVal: Record<string, any> = {};
      const typesVal: Record<string, any> = {};

      const categoryRows = Array.isArray(data.categories)
        ? data.categories
        : [];

      categoryRows.forEach((row: any) => {
        if (!row?.category_key) return;

        if (!categoriesVal[row.category_key]) {
          categoriesVal[row.category_key] = {
            id: row.category_id,
            image_path: row.image_path,
            category_name: row.category_name,
            types: {},
          };
        }

        if (row.type_id) {
          categoriesVal[row.category_key].types[row.type_key] =
            row.type_id;

          typesVal[row.type_id] = {
            name: row.type_name,
            categoryName: row.category_name,
            category_key: row.category_key,
            type_key: row.type_key,
            category_id: row.category_id,
          };
        }
      });

      dispatch(types(typesVal));
      dispatch(categories(categoriesVal));



      // --------------------------------------------------------
      // DISCOUNTS
      // --------------------------------------------------------

      const discounts = Array.isArray(data.discounts)
        ? data.discounts
        : [];

      const activeDiscounts = discounts
        .filter((rule: any) => rule?.is_active)
        .map((rule: any) => ({
          id: rule.id,
          name: rule.name,
          discount_type: rule.discount_type,
          discount_value: rule.discount_value,
        }));

      dispatch(setDiscountRules(activeDiscounts));

      // --------------------------------------------------------
      // SIZE TABLES
      // --------------------------------------------------------

      if (data.sizeTables) {
        dispatch(setSizeTables(data.sizeTables));
      }
    },
    [dispatch]
  );

  // ============================================================
  // INSTAGRAM
  // ============================================================

  const loadInstagramPhotos = useCallback(async () => {
    try {
      const cached = localStorage.getItem(
        'instagramPhotosCache'
      );

      if (cached) {
        try {
          const parsed = JSON.parse(cached);

          const age = Date.now() - parsed.timestamp;

          // 10 минут
          if (
            age < 10 * 60 * 1000 &&
            Array.isArray(parsed.data)
          ) {
            dispatch(setInstagramPhotos(parsed.data));

            // Не ждём API
            // Обновление можно сделать в фоне
            return;
          }
        } catch {
          localStorage.removeItem('instagramPhotosCache');
        }
      }

      const photos = await getInstagramPhotos();

      if (Array.isArray(photos)) {
        dispatch(setInstagramPhotos(photos));

        localStorage.setItem(
          'instagramPhotosCache',
          JSON.stringify({
            data: photos,
            timestamp: Date.now(),
          })
        );
      }
    } catch (error) {
      console.error(
        '[APP_CONTENT] Instagram failed:',
        error
      );
    }
  }, [dispatch]);





  const loadFirmsPhotos = useCallback(async () => {
    try {
      const cached = localStorage.getItem(
        'firmsWithLinesCache'
      );

      if (cached) {
        try {
          const parsed = JSON.parse(cached);

          const age = Date.now() - parsed.timestamp;

          // 10 минут
          if (
            age < 10 * 60 * 1000 &&
            Array.isArray(parsed.data)
          ) {
            applyFirmsToRedux(parsed.data);

            // Не ждём API
            // Обновление можно сделать в фоне
            return;
          }
        } catch {
          localStorage.removeItem('firmsWithLinesCache');
        }
      }

      const data = await getBrandsWithLines();

      applyFirmsToRedux(data);

      localStorage.setItem(
        'instagramPhotosCache',
        JSON.stringify({
          data: data,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error(
        '[APP_CONTENT] Instagram failed:',
        error
      );
    }
  }, [dispatch]);

  // ============================================================
  // INITIALIZATION
  // ============================================================
  const hasData = useMemo(() => {
    return (
      initialMainInfo?.categories?.length > 0 ||
      initialMainInfo?.firms?.length > 0
    );
  }, [initialMainInfo]);
  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    if (!hasData) {
      console.log('⏳ [AppContent] Данных нет, пропускаем инициализацию');
      return;
    }
    initializedRef.current = true;

    // ----------------------------------------------------------
    // MAIN INFO
    // ----------------------------------------------------------

    if (initialMainInfo) {
      applyDataToRedux(initialMainInfo);
    }

    // ----------------------------------------------------------
    // WIDGETS
    // ----------------------------------------------------------

    if (initialWidgetsInfo) {
      dispatch(setPageInfo(initialWidgetsInfo));
    }

    // ----------------------------------------------------------
    // INSTAGRAM
    //
    // Не блокирует страницу.
    // ----------------------------------------------------------

    if (
      initialInstagramPhotos &&
      initialInstagramPhotos.length > 0
    ) {
      dispatch(
        setInstagramPhotos(initialInstagramPhotos)
      );
    } else {
      // запускаем отдельно
      void loadInstagramPhotos();
    }
  }, [
    initialMainInfo,
    initialWidgetsInfo,
    initialInstagramPhotos,
    applyDataToRedux,
    loadInstagramPhotos,
    dispatch,
  ]);

  // ============================================================
  // INITIAL CLIENT SETUP
  // ============================================================

  useEffect(() => {
    handleResize();

    window.addEventListener(
      'resize',
      handleResize
    );

    // ----------------------------------------------------------
    // UNIQUE CUSTOMER
    // ----------------------------------------------------------

    if (!getCookie('unique')) {
      setUniqueCustomer(() => { });
    }

    // ----------------------------------------------------------
    // CART
    // ----------------------------------------------------------

    const cartCookie = getCookie('cart');

    if (cartCookie) {
      getCartCount((data: any) => {
        dispatch(cartCountAction(data));
      });
    }

    return () => {
      window.removeEventListener(
        'resize',
        handleResize
      );

      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }
    };
  }, [dispatch, handleResize]);

  // ============================================================
  // CONTENT HEIGHT
  // ============================================================

  useEffect(() => {
    const element = contRef.current;

    if (!element) return;

    let frameId: number | null = null;

    const observer = new ResizeObserver(() => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        const offsetHeight = element.offsetHeight;

        const {
          innerHeight,
          scrollY,
        } = window;

        if (
          innerHeight >= offsetHeight ||
          scrollY < 150
        ) {
          dispatch(show(true));
        }
      });
    });

    observer.observe(element);

    return () => {
      observer.disconnect();

      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [dispatch]);

  // ============================================================
  // WHEEL
  // ============================================================

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      const element = contRef.current;

      if (!element) return;

      if (animationFrameRef.current) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }

      const deltaY = e.deltaY;

      animationFrameRef.current =
        requestAnimationFrame(() => {
          const {
            scrollHeight,
            clientHeight,
          } = element;

          const {
            scrollY,
            innerHeight,
          } = window;

          if (deltaY > 0) {
            if (
              Math.ceil(
                scrollY +
                innerHeight +
                3
              ) >= scrollHeight
            ) {
              return;
            }

            if (scrollY + deltaY < 150) {
              dispatch(sticky(false));
            } else if (
              scrollHeight -
              innerHeight >
              150
            ) {
              dispatch(show(false));
            }
          } else {
            if (scrollY === 0) {
              dispatch(show(true));
              return;
            }

            dispatch(show(true));

            if (scrollY + deltaY >= 150) {
              dispatch(sticky(true));
            }
          }

          if (
            Math.ceil(
              scrollY +
              innerHeight +
              deltaY
            ) >=
            scrollHeight - 100
          ) {
            dispatch(setFooter(true));
          } else if (
            Math.ceil(
              scrollY + innerHeight
            ) <=
            scrollHeight - 100
          ) {
            dispatch(setFooter(false));
          }
        });
    },
    [dispatch]
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <ScrollToTop />

      <Preloader />

      <CookieInfo
        showAfter={3000}
        onAccept={handleCookieAccept}
        policyLink="/cookie-policy"
      />

      <div
        ref={contRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
        onWheel={handleWheel}
      >
        <ComplexDropMenuWithRequest />

        <StickyDispetcherButton
          top="10%"
          left="10%"
        />

        {children}

        <Footer />
      </div>
    </>
  );
};

export default AppContent;