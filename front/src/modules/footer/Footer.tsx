import React, { ReactElement, useEffect, useRef, useState } from 'react'
import SearchWithList from '../searchWithList/SearchWithList'
import Modal from 'src/components/modal/Modal'
import ColumnWithChilds from 'src/components/table/simpleTable/ColumnWithChilds'
import s from "./style.module.css"
import global from "src/global.css"
import { NavLink } from 'react-router-dom'
type propsRowType = {
    data: any,
    callback: (...args: any) => void | null
}

const Footer: React.FC<any> = (props) => {

    let aboutUsArr = [
       <NavLink className={({ isActive, isPending }) =>isPending ? s.link_active : isActive ? s.link_active :  s.link}  to="/way_to_pay">Способы оплаты</NavLink >,
       <NavLink className={({ isActive, isPending }) =>isPending ? s.link_active : isActive ? s.link_active :  s.link}   to="/delivery">Доставка и самовывоз </NavLink > , 
       <NavLink className={({ isActive, isPending }) =>isPending ? "pending" : isActive ? s.link_active :  s.link}   to="/faq">Частые вопросы </NavLink >  
    ]

    let policyArr = [
        <NavLink className={({ isActive, isPending }) =>isPending ? s.link_active : isActive ? s.link_active :  s.link}  to="/refund-policy">Обмен и возврат</NavLink >,
        <NavLink className={({ isActive, isPending }) =>isPending ? s.link_active : isActive ? s.link_active :  s.link}   to="/privacy-policy">Политика конфиденциальности </NavLink > , 
        <NavLink className={({ isActive, isPending }) =>isPending ? s.link_active : isActive ? s.link_active :  s.link}   to="/faq">Условия предоставления услуг </NavLink >  
     ]
     let clientHelpArr = [
        <div>
            <div>
                mail
            </div>
            <div>
                phon
            </div>
        </div>,
        <div>Звонки принимаются ежедневно 
        с 10:00 до 22:00 по МСК.</div> , 
     ]
    return (
        <div  style={{display:"flex",width:"100%", justifyContent:"space-between"}}>
            <ColumnWithChilds header={"ПОМОЩЬ"} rows={ aboutUsArr} />
            <ColumnWithChilds header={"Политики и условия"} rows={policyArr} />
            <ColumnWithChilds header={"Служба клиентской поддержки"} rows={clientHelpArr} />
        </div>

    )
}


export default Footer