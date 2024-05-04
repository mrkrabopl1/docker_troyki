import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { userSlice } from 'src/store/reducers/userSlice'
import { useAppSelector,useAppDispatch } from 'src/store/hooks/redux'
import { NavLink} from 'react-router-dom'
import LineSwitcher from 'src/components/switcher/LineSwitcher'
import s from "./style.module.css"
import loupe from "../../../public/vagabond.png";
import {ReactComponent as Cart} from "/public/cart.svg";
import global from "src/global.css"
import { getCdekDeliveryData } from 'src/providers/cdek'
const DeliveryInfo: React.FC<any> = (props) => {
    useEffect(()=>{
        getCdekDeliveryData({},()=>{})
    })
    return(
        <div style={{display:"flex"}}>
           
        </div>
    )
}


export default DeliveryInfo