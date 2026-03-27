import React, { ReactElement, useRef, useState, memo } from 'react'
import s from "./style.module.css"
import IconLamp from '../../../components/lamp/IconLamp'

type propsRadioGroupType = {
    onChange: (id: number) => void,
    memo?: boolean,
    defaultValue?: number // опционально: начальное значение
}

const DeliveryRadioGroup: React.FC<propsRadioGroupType> = (props) => {
    let { onChange, defaultValue = 0 } = { ...props }
    const [selected, setSelected] = useState<number>(defaultValue)

    const handleChange = (id: number) => {
        setSelected(id)
        onChange(id)
    }

    return (
        <div>
            <IconLamp 
                icon='/public/sort.svg'  
                key={"delivery1"} 
                checked={selected === 0} 
                name={"test1"} 
                onChange={() => handleChange(0)} 
                text={"Доставка"} 
            />
            <IconLamp 
                icon='/public/sort.svg' 
                key={"delivery2"} 
                checked={selected === 1} 
                name={"test1"} 
                onChange={() => handleChange(1)} 
                text={"Самовывоз со склада"} 
            />
        </div>
    )
}

function checkMemo(oldData: any, newData: any) {
    // Сравниваем только если изменился memo
    return oldData.memo === newData.memo
}

export default memo(DeliveryRadioGroup, checkMemo)