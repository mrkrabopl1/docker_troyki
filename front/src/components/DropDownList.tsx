import React, { ReactElement, useRef, useState } from 'react'

type listType = {
    children: React.ReactNode[]
    className?:string,
    active?:boolean
}

let defaultStyle = {
    
}


const DropDownList: React.FC<listType> = (props) => {

    let {className,children,active} = {...props}
    return (
       <div style={active?{position:"absolute"}:{display:"none"}} className={className} >
            {
             children
            }
       </div>
    )
}

export default DropDownList