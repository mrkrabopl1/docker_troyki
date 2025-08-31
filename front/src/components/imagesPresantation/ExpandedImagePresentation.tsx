import React, { useRef, useState  ,memo} from "react"
import s from "./style.module.css"

type iconType = {
    images: string[],
    onClose:()=>void
}
const ExpandedImagePresentation: React.FC<iconType> = ({ images, onClose }) => {
 
  
    return (
        <div className={s.expandingElement}>
            {images.map(val=>{
                 return <img onClick={onClose} className="tt" style={{objectFit: "contain",width:"100%", height:"100%",display:"block" }} src={'/'+val} alt="" />
            })}
        </div>
    )
}

export default memo(ExpandedImagePresentation)