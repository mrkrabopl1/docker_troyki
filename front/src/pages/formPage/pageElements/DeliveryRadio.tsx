import React, { ReactElement, useRef, useState } from 'react'
import check from '../../../public/check.svg'
import s from "./style.module.css"
import Lamp from '../../../components/lamp/Lamp'

type propsRadioGroupType = {
   
    onChange: (id: number) => void
}



const DeliveryRadioGroup: React.FC<propsRadioGroupType> = (props) => {
    let {  onChange } = { ...props }
    return (
        <div>
            <div className='dependFlex'>
                <Lamp key={"delivery"} checked={true} name={"test"} onChange={() => { onChange(0) }} text={"Доставка"} />
            </div>
            <div className='dependFlex'>
                 <Lamp key={"delivery"} checked={false} name={"test"} onChange={() => { onChange(1) }} text={"Самовывоз со склада"} />
            </div>
        </div>
    )
}

export default DeliveryRadioGroup