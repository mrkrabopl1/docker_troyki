import {createSlice} from "@reduxjs/toolkit"
import dropFileType from '../../types/dropFile'

interface IField {
    [key: string]: number
}

const initialState:IField  ={
   chosen:0
}

export const priceSlice = createSlice({
    name:"merch",
    initialState,
    reducers:{
        setChosen(state,action){
            state.chosen = action.payload
        },    
    }

});

export default priceSlice.reducer