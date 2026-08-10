// src/store/store.ts
import { combineReducers, configureStore } from "@reduxjs/toolkit"
import { createWrapper } from 'next-redux-wrapper';
import listenerMiddleware from "./listenerMiddleware"

// ============================================================
// 📦 ИМПОРТЫ РЕДЬЮСЕРОВ
// ============================================================
import fieldReducer from "./reducers/fieldSlice"
import appReducer from "./reducers/appSlice"
import userReducer from "./reducers/userSlice"
import complexDropReducer from "./reducers/complexDropSlice"
import radioReducer from "./reducers/radioSlice"
import priceReducer from "./reducers/priceSlice"
import secondDropReducer from "./reducers/secondDropSlice"
import menuReducer from "./reducers/menuSlice"
import searchReducer from "./reducers/searchSlice"
import formReducer from "./reducers/formSlice"
import dispetcherReducer from "./reducers/dispetcherSlice"
import resizeReducer from "./reducers/resizeSlice"
import instagramReducer from "./reducers/instagramSlice"
import adminReducer from "./reducers/adminSlice"
import loadingReducer from './reducers/loadingSlice';

// ============================================================
// 🔗 КОРНЕВОЙ РЕДЬЮСЕР
// ============================================================
const rootReducer = combineReducers({
    // ✅ Добавляем неймспейсы (убираем "Reducer" из названий)
    // Это нужно для App Router, но работает и в Pages Router
    field: fieldReducer,
    app: appReducer,
    user: userReducer,
    complexDrop: complexDropReducer,
    radio: radioReducer,
    price: priceReducer,
    secondDrop: secondDropReducer,
    menu: menuReducer,
    form: formReducer,
    search: searchReducer,
    dispetcher: dispetcherReducer,
    resize: resizeReducer,
    admin: adminReducer,
    loading: loadingReducer,
    instagram:instagramReducer
})

// ============================================================
// 🏪 ФАБРИКА STORE (для App Router)
// ============================================================
export const makeStore = () => {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().prepend(listenerMiddleware.middleware),
        devTools: process.env.NODE_ENV !== 'production',
    })
}

// ============================================================
// 🔄 WRAPPER ДЛЯ SSR (для App Router)
// ============================================================
export const wrapper = createWrapper<AppStore>(makeStore, {
    debug: process.env.NODE_ENV !== 'production',
})

// ============================================================
// 📦 ТИПЫ
// ============================================================
export type RootState = ReturnType<typeof rootReducer>
export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']

// ============================================================
// ⚠️ ДЛЯ PAGES ROUTER (обратная совместимость)
// ============================================================
// ✅ setupStore — использует ту же фабрику
export const setupStore = makeStore

// ✅ Для обратной совместимости со старым кодом
export type AppState = AppStore
