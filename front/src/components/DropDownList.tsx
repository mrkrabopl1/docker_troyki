import React, { ReactElement, useRef, useState,memo } from 'react'

type listType = {
    children: React.ReactNode[]
    className?:string,
    active?:boolean
}

let defaultStyle = {
    
}


const DropDownList: React.FC<listType> = ({className,children,active}) => {
    return (
       <div style={active?{position:"absolute"}:{display:"none"}} className={className} >
            {
             children
            }
       </div>
    )
}

export default  memo(DropDownList)