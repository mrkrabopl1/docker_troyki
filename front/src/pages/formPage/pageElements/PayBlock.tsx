import React, { ReactElement, useEffect, useRef, useState } from 'react'
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
import ContactInfo from './ContactInfo';
import Checkbox from 'src/components/checkbox/Checkbox';

interface merchInterface { name: string, img: string, id: string, firm: string, price: string, count: number }
type urlParamsType = {
    address: any;
    contactInfo:any,
    onChange:(data:any)=>void,
    deliveryInfo:any
};

const PayBlock: React.FC<urlParamsType> = (props) => {
    let { address, contactInfo, onChange, deliveryInfo } = {...props};
    return (
        <div>
             <ContactInfo address={address} contactInfo={contactInfo} deliveryInfo={deliveryInfo} onChange={()=>{}} />
            <p className={s.payHeader}>Платеж</p>
            <p className={s.descr}>Все транзакции защищены</p>
            <div className={s.payHolder}>Перевод</div>
            <p className={s.payHeader}>Адрес выставления счета</p>
            <p>Выберите адрес, соответствующий вашей карте или способу оплаты.</p>
            <div className={s.payHolder}>Перевод</div>
            <div>
                <Checkbox activeData={false} enable={true} onChange={(data)=>{
                    onChange(data)
                }}/>
            </div>
        </div>


    )
}


export default PayBlock