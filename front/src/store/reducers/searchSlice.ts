import {createSlice} from "@reduxjs/toolkit"
import dropFileType from '../../types/dropFile'

interface IField {
    searchData: string
}

const initialState:IField  ={
   searchData:""
}

export const searchSlice = createSlice({
    name:"search",
    initialState,
    reducers:{
        setSearchData(state,action){
            state.searchData = action.payload
        },    
    }

});

export default searchSlice.reducer