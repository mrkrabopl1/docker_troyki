import {createSlice} from "@reduxjs/toolkit"

interface IField {
  show: boolean;
  info:{[key:string]:any}
}

const initialState :IField ={
    show:false,
    info:{}
}

export const secondDropSlice = createSlice({
    name:"secondDrop",
    initialState,
    reducers:{
        show(state,action){
            state.show = action.payload
        },
        info(state,action){
            state.info ={...action.payload.data}
        }
      
    }

});

export default secondDropSlice.reducer