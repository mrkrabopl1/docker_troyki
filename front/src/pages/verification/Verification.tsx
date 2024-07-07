import React, { useEffect, ReactElement, useState, useRef, memo } from 'react'

import MerchSliderField from '../../modules/merchField/MerchSliderField'
import { getMainInfo } from "src/providers/merchProvider"
import { useAppSelector } from 'src/store/hooks/redux'
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import {verifyEmail} from 'src/providers/userProvider'
import BuyMerchField from 'src/modules/buyMerchField/BuyMerchField';
import { useAppDispatch } from 'src/store/hooks/redux';
import { verified } from 'src/store/reducers/menuSlice'
type urlParamsType = {
    verHash: string;
};
const Verification: React.FC<any> = () => { 
    let { verHash } = useParams<urlParamsType>();
    const navigate = useNavigate();
    let dispatch = useAppDispatch()

    let [info, setInfo] = useState("")
    useEffect(() => {
       verifyEmail(verHash,(data)=>{
        if(data){
            dispatch(verified(true))
            navigate("/main");
        }
        else{
            setInfo("Ваш код верификации истек повторите попытку еще раз.")
        }
       })


    }, [])
    return (
        <div>
            {info}
        </div>

    )
}


function arePropsEqual(oldProps: any, newProps: any) {

    return (oldProps.memo == newProps.memo)
}

export default memo(Verification, arePropsEqual)