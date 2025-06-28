import React, { ReactElement, useRef, useState, memo } from 'react'
import s from "./style.module.css"
import Lamp from './Lamp'

type propsLampType = {
    onChange:(...args:any)=>void|null
    name?:string,
    text?:string,
    description?:string
    checked?:boolean,
    icon:string,
}



const IconLamp: React.FC<propsLampType> = (props) => {
    let {onChange, name, text, checked, description, icon} = {...props}
    return (
        <div className={s.iconLamp}>
            <Lamp name={name} text={text} checked={checked} description={description} onChange={onChange} />
            <img        style={{margin:"auto 0"}}
                        src={"/"+icon} 
                        alt={text || name || 'icon'} 
                        width={"30px"} 
                        height={"30px"} 
                    />
        </div>
    )
}

export default memo(IconLamp, ()=>false)