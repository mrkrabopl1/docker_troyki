import React, { ReactElement, useRef, useState } from 'react'
import s from "./style.module.css"
import Lamp from '../lamp/Lamp'

type propsRadioGroupType = {
    name: string,
    lampArray: string[],
    onChange: (id: number) => void
    checked?: number
}



const RadioGroup: React.FC<propsRadioGroupType> = (props) => {
    let { lampArray, name, onChange } = { ...props }
    return (
        <div>
            {lampArray.map((lamp, index) => {
               return <Lamp key={lamp} checked={props.checked === index} name={name} onChange={() => { onChange(index) }} text={lamp} />
            })}
        </div>
    )
}

export default RadioGroup