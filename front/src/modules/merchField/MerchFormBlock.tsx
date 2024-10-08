import React, { ReactElement, useEffect, useRef, useState } from 'react'
import MerchBlock from "./MerchBlock"
import s from "./style.module.css"
import { useNavigate } from 'react-router-dom';
import { toPrice } from 'src/global';
import {ReactComponent as Bin} from "../../../public/bin.svg";


interface merchInterface { name: string, img: string, id: string, firm: string, price: string, count:number }

const MerchFormBlock: React.FC<{ data: merchInterface,onChange:()=>void}> = (props) => {
    let { data,onChange } = { ...props }
    const navigate = useNavigate();
    return (
        <div style={{display:"flex"}}>
            <div style={{width:"100%"}} onClick={() => navigate('/product/' + data.id)} className={s.merchLine}>
                <img className={s.buyImg} style={{height:"", width: "30%", flexShrink: 0 }} src={"/"+data.img} alt="" />
                <div>{data.count}</div>
                <div>
                    <p>
                        {data.firm}
                    </p>
                    <p>
                        {data.name}
                    </p>
                    <p>
                        {toPrice(data.price)}
                    </p>
                </div>
            </div>
            
        </div>
    )
}


export default MerchFormBlock