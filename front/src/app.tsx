import React, { useEffect, ReactElement, useState, useRef, lazy } from 'react'
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import { cartCountAction } from 'src/store/reducers/menuSlice'
import axios from "axios";
import { show, sticky,verified } from 'src/store/reducers/menuSlice'
import { setFooter } from 'src/store/reducers/dispetcherSlice'
import {  setWidthProps } from 'src/store/reducers/resizeSlice'
import DropZone from "src/develop/dropZone/DropZone"
const ProductsInfo = lazy(() => import('./pages/ProductsInfo/ProductsInfo'))
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

const App: React.FC<any> = () => {
  const { contentRef, contentHeight } = useContentHeight();

  useEffect(() => {
    console.log('Текущая высота контента:', contentHeight);
  }, [contentHeight]);
  let [merchFieldData, setMerchFieldData] = useState<any>([])
  const dispatch = useAppDispatch();

  let contRef = useRef<HTMLDivElement>(null)

  const { chousenName } = useAppSelector(state => state.complexDropReducer)
  useEffect(() => {
    let coockieCart = getCookie("cart")
    let coockieUnique= getCookie("unique")
    window.addEventListener("resize",(e)=>{
      if(window.document.body.clientWidth<700){
        dispatch(setWidthProps(1))
      }else if (window.document.body.clientWidth<300){
        dispatch(setWidthProps(2))
      }else{
        dispatch(setWidthProps(0))
      }
    }
    )
    if (!coockieUnique) {
      setUniqueCustomer(()=>{})
    }
    if (coockieCart) {
      getCartCount((data)=> dispatch(cartCountAction(data)))
    }

    //getBrends(setMerchFieldData)
  }, [])

  useEffect(() => {
    chackPostalIndex("127642",(data)=>{})
    getCdekDeliveryData("1276",(data)=>{})
    jwtAutorise((res)=>{
      console.debug(res)
      dispatch(verified(res.data))
    })
  }, [])


  const manipulateMenu = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY > 0) {
      let rect = contRef.current.getBoundingClientRect()
      console.debug(window.innerHeight)
      if(Math.ceil(window.scrollY+window.innerHeight+3) >= contRef.current.scrollHeight)return
      let maxScroll = contRef.current.scrollHeight - window.innerHeight 
      if (window.scrollY + e.deltaY < 150 ) {
        dispatch(sticky(false))
      } else {
        if(maxScroll>150){
          dispatch(show(false))
        }
      //  dispatch(sticky(true))
      }
    } else {
      if(window.scrollY === 0){
        dispatch(show(true))
        return
      } 
      if (window.scrollY + e.deltaY < 150 ) {
        dispatch(show(true))
      } else {
        dispatch(show(true))
        dispatch(sticky(true))
      }
    }

  }
  useEffect(() => {
    const element = contRef.current;
    if (!element) return;
    // Создание наблюдателя за изменениями размеров
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === element) {

          if(window.innerHeight >= element.offsetHeight || window.scrollY < 150 ){
            dispatch(show(true))
          }
        }
      }
    });

    observer.observe(element);

    // Очистка при размонтировании
    return () => {
      observer.disconnect();
    };
  }, []);


  const manipulateDispetcher = (e: React.WheelEvent<HTMLDivElement>) => {
    if(Math.ceil(window.scrollY+window.innerHeight+e.deltaY) >= contRef.current.scrollHeight - 100){
      dispatch(setFooter(true))
    }else{
      if(Math.ceil(window.scrollY+window.innerHeight) <= contRef.current.scrollHeight - 100){
        dispatch(setFooter(false))
      }
    }
  }
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