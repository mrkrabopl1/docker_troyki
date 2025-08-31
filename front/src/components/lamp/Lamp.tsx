import React, { ReactElement, useRef, useState, memo, useCallback } from 'react'
import s from "./style.module.css"

type PropsLampType = {
    onChange:(...args:any)=>void|null
    name?:string,
    text?:string,
    description?:string
    checked?:boolean
}



const Lamp: React.FC<PropsLampType> = (props) => {
    let {onChange, name, text, checked, description} = {...props}
    const handleChange = useCallback((e) => {
        onChange(e);
    }, [onChange]);

    return (
        <label className={s.lampHolder}>
            <input defaultChecked={checked}  onChange={handleChange} className={s.lamp} type="radio" name={name} />
            <span className={s.design}></span>
            <div>
                {text?<p  className={s.text}>{text}</p>:null}
                {description?<p  className={s.description}>{description}</p>:null}
            </div>
        </label>
    )
}

export default memo(Lamp)