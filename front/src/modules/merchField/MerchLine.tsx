import React, { ReactElement, useEffect, useRef, useState } from 'react'
import MerchBlock from "./MerchBlock"
import s from "./style.module.css"
import { useNavigate } from 'react-router-dom';
import global from "src/global.css"


interface merchInterface { name: string, img: string,id:string,firm:string,price:string }

const MerchLine: React.FC<{ data: merchInterface}> = (props) => {
    let { data } = { ...props }
    const navigate = useNavigate();
    return (
        <div onClick={()=>navigate('/product/' + data.id)} className={s.merchLine}>
             <img className={s.img} style={{width:"30%" ,flexShrink:0 }} src={data.img} alt="" />
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
    )
}


export default MerchLine