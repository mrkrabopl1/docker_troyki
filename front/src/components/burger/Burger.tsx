import React, { ReactElement, useEffect, useRef, useState } from 'react'
import check from '../../../public/check.svg'
import s from "./style.module.css"

type propsRowType = {
    onChange:(...args:any)=>void|null
    activeProps:boolean,
}



const Burger: React.FC<propsRowType> = (props) => {
    let {onChange,activeProps} = {...props}
    let [active,setAcive] = useState(activeProps)
    const togleActive = ()=>{
        setAcive(!active);
        onChange(!active);
    }
    const createMainStyle = (styles) =>{
        if(active){
            styles.push(s.is_active)
        }
        return styles.join(" ")
    }
    useEffect(()=>{
        setAcive(activeProps)
    },[activeProps])
    return (
        <div onClick={togleActive} className={createMainStyle([s.hamburger, s.hamburger_slider])}>
        <div className={s.hamburger_box}>
          <div className={s.hamburger_inner}></div>
        </div>
      </div>
      
    )
}

export default Burger