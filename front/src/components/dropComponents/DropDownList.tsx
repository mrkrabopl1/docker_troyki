import React, { memo } from 'react'
import s from './style.module.css'

type listType = {
    children: React.ReactNode[]
    className?: string,
    active?: boolean
}

const DropDownList: React.FC<listType> = ({ children, active }) => {
 
    return (
       <div style={active?{}:{display:"none"}}  className={s.dropList}>
            {children}
       </div>
    )
}

export default memo(DropDownList)