import React, { useRef, useState } from "react"
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import { userSlice } from 'src/store/reducers/userSlice'
import s from "./style.module.css"
import loop from "../../../public/zoom.svg"

type iconType = {
    images: string[],
    onClose:()=>void
}
const ExpandedImagePresentation: React.FC<iconType> = (data) => {
    const { images, onClose } = { ...data }
    let windowHeight = useRef(window.innerHeight)
    console.log(windowHeight)

    return (
        <div className={s.expandingElement}>
            {images.map(val=>{
                 return <img onClick={onClose} className="tt" style={{objectFit: "contain",width:"100%", height:"100%",display:"block" }} src={'/'+val} alt="" />
            })}
        </div>
    )
}

export default ExpandedImagePresentation