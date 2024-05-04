import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import menuReducer,{shopAction} from  "src/store/reducers/menuSlice"

const listenerMiddleware = createListenerMiddleware()
listenerMiddleware.startListening({
    actionCreator: shopAction,
    effect: async (action, listenerApi) => {
      console.debug(action,listenerApi)
    },
  })

  export default listenerMiddleware