import React, { ReactElement, useEffect, useRef, useState } from 'react'
import SendForm from "src/modules/sendForm/SendForm"
import { getCartData } from 'src/providers/shopProvider'
import { useParams } from 'react-router-dom';
import s from "./style.module.css"
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux'
import BuyMerchField from 'src/modules/buyMerchField/BuyMerchField'
import DataField from 'src/components/dataField/DataField';


interface merchInterface { name: string, img: string, id: string, firm: string, price: string, count: number }
type urlParamsType = {
    hash: string;
};

const FinalPage: React.FC = () => {
    let { hash } = useParams<urlParamsType>();
    let [snickers,setSnickers] = useState<any>([])
    useEffect(() => {
        getCartData(hash, setSnickers)
    }, [])
    return (
        <div style={{ display: "flex" }}>
            <DataField data={[]} header={"данные заказа"}/>
            <BuyMerchField data={snickers} />
        </div>

    )
}


export default FinalPage