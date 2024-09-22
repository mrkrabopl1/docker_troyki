import React, { ReactElement, useRef, useState, memo } from 'react'
import s from "./style.module.css"

type propsLampType = {
    orderData:{
        name: string,
        secondName: string,
        address:{
            town: string,
            region: string,
            home: string,
            flat: string,
            street: string,
        },
        mail: string,
        phone: string,
        price: string,
        orderId:number ,
        index: string,
    }
}


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
const OrderInfo: React.FC<propsLampType> = (props) => {

    let { name, secondName, address, mail, price, orderId,index } = { ...props.orderData }
    return (
        <div className=''>
            <div>
                Спасибо, {name}
            </div>
            <div>
                Ваш заказ {orderId} подтвержден<br />
                Ваш заказ поступил в обработку. В процессе обработки заказа с вами свяжется наш менеджер для уточнения деталей заказа и предоставления реквизитов для оплаты.
            </div>
            <div>
                <div>
                    Данны заказа
                </div>
                <div className="flex">
                    <div>
                        <div>
                            Электронный адресс
                        </div>
                        <div>
                            {mail}
                        </div>
                    </div>
                    <div>
                        <div>
                            Адрес доставки
                        </div>
                        <div>
                            {createString(address.street, address.home, address.town)}
                        </div>
                    </div>
                    <div>
                        <div>
                            Индексс доставки
                        </div>
                        <div>
                            {index}
                        </div>
                    </div>
                    <div>
                        <div>
                            Способо оплаты
                        </div>
                        <div>
                            Оплата банковской картой{price}
                        </div>
                    </div>
                    <div>
                        Способ доставки
                        <div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default memo(OrderInfo, () => false)