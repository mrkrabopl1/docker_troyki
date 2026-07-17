import React, { useEffect, ReactElement, useState, useRef,memo } from 'react'
import s from "./style.module.css"



interface   MerchBannerInterface  {
    img:string,
    title:string,
    className?:{
        button?:string,
        title?:string,
        main?:string,
        contentHolder?:string
    },
    btnText:string,
    onChange:(e: React.MouseEvent)=>void
}

const MerchBanner: React.FC<MerchBannerInterface> = ({img,title,onChange,className,btnText}) => {
    return (

        <div onClick={onChange} className={className?className.main?className.main:s.main:s.main} style = {{display:"flex",cursor:"pointer", position:"relative"}}>
            <img className={"fs"} onLoad={()=>{
                
            }} src= {img} alt="" />
            {/* <div className={className?className.contentHolder?className.contentHolder:s.contentHolder:s.contentHolder} style={{display:"flex", margin:"auto", position:"absolute"}}>
                <p className={s.title}>{title}</p>
                <Button className={className?className.button?className.button:s.buton:s.buton} onClick={onChange} text={btnText}></Button>
            </div> */}
        </div>
   
  
    )
  }
  
  export default memo(MerchBanner)