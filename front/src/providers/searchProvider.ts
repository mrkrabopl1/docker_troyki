import axios from "axios";
import { categories } from "src/store/reducers/menuSlice";
const searchNames = function (searchName:string,max:number,callback:(val:any)=>void){

    axios({
        method: 'post',
        url: `${API_URL}/searchMerch`,
        headers: {
            'Content-Type': 'application/json'
        },
        data:JSON.stringify({
            name:searchName,
            max:max
        })
    }
    ).then((res:any)=>{
       callback(res.data)
    },(error)=>{
        console.warn(error)
    })
}

const getSnickersByString = function (searchName:string,callback:(val:any)=>void, page:number,size:number, filters:any, orderType:number){

    axios({
        method: 'post',
        url: `${API_URL}/getSnickersByString`,
        headers: {
            'Content-Type': 'application/json'
        },
        data:JSON.stringify({
            name:searchName,
            page:page,
            size:size,
            filters:filters,
            orderType:orderType
        })
    }
    ).then((res:any)=>{
        console.debug(res.data)
       callback(res.data)
    },(error)=>{
        console.warn(error)
    })
}

const getProductsByCategories= function (category:string,callback:(val:any)=>void, page:number,size:number, filters:any, orderType:number){

    axios({
        method: 'post',
        url: `${API_URL}/getProductsByString`,
        headers: {
            'Content-Type': 'application/json'
        },
        data:JSON.stringify({
            category:category,
            page:page,
            size:size,
            filters:filters,
            orderType:orderType
        })
    }
    ).then((res:any)=>{
        console.debug(res.data)
       callback(res.data)
    },(error)=>{
        console.warn(error)
    })
}


const getProductsByString = function (searchName:string,callback:(val:any)=>void, page:number,size:number, filters:any, orderType:number){

    axios({
        method: 'post',
        url: `${API_URL}/getProductsByString`,
        headers: {
            'Content-Type': 'application/json'
        },
        data:JSON.stringify({
            name:searchName,
            page:page,
            size:size,
            filters:filters,
            orderType:orderType
        })
    }
    ).then((res:any)=>{
        console.debug(res.data)
       callback(res.data)
    },(error)=>{
        console.warn(error)
    })
}
const getProductsByCategoriesAndFilters = function(searchName:string,category:string,callback:(val:any)=>void, page:number,size:number, filters:any, orderType:number){
     axios({
        method: 'post',
        url: `${API_URL}/getDataByCategoriesAndFilters`,
        headers: {
            'Content-Type': 'application/json'
        },
        data:JSON.stringify({
            name:searchName,
            page:page,
            size:size,
            filters:filters,
            orderType:orderType,
            category:category
        })
    }
    ).then((res:any)=>{
        console.debug(res.data)
       callback(res.data)
    },(error)=>{
        console.warn(error)
    })
}
const getProductsAndFiltersByString = function (searchName:string,callback:(val:any)=>void, page:number,size:number, filters:any, orderType:number){

    axios({
        method: 'post',
        url: `${API_URL}/getProductsAndFiltersByString`,
        headers: {
            'Content-Type': 'application/json'
        },
        data:JSON.stringify({
            name:searchName,
            page:page,
            size:size,
            filters:filters,
            orderType:orderType
        })
    }
    ).then((res:any)=>{
        console.debug(res.data)
       callback(res.data)
    },(error)=>{
        console.warn(error)
    })
}

const getProductsAndFiltersByCategoryAndType = function (searchName:string,callback:(val:any)=>void, page:number,size:number,  orderType:string, category:string,type:string){

    axios({
        method: 'post',
        url: `${API_URL}/getDataAndFilterByCategories`,
        headers: {
            'Content-Type': 'application/json'
        },
        data:JSON.stringify({
            name:searchName,
            page:page,
            size:size,
            orderType:orderType,
            category:category,
            type:type
        })
    }
    ).then((res:any)=>{
        console.debug(res.data)
       callback(res.data)
    },(error)=>{
        console.warn(error)
    })
}

export {searchNames,getProductsAndFiltersByString, getSnickersByString, getProductsByString,getProductsByCategories,getProductsAndFiltersByCategoryAndType,getProductsByCategoriesAndFilters}