import React, { useRef, useState } from "react"
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import { userSlice } from 'src/store/reducers/userSlice'
import s from "./style.module.css"
import loop from "../../../public/zoom.svg"

type iconType = {
    image: string,
    onClick?:()=>void,
    onHover?:(param:string)=>void,
    onOut?:()=>void,
}
const ImagePresantationBlock: React.FC<iconType> = (data) => {
    const { image, onClick, onHover, onOut} = { ...data }
    let [hover,setHover] = useState<Boolean>(false)

    return (
        <div  onClick={()=>{onClick()}} style={{height:"100%"}}  onMouseOut={() => {setHover(false); onOut  && onOut()  }} onMouseOver={() => {setHover(true); onHover && onHover(image)}}>
            <img loading={"lazy"} onMouseDown={(e)=>{
                    e.preventDefault();
                }} style={{display:hover?"block":"none"}} className={s.loop} src={loop} alt="React Logo" />
            <img loading={"lazy"} onMouseDown={(e)=>{
                    e.preventDefault();
                }} style={{objectFit: "contain",width:"100%", height:"100%" }} src={"/"+image} alt="" />
        </div>
    )
}

export default ImagePresantationBlock