import React, { lazy,Suspense,ReactElement, useRef,useEffect, useState, memo } from 'react'
import DropWrapper from "../../components/dropWrapper/DropWrapper"
import s from "./style.module.css"
import {useAppDispatch } from 'src/store/hooks/redux'
import {secondDropSlice} from "src/store/reducers/secondDropSlice"
import { useAppSelector } from 'src/store/hooks/redux'
import {isDeepEqual} from 'src/global'

type propsRowType = {
    propsData:any,
    componentName:string,
    onChange?:(arg:any)=>void,
}



const DynamicElement: React.FC<propsRowType> = (props) => {
    let {componentName,propsData,onChange} = {...props}
    let dispatch = useAppDispatch()
    const DynamicComponent = lazy(() => import(`src/${componentName}`));
    const {show} = { ...secondDropSlice.actions }

    const onChangeData=(data:any)=>{
          onChange && onChange(data)
    }
   
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <DynamicComponent onChange = {onChangeData}  {...propsData}/>
      </Suspense>
    );
}
function checkMemo(oldData: any, newData: any) {
  return (isDeepEqual(oldData.propsData, newData.propsData))
}

export default  memo(DynamicElement,checkMemo)