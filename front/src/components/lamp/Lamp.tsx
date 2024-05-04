import React, { ReactElement, useRef, useState, memo } from 'react'
import s from "./style.module.css"

type propsLampType = {
    onChange:(...args:any)=>void|null
    name?:string,
    text?:string,
    checked?:boolean
}



const Lamp: React.FC<propsLampType> = (props) => {
    let {onChange, name, text, checked} = {...props}
    return (
        <label className={s.lampHolder}>
            <input defaultChecked={checked}  onChange={(e)=>{onChange(e)}} className={s.lamp} type="radio" name={name} />
            <span className={s.design}></span>
            {text?<span className={s.text}>{text}</span>:null}
        </label>
    )
}

export default memo(Lamp, ()=>false)