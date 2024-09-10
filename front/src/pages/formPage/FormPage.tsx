import React, { ReactElement, useEffect, useRef, useState } from 'react'
import SendForm from "src/modules/sendForm/SendForm"
import { getCartData } from 'src/providers/shopProvider'
import { useParams } from 'react-router-dom';
import s from "./style.module.css"
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux'
import BuyMerchField from 'src/modules/buyMerchField/BuyMerchField'
import { createOrder } from 'src/providers/orderProvider';
import { checkCustomerData } from 'src/providers/userProvider';

interface merchInterface { name: string, img: string, id: string, firm: string, price: string, count: number }
type urlParamsType = {
    hash: string;
};

const FormPage: React.FC = () => {
    let { hash } = useParams<urlParamsType>();
    let [snickers, setSnickers] = useState<any>([])
    let memoSendForm = useRef<boolean>(true)
    let [formData, setFormData] = useState<any>({
        name: "",
        mail: "",
        address: {
            town: "",
            region: "",
            index: "",
            street: "",
            house: "",
            flat: "",
        },
        phone: ""
    })
    useEffect(() => {
        getCartData(hash, setSnickers)
        checkCustomerData((data)=>{
            if(data){
                memoSendForm.current = !memoSendForm.current
                setFormData(data)
            }
        })
    }, [])
    return (
        <div style={{ display: "flex" }}>
            <SendForm
                memo={memoSendForm.current}
                valid={true}
                formValue={
                    formData
                }

                onChange={(data: any) => {
                    let respData = {
                        preorderId: hash,
                        personalData: {
                            name: data.name,
                            phone: data.phone,
                            mail: data.mail,
                            secondName: data.secondName ? data.secondName : ""
                        },
                        address: {
                            ...data.address
                        },
                        save:data.save,
                        delivery: {
                            deliveryPrice: 0,
                            type: 1
                        },

                    }
                    // createOrder(respData, () => {
                    //     console.debug(data)
                    // })
                }} className={{ input: s.formInput, combobox: s.combobox }} />
            <BuyMerchField data={snickers} />
        </div>

    )
}


export default FormPage