import React, { ReactElement, useRef, useState } from 'react'
import s from "../style.module.css"
import IconLamp from 'src/components/lamp/IconLamp'

type propsRadioGroupType = {
    onChange: (id: string) => void
    deliveryTime?: string
    defaultValue?: string
}

const DeliveryTypeRadioGroup: React.FC<propsRadioGroupType> = (props) => {
    let { onChange, defaultValue = "curier" } = { ...props }
    const [selected, setSelected] = useState<string>(defaultValue)

    const handleChange = (id: string) => {
        setSelected(id)
        onChange(id)
    }

    return (
        <div>
            <div className={s.deliveryOptions}>
                <IconLamp 
                    icon='/images/sort.svg' 
                    key={"delivery1"} 
                    checked={selected === "curier"} 
                    name={"delivery_curier"} 
                    onChange={() => handleChange("curier")} 
                    text={"Доставка по Москве (до МКАД)"} 
                    description={"На следующий день"}
                />
                <IconLamp 
                    icon='/images/sort.svg' 
                    key={"delivery1"}  
                    checked={selected === "cdek"} 
                    name={"delivery_cdek"} 
                    onChange={() => handleChange("cdek")} 
                    text={"Доставка СДЭК"} 
                    description={"1-2 рабочих дня"}
                />
                <IconLamp 
                    icon='/images/sort.svg' 
                    key={"delivery1"}  
                    checked={selected === "express"} 
                    name={"delivery_express"} 
                    onChange={() => handleChange("express")} 
                    text={"Экспресс-доставка"} 
                    description={"8-10 рабочих дней"}
                />
            </div>
            
            <div className={s.deliveryInfoNotice}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8V12M12 16H12.01M3 12C3 13.1819 3.23279 14.3522 3.68508 15.4442C4.13738 16.5361 4.80031 17.5282 5.63604 18.364C6.47177 19.1997 7.46392 19.8626 8.55585 20.3149C9.64778 20.7672 10.8181 21 12 21C13.1819 21 14.3522 20.7672 15.4442 20.3149C16.5361 19.8626 17.5282 19.1997 18.364 18.364C19.1997 17.5282 19.8626 16.5361 20.3149 15.4442C20.7672 14.3522 21 13.1819 21 12C21 9.61305 20.0518 7.32387 18.364 5.63604C16.6761 3.94821 14.3869 3 12 3C9.61305 3 7.32387 3.94821 5.63604 5.63604C3.94821 7.32387 3 9.61305 3 12Z" stroke="#888888" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <div className={s.noticeContent}>
                    <span className={s.noticeText}>Стоимость доставки рассчитывается индивидуально и согласовывается с менеджером после оформления заказа.</span>
                </div>
            </div>
        </div>
    )
}

export default DeliveryTypeRadioGroup