import React, {SetStateAction,Dispatch,useEffect } from 'react';
import s from "./style.module.css"

interface ModalProps {
    active: boolean
    onChange: (data:boolean)=>void

}

const Modal: React.FC<ModalProps> = ({active, onChange,children}) => {
    if(active){
        document.body.style.overflow = 'hidden';
    }else{
        document.body.style.overflow = 'unset';
    }
    useEffect(()=>{
        return()=>{
         console.debug("exit")
        }
     },[])
    return (
        <div  
            key={new Date().getTime()}
            onWheel={(e)=>{
                e.stopPropagation()
            }} 
            className={active?s.modalBack:s.none}
            onClick={()=>onChange(false)}>
           {children}
        </div>
    )
}

export default Modal