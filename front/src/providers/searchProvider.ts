import axios from "axios";
import { categories } from "src/store/reducers/menuSlice";
const searchNames = function (searchName:string,max:number,callback:(val:any)=>void){

    axios({
        method: 'post',
        url: `${API_URL}/search`,
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





const getProductsByCategoriesAndFilters = function(params:any,callback:(val:any)=>void, page:number,size:number, filters:any, sortType:number){
     axios({
        method: 'post',
        url: `${API_URL}/getDataByCategoriesAndFilters`,
        headers: {
            'Content-Type': 'application/json'
        },
        data:JSON.stringify({
            page:page,
            size:size,
            filters:filters,
            sortType:sortType,
            ...params
        })
    }
    ).then((res:any)=>{
        console.debug(res.data)
       callback(res.data)
    },(error)=>{
        console.warn(error)
    })
}
const getProductsAndFiltersByString = function (searchName:string,callback:(val:any)=>void, page:number,size:number, category:any,type:any, orderType:number){
    axios({
        method: 'post',
        url: `${API_URL}/getProductsAndFiltersByNameCategoryAndType`,
        headers: {
            'Content-Type': 'application/json'
        },
        data:JSON.stringify({
            name:searchName,
            page:page,
            size:size,
            orderType:orderType,
            category:category,
            type:type,
        })
    }
    ).then((res:any)=>{
        console.debug(res.data)
       callback(res.data)
    },(error)=>{
        console.warn(error)
    })
}
interface SearchServerParams {
    searchName: string;
    page: number;
    size: number;
    orderType: string;
    categorySlug: string;
    typeSlug: string;
    brandSlug: string;
    lineSlug: string;
    hasDiscount:boolean;
    filters: any;
}
export async function getProductsAndFiltersByCategoryAndTypeServer(
    params: SearchServerParams
): Promise<any> {
    const res = await fetch(`${API_URL}/search-by-slug`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: params.searchName,
            page: params.page,
            size: params.size,
            orderType: params.orderType,
            hasDiscount:params.hasDiscount,
            categorySlug: params.categorySlug||null,
            typeSlug: params.typeSlug||null,
            brandSlug: params.brandSlug||null,
            lineSlug: params.lineSlug||null,
            filters: params.filters
        })
    });
    
    if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
    }
    
    return res.json();
}

const getProductsAndFiltersByCategoryAndType = function (searchName:string,callback:(val:any)=>void, page:number,size:number,  orderType:number, category:number,type:number, brandId:number, filters:any){

    axios({
        method: 'post',
        url: `${API_URL}/search/with-filters`,
        headers: {
            'Content-Type': 'application/json'
        },
        data:JSON.stringify({
            name:searchName,
            page:page,
            size:size,
            orderType:orderType,
            category:category,
            type:type,
            brandId:brandId,
            filters:filters
        })
    }
    ).then((res:any)=>{
        console.debug(res.data)
       callback(res.data)
    },(error)=>{
        console.warn(error)
    })
}
export async function getProductsAndFiltersByStringServer(
    searchName: string,
    page: number,
    size: number,
    category: any,
    type: any,
    orderType: number
): Promise<any> {
    const res = await fetch(`${API_URL}/getProductsAndFiltersByNameCategoryAndType`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: searchName,
            page,
            size,
            orderType,
            category,
            type,
        })
    });
    
    if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
    }
    
    return res.json();
}
export {searchNames,getProductsAndFiltersByString, getSnickersByString,getProductsAndFiltersByCategoryAndType,getProductsByCategoriesAndFilters}