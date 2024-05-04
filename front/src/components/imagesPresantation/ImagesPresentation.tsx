import React ,{useRef, useState} from "react"
import { useAppSelector,useAppDispatch } from 'src/store/hooks/redux'
import {userSlice } from 'src/store/reducers/userSlice'
import s from "./style.module.css"
import loop from "../../../public/zoom.svg"
import ImagePresantationBlock from "./ImagePresentationBlock"
import ExpandedImagePresentation from "./ExpandedImagePresentation"

type iconType = {
    images:string[]
}
const ImagePresantation:React.FC<iconType>=(data)=>{

    const presentationRef = useRef<HTMLDivElement>(null)
    const {images}={...data}
    let [expand, setExpand] = useState<Boolean>(false)
    let firstImage = images[0]
    return(
            <div ref={presentationRef} className={s.imgCompponentWrap}>
                {expand? <ExpandedImagePresentation images={images}/>:null}
                <ImagePresantationBlock image={firstImage}/>
                <div className={s.bottomFlexBlock}>
                    {images.map((val, index)=>{
                        return   <div key={index} onClick={()=>{
                            setExpand(true)
                        }} style={{height:"100%"}}>
                            <ImagePresantationBlock image={val}/>
                        </div>
                    })}
                </div>
            </div>
    )
}

export default ImagePresantation