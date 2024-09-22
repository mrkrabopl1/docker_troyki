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

interface merchInterface { name: string, img: string, id: string, firm: string, price: string, count: number }
type urlParamsType = {
    hash: string;
};

const OrderPage: React.FC = () => {
    let { hash } = useParams<urlParamsType>();
    let [snickers, setSnickers] = useState<any>({
        cartData: [],
        fullPrice: ""
    })
    let [order,setOrder]= useState<any>({
        name: "",
        secondName: "",
        address:{
            town: "",
            region: "",
            home: "",
            flat: "",
            street: "",
        },
        mail: "",
        phone: "",
        price: "",
        orderId: "",
        index: "",
    })
    let memoSendForm = useRef<boolean>(true)
    let fullPrice = useRef<number>(0)

    let [refresh, setRefresh] = useState<boolean>(true)
    useEffect(() => {
        // getCartData(hash, (data) => {
        //     fullPrice.current = data.fullPrice;
        //     setSnickers(data)
        // })
        getOrderDataByHash(hash, (data) => {
            setSnickers(data.cartResponse)
            setOrder(data.userInfo)
        })
    }, [])

    return (
        <div style={{ display: "flex" }}>
            <OrderInfo
                orderData={order}
            />

            <BuyMerchField data={snickers} />
        </div>

    )
}


export default OrderPage