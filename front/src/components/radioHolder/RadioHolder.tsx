import React, { ReactElement, useEffect, useRef, useState } from 'react'
import s from "./style.module.css"
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import { radioSlice } from '../../store/reducers/radioSlice'



type RadioType = {
    children: ReactElement[],
    name:string,
    className:string
}


const RadioHolder: React.FC<RadioType> = (props) => {
    let { children,name,className } = { ...props }
    let dispatch = useAppDispatch()
    let { setChosen } = { ...radioSlice.actions }
    return (
        <div  className={className} >
            {children.map( (child,id) => {
                if(child.props.active !== undefined){
                   
                    return <div onClick={()=>dispatch(setChosen({namespace:name,val:id}))}>{child}</div>
                }else{
                    return null
                }
            })}
        
        </div>
    )
}

export default RadioHolder