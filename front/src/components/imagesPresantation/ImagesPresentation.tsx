import React ,{useRef, useState, useCallback,  memo, useEffect } from "react"
import { useAppSelector,useAppDispatch } from 'src/store/hooks/redux'
import {userSlice } from 'src/store/reducers/userSlice'
import s from "./style.module.css"
import loop from "../../../public/zoom.svg"
import ImagePresantationBlock from "./ImagePresentationBlock"
import ExpandedImagePresentation from "./ExpandedImagePresentation"
import {isDeepEqual} from 'src/global'
type iconType = {
    images:string[]
}
const ImagePresantation:React.FC<iconType>=(data)=>{

    const presentationRef = useRef<HTMLDivElement>(null)
    const {images}={...data}
    const [mainImage, setMainImage] = useState<string>(images[0]);
    let [isExpand, setExpand] = useState<Boolean>(false)

    const handleThumbnailLeave = useCallback(() => {
        setMainImage(images[0]);
      }, [images])
    useEffect(()=>{
        setMainImage(images[0])
    }, [images]) 
    return(
            <div ref={presentationRef} className={s.imgCompponentWrap}>
                {isExpand? <ExpandedImagePresentation onClose={()=>setExpand(false)} images={images}/>:null}
                <ImagePresantationBlock  onClick={()=>{setExpand(true)}} image={mainImage}/>
                <div className={s.bottomFlexBlock}>
                    {images.slice(1).map((val, index)=>{
                        return   <div key={index}  style={{height:"100%"}}>
                            <ImagePresantationBlock onOut = {handleThumbnailLeave} onClick={()=>{setExpand(true)}} onHover={setMainImage} image={val}/>
                        </div>
                    })}
                </div>
            </div>
    )
}

function checkMemo(oldData: any, newData: any) {
    return (isDeepEqual(oldData.images, newData.images))
  }
  

export default  memo(ImagePresantation,checkMemo)