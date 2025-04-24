import React, { ReactElement, useEffect, useRef, useState } from 'react'
import MerchBlock from "./MerchBlock"
import s from "./style.module.css"



interface merchInterface { name: string, img: string, id: string, firm: string, price: string, onChange:(val)=>void }

const MerchLine: React.FC<{ data: merchInterface }> = (props) => {
    let { data } = { ...props }
    return (
        <div onMouseDown={(e)=>{e.preventDefault()}} onClick={() => {
            data.onChange(data.id)
        }} className={s.merchLine}>
            <img className={s.img} style={{ width: "30%", flexShrink: 0 }} src={"/" + data.img} alt="" />
            <div>
                <p>
                    {data.firm.toUpperCase()}
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