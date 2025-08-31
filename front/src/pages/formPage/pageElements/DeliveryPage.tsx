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
import ContactInfo from './ContactInfo';
import MapComponent from 'src/modules/map/Map';

interface merchInterface { name: string, img: string, id: string, firm: string, price: string, count: number }
type urlParamsType = {
    address: any;
    contactInfo: any,
    onChange: (data: any) => void,
    onChangeInfo: (info: any) => void
    coords:[number,number]
};

const DeliveryPage: React.FC<urlParamsType> = (props) => {
    let {coords, address, contactInfo, onChange,onChangeInfo } = { ...props };
    let [co,setCo]= useState(coords);

    const createDataField = useCallback((header,entries) => {
        let data = entries.map((data) => { return { "caption": data[0], "description": data[1] } })
        return <DataField header={header} data={data} />

    }, [contactInfo])



    return (
        <div>
            <MapComponent location = {coords}/>
            <ContactInfo address={address} contactInfo={contactInfo} onChange={onChangeInfo} />
            <DeliveryTypeRadioGroup onChange={onChange} />
        </div>

    )
}


export default DeliveryPage