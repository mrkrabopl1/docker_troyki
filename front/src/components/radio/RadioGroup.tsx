import React, { ReactElement, useRef, useState } from 'react'
import check from '../../../public/check.svg'
import s from "./style.module.css"
import Lamp from '../lamp/Lamp'

type propsRadioGroupType = {
    name: string,
    lampArray: string[],
    onChange: (id: number) => void
}



const RadioGroup: React.FC<propsRadioGroupType> = (props) => {
    let { lampArray, name, onChange } = { ...props }
    return (
        <div>
            {lampArray.map((lamp, index) => {
               return <Lamp checked={index===0?true:false} name={name} onChange={() => { onChange(index) }} text={lamp} />
            })}
        </div>
    )
}

export default RadioGroup