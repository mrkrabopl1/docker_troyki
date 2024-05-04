import {createSlice} from "@reduxjs/toolkit"

interface IField {
    id:number,
    events:{}
}

const initialState :IField ={
   id:0,
   events:{onWheel:[console.log("yyjhghjghjghjgh")]}
}

export const appSlice = createSlice({
    name:"fieldData",
    initialState,
    reducers:{
        setId(state){
            state.id = state.id + 1
        }
     
    }

});

export default appSlice.reducer