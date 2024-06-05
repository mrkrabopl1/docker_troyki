import React, { ReactElement, useRef, useState } from 'react'
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import Checkbox from '../checkbox/Checkbox'

type checkBoxType = {enable:boolean,activeData:boolean,name:string}
type columnType = {
   data:checkBoxType[],
   onChange?:(data:any)=>void
}
const CheckBoxColumn: React.FC<columnType> = (props) => {
    let { data, onChange} = { ...props }
    let dataRef = useRef<checkBoxType[]>([])
    let valRef = useRef([])
    let timeOutId = useRef<ReturnType<typeof setTimeout> | null>(null)
    dataRef.current = data
    const onChangeForm  = (id:number,active:boolean)=>{
        dataRef.current[id].activeData = active
        valRef.current[id] = active
        if (timeOutId.current) {
            clearTimeout(timeOutId.current);
        }
        timeOutId.current = setTimeout(()=>{
            onChange && onChange([... valRef.current])
        },500)
    }
    return (
        <div  >
                {dataRef.current.map((val,id)=>{
                   valRef.current.push(val.activeData)
                   return( <div style={{display:"flex"}}>
                        {<Checkbox onChange={onChangeForm.bind(this,id)} enable={val.enable} activeData={val.activeData}/>}
                        <p>{val.name}</p>
                    </div>)
                })}

        </div>

    )
}

export default CheckBoxColumn