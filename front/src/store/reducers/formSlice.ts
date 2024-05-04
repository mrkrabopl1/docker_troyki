import {createSlice} from "@reduxjs/toolkit"
import dropFileType from '../../types/dropFile'


interface Snickers { name: string, img: string, id: string, firm: string, price: string, size:number, count:number }
interface IField {
    snickers: Snickers[]
}
const initialState:IField  ={
   snickers:[]
}

export const formSlice = createSlice({
    name:"form",
    initialState,
    reducers:{
        setSnickers(state,action){
            state.snickers = action.payload
        },    
    }

});
export  const {  setSnickers } = formSlice.actions
export default formSlice.reducer