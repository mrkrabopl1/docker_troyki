import React, { useEffect, ReactElement, useState, useRef,memo } from 'react'

import ComplexDrop from "src/components/complexDrop/ComplexDrop"
import { getMainInfo } from "src/providers/merchProvider"
import { useAppSelector } from 'src/store/hooks/redux'
import s from "./style.module.css"
import Button from 'src/components/Button'
import { useNavigate } from 'react-router-dom';


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

        <div className={className?className.main?className.main:s.main:s.main} style = {{display:"flex"}}>
            <img className={"fs"} src= {img} alt="" />
            <div className={className?className.contentHolder?className.contentHolder:s.contentHolder:s.contentHolder} style={{display:"flex", margin:"auto", position:"absolute"}}>
                <p className={s.title}>{title}</p>
                <Button className={className?className.button?className.button:s.buton:s.buton} onClick={onChange} text={btnText}></Button>
            </div>
        </div>
   
  
    )
  }
  
  export default memo(MerchBanner)