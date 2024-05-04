import {createSlice} from "@reduxjs/toolkit"
import dropFileType from '../../types/dropFile'



type SizeType ={
    [key:string]:number
}
interface IField {
    show: boolean,
    sticky:boolean,
    shop:{
        id:number,
        size:string
    }[],
    cartCount:number
}

const initialState:IField  ={
   show:true,
   sticky:true,
   shop: [],
   cartCount:0
}

const menuSlice = createSlice({
    name:"menu",
    initialState,
    reducers:{
        show(state,action){
            state.show = action.payload
        },    
        sticky(state,action){
            state.sticky = action.payload
        },
        shopAction(state,action){
            state.shop =[...action.payload]
        },    
        cartCountAction(state,action){
            state.cartCount =action.payload
        },    
    }

});

export  const {  show, sticky, shopAction, cartCountAction } = menuSlice.actions

export default menuSlice.reducer