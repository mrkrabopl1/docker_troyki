import React, { ReactElement, useRef, useState } from 'react'
import check from '../../../public/check.svg'
import s from "./style.module.css"
import IconLamp from '../../../components/lamp/IconLamp'

type propsRadioGroupType = {
   
    onChange: (id: string) => void
    deliveryTime?:string
}



const DeliveryTypeRadioGroup: React.FC<propsRadioGroupType> = (props) => {
    let {  onChange } = { ...props }
    return (
        <div>
            <IconLamp icon='sort.svg' key={"delivery1"} checked={true} name={"test"} onChange={() => { onChange("curier") }} text={"Доставка по Москве (до МКАД)"} description={"На следующий день"}/>
            <IconLamp icon='sort.svg' key={"delivery2"}  description={"1-2 рабочих дня"} checked={false} name={"test"} onChange={() => { onChange("cdek") }} text={"Доставка СДЭК"} />
            <IconLamp icon='sort.svg' key={"delivery3"}  description={"Авиа-экспресс"} checked={false} name={"test"} onChange={() => { onChange("express") }} text={"8-10 рабочих дней"} />
        </div>
    )
}

export default DeliveryTypeRadioGroup