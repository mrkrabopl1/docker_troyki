import {combineReducers, configureStore,createListenerMiddleware} from "@reduxjs/toolkit"
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
import listenerMiddleware from "./listenerMiddleware"
const rootReducer = combineReducers({
    fieldReducer,
    appReducer,
    userReducer,
    complexDropReducer,
    radioReducer,
    priceReducer,
    secondDropReducer,
    menuReducer,
    formReducer,
    searchReducer
})
export const setupStore = () =>{
    return configureStore({
        reducer:rootReducer,
        middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().prepend(listenerMiddleware.middleware),
    })
}

export type RootState = ReturnType<typeof rootReducer>
export type AppState = ReturnType<typeof setupStore>
export type AppDispatch = AppState["dispatch"]

export default {}