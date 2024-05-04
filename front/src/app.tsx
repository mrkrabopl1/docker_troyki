import React, { useEffect, ReactElement, useState, useRef, lazy } from 'react'
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import { cartCountAction } from 'src/store/reducers/menuSlice'
import axios from "axios";
import DropZone from "src/develop/dropZone/DropZone"
const SnickersInfo = lazy(() => import('./pages/snickersInfo/SnickersInfo'))
import Form from './pages/formPage/FormPage'
import BuyPage from './pages/buyPage/BuyPage'
const CollectionPage = lazy(() => import('./pages/collectionPage/CollectionPage'))
import Main from './pages/main/Main'
import { getCookie } from './global'
import WayToPay from './pages/infoPages/WayToPay'
import {
  Link, Route, BrowserRouter as Router, Routes,
  createBrowserRouter,
  Outlet,
  RouterProvider,
  createRoutesFromElements,
  NavLink,
} from "react-router-dom";
import SettingsModule from './modules/settingsModule/SettingsModule.old'
import SearchPage from './pages/SearchPage'
import ComplexDropMenuWithRequest from './modules/menu/ComplexDropMenuWithRequest'
import Footer from './modules/footer/Footer'
import Delivery from './pages/infoPages/Delivery'
import Faq from './pages/infoPages/Faq'

setTimeout(()=>{
  console.debug(API_URL, "f;lsdmf;ls,d;lf")
},10)

const App: React.FC<any> = () => {
  let [merchFieldData, setMerchFieldData] = useState<any>([])
  const dispatch = useAppDispatch();


  const { chousenName } = useAppSelector(state => state.complexDropReducer)
  useEffect(() => {
    let coockie = getCookie("cart")

    if (coockie) {
      axios({
        method: 'get',
        url: 'http://127.0.0.1:8100/cartCount?hash=' + coockie,
        headers: {}
      }
      ).then((res: any) => {
        dispatch(cartCountAction(res.data.count))
      })
    }

    //getBrends(setMerchFieldData)
  }, [])
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div>
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
              <SnickersInfo />
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
        </Route>
      </Routes>
    </Router>
  )
}

export default App