import React, { ReactElement, useRef,useEffect, useState } from 'react'
import { useAppSelector } from 'src/store/hooks/redux'
import s from "./style.module.css"
type propsRowType = {
    className?:string,
    children :[ReactElement,ReactElement],
    id:string
}



const DropWrapper: React.FC<propsRowType> = (props) => {
    let {className,children,id} = {...props}
    const data = useAppSelector(state =>state.secondDropReducer)
    return (
        <div style={{height:"100%",position:"relative",overflow: "hidden"}}  >
               {children[0]}
               {data.show? <div className={s.secondPage} style={data.show?{left:0}:{left:"100%"}}>
                {children[1]}
               </div>:null}
        </div>
    )
}

export default DropWrapper