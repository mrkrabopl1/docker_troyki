import React, { useEffect, ReactElement, useState, useRef, lazy, useCallback } from 'react'
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import { cartCountAction } from 'src/store/reducers/menuSlice'
import axios from "axios";
import { show, sticky,verified } from 'src/store/reducers/menuSlice'
import { setFooter } from 'src/store/reducers/dispetcherSlice'
import {  setWidthProps } from 'src/store/reducers/resizeSlice'
import DropZone from "src/develop/dropZone/DropZone"
const ProductsInfo = lazy(() => import('./pages/productsInfo/ProductsInfo'))
import Form from './pages/formPage/FormPage'
import BuyPage from './pages/buyPage/BuyPage'
const CollectionPage = lazy(() => import('./pages/collectionPage/CollectionPage'))
import Main from './pages/main/Main'
import { getCookie } from './global'
import WayToPay from './pages/infoPages/WayToPay'
import ScrollToTop from './scrollToTop';
import { setUniqueCustomer } from './providers/userProvider';
import { getCdekDeliveryData,chackPostalIndex } from './providers/cdek';
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
setTimeout(() => {
  console.debug(API_URL, "f;lsdmf;ls,d;lf")
}, 10)

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const contRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();
  const animationFrameRef = useRef<number>();

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

  // App initialization
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    
    if (!getCookie("unique")) {
      setUniqueCustomer(() => {});
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
  const manipulateMenu = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    // if (!contRef.current || !e.deltaY) return;

    // if (animationFrameRef.current) {
    //   cancelAnimationFrame(animationFrameRef.current);
    // }

    // animationFrameRef.current = requestAnimationFrame(() => {
    //   const { scrollHeight } = contRef.current!;
    //   const { innerHeight, scrollY } = window;
      
    //   if (e.deltaY > 0) {
    //     if (Math.ceil(scrollY + innerHeight + 3) >= scrollHeight) return;
        
    //     if (scrollY + e.deltaY < 150) {
    //       dispatch(sticky(false));
    //     } else if (scrollHeight - innerHeight > 150) {
    //       dispatch(show(false));
    //     }
    //   } else {
    //     if (scrollY === 0) {
    //       dispatch(show(true));
    //       return;
    //     }
    //     dispatch(show(true));
    //     if (scrollY + e.deltaY >= 150) {
    //       dispatch(sticky(true));
    //     }
    //   }
    // });
  }, [dispatch]);

  const manipulateDispetcher = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!contRef.current) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const { scrollHeight } = contRef.current!;
      const { innerHeight, scrollY } = window;
      
      if (Math.ceil(scrollY + innerHeight + e.deltaY) >= scrollHeight - 100) {
        dispatch(setFooter(true));
      } else if (Math.ceil(scrollY + innerHeight) <= scrollHeight - 100) {
        dispatch(setFooter(false));
      }
    });
  }, [dispatch]);
  return (
    <Router>
      <ScrollToTop/>
      <Routes>
        <Route path="/" element={
          <div  style={{display:"flex", flexDirection:"column", minHeight:"100vh"}} ref={contRef} onWheel={(e)=>{
            manipulateMenu(e)
            manipulateDispetcher(e)
          }} onScroll={(e)=>{
            console.debug(e)
            }}>
            <ComplexDropMenuWithRequest />
            <Outlet />
            <Footer />
          </div>}>

          <Route path="/" element={
            <Main />
          }>
          </Route>
          <Route path="/test/:load" element={
            <DropZone />

          }>

          </Route>
          <Route path="/product/:snickers" element={
            <React.Suspense fallback={<>...</>}>
              <ProductsInfo />
            </React.Suspense>
          }
          >

          </Route>
          
          <Route path="/collections/:collection" element={
            <React.Suspense fallback={<>...</>}>
              <CollectionPage />
            </React.Suspense>
          }
          >

          </Route>

          <Route path="/form/:hash" element={
            <Form />
          }
          >
          </Route>
          <Route path="/order/:hash" element={
            <OrderPage />
          }
          >
          </Route>
          <Route path="/settingsMenu" element={
            <SearchPage />

          }
          >
          </Route>

          <Route path="/buy" element={
            <BuyPage />

          }>
          </Route>

          <Route path="/way_to_pay" element={
            <WayToPay />

          }>
          </Route>

          <Route path="/delivery" element={
            <Delivery />
          }>
          </Route>

          <Route path="/faq" element={
            <Faq />
          }>
          </Route>

          <Route path="/user" element={
            <User />
          }>
          </Route>  

          <Route path="/verification/:verHash" element={
            <Verification />
          }>
         </Route>
         <Route path="/confirm/:verHash" element={
            <Confirm />
          }>
         </Route>
         <Route path="/changePass" element={
            <ChangeForgetPass />
          }>
         </Route>
         <Route path="/refund-policy" element={
            <Refund />
          }>
          </Route>

        </Route>
      </Routes>
    </Router>
  )
}

export default App