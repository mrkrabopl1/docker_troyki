import React, { ReactElement, useRef, useState, memo } from 'react'
import check from '../../../public/check.svg'
import s from "./style.module.css"
import IconLamp from '../../../components/lamp/IconLamp'

type propsRadioGroupType = {
   
    onChange: (id: number) => void,
    memo?: boolean
}



const DeliveryRadioGroup: React.FC<propsRadioGroupType> = (props) => {
    let {  onChange } = { ...props }
    return (
        <div>
              <IconLamp icon='sort.svg'  key={"delivery1"} checked={true} name={"test1"} onChange={() => { 
                onChange(0) 
                }} text={"Доставка"} />
              <IconLamp icon='sort.svg' key={"delivery1"} checked={false} name={"test1"} onChange={() => { onChange(1) }} text={"Самовывоз со склада"} />
        </div>
    )
}


function checkMemo(oldData: any, newData: any) {
    return (oldData.memo === newData.memo)
}
export default memo(DeliveryRadioGroup, checkMemo)