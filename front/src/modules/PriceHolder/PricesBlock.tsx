import React, { memo } from 'react'
import s from "./style.module.css"
import doneSvg from "../../../public/done.svg"
import { toPrice } from 'src/global'
type merchType = {onChange:()=>void,active:boolean,size:string,price:number,availability?:boolean,discount?:number,id:number}

const PricesBlock: React.FC<merchType> = (props) => {
    let {price,size,active,availability,id,onChange,discount} = {...props}
    return (
        <div onClick={onChange} className={s.priceBlock} >
            <div className={s.sizeHolder}>{"US "+size}</div>
            <div className={s.avelibleHolder}><div>{toPrice(price)}</div>{availability?<img className={s.done} src={doneSvg} alt="" />:null}</div> 
            {active?<div className={s.priceUnderline}></div>:null}
            {discount?<div className={s.discountLabel}></div>:null}
        </div>
            
    )
}

export default memo(PricesBlock)