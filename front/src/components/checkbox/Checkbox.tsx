import React, { ReactElement, useEffect, useRef, useState } from 'react'
import check from '../../../public/check.svg'
import s from "./style.module.css"

type propsRowType = {
    onChange:(...args:any)=>void|null
    className?:string,
    enable:boolean,
    activeData:boolean
}



const Checkbox: React.FC<propsRowType> = (props) => {
    let {onChange,className,enable,activeData} = {...props}
    let [active,setAcive] = useState(activeData)
    useEffect(()=>{
        setAcive(activeData)
    },[activeData])
    return (
        <div onClick={()=>{
            if(enable){
                setAcive(!active)
                onChange(!active)
            } }}
             className={className?className:s.checkbox} 
             style={{backgroundImage: active&&enable?`url(${check})`:"",borderColor:enable?"":"grey"}}>

        </div>
    )
}

export default Checkbox