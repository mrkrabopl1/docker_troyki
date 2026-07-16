// src/AppContent.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch } from 'src/store/hooks/redux';
import { useRouteChange } from 'src/store/hooks/redux';
import { cartCountAction, setDiscountRules, setSizeTables } from 'src/store/reducers/menuSlice';
import { show, sticky, types, categories, setFirmMap, setFirms, collections, setLineMap } from 'src/store/reducers/menuSlice';
import { setFooter } from 'src/store/reducers/dispetcherSlice';
import { setWidthProps } from 'src/store/reducers/resizeSlice';
import { getCookie } from './global';
import { setUniqueCustomer } from './providers/userProvider';
import { getCartCount } from './providers/shopProvider';
import { getMainInfo } from './providers/shopProvider';
import { addImageToLoad, imageLoaded} from 'src/store/reducers/loadingSlice'
// Components (общие для всех страниц)
import ScrollToTop from './scrollToTop';
import Preloader from './components/preloader/Preloader';
import CookieInfo from './components/cookieInfo/CookieInfo';
import ComplexDropMenuWithRequest from './modules/menu/ComplexDropMenuWithRequest';
import StickyDispetcherButton from 'src/modules/stickyDispetcherButton/StickyDispetcherButton';
import Footer from './modules/footer/Footer';


import { Firm, Line } from "src/types/modules"
interface AppContentProps {
  children: React.ReactNode;
}

const AppContent: React.FC<AppContentProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const contRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const animationFrameRef = useRef<number>();

  useRouteChange();

  const handleCookieAccept = useCallback(() => {
    console.log('Cookie accepted');
  }, []);

  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      const width = document.body.clientWidth;
      requestAnimationFrame(() => {
        if (width < 300) {
          dispatch(setWidthProps(2));
        } else if (width < 700) {
          dispatch(setWidthProps(1));
        } else {
          dispatch(setWidthProps(0));
        }
      });
    }, 100);
  }, [dispatch]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Пробуем взять из localStorage (с TTL)
        const cached = localStorage.getItem('mainInfoCache');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 60 * 60 * 1000) { // 1 час
            applyDataToRedux(data);
            return;
          }
        }

        // Иначе запрашиваем с сервера
        const data = await getMainInfo();
        applyDataToRedux(data);
        localStorage.setItem('mainInfoCache', JSON.stringify({
          data,
          timestamp: Date.now(),
        }));
      } catch (error) {
        console.error('Failed to load main info', error);
      }
    };

    const applyDataToRedux = (data: any) => {
      // 1. Категории и типы (как было в getCategoriesAndTypes)
      const categoriesVal: any = {};
      const typesVal: any = {};
      data.categories.forEach((d: any) => {
        if (categoriesVal[d.category_key]) {
          categoriesVal[d.category_key].types[d.type_key] = d.type_id;
          typesVal[d.type_id] = {
            name: d.type_name,
            categoryName: d.category_name,
            category_key: d.category_key,
            type_key: d.type_key,
            category_id: d.category_id,
          };
        } else {
          typesVal[d.type_id] = {
            name: d.type_name,
            categoryName: d.category_name,
            category_key: d.category_key,
            type_key: d.type_key,
            category_id: d.category_id,
          };
          categoriesVal[d.category_key] = {
            id: d.category_id,
            image_path: d.image_path,
            category_name: d.category_name,
            types: {},
          };
        }
      });
      const imageUrls = data.categories.map(cat => "/" + cat.image_path);
      dispatch(addImageToLoad(imageUrls.length));
      imageUrls.forEach(url => {
        const img = new Image();
        img.onload = () => {
          dispatch(imageLoaded()); // ← УМЕНЬШАЕМ СЧЕТЧИК
        };
        img.onerror = () => {
          dispatch(imageLoaded()); // ← ДАЖЕ ПРИ ОШИБКЕ
        };
        img.src = url;
      });
      dispatch(types(typesVal));
      dispatch(categories(categoriesVal));

      // 2. Фирмы и коллекции (как было в getFirms)
      const fieldData: Record<string, Record<string, string>> = {};
      const firmMap: Record<string, Firm> = {}; // ← теперь объект, а не number
      const lineMap: Record<string, Line> = {};
      data.firms.forEach((row: any) => {
        // ============================================================
        // ФИРМЫ (как было)
        // ============================================================
        
        firmMap[row.brand_slug] = {
          id: row.brand_id,
          name: row.firm,
          slug: row.brand_slug,
        };

        // Коллекции (оставляем как есть)
        if (!fieldData[row.firm]) fieldData[row.firm] = {};
        if (row.collection_name) {
          fieldData[row.firm][row.line_id] = row.collection_name;
        }

        // ============================================================
        // ЛИНИИ (НОВОЕ! заполняем из тех же данных)
        // ============================================================
        if (row.collection_name && row.line_id) {
        
          // Сохраняем линию, если её ещё нет в lineMap
          if (!lineMap[row.collection_slug]) {
            lineMap[row.collection_slug] = {
              id: row.line_id,
              name: row.collection_name,
              slug: row.collection_slug,
              brand_id: row.brand_id,
            };
          }
        }
      });

      dispatch(setFirms(Object.keys(fieldData)));
      dispatch(setFirmMap(firmMap)); // ← теперь передаем объект с Firm
      dispatch(collections(fieldData));
      dispatch(setLineMap(lineMap));

      // 3. Скидки (добавляем)
      const activeDiscounts = (data.discounts || [])
        .filter((rule: any) => rule.is_active)
        .map((rule: any) => ({
          id: rule.id,
          name: rule.name,
          discount_type: rule.discount_type,
          discount_value: rule.discount_value,
        }));
      dispatch(setDiscountRules(activeDiscounts));


      if (data.sizeTables) {
        // сохранить в redux или в localStorage
        dispatch(setSizeTables(data.sizeTables));
      }
    };

    fetchInitialData();
  }, [dispatch]);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    if (!getCookie("unique")) {
      setUniqueCustomer(() => { });
    }

    const cartCookie = getCookie("cart");
    if (cartCookie) {
      getCartCount((data: any) => dispatch(cartCountAction(data)));
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeoutRef.current);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dispatch, handleResize]);

  useEffect(() => {
    const element = contRef.current;
    if (!element) return;

    let animationFrameId: number;
    const observer = new ResizeObserver((entries) => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        for (const entry of entries) {
          if (entry.target === element) {
            const { offsetHeight } = element;
            const { innerHeight, scrollY } = window;

            if (innerHeight >= offsetHeight || scrollY < 150) {
              dispatch(show(true));
            }
          }
        }
      });
    });

    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [dispatch]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!contRef.current) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const { scrollHeight, clientHeight } = contRef.current!;
      const { innerHeight, scrollY } = window;

      if (e.deltaY > 0) {
        if (Math.ceil(scrollY + innerHeight + 3) >= scrollHeight) return;

        if (scrollY + e.deltaY < 150) {
          dispatch(sticky(false));
        } else if (scrollHeight - innerHeight > 150) {
          dispatch(show(false));
        }
      } else {
        if (scrollY === 0) {
          dispatch(show(true));
          return;
        }
        dispatch(show(true));
        if (scrollY + e.deltaY >= 150) {
          dispatch(sticky(true));
        }
      }

      if (Math.ceil(scrollY + innerHeight + e.deltaY) >= scrollHeight - 100) {
        dispatch(setFooter(true));
      } else if (Math.ceil(scrollY + innerHeight) <= scrollHeight - 100) {
        dispatch(setFooter(false));
      }
    });
  }, [dispatch]);

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
        style={{ display: "flex", flexDirection: "column" }}
        ref={contRef}
        onWheel={handleWheel}
      >
        <ComplexDropMenuWithRequest />
        <StickyDispetcherButton top="10%" left="10%" />
        {children}  {/* ← Сюда Next.js вставляет страницу */}
        <Footer />
      </div>
    </>
  );
};

export default AppContent;