import {createSlice} from "@reduxjs/toolkit"

interface IField {
    data:[{type:string,val:any}],
    operations:[]
}

const initialState :IField ={
    data:[{type:"string",val:""}],
    operations:[]
}

export const fieldSlice = createSlice({
    name:"fieldData",
    initialState,
    reducers:{
        addData(state,action){
            if(state.data[(state.data.length - 1)] && (state.data[(state.data.length - 1)].type === "string" && action.payload.type === "string")){
                state.data[(state.data.length - 1)] = action.payload
            }else{
                state.data.push(action.payload)
            }
           
        },
      
    }

});

export default fieldSlice.reducer