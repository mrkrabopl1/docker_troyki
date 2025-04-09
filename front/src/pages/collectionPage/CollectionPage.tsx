import React, { useEffect, ReactElement, useState, useRef } from 'react'
import {NavLink, useParams } from 'react-router-dom';
import { getCollection,getCountCollection } from "src/providers/merchProvider"

import MerchFieldWithPageSwitcher  from 'src/modules/merchField/MerchFieldWithPageSwitcher';
type urlParamsType = {
    collection: string;
  };
const CollectionPage: React.FC<any> = () => {
    let {collection} = useParams<urlParamsType>();

    console.debug(collection)

    let [updateData,setUpdateData] =  useState<boolean>(true)    
    let currentPage = useRef<number>(1)
    let pages = useRef<number>(1)
    let pageSize= useRef<number>(9)

    let [filtersState,setFilters] = useState<any>([])
    let [merchFieldData, setMerchFieldData] = useState<any>([])

    let [grid,setGrid] = useState<boolean>(false)
    
   // let merchFieldData = useRef<any>({merchInfo:[],filters:[]})

    let filtersInfo = useRef<{[key:string]:any}>({})
    let settingsModuleMemo = useRef<boolean>(true)
    let firms = useRef<string[]>([])
    let searchWord = useRef<string>("")
    // useEffect(() => {
    //     if (searchData) {
    //         getImgs(searchData, setData)
    //     }
    // }, [searchData])
    let filters = useRef<any>(null)
    const setData=(data:any)=>{
            filters.current = data.filters
            setMerchFieldData( data.merchData)
            setUpdateData(!updateData)
    }

    const getCollectionData=()=>{
        const reqData = {
            name: collection,
            page: currentPage.current,
            size: pageSize.current
        }
        getCollection(reqData,getRespData) 
    }


    useEffect(()=>{
        getCountCollection(collection,(data)=>{
            pages.current = Math.ceil(data/pageSize.current)
            const reqData = {
                name: collection,
                page: currentPage.current,
                size: pageSize.current
            }
            getCollection(reqData,getRespData) 
        })
    },[collection])

    

    const pageWrap = useRef<HTMLDivElement>(null)
    
    let timeArr = [41,42,43]

   

    const getRespData=(resData:{pages:number,merchInfo:[]})=>{
            setMerchFieldData(resData)
        }

    const getRespDataByFilter=(respData:{merchInfo:[]})=>{
        setMerchFieldData(respData)
    }





    const pageChange=(page:number)=>{
        currentPage.current = page;
        getCollectionData();
        // currentPage.current = page;
        // filtersInfo.current["name"] = searchWord.current;
        // filtersInfo.current["currentPage"] =  currentPage.current;
        // filtersInfo.current["pageSize"] =  pageSize.current;
        // filtersInfo.current["pages"] =  pages.current;
        // getFullMerchInfo(filtersInfo.current,getRespData) 
    }


    return (

        <div >
           <MerchFieldWithPageSwitcher onChange={pageChange} currentPage = {currentPage.current}  pages={pages.current} heightRow={500} size={grid?2:3} data={merchFieldData} />   
        </div>


    )
}

export default CollectionPage