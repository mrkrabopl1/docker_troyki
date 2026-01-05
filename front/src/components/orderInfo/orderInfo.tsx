import React, { ReactElement, useRef, useState, memo, useCallback } from 'react'
import s from "./style.module.css"
import DataField from '../dataField/DataField'
type propsLampType = {
    orderData:{
        name: string,
        secondName: string,
        mail: string,
        phone: string,
        price: string,
        orderId:number ,
        index: string,
    },
    address:{
        town: string,
        region: string,
        home: string,
        flat: string,
        street: string,
    },
    orderId:number
}



const OrderInfo: React.FC<propsLampType> = (props) => {
    let { orderData,address } = { ...props }
    let createString = (street, home, town) => {
        let str = "";
        if (street) {
            str += street + " "
        }
        if (home) {
            str += "дом" + home
        }
        str += town
        return str
    }

    const createDataField = useCallback((header) => {
        let entries = [
            ["Электронный адресс",orderData.mail],
            ["Аддресс доставки", createString(address.street, address.home, address.town)],
            ["Способо оплаты",`Оплата банковской картой${orderData.price}`],
            ["Способо доставки",orderData.orderId]
        ]
        if(orderData.index){
            entries.push(["Индекс",orderData.index])
        }
        let data:any = entries.map((data) => { return { "caption": data[0], "description": data[1] } })
        return <DataField header={header} data={data} />

    }, [orderData])

    return (
        <div style = {{width:"100%"}} className=''>
            <h3>
                Спасибо, {orderData.name}
            </h3>
            <div>
                Ваш заказ №{props.orderId} подтвержден<br />
                Ваш заказ поступил в обработку. В процессе обработки заказа с вами свяжется наш менеджер для уточнения деталей заказа и предоставления реквизитов для оплаты.
            </div>
            <div>
                { createDataField("Данные заказа")}

            </div>
        </div>
    )
}

export default memo(OrderInfo, () => false)