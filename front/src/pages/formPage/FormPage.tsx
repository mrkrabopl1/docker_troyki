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
import DeliveryRadioGroup from './pageElements/DeliveryRadio';
import Button from 'src/components/Button';
import DeliveryTypeRadioGroup from './pageElements/DeliveryTypeRadio';
import DeliveryPage from './pageElements/DeliveryPage';
import PayBlock from './pageElements/PayBlock';

interface merchInterface { name: string, img: string, id: string, firm: string, price: string, count: number }
type urlParamsType = {
    hash: string;
};


const BUY_ROUTE = [
    [
        "Перейти к доставке",
        "Перейти к оплате",
        "Завершить заказ"
    ],
    [
        "Перейти к оплате",
        "Завершить заказ"
    ]
]

const BACK_ROUTE = [
    [
        "Вернуться к экрану с информацией",
        "Вернуться к доставке"
    ],
    [
        "Вернуться к экрану с информацией"
    ]
]

const FormPage: React.FC = () => {
    const navigate = useNavigate();
    let { hash } = useParams<urlParamsType>();
    let [snickers, setSnickers] = useState<any>({
        cartData: [],
        fullPrice: ""
    })
    let delivery = useRef(0)
    let formId = useRef(0)
    let memoSendForm = useRef<boolean>(true)
    let respData = useRef<any>({})
    let validSendForm = useRef(false)
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

    const getForm = () => {
        switch (formId.current) {
            case 0:
                if (!delivery.current) {
                    return <SendForm
                        memo={memoSendForm.current}
                        valid={true}
                        formValue={
                            formData.current
                        }
                        onValid={(valid) => {
                            validSendForm.current = valid;
                        }}

                        onChange={(data: any) => {
                            formData.current.name = data.name
                            formData.current.secondName = data.secondName
                            formData.current.address = { ...data.address }
                            formData.current.phone = data.phone
                            formData.current.mail = data.mail

                            respData.current = {

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
                        }} className={{ input: s.formInput, combobox: s.combobox }} />
                }
            case 1:
                return <DeliveryPage address={formData.current.address} contactInfo={formData.current.mail} onChange={() => { }} />
            case 2:
                return <PayBlock address={formData.current.address} contactInfo={formData.current.mail} onChange={() => { }} />    

        }
    }

    const getFullForm = () => {
        switch (formId.current) {
            case 0:
                return <div>
                    <h2>
                        Способ доставки
                    </h2>
                    <DeliveryRadioGroup onChange={(data) => {
                        delivery.current = data
                        setRefresh(prev => !prev)
                    }} />
                    {getForm()}
                </div>
            case 1:
                return <div>
                    {getForm()}
                </div>
        }
    }

    return (
        <div className='dependFlex'>
            <div className={s.fieldHolder}>
                {
                    getFullForm()
                }

                <div className={s.buttonHolder}>
                    {formId.current ? <Button className={s.backBtn} text={BACK_ROUTE[delivery.current][formId.current]} onChange={() => {
                        if (formId.current === 0) return
                        formId.current = formId.current - 1
                        setRefresh(prev => !prev)
                    }} /> : null}
                    <Button className={"btnStyle " + s.mainButton} text={BUY_ROUTE[delivery.current][formId.current]} onChange={() => {
                        if (formId.current === BUY_ROUTE[delivery.current].length - 1) {
                            createOrder(respData.current, (data) => {
                                navigate('/order/' + data.hash)
                            })
                        } else {
                            if (validSendForm.current) {
                                formId.current = formId.current + 1
                            } else {
                                memoSendForm.current = !memoSendForm.current
                            }
                        }
                        setRefresh(prev => !prev)
                    }} />
                </div>

            </div>
            <div style={{ paddingRight: "90px" }}>
                <BuyMerchField data={snickers} />
            </div>
        </div>

    )
}


export default FormPage