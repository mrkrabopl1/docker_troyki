import React, { useEffect, ReactElement, useState, useRef, memo } from 'react'

import MerchSliderField from '../../modules/merchField/MerchSliderField'
import { getMainInfo } from "src/providers/merchProvider"
import { useAppSelector } from 'src/store/hooks/redux'
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import {getUserData} from 'src/providers/userProvider'
import BuyMerchField from 'src/modules/buyMerchField/BuyMerchField';
import Input from 'src/components/input/Input';
import PhoneInputWithValidation from 'src/components/input/PhoneInputWithValidation';
import Button from 'src/components/Button';
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
    const navigate = useNavigate()
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
        <div>
            <div>
            <Input val={userVal.name} onChange={(name)=>{
                    userVal.name = name
                    setUserVal(userVal)
                }}/>
                 <Input val={userVal.secondName} onChange={(secondName)=>{
                    userVal.secondName = secondName
                    setUserVal(userVal)
                }}/>
                <PhoneInputWithValidation invalidIncorrect='Неверный формат номера' invalidEmpty='' valid={true} val={userVal.phone} onChange={(phone)=>{
                    userVal.phone = phone
                    setUserVal(userVal)
                }}/>
            </div>
            <Button text='Сохранить данные.' onChange={()=>{

            }} />
            <BuyMerchField data={snickers} />
        </div>
    )
}


function arePropsEqual(oldProps: any, newProps: any) {

    return (oldProps.memo == newProps.memo)
}

export default memo(User, arePropsEqual)