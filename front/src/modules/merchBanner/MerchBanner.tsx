import React, { useEffect, ReactElement, useState, useRef } from 'react'

import ComplexDrop from "src/components/complexDrop/ComplexDrop"
import { getMainInfo } from "src/providers/merchProvider"
import { useAppSelector } from 'src/store/hooks/redux'
import s from "./style.module.css"
import Button from 'src/components/Button'
import { useNavigate } from 'react-router-dom';


interface   merchBannerInterface  {
    img:string,
    title:string,
    className?:{
        button?:string,
        title?:string,
        main?:string,
        contentHolder?:string
    },
    id:string,
    btnText:string,
    onChange:(arg:string)=>void
}

const MerchBanner: React.FC< merchBannerInterface> = (props) => {
    let {id,img,title,onChange,className,btnText} = {...props}
    const onChangeButton = ()=>{
        onChange(id)
    }
  
    return (

        <div className={className?className.main?className.main:s.main:s.main} style = {{display:"flex"}}>
            <img className={"fs"} src= {img} alt="" />
            <div className={className?className.contentHolder?className.contentHolder:s.contentHolder:s.contentHolder} style={{display:"flex", margin:"auto", position:"absolute"}}>
                <p className={s.title}>{title}</p>
                <Button className={className?className.button?className.button:s.buton:s.buton} onChange={onChangeButton} text={btnText}></Button>
            </div>
        </div>
   
  
    )
  }
  
  export default MerchBanner