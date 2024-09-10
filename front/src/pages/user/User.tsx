import React, {Suspense, useEffect, ReactElement, useState, useRef, memo ,lazy} from 'react'


import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import {getUserData} from 'src/providers/userProvider'
import BuyMerchField from 'src/modules/buyMerchField/BuyMerchField';
import Input from 'src/components/input/Input';
import PhoneInputWithValidation from 'src/components/input/PhoneInputWithValidation';
import Button from 'src/components/Button';
import UserForm from 'src/modules/sendForm/UserForm';
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import { unlogin } from 'src/providers/userProvider';
import { verified } from 'src/store/reducers/menuSlice'
const AddressForm = lazy(() => import('src/modules/sendForm/AddressForm'))

import s from "./s.module.css"
type urlParamsType = {
    login: string;
};

type userValType = {
    name:string,
    secondName:string,
    mail:string,
    address:string,
    phone:string
}


const User: React.FC<any> = () => { 
    let { login } = useParams<urlParamsType>();
    let dispatch = useAppDispatch()
    const navigate = useNavigate()

    let [tab,setTab] = useState<number>(0)

    let [snickers, setSnickers] = useState<any>([])
    let [redact, setRedact] = useState<boolean>(false)
    let [userVal, setUserVal] = useState<userValType>({
        name:"",
        secondName:"",
        mail:"",
        address:"",
        phone:""
    }
    )
    useEffect(() => {
        getUserData((data)=>{
            if(data){
                setUserVal(Object.assign(userVal,data))
            }else{
                navigate("/main")
            }
        })
    }, [])
    return (
        <div className={s.main}>

            <div className={s.tabs}>
                <div onClick={()=>{setTab(0)}}>
                    Инфо
                </div>
                <div onClick={()=>{setTab(1)}}>
                    Аддрес
                </div>
                <div onClick={()=>{setTab(1)}}>
                    История покупок
                </div>
                <div onClick={()=>{
                    unlogin(()=>{
                        navigate("/")
                        dispatch(verified(false))
                    })
                }}>
                    Выход
                </div>

            </div>
            <div className={s.pages}>
                { tab === 0 && <UserForm onChange={()=>{}}/>}
                { tab === 1 &&
                    <Suspense fallback={<div></div>}>
                    <AddressForm valid= {true} className={{}} onChange = {()=>{}}/>
                  </Suspense>
                }
            </div>
        </div>
    )
}


function arePropsEqual(oldProps: any, newProps: any) {

    return (oldProps.memo == newProps.memo)
}

export default memo(User, arePropsEqual)