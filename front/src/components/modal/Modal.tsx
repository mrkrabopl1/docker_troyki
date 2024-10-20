import React, {SetStateAction,Dispatch,useEffect, memo } from 'react';
import s from "./style.module.css"
import { setGlobalScroller } from 'src/global';

interface ModalProps {
    active: boolean
    onChange: (data:boolean)=>void
    children:any

}

const Modal: React.FC<ModalProps> = ({active, onChange,children}) => {
    setGlobalScroller(active)
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
            onClick={()=>onChange(!active)}>
           {children}
        </div>
    )
}

function arePropsEqual(oldProps:any, newProps:any) {

    return (oldProps.active==newProps.active)
}

export default memo(Modal,arePropsEqual)