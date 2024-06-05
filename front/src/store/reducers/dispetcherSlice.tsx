import {createSlice} from "@reduxjs/toolkit"

const initialState = {
    footer:false
}

type actionType<T> = {type:string,payload:T}

export const dispetcherSlice = createSlice({
    name:"dispetcherData",
    initialState,
    reducers:{
        setFooter(state,action:actionType<typeof initialState.footer>){
           state.footer = action.payload
        }
    }

});
export  const {  setFooter } = dispetcherSlice.actions
export default dispetcherSlice.reducer