import React, { ReactElement, useEffect, useRef, useState,memo } from 'react'
import MerchBlock from "./MerchBlock"
import s from "./style.module.css"
import { useRouter } from 'next/router';


interface merchInterface { name: string, imgs: string, id: string, firm: string, price: string }

const MerchBuyBlock: React.FC<{ data: merchInterface, onChange: () => void }> = (props) => {
    const router = useRouter();
    let { data, onChange } = { ...props }
    return (
        <div style={{ width: "100%" }} onClick={() => router.push('/product/' + data.id)} className={s.merchBuyLine + " flex"}>
            <img className={s.buyImg} style={{ height: "", width: "30%", flexShrink: 0 }} src={data.imgs} alt="" />
            <div className='vrtCntr'>
                <p>
                    {data.firm}
                </p>
                <p className={s.merchName}>
                    {data.name}
                </p>
                <p>
                    Size US: {data.price}
                </p>
            </div>
        </div>
    )
}


export default memo(MerchBuyBlock)