import {createSlice} from "@reduxjs/toolkit"

interface IField {
    chousenName:string,
}

const initialState :IField ={
    chousenName:"",
}

export const complexDropSlice = createSlice({
    name:"complexDrop",
    initialState,
    reducers:{
        setName(state,action){
            console.log("test")
            state.chousenName= action.payload
        },
        clear(state){
            state.chousenName= ""
        }
    }

});

export default complexDropSlice.reducer