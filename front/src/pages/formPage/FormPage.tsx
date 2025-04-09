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

interface merchInterface { name: string, img: string, id: string, firm: string, price: string, count: number }
type urlParamsType = {
    hash: string;
};

const FormPage: React.FC = () => {
    const navigate = useNavigate();
    let { hash } = useParams<urlParamsType>();
    let [snickers, setSnickers] = useState<any>({
        cartData: [],
        fullPrice: ""
    })
    let memoSendForm = useRef<boolean>(true)
    let fullPrice = useRef<number>(0)
    let [inProgrees, setInProgress] = useState(true)

    let [refresh, setRefresh] = useState<boolean>(true)
    let formData = useRef<any>({
        name: "",
        mail: "",
        secondName: "",
        address: null,
        phone: ""
    })
    useEffect(() => {
        getCartData((data) => {
            fullPrice.current = data.fullPrice;
            setSnickers(data)
            checkCustomerData((data) => {
                if (data) {
                    memoSendForm.current = !memoSendForm.current
                    formData.current = data
                    setRefresh(!refresh)
                    setInProgress(true)
                }
            })
        })
    }, [])

    return (
        <div className='dependFlex'>
            <SendForm
                memo={memoSendForm.current}
                valid={true}
                formValue={
                    formData.current
                }

                onChange={(data: any) => {
                    formData.current.name = data.name
                    formData.current.secondName = data.secondName
                    formData.current.address = { ...data.address }
                    formData.current.phone = data.phone
                    formData.current.mail = data.mail

                    let respData = {

                        personalData: {
                            name: data.name,
                            phone: data.phone,
                            mail: data.mail,
                            secondName: data.secondName ? data.secondName : ""
                        },
                        address: {
                            ...data.address
                        },
                        save: data.save,
                        delivery: {
                            deliveryPrice: 0,
                            type: 1
                        },
                        preorderHash: hash

                    }
                    createOrder(respData, (data) => {
                        navigate('/order/' + data.hash)
                    })
                }} className={{ input: s.formInput, combobox: s.combobox }} />
            <div style={{paddingRight:"90px"}}>
                <BuyMerchField data={snickers} />
            </div>
        </div>

    )
}


export default FormPage