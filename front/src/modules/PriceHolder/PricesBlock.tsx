import React, { ReactElement, useRef, useState } from 'react'
import s from "./style.module.css"
import doneSvg from "../../../public/done.svg"

type merchType = {onChange:()=>void,active:boolean,size:string,price:number,availability?:boolean,discount?:number,id:number}




const PricesBlock: React.FC<merchType> = (props) => {
    let {price,size,active,availability,id,onChange,discount} = {...props}
    return (
        <div onClick={()=>{
                onChange()
            }} className={s.priceBlock} >
            <div className={s.sizeHolder}>{"US "+size}</div>
            <div className={s.avelibleHolder}><div>{price}</div>{availability?<img className={s.done} src={doneSvg} alt="" />:null}</div> 
            {active?<div className={s.priceUnderline}></div>:null}
            {discount?<div>test</div>:null}
        </div>
            
    )
}

export default PricesBlock