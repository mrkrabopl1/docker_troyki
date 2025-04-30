import React, { ReactElement, useEffect, useRef, useState } from 'react'
import SendForm from "src/modules/sendForm/SendForm"
import { getCartData } from 'src/providers/shopProvider'
import { useParams } from 'react-router-dom';
import s from "./style.module.css"
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux'
import BuyMerchField from 'src/modules/buyMerchField/BuyMerchField'
import { createOrder, getOrderDataByHash } from 'src/providers/orderProvider';
import { checkCustomerData } from 'src/providers/userProvider';
import OrderInfo from 'src/components/orderInfo/orderInfo';
import MailInputWithValidation from 'src/components/input/MailInputWithValidation';
import { setSnickers } from 'src/store/reducers/formSlice';
import { useNavigate } from 'react-router-dom';
import DeliveryTypeRadioGroup from './DeliveryTypeRadio';

interface merchInterface { name: string, img: string, id: string, firm: string, price: string, count: number }
type urlParamsType = {
    address: any;
    contactInfo:any,
    onChange:()=>void
};

const PayBlock: React.FC<urlParamsType> = (props) => {
    let { address, contactInfo, onChange } = {...props};
    return (
        <div>
            <div>
                <span>
                    Контактная информация
                </span>
                <span>
                   {contactInfo}
                </span>
            </div>
            {
                address? <div>
                
                <span>
                        Платеж
                </span>
            
                </div>:null
            }
           
            

        </div>

    )
}


export default PayBlock