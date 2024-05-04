import React, { ReactElement, useEffect, useRef, useState } from 'react'
import Form from "src/modules/sendForm/SendForm"
import MerchFormBlock from "src/modules/merchField/MerchFormBlock"
import { getCartData } from 'src/providers/shopProvider'
import s from "./style.module.css"
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux'
import Input from 'src/components/input/Input'
import Button from 'src/components/Button'


interface merchInterface { name: string, img: string, id: string, firm: string, price: string,  count:number }

interface  dataType {
   data:merchInterface[]
}

const BuyMerchField: React.FC<dataType> = (props) => {
    let {data} = {...props}
    let promoCode = useRef<string>("")
    return (
        <div style={{ width:"100%"}}>

            {
                data.map((data) => {
                    return <MerchFormBlock data={data} onChange={() => { }} />
                })
            }

            <div style={{display:"flex"}}>
                <Input placeholder='Промокод' onChange={(val)=>{promoCode.current = val}}/> <Button text='Применить' onChange={()=>{}}/>
            </div>
        </div>

    )
}


export default BuyMerchField