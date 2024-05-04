import React, { ReactElement, useRef, useState } from 'react'
import s from "./style.module.css"

type sortedType = {
    index: number,
    direction: boolean
}






const ColumnHeader: React.FC= (props) => {
    let {children} = { ...props }
    return (
        <div  style={{position:"fixed", top:0}}>

            {children}

        </div>

    )
}

export default ColumnHeader