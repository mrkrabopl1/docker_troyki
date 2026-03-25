import React, { ReactElement, useRef, useState, memo } from 'react'
import s from "./style.module.css"
import Lamp from './Lamp'

type PropsLampType = {
    onChange: (...args: any) => void | null
    name?: string,
    text?: string,
    description?: string
    checked?: boolean,
    icon: string,
}

const IconLamp: React.FC<PropsLampType> = (props) => {
    let { onChange, name, text, checked, description, icon } = { ...props }
    
    return (
        <div className={`${s.iconLamp} ${checked ? s.iconLampChecked : ''}`}>
            <div className={s.iconLampContent}>
                <div className={s.iconWrapper}>
                    <img 
                        className={s.iconImage}
                        src={icon} 
                        alt={text || name || 'icon'} 
                    />
                </div>
                <div className={s.textWrapper}>
                    <Lamp 
                        name={name} 
                        text={text} 
                        checked={checked} 
                        description={description} 
                        onChange={onChange} 
                    />
                </div>
            </div>
        </div>
    )
}

export default memo(IconLamp)