import React, { useEffect, ReactElement, useState, useRef, memo } from 'react'

import MerchSliderField from '../../modules/merchField/MerchSliderField'
import { getMainInfo } from "src/providers/merchProvider"
import { useAppSelector } from 'src/store/hooks/redux'
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import {verifyEmail} from 'src/providers/userProvider'
import BuyMerchField from 'src/modules/buyMerchField/BuyMerchField';
type urlParamsType = {
    verHash: string;
};
const Verification: React.FC<any> = () => { 
    let { verHash } = useParams<urlParamsType>();

    let [snickers, setSnickers] = useState<any>([])
    useEffect(() => {
        verifyEmail(verHash, setSnickers)
    }, [])
    return (

        <div>
            <BuyMerchField data={snickers} />
        </div>


    )
}


function arePropsEqual(oldProps: any, newProps: any) {

    return (oldProps.memo == newProps.memo)
}

export default memo(Verification, arePropsEqual)