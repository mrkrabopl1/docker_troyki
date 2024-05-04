import {createSlice} from "@reduxjs/toolkit"

const initialState = {
    isLog:false,
    personal:{
        name:"",
        number:"",
        mail:""
    },
    icon:{
        position:{x:0,y:0},
        imgWidth:100,
        size:100
    },
    image:{
        src:"./public/defLogo.png",
        size:{width:0,height:0}
    }
 
}

type actionType<T> = {type:string,payload:T}

export const userSlice = createSlice({
    name:"fieldData",
    initialState,
    reducers:{
        setPersonal(state,action:actionType<typeof initialState.personal>){
           state.personal = action.payload
        },
        setIcon(state,action:actionType<typeof initialState.icon>){
            state.icon = action.payload
         },
        setImg(state,action:actionType<typeof initialState.image>){
            state.image = action.payload
         },

         
        setLog(state,action:actionType<typeof initialState.isLog>){
            state.isLog = action.payload
        }
     
    }

});

export default userSlice.reducer