import React, { ReactElement, useEffect, useRef, useState } from 'react'
import MerchBlock from "./MerchBlock"
import s from "./style.module.css"
import { useNavigate } from 'react-router-dom';
import global from "src/global.css"
import {ReactComponent as Bin} from "../../../public/bin.svg";


interface merchInterface { name: string, imgs: string, id: string, firm: string, price: string }

const MerchBuyBlock: React.FC<{ data: merchInterface,onChange:()=>void}> = (props) => {
    let { data,onChange } = { ...props }
    const navigate = useNavigate();
    return (
        <div style={{display:"flex"}}>
            <div style={{width:"100%"}} onClick={() => navigate('product/' + data.id)} className={s.merchLine}>
                <img className={s.buyImg} style={{height:"", width: "30%", flexShrink: 0 }} src={"/"+data.imgs} alt="" />
                <div>
                    <p>
                        {data.firm}
                    </p>
                    <p>
                        {data.name}
                    </p>
                    <p>
                        {data.price}
                    </p>
                </div>
            </div>
            
        </div>
    )
}


export default MerchBuyBlock