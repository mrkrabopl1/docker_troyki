import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import SendForm from "src/modules/sendForm/SendForm"
import { getCartData } from 'src/providers/shopProvider'
import { useParams } from 'react-router-dom';
import s from "../style.module.css"
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux'
import BuyMerchField from 'src/modules/buyMerchField/BuyMerchField'
import { createOrder, getOrderDataByHash } from 'src/providers/orderProvider';
import { checkCustomerData } from 'src/providers/userProvider';
import OrderInfo from 'src/components/orderInfo/orderInfo';
import MailInputWithValidation from 'src/components/input/MailInputWithValidation';
import { setSnickers } from 'src/store/reducers/formSlice';
import { useNavigate } from 'react-router-dom';
import DeliveryTypeRadioGroup from './DeliveryTypeRadio';
import DataField from 'src/components/dataField/DataField';
import Button from 'src/components/Button';

interface merchInterface { name: string, img: string, id: string, firm: string, price: string, count: number }
type urlParamsType = {
    address: any;
    contactInfo: any,
    onChange: (data: any) => void,
    deliveryInfo?: any
};

const ContactInfo: React.FC<urlParamsType> = (props) => {
    let { address, contactInfo, onChange, deliveryInfo } = { ...props };
    const createDataField = useCallback((header, entries) => {
        let data = entries.map((data) => { return { "caption": data[0], "description": data[1] } })
        return <DataField header={header} data={data} />

    }, [contactInfo])

    return (
        <div>
            {Object.values(contactInfo).join("")?<div className={s.infoBlock}>
                {createDataField("Контактная информация", Object.entries(contactInfo))}
                <Button className={s.btn} onClick={onChange} text={"Изменить"} />
            </div>:null}
            {address ?<div className={s.infoBlock}>
                 {createDataField("Адресс", Object.entries(address)) }
                <Button className={s.btn} onClick={onChange} text={"Изменить"} />
            </div>:null}
            {/* {
                deliveryInfo ?
                    <div className={s.infoBlock}>
                        {createDataField("Доставка", Object.entries(address))}
                        <Button className={s.btn} onChange={onChange} text={"Изменить"} />
                    </div> :
                    null
            } */}
        </div>

    )
}


export default ContactInfo