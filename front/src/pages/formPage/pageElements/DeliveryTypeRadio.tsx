import React, { ReactElement, useRef, useState } from 'react'
import check from '../../../public/check.svg'
import s from "./style.module.css"
import Lamp from '../../../components/lamp/Lamp'

type propsRadioGroupType = {
   
    onChange: (id: number) => void
    deliveryTime?:string
}



const DeliveryTypeRadioGroup: React.FC<propsRadioGroupType> = (props) => {
    let {  onChange } = { ...props }
    return (
        <div>
            <div className='dependFlex'>
                <Lamp key={"delivery"} checked={true} name={"test"} onChange={() => { onChange(0) }} text={"Доставка по Москве (до МКАД)"} description={"На следующий день"}/>
            </div>
            <div className='dependFlex'>
                 <Lamp key={"delivery"}  description={"1-2 рабочих дня"} checked={false} name={"test"} onChange={() => { onChange(1) }} text={"Доставка СДЭК"} />
            </div>
            <div className='dependFlex'>
                 <Lamp key={"delivery"}  description={"Авиа-экспресс"} checked={false} name={"test"} onChange={() => { onChange(1) }} text={"8-10 рабочих дней"} />
            </div>
        </div>
    )
}

export default DeliveryTypeRadioGroup