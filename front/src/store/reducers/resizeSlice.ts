import {createSlice} from "@reduxjs/toolkit"

const initialState = {
    widthProps:0
}

type actionType<T> = {type:string,payload:T}

export const resizeSlice = createSlice({
    name:"dispetcherData",
    initialState,
    reducers:{
        setWidthProps(state,action:actionType<typeof initialState.widthProps>){
           state.widthProps = action.payload
        }
    }

});
export  const {  setWidthProps } = resizeSlice.actions
export default resizeSlice.reducer