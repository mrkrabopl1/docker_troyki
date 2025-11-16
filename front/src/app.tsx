import React, { useEffect, ReactElement, useState, useRef, lazy, useCallback, memo } from 'react'
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import { cartCountAction } from 'src/store/reducers/menuSlice'
import axios from "axios";
import { show, sticky, verified, types, categories } from 'src/store/reducers/menuSlice'
import { setFooter } from 'src/store/reducers/dispetcherSlice'
import { setWidthProps } from 'src/store/reducers/resizeSlice'
import DropZone from "src/develop/dropZone/DropZone"
const ProductsInfo = lazy(() => import('./pages/productsInfo/ProductsInfo'))
import Form from './pages/formPage/FormPage'
import BuyPage from './pages/buyPage/BuyPage'
const CollectionPage = lazy(() => import('./pages/collectionPage/CollectionPage3'))
import Main from './pages/main/Main'
import { getCookie } from './global'
import StickyDispetcherButton from 'src/modules/stickyDispetcherButton/StickyDispetcherButton';
import WayToPay from './pages/infoPages/WayToPay'
import ScrollToTop from './scrollToTop';
import { setUniqueCustomer } from './providers/userProvider';
import { getCdekDeliveryData, chackPostalIndex } from './providers/cdek';
import Refund from './pages/infoPages/Refund';
import {
  Link, Route, BrowserRouter as Router, Routes,
  createBrowserRouter,
  Outlet,
  RouterProvider,
  createRoutesFromElements,
  NavLink,
} from "react-router-dom";
import SettingsModule from './modules/settingsModule/SettingsModule.old'
import SearchPage from './pages/search/SearchPage'
import ComplexDropMenuWithRequest from './modules/menu/ComplexDropMenuWithRequest'
import Footer from './modules/footer/Footer'
import Delivery from './pages/infoPages/Delivery'
import Faq from './pages/infoPages/Faq'
import User from './pages/user/User';
import Verification from './pages/verification/Verification';
import { jwtAutorise } from './providers/userProvider';
import Confirm from './pages/verification/Confirm';
import ChangeForgetPass from './pages/verification/ChangeForgetPass';
import OrderPage from './pages/orderPage/OrderPage';
import global from "src/global.css"
import OrderInfo from './components/orderInfo/orderInfo';
import { getCartCount } from './providers/shopProvider';
import { useContentHeight } from 'src/store/hooks/redux';
import { getCategoriesAndTypes } from './providers/merchProvider';
setTimeout(() => {
  console.debug(API_URL, "f;lsdmf;ls,d;lf")
}, 10)

const App: React.FC = memo(function App() {
  const dispatch = useAppDispatch();
  const contRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();
  const animationFrameRef = useRef<number>();

  const { typesVal } = useAppSelector(state => state.menuReducer);

  // Optimized resize handler with debouncing
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
    getCategoriesAndTypes((data) => {
      let categoriesVal = {}
      let typesVal = {}
      data.forEach(d => {
        if (categories[d.category_key]) {
          categories[d.category_key].types[d.type_key] = d.type_id
        } else {
          typesVal[d.type_id] = {name:d.type_name,categoryName:d.category_name,category_key:d.category_key,type_key:d.type_key}
          categoriesVal[d.category_key] = {
            id: d.category_id,
            image_path: d.image_path,
            category_name: d.category_name,
          }
        }
      })
      dispatch(types(typesVal))
      dispatch(categories(categoriesVal))
      localStorage.setItem('cachedData', JSON.stringify({categories:categoriesVal,types:typesVal}));
    })
  }, [])

  // App initialization
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    if (!getCookie("unique")) {
      setUniqueCustomer(() => { });
    }

    const cartCookie = getCookie("cart");
    if (cartCookie) {
      getCartCount((data) => dispatch(cartCountAction(data)));
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeoutRef.current);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dispatch, handleResize]);

  // Fixed ResizeObserver implementation
  useEffect(() => {
    const element = contRef.current;
    if (!element) return;

    let animationFrameId: number;
    const observer = new ResizeObserver((entries) => {
      // Cancel any pending animation frames
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

  // Wheel event handlers with proper frame management
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!contRef.current) return;

    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Schedule new animation frame
    animationFrameRef.current = requestAnimationFrame(() => {
      const { scrollHeight, clientHeight } = contRef.current!;
      const { innerHeight, scrollY } = window;

      // Menu manipulation logic
      if (e.deltaY > 0) {
        // Scrolling down
        if (Math.ceil(scrollY + innerHeight + 3) >= scrollHeight) return;

        if (scrollY + e.deltaY < 150) {
          dispatch(sticky(false));
        } else if (scrollHeight - innerHeight > 150) {
          dispatch(show(false));
        }
      } else {
        // Scrolling up
        if (scrollY === 0) {
          dispatch(show(true));
          return;
        }
        dispatch(show(true));
        if (scrollY + e.deltaY >= 150) {
          dispatch(sticky(true));
        }
      }

      // Dispatcher manipulation logic
      if (Math.ceil(scrollY + innerHeight + e.deltaY) >= scrollHeight - 100) {
        dispatch(setFooter(true));
      } else if (Math.ceil(scrollY + innerHeight) <= scrollHeight - 100) {
        dispatch(setFooter(false));
      }
    });
  }, [dispatch]);
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={
          <div 
            style={{ display: "flex", flexDirection: "column",  }} 
            ref={contRef} 
            onWheel={handleWheel}
            onScroll={(e) => {
              console.debug(e)
            }}
          >
            <ComplexDropMenuWithRequest />
            <StickyDispetcherButton top="10%" left="10%" />
            <Outlet />
            <Footer />
          </div>
        }>
          <Route path="/" element={<Main />} />
          <Route path="/test/:load" element={<DropZone />} />
          <Route path="/product/:snickers" element={
            <React.Suspense fallback={<>...</>}>
              <ProductsInfo />
            </React.Suspense>
          } />
          <Route path="/collections/:collection" element={
            <React.Suspense fallback={<>...</>}>
              <CollectionPage />
            </React.Suspense>
          } />
          <Route path="/form/:hash" element={<Form />} />
          <Route path="/order/:hash" element={<OrderPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/buy" element={<BuyPage />} />
          <Route path="/way_to_pay" element={<WayToPay />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/user" element={<User />} />
          <Route path="/verification/:verHash" element={<Verification />} />
          <Route path="/confirm/:verHash" element={<Confirm />} />
          <Route path="/changePass" element={<ChangeForgetPass />} />
          <Route path="/refund-policy" element={<Refund />} />
        </Route>
      </Routes>
    </Router>
  )
})


export default memo(App)