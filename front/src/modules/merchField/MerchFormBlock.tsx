import React, { ReactElement, useEffect, useRef, useState, memo } from 'react'
import MerchBlock from "./MerchBlock"
import s from "./style.module.css"
import { useNavigate } from 'react-router-dom';
import { toPrice } from 'src/global';
import { ReactComponent as Bin } from "../../../public/bin.svg";


interface merchInterface { name: string, img: string, id: string, firm: string, price: number, quantity: number, size: number }

const MerchFormBlock: React.FC<{ data: merchInterface, onChange: () => void }> = (props) => {
    let { data, onChange } = { ...props }
    const navigate = useNavigate();
    return (
        <div style={{ display: "flex" }}>
            <div style={{ width: "100%" }} onClick={() => navigate('/product/' + data.id)} className={s.merchLine + " flex"}>
                <img className={s.buyImg} style={{ height: "", width: "15%", flexShrink: 0 }} src={"/" + data.img} alt="" />
                <div className={s.merchCount}>
                    <span className='vrtCntr'>
                        {data.quantity}
                    </span>
                </div>
                <div style={{ width: "100%" }} className='vrtCntr'>
                    <p style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>
                            {data.name}
                        </span>
                        <span className={s.littlePrice}>
                            {toPrice(data.price)}
                        </span>
                    </p>
                    {data.size ?
                        <p>
                            US:{data.size}
                        </p> : null
                    }
                </div>
            </div>

        </div>
    )
}


export default memo(MerchFormBlock)