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
    cartCount:number,
    isVerified:boolean,
    collections:string[],
    categories:{id:number,category_name:string,image_path:string}[],
    typesVal:{[key:string]:{name:string,category_name:string,category_key:string,type_key:string, category_id:number}}
}

const initialState:IField  ={
   show:true,
   sticky:true,
   shop: [],
   cartCount:0,
   isVerified:false,
   collections:[],
   categories:[],
   typesVal:{}
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
        verified(state,action){
            state.isVerified =action.payload
        },
        collections(state,action){
            state.collections =[...action.payload]
        },
        categories(state,action){
            state.categories ={...action.payload}
        },
        types(state,action){
            state.typesVal ={...action.payload}
        }
    }

});

export  const {  show, sticky, shopAction, cartCountAction, verified,collections,categories ,types} = menuSlice.actions

export default menuSlice.reducer